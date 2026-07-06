# Data model foundation — v1.5

This version adds a local database generated from the game configuration API exports.

## Added files

```text
assets/data/tacticus-game-data.json
assets/data/character-index.json
assets/data/raw/characters.json
assets/data/raw/progression.json
assets/data/raw/upgrades.json
assets/data/raw/items.json
assets/data/raw/abilities.json
assets/data/raw/damageProfiles.json
tools/build-data-bundle.js
docs/data-summary.json
```

## Current counts

```json
{
  "characters": 123,
  "machineOfWar": 11,
  "progressionSteps": 20,
  "upgrades": 558,
  "items": 212,
  "abilities": 559,
  "damageProfiles": 22,
  "uniqueTraits": 43
}
```

## Future combatant instance shape

```json
{
  "sourceType": "character | boss | adjutant | manual",
  "characterId": "ultraCalgar",
  "rarityStep": 12,
  "rankIndex": 12,
  "equippedUpgradeSlots": [true, true, true, true, true, true],
  "selectedWeaponIndex": 0,
  "abilityLevels": {},
  "manualModifiers": {}
}
```

## Future boss encounter shape

```json
{
  "playerTeam": [null, null, null, null, null],
  "enemySide": {
    "boss": null,
    "adjutants": [null, null]
  }
}
```

This leaves explicit space for one boss plus two boss-side support units.
