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

// Debugging logs for missing default skills
//console.log("DEFAULT_SKILLS defined:", DEFAULT_SKILLS);
//console.log("wfrp2e.mjs - Basic skills count:", DEFAULT_SKILLS?.basic?.length);

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

// Hook that runs when a new actor is created
Hooks.on("preCreateActor", (actor, data, options, userId) => {
    console.log("WFRP2E | preCreateActor fired for:", actor.type);
    
    // Adds default skills for character type actors
    if (actor.type !== "character") return;
    
    // Debugging logs for missing default skills
    //console.log("WFRP2E | Current skills:", actor.system.skills);
    //console.log("WFRP2E | DEFAULT_SKILLS:", DEFAULT_SKILLS);
    //console.log("WFRP2E | DEFAULT_SKILLS.basic:", DEFAULT_SKILLS.basic.length);

    // Check for skills that already exist, temporarily disabled for debugging missing default skills
    //if (actor.system.skills && actor.system.skills.length > 0) {
    //    console.log("WFRP2E | Skills already exist, skipping defaults");
    //    return;
    //}
    
    console.log("WFRP2E | Adding default skills");
    
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
    
    // Debugging logs for missing default skills
    console.log("WFRP2E | Total skills to add:", skills.length);
    console.log("WFRP2E | Skills array:", skills);

    // Update the actor with default skills
    actor.updateSource({"system.skills": skills});

    // Debugging logs for missing default skills
    console.log("WFRP2E | After updateSource, actor.system.skills:", actor.system.skills);
});