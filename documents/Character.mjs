import { showRollDialog } from "../modules/roll-dialog.mjs";  

export class WHCharacter extends Actor {
    
    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
        // The DataModel's prepareDerivedData handles everything
    }

    /**
     * Roll a characteristic test (d100 roll-under)
     * @param {string} characteristic - The characteristic key (ws, bs, s, t, ag, int, wp, fel)
     * @returns {Promise<Roll>}
     */
    async rollCharacteristic(characteristic) {
        const charData = this.system.characteristics[characteristic];
        if (!charData) {
            ui.notifications.warn(`Characteristic ${characteristic} not found`);
            return null;
        }

        const baseTarget = charData.current;
        const title = `${characteristic.toUpperCase()} Test`;

        // Show the roll dialog
        await showRollDialog(title, baseTarget, async (finalTarget, modifier, rollMode) => {
            const roll = await new Roll("1d100").evaluate();
            
            // Determine success
            const isSuccess = roll.total <= finalTarget;
            const margin = Math.abs(finalTarget - roll.total);
            
            // Degrees of success/failure (every 10 points)
            const degrees = Math.floor(margin / 10);
            
            // Build the chat message
            let flavor = `<h3>${title}</h3>`;
            flavor += `<p><strong>Target:</strong> ${charData.current}`;
            if (modifier !== 0) {
                flavor += ` ${modifier >= 0 ? '+' : ''}${modifier} = ${finalTarget}`;
            }
            flavor += `</p>`;
            
            if (isSuccess) {
                flavor += `<p class="success"><strong>Success!</strong>`;
                if (degrees > 0) flavor += ` (${degrees} Degree${degrees > 1 ? 's' : ''})`;
                flavor += `</p>`;
            } else {
                flavor += `<p class="failure"><strong>Failure!</strong>`;
                if (degrees > 0) flavor += ` (${degrees} Degree${degrees > 1 ? 's' : ''})`;
                flavor += `</p>`;
            }

            // Send to chat with specified roll mode
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this}),
                flavor: flavor,
                rollMode: rollMode
            });
            return roll;
        });
    }

    /**
     * Roll a skill test (d100 roll-under)
     * @param {number} skillIndex - Index of the skill in the skills array
     * @returns {Promise<Roll>}
     */
    async rollSkill(skillIndex) {
        const skill = this.system.skills[skillIndex];
        if (!skill) {
            ui.notifications.warn(`Skill not found`);
            return null;
        }

        // Get the characteristic value
        const charKey = skill.characteristic.toLowerCase();
        const charValue = this.system.characteristics[charKey]?.current || 0;
        
        // Calculate skill total
        // If trained: characteristic + advances + modifier
        // If untrained: half of (characteristic + advances) + modifier
        const baseSkillTotal = skill.trained 
            ? charValue + skill.advances + skill.modifier
            : Math.floor((charValue + skill.advances) / 2) + skill.modifier;
        
        const title = `${skill.name || 'Skill'} Test`;

        // Show the roll dialog
        await showRollDialog(title, baseSkillTotal, async (finalTarget, modifier, rollMode) => {
            const roll = await new Roll("1d100").evaluate();
            
            // Determine success
            const isSuccess = roll.total <= finalTarget;
            const margin = Math.abs(finalTarget - roll.total);
            
            // Degrees of success/failure
            const degrees = Math.floor(margin / 10);
            
            // Build chat message
            let flavor = `<h3>${skill.name}</h3>`;
            flavor += `<p><strong>Base:</strong> ${skill.characteristic.toUpperCase()} ${charValue}`;
            if (skill.trained) {
                flavor += ` + ${skill.advances} advances`;
            } else {
                flavor += ` + ${skill.advances} advances ÷2 [untrained]`;
            }
            if (skill.modifier !== 0) {
                flavor += ` ${skill.modifier >= 0 ? '+' : ''}${skill.modifier}`;
            }
            flavor += ` = ${baseSkillTotal}`;
            if (modifier !== 0) {
                flavor += ` ${modifier >= 0 ? '+' : ''}${modifier} = ${finalTarget}`;
            }
            flavor += `</p>`;
            
            if (isSuccess) {
                flavor += `<p class="success"><strong>Success!</strong>`;
                if (degrees > 0) flavor += ` (${degrees} Degree${degrees > 1 ? 's' : ''})`;
                flavor += `</p>`;
            } else {
                flavor += `<p class="failure"><strong>Failure!</strong>`;
                if (degrees > 0) flavor += ` (${degrees} Degree${degrees > 1 ? 's' : ''})`;
                flavor += `</p>`;
            }

            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this}),
                flavor: flavor,
                rollMode: rollMode
            });

            return roll;
        });
    }
    // Prepare derived data
    prepareDerivedData() {
        super.prepareDerivedData();
        const systemData = this.system;

        /* Debugging logs
        console.log("prepareDerivedData running for:", this.name);
        console.log("systemData.secondary exists?", !!systemData.secondary);
        console.log("systemData.secondary:", systemData.secondary);*/
        
        // Calculate current characteristic values (New Method)
        if (systemData.characteristics) {
            for (let [key, char] of Object.entries(systemData.characteristics)) {
                if (char && typeof char === "object") {
                    char.current = (char.initial || 0) + (char.talents || 0) + (char.advances || 0) + (char.misc || 0);
                    console.log(`${key}.current = ${char.current}`);
                }
            }
        }
        // Calculate current secondary characteristics (New Method)
        // console.log("About to process secondary profile..."); // Debugging log
        if (systemData.secondary) {
            // console.log("Inside secondary profile block"); // Debugging log
            // console.log("Secondary keys:", Object.keys(systemData.secondary)); // Debugging log
            for (let [key, stat] of Object.entries(systemData.secondary)) {
                // console.log(`Processing secondary.${key}:`, stat); // Debugging log
                if (stat && typeof Object.entries(systemData.secondary)) {
                    if (stat && typeof stat === "object") {
                        if (
                            key === "strengthBonus" || key === "toughnessBonus" || key === 'insanityPoints' || key === 'fatePoints') { 
                            continue;
                        }
                        stat.current = (stat.initial || 0) + (stat.talents || 0) + (stat.advances || 0) + (stat.misc || 0);
                        console.log(`secondary.${key}.current = ${stat.current}`);
                    } 
                }
            }
            if (systemData.characteristics.s && systemData.secondary.strengthBonus) {
                systemData.secondary.strengthBonus.value = Math.floor(systemData.characteristics.s.current / 10) + (systemData.secondary.strengthBonus.misc || 0);
                //console.log(`strengthBonus.value = ${systemData.secondary.strengthBonus.value}`);
            }
            if (systemData.characteristics.t && systemData.secondary.toughnessBonus) {
                systemData.secondary.toughnessBonus.value = Math.floor(systemData.characteristics.t.current / 10) + (systemData.secondary.toughnessBonus.misc || 0);
                //console.log(`toughnessBonus.value = ${systemData.secondary.toughnessBonus.value}`);
            }
            if (systemData.secondary.insanityPoints) {
                systemData.secondary.insanityPoints.current = (systemData.secondary.insanityPoints.initial || 0) + (systemData.secondary.insanityPoints.misc || 0);
                //console.log(`insanityPoints.current = ${systemData.secondary.insanityPoints.current}`);
            }
            if (systemData.secondary.fatePoints) {
                systemData.secondary.fatePoints.current = (systemData.secondary.fatePoints.initial || 0) + (systemData.secondary.fatePoints.misc || 0);
                //console.log(`fatePoints.current = ${systemData.secondary.fatePoints.current}`);
            }
        }        
        // Calculate available experience
        if (this.experience) {
                this.experience.current = this.experience.total - this.experience.spent;
        }
    }

    /**
     * Get all equipped armour items
     */
    get equippedArmour() {
        return this.items.filter(item => 
            item.type === "armour" && item.getFlag('wfrp2e', 'isEquipped')
        );
    }

    /**
     * Calculate total armour points for a specific location
     * @paran {string} location - Location key
     */
    getArmourPointsForLocation(location) {
        const equippedArmour = this.getEquippedArmour();
        let totalAP = 0;

        for (let armor of equippedArmour) {
            if (armor.system[location]) {
                totalAP += armor.system.armourPoints || 0;
            }
        }
        return totalAP;
    }

    /**
    * Calculate total armor points for a specific location
    * Includes Toughness Bonus + equipped armor
    * @param {string} location - Location key (head, body, armLeft, armRight, legLeft, legRight)
    */
    getTotalArmourForLocation(location) {
        console.log(`=== Calculating armor for ${location} ===`); // Debugging log

        // Get Toughness Bonus
        const toughnessBonus = this.system.secondary?.toughnessBonus?.value || 0;
        console.log("Toughness Bonus:", toughnessBonus);

        // Get equipped armor that protects this location
        const equippedArmour = this.items.filter(item => {
            const isArmour = item.type === "armour";
            const isEquipped = item.getFlag('fvtt-wfrp2e', 'isEquipped');
            //const protectsLocation = item.system[location];
            console.log(`${item.name}: type=${isArmour}, equipped=${isEquipped}, ${location} AP=${item.system?.[location]}`);
            return isArmour && isEquipped;
        });

        console.log(`Found ${equippedArmour.length} equipped armor pieces`); // Debugging log

        // Sum up armor points from all equipped armor
        let armourPoints = 0;
        for (let armor of equippedArmour) {
            const locationAP = armor.system[location] || 0;
            console.log(`  ${armor.name}: ${locationAP} AP for ${location}`);
            armourPoints += locationAP;
        }
    
        // Total = TB + Armor Points
        const total = toughnessBonus + armourPoints;
        console.log(`Total for ${location}: ${toughnessBonus} (TB) + ${armourPoints} (armor) = ${total}`);

        return total;
    }
}