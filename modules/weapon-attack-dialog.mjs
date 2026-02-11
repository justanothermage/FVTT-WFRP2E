export class WeaponAttackDialog extends Dialog {
    constructor(actor, weapon, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.actor = actor;
        this.weapon = weapon;
        this.modifier = 0;
    }

    static async create(actor, weapon) {
        const isRanged = weapon.system.isRanged;
        const characteristic = isRanged ? "bs" : "ws";
        const charLabel = isRanged ? "BS" : "WS";
        const targetNumber = actor.system.characteristics[characteristic].current;

        const html = `
            <form>
                <div class="form-group">
                    <label>Target Number (${charLabel}):</label>
                    <input type="number" name="target" value="${targetNumber}" readonly/>
                </div>
                <div class="form-group">
                    <label>Modifier:</label>
                    <input type="number" name="modifier" value="0" autofocus/>
                </div>
                <div class="form-group">
                    <label>Weapon:</label>
                    <input type="text" value="${weapon.name}" readonly/>
                </div>
            </form>
        `;

        return new Promise((resolve) => {
            const dialog = new WeaponAttackDialog(actor, weapon, {
                title: `${weapon.name} Attack`,
                content: html,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Attack",
                        callback: (html) => {
                            const modifier = parseInt(html.find('[name="modifier"]').val()) || 0;
                            dialog.modifier = modifier;
                            resolve(dialog);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => resolve(null)
                    }
                },
                default: "roll",
                close: () => resolve(null)
            });
            dialog.render(true);
        });
    }

    async executeAttack() {
        const isRanged = this.weapon.system.isRanged;
        const characteristic = isRanged ? "bs" : "ws";
        const charLabel = isRanged ? "BS" : "WS";
        const targetNumber = this.actor.system.characteristics[characteristic].current + this.modifier;

        // Roll attack
        const attackRoll = new Roll("1d100");
        await attackRoll.evaluate();
        const attackResult = attackRoll.total;
        const isHit = attackResult <= targetNumber;

        // Determine degrees of success/failure
        const difference = Math.abs(targetNumber - attackResult);
        const degrees = Math.floor(difference / 10);

        let hitLocation = "";
        let damageTotal = 0;
        let damageRolls = [];
        let ulricsFuryTriggered = false;

        if (isHit) {
            // Determine hit location (reverse the attack roll digits)
            const reversedRoll = this._reverseDigits(attackResult);
            hitLocation = this._getHitLocation(reversedRoll);

            // Roll initial damage
            const damageRoll = new Roll("1d10");
            await damageRoll.evaluate();
            const damageDie = damageRoll.total;
            damageTotal = damageDie + (this.weapon.system.damage || 0);
            damageRolls.push({
                die: damageDie,
                total: damageTotal,
                isFury: false
            });

            // Check for Ulric's Fury
            if (damageDie === 10) {
                ulricsFuryTriggered = true;
                const furyResults = await this._resolveUlricsFury(targetNumber);
                damageRolls.push(...furyResults.rolls);
                damageTotal += furyResults.totalDamage;
            }
        }

        // Create chat message
        await this._createChatMessage({
            attackResult,
            targetNumber,
            isHit,
            degrees,
            hitLocation,
            damageTotal,
            damageRolls,
            ulricsFuryTriggered,
            charLabel
        });
    }

    async _resolveUlricsFury(targetNumber) {
        const furyRolls = [];
        let totalDamage = 0;
        let keepRolling = true;

        while (keepRolling) {
            // Re-roll the attack
            const furyAttackRoll = new Roll("1d100");
            await furyAttackRoll.evaluate();
            const furyAttackResult = furyAttackRoll.total;
            const furyHit = furyAttackResult <= targetNumber;

            if (furyHit) {
                // Roll fury damage
                const furyDamageRoll = new Roll("1d10");
                await furyDamageRoll.evaluate();
                const furyDamageDie = furyDamageRoll.total;
                
                totalDamage += furyDamageDie;
                furyRolls.push({
                    die: furyDamageDie,
                    attackRoll: furyAttackResult,
                    hit: true,
                    isFury: true
                });

                // Check if fury continues
                if (furyDamageDie !== 10) {
                    keepRolling = false;
                }
            } else {
                // Fury failed
                furyRolls.push({
                    attackRoll: furyAttackResult,
                    hit: false,
                    isFury: true
                });
                keepRolling = false;
            }
        }

        return { rolls: furyRolls, totalDamage };
    }

    _reverseDigits(num) {
        const str = num.toString().padStart(2, '0');
        const reversed = str.split('').reverse().join('');
        return parseInt(reversed);
    }

    _getHitLocation(roll) {
        if (roll >= 1 && roll <= 15) return "Head";
        if (roll >= 16 && roll <= 35) return "Right Arm";
        if (roll >= 36 && roll <= 55) return "Body";
        if (roll >= 56 && roll <= 80) return "Left Arm";
        if (roll >= 81 && roll <= 90) return "Right Leg";
        if (roll >= 91 && roll <= 100) return "Left Leg";
        return "Body"; // Default
    }

    async _createChatMessage(data) {
        const isRanged = this.weapon.system.isRanged;
        const weaponType = isRanged ? "Ranged" : "Melee";

        let damageBreakdown = "";
        if (data.isHit) {
            damageBreakdown = `<div class="damage-section">
                <h4>Damage: ${data.damageTotal}</h4>
                <div class="damage-breakdown">`;
            
            data.damageRolls.forEach((roll, index) => {
                if (!roll.isFury) {
                    damageBreakdown += `<div>Initial: 1d10(${roll.die}) + ${this.weapon.system.damage} = ${roll.total}</div>`;
                } else if (roll.hit) {
                    damageBreakdown += `<div class="fury-roll">Ulric's Fury: Attack(${roll.attackRoll}) - Hit! +${roll.die} damage</div>`;
                } else {
                    damageBreakdown += `<div class="fury-roll fury-fail">Ulric's Fury: Attack(${roll.attackRoll}) - Miss!</div>`;
                }
            });
            
            damageBreakdown += `</div></div>`;
        }

        const messageContent = `
            <div class="wfrp-roll weapon-attack">
                <div class="roll-header">
                    <h3>${weaponType} Attack: ${this.weapon.name}</h3>
                    <div class="actor-name">${this.actor.name}</div>
                </div>
                <div class="roll-result ${data.isHit ? 'success' : 'failure'}">
                    <div class="roll-details">
                        <span class="roll-label">${data.charLabel} Check:</span>
                        <span class="roll-value">${data.attackResult}</span>
                        <span class="roll-target">vs ${data.targetNumber}</span>
                    </div>
                    <div class="result-text">
                        ${data.isHit ? `<strong>HIT!</strong> (${data.degrees} degrees)` : `<strong>MISS!</strong> (${data.degrees} degrees)`}
                    </div>
                </div>
                ${data.isHit ? `
                    <div class="hit-location">
                        <strong>Hit Location:</strong> ${data.hitLocation}
                    </div>
                    ${damageBreakdown}
                    ${data.ulricsFuryTriggered ? '<div class="fury-indicator"><i class="fas fa-fire"></i> Ulric\'s Fury!</div>' : ''}
                ` : ''}
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
}