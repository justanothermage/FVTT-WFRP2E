// import { RollDialog } from "./roll-dialog.mjs";

export class SpellCastingDialog extends Dialog {
    constructor(actor, spell, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.actor = actor;
        this.spell = spell;
        this.magicDice = 1;
        this.channellingSuccess = false;
        this.ingredientUsed = false;
        this.miscModifier = 0;
        this.windDice = 0;
        this.miscastDice = 0;
    }

    static async create(actor, spell) {
        const magicStat = actor.system.secondary.magic.current;
        
        // Build magic dice dropdown options
        let magicDiceOptions = '';
        for (let i = 1; i <= magicStat; i++) {
            magicDiceOptions += `<option value="${i}">${i}</option>`;
        }

        const html = `
            <form>
                <div class="spell-casting-form">
                    <div class="form-group">
                        <label>Spell:</label>
                        <input type="text" value="${spell.name}" readonly/>
                    </div>
                    <div class="form-group">
                        <label>Casting Number:</label>
                        <input type="number" value="${spell.system.castNumber}" readonly/>
                    </div>
                    <div class="form-group">
                        <label>Magic Dice (Max: ${magicStat}):</label>
                        <select name="magicDice">
                            ${magicDiceOptions}
                        </select>
                    </div>
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="channelling"/>
                            Channelling Test Succeeded (+${magicStat})
                        </label>
                    </div>
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="ingredient"/>
                            Ingredient Used (+${spell.system.ingredientBonus})
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Misc Modifier:</label>
                        <input type="number" name="miscModifier" value="0"/>
                    </div>
                    <div class="form-group">
                        <label>Wind Dice (d10):</label>
                        <input type="number" name="windDice" value="0" min="0"/>
                    </div>
                    <div class="form-group">
                        <label>Miscast Dice (d10):</label>
                        <input type="number" name="miscastDice" value="0" min="0"/>
                    </div>
                </div>
            </form>
        `;

        return new Promise((resolve) => {
            const dialog = new SpellCastingDialog(actor, spell, {
                title: `Cast ${spell.name}`,
                content: html,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Cast Spell",
                        callback: (html) => {
                            dialog.magicDice = parseInt(html.find('[name="magicDice"]').val());
                            dialog.channellingSuccess = html.find('[name="channelling"]').is(':checked');
                            dialog.ingredientUsed = html.find('[name="ingredient"]').is(':checked');
                            dialog.miscModifier = parseInt(html.find('[name="miscModifier"]').val()) || 0;
                            dialog.windDice = parseInt(html.find('[name="windDice"]').val()) || 0;
                            dialog.miscastDice = parseInt(html.find('[name="miscastDice"]').val()) || 0;
                            resolve(dialog);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                close: () => resolve(null)
            });
            dialog.render(true);
        });
    }

    async executeCast() {
        const magicStat = this.actor.system.secondary.magic.current;

        // Roll magic dice
        const magicRolls = [];
        for (let i = 0; i < this.magicDice; i++) {
            const roll = new Roll("1d10");
            await roll.evaluate();
            magicRolls.push(roll.total);
        }

        // Roll wind dice
        const windRolls = [];
        for (let i = 0; i < this.windDice; i++) {
            const roll = new Roll("1d10");
            await roll.evaluate();
            windRolls.push(roll.total);
        }

        // Roll miscast dice
        const miscastRolls = [];
        for (let i = 0; i < this.miscastDice; i++) {
            const roll = new Roll("1d10");
            await roll.evaluate();
            miscastRolls.push(roll.total);
        }

        // Calculate casting total
        let castingTotal = magicRolls.reduce((sum, val) => sum + val, 0);
        castingTotal += windRolls.reduce((sum, val) => sum + val, 0);
        
        if (this.channellingSuccess) {
            castingTotal += magicStat;
        }
        if (this.ingredientUsed) {
            castingTotal += this.spell.system.ingredientBonus;
        }
        castingTotal += this.miscModifier;

        // Check for success
        const targetNumber = this.spell.system.castNumber;
        const isSuccess = castingTotal >= targetNumber;

        // Check for all 1s in magic dice
        const allOnes = magicRolls.every(die => die === 1) && magicRolls.length > 0;

        // Check for miscast (doubles, triples, quadruples)
        const allDice = [...magicRolls, ...windRolls, ...miscastRolls];
        const miscastInfo = this._checkForMiscast(allDice);

        // Handle damage rolls if spell has attacks 
        let damageResults = null;
        if (isSuccess && this.spell.system.attacks && this.spell.system.attacks !== "None") {
            const numAttacks = await this._parseAttacksValue(this.spell.system.attacks, magicStat);
            if (numAttacks > 0) {
                damageResults = await this._rollSpellDamage(numAttacks);
            }
        }

        // Handle damage rolls if spell has attacks
        let healingResults = null;
        if (isSuccess && this.spell.system.healing && this.spell.system.healing !== "None") {
            healingResults = await this._calculateHealing();
        }

        // Create chat message
        await this._createChatMessage({
            magicRolls,
            windRolls,
            miscastRolls,
            castingTotal,
            targetNumber,
            isSuccess,
            allOnes,
            miscastInfo,
            channellingBonus: this.channellingSuccess ? magicStat : 0,
            ingredientBonus: this.ingredientUsed ? this.spell.system.ingredientBonus : 0,
            miscModifier: this.miscModifier,
            damageResults: damageResults,
            healingResults: healingResults
        });

        // If all 1s, prompt WP test
        if (allOnes) {
            await this._promptWillpowerTest();
        }
    }

    _checkForMiscast(dice) {
        if (dice.length === 0) return { isMiscast: false };

        // Count occurrences of each die value
        const counts = {};
        dice.forEach(die => {
            counts[die] = (counts[die] || 0) + 1;
        });

        // Find highest matching set
        const matches = [];
        
        for (let [value, count] of Object.entries(counts)) {
            if (count >= 4) {
                matches.push({
                    type: 'Quadruples',
                    value: parseInt(value),
                    count: count
                });
            }
            else if (count >= 3) {
                matches.push({
                    type: 'Triples',
                    value: parseInt(value),
                    count: count
                });
            }
            else if (count >= 2) {
                matches.push({
                    type: 'Doubles',
                    value: parseInt(value),
                    count: count
                });
            }
        }

        if (matches.length > 0) {
            return {
                isMiscast: true,
                matches: matches
            };
        }

        return { isMiscast: false };
    }

    /*async _promptWillpowerTest() {
        // Use the existing RollDialog for WP test
        const dialog = await RollDialog.create(
            this.actor,
            'wp',
            'WP',
            this.actor.system.characteristics.wp.current,
            "Resist Insanity"
        );

        if (dialog) {
            await dialog.executeRoll();
        }
    }*/

    async _createChatMessage(data) {
        // Build dice breakdown
        let diceBreakdown = `<div class="dice-breakdown">`;
        
        // Magic dice
        diceBreakdown += `<div class="dice-group">
            <strong>Magic Dice (${data.magicRolls.length}):</strong> 
            ${data.magicRolls.map(d => `<span class="die-result">${d}</span>`).join(' ')}
        </div>`;

        // Wind dice
        if (data.windRolls.length > 0) {
            diceBreakdown += `<div class="dice-group">
                <strong>Wind Dice (${data.windRolls.length}):</strong> 
                ${data.windRolls.map(d => `<span class="die-result wind">${d}</span>`).join(' ')}
            </div>`;
        }

        // Miscast dice
        if (data.miscastRolls.length > 0) {
            diceBreakdown += `<div class="dice-group">
                <strong>Miscast Dice (${data.miscastRolls.length}):</strong> 
                ${data.miscastRolls.map(d => `<span class="die-result miscast">${d}</span>`).join(' ')}
            </div>`;
        }

        diceBreakdown += `</div>`;

        // Build modifiers breakdown
        let modifiersBreakdown = `<div class="modifiers-breakdown">`;
        if (data.channellingBonus > 0) {
            modifiersBreakdown += `<div>Channelling: +${data.channellingBonus}</div>`;
        }
        if (data.ingredientBonus > 0) {
            modifiersBreakdown += `<div>Ingredient: +${data.ingredientBonus}</div>`;
        }
        if (data.miscModifier !== 0) {
            modifiersBreakdown += `<div>Misc: ${data.miscModifier >= 0 ? '+' : ''}${data.miscModifier}</div>`;
        }
        modifiersBreakdown += `</div>`;

        // Determine outcome
        let outcome = '';
        let outcomeClass = '';
        
        if (data.allOnes) {
            outcome = 'CATASTROPHIC FAILURE - WP Test Required!';
            outcomeClass = 'catastrophic-failure';
        } else if (data.isSuccess) {
            outcome = 'Spellcasting Succeeds';
            outcomeClass = 'success';
        } else {
            outcome = 'Spellcasting Fails';
            outcomeClass = 'failure';
        }

        // Miscast warning
        let miscastWarning = '';
        if (data.miscastInfo.isMiscast) {
            const matchDescriptions = data.miscastInfo.matches.map(match =>
                `${match.type} (${match.count}x ${match.value})`
            ).join(', ');
            miscastWarning = `<div class="miscast-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>MISCAST!</strong> ${matchDescriptions}
                </div>`;
        }
        
        // Build damage breakdown if applicable
        let damageBreakdown = '';
        if (data.damageResults && data.damageResults.length > 0) {
            damageBreakdown = `<div class="damage-section">
                <h4>Spell Damage</h4>`;

            data.damageResults.forEach((attack, index) => {
                damageBreakdown += `<div class="damage-attack">
                    <div class="hit-location-info">
                        <strong>Hit ${index + 1}:</strong> ${attack.hitLocation} (rolled ${attack.locationRoll})
                    </div>
                    <div class="damage-total">Total Damage: <strong>${attack.totalDamage}</strong></div>
                    <div class="damage-breakdown-detail">`;
                
                    attack.damageRolls.forEach((roll, rollIndex) => {
                    if (!roll.isFury) {
                        damageBreakdown += `<div>Initial: 1d10(${roll.die})`;
                        if (this.spell.system.damage && this.spell.system.damage !== "None") {
                            if (this.spell.system.damage === "Magic") {
                                const magicValue = this.actor.system.secondary.magic.current;
                                damageBreakdown += ` + Magic(${magicValue})`;
                            } else if (this.spell.system.damage === "1d10" && roll.bonusRoll !== null) {
                                damageBreakdown += ` + 1d10(${roll.bonusRoll})`;
                            } else {
                                const bonusValue = parseInt(this.spell.system.damage);
                                damageBreakdown += ` + ${bonusValue}`;
                            }
                        }
                        damageBreakdown += ` = ${roll.total}</div>`;
                    } else {
                        damageBreakdown += `<div class="fury-roll">Ulric's Fury: +${roll.die} damage</div>`;
                    }
                });

                damageBreakdown += `</div>`;

                if (attack.ulricsFuryTriggered) {
                    damageBreakdown += `<div class="fury-indicator-small"><i class="fas fa-fire"></i> Ulric's Fury!</div>`;
                }

                damageBreakdown += `</div>`;
            });

            damageBreakdown += `</div>`;

        }

        let healingBreakdown = '';
        if (data.healingResults) {
            healingBreakdown = `<div class="healing-section">
                <h4>Healing: ${data.healingResults.total} HP</h4>
                <div class="healing-breakdown">`;

            data.healingResults.breakdown.forEach(item => {
                if (item.type === "flat") {
                    healingBreakdown += `<div>Flat Healing: ${item.value}</div>`;
                } else if (item.type === "magic") {
                    healingBreakdown += `<div>Magic Stat: ${item.value}</div>`;
                } else if (item.type === "roll") {
                    healingBreakdown += `<div>1d10: (${item.die}) = ${item.value}</div>`;
                } else if (item.type === "roll_plus_magic") {
                    healingBreakdown += `<div>1d10(${item.die}) + Magic(${item.magic}) = ${item.value}</div>`;
                }
            });

            healingBreakdown += `</div></div>`;
        }


        // Final message content
        const messageContent = `
            <div class="wfrp-roll spell-cast">
                <div class="spell-header">
                    <div class="actor-name">${this.actor.name}</div>
                    <div class="spell-name">${this.spell.name}</div>
                    <div class="spell-details">
                        ${this.spell.system.castTime} • ${this.spell.system.range}<br/>
                        ${this.spell.system.ingredient || 'No ingredient'}<br/>
                        ${this.spell.system.duration} • ${this.spell.system.target}
                    </div>
                </div>
                
                <div class="casting-result">
                    <div class="target-number">
                        <label>Target Number</label>
                        <div class="value">${data.targetNumber}</div>
                    </div>
                    <div class="casting-total">
                        <label>Casting Total</label>
                        <div class="value ${data.isSuccess ? 'success' : 'failure'}">${data.castingTotal}</div>
                    </div>
                </div>

                ${diceBreakdown}
                ${modifiersBreakdown}
                
                <div class="outcome ${outcomeClass}">
                    ${outcome}
                </div>

                ${miscastWarning}

                ${damageBreakdown}

                ${healingBreakdown}
                
                <div class="spell-effects">
                    ${this.spell.system.damage && !data.damageResults ? `<div><strong>Damage:</strong> ${this.spell.system.damage}</div>` : ''}
                    ${this.spell.system.healing && !data.healingResults ? `<div><strong>Healing:</strong> ${this.spell.system.healing}</div>` : ''}
                    ${this.spell.system.attacks && !data.damageResults ? `<div><strong>Attacks:</strong> ${this.spell.system.attacks}</div>` : ''}
                </div>

                ${data.isSuccess ? `<div class="spell-description">${await TextEditor.enrichHTML(this.spell.system.description, {async: true})}</div>` : ''}
            </div>
        `;

        const messageData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: messageContent,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        };

        await ChatMessage.create(messageData);
    }

    // Parse attacks value
    async _parseAttacksValue(attacksValue, magicStat) {
        if (!attacksValue || attacksValue === "None") {
            return 0;
        }

        // Handle "Magic" 
        if (attacksValue === "Magic") {
            return magicStat;
        }

        // Handle "1d10"
        if (attacksValue === "1d10") {
            const roll = new Roll("1d10");
            await roll.evaluate();
            return roll.total;
        }

        // Handle numeric values 
        const num = parseInt(attacksValue);
        if(!isNaN(num)) {
            return num;
        }

        return 0; // Default fallback
    }

    // Roll spell damage based on number of attacks
    async _rollSpellDamage(numAttacks) {
        const attacks = [];

        for (let i = 0; i < numAttacks; i++) {
            // Roll for hit location
            const locationRoll = new Roll("1d100");
            await locationRoll.evaluate();
            const hitLocation = this._getHitLocation(locationRoll.total);

            // Roll for damage
            const damageRoll = new Roll("1d10");
            await damageRoll.evaluate();
            const damageDie = damageRoll.total;

            // Parse spell damage formula
            let baseDamage = 0;
            let bonusRollValue = null;

            if (this.spell.system.damage && this.spell.system.damage !== "None") {
                if (this.spell.system.damage === "Magic") {
                    const magicStat = this.actor.system.secondary.magic.current;
                    baseDamage = magicStat;
                } else if (this.spell.system.damage === "1d10") {
                    const bonusRoll = new Roll("1d10");
                    await bonusRoll.evaluate();
                    baseDamage = bonusRoll.total;
                    bonusRollValue = bonusRoll.total;
                } else {
                    const damageNum = parseInt(this.spell.system.damage);
                    if (!isNaN(damageNum)) {
                        baseDamage = damageNum;
                    }
                }
            }

            let totalDamage = damageDie + baseDamage;
            const damageRolls = [{
                die: damageDie,
                total: totalDamage,
                isFury: false,
                bonusRoll: bonusRollValue
            }];

            // Check for Fury (roll of 10)
            let ulricsFuryTriggered = false;
            if (damageDie === 10) {
                ulricsFuryTriggered = true;
                const furyResults = await this._resolveUlricsFury();
                damageRolls.push(...furyResults.rolls);
                totalDamage += furyResults.totalDamage;
            }

            attacks.push({
                hitLocation: hitLocation,
                locationRoll: locationRoll.total,
                totalDamage: totalDamage,
                damageRolls: damageRolls,
                ulricsFuryTriggered: ulricsFuryTriggered
            });
        }

        return attacks;
    }

    async _resolveUlricsFury() {
        const furyRolls = [];
        let totalDamage = 0;
        let keepRolling = true;

        while (keepRolling) {
            // Roll fury damage
            const furyDamageRoll = new Roll("1d10");
            await furyDamageRoll.evaluate();
            const furyDamageDie = furyDamageRoll.total;

            totalDamage += furyDamageDie;
            furyRolls.push({
                die: furyDamageDie,
                isFury: true
            });

            // Check if fury continues 
            if (furyDamageDie !== 10) {
                keepRolling = false;
            }
        }
        return { rolls: furyRolls, totalDamage: totalDamage };
    }

    _getHitLocation(roll) {
        if (roll >= 1 && roll <= 15) return "Head";
        if (roll >= 16 && roll <= 35) return "Right Arm";
        if (roll >= 36 && roll <= 55) return "Body";
        if (roll >= 56 && roll <= 80) return "Left Arm";
        if (roll >= 81 && roll <= 90) return "Right Leg";
        if (roll >= 91 && roll <= 100) return "Left Leg";
        return "Body"; // Default case
    }

    // Caculate healing 
    async _calculateHealing() {
        const healingValue = this.spell.system.healing;

        if (!healingValue || healingValue === "None") {
            return null;
        }

        const magicStat = this.actor.system.secondary.magic.current;
        let totalHealing = 0;
        let healingBreakdown = [];

        if (healingValue === "1") {
            totalHealing = 1;
            healingBreakdown.push({
                type: "flat",
                value: 1
            });
        } else if (healingValue === "Magic") {
            totalHealing = magicStat;
            healingBreakdown.push({
                type: "magic",
                value: magicStat
            });
        } else if (healingValue === "1d10") {
            const roll = new Roll("1d10");
            await roll.evaluate();
            totalHealing = roll.total;
            healingBreakdown.push({
                type: "roll",
                die: roll.total,
                value: roll.total
            });
        } else if (healingValue === "1d10+Magic") {
            const roll = new Roll("1d10");
            await roll.evaluate();
            totalHealing = roll.total + magicStat;
            healingBreakdown.push({
                type: "roll_plus_magic",
                die: roll.total,
                magic: magicStat,
                value: totalHealing
            });
        }

        return {
            total: totalHealing,
            breakdown: healingBreakdown
        };
    }
}
