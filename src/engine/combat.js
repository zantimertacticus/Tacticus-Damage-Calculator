import { DAMAGE_VARIANCE, TERRAIN } from "../config/constants.js";

function percent(value) {
  const n = Number(value) || 0;
  return Math.max(0, Math.min(100, n)) / 100;
}

function terrainMultiplier(attackerTerrain, defenderTerrain, mode) {
  let mod = 0;

  if (mode === "playerToBoss") {
    if (attackerTerrain.highGround) mod += TERRAIN.HIGH_GROUND;
  } else {
    if (attackerTerrain.highGround) mod += TERRAIN.HIGH_GROUND;
    if (defenderTerrain.trench) {
      mod += TERRAIN.TRENCH;
    } else {
      if (defenderTerrain.razorWire) mod += TERRAIN.RAZOR_WIRE;
    }
  }

  return Math.max(0, 1 + mod);
}

function damageAfterArmour(effectiveDamage, variance, defenderArmour, pierceRatio) {
  const damVarMod = effectiveDamage * variance;
  return Math.max(damVarMod - defenderArmour, damVarMod * pierceRatio);
}

function hitDamage({ attack, attacker, defender, variance, crit, block, mode }) {
  const base = crit ? attack.damage + attack.critDamage : attack.damage;
  const pierced = damageAfterArmour(base, variance, defender.armour, attack.pierceRatio);
  const terrainAdjusted = pierced * terrainMultiplier(attacker.terrain, defender.terrain, mode);
  return Math.max(0, block ? terrainAdjusted - defender.blockDamage : terrainAdjusted);
}

export function deterministicAttack(attacker, defender, attack, mode, variance = DAMAGE_VARIANCE.AVG) {
  const critChance = percent(attack.critChance);
  const blockChance = percent(defender.blockChance);
  let total = 0;

  for (let i = 0; i < attack.hits; i++) {
    const normalNoBlock = hitDamage({ attack, attacker, defender, variance, crit:false, block:false, mode });
    const normalBlock = hitDamage({ attack, attacker, defender, variance, crit:false, block:true, mode });
    const critNoBlock = hitDamage({ attack, attacker, defender, variance, crit:true, block:false, mode });
    const critBlock = hitDamage({ attack, attacker, defender, variance, crit:true, block:true, mode });

    const normalExpected = (1 - blockChance) * normalNoBlock + blockChance * normalBlock;
    const critExpected = (1 - blockChance) * critNoBlock + blockChance * critBlock;
    total += (1 - critChance) * normalExpected + critChance * critExpected;
  }

  return total;
}

export function minAttack(attacker, defender, attack, mode) {
  let total = 0;
  for (let i = 0; i < attack.hits; i++) {
    total += hitDamage({
      attack, attacker, defender,
      variance: DAMAGE_VARIANCE.MIN,
      crit: false,
      block: true,
      mode
    });
  }
  return total;
}

export function maxAttack(attacker, defender, attack, mode) {
  let total = 0;
  for (let i = 0; i < attack.hits; i++) {
    total += hitDamage({
      attack, attacker, defender,
      variance: DAMAGE_VARIANCE.MAX,
      crit: true,
      block: false,
      mode
    });
  }
  return total;
}

export function rollAttack(attacker, defender, attack, mode) {
  let total = 0;
  let crits = 0;
  let blocks = 0;
  const log = [];

  for (let i = 0; i < attack.hits; i++) {
    const variance = DAMAGE_VARIANCE.MIN + Math.random() * (DAMAGE_VARIANCE.MAX - DAMAGE_VARIANCE.MIN);
    const crit = Math.random() < percent(attack.critChance);
    const block = Math.random() < percent(defender.blockChance);
    if (crit) crits++;
    if (block) blocks++;

    const damage = hitDamage({ attack, attacker, defender, variance, crit, block, mode });
    total += damage;

    log.push({
      hit: i + 1,
      variance,
      crit,
      block,
      damage
    });
  }

  return { total, crits, blocks, log };
}
