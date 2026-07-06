
(() => {
"use strict";

const DAMAGE_TYPES = [{"name": "Bio", "pierce": 0.3}, {"name": "Blast", "pierce": 0.15}, {"name": "Bolter", "pierce": 0.2}, {"name": "Chain", "pierce": 0.2}, {"name": "Direct", "pierce": 1}, {"name": "Energy", "pierce": 0.3}, {"name": "Eviscerating", "pierce": 0.5}, {"name": "Flame", "pierce": 0.25}, {"name": "Heavy Round", "pierce": 0.55}, {"name": "Las", "pierce": 0.1}, {"name": "Melta", "pierce": 0.75}, {"name": "Molecular", "pierce": 0.6}, {"name": "Particle", "pierce": 0.35}, {"name": "Physical", "pierce": 0.01}, {"name": "Piercing", "pierce": 0.8}, {"name": "Plasma", "pierce": 0.65}, {"name": "Power", "pierce": 0.4}, {"name": "Projectile", "pierce": 0.15}, {"name": "Psychic", "pierce": 1}, {"name": "Pulse", "pierce": 0.2}, {"name": "Toxic", "pierce": 0.7}];
const DAMAGE_VARIANCE = { MIN: 0.8, AVG: 1, MAX: 1.2 };
const TERRAIN = { HIGH_GROUND: 0.5, RAZOR_WIRE: 0.5, TRENCH: -0.5 };
const STORAGE_KEY = "tdc_named_presets_v15";

const TRAIT_TEMPLATES = [
  { value: "custom", label: "Custom / Manual", hint: "Manual modifier entry.", apply: {} },

  { value: "2-man-team", label: "2-Man Team", hint: "Caps a single non-Blast hit to 50% max health. Not automated yet; use manually for edge-case checks.", apply: {} },
  { value: "act-of-faith", label: "Act of Faith", hint: "Contextual crit bonus. Manually add +10 Crit Chance and +25 Crit Damage per stack to the attack fields.", apply: {} },
  { value: "beast-slayer", label: "Beast Slayer", hint: "Deals +20% melee damage to Big Targets/Vehicles. Also has an added block chance not fully automated.", apply: { outgoingDamagePercentBonus: 20 } },
  { value: "big-target", label: "Big Target", hint: "No Tall Grass/Trench bonuses; adjacent allies take -1 ranged hit. Use incoming hit penalty manually if needed.", apply: {} },
  { value: "blessings-khorne", label: "Blessings of Khorne", hint: "+3% damage per melee kill, max 8. Enter stack-adjusted outgoing percent manually.", apply: { outgoingDamagePercentBonus: 3 } },
  { value: "camouflage", label: "Camouflage", hint: "Ranged attacks score -1 hit, -2 if >2 hexes, -3 in Tall Grass. Defaults to -1 incoming hit.", apply: { incomingHitPenalty: 1 } },
  { value: "contagions", label: "Contagions of Nurgle", hint: "Temporary -20% enemy armour, or -40% in overlapping auras. Defaults to 20%.", apply: { incomingArmourReductionPercent: 20 } },
  { value: "crushing-strike", label: "Crushing Strike", hint: "+50% normal melee damage if not moved.", apply: { outgoingDamagePercentBonus: 50 } },
  { value: "daemon", label: "Daemon", hint: "Additional 25% chance to block up to 50% current damage stat. Approximate using Block Chance/Damage fields.", apply: {} },
  { value: "dakka", label: "Dakka", hint: "+2 hits for range 3+ attacks against a target at range 2.", apply: { outgoingHitsBonus: 2 } },
  { value: "diminutive", label: "Diminutive", hint: "Incoming multi-hit attacks reduced by 1 hit, min 1.", apply: { incomingHitPenalty: 1 } },
  { value: "emplacement-ranged", label: "Emplacement — ranged", hint: "+50% ranged damage if not moved.", apply: { outgoingDamagePercentBonus: 50 } },
  { value: "emplacement-melee", label: "Emplacement — melee", hint: "-50% melee damage.", apply: { outgoingDamagePercentBonus: -50 } },
  { value: "get-stuck-in", label: "Get Stuck In", hint: "Chance to score extra hits per 2 hits. Use outgoing hit bonus manually depending on expected triggers.", apply: {} },
  { value: "heavy-weapon", label: "Heavy Weapon", hint: "+25% ranged damage if not moved.", apply: { outgoingDamagePercentBonus: 25 } },
  { value: "immune", label: "Immune", hint: "Cannot have Armour or Hits reduced. Do not apply hit/armour penalties against this unit.", apply: {} },
  { value: "indirect-fire", label: "Indirect Fire", hint: "Ignores Trenches. Untick Trench manually when applicable.", apply: {} },
  { value: "martial-katah-defence", label: "Martial Ka'tah — defence", hint: "Normal attacks against this unit deal -20% damage.", apply: { incomingPostArmourReduction: 20 } },
  { value: "martial-katah-summons", label: "Martial Ka'tah — vs Summons", hint: "+100% damage against Summons.", apply: { outgoingDamagePercentBonus: 100 } },
  { value: "mk-x-gravis", label: "Mk X Gravis", hint: "Non-critical incoming damage goes through armour a second time.", apply: { secondArmourPassNonCrit: true } },
  { value: "parry", label: "Parry", hint: "Incoming melee multi-hit attacks reduced by 1 hit, min 1.", apply: { incomingHitPenalty: 1 } },
  { value: "prioritised-efficiency-hostile", label: "Prioritised Efficiency — Hostile Acquisition", hint: "+25% damage.", apply: { outgoingDamagePercentBonus: 25 } },
  { value: "prioritised-efficiency-fortify", label: "Prioritised Efficiency — Fortify Takeover", hint: "Takes -33% damage.", apply: { incomingPostArmourReduction: 33 } },
  { value: "ranged-specialist", label: "Ranged Specialist", hint: "+33% ranged damage if not starting adjacent.", apply: { outgoingDamagePercentBonus: 33 } },
  { value: "rapid-assault", label: "Rapid Assault", hint: "First attack and following same-turn attacks deal +25% damage.", apply: { outgoingDamagePercentBonus: 25 } },
  { value: "shadow-in-warp", label: "Shadow in the Warp", hint: "Enemy Psykers within 2 hexes deal -25% Psychic damage.", apply: { incomingPostArmourReduction: 25 } },
  { value: "suppressive-fire", label: "Suppressive Fire / Suppressed", hint: "Suppressed damage reduced by 30%. Apply to suppressed attacker's outgoing damage.", apply: { outgoingDamagePercentBonus: -30 } },
  { value: "swarm", label: "Swarm", hint: "Hits depend on swarm members. Enter current members as Hits manually.", apply: {} },
  { value: "terminator-armour", label: "Terminator Armour", hint: "First hit each turn deals -75% damage, excluding Psychic/Direct. Damage-type exclusion not automated.", apply: { incomingFirstHitReductionPercent: 75 } },
  { value: "terrifying", label: "Terrifying", hint: "Takes -30% damage from melee attacks.", apply: { incomingPostArmourReduction: 30 } },
  { value: "thrill-seekers", label: "Thrill Seekers", hint: "While Thrilled: +15% Crit Chance. Add this to the attack Crit Chance manually.", apply: {} },
  { value: "weaver-of-fates", label: "Weaver of Fates", hint: "Uses maximum possible damage variance. Does not force crits.", apply: { forceMaxVariance: true } },

  { value: "no-direct-formula", label: "Other trait — no direct damage formula effect", hint: "For movement, resurrection, healing, overwatch, summon, object, and similar traits.", apply: {} }
];

function getPierceRatio(name) { return DAMAGE_TYPES.find(d => d.name === name)?.pierce ?? 0; }
const pct = v => Math.max(0, Math.min(100, Number(v) || 0)) / 100;
const n = v => Math.max(0, Number(v) || 0);
const chance = v => Math.max(0, Math.min(100, Number(v) || 0));
const integer = (v, min = 1) => Math.max(min, Math.floor(Number(v) || min));
const fmt = v => Math.round(v).toLocaleString();

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
  setDamageType(type) { this.damageType = type; this.pierceRatio = getPierceRatio(type); }
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

function defaultModifiers() {
  return {
    template: "custom",
    selectedTraits: [],
    outgoingDamageBonus: 0,
    outgoingDamagePercentBonus: 0,
    outgoingHitsBonus: 0,
    incomingPreArmourDamagePenalty: 0,
    incomingArmourReductionPercent: 0,
    incomingHitPenalty: 0,
    incomingPostArmourReduction: 0,
    incomingFirstHitReductionPercent: 0,
    secondArmourPassNonCrit: false,
    forceMaxVariance: false
  };
}

class Combatant {
  constructor(name = "") {
    this.name = name;
    this.health = 0;
    this.armour = 0;
    this.blockChance = 0;
    this.blockDamage = 0;
    this.terrain = { highGround: false, razorWire: false, trench: false };
    this.modifiers = defaultModifiers();
    this.attacks = [
      new Attack("Attack", true),
      new Attack("Extra Attack", false),
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
    c.modifiers = { ...defaultModifiers(), ...(raw.modifiers ?? {}) }; c.modifiers.selectedTraits = Array.isArray(c.modifiers.selectedTraits) ? c.modifiers.selectedTraits : [];
    const names = name === "Player"
      ? ["Attack", "Extra Attack"]
      : ["Attack", "Ability 1", "Ability 2", "Ability 3"];
    c.attacks = names.map((attackName, i) => Attack.from(raw.attacks?.[i] ?? {}, attackName, i === 0));
    return c;
  }
}

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

function effectiveHits(attack, attacker, defender) {
  const hits = attack.hits + n(attacker.modifiers.outgoingHitsBonus) - n(defender.modifiers.incomingHitPenalty);
  return Math.max(0, Math.floor(hits));
}

function hitDamage({ attack, attacker, defender, variance, crit, block, mode, hitNumber = 1 }) {
  const attackerPercent = 1 + (Number(attacker.modifiers.outgoingDamagePercentBonus) || 0) / 100;
  const base = Math.max(0, (attack.damage + n(attacker.modifiers.outgoingDamageBonus)) * attackerPercent);
  const effective = crit ? base + attack.critDamage : base;
  const varianceToUse = attacker.modifiers.forceMaxVariance ? DAMAGE_VARIANCE.MAX : variance;
  const varied = effective * varianceToUse;
  const penalised = Math.max(0, varied - n(defender.modifiers.incomingPreArmourDamagePenalty));
  const effectiveArmour = defender.armour * (1 - pct(defender.modifiers.incomingArmourReductionPercent));
  let afterArmour = Math.max(penalised - effectiveArmour, penalised * attack.pierceRatio);
  if (defender.modifiers.secondArmourPassNonCrit && !crit) {
    afterArmour = Math.max(afterArmour - effectiveArmour, afterArmour * attack.pierceRatio);
  }
  const terrainAdjusted = afterArmour * terrainMultiplier(attacker.terrain, defender.terrain, mode);
  let reduction = pct(defender.modifiers.incomingPostArmourReduction);
  if (hitNumber === 1) {
    reduction = Math.min(1, reduction + pct(defender.modifiers.incomingFirstHitReductionPercent));
  }
  const reduced = terrainAdjusted * (1 - reduction);
  return Math.max(0, block ? reduced - defender.blockDamage : reduced);
}

function deterministicAttack(attacker, defender, attack, mode, variance = DAMAGE_VARIANCE.AVG) {
  const cp = pct(attack.critChance);
  const bp = pct(defender.blockChance);
  const hits = effectiveHits(attack, attacker, defender);
  let total = 0;
  for (let h = 1; h <= hits; h++) {
    const c = Math.pow(cp, h);
    const b = Math.pow(bp, h);
    const nn = hitDamage({ attack, attacker, defender, variance, crit: false, block: false, mode, hitNumber: h });
    const nb = hitDamage({ attack, attacker, defender, variance, crit: false, block: true, mode, hitNumber: h });
    const cn = hitDamage({ attack, attacker, defender, variance, crit: true, block: false, mode, hitNumber: h });
    const cb = hitDamage({ attack, attacker, defender, variance, crit: true, block: true, mode, hitNumber: h });
    total += (1 - c) * ((1 - b) * nn + b * nb) + c * ((1 - b) * cn + b * cb);
  }
  return total;
}

function minAttack(attacker, defender, attack, mode) {
  const block = pct(defender.blockChance) > 0;
  const hits = effectiveHits(attack, attacker, defender);
  let total = 0;
  for (let i = 0; i < hits; i++) {
    total += hitDamage({ attack, attacker, defender, variance: DAMAGE_VARIANCE.MIN, crit: false, block, mode, hitNumber: i + 1 });
  }
  return total;
}

function maxAttack(attacker, defender, attack, mode) {
  const crit = pct(attack.critChance) > 0;
  const hits = effectiveHits(attack, attacker, defender);
  let total = 0;
  for (let i = 0; i < hits; i++) {
    total += hitDamage({ attack, attacker, defender, variance: DAMAGE_VARIANCE.MAX, crit, block: false, mode, hitNumber: i + 1 });
  }
  return total;
}

function chainedFlags(chanceValue, hits) {
  const p = pct(chanceValue);
  const out = [];
  let active = true;
  for (let i = 0; i < hits; i++) {
    if (!active || p <= 0) { out.push(false); continue; }
    const ok = Math.random() < p;
    out.push(ok);
    if (!ok) active = false;
  }
  return out;
}

function rollAttack(attacker, defender, attack, mode) {
  const hits = effectiveHits(attack, attacker, defender);
  const cf = chainedFlags(attack.critChance, hits);
  const bf = chainedFlags(defender.blockChance, hits);
  let total = 0, crits = 0, blocks = 0;
  const log = [];
  for (let i = 0; i < hits; i++) {
    const variance = DAMAGE_VARIANCE.MIN + Math.random() * (DAMAGE_VARIANCE.MAX - DAMAGE_VARIANCE.MIN);
    const crit = cf[i], block = bf[i];
    if (crit) crits++;
    if (block) blocks++;
    const damage = hitDamage({ attack, attacker, defender, variance, crit, block, mode, hitNumber: i + 1 });
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
    simulations.push(r.total); crits += r.crits; blocks += r.blocks; logs.push(r.log);
  }
  return {
    name: attack.name, expected, minimum, maximum,
    simulationAverage: simulations.reduce((a,b)=>a+b,0)/simulations.length,
    lowest: Math.min(...simulations), highest: Math.max(...simulations),
    crits, blocks, simulations, logs
  };
}

function getPresets() { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
function savePreset(name, data) { const p = getPresets(); p[name] = data; localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function loadPreset(name) { return getPresets()[name] ?? null; }
function deletePreset(name) { const p = getPresets(); delete p[name]; localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function clearAllPresets() { localStorage.removeItem(STORAGE_KEY); }
function downloadJson(filename, data) { const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

const state = { player: new Combatant("Player"), boss: new Combatant("Boss"), activePlayerAttack: 0, activeBossAttack: 0, results: [], chart: null };
const el = {
  player: document.querySelector("#playerPanel"), boss: document.querySelector("#bossPanel"), dataStatus: document.querySelector("#dataStatus"), dataSummary: document.querySelector("#dataSummary"),
  results: document.querySelector("#results"), log: document.querySelector("#combatLog"),
  chartCanvas: document.querySelector("#damageChart"), fallback: document.querySelector("#chartFallback"),
  validation: document.querySelector("#validation"), rollCount: document.querySelector("#rollCount"),
  showLog: document.querySelector("#showLog"), showChart: document.querySelector("#showChart"), fullLog: document.querySelector("#fullLog"), calcPlayerToBoss: document.querySelector("#calcPlayerToBoss"), calcBossToPlayer: document.querySelector("#calcBossToPlayer"),
  calculate: document.querySelector("#calculateBtn"), roll: document.querySelector("#rollBtn"), copy: document.querySelector("#copyResultsBtn"),
  presetName: document.querySelector("#presetName"), presetSelect: document.querySelector("#presetSelect"),
  save: document.querySelector("#savePresetBtn"), load: document.querySelector("#loadPresetBtn"), deletePreset: document.querySelector("#deletePresetBtn"),
  exportEncounter: document.querySelector("#exportEncounterBtn"), exportPlayer: document.querySelector("#exportPlayerBtn"), exportBoss: document.querySelector("#exportBossBtn"),
  import: document.querySelector("#importInput"), clear: document.querySelector("#clearBtn")
};

function damageOptions(selected) { return DAMAGE_TYPES.map(t => `<option value="${t.name}" ${t.name===selected?"selected":""}>${t.name} (${Math.round(t.pierce*100)}%)</option>`).join(""); }
function traitOptions(selected) { return TRAIT_TEMPLATES.map(t => `<option value="${t.value}" ${t.value===selected?"selected":""}>${t.label}</option>`).join(""); }
function traitHint(value) { return TRAIT_TEMPLATES.find(t=>t.value===value)?.hint ?? ""; }


function addTrait(combatant, value) {
  if (!Array.isArray(combatant.modifiers.selectedTraits)) combatant.modifiers.selectedTraits = [];
  if (!value || value === "custom") return;
  if (!combatant.modifiers.selectedTraits.includes(value)) {
    combatant.modifiers.selectedTraits.push(value);
  }
}

function combineTraitValues(current, key, value) {
  if (typeof value === "boolean") return Boolean(current) || value;
  const numeric = Number(value) || 0;
  if (key.includes("Reduction") || key.includes("Percent") || key.includes("Bonus") || key.includes("Penalty")) {
    return (Number(current) || 0) + numeric;
  }
  return numeric;
}

function applySelectedTraits(combatant) {
  const selected = Array.isArray(combatant.modifiers.selectedTraits) ? combatant.modifiers.selectedTraits : [];
  const currentTemplate = combatant.modifiers.template;
  const selectedTraits = [...selected];
  const next = { ...defaultModifiers(), template: currentTemplate, selectedTraits };

  selectedTraits.forEach(value => {
    const trait = TRAIT_TEMPLATES.find(t => t.value === value);
    if (!trait?.apply) return;
    Object.entries(trait.apply).forEach(([key, value]) => {
      next[key] = combineTraitValues(next[key], key, value);
    });
  });

  combatant.modifiers = next;
}


function renderCombatant(container, combatant, side) {
  const isBoss = side === "boss";
  const activeIndex = isBoss ? state.activeBossAttack : state.activePlayerAttack;
  const attack = combatant.attacks[activeIndex];
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
      <label class="check"><input data-terrain="highGround" type="checkbox" ${combatant.terrain.highGround?"checked":""}> High Ground</label>
      <label class="check"><input data-terrain="razorWire" type="checkbox" ${combatant.terrain.razorWire?"checked":""}> Razor Wire</label>
      <label class="check"><input data-terrain="trench" type="checkbox" ${combatant.terrain.trench?"checked":""}> Trench</label>
    </div>
    ${renderModifiers(combatant)}
    ${renderTabs(combatant, activeIndex, side)}
    <div class="section-title">${attack.name}</div>
    ${renderAttack(attack, side)}`;
  bindCombatant(container, combatant, side);
}

function renderModifiers(c) {
  const isSecondArmour = c.modifiers.secondArmourPassNonCrit ? "checked" : "";
  const isMaxVariance = c.modifiers.forceMaxVariance ? "checked" : "";
  const selectedTraits = Array.isArray(c.modifiers.selectedTraits) ? c.modifiers.selectedTraits : [];
  const traitList = selectedTraits.length
    ? selectedTraits.map(value => {
        const trait = TRAIT_TEMPLATES.find(t => t.value === value);
        return `<span class="trait-pill" data-remove-trait="${value}">${trait?.label ?? value} ×</span>`;
      }).join("")
    : `<span class="trait-empty">No traits selected.</span>`;

  return `<div class="modifier-card">
    <div class="section-title">Traits / abilities / modifiers</div>
    <label>Add trait / ability preset <select data-trait-picker>${traitOptions(c.modifiers.template)}</select></label>
    <p class="trait-hint">${traitHint(c.modifiers.template)}</p>
    <div class="actions">
      <button type="button" data-add-trait>Add trait</button>
      <button type="button" data-apply-traits>Apply selected traits</button>
      <button type="button" data-clear-traits>Clear traits</button>
      <button type="button" data-clear-modifiers>Clear modifiers</button>
    </div>
    <div class="trait-list">${traitList}</div>
    <div class="form-grid">
      <label>Outgoing flat damage bonus <input data-modifier="outgoingDamageBonus" type="number" value="${c.modifiers.outgoingDamageBonus}"></label>
      <label>Outgoing damage bonus % <input data-modifier="outgoingDamagePercentBonus" type="number" value="${c.modifiers.outgoingDamagePercentBonus}"></label>
      <label>Outgoing hits bonus <input data-modifier="outgoingHitsBonus" type="number" value="${c.modifiers.outgoingHitsBonus}"></label>
      <label>Incoming pre-armour damage penalty <input data-modifier="incomingPreArmourDamagePenalty" type="number" min="0" value="${c.modifiers.incomingPreArmourDamagePenalty}"></label>
      <label>Incoming armour reduction % <input data-modifier="incomingArmourReductionPercent" type="number" min="0" max="100" value="${c.modifiers.incomingArmourReductionPercent}"></label>
      <label>Incoming hit penalty <input data-modifier="incomingHitPenalty" type="number" min="0" value="${c.modifiers.incomingHitPenalty}"></label>
      <label>Incoming post-armour reduction % <input data-modifier="incomingPostArmourReduction" type="number" min="0" max="100" value="${c.modifiers.incomingPostArmourReduction}"></label>
      <label>Incoming first-hit reduction % <input data-modifier="incomingFirstHitReductionPercent" type="number" min="0" max="100" value="${c.modifiers.incomingFirstHitReductionPercent}"></label>
      <label class="check"><input data-modifier-bool="secondArmourPassNonCrit" type="checkbox" ${isSecondArmour}> Mk X Gravis: second armour pass on non-crits</label>
      <label class="check"><input data-modifier-bool="forceMaxVariance" type="checkbox" ${isMaxVariance}> Weaver of Fates: force max variance</label>
    </div>
    <p class="trait-hint">Disclaimer: “Force max variance” is intended for Weaver of Fates-style effects. “Second armour pass on non-crits” is intended for Mk X Gravis-style effects. Damage-type exclusions and battlefield context are not fully automated.</p>
  </div>`;
}

function renderTabs(combatant, activeIndex, side) {
  return `<div class="tabs">${combatant.attacks.map((a,i)=>`<button class="tab ${i===activeIndex?"active":""}" data-tab="${side}" data-index="${i}">${a.name}${a.enabled||i===0?"":" · off"}</button>`).join("")}</div>`;
}

function renderAttack(a, side) {
  return `<div class="attack-card">
    ${a.name !== "Attack" ? `<label class="check"><input data-attack-enabled type="checkbox" ${a.enabled?"checked":""}> Enable ${a.name}</label>` : ""}
    <div class="form-grid">
      <label>Damage <input data-attack-field="damage" type="number" min="0" value="${a.damage}"></label>
      <label>Hits <input data-attack-field="hits" type="number" min="1" value="${a.hits}"></label>
      <label>Damage Type <select data-attack-field="damageType">${damageOptions(a.damageType)}</select></label>
      <label>Crit Chance % <input data-attack-field="critChance" type="number" min="0" max="100" value="${a.critChance}"></label>
      <label>Crit Damage <input data-attack-field="critDamage" type="number" min="0" value="${a.critDamage}"></label>
    </div>
  </div>`;
}

function bindCombatant(container, combatant, side) {
  container.querySelectorAll("[data-field]").forEach(input => input.addEventListener("input", () => {
    combatant[input.dataset.field] = input.dataset.field.includes("Chance") ? chance(input.value) : n(input.value);
  }));
  container.querySelectorAll("[data-terrain]").forEach(input => input.addEventListener("change", () => {
    const key=input.dataset.terrain; combatant.terrain[key]=input.checked;
    if(key==="trench"&&input.checked) combatant.terrain.razorWire=false;
    if(key==="razorWire"&&input.checked) combatant.terrain.trench=false;
    render();
  }));
  container.querySelectorAll("[data-modifier]").forEach(input => {
    const update=()=>{ const key=input.dataset.modifier; combatant.modifiers[key] = Number(input.value) || 0; };
    input.addEventListener("input", update); input.addEventListener("change", update);
  });
  const picker = container.querySelector("[data-trait-picker]");
  if (picker) {
    picker.addEventListener("change", () => {
      combatant.modifiers.template = picker.value;
      render();
    });
  }
  container.querySelectorAll("[data-modifier-bool]").forEach(input => {
    input.addEventListener("change", () => {
      combatant.modifiers[input.dataset.modifierBool] = input.checked;
      render();
    });
  });
  const addTraitButton = container.querySelector("[data-add-trait]");
  if (addTraitButton) addTraitButton.addEventListener("click", () => { addTrait(combatant, combatant.modifiers.template); render(); });
  const applyTraitsButton = container.querySelector("[data-apply-traits]");
  if (applyTraitsButton) applyTraitsButton.addEventListener("click", () => { applySelectedTraits(combatant); render(); });
  const clearTraitsButton = container.querySelector("[data-clear-traits]");
  if (clearTraitsButton) clearTraitsButton.addEventListener("click", () => { combatant.modifiers.selectedTraits = []; render(); });
  container.querySelectorAll("[data-remove-trait]").forEach(pill => {
    pill.addEventListener("click", () => {
      combatant.modifiers.selectedTraits = (combatant.modifiers.selectedTraits ?? []).filter(value => value !== pill.dataset.removeTrait);
      render();
    });
  });
  const clearButton = container.querySelector("[data-clear-modifiers]");
  if (clearButton) clearButton.addEventListener("click", () => { combatant.modifiers = defaultModifiers(); render(); });
  container.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
    if(button.dataset.tab==="boss") state.activeBossAttack = Number(button.dataset.index);
    else state.activePlayerAttack = Number(button.dataset.index);
    render();
  }));
  const activeIndex = side==="boss" ? state.activeBossAttack : state.activePlayerAttack;
  const attack = combatant.attacks[activeIndex];
  const enabled = container.querySelector("[data-attack-enabled]");
  if(enabled) enabled.addEventListener("change", () => { attack.enabled=enabled.checked; render(); });
  container.querySelectorAll("[data-attack-field]").forEach(input => {
    const update=()=>{ const key=input.dataset.attackField; if(key==="damageType"){attack.damageType=input.value;attack.pierceRatio=getPierceRatio(input.value);} else if(key==="hits") attack.hits=integer(input.value,1); else if(key.includes("Chance")) attack[key]=chance(input.value); else attack[key]=n(input.value); };
    input.addEventListener("input", update); input.addEventListener("change", update);
  });
}

function validate() {
  const msgs=[];
  if(state.player.attacks.filter(a=>a.enabled).every(a=>a.damage<=0)) msgs.push("At least one enabled player attack should have damage greater than 0.");
  state.boss.attacks.filter(a=>a.enabled).forEach(a=>{ if(a.damage<=0) msgs.push(`${a.name} damage should be greater than 0.`); });
  el.validation.innerHTML = msgs.length ? msgs.map(m=>`<div>${m}</div>`).join("") : `<div class="ok">Ready.</div>`;
  return !msgs.length;
}

function run() {
  const rolls=Math.min(100,integer(el.rollCount.value,1)); el.rollCount.value=rolls; validate();
  const res=[];
  if (el.calcPlayerToBoss.checked) {
    state.player.attacks.filter(a=>a.enabled).forEach(a=>res.push({direction:"Player → Boss",...analyseAttack(state.player,state.boss,a,"playerToBoss",rolls)}));
  }
  if (el.calcBossToPlayer.checked) {
    state.boss.attacks.filter(a=>a.enabled).forEach(a=>res.push({direction:"Boss → Player",...analyseAttack(state.boss,state.player,a,"bossToPlayer",rolls)}));
  }
  state.results=res; renderResults(); renderLog(); renderChart();
}

function renderResults() {
  if(!state.results.length) { el.results.innerHTML=`<p class="hint">Enter stats, choose calculation direction, and press Calculate.</p>`; return; }
  el.results.innerHTML=state.results.map(r=>`<div class="result-group"><h3>${r.direction}: ${r.name}</h3><div class="results-grid">${["expected","minimum","maximum","simulationAverage","lowest","highest"].map(k=>`<div class="metric"><span>${k}</span><strong>${fmt(r[k])}</strong></div>`).join("")}<div class="metric"><span>Crit hits</span><strong>${r.crits}</strong></div><div class="metric"><span>Blocked hits</span><strong>${r.blocks}</strong></div></div></div>`).join("");
}

function renderLog() {
  if(!el.showLog.checked||!state.results.length) { el.log.innerHTML=`<p class="hint">Combat log hidden.</p>`; return; }
  const full=el.fullLog.checked;
  el.log.innerHTML=state.results.map(r=>{ const rolls=full?r.logs:[r.logs[0]??[]]; const blocks=rolls.map((roll,idx)=>{ const total=r.simulations[idx]??0; const lines=roll.map(h=>`  Hit ${h.hit}: roll ${(h.variance*100).toFixed(1)}% | crit ${h.crit?"yes":"no"} | block ${h.block?"yes":"no"} | damage ${fmt(h.damage)}`).join("\n"); return `Roll ${idx+1} | total ${fmt(total)}\n${lines||"  No hits."}`; }).join("\n\n"); return `<div class="log-entry">${r.direction}: ${r.name}\n${blocks}</div>`; }).join("");
}

function buckets(v) {
  const min=Math.min(...v), max=Math.max(...v), count=8, b=Array.from({length:count},()=>0);
  v.forEach(x=>{ const idx=max===min?0:Math.min(count-1,Math.floor(((x-min)/(max-min))*count)); b[idx]++; });
  return b.map((count,i)=>({label:`${fmt(min+((max-min)/8)*i)}–${fmt(min+((max-min)/8)*(i+1))}`,count}));
}

function renderChart() {
  if(!el.showChart.checked||!state.results.length) { el.chartCanvas.style.display="none"; el.fallback.innerHTML=`<p class="hint">Chart hidden.</p>`; if(state.chart){state.chart.destroy();state.chart=null;} return; }
  const playerResult=state.results.find(r=>r.direction==="Player → Boss");
  if (!playerResult) {
    el.chartCanvas.style.display="none";
    el.fallback.innerHTML=`<p class="hint">Chart uses Player → Boss simulation data. Enable Player → Boss to show it.</p>`;
    if(state.chart){state.chart.destroy();state.chart=null;}
    return;
  }
  el.chartCanvas.style.display="block"; const data=buckets(playerResult.simulations); el.fallback.innerHTML="";
  if(window.Chart) { if(state.chart) state.chart.destroy(); state.chart=new Chart(el.chartCanvas,{type:"bar",data:{labels:data.map(d=>d.label),datasets:[{label:"Rolls",data:data.map(d=>d.count)}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#bbb5a8"}},y:{ticks:{color:"#bbb5a8",precision:0}}}}}); }
}

function encounter() { return {type:"encounter",version:"1.5",player:state.player,boss:state.boss}; }
function playerOnly() { return {type:"player",version:"1.5",player:state.player}; }
function bossOnly() { return {type:"boss",version:"1.5",boss:state.boss}; }
function hydrateEncounter(d) { state.player=Combatant.from(d?.player??{},"Player"); state.boss=Combatant.from(d?.boss??{},"Boss"); state.activePlayerAttack=0; state.activeBossAttack=0; state.results=[]; render(); }
function hydratePlayer(d) { state.player=Combatant.from(d?.player??d??{},"Player"); state.activePlayerAttack=0; state.results=[]; render(); }
function hydrateBoss(d) { state.boss=Combatant.from(d?.boss??d??{},"Boss"); state.activeBossAttack=0; state.results=[]; render(); }
function importData(d) { if(d?.type==="player"||(d?.player&&!d?.boss)) return hydratePlayer(d); if(d?.type==="boss"||(d?.boss&&!d?.player)) return hydrateBoss(d); hydrateEncounter(d); }
function renderPresetList() { const p=getPresets(); const names=Object.keys(p).sort(); el.presetSelect.innerHTML=names.length?names.map(x=>`<option value="${x}">${x}</option>`).join(""):`<option value="">No presets saved</option>`; }
function resultsAsText() { if(!state.results.length) return "No results calculated yet."; return state.results.map(r=>[`${r.direction}: ${r.name}`,`Expected: ${fmt(r.expected)}`,`Minimum: ${fmt(r.minimum)}`,`Maximum: ${fmt(r.maximum)}`,`Simulation average: ${fmt(r.simulationAverage)}`,`Lowest roll: ${fmt(r.lowest)}`,`Highest roll: ${fmt(r.highest)}`,`Crit hits: ${r.crits}`,`Blocked hits: ${r.blocks}`].join("\n")).join("\n\n"); }
function render() { renderCombatant(el.player,state.player,"player"); renderCombatant(el.boss,state.boss,"boss"); renderResults(); renderPresetList(); if(!state.results.length){el.log.innerHTML=`<p class="hint">No combat log yet.</p>`; el.fallback.innerHTML=`<p class="hint">No chart yet.</p>`;} }

el.calculate.addEventListener("click",run); el.roll.addEventListener("click",run); el.showLog.addEventListener("change",renderLog); el.fullLog.addEventListener("change",renderLog); el.showChart.addEventListener("change",renderChart);
el.copy.addEventListener("click",async()=>{ const text=resultsAsText(); try{await navigator.clipboard.writeText(text); alert("Results copied to clipboard.");}catch{prompt("Copy results:",text);} });
el.save.addEventListener("click",()=>{ const name=el.presetName.value.trim()||prompt("Preset name?"); if(!name)return; savePreset(name,encounter()); el.presetName.value=""; renderPresetList(); alert(`Preset saved: ${name}`); });
el.load.addEventListener("click",()=>{ const name=el.presetSelect.value; if(!name)return alert("No preset selected."); const d=loadPreset(name); if(!d)return alert("Preset not found."); hydrateEncounter(d); });
el.deletePreset.addEventListener("click",()=>{ const name=el.presetSelect.value; if(!name)return; if(confirm(`Delete preset "${name}"?`)){ deletePreset(name); renderPresetList(); } });
el.clear.addEventListener("click",()=>{ if(confirm("Clear all named presets and reset the app?")){ clearAllPresets(); location.reload(); } });
el.exportEncounter.addEventListener("click",()=>downloadJson("tacticus-encounter.json",encounter()));
el.exportPlayer.addEventListener("click",()=>downloadJson("tacticus-player.json",playerOnly()));
el.exportBoss.addEventListener("click",()=>downloadJson("tacticus-boss.json",bossOnly()));
el.import.addEventListener("change",async()=>{ const file=el.import.files[0]; if(!file)return; try{importData(JSON.parse(await file.text()));}catch{alert("Could not import that JSON file.");} el.import.value=""; });


async function loadGameDataFoundation() {
  if (!el.dataStatus || !el.dataSummary) return;
  try {
    const response = await fetch("./assets/data/tacticus-game-data.json?v=1.5");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const counts = data.meta?.counts || {};
    el.dataStatus.textContent = "Local Tacticus data loaded. Character selectors will be built on this foundation in the next feature pass.";
    el.dataSummary.innerHTML = [
      ["Characters", counts.characters],
      ["Machine of War / boss-like records", counts.machineOfWar],
      ["Progression steps", counts.progressionSteps],
      ["Upgrades", counts.upgrades],
      ["Items", counts.items],
      ["Abilities", counts.abilities],
      ["Damage profiles", counts.damageProfiles]
    ].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value ?? "—"}</strong></div>`).join("");
    window.TACTICUS_GAME_DATA = data;
  } catch (error) {
    console.error(error);
    el.dataStatus.textContent = "Could not load local game data: " + error.message;
  }
}

try { render(); loadGameDataFoundation(); } catch(error) { console.error(error); const box=document.querySelector("#startupError"); if(box){box.hidden=false;box.textContent="App startup failed: "+error.message;} }
})();
