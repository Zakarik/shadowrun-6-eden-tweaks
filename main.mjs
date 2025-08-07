import { SR6Items } from "./sheets/SR6Items.js";
import { SR6Actor } from "./sheets/SR6Actor.js";
import { SR6NPC } from "./sheets/SR6NPC.js";
import { SR6BaseActor } from "./sheets/SR6BaseActor.js";
import { SR6Vehicle } from "./sheets/SR6Vehicle.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { SR6IMPORT } from "./util/npc.js";
import { SYSTEM_NAME } from "/systems/shadowrun6-eden/module/constants.js";

Hooks.on('init', () => {
    CONFIG.Actor.documentClass = SR6BaseActor;
    CONFIG.SR6.SPIRIT_TYPES.sang = 'SRT.Sang'
    Actors.registerSheet("shadowrun6-eden", SR6Vehicle, { types: ["Vehicle"], makeDefault: true });
    document.addEventListener('paste', function(event) {
      event.stopImmediatePropagation();
      // TA logique ici
      console.log("Paste intercepté par MON module !");
      // Optionnel : event.preventDefault(); pour empêcher aussi un éventuel default
    }, true); // true = phase de capture
    /*Actors.registerSheet("shadowrun6-eden", SR6Actor, { types: ["Player"], makeDefault: true });
    Items.registerSheet("shadowrun6-eden", SR6Items, {
        types: [
            "gear",
            "martialarttech",
            "martialartstyle",
            "quality",
            "spell",
            "adeptpower",
            "ritual",
            "metamagic",
            "focus",
            "echo",
            "complexform",
            "sin",
            "contact",
            "lifestyle",
            "critterpower",
            "software"
        ],
        makeDefault: true
    });

    Handlebars.registerHelper("addEditor", function(owner, editable, string) {


        const tpl = `{{editor ${"item.system."+string} target="system.${string}" button=true owner=${owner} editable=${editable} engine="prosemirror"}}`;

        // Compile dynamiquement la chaîne générée
        const template = Handlebars.compile(tpl);
        return new Handlebars.SafeString(template(this));
    });

    Handlebars.registerHelper('sort', function (items) {
        // On suppose que 'items' est un tableau d'objets avec une propriété 'sort'
        if (Array.isArray(items.contents)) {
            return items.contents.slice().sort((a, b) => {
                if (a.sort < b.sort) return -1;
                if (a.sort > b.sort) return 1;
                return 0;
            });
        }
        return items;
    });*/

    //preloadHandlebarsTemplates();
});


Hooks.on('renderActorDirectory', async function () {

      $("section#actors footer.action-buttons button.importer").remove();
      $("section#actors footer.action-buttons").append(`<button class='importer'>${game.i18n.localize('SRT.Import')}</button>`);

      $("section#actors footer.action-buttons button.importer").on( "click", async function() {
        const html = `<textarea class="toImport"></textarea>`;

        const dOptions = {
          classes: ["swt-import"],
          height:200
        };

        let d = new Dialog({
          title: game.i18n.localize('SRT.Import'),
          content:html,
          buttons: {
            one: {
                label: game.i18n.localize('SRT.Import'),
                callback: async (html) => {
                    let rawData = $(html).find('.toImport').val();

                    rawData = rawData.replace(/(\r\n|\n|\r)/gm, "\n");
                    if (game.packs.get("world.npcs") === undefined) {
                        await CompendiumCollection.createCompendium({
                            type: 'Actor',
                            name: "npcs",
                            label: "NPCs",
                            path: "",
                            private: false,
                            package: "sr6",
                            system: "shadowrun6-eden",
                        });
                    }
                    await rawData.split(/\n\n/).forEach(async (rawData) => {
                        try {
                            const npc = new SR6IMPORT(rawData.trim());
                            const actor = await Actor.create(npc.to_vtt());
                            let msg = game.i18n.format("shadowrun6.ui.notifications.statblock_import.success", { actor: actor.name });
                            if (game.settings.get(SYSTEM_NAME, "importToCompendium")) {
                                const cpActor = await game.packs.get("world.npcs").importDocument(actor);
                                await actor?.delete();
                                msg += game.i18n.format("shadowrun6.ui.notifications.statblock_import.npc_compendium");
                                const itm = await fromUuid("Compendium.world.armes.Item.1SRjq998SN5BICqW");
                                cpActor.createEmbeddedDocuments("Item", [itm]);
                            } else {
                                msg += game.i18n.format("shadowrun6.ui.notifications.statblock_import.actor_tab");
                                const itm = await fromUuid("Compendium.world.armes.Item.1SRjq998SN5BICqW");
                                actor.createEmbeddedDocuments("Item", [itm]);
                            }
                            ui.notifications.info(msg, { localize: false, console: false });
                            console.log('SR6E | NPC Importer | Succesfully imported', actor.name);
                        }
                        catch (e) {
                            console.error('SR6E | NPC Importer |', e, '\n',rawData);
                            ui.notifications.error("shadowrun6.ui.notifications.statblock_import.error", { localize: true, console: false });
                        }
                    });
                }
            }
          }
        },
        dOptions);
        d.render(true);
      });
  });
