export const DEFAULT_SKILLS = {
    basic: [
        { name: "Animal Care", characteristic: "int" },
        { name: "Charm", characteristic: "fel" },
        { name: "Command", characteristic: "fel" },
        { name: "Concealment", characteristic: "ag" },
        { name: "Consume Alcohol", characteristic: "t" },
        { name: "Disguise", characteristic: "fel" },
        { name: "Drive", characteristic: "s" },
        { name: "Evaluate", characteristic: "int" },
        { name: "Gamble", characteristic: "int" },
        { name: "Gossip", characteristic: "fel" },
        { name: "Haggle", characteristic: "fel" },
        { name: "Intimidate", characteristic: "s" },
        { name: "Outdoor Survival", characteristic: "int" },
        { name: "Perception", characteristic: "int" },
        { name: "Ride", characteristic: "ag" },
        { name: "Row", characteristic: "s" },
        { name: "Scale Sheer Surface", characteristic: "s" },
        { name: "Search", characteristic: "int" },
        { name: "Silent Move", characteristic: "ag" },
        { name: "Swim", characteristic: "s" }
    ],
    advanced: [
        { name: "Animal Training", characteristic: "fel" },
        { name: "Blather", characteristic: "fel" },
        { name: "Channelling", characteristic: "wp" },
        { name: "Charm Animal", characteristic: "fel" },
        { name: "Dodge Blow", characteristic: "ag" },
        { name: "Follow Trail", characteristic: "int" },
        { name: "Heal", characteristic: "int" },
        { name: "Hypnotism", characteristic: "wp" },
        { name: "Lip Reading", characteristic: "int" },
        { name: "Magical Sense", characteristic: "wp" },
        { name: "Navigation", characteristic: "int" },
        { name: "Pick Lock", characteristic: "ag" },
        { name: "Prepare Poison", characteristic: "int" },
        { name: "Read and Write", characteristic: "int" },
        { name: "Sail", characteristic: "ag" },
        { name: "Set Trap", characteristic: "ag" },
        { name: "Shadowing", characteristic: "ag" }
    ],
    knowledge: [],
    other: []
};

console.log("DEFAULT_SKILLS defined:", DEFAULT_SKILLS);
window.DEFAULT_SKILLS = DEFAULT_SKILLS;