import {DEFAULT_SKILLS} from "../modules/default-skills.mjs";
import {WeaponAttackDialog} from "../modules/weapon-attack-dialog.mjs";

export class WHCharacterSheet extends ActorSheet {
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["wfrp2e", "sheet", "actor", "character"],
            width: 1000,
            height: 800,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main"}]
        });
    }

    /** @override */
    get template() {
        return "systems/fvtt-wfrp2e/templates/actor/character-sheet.html";
    }

    /** @override */
    async getData(options) {
        const context = await super.getData(options);
        
        context.system = this.actor.system; // Add the actor's data to context for easy access

        // Calculates target values for skills
        if (context.system.skills) {
            context.system.skills.forEach(skill => {
                const charKey = skill.characteristic?.toLowerCase();
                const charValue = this.actor.system.characteristics[charKey]?.current || 0;
        // Calculates skill total
                const skillTotal = skill.trained
                ? charValue + skill.advances + skill.modifier
                : Math.floor((charValue + skill.advances) / 2) + skill.modifier;
                skill.target = skillTotal;
            });
            }
        
        // Get items by type
        context.careers = this.actor.items.filter(i => i.type === "career");
        context.talents = this.actor.items.filter(i => i.type === "talent");
        context.mutations = this.actor.items.filter(i => i.type === "mutation");
        context.insanities = this.actor.items.filter(i => i.type === "insanity");
        context.weapons = this.actor.items.filter(i => i.type === "weapon");
        context.armours = this.actor.items.filter(i => i.type === "armour");
        
        // Debugging logs; adding these made items show up correctly to actor sheet
        console.log("Talents:", context.talents);
        console.log("Mutations:", context.mutations);
        console.log("Insanities:", context.insanities);
        
        // Find current career for display in header
        if (context.careers) {
            if (context.careers.length > 0) {
                const currentCareer = context.careers.find(c => c.system.isCurrent);
                context.currentCareer = currentCareer ? currentCareer.name : "None";
            }
        } else {
            context.currentCareer = "None";
        }
        
        this.SetCareerAdvancements();

        // Calculate max career advances based on entered careers and update actor data accordingly
        this._calculateMaxCareerAdvances();

        // Add enriched HTML
        context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.biography, {async: true});
        context.enrichedHistory = await TextEditor.enrichHTML(this.actor.system.history, {async: true});
        context.enrichedNotes = await TextEditor.enrichHTML(this.actor.system.notes, {async: true});
        
        // Get armour and add equipment status from flags 
        context.armour = this.actor.items.filter(i => i.type === "armour").map(armour => {
            const isEquipped = armour.getFlag('fvtt-wfrp2e', 'isEquipped') || false;
            // console.log(`Armor ${armour.name}: isEquipped flag = ${isEquipped}`); // Debugging log

            return {
                id: armour.id,
                _id: armour._id,
                name: armour.name,
                img: armour.img,
                system: armour.system,
                isEquipped: isEquipped
            };
        });

        // console.log("Armour context:", context.armour);// Debugging log 

        // Calculate total armour for each location
        context.totalArmour = {
            head: this.actor.getTotalArmourForLocation('head'),
            body: this.actor.getTotalArmourForLocation('body'),
            legLeft: this.actor.getTotalArmourForLocation('legLeft'),
            legRight: this.actor.getTotalArmourForLocation('legRight'),
            armLeft: this.actor.getTotalArmourForLocation('armLeft'),
            armRight: this.actor.getTotalArmourForLocation('armRight')
        };
        // console.log("Total armour:", context.totalArmour);

        return context;
    }

    // Sets career advancements on the sheet based on current career 
    SetCareerAdvancements() {
        if (!context.careers) {
            this.SetDefaultAdvancements();
            return;
        }
        const currentCareer = context.careers.find(c => c.system.isCurrent);
        context.currentCareer = currentCareer ? currentCareer.name : "None";
        const actorData = context.actor?.system || context.system;

        if (actorData?.characteristics) {
            const chars = actorData.characteristics;
            if (currentCareer) {
                const careerData = currentCareer.system;
                if (chars.ws?.hasOwnProperty('career')) chars.ws.career = careerData.careerWS || 0;
                if (chars.bs?.hasOwnProperty('career')) chars.bs.career = careerData.careerBS || 0;
                if (chars.s?.hasOwnProperty('career')) chars.s.career = careerData.careerS || 0;
                if (chars.t?.hasOwnProperty('career')) chars.t.career = careerData.careerT || 0;
                if (chars.ag?.hasOwnProperty('career')) chars.ag.career = careerData.careerAg || 0;
                if (chars.int?.hasOwnProperty('career')) chars.int.career = careerData.careerInt || 0;
                if (chars.wp?.hasOwnProperty('career')) chars.wp.career = careerData.careerWP || 0;
                if (chars.fel?.hasOwnProperty('career')) chars.fel.career = careerData.careerFel || 0;
            } else {
                if (chars.ws?.hasOwnProperty('career')) chars.ws.career = 0;
                if (chars.bs?.hasOwnProperty('career')) chars.bs.career = 0;
                if (chars.s?.hasOwnProperty('career')) chars.s.career = 0;
                if (chars.t?.hasOwnProperty('career')) chars.t.career = 0;
                if (chars.ag?.hasOwnProperty('career')) chars.ag.career = 0;
                if (chars.int?.hasOwnProperty('career')) chars.int.career = 0;
                if (chars.wp?.hasOwnProperty('career')) chars.wp.career = 0;
                if (chars.fel?.hasOwnProperty('career')) chars.fel.career = 0;
            }
        }
        if (actorData?.secondary) {
            const secondary = actorData.secondary;
            if (currentCareer) {
                const careerData = currentCareer.system;
                if (secondary.attacks?.hasOwnProperty('career')) secondary.attacks.career = careerData.careerAttacks || 0;
                if (secondary.wounds?.hasOwnProperty('career')) secondary.wounds.career = careerData.careerWounds || 0;
                if (secondary.movement?.hasOwnProperty('career')) secondary.movement.career = careerData.careerMovement || 0;
                if (secondary.magic?.hasOwnProperty('career')) secondary.magic.career = careerData.careerMagic || 0;
            } else {
                if (secondary.attacks?.hasOwnProperty('career')) secondary.attacks.career = 0;
                if (secondary.wounds?.hasOwnProperty('career')) secondary.wounds.career = 0;
                if (secondary.movement?.hasOwnProperty('career')) secondary.movement.career = 0;
                if (secondary.magic?.hasOwnProperty('career')) secondary.magic.career = 0;
            }
        }
    }

    // Sets all career advancements to 0, used when no careers are entered
    SetDefaultAdvancements() {
        console.log("Characteristc: Trying to set defauls");
        const chars = this.actor.system.characteristics;
        chars.ws.career = 0;
        chars.bs.career = 0;
        chars.s.career = 0;
        chars.t.career = 0;
        chars.ag.career = 0;
        chars.int.career = 0;
        chars.wp.career = 0;
        chars.fel.career = 0;
        const secondaryCharacteristics = this.actor.system.secondary;
        secondaryCharacteristics.attacks.career = 0;
        secondaryCharacteristics.wounds.career = 0;
        secondaryCharacteristics.movement.career = 0;
        secondaryCharacteristics.magic.career = 0;
    }

    // Calculates maximum career advances based on entered careers and updates actor's data accordingly
    _calculateMaxCareerAdvances() {
        const actorData = this.actor.system;

        // Gat all careers that have been entered (careerEntered > 0)
        const enteredCareers = this.actor.items.filter(
            i => i.type === "career" && i.system.careerEntered > 0
        );

        // console.log("Entered careers:", enteredCareers.map(c => c.name));
        // If no careers have been entered, set all career advances to 0
        if (enteredCareers.length === 0) {
            if (actorData.characteristics) {
                actorData.characteristics.ws.career = 0;
                actorData.characteristics.bs.career = 0;
                actorData.characteristics.s.career = 0;
                actorData.characteristics.t.career = 0;
                actorData.characteristics.ag.career = 0;
                actorData.characteristics.int.career = 0;
                actorData.characteristics.wp.career = 0;
                actorData.characteristics.fel.career = 0;
            }
            if (actorData.secondary) {
                actorData.secondary.attacks.career = 0;
                actorData.secondary.wounds.career = 0;
                actorData.secondary.movement.career = 0;
                actorData.secondary.magic.career = 0;
            }

            if (actor.Data.characteristics) {
                actorData.characteristics.ws.career = Math.max(...enteredCareers.map(c => c.system.careerWS || 0));
                actorData.characteristics.bs.career = Math.max(...enteredCareers.map(c => c.system.careerBS || 0));
                actorData.characteristics.s.career = Math.max(...enteredCareers.map(c => c.system.careerS || 0));
                actorData.characteristics.t.career = Math.max(...enteredCareers.map(c => c.system.careerT || 0));
                actorData.characteristics.ag.career = Math.max(...enteredCareers.map(c => c.system.careerAg || 0));
                actorData.characteristics.int.career = Math.max(...enteredCareers.map(c => c.system.careerInt || 0));
                actorData.characteristics.wp.career = Math.max(...enteredCareers.map(c => c.system.careerWP || 0));
                actorData.characteristics.fel.career = Math.max(...enteredCareers.map(c => c.system.careerFel || 0));
                /* console.log("Characteristic career advances calculates:", {
                    ws: actorData.characteristics.ws.career,
                    bs: actorData.characteristics.bs.career,
                    s: actorData.characteristics.s.career,
                    t: actorData.characteristics.t.career,
                    ag: actorData.characteristics.ag.career,
                    int: actorData.characteristics.int.career,
                    wp: actorData.characteristics.wp.career,
                    fel: actorData.characteristics.fel.career
                })*/ 
            }
        }

        // Find max values for each characteristic
        if (actorData.characteristics) {
            actorData.characteristics.ws.career = Math.max(...enteredCareers.map(c => c.system.careerWS || 0));
            actorData.characteristics.bs.career = Math.max(...enteredCareers.map(c => c.system.careerBS || 0));
            actorData.characteristics.s.career = Math.max(...enteredCareers.map(c => c.system.careerS || 0));
            actorData.characteristics.t.career = Math.max(...enteredCareers.map(c => c.system.careerT || 0));
            actorData.characteristics.ag.career = Math.max(...enteredCareers.map(c => c.system.careerAg || 0));
            actorData.characteristics.int.career = Math.max(...enteredCareers.map(c => c.system.careerInt || 0));
            actorData.characteristics.wp.career = Math.max(...enteredCareers.map(c => c.system.careerWP || 0));
            actorData.characteristics.fel.career = Math.max(...enteredCareers.map(c => c.system.careerFel || 0));
            /*console.log("Characteristic career advances calculated:", {
                ws: actorData.characteristics.ws.career,
                bs: actorData.characteristics.bs.career,
                s: actorData.characteristics.s.career,
                t: actorData.characteristics.t.career,
                ag: actorData.characteristics.ag.career,
                int: actorData.characteristics.int.career,
                wp: actorData.characteristics.wp.career,
                fel: actorData.characteristics.fel.career
            })*/
        }

        // Find max values for secondary characteristics
        if (actorData.secondary) {
            actorData.secondary.attacks.career = Math.max(...enteredCareers.map(c => c.system.careerAttacks || 0));
            actorData.secondary.wounds.career = Math.max(...enteredCareers.map(c => c.system.careerWounds || 0));
            actorData.secondary.movement.career = Math.max(...enteredCareers.map(c => c.system.careerMovement || 0));
            actorData.secondary.magic.career = Math.max(...enteredCareers.map(c => c.system.careerMagic || 0));
            /*console.log("Secondary characteristic career advances calculated:", {
                attacks: actorData.secondary.attacks.career,
                wounds: actorData.secondary.wounds.career,
                movement: actorData.secondary.movement.career,
                magic: actorData.secondary.magic.career
            })*/
        }
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        console.log("=== Activiating Listeners ===");
        console.log("Item edit buttons found:", html.find('.item-edit').length);
        console.log("Item delete buttons found:", html.find('.item-delete').length);
        html.find('.item-edit').each((i, el) => {
            console.log(`Edit button ${i}: item-id = ${el.dataset.itemId}`);
        });

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Roll handlers - these work even if sheet is not editable
        html.find('.rollable-characteristic').click(this._onRollCharacteristic.bind(this));
        html.find('.skill-roll').click(this._onRollSkill.bind(this));
        html.find('.weapon-attack').click(this._onWeaponAttack.bind(this));

        // Item edit and delete handlers
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        
        // Career hookups 
        html.find('.career-current-toggle').change(this._onCareerCurrentToggle.bind(this));
        html.find('.career-entered-input').change(this._onCareerEnteredChange.bind(this));

        // Add Skill
        html.find('.add-skill').click(this._onAddSkill.bind(this));
        
        // Delete Skill
        html.find('.skill-delete').click(this._onDeleteSkill.bind(this));
        
        // Add Special Rule
        html.find('.add-special-rule').click(this._onAddSpecialRule.bind(this));
        
        // Delete Special Rule
        html.find('.special-rule-delete').click(this._onDeleteSpecialRule.bind(this));

        // Careen item updates to main tab
        this.actor.items.forEach(item => {
            if (item.type === "career") {
                Hooks.on('updateItem', (item, changes) => {
                    if (changes.system?.isCurrent !== undefined) {
                        this.render(false);
                    }
                });
            };
        });

        // Armour equip toggle
        html.find('.armour-equipped-toggle').change(this._onArmourEquippedToggle.bind(this));
    }

    /**
     * Handle adding a new skill
     * @param {Event} event   The originating click event
     * @private
     */
    async _onAddSkill(event) {
        event.preventDefault();
        
        /* Generate console logs for debugging
        console.log("Button clicked:", event.currentTarget);
        console.log("Dataset:", event.currentTarget.dataset);
        console.log("Category from dataset:", event.currentTarget.dataset.category);*/

        const category = event.currentTarget.dataset.category || "basic";
        // console.log("Final category:", category); // More console logging
        const skills = this.actor.system.skills;
        const newSkill = {
            name: "",
            characteristic: "",
            category: category,
            trained: false,
            advances: 0,
            modifier: 0
        };
        
        // console.log("New skill being created:", newSkill); // Even MORE console logging

        await this.actor.update({
            "system.skills": [...skills, newSkill]
        });
    }

    /**
     * Handle deleting a skill
     * @param {Event} event   The originating click event
     * @private
     */
    async _onDeleteSkill(event) {
        event.preventDefault();
        
        const index = parseInt(event.currentTarget.dataset.index);
        const skills = [...this.actor.system.skills];
        
        // Remove the skill at the specified index
        skills.splice(index, 1);
        
        await this.actor.update({
            "system.skills": skills
        });
    }

    /**
     * Handle adding a new talent
     * @param {Event} event   The originating click event
     * @private
     */
    async _onAddTalent(event) {
        event.preventDefault();
        
        const talents = this.actor.system.talents;
        const newTalent = {
            name: "",
            description: "",
            timesTaken: 1
        };
        
        await this.actor.update({
            "system.talents": [...talents, newTalent]
        });
    }

    /**
     * Handle deleting a talent
     * @param {Event} event   The originating click event
     * @private
     */
    async _onDeleteTalent(event) {
        event.preventDefault();
        
        const index = event.currentTarget.dataset.index;
        const talents = this.actor.system.talents;
        talents.splice(index, 1);
        
        await this.actor.update({
            "system.talents": talents
        });
    }

    /**
     * Handle rolling a characteristic
     * @param {Event} event   The originating click event
     * @private
     */
    async _onRollCharacteristic(event) {
        event.preventDefault();
        const characteristic = event.currentTarget.dataset.characteristic;
        await this.actor.rollCharacteristic(characteristic);
    }

    /**
     * Handle rolling a skill
     * @param {Event} event   The originating click event
     * @private
     */
    async _onRollSkill(event) {
        event.preventDefault();
        const skillIndex = parseInt(event.currentTarget.dataset.skillIndex);
        await this.actor.rollSkill(skillIndex);
    }

    /**
     * Handle editing an item
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemEdit(event) {
        /* Debugging logs
        console.log("!!! EDIT HANDLER CALLED !!!");
        console.log("Event:", event);
        console.log("Current target:", event.currentTarget);*/

        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) {
            item.sheet.render(true);
        }
    }

    /**
     * Handle deleting an item
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemDelete(event) {
        /* Debugging logs
        console.log("!!! DELETE HANDLER CALLED !!!");
        console.log("Event:", event);*/

        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) {
            await item.delete();
        }
    }

    /**
     * Handle toggling career as current
     * @param {Event} event   The originating change event
     * @private
     */
    async _onCareerCurrentToggle(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        const isChecked = event.currentTarget.checked;
        
        if (!item) return;
        
        // If checking this career as current, uncheck all other careers
        if (isChecked) {
            const otherCareers = this.actor.items.filter(i => i.type === "career" && i.id !== itemId);
            for (let career of otherCareers) {
                if (career.system.isCurrent) {
                    await career.update({"system.isCurrent": false});
                }
            }
        }
        
        // Toggle this career
        await item.update({"system.isCurrent": isChecked});
    }

    /**
     * Handle setting career as entered
     * @param {Event} event   The originating change event
     * @private
     */
    async _onCareerEnteredChange(event) {
        event.preventDefault();
        const input = event.currentTarget;
        const itemId = input.dataset.itemId;
        const newValue = parseInt(input.value) || 0;
                
        // Get the career item from the actor
        const career = this.actor.items.get(itemId);

        if (career) {
            try {
                await career.update({"system.careerEntered": newValue});
                console.log(`Successfully updated career ${career.name} entered value to ${newValue}`);
            } catch (error) {
                console.error("Error updating career:", error);
            }
        } else {
            console.error("Career not found with ID:", itemId);
        }
    }

    /**
     * Handle rolling a weapon attack
     * @param {Event} event   The originating click event
     * @private
     */
    async _onWeaponAttack(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const weapon = this.actor.items.get(itemId);

        if (!weapon) {
            console.error("Weapon not found!");
            return;
        }

        // Create and show dialog window
        const dialog = await WeaponAttackDialog.create(this.actor, weapon);

        if (dialog) {
            await dialog.executeAttack();
        }
    }

    /**
     * Handle toggling armour equipped status
     * @param {Event} event   The originating change event
     * @private
     */
    async _onArmourEquippedToggle(event) {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const itemId = checkbox.dataset.itemId;
        const isEquipped = checkbox.checked;

        // console.log("=== ARMOUR TOGGLE ==="); // Debugging log

        // Get the armour item from the actor
        const armour = this.actor.items.get(itemId);

        if (armour) {
            // Use update instead of setFlag
            await armour.update({
                "flags.fvtt-wfrp2e.isEquipped": isEquipped
            })

            // console.log("Flag updated via update()");

            // Verify
            const flagValue = armour.getFlag('fvtt-wfrp2e', 'isEquipped');
            // console.log("Flag value:", flagValue);
        }
    }
    
    /**
     * Handle adding a new mutation
     * @param {Event} event   The originating click event
     * @private
     */
    async _onAddMutation(event) {
        event.preventDefault();
        
        const mutations = this.actor.system.mutations;
        const newMutation = {
            name: "",
            description: ""
        };
        
        await this.actor.update({
            "system.mutations": [...mutations, newMutation]
        });
    }

    /**
     * Handle deleting a mutation
     * @param {Event} event   The originating click event
     * @private
     */
    async _onDeleteMutation(event) {
        event.preventDefault();
        
        const index = event.currentTarget.dataset.index;
        const mutations = this.actor.system.mutations;
        mutations.splice(index, 1);
        
        await this.actor.update({
            "system.mutations": mutations
        });
    }

    /**
     * Handle adding a new insanity
     * @param {Event} event   The originating click event
     * @private
     */
    async _onAddInsanity(event) {
        event.preventDefault();
        
        const insanities = this.actor.system.insanities;
        const newInsanity = {
            name: "",
            description: ""
        };
        
        await this.actor.update({
            "system.insanities": [...insanities, newInsanity]
        });
    }

    /**
     * Handle deleting an insanity
     * @param {Event} event   The originating click event
     * @private
     */
    async _onDeleteInsanity(event) {
        event.preventDefault();
        
        const index = event.currentTarget.dataset.index;
        const insanities = this.actor.system.insanities;
        insanities.splice(index, 1);
        
        await this.actor.update({
            "system.insanities": insanities
        });
    }

    /**
     * Handle adding a new special rule
     * @param {Event} event   The originating click event
     * @private
     */
    async _onAddSpecialRule(event) {
        event.preventDefault();
        
        const specialRules = this.actor.system.specialRules;
        const newRule = {
            name: "",
            description: ""
        };
        
        await this.actor.update({
            "system.specialRules": [...specialRules, newRule]
        });
    }

    /**
     * Handle deleting a special rule
     * @param {Event} event   The originating click event
     * @private
     */
    async _onDeleteSpecialRule(event) {
        event.preventDefault();
        
        const index = event.currentTarget.dataset.index;
        const specialRules = this.actor.system.specialRules;
        specialRules.splice(index, 1);
        
        await this.actor.update({
            "system.specialRules": specialRules
        });
    }
}