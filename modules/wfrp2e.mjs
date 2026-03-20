import {WHCharacter} from "../documents/Character.mjs";
import {CharacterDataModel} from "../data/Character.mjs";
import {CareerDataModel} from "../data/Career.mjs";
import {WeaponDataModel} from "../data/Weapon.mjs";
import {ArmourDataModel} from "../data/Armour.mjs";
import {TalentDataModel} from "../data/Talent.mjs";
import {SpellDataModel} from "../data/Spell.mjs";
import {MutationDataModel} from "../data/Mutation.mjs";
import {InsanityDataModel} from "../data/Insanity.mjs";
import {EquipmentDataModel} from "../data/Equipment.mjs";
import {WHCharacterSheet} from "../sheets/Character.mjs";
import {WHCareerSheet} from "../sheets/Career.mjs";
import {WHWeaponSheet} from "../sheets/Weapon.mjs";
import {WHArmourSheet} from "../sheets/Armour.mjs";
import {WHSpellSheet} from "../sheets/Spell.mjs";
import {WHTalentSheet} from "../sheets/Talent.mjs";
import {WHMutationSheet} from "../sheets/Mutation.mjs";
import {WHInsanitySheet} from "../sheets/Insanity.mjs";
import {WHEquipmentSheet} from "../sheets/Equipment.mjs";
import {DEFAULT_SKILLS} from "../modules/default-skills.mjs";

Hooks.once("init", function () {
    console.log("wfrp2e | Initializing system");
    
    // Register data models
    CONFIG.Actor.dataModels.character = CharacterDataModel;
    CONFIG.Item.dataModels.career = CareerDataModel;
    CONFIG.Item.dataModels.armour = ArmourDataModel;
    CONFIG.Item.dataModels.weapon = WeaponDataModel;
    CONFIG.Item.dataModels.spell = SpellDataModel;
    CONFIG.Item.dataModels.talent = TalentDataModel;
    CONFIG.Item.dataModels.mutation = MutationDataModel;
    CONFIG.Item.dataModels.insanity = InsanityDataModel;
    CONFIG.Item.dataModels.equipment = EquipmentDataModel;
    
    // Register custom Actor document class
    CONFIG.Actor.documentClass = WHCharacter;
    
    // Register character sheet
    Actors.registerSheet('fvtt-wfrp2e', WHCharacterSheet, {
        types: ["character"],
        makeDefault: true,
        label: "wfrp2e Character Sheet"
    });
    
    // Register Handlebars helpers for eqality checks
    Handlebars.registerHelper('eq', function(a, b) {
        return a === b;
    });

    Handlebars.registerHelper('gt', function(a, b) {
        return a > b;
    });

    // Set initiative formula
    CONFIG.Combat.initiative = {
        formula: "1d10 + @characteristics.ag.current",
        decimals: 0
    };


    // Register item sheets
    Items.registerSheet('fvtt-wfrp2e', WHCareerSheet, {
        types: ["career"],
        makeDefault: true,
        label: "wfrp2e Career"
    });
    Items.registerSheet('wfrp2e', WHArmourSheet, {
        types: ["armour"],
        makeDefault: true,
        label: "WFRP2E Armour"
    });
    Items.registerSheet('wfrp2e', WHWeaponSheet, {
        types: ["weapon"],
        makeDefault: true,
        label: "WFRP2E Weapon"
    });
    Items.registerSheet('wfrp2e', WHSpellSheet, {
        types: ["spell"],
        makeDefault: true,
        label: "WFRP2E Spell"
    });
    Items.registerSheet('wfrp2e', WHTalentSheet, {
        types: ["talent"],
        makeDefault: true,
        label: "WFRP2E Talent"
    });
    Items.registerSheet('wfrp2e', WHMutationSheet, {
        types: ["mutation"],
        makeDefault: true,
        label: "WFRP2E Mutation"
    });
    Items.registerSheet('wfrp2e', WHInsanitySheet, {
        types: ["insanity"],
        makeDefault: true,
        label: "WFRP2E Insanity"
    });
    Items.registerSheet('wfrp2e', WHEquipmentSheet, {
        types: ["equipment"],
        makeDefault: true,
        label: "WFRP2E Equipment"
    });

    console.log("wfrp2e | System initialized");
    console.log("wfrp2e | Actor class:", CONFIG.Actor.documentClass.name);
    console.log("wfrp2e | Data Models:", CONFIG.Actor.dataModels, CONFIG.Item.dataModels);
});

// Hotbar macro creation
Hooks.on("hotbarDrop", async (bar, data, slot) => {
    // Only handle our custom macro types
    if (!data.macroType) return true;
    
    if (data.macroType === "skill") {
        await createSkillMacro(data, slot);
        return false;
    } else if (data.macroType === "spell") {
        await createSpellMacro(data, slot);
        return false;
    } else if (data.macroType === "weapon") {
        await createWeaponMacro(data, slot);
        return false;
    } else if (data.macroType === "parry") {
        await createParryMacro(data, slot);
        return false;
    }

    return true;
});

/**
 * Create a macro for rolling a skill
 */
async function createSkillMacro(data, slot) {
    const actor = game.actors.get(data.actorId);
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }
    
    const command = `// Roll ${data.skillName}
    const actor = game.actors.get("${data.actorId}");
    if (!actor) {
        ui.notifications.warn("Actor not found!");
    } else {
        actor.rollSkill(${data.skillIndex});
    }`;

    // Check if macro already exists
    let macro = game.macros.find(m => 
        (m.name === `${actor.name}: ${data.skillName}`) && 
        (m.command === command)
    );
    
    if (!macro) {
        macro = await Macro.create({
            name: `${actor.name}: ${data.skillName}`,
            type: "script",
            img: "icons/svg/d20-grey.svg",
            command: command,
            flags: { "fvtt-wfrp2e.skillMacro": true }
        });
    }
    
    if (macro) {
        game.user.assignHotbarMacro(macro, slot);
    }
}

/**
 * Create a macro for casting a spell
 */
async function createSpellMacro(data, slot) {
    const actor = game.actors.get(data.actorId);
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }
    
    const command = `// Cast ${data.itemName}
    const actor = game.actors.get("${data.actorId}");
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }

    const spell = actor.items.get("${data.itemId}");
    if (!spell) {
        ui.notifications.warn("Spell not found!");
        return;
    }

    // Dynamic import to load the spell casting dialog
    import("/systems/fvtt-wfrp2e/modules/spell-casting-dialog.mjs").then(async (module) => {
        const dialog = await module.SpellCastingDialog.create(actor, spell);
        if (dialog) await dialog.executeCast();
    });`;

    // Check if macro already exists
    let macro = game.macros.find(m => 
        (m.name === `${actor.name}: ${data.itemName}`) && 
        (m.command === command)
    );
    
    if (!macro) {
        macro = await Macro.create({
            name: `${actor.name}: ${data.itemName}`,
            type: "script",
            img: data.itemImg || "icons/magic/symbols/runes-star-magenta.webp",
            command: command,
            flags: { "fvtt-wfrp2e.spellMacro": true }
        });
    }
    
    if (macro) {
        game.user.assignHotbarMacro(macro, slot);
    }
}

/**
 * Create a macro for attacking with a weapon
 */
async function createWeaponMacro(data, slot) {
    const actor = game.actors.get(data.actorId);
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }
    
    const command = `// Attack with ${data.itemName}
    const actor = game.actors.get("${data.actorId}");
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }

    const weapon = actor.items.get("${data.itemId}");
    if (!weapon) {
        ui.notifications.warn("Weapon not found!");
        return;
    }

    // Use the weapon attack dialog
    import("/systems/fvtt-wfrp2e/modules/weapon-attack-dialog.mjs").then(async (module) => {
        const dialog = await module.WeaponAttackDialog.create(actor, weapon);
        if (dialog) await dialog.executeAttack();
    });`;

    // Check if macro already exists
    let macro = game.macros.find(m => 
        (m.name === `${actor.name}: ${data.itemName}`) && 
        (m.command === command)
    );
    
    if (!macro) {
        macro = await Macro.create({
            name: `${actor.name}: ${data.itemName}`,
            type: "script",
            img: data.itemImg || "icons/weapons/swords/sword-broad-iron.webp",
            command: command,
            flags: { "fvtt-wfrp2e.weaponMacro": true }
        });
    }
    
    if (macro) {
        game.user.assignHotbarMacro(macro, slot);
    }
}

/**
 * Create a macro for parrying with a weapon
 */
async function createParryMacro(data, slot) {
    const actor = game.actors.get(data.actorId);
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }
    
    const command = `// Parry with ${data.itemName}
    const actor = game.actors.get("${data.actorId}");
    if (!actor) {
        ui.notifications.warn("Actor not found!");
        return;
    }

    const weapon = actor.items.get("${data.itemId}");
    if (!weapon) {
        ui.notifications.warn("Weapon not found!");
        return;
    }

    // Call the existing rollParry method
    actor.rollParry(weapon);`;

    // Check if macro already exists
    let macro = game.macros.find(m => 
        (m.name === `${actor.name}: Parry (${data.itemName})`) && 
        (m.command === command)
    );
    
    if (!macro) {
        macro = await Macro.create({
            name: `${actor.name}: Parry (${data.itemName})`,
            type: "script",
            img: data.itemImg || "icons/equipment/shield/heater-steel-worn.webp",
            command: command,
            flags: { "fvtt-wfrp2e.parryMacro": true }
        });
    }
    
    if (macro) {
        game.user.assignHotbarMacro(macro, slot);
    }
}

// Hook that runs when a new actor is created
Hooks.on("preCreateActor", (actor, data, options, userId) => {    
    // Adds default skills for character type actors
    if (actor.type !== "character") return;
        
    // Build the skills array from defaults
    const skills = [];
    
    // Add basic skills
    for (let skill of DEFAULT_SKILLS.basic) {
        skills.push({
            name: skill.name,
            characteristic: skill.characteristic,
            category: "basic",
            trained: false,
            advances: 0,
            modifier: 0
        });
    }
    
    // Add advanced skills
    for (let skill of DEFAULT_SKILLS.advanced) {
        skills.push({
            name: skill.name,
            characteristic: skill.characteristic,
            category: "advanced",
            trained: false,
            advances: 0,
            modifier: 0
        });
    }
    
    // Add knowledge skills
    for (let skill of DEFAULT_SKILLS.knowledge) {
        skills.push({
            name: skill.name,
            characteristic: skill.characteristic,
            category: "knowledge",
            trained: false,
            advances: 0,
            modifier: 0
        });
    }
    
    // Add other skills
    for (let skill of DEFAULT_SKILLS.other) {
        skills.push({
            name: skill.name,
            characteristic: skill.characteristic,
            category: "other",
            trained: false,
            advances: 0,
            modifier: 0
        });
    }
    
    console.log("WFRP2E | Adding", skills.length, "default skills");
    
    // Update the actor with default skills
    actor.updateSource({"system.skills": skills});
});