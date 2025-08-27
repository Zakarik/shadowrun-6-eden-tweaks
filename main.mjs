import { SR6BaseActor } from "./sheets/SR6BaseActor.js";
import { SR6Vehicle } from "./sheets/SR6Vehicle.js";
import { NPC } from "/systems/shadowrun6-eden/module/util/npc.js";
import { SYSTEM_NAME } from "/systems/shadowrun6-eden/module/constants.js";
import { SR6TConfig } from "./util/config.js";

Hooks.on('init', () => {
    CONFIG.Actor.documentClass = SR6BaseActor;
    game.sr6.config = CONFIG.SR6 = new SR6TConfig();
    Actors.registerSheet("shadowrun6-eden", SR6Vehicle, { types: ["Vehicle"], makeDefault: true });
    document.addEventListener('paste', function(event) {
      event.stopImmediatePropagation();
      // TA logique ici
      console.log("Paste intercepté par MON module !");
      // Optionnel : event.preventDefault(); pour empêcher aussi un éventuel default
    }, true); // true = phase de capture
});

Hooks.on('ready', () => {
    queueMicrotask(() => {
        game.sr6.config = CONFIG.SR6 = new SR6TConfig();
    })
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
                            const npc = new NPC(rawData.trim());
                            const actor = await Actor.create(npc.to_vtt());
                            let msg = game.i18n.format("shadowrun6.ui.notifications.statblock_import.success", { actor: actor.name });
                            if (game.settings.get(SYSTEM_NAME, "importToCompendium")) {
                                await game.packs.get("world.npcs").importDocument(actor);
                                await actor?.delete();
                                msg += game.i18n.format("shadowrun6.ui.notifications.statblock_import.npc_compendium");
                            } else {
                                msg += game.i18n.format("shadowrun6.ui.notifications.statblock_import.actor_tab");
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
