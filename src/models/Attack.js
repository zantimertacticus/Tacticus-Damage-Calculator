import { getPierceRatio } from "../data/damageTypes.js";

export default class Attack {
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

  setDamageType(type) {
    this.damageType = type;
    this.pierceRatio = getPierceRatio(type);
  }
}
