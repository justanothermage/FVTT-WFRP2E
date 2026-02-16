export class SpellDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({initial: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}),
            castNumber: new fields.NumberField({initial: 1, min:1}),
            castTime: new fields.StringField({initial: ""}),
            duration: new fields.StringField({initial: ""}),
            range: new fields.StringField({initial: ""}),
            target: new fields.StringField({initial: ""}),
            healing: new fields.StringField({initial: "None"}),
            ingredientBonus: new fields.NumberField({initial: 0}),
            ingredient: new fields.StringField({initial: ""}),
            attacks: new fields.StringField({initial: "None"}),
            damage: new fields.StringField({initial: "None"}),
            level: new fields.StringField({initial: "Petty"}),
        };
    }
}