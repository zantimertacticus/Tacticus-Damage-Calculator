# Tacticus Combat Simulator

v1.7

Unofficial Fan Tool, made by zantimer.

## New in v1.7

- Added the first database-driven character selector.
- Player and Boss can now be switched between:
  - Manual mode
  - Game data mode
- Game data mode can load:
  - Character name
  - Base HP
  - Base Damage
  - Base Armour
  - Weapons / hits / damage profile
  - Traits
  - Active abilities
  - Passive abilities
  - Upgrade slot IDs
  - Upgrade stat increases
- Added gear-rank selector.
- Added six independent upgrade-slot toggles.
- Applying all six upgrades does **not** auto-rank the character.
- Keeps future encounter model space for Boss + two bodyguards/adjutants.

## Progression rule

Characters enter each gear rank with all six upgrade slots unapplied.

Each slot is independent. The user decides which upgrades are applied.

A character does not automatically move to the next rank when all six upgrades are applied.

## Data

The simulator uses a local database generated from extracted game configuration data.

All calculations run locally in the browser.
