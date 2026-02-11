export class ArmourDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({initial: ""}),
            cost: new fields.NumberField({initial: 0, min:0}),
            encumbrance: new fields.NumberField({initial: 0, min:0}),
            head: new fields.NumberField({initial: 0, min:0}),
            legLeft: new fields.NumberField({initial: 0, min:0}),
            legRight: new fields.NumberField({initial: 0, min:0}),
            armLeft: new fields.NumberField({initial: 0, min:0}),
            armRight: new fields.NumberField({initial: 0, min:0}),
            body: new fields.NumberField({initial: 0, min:0}),
            armourType: new fields.NumberField({initial: 0, min:0}),
            availability: new fields.StringField({initial: ""}),
        };
    }
}