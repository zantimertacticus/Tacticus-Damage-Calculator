# Tacticus Combat Simulator

v1.6

Unofficial Fan Tool, made by zantimer.

## New in v1.6

- Preserves the local game configuration data bundle foundation from v1.5.
- Keeps future model space for Boss + two bodyguards/adjutants.
- Adds the progression rule for future character selectors:
  - When a character enters a rank, all six upgrade slots start unapplied.
  - Each of the six upgrades can be toggled independently.
  - A character does not have to be promoted to the next rank just because all six upgrades are applied.

## Direction

This project is now treated as a combat simulator rather than only a damage calculator.

Planned next major work:
- Character dropdowns.
- Rarity and gear-rank selectors.
- Six independent upgrade-slot toggles per rank.
- Automatic stat calculation from extracted game configuration data.
- Boss encounter model with Boss + Bodyguard 1 + Bodyguard 2.

## Data

The simulator uses a local database generated from extracted game configuration data.

All calculations are performed locally in the browser.
