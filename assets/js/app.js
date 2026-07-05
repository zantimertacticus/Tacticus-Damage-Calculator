
(() => {
"use strict";

const DAMAGE_TYPES = [{"name": "Bio", "pierce": 0.3}, {"name": "Blast", "pierce": 0.15}, {"name": "Bolter", "pierce": 0.2}, {"name": "Chain", "pierce": 0.2}, {"name": "Direct", "pierce": 1}, {"name": "Energy", "pierce": 0.3}, {"name": "Eviscerating", "pierce": 0.5}, {"name": "Flame", "pierce": 0.25}, {"name": "Heavy Round", "pierce": 0.55}, {"name": "Las", "pierce": 0.1}, {"name": "Melta", "pierce": 0.75}, {"name": "Molecular", "pierce": 0.6}, {"name": "Particle", "pierce": 0.35}, {"name": "Physical", "pierce": 0.01}, {"name": "Piercing", "pierce": 0.8}, {"name": "Plasma", "pierce": 0.65}, {"name": "Power", "pierce": 0.4}, {"name": "Projectile", "pierce": 0.15}, {"name": "Psychic", "pierce": 1}, {"name": "Pulse", "pierce": 0.2}, {"name": "Toxic", "pierce": 0.7}];
const DAMAGE_VARIANCE = { MIN: 0.8, AVG: 1, MAX: 1.2 };
const TERRAIN = { HIGH_GROUND: 0.5, RAZOR_WIRE: 0.5, TRENCH: -0.5 };
const STORAGE_KEY = "tdc_named_presets_v09";

function getPierceRatio(name) {
  return DAMAGE_TYPES.find(d => d.name === name)?.pierce ?? 0;
}

class Attack {
  constructor(name = "Attack", enabled = true) {
    this.enabled = enabled;
    this.name = name;
    this.damage = 0;
    this.hits = 1;
    this.damageType = "Physical";
    this.pierceRatio = getPierceRatio("Physical");
    this.critChance = 0;
    this.critDamage = 0;
  }

  setDamageType(type) {
    this.damageType = type;
    this.pierceRatio = getPierceRatio(type);
  }

  static from(raw = {}, name = "Attack", enabled = true) {
    const a = new Attack(raw.name ?? name, raw.enabled ?? enabled);
    a.damage = Number(raw.damage) || 0;
    a.hits = Math.max(1, Math.floor(Number(raw.hits) || 1));
    a.setDamageType(raw.damageType ?? "Physical");
    a.critChance = Number(raw.critChance) || 0;
    a.critDamage = Number(raw.critDamage) || 0;
    return a;
  }
}

class Combatant {
  constructor(name = "") {
    this.name = name;
    this.health = 0;
    this.armour = 0;
    this.blockChance = 0;
    this.blockDamage = 0;
    this.terrain = { highGround: false, razorWire: false, trench: false };
    this.attacks = [
      new Attack("Attack", true),
      new Attack("Ability 1", false),
      new Attack("Ability 2", false),
      new Attack("Ability 3", false)
    ];
  }

  static from(raw = {}, name = "") {
    const c = new Combatant(raw.name ?? name);
    c.health = Number(raw.health) || 0;
    c.armour = Number(raw.armour) || 0;
    c.blockChance = Number(raw.blockChance) || 0;
    c.blockDamage = Number(raw.blockDamage) || 0;
    c.terrain = {
      highGround: Boolean(raw.terrain?.highGround),
      razorWire: Boolean(raw.terrain?.razorWire),
      trench: Boolean(raw.terrain?.trench)
    };
    const names = ["Attack", "Ability 1", "Ability 2", "Ability 3"];
    c.attacks = names.map((n, i) => Attack.from(raw.attacks?.[i] ?? {}, n, i === 0));
    return c;
  }
}

const pct = v => Math.max(0, Math.min(100, Number(v) || 0)) / 100;
const n = v => Math.max(0, Number(v) || 0);
const chance = v => Math.max(0, Math.min(100, Number(v) || 0));
const integer = (v, min = 1) => Math.max(min, Math.floor(Number(v) || min));
const fmt = v => Math.round(v).toLocaleString();

function terrainMultiplier(attackerTerrain, defenderTerrain, mode) {
  let m = 0;
  if (mode === "playerToBoss") {
    if (attackerTerrain.highGround) m += TERRAIN.HIGH_GROUND;
  } else {
    if (attackerTerrain.highGround) m += TERRAIN.HIGH_GROUND;
    if (defenderTerrain.trench) m += TERRAIN.TRENCH;
    else if (defenderTerrain.razorWire) m += TERRAIN.RAZOR_WIRE;
  }
  return Math.max(0, 1 + m);
}

function hitDamage({ attack, attacker, defender, variance, crit, block, mode }) {
  const effective = crit ? attack.damage + attack.critDamage : attack.damage;
  const varied = effective * variance;
  const after = Math.max(varied - defender.armour, varied * attack.pierceRatio);
  const modified = after * terrainMultiplier(attacker.terrain, defender.terrain, mode);
  return Math.max(0, block ? modified - defender.blockDamage : modified);
}

function deterministicAttack(attacker, defender, attack, mode, variance = DAMAGE_VARIANCE.AVG) {
  const cp = pct(attack.critChance);
  const bp = pct(defender.blockChance);
  let total = 0;

  for (let h = 1; h <= attack.hits; h++) {
    const c = Math.pow(cp, h);
    const b = Math.pow(bp, h);
    const nn = hitDamage({ attack, attacker, defender, variance, crit: false, block: false, mode });
    const nb = hitDamage({ attack, attacker, defender, variance, crit: false, block: true, mode });
    const cn = hitDamage({ attack, attacker, defender, variance, crit: true, block: false, mode });
    const cb = hitDamage({ attack, attacker, defender, variance, crit: true, block: true, mode });
    total += (1 - c) * ((1 - b) * nn + b * nb) + c * ((1 - b) * cn + b * cb);
  }

  return total;
}

function minAttack(attacker, defender, attack, mode) {
  const block = pct(defender.blockChance) > 0;
  let total = 0;
  for (let i = 0; i < attack.hits; i++) {
    total += hitDamage({ attack, attacker, defender, variance: DAMAGE_VARIANCE.MIN, crit: false, block, mode });
  }
  return total;
}

function maxAttack(attacker, defender, attack, mode) {
  const crit = pct(attack.critChance) > 0;
  let total = 0;
  for (let i = 0; i < attack.hits; i++) {
    total += hitDamage({ attack, attacker, defender, variance: DAMAGE_VARIANCE.MAX, crit, block: false, mode });
  }
  return total;
}

function chainedFlags(chanceValue, hits) {
  const p = pct(chanceValue);
  const out = [];
  let active = true;
  for (let i = 0; i < hits; i++) {
    if (!active || p <= 0) {
      out.push(false);
      continue;
    }
    const ok = Math.random() < p;
    out.push(ok);
    if (!ok) active = false;
  }
  return out;
}

function rollAttack(attacker, defender, attack, mode) {
  const cf = chainedFlags(attack.critChance, attack.hits);
  const bf = chainedFlags(defender.blockChance, attack.hits);
  let total = 0, crits = 0, blocks = 0;
  const log = [];

  for (let i = 0; i < attack.hits; i++) {
    const variance = DAMAGE_VARIANCE.MIN + Math.random() * (DAMAGE_VARIANCE.MAX - DAMAGE_VARIANCE.MIN);
    const crit = cf[i];
    const block = bf[i];
    if (crit) crits++;
    if (block) blocks++;
    const damage = hitDamage({ attack, attacker, defender, variance, crit, block, mode });
    total += damage;
    log.push({ hit: i + 1, variance, crit, block, damage });
  }

  return { total, crits, blocks, log };
}

function analyseAttack(attacker, defender, attack, mode, rolls = 100) {
  const expected = deterministicAttack(attacker, defender, attack, mode);
  const minimum = minAttack(attacker, defender, attack, mode);
  const maximum = maxAttack(attacker, defender, attack, mode);
  const simulations = [];
  let crits = 0, blocks = 0;
  const logs = [];

  for (let i = 0; i < rolls; i++) {
    const r = rollAttack(attacker, defender, attack, mode);
    simulations.push(r.total);
    crits += r.crits;
    blocks += r.blocks;
    logs.push(r.log);
  }

  return {
    name: attack.name,
    expected,
    minimum,
    maximum,
    simulationAverage: simulations.reduce((a, b) => a + b, 0) / simulations.length,
    lowest: Math.min(...simulations),
    highest: Math.max(...simulations),
    crits,
    blocks,
    simulations,
    logs
  };
}

function getPresets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function savePreset(name, data) {
  const presets = getPresets();
  presets[name] = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function loadPreset(name) {
  return getPresets()[name] ?? null;
}

function deletePreset(name) {
  const presets = getPresets();
  delete presets[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function clearAllPresets() {
  localStorage.removeItem(STORAGE_KEY);
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const state = {
  player: new Combatant("Player"),
  boss: new Combatant("Boss"),
  activeBossAttack: 0,
  results: [],
  chart: null
};

const el = {
  player: document.querySelector("#playerPanel"),
  boss: document.querySelector("#bossPanel"),
  results: document.querySelector("#results"),
  log: document.querySelector("#combatLog"),
  chartCanvas: document.querySelector("#damageChart"),
  fallback: document.querySelector("#chartFallback"),
  validation: document.querySelector("#validation"),
  rollCount: document.querySelector("#rollCount"),
  showLog: document.querySelector("#showLog"),
  showChart: document.querySelector("#showChart"),
  fullLog: document.querySelector("#fullLog"),
  calculate: document.querySelector("#calculateBtn"),
  roll: document.querySelector("#rollBtn"),
  presetName: document.querySelector("#presetName"),
  presetSelect: document.querySelector("#presetSelect"),
  save: document.querySelector("#savePresetBtn"),
  load: document.querySelector("#loadPresetBtn"),
  deletePreset: document.querySelector("#deletePresetBtn"),
  exportEncounter: document.querySelector("#exportEncounterBtn"),
  exportPlayer: document.querySelector("#exportPlayerBtn"),
  exportBoss: document.querySelector("#exportBossBtn"),
  import: document.querySelector("#importInput"),
  copyResults: document.querySelector("#copyResultsBtn"),
  clear: document.querySelector("#clearBtn")
};

function damageOptions(selected) {
  return DAMAGE_TYPES.map(t => `<option value="${t.name}" ${t.name === selected ? "selected" : ""}>${t.name} (${Math.round(t.pierce * 100)}%)</option>`).join("");
}

function renderCombatant(container, combatant, isBoss = false) {
  const attack = isBoss ? combatant.attacks[state.activeBossAttack] : combatant.attacks[0];
  container.innerHTML = `<h2>${combatant.name}</h2>
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
    <div class="section-title">${attack.name}</div>
    ${renderAttack(attack, isBoss)}`;
  bindCombatant(container, combatant, isBoss);
}

function bindCombatant(container, combatant, isBoss) {
  container.querySelectorAll("[data-field]").forEach(input => {
    input.addEventListener("input", () => {
      combatant[input.dataset.field] = input.dataset.field.includes("Chance") ? chance(input.value) : n(input.value);
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
    container.querySelectorAll(".tab").forEach(button => {
      button.addEventListener("click", () => {
        state.activeBossAttack = Number(button.dataset.index);
        render();
      });
    });
  }

  const attack = isBoss ? combatant.attacks[state.activeBossAttack] : combatant.attacks[0];
  const enabled = container.querySelector("[data-attack-enabled]");
  if (enabled) {
    enabled.addEventListener("change", () => {
      attack.enabled = enabled.checked;
      render();
    });
  }

  container.querySelectorAll("[data-attack-field]").forEach(input => {
    const update = () => {
      const key = input.dataset.attackField;
      if (key === "damageType") {
        attack.damageType = input.value;
        attack.pierceRatio = getPierceRatio(input.value);
      } else if (key === "hits") {
        attack.hits = integer(input.value, 1);
      } else if (key.includes("Chance")) {
        attack[key] = chance(input.value);
      } else {
        attack[key] = n(input.value);
      }
    };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });
}

function renderTabs() {
  return `<div class="tabs">${state.boss.attacks.map((a, i) =>
    `<button class="tab ${i === state.activeBossAttack ? "active" : ""}" data-index="${i}">${a.name}${a.enabled || i === 0 ? "" : " · off"}</button>`
  ).join("")}</div>`;
}

function renderAttack(a, isBoss) {
  return `<div class="attack-card">
    ${isBoss && a.name !== "Attack" ? `<label class="check"><input data-attack-enabled type="checkbox" ${a.enabled ? "checked" : ""}> Enable ${a.name}</label>` : ""}
    <div class="form-grid">
      <label>Damage <input data-attack-field="damage" type="number" min="0" value="${a.damage}"></label>
      <label>Hits <input data-attack-field="hits" type="number" min="1" value="${a.hits}"></label>
      <label>Damage Type <select data-attack-field="damageType">${damageOptions(a.damageType)}</select></label>
      <label>Crit Chance % <input data-attack-field="critChance" type="number" min="0" max="100" value="${a.critChance}"></label>
      <label>Crit Damage <input data-attack-field="critDamage" type="number" min="0" value="${a.critDamage}"></label>
    </div>
  </div>`;
}

function validate() {
  const msgs = [];
  if (state.player.attacks[0].damage <= 0) msgs.push("Player attack damage should be greater than 0.");
  state.boss.attacks.filter(a => a.enabled).forEach(a => {
    if (a.damage <= 0) msgs.push(`${a.name} damage should be greater than 0.`);
  });
  el.validation.innerHTML = msgs.length ? msgs.map(m => `<div>${m}</div>`).join("") : `<div class="ok">Ready.</div>`;
  return !msgs.length;
}

function run() {
  const rolls = Math.min(100, integer(el.rollCount.value, 1));
  el.rollCount.value = rolls;
  validate();

  const res = [];
  res.push({ direction: "Player → Boss", ...analyseAttack(state.player, state.boss, state.player.attacks[0], "playerToBoss", rolls) });
  state.boss.attacks.filter(a => a.enabled).forEach(a => {
    res.push({ direction: "Boss → Player", ...analyseAttack(state.boss, state.player, a, "bossToPlayer", rolls) });
  });

  state.results = res;
  renderResults();
  renderLog();
  renderChart();
}

function renderResults() {
  if (!state.results.length) {
    el.results.innerHTML = `<p class="hint">Enter stats and press Calculate.</p>`;
    return;
  }

  el.results.innerHTML = state.results.map(r => `<div class="result-group">
    <h3>${r.direction}: ${r.name}</h3>
    <div class="results-grid">
      ${["expected", "minimum", "maximum", "simulationAverage", "lowest", "highest"].map(k =>
        `<div class="metric"><span>${k}</span><strong>${fmt(r[k])}</strong></div>`
      ).join("")}
      <div class="metric"><span>Crit hits</span><strong>${r.crits}</strong></div>
      <div class="metric"><span>Blocked hits</span><strong>${r.blocks}</strong></div>
    </div>
  </div>`).join("");
}

function renderLog() {
  if (!el.showLog.checked || !state.results.length) {
    el.log.innerHTML = `<p class="hint">Combat log hidden.</p>`;
    return;
  }

  const full = el.fullLog.checked;
  el.log.innerHTML = state.results.map(r => {
    const rolls = full ? r.logs : [r.logs[0] ?? []];
    const blocks = rolls.map((roll, idx) => {
      const total = r.simulations[idx] ?? 0;
      const lines = roll.map(h => `  Hit ${h.hit}: roll ${(h.variance * 100).toFixed(1)}% | crit ${h.crit ? "yes" : "no"} | block ${h.block ? "yes" : "no"} | damage ${fmt(h.damage)}`).join("\n");
      return `Roll ${idx + 1} | total ${fmt(total)}\n${lines || "  No hits."}`;
    }).join("\n\n");
    return `<div class="log-entry">${r.direction}: ${r.name}\n${blocks}</div>`;
  }).join("");
}

function buckets(v) {
  const min = Math.min(...v), max = Math.max(...v), count = 8;
  const b = Array.from({ length: count }, () => 0);
  v.forEach(x => {
    const idx = max === min ? 0 : Math.min(count - 1, Math.floor(((x - min) / (max - min)) * count));
    b[idx]++;
  });
  return b.map((count, i) => ({
    label: `${fmt(min + ((max - min) / 8) * i)}–${fmt(min + ((max - min) / 8) * (i + 1))}`,
    count
  }));
}

function renderChart() {
  if (!el.showChart.checked || !state.results.length) {
    el.chartCanvas.style.display = "none";
    el.fallback.innerHTML = `<p class="hint">Chart hidden.</p>`;
    if (state.chart) {
      state.chart.destroy();
      state.chart = null;
    }
    return;
  }

  el.chartCanvas.style.display = "block";
  const data = buckets(state.results[0].simulations);
  el.fallback.innerHTML = "";

  if (window.Chart) {
    if (state.chart) state.chart.destroy();
    state.chart = new Chart(el.chartCanvas, {
      type: "bar",
      data: {
        labels: data.map(d => d.label),
        datasets: [{ label: "Rolls", data: data.map(d => d.count) }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#bbb5a8" } },
          y: { ticks: { color: "#bbb5a8", precision: 0 } }
        }
      }
    });
  }
}

function encounter() { return { type: "encounter", version: "1.0-rc1", player: state.player, boss: state.boss }; }
function playerOnly() { return { type: "player", version: "1.0-rc1", player: state.player }; }
function bossOnly() { return { type: "boss", version: "1.0-rc1", boss: state.boss }; }

function hydrateEncounter(d) {
  state.player = Combatant.from(d?.player ?? {}, "Player");
  state.boss = Combatant.from(d?.boss ?? {}, "Boss");
  state.activeBossAttack = 0;
  state.results = [];
  render();
}

function hydratePlayer(d) {
  state.player = Combatant.from(d?.player ?? d ?? {}, "Player");
  state.results = [];
  render();
}

function hydrateBoss(d) {
  state.boss = Combatant.from(d?.boss ?? d ?? {}, "Boss");
  state.activeBossAttack = 0;
  state.results = [];
  render();
}

function importData(d) {
  if (d?.type === "player" || (d?.player && !d?.boss)) return hydratePlayer(d);
  if (d?.type === "boss" || (d?.boss && !d?.player)) return hydrateBoss(d);
  hydrateEncounter(d);
}

function renderPresetList() {
  const presets = getPresets();
  const names = Object.keys(presets).sort();
  el.presetSelect.innerHTML = names.length
    ? names.map(x => `<option value="${x}">${x}</option>`).join("")
    : `<option value="">No presets saved</option>`;
}

function render() {
  renderCombatant(el.player, state.player, false);
  renderCombatant(el.boss, state.boss, true);
  renderResults();
  renderPresetList();
  if (!state.results.length) {
    el.log.innerHTML = `<p class="hint">No combat log yet.</p>`;
    el.fallback.innerHTML = `<p class="hint">No chart yet.</p>`;
  }
}


function resultsAsText() {
  if (!state.results.length) return "No results calculated yet.";
  return state.results.map(r => {
    return [
      `${r.direction}: ${r.name}`,
      `Expected: ${fmt(r.expected)}`,
      `Minimum: ${fmt(r.minimum)}`,
      `Maximum: ${fmt(r.maximum)}`,
      `Simulation average: ${fmt(r.simulationAverage)}`,
      `Lowest roll: ${fmt(r.lowest)}`,
      `Highest roll: ${fmt(r.highest)}`,
      `Crit hits: ${r.crits}`,
      `Blocked hits: ${r.blocks}`
    ].join("\n");
  }).join("\n\n");
}

el.calculate.addEventListener("click", run);
el.roll.addEventListener("click", run);
el.showLog.addEventListener("change", renderLog);
el.fullLog.addEventListener("change", renderLog);
el.showChart.addEventListener("change", renderChart);

el.save.addEventListener("click", () => {
  const name = el.presetName.value.trim() || prompt("Preset name?");
  if (!name) return;
  savePreset(name, encounter());
  el.presetName.value = "";
  renderPresetList();
  alert(`Preset saved: ${name}`);
});

el.load.addEventListener("click", () => {
  const name = el.presetSelect.value;
  if (!name) return alert("No preset selected.");
  const d = loadPreset(name);
  if (!d) return alert("Preset not found.");
  hydrateEncounter(d);
});

el.deletePreset.addEventListener("click", () => {
  const name = el.presetSelect.value;
  if (!name) return;
  if (confirm(`Delete preset "${name}"?`)) {
    deletePreset(name);
    renderPresetList();
  }
});

el.clear.addEventListener("click", () => {
  if (confirm("Clear all named presets and reset the app?")) {
    clearAllPresets();
    location.reload();
  }
});

el.exportEncounter.addEventListener("click", () => downloadJson("tacticus-encounter.json", encounter()));
el.exportPlayer.addEventListener("click", () => downloadJson("tacticus-player.json", playerOnly()));
el.exportBoss.addEventListener("click", () => downloadJson("tacticus-boss.json", bossOnly()));


if (el.copyResults) {
  el.copyResults.addEventListener("click", async () => {
    const text = resultsAsText();
    try {
      await navigator.clipboard.writeText(text);
      alert("Results copied to clipboard.");
    } catch {
      prompt("Copy results:", text);
    }
  });
}

el.import.addEventListener("change", async () => {
  const file = el.import.files[0];
  if (!file) return;
  try {
    importData(JSON.parse(await file.text()));
  } catch {
    alert("Could not import that JSON file.");
  }
  el.import.value = "";
});

try {
  render();
} catch (error) {
  console.error(error);
  const box = document.querySelector("#startupError");
  if (box) {
    box.hidden = false;
    box.textContent = "App startup failed: " + error.message;
  }
}
})();
