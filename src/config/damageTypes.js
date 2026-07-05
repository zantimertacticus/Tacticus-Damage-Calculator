/**
 * Damage types and pierce ratios.
 */

export const DAMAGE_TYPES = [

    { name: "Bio", pierce: 0.30 },
    { name: "Blast", pierce: 0.15 },
    { name: "Bolter", pierce: 0.20 },
    { name: "Chain", pierce: 0.20 },
    { name: "Direct", pierce: 1.00 },
    { name: "Energy", pierce: 0.30 },
    { name: "Eviscerating", pierce: 0.50 },
    { name: "Flame", pierce: 0.25 },
    { name: "Heavy Round", pierce: 0.55 },
    { name: "Las", pierce: 0.10 },
    { name: "Melta", pierce: 0.75 },
    { name: "Molecular", pierce: 0.60 },
    { name: "Particle", pierce: 0.35 },
    { name: "Physical", pierce: 0.01 },
    { name: "Piercing", pierce: 0.80 },
    { name: "Plasma", pierce: 0.65 },
    { name: "Power", pierce: 0.40 },
    { name: "Projectile", pierce: 0.15 },
    { name: "Psychic", pierce: 1.00 },
    { name: "Pulse", pierce: 0.20 },
    { name: "Toxic", pierce: 0.70 }

];

export function getPierceRatio(name) {

    const damageType = DAMAGE_TYPES.find(
        d => d.name === name
    );

    return damageType ? damageType.pierce : 0;

}
