import { Shadowrun6ActorSheetPC } from "/systems/shadowrun6-eden/module/sheets/ActorSheetPC.js";

export class SR6Actor extends Shadowrun6ActorSheetPC {
    /** @override */
    static get defaultOptions() {
        const options = super.defaultOptions;
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "modules/shadowrun-6-eden-ameliorations/templates/actor/shadowrun6-Player-sheet.html",
            dragDrop: [
                {
                    dragSelector: ".item-list .item",
                    dropSelector: null,
                }, // possibly also add a.item-roll and a.spell-roll
            ],
        });
    }
};