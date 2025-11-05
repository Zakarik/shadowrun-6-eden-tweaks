import { SR6BaseActor } from "./sheets/SR6BaseActor.js";
import { SR6Actor } from "./sheets/SR6Actor.js";
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

    libWrapper.register(
        'shadowrun-6-eden-ameliorations',
        'game.sr6.sr6roll.prototype.evaluate', // ou 'game.sr6.SR6Roll.prototype.evaluate'
        async function (wrapped, options = {}) {
            const useWildDie =
                this?.data?.useWildDie ??
                this?.configured?.useWildDie ??
                options?.useWildDie ??
                false;

            if(useWildDie) {
                this._formula = (Number(this._formula[0]) + 1).toString() + this._formula.slice(1);
            }

            const ret = await wrapped(options); // appelle la version d’origine

            if(useWildDie) {
                this._formula = (Number(this._formula[0]) + 1).toString() + this._formula.slice(1);
            }

            return ret; // on conserve la logique de base
        },
        'WRAPPER'
    );
    //preloadHandlebarsTemplates();
});

Hooks.on('ready', () => {
    queueMicrotask(() => {
        game.sr6.config = CONFIG.SR6 = new SR6TConfig();
    })

    libWrapper.register(
        'shadowrun-6-eden-ameliorations',
        "CONFIG.Actor.sheetClasses.Player['shadowrun6-eden.Shadowrun6ActorSheetPC'].cls.prototype._render",
        actorSheet_render,
        "WRAPPER");
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


async function actorSheet_render(wrapped, ...args) {
    await wrapped(...args);
    if (!this.actor.isOwner) return;

    const root = this.element?.[0];
    if (!root) return;

    // 1) Retrouver la table
    const wanted = game.i18n.localize("shadowrun6.section.derived");
    const wantedLower = wanted.toLowerCase();
    const h2 = [...root.querySelectorAll('div.tab.basics div.section h2.section-title')]
      .find(el => el.textContent.trim().toLowerCase() === wantedLower);
    if (!h2) return;

    const section = h2.closest('div.section');
    const table = section?.querySelector(':scope > table');
    if (!table) return;

    const tbody = table.tBodies[0] || table.createTBody();

    // 2) Préparer les données
    const i18n = game.i18n;
    const labelActions = i18n.localize("SRT.ActionsMM");
    const modes = [
      { key: "physical", label: i18n.localize("shadowrun6.initiative.physical"), pool: this.actor.system.initiative.physical?.dicePool ?? 0 },
      { key: "astral",   label: i18n.localize("shadowrun6.initiative.astral"),   pool: this.actor.system.initiative.astral?.dicePool ?? 0 },
      { key: "matrix",   label: i18n.localize("shadowrun6.initiative.matrix"),   pool: this.actor.system.initiative.matrix?.dicePool ?? 0 },
    ];

    // 3) Construire en mémoire puis injecter d’un coup
    const frag = document.createDocumentFragment();

    for (const { label, pool } of modes) {
      const tr = document.createElement('tr');

      const tdLeft = document.createElement('td');
      tdLeft.colSpan = 3;
      const b1 = document.createElement('b');
      b1.textContent = labelActions;
      const b2 = document.createElement('b');
      b2.textContent = label;
      tdLeft.append(b1, ' | ', b2);

      const tdRight = document.createElement('td');
      tdRight.style.textAlign = 'center';
      const bL = document.createElement('b');
      bL.textContent = '1';
      const bR = document.createElement('b');
      bR.textContent = String((Number(pool) || 0) + 1);
      tdRight.append(bL, ' / ', bR);

      tr.append(tdLeft, tdRight);
      frag.appendChild(tr);
    }

    tbody.appendChild(frag);
}