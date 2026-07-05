import Combatant from "../models/Combatant.js";
import { DAMAGE_TYPES, getPierceRatio } from "../data/damageTypes.js";
import { analyseAttack } from "../engine/simulator.js";
import { saveState, loadState, clearState, downloadJson } from "../storage/storage.js";

const state = {
  player: new Combatant("Player"),
  boss: new Combatant("Boss"),
  activeBossAttack: 0,
  results: []
};

const el = {
  player: document.querySelector("#playerPanel"),
  boss: document.querySelector("#bossPanel"),
  results: document.querySelector("#results"),
  combatLog: document.querySelector("#combatLog"),
  histogram: document.querySelector("#histogram"),
  rollCount: document.querySelector("#rollCount"),
  showLog: document.querySelector("#showLog"),
  showHistogram: document.querySelector("#showHistogram"),
  calculate: document.querySelector("#calculateBtn"),
  roll: document.querySelector("#rollBtn"),
  save: document.querySelector("#savePresetBtn"),
  load: document.querySelector("#loadPresetBtn"),
  export: document.querySelector("#exportBtn"),
  import: document.querySelector("#importInput"),
  clear: document.querySelector("#clearBtn")
};

function options(selected) {
  return DAMAGE_TYPES.map(t => `<option value="${t.name}" ${t.name === selected ? "selected" : ""}>${t.name} (${Math.round(t.pierce * 100)}%)</option>`).join("");
}

function number(value) {
  return Math.max(0, Number(value) || 0);
}

function pct(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function renderCombatant(container, combatant, isBoss = false) {
  container.innerHTML = `
    <h2>${combatant.name}</h2>
    <div class="section-title">Defender stats</div>
    <div class="form-grid">
      <label>Health <input data-field="health" type="number" min="0" value="${combatant.health}"></label>
      <label>Armour <input data-field="armour" type="number" min="0" value="${combatant.armour}"></label>
      <label>Block Chance % <input data-field="blockChance" type="number" min="0" max="100" value="${combatant.blockChance}"></label>
      <label>Block Damage <input data-field="blockDamage" type="number" min="0" value="${combatant.blockDamage}"></label>
    </div>

    <div class="section-title">Terrain</div>
    <div class="terrain-row">
      <label class="check"><input data-terrain="highGround" type="checkbox" ${combatant.terrain.highGround ? "checked" : ""}> High Ground</label>
      <label class="check"><input data-terrain="razorWire" type="checkbox" ${combatant.terrain.razorWire ? "checked" : ""}> Razor Wire</label>
      <label class="check"><input data-terrain="trench" type="checkbox" ${combatant.terrain.trench ? "checked" : ""}> Trench</label>
    </div>

    ${isBoss ? renderTabs() : ""}
    <div class="section-title">${isBoss ? combatant.attacks[state.activeBossAttack].name : "Attack"}</div>
    ${renderAttack(isBoss ? combatant.attacks[state.activeBossAttack] : combatant.attacks[0], isBoss)}
  `;

  container.querySelectorAll("[data-field]").forEach(input => {
    input.addEventListener("input", () => {
      const key = input.dataset.field;
      combatant[key] = key.includes("Chance") ? pct(input.value) : number(input.value);
    });
  });

  container.querySelectorAll("[data-terrain]").forEach(input => {
    input.addEventListener("change", () => {
      const key = input.dataset.terrain;
      combatant.terrain[key] = input.checked;
      if (key === "trench" && input.checked) combatant.terrain.razorWire = false;
      if (key === "razorWire" && input.checked) combatant.terrain.trench = false;
      render();
    });
  });

  if (isBoss) {
    container.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeBossAttack = Number(btn.dataset.index);
        render();
      });
    });
  }

  const attack = isBoss ? combatant.attacks[state.activeBossAttack] : combatant.attacks[0];

  container.querySelectorAll("[data-attack-field]").forEach(input => {
    input.addEventListener("input", () => {
      const key = input.dataset.attackField;
      if (key === "damageType") {
        attack.damageType = input.value;
        attack.pierceRatio = getPierceRatio(input.value);
      } else if (key === "hits") {
        attack.hits = Math.max(1, Math.floor(number(input.value)));
      } else if (key.includes("Chance")) {
        attack[key] = pct(input.value);
      } else {
        attack[key] = number(input.value);
      }
    });
  });

  const enabled = container.querySelector("[data-attack-enabled]");
  if (enabled) {
    enabled.addEventListener("change", () => {
      attack.enabled = enabled.checked;
      render();
    });
  }
}

function renderTabs() {
  return `<div class="tabs">${state.boss.attacks.map((a, i) =>
    `<button class="tab ${i === state.activeBossAttack ? "active" : ""}" data-index="${i}">${a.name}</button>`
  ).join("")}</div>`;
}

function renderAttack(attack, isBoss) {
  return `
    <div class="attack-card">
      ${isBoss && attack.name !== "Attack" ? `<label class="check"><input data-attack-enabled type="checkbox" ${attack.enabled ? "checked" : ""}> Enable ${attack.name}</label>` : ""}
      <div class="form-grid">
        <label>Damage <input data-attack-field="damage" type="number" min="0" value="${attack.damage}"></label>
        <label>Hits <input data-attack-field="hits" type="number" min="1" value="${attack.hits}"></label>
        <label>Damage Type <select data-attack-field="damageType">${options(attack.damageType)}</select></label>
        <label>Crit Chance % <input data-attack-field="critChance" type="number" min="0" max="100" value="${attack.critChance}"></label>
        <label>Crit Damage <input data-attack-field="critDamage" type="number" min="0" value="${attack.critDamage}"></label>
      </div>
    </div>
  `;
}

function runCalculations() {
  const rolls = Math.max(1, Math.min(100, Math.floor(Number(el.rollCount.value) || 100)));
  el.rollCount.value = rolls;
  const results = [];

  const playerAttack = state.player.attacks[0];
  results.push(analyseAttack(state.player, state.boss, playerAttack, "playerToBoss", rolls));

  state.boss.attacks.filter(a => a.enabled).forEach(attack => {
    results.push(analyseAttack(state.boss, state.player, attack, "bossToPlayer", rolls));
  });

  state.results = results;
  renderResults();
  renderLog();
  renderHistogram();
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function renderResults() {
  if (!state.results.length) {
    el.results.innerHTML = `<p class="hint">Enter stats and press Calculate.</p>`;
    return;
  }

  el.results.innerHTML = state.results.map(r => `
    <div class="result-group">
      <h3>${r.name}</h3>
      <div class="results-grid">
        <div class="metric"><span>Expected</span><strong>${fmt(r.expected)}</strong></div>
        <div class="metric"><span>Minimum</span><strong>${fmt(r.minimum)}</strong></div>
        <div class="metric"><span>Maximum</span><strong>${fmt(r.maximum)}</strong></div>
        <div class="metric"><span>Sim average</span><strong>${fmt(r.simulationAverage)}</strong></div>
        <div class="metric"><span>Lowest roll</span><strong>${fmt(r.lowest)}</strong></div>
        <div class="metric"><span>Highest roll</span><strong>${fmt(r.highest)}</strong></div>
        <div class="metric"><span>Crits</span><strong>${r.crits}</strong></div>
        <div class="metric"><span>Blocks</span><strong>${r.blocks}</strong></div>
      </div>
    </div>
  `).join("");
}

function renderLog() {
  if (!el.showLog.checked || !state.results.length) {
    el.combatLog.innerHTML = `<p class="hint">Combat log hidden.</p>`;
    return;
  }

  const entries = [];
  state.results.forEach(result => {
    const firstRoll = result.logs[0] || [];
    const text = firstRoll.map(h => 
      `Hit ${h.hit}: roll ${(h.variance * 100).toFixed(1)}% · crit ${h.crit ? "yes" : "no"} · block ${h.block ? "yes" : "no"} · damage ${fmt(h.damage)}`
    ).join("\n");
    entries.push(`<div class="log-entry">${result.name}\n${text}</div>`);
  });

  el.combatLog.innerHTML = entries.join("");
}

function renderHistogram() {
  if (!el.showHistogram.checked || !state.results.length) {
    el.histogram.innerHTML = `<p class="hint">Histogram hidden.</p>`;
    return;
  }

  const values = state.results[0].simulations;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bucketCount = 8;
  const buckets = Array.from({ length: bucketCount }, () => 0);
  values.forEach(v => {
    const index = max === min ? 0 : Math.min(bucketCount - 1, Math.floor(((v - min) / (max - min)) * bucketCount));
    buckets[index]++;
  });
  const top = Math.max(...buckets);

  el.histogram.innerHTML = buckets.map((count, i) => {
    const start = min + ((max - min) / bucketCount) * i;
    const end = min + ((max - min) / bucketCount) * (i + 1);
    const width = top ? (count / top) * 100 : 0;
    return `<div class="bar-row"><span>${fmt(start)}–${fmt(end)}</span><div><div class="bar" style="width:${width}%"></div></div><span>${count}</span></div>`;
  }).join("");
}

function stateForStorage() {
  return {
    player: state.player,
    boss: state.boss
  };
}

function hydrate(data) {
  if (!data) return;
  Object.assign(state.player, data.player || {});
  Object.assign(state.boss, data.boss || {});
  state.activeBossAttack = 0;
  state.results = [];
  render();
}

function render() {
  renderCombatant(el.player, state.player, false);
  renderCombatant(el.boss, state.boss, true);
  renderResults();
}

el.calculate.addEventListener("click", runCalculations);
el.roll.addEventListener("click", runCalculations);
el.showLog.addEventListener("change", renderLog);
el.showHistogram.addEventListener("change", renderHistogram);
el.save.addEventListener("click", () => {
  saveState(stateForStorage());
  alert("Preset saved in this browser.");
});
el.load.addEventListener("click", () => hydrate(loadState()));
el.clear.addEventListener("click", () => {
  clearState();
  location.reload();
});
el.export.addEventListener("click", () => downloadJson("tacticus-damage-simulator-preset.json", stateForStorage()));
el.import.addEventListener("change", async () => {
  const file = el.import.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  hydrate(data);
});

render();
