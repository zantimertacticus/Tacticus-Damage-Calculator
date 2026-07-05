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

            new Attack("Attack"),

            new Attack("Ability 1"),

            new Attack("Ability 2"),

            new Attack("Ability 3")

        ];

    }

    getAttack(index) {

        return this.attacks[index];

    }

}
