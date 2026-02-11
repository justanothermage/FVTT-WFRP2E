export class CareerDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            isCurrent: new fields.BooleanField({initial: false}), // Current career checkbox
            careerEntered: new fields.NumberField({initial: 1, min:0}), // Career entered list
            careerWS: new fields.NumberField({initial: 0, min:0}),
            careerBS: new fields.NumberField({initial: 0, min:0}),
            careerS: new fields.NumberField({initial: 0, min:0}),
            careerT: new fields.NumberField({initial: 0, min:0}),
            careerAg: new fields.NumberField({initial: 0, min:0}),
            careerInt: new fields.NumberField({initial: 0, min:0}),
            careerWP: new fields.NumberField({initial: 0, min:0}),
            careerFel: new fields.NumberField({initial: 0, min:0}),
            careerAttacks: new fields.NumberField({initial: 0, min:0}),
            careerWounds: new fields.NumberField({initial: 0, min:0}),
            careerMovement: new fields.NumberField({initial: 0, min:0}),
            careerMagic: new fields.NumberField({initial: 0, min:0}),
            careerSkills: new fields.StringField({initial: ""}),
            careerTalents: new fields.StringField({initial: ""}),
            careerTrappings: new fields.StringField({initial: ""}),
            careerEntries: new fields.StringField({initial: ""}),
            careerExits: new fields.StringField({initial: ""}),
            careerDescription: new fields.StringField({initial: ""}),
        };
    }
}