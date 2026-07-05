import { DAMAGE_TYPES } from "../data/damageTypes.js";

export function createAttackEditor(attack) {

    const wrapper = document.createElement("div");

    wrapper.className = "attack-editor";

    wrapper.dataset.attackId = attack.id;

    wrapper.innerHTML = `

        <div class="attack-header">

            <label class="attack-enabled">

                <input
                    type="checkbox"
                    class="attack-enabled-checkbox"
                    ${attack.enabled ? "checked" : ""}>

                Enable ${attack.name}

            </label>

        </div>

        <div class="form-grid">

            <label>

                Damage

                <input
                    class="attack-damage"
                    type="number"
                    min="0"
                    value="${attack.damage}">

            </label>

            <label>

                Hits

                <input
                    class="attack-hits"
                    type="number"
                    min="1"
                    value="${attack.hits}">

            </label>

            <label>

                Damage Type

                <select class="attack-damage-type">

                    ${createDamageTypeOptions(attack.damageType)}

                </select>

            </label>

            <label>

                Crit Chance

                <input
                    class="attack-crit-chance"
                    type="number"
                    min="0"
                    max="100"
                    value="${attack.critChance}">

            </label>

            <label>

                Crit Damage

                <input
                    class="attack-crit-damage"
                    type="number"
                    min="0"
                    value="${attack.critDamage}">

            </label>

        </div>

    `;

    return wrapper;

}

function createDamageTypeOptions(selected) {

    return DAMAGE_TYPES.map(type => {

        return `
            <option
                value="${type.name}"
                ${selected === type.name ? "selected" : ""}>
                ${type.name}
            </option>
        `;

    }).join("");

}
