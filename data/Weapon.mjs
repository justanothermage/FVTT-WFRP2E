export class WeaponDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({initial: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}),
            cost: new fields.NumberField({initial: 0, min:0}),
            encumbrance: new fields.NumberField({initial: 0, min:0}),
            isRanged: new fields.BooleanField({initial: false}),
            group: new fields.StringField({initial: "Ordinary"}),
            damage: new fields.NumberField({initial: 0, min:0}),
            damageBase: new fields.StringField({initial: "flat"}),
            damageModifier: new fields.NumberField({initial: 0}),
            range: new fields.StringField({initial: "none"}),
            reload: new fields.StringField({initial: "none"}),
            qualities: new fields.StringField({initial: "None"}),
            hasArmourPiercing: new fields.BooleanField({initial: false}),
            hasBalanced: new fields.BooleanField({initial: false}),
            hasDefensive: new fields.BooleanField({initial: false}),
            hasExperimental: new fields.BooleanField({initial: false}),
            hasFast: new fields.BooleanField({initial: false}),
            hasImpact: new fields.BooleanField({initial: false}),
            hasPrecise: new fields.BooleanField({initial: false}),
            hasPummelling: new fields.BooleanField({initial: false}),
            hasShrapnel: new fields.BooleanField({initial: false}),
            hasSlow: new fields.BooleanField({initial: false}),
            hasSnare: new fields.BooleanField({initial: false}),
            hasSpecial: new fields.BooleanField({initial: false}),
            hasTiring: new fields.BooleanField({initial: false}),
            hasUnreliable: new fields.BooleanField({initial: false}),
            availability: new fields.StringField({initial: "Average"}),
            craftsmanship: new fields.StringField({initial: "Common"}),
        };
    }
}