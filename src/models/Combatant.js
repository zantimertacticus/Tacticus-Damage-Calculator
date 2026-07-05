import Attack from "./Attack.js";

export default class Combatant {

    constructor(name = "") {

        this.name = name;

        this.health = 0;

        this.armour = 0;

        this.blockChance = 0;

        this.blockDamage = 0;

        this.terrain = {

            trench: false,

            razorWire: false,

            highGround: false

        };

this.attacks = [

    new Attack("Attack", true),

    new Attack("Ability 1", false),

    new Attack("Ability 2", false),

    new Attack("Ability 3", false)

];

    }

    getAttack(index) {

        return this.attacks[index];

    }

}
