export class EquipmentDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({initial: ""}),
            cost: new fields.NumberField({initial: 0, min:0}),
            encumbrance: new fields.NumberField({initial: 0, min:0}),
            availability: new fields.StringField({initial: ""})
        };
    }
}