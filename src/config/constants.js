/**
 * Tacticus Damage Simulator
 * Version 0.1
 *
 * Global application constants.
 */

export const APP = {
    NAME: "Tacticus Damage Simulator",
    VERSION: "0.1.0"
};

export const DAMAGE_VARIANCE = {
    MIN: 0.80,
    AVG: 1.00,
    MAX: 1.20
};

export const SIMULATION = {
    DEFAULT_ROLLS: 100,
    MIN_ROLLS: 1,
    MAX_ROLLS: 100
};

export const TERRAIN = {
    NONE: 0,
    HIGH_GROUND: 0.50,
    RAZOR_WIRE: 0.50,
    TRENCH: -0.50
};

export const ATTACK_TYPES = {
    NORMAL: "Attack",
    ABILITY_1: "Ability 1",
    ABILITY_2: "Ability 2",
    ABILITY_3: "Ability 3"
};

export const STORAGE_KEYS = {
    PLAYER: "tds_player",
    BOSSES: "tds_bosses",
    SETTINGS: "tds_settings"
};
