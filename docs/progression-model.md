# Progression Model

Each character/boss entity should eventually be represented as:

```json
{
  "entityId": "character-id",
  "rarity": "Rare",
  "rank": "Silver I",
  "appliedUpgrades": [false, false, false, false, false, false]
}
```

Important rule:

Characters start a rank with all six upgrades unapplied.

The six upgrades are independent toggles. Applying all six upgrades should not automatically promote the character to the next rank unless the user explicitly changes the rank.
