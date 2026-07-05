export default class Attack {

    constructor(name = "Attack") {

        this.name = name;

        this.damage = 0;

        this.hits = 1;

        this.damageType = "Physical";

        this.critChance = 0;

        this.critDamage = 0;

    }

    clone() {

        return structuredClone(this);

    }

}
