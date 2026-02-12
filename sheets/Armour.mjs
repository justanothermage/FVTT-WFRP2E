export class WHArmourSheet extends ItemSheet {
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["wfrp2e", "sheet", "item", "armour"],
            width: 520,
            height: 600,
            tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "details"}]
        });
    }

    /** @override */
    get template() {
        return "systems/fvtt-wfrp2e/templates/item/armour-sheet.html";
    }

    /** @override */
    async getData(options) {
        const context = await super.getData(options);
        context.system = this.item.system;

        context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {
            async: true,
            secrets: this.item.isOwner
        });
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;
    }
}