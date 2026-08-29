export class WeaponAttackDialog extends Dialog {
    constructor(actor, weapon, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.actor = actor;
        this.weapon = weapon;
        this.modifier = 0;
        this.damageModifier = 0;
        this.attackType = "normal";
        this.shieldPenalty = 0;
    }

    static async create(actor, weapon) {
        const isRanged = weapon.system.isRanged;
        const characteristic = isRanged ? "bs" : "ws";
        const charLabel = isRanged ? "BS" : "WS";
        const targetNumber = actor.system.characteristics[characteristic].current;

        const attackTypeOptions = isRanged
            ? `<option value="normal">Normal Attack</option>
               <option value="swift">Swift Attack</option>`
            : `<option value="normal">Normal Attack</option>
               <option value="charge">Charge Attack</option>
               <option value="swift">Swift Attack</option>
               <option value="allout">All Out Attack</option>
               <option value="guarded">Guarded Attack</option>`;

        const html = `
            <form>
                <div class="form-group">
                    <label>Attack Type:</label>
                    <select name="attackType">
                        ${attackTypeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Target Number (${charLabel}):</label>
                    <input type="number" name="target" value="${targetNumber}" readonly/>
                </div>
                ${isRanged ? `
                <div class="form-group checkbox-group">
                    <label>
                        <input type="checkbox" name="targetHasShield"/>
                        Target has Shield (-10 BS)
                    </label>
                </div>` : ""}
                <div class="form-group">
                    <label>Modifier:</label>
                    <input type="number" name="modifier" value="0" autofocus/>
                </div>
                <div class="form-group">
                    <label>Weapon:</label>
                    <input type="text" value="${weapon.name}" readonly/>
                </div>
                <div class="form-group">
                    <label>Damage Modifier:</label>
                    <input type="number" name="damageModifier" value="0" placeholder="+0 or -5"/>
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
                            dialog.damageModifier = parseInt(html.find('[name="damageModifier"]').val()) || 0;
                            dialog.attackType = html.find('[name="attackType"]').val();
                            dialog.shieldPenalty = html.find('[name="targetHasShield"]').is(':checked') ? -10 : 0;
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

    _getWeaponQualities() {
        const s = this.weapon.system;
        return {
            armourPiercing: s.hasArmourPiercing ?? false,
            fast:           s.hasFast          ?? false,
            impact:         s.hasImpact         ?? false,
            experimental:   s.hasExperimental   ?? false,
            precise:        s.hasPrecise        ?? false,
            slow:           s.hasSlow           ?? false,
            unreliable:     s.hasUnreliable      ?? false
        };
    }

    _checkMalfunction(attackResult, qualities) {
        // Experimental: 96-98 jam, 99-100 explode
        if (qualities.experimental) {
            if (attackResult >= 96 && attackResult <= 98) {
                return { type: "jam", source: "Experimental" };
            }
            if (attackResult >= 99) {
                return { type: "explode", source: "Experimental" };
            }
        }
        // Unreliable: 96-99 jam, 100 explode
        if (qualities.unreliable) {
            if (attackResult >= 96 && attackResult <= 99) {
                return { type: "jam", source: "Unreliable" };
            }
            if (attackResult === 100) {
                return { type: "explode", source: "Unreliable" };
            }
        }
        return null;
    }

    async _rollExplosionDamage(qualities) {
        // Experimental: 1d10+8 to wielder
        // Unreliable: normal weapon damage to wielder
        if (qualities.experimental) {
            const roll = new Roll("1d10");
            await roll.evaluate();
            return { formula: "1d10+8", total: roll.total + 8, die: roll.total };
        }
        if (qualities.unreliable) {
            const roll = new Roll("1d10");
            await roll.evaluate();
            const sb = this.actor.system.secondary?.strengthBonus?.value ?? 0;
            const base = this.weapon.system.damageBase ?? "flat";
            const mod = this.weapon.system.damageModifier ?? this.weapon.system.damage ?? 0;
            let bonus = 0;
            if (base === "sb") bonus = sb + mod;
            else if (base === "flat") bonus = mod;
            const total = base === "none" ? roll.total : roll.total + bonus;
            return { formula: "Normal weapon damage", total, die: roll.total };
        }
        return null;
    }

    _buildQualityNotices(qualities) {
        const notices = [];
        if (qualities.armourPiercing) notices.push("Ignores 1 Armour Point");
        if (qualities.fast)           notices.push("-10% to Dodge or Parry");
        if (qualities.precise)        notices.push("Increases Critical Value by 1");
        if (qualities.slow)           notices.push("+10% to Dodge or Parry");
        return notices;
    }

    async _rollDamageDie(qualities) {
        if (qualities.impact) {
            const r1 = new Roll("1d10");
            const r2 = new Roll("1d10");
            await r1.evaluate();
            await r2.evaluate();
            const kept = Math.max(r1.total, r2.total);
            return { die: kept, impactRolls: [r1.total, r2.total] };
        }
        const roll = new Roll("1d10");
        await roll.evaluate();
        return { die: roll.total, impactRolls: null };
    }

    _getAttackTypeBonus() {
            switch (this.attackType) {
                case "charge":  return 10;
                case "allout":  return 20;
                case "guarded": return -10;
                default:        return 0;
            }
        }

    _getCraftsmanshipBonus() {
            const craftsmanship = this.weapon.system.craftsmanship;
            if (craftsmanship === "Best") return 5;
            if (craftsmanship === "Poor") return -5;
            return 0;
        }

    async executeAttack() {
        if (this.attackType === "swift") {
            await this._executeSwiftAttack();
        } else {
            await this._executeSingleAttack();
        }
    }

async _executeSingleAttack() {
        const isRanged = this.weapon.system.isRanged;
        const characteristic = isRanged ? "bs" : "ws";
        const charLabel = isRanged ? "BS" : "WS";
        const attackTypeBonus = this._getAttackTypeBonus();
        const targetNumber = this.actor.system.characteristics[characteristic].current + this.modifier + attackTypeBonus + this._getCraftsmanshipBonus() + this.shieldPenalty;
        const qualities = this._getWeaponQualities();

        // Roll attack
        const attackRoll = new Roll("1d100");
        await attackRoll.evaluate();
        const attackResult = attackRoll.total;
        const isHit = attackResult <= targetNumber;

        // Degrees of success/failure
        const difference = Math.abs(targetNumber - attackResult);
        const degrees = Math.floor(difference / 10);

        // Check for malfunction before resolving damage
        const malfunction = this._checkMalfunction(attackResult, qualities);
        let explosionData = null;
        if (malfunction?.type === "explode") {
            explosionData = await this._rollExplosionDamage(qualities);
        }

        let hitLocation = "";
        let damageTotal = 0;
        let damageRolls = [];
        let ulricsFuryTriggered = false;
        let damageLabel = "0";
        let impactRolls = null;

        // Only resolve damage on a hit AND no malfunction
        if (isHit && !malfunction) {
            const reversedRoll = this._reverseDigits(attackResult);
            hitLocation = this._getHitLocation(reversedRoll);

            const { die: damageDie, impactRolls: iRolls } = await this._rollDamageDie(qualities);
            impactRolls = iRolls;

            const sb = this.actor.system.secondary?.strengthBonus?.value ?? 0;
            const base = this.weapon.system.damageBase ?? "flat";
            const modifier = this.weapon.system.damageModifier ?? this.weapon.system.damage ?? 0;

            let damageBonus = 0;
            if (base === "sb") damageBonus = sb + modifier;
            else if (base === "flat") damageBonus = modifier;

            damageLabel = base === "none" ? "0"
                : base === "sb" ? `SB(${sb})${modifier >= 0 ? "+" : ""}${modifier}`
                : `${modifier}`;

            damageTotal = base === "none" ? 0 : damageDie + damageBonus + this.damageModifier;

            damageRolls.push({
                die: damageDie,
                total: damageTotal,
                isFury: false
            });

            if (damageDie === 10) {
                ulricsFuryTriggered = true;
                const furyResults = await this._resolveUlricsFury(targetNumber);
                damageRolls.push(...furyResults.rolls);
                damageTotal += furyResults.totalDamage;
            }
        }

        const qualityNotices = this._buildQualityNotices(qualities);

        await this._createChatMessage({
            attackResult,
            targetNumber,
            isHit,
            degrees,
            hitLocation,
            damageTotal,
            damageRolls,
            ulricsFuryTriggered,
            charLabel,
            damageLabel,
            damageModifier: this.damageModifier,
            attackType: this.attackType,
            malfunction,
            explosionData,
            qualityNotices,
            impactRolls
        });
    }

async _executeSwiftAttack() {
        const isRanged = this.weapon.system.isRanged;
        const characteristic = isRanged ? "bs" : "ws";
        const charLabel = isRanged ? "BS" : "WS";
        const numAttacks = this.actor.system.secondary?.attacks?.current ?? 1;
        const targetNumber = this.actor.system.characteristics[characteristic].current + this.modifier + this._getCraftsmanshipBonus() + this.shieldPenalty;
        const qualities = this._getWeaponQualities();
        const qualityNotices = this._buildQualityNotices(qualities);

        const attackResults = [];

        for (let i = 0; i < numAttacks; i++) {
            const attackRoll = new Roll("1d100");
            await attackRoll.evaluate();
            const attackResult = attackRoll.total;
            const isHit = attackResult <= targetNumber;
            const difference = Math.abs(targetNumber - attackResult);
            const degrees = Math.floor(difference / 10);

            const malfunction = this._checkMalfunction(attackResult, qualities);
            let explosionData = null;
            if (malfunction?.type === "explode") {
                explosionData = await this._rollExplosionDamage(qualities);
            }

            let hitLocation = "";
            let damageTotal = 0;
            let damageRolls = [];
            let ulricsFuryTriggered = false;
            let damageLabel = "0";
            let impactRolls = null;

            if (isHit && !malfunction) {
                const reversedRoll = this._reverseDigits(attackResult);
                hitLocation = this._getHitLocation(reversedRoll);

                const { die: damageDie, impactRolls: iRolls } = await this._rollDamageDie(qualities);
                impactRolls = iRolls;

                const sb = this.actor.system.secondary?.strengthBonus?.value ?? 0;
                const base = this.weapon.system.damageBase ?? "flat";
                const modifier = this.weapon.system.damageModifier ?? this.weapon.system.damage ?? 0;

                let damageBonus = 0;
                if (base === "sb") damageBonus = sb + modifier;
                else if (base === "flat") damageBonus = modifier;

                damageLabel = base === "none" ? "0"
                    : base === "sb" ? `SB(${sb})${modifier >= 0 ? "+" : ""}${modifier}`
                    : `${modifier}`;

                damageTotal = base === "none" ? 0 : damageDie + damageBonus + this.damageModifier;

                damageRolls.push({
                    die: damageDie,
                    total: damageTotal,
                    isFury: false
                });

                if (damageDie === 10) {
                    ulricsFuryTriggered = true;
                    const furyResults = await this._resolveUlricsFury(targetNumber);
                    damageRolls.push(...furyResults.rolls);
                    damageTotal += furyResults.totalDamage;
                }
            }

            attackResults.push({
                attackNumber: i + 1,
                attackResult,
                targetNumber,
                isHit,
                degrees,
                hitLocation,
                damageTotal,
                damageRolls,
                ulricsFuryTriggered,
                damageLabel,
                malfunction,
                explosionData,
                impactRolls
            });
        }

        await this._createSwiftAttackChatMessage({
            charLabel,
            attackResults,
            damageModifier: this.damageModifier,
            qualityNotices
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
        const attackTypeLabels = {
            normal:  "Normal Attack",
            charge:  "Charge Attack",
            allout:  "All Out Attack",
            guarded: "Guarded Attack",
            swift:   "Swift Attack"
        };
        const attackTypeLabel = attackTypeLabels[data.attackType] ?? "Normal Attack";

let damageBreakdown = "";
        if (data.isHit && !data.malfunction) {
            const dieLine = data.impactRolls
                ? `2d10kh[${data.impactRolls.join(", ")}]`
                : `1d10`;
            damageBreakdown = `<div class="damage-section">
                <h4>Damage: ${data.damageTotal}</h4>
                <div class="damage-breakdown">`;

            data.damageRolls.forEach((roll) => {
                if (!roll.isFury) {
                    const miscPart = data.damageModifier !== 0 ? ` ${data.damageModifier >= 0 ? "+" : ""}${data.damageModifier}` : "";
                    damageBreakdown += `<div>Initial: ${dieLine}(${roll.die}) + ${data.damageLabel}${miscPart} = ${roll.total}</div>`;
                } else if (roll.hit) {
                    damageBreakdown += `<div class="fury-roll">Ulric's Fury: Attack(${roll.attackRoll}) - Hit! +${roll.die} damage</div>`;
                } else {
                    damageBreakdown += `<div class="fury-roll fury-fail">Ulric's Fury: Attack(${roll.attackRoll}) - Miss!</div>`;
                }
            });

            damageBreakdown += `</div></div>`;
        }

        const malfunctionHtml = data.malfunction ? `
            <div class="weapon-malfunction">
                <strong>${data.malfunction.source} — ${data.malfunction.type === "jam" ? "WEAPON JAM!" : "WEAPON EXPLODES!"}</strong>
                ${data.malfunction.type === "explode" && data.explosionData ? `
                    <div>Explosion damage to wielder: ${data.explosionData.formula} = 1d10(${data.explosionData.die}) = <strong>${data.explosionData.total}</strong></div>
                ` : ""}
            </div>` : "";

        const qualityNoticesHtml = data.qualityNotices?.length ? `
            <div class="quality-notices">
                ${data.qualityNotices.map(n => `<div class="quality-notice"><i class="fas fa-info-circle"></i> ${n}</div>`).join("")}
            </div>` : "";

        const messageContent = `
            <div class="wfrp-roll weapon-attack">
                <div class="roll-header">
                    <h3>${weaponType} ${attackTypeLabel}: ${this.weapon.name}</h3>
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
                ${malfunctionHtml}
                ${data.isHit && !data.malfunction ? `
                    <div class="hit-location">
                        <strong>Hit Location:</strong> ${data.hitLocation}
                    </div>
                    ${damageBreakdown}
                    ${data.ulricsFuryTriggered ? '<div class="fury-indicator"><i class="fas fa-fire"></i> Ulric\'s Fury!</div>' : ''}
                ` : ''}
                ${qualityNoticesHtml}
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

    async _createSwiftAttackChatMessage(data) {
        const isRanged = this.weapon.system.isRanged;
        const weaponType = isRanged ? "Ranged" : "Melee";

let attacksHtml = "";
        for (const atk of data.attackResults) {
            let damageBreakdown = "";
            if (atk.isHit && !atk.malfunction) {
                const dieLine = atk.impactRolls
                    ? `2d10kh[${atk.impactRolls.join(", ")}]`
                    : `1d10`;
                damageBreakdown = `<div class="damage-section">
                    <h4>Damage: ${atk.damageTotal}</h4>
                    <div class="damage-breakdown">`;

                atk.damageRolls.forEach(roll => {
                    if (!roll.isFury) {
                        const miscPart = data.damageModifier !== 0 ? ` ${data.damageModifier >= 0 ? "+" : ""}${data.damageModifier}` : "";
                        damageBreakdown += `<div>Initial: ${dieLine}(${atk.die}) + ${atk.damageLabel}${miscPart} = ${roll.total}</div>`;
                    } else if (roll.hit) {
                        damageBreakdown += `<div class="fury-roll">Ulric's Fury: Attack(${roll.attackRoll}) - Hit! +${roll.die} damage</div>`;
                    } else {
                        damageBreakdown += `<div class="fury-roll fury-fail">Ulric's Fury: Attack(${roll.attackRoll}) - Miss!</div>`;
                    }
                });

                damageBreakdown += `</div></div>`;
            }

            const malfunctionHtml = atk.malfunction ? `
                <div class="weapon-malfunction">
                    <strong>${atk.malfunction.source} — ${atk.malfunction.type === "jam" ? "WEAPON JAM!" : "WEAPON EXPLODES!"}</strong>
                    ${atk.malfunction.type === "explode" && atk.explosionData ? `
                        <div>Explosion damage to wielder: ${atk.explosionData.formula} = 1d10(${atk.explosionData.die}) = <strong>${atk.explosionData.total}</strong></div>
                    ` : ""}
                </div>` : "";

            attacksHtml += `
                <div class="swift-attack-entry">
                    <strong>Attack ${atk.attackNumber}</strong>
                    <div class="roll-result ${atk.isHit ? 'success' : 'failure'}">
                        <div class="roll-details">
                            <span class="roll-label">${data.charLabel} Check:</span>
                            <span class="roll-value">${atk.attackResult}</span>
                            <span class="roll-target">vs ${atk.targetNumber}</span>
                        </div>
                        <div class="result-text">
                            ${atk.isHit ? `<strong>HIT!</strong> (${atk.degrees} degrees)` : `<strong>MISS!</strong> (${atk.degrees} degrees)`}
                        </div>
                    </div>
                    ${malfunctionHtml}
                    ${atk.isHit && !atk.malfunction ? `
                        <div class="hit-location"><strong>Hit Location:</strong> ${atk.hitLocation}</div>
                        ${damageBreakdown}
                        ${atk.ulricsFuryTriggered ? '<div class="fury-indicator"><i class="fas fa-fire"></i> Ulric\'s Fury!</div>' : ''}
                    ` : ""}
                </div>
                <hr/>`;
        }

        const messageContent = `
            <div class="wfrp-roll weapon-attack">
                <div class="roll-header">
                    <h3>${weaponType} Swift Attack: ${this.weapon.name}</h3>
                    <div class="actor-name">${this.actor.name}</div>
                    <div class="swift-attack-count">${data.attackResults.length} attacks</div>
                </div>
                ${attacksHtml}
                ${data.qualityNotices?.length ? `
                    <div class="quality-notices">
                        ${data.qualityNotices.map(n => `<div class="quality-notice"><i class="fas fa-info-circle"></i> ${n}</div>`).join("")}
                    </div>` : ""}
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