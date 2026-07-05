import { deterministicAttack, minAttack, maxAttack, rollAttack } from "./combat.js";

export function analyseAttack(attacker, defender, attack, mode, rolls = 100) {
  const expected = deterministicAttack(attacker, defender, attack, mode);
  const minimum = minAttack(attacker, defender, attack, mode);
  const maximum = maxAttack(attacker, defender, attack, mode);

  const simulations = [];
  let crits = 0;
  let blocks = 0;
  const logs = [];

  for (let i = 0; i < rolls; i++) {
    const result = rollAttack(attacker, defender, attack, mode);
    simulations.push(result.total);
    crits += result.crits;
    blocks += result.blocks;
    logs.push(result.log);
  }

  const simulationAverage = simulations.reduce((a,b) => a + b, 0) / simulations.length;

  return {
    name: attack.name,
    expected,
    minimum,
    maximum,
    simulationAverage,
    lowest: Math.min(...simulations),
    highest: Math.max(...simulations),
    crits,
    blocks,
    simulations,
    logs
  };
}
