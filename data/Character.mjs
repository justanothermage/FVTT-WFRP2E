export class CharacterDataModel extends foundry.abstract.TypeDataModel
{
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            // Personal Details
            personalDetails: new fields.SchemaField({
                race: new fields.StringField({initial: ""}),
                // Astrology
                starSign: new fields.StringField({initial: ""}),
                doom: new fields.StringField({initial: ""}),
                // Appearance
                gender: new fields.StringField({initial: ""}),
                build: new fields.StringField({initial: ""}),
                age: new fields.NumberField({integer: true, initial: 20, min: 0}),
                height: new fields.StringField({initial: ""}),
                weight: new fields.StringField({initial: ""}),
                eyes: new fields.StringField({initial: ""}),
                skin: new fields.StringField({initial: ""}),
                hair: new fields.StringField({initial: ""}),
                distinguishingMarks: new fields.StringField({initial: ""})
            }),

            // Career Information; handled by items, just stores previous careers text
            previousCareersText: new fields.StringField({initial: ""}),

            // Main Characteristics
            characteristics: new fields.SchemaField({
                ws: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                bs: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                s: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                t: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                ag: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                int: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                wp: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc:new fields.NumberField({required:true,integer:true,initial : 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                fel: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                })
            }),

            // Secondary Characteristics
            secondary: new fields.SchemaField({
                attacks: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 1}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 1})
                }),
                wounds: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc:new fields.NumberField({required:true,integer:true,initial : 0}),
                    max: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                strengthBonus: new fields.SchemaField({
                    value: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                toughnessBonus: new fields.SchemaField({
                    value: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                movement: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 4}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc:new fields.NumberField({required:true,integer:true,initial : 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 4})
                }),
                magic: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    talents: new fields.NumberField({required: true, integer: true, initial: 0}),
                    career: new fields.NumberField({required: true, integer: true, initial: 0}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc:new fields.NumberField({required:true,integer:true,initial : 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                insanityPoints: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                fatePoints: new fields.SchemaField({
                    initial: new fields.NumberField({required: true, integer: true, initial: 0}),
                    misc: new fields.NumberField({required: true, integer: true, initial: 0}),
                    //current: new fields.NumberField({required: true, integer: true, initial: 0})
                })
            }),

            /* Armour Points by Location; placeholder until armor item gets implemented
            armour: new fields.SchemaField({
                head: new fields.NumberField({required: true, integer: true, initial: 0}),
                body: new fields.NumberField({required: true, integer: true, initial: 0}),
                leftArm: new fields.NumberField({required: true, integer: true, initial: 0}),
                rightArm: new fields.NumberField({required: true, integer: true, initial: 0}),
                leftLeg: new fields.NumberField({required: true, integer: true, initial: 0}),
                rightLeg: new fields.NumberField({required: true, integer: true, initial: 0})
            }),*/

            // Experience and Advancement
            experience: new fields.SchemaField({
                total: new fields.NumberField({required: true, integer: true, initial: 0}),
                spent: new fields.NumberField({required: true, integer: true, initial: 0}),
                current: new fields.NumberField({required: true, integer: true, initial: 0})
            }),

            // Money
            money: new fields.SchemaField({
                gold: new fields.NumberField({required: true, integer: true, initial: 0}),
                silver: new fields.NumberField({required: true, integer: true, initial: 0}),
                brass: new fields.NumberField({required: true, integer: true, initial: 0})
            }),

            // Skills - stored as an array of skill objects
            skills: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({required: true}),
                    characteristic: new fields.StringField({required: true}),
                    category: new fields.StringField({required: true, initial: "basic", choices: ["basic", "advanced", "knowledge", "other"]}),
                    trained: new fields.BooleanField({initial: false}),
                    advances: new fields.NumberField({required: true, integer: true, initial: 0}),
                    modifier: new fields.NumberField({required: true, integer: true, initial: 0})
                }),
                {initial: []}
            ),

            // Special Rules - stored as array
            specialRules: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({required: true}),
                    description: new fields.StringField({initial: ""})
                }),
                {initial: []}
            ),

            // Biography and notes
            biography: new fields.HTMLField({initial: ""}),
            history: new fields.HTMLField({initial: ""}),
            notes: new fields.HTMLField({initial: ""})
        }
    }
}