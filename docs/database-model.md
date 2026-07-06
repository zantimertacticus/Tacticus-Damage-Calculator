# Database Model

v1.7 introduces the first database-driven character model.

Entity selection model:

```json
{
  "mode": "database",
  "characterId": "ultraCalgar",
  "rankIndex": 12,
  "appliedUpgrades": [false, false, false, false, false, false]
}
```

Manual mode remains available for custom scenarios.

## Upgrade rule

The rank selector and upgrade toggles are independent.

Applying all six upgrades does not change rank. Changing rank resets the displayed rank context only; it should not imply promotion unless the user explicitly changes rank.
