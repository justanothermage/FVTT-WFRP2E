export class MutationDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({initial: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}),
        };
    }
}