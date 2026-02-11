export class WeaponDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({initial: ""}),
            cost: new fields.NumberField({initial: 0, min:0}),
            encumbrance: new fields.NumberField({initial: 0, min:0}),
            isRanged: new fields.BooleanField({initial: false}),
            group: new fields.StringField({initial: ""}),
            damage: new fields.NumberField({initial: 0, min:0}),
            range: new fields.NumberField({initial: 0, min:0}),
            reload: new fields.StringField({initial: ""}),
            qualities: new fields.StringField({initial: ""}),
            hasImpact: new fields.BooleanField({initial: false}),
            hasDefensive: new fields.BooleanField({initial: false}),
            availability: new fields.StringField({initial: ""})
        };
    }
}