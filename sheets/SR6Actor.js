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
    /* -------------------------------------------- */
    /*  Drag and Drop                               */
    /* --------------------------------------------

    /** @inheritdoc */
    _onDragStart(event) {
      const li = event.currentTarget;
      if ( "link" in event.target.dataset ) return;

      // Create drag data
      let dragData;

      // Owned Items
      if ( li.dataset.itemId ) {
        const item = this.actor.items.get(li.dataset.itemId);
        dragData = item.toDragData();
      }

      console.warn(dragData);

      // Active Effect
      if ( li.dataset.effectId ) {
        const effect = this.actor.effects.get(li.dataset.effectId);
        dragData = effect.toDragData();
      }

      console.warn(dragData);

      if ( !dragData ) return;

      // Set data transfer
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
    /* -------------------------------------------- */

    /** @inheritdoc */
    async _onDrop(event) {
      const data = TextEditor.getDragEventData(event);
      const actor = this.actor;
      const allowed = Hooks.call("dropActorSheetData", actor, this, data);
      if ( allowed === false ) return;

      console.warn('test6')

      // Handle different data types
      switch ( data.type ) {
        case "ActiveEffect":
          return this._onDropActiveEffect(event, data);
        case "Actor":
          return this._onDropActor(event, data);
        case "Item":
          return this._onDropItem(event, data);
        case "Folder":
          return this._onDropFolder(event, data);
      }
    }
};