
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

    /**
     * Activate an editor instance present within the form
     * @param {HTMLElement} div  The element which contains the editor
     * @protected
     */
    _activateEditor(div) {
      // Get the editor content div
      const name = div.dataset.edit;
      const engine = div.dataset.engine || "tinymce";
      const collaborate = div.dataset.collaborate === "true";
      const button = div.previousElementSibling;
      const hasButton = button && button.classList.contains("editor-edit");
      const wrap = div.parentElement.parentElement;
      const wc = div.closest(".window-content");

      // Determine the preferred editor height
      const heights = [wrap.offsetHeight, wc ? wc.offsetHeight : null];
      if ( div.offsetHeight > 0 ) heights.push(div.offsetHeight);
      const height = Math.min(...heights.filter(h => Number.isFinite(h)));

      // Get initial content
      const options = {
        target: div,
        fieldName: name,
        save_onsavecallback: () => this.saveEditor(name),
        height, engine, collaborate
      };
      if ( engine === "prosemirror" ) options.plugins = this._configureProseMirrorPlugins(name, {remove: hasButton});

      // Define the editor configuration
      const initial = foundry.utils.getProperty(this.object, name);
      const editor = this.editors[name] = {
        options,
        target: name,
        button: button,
        hasButton: hasButton,
        mce: null,
        instance: null,
        active: !hasButton,
        changed: false,
        initial
      };

      // Activate the editor immediately, or upon button click
      const activate = () => {
        editor.initial = foundry.utils.getProperty(this.object, name);
        this.activateEditor(name, {}, editor.initial);
      };
      if ( hasButton ) button.onclick = activate;
      else activate();
    }
}