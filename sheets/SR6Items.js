
import { SR6ItemSheet } from "/systems/shadowrun6-eden/module/sheets/SR6ItemSheet.js";

function getSystemData(obj) {
    if (game.release.generation >= 10)
        return obj.system;
    return obj.data.data;
}
function getActorData(obj) {
    if (game.release.generation >= 10)
        return obj;
    return obj.data;
}

export class SR6Items extends SR6ItemSheet {
    get template() {
        console.log("SR6E | in template()", getSystemData(this.item));
        let path = "systems/shadowrun6-eden/templates/item/";

        //const path = "modules/shadowrun-6-eden-ameliorations/templates/item/";
        console.log(`SR6E | ${path}shadowrun6-${getActorData(this.item).type}-sheet.html`);
        if (this.isEditable) {
            console.log("SR6E | ReadWrite sheet ");

            switch(getActorData(this.item).type) {
                case 'gear':
                case 'martialarttech':
                case 'martialartstyle':
                case 'quality':
                case 'spell':
                case 'adeptpower':
                case 'ritual':
                case 'metamagic':
                case 'focus':
                case 'echo':
                case 'complexform':
                case 'sin':
                case 'contact':
                case 'lifestyle':
                case 'critterpower':
                case 'software':
                    path = `modules/shadowrun-6-eden-ameliorations/templates/item/`;
                    break;

                default:
                    path = `systems/shadowrun6-eden/templates/item/`;
                    break;
            }

            return `${path}shadowrun6-${getActorData(this.item).type}-sheet.html`;
        }
        else {
            console.log("SR6E | ReadOnly sheet", this);
            let genItem = getSystemData(this.item);
            this.item.descHtml = game.i18n.localize(getActorData(this.item).type + "." + genItem.genesisID + ".desc");
            getActorData(this.item).descHtml2 = game.i18n.localize(getActorData(this.item).type + "." + genItem.genesisID + ".desc");
            return `${path}shadowrun6-${getActorData(this.item).type}-sheet-ro.html`;
        }
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);
        // Owner Only Listeners
        if (this.isEditable) {
            html.find(".editor-content").each((i, div) => this._activateEditor(div));
        }
    }
}