export class WHCareerSheet extends ItemSheet {
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fvtt-wfrp2e", "sheet", "item", "career"],
            width: 600,
            height: 700,
            tabs: []
        });
    }

    /** @override */
    get template() {
        return "systems/fvtt-wfrp2e/templates/item/career-sheet.html";
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

        // When "Current Career" is checked, uncheck it on all other career items owned by the same actor
        html.find('[name="system.isCurrent"]').change(async (event) => {
            if (event.currentTarget.checked && this.item.parent) {
                // This career item is owned by an actor
                const actor = this.item.parent;
                const otherCareers = actor.items.filter(i => i.type === "career" && i.id !== this.item.id);
                
                for (let career of otherCareers) {
                    if (career.system.isCurrent) {
                        await career.update({"system.isCurrent": false});
                    }
                }
            }
        });
    }
}