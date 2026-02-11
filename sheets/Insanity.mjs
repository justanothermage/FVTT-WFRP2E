export class WHInsanitySheet extends ItemSheet {
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["wfrp2e", "sheet", "item", "insanity"],
            width: 500,
            height: 600,
            tabs: []
        });
    }

    /** @override */
    get template() {
        return "systems/fvtt-wfrp2e/templates/item/insanity-sheet.html";
    }

    /** @override */
    async getData(options) {
        const context = await super.getData(options);
        context.system = this.item.system;
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;
    }
}