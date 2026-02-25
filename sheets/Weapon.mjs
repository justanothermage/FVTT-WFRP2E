export class WHWeaponSheet extends ItemSheet {
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["wfrp2e", "sheet", "item", "weapon"],
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "details" }]
        });
    }

    /** @override */
    get template() {
        return "systems/fvtt-wfrp2e/templates/item/weapon-sheet.html";
    }

    /** @override */
    async getData(options) {
        const context = await super.getData(options);
        context.system = this.item.system;

        if (context.system.damageBase === undefined) {
            context.system.damageBase = "flat";
            context.system.damageModifier = context.system.damage ?? 0;
        }

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;

        html.find('select[name="system.damageBase"]').on("change", (event) => {
            const modifier = html.find('input[name="system.damageModifier"]');
            if (event.target.value === "none") {
                modifier.addClass("hidden");
            } else {
                modifier.removeClass("hidden");
            }
        });
    }
}