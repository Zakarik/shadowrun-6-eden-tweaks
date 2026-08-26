//import { SR6BaseActor } from "./sheets/SR6BaseActor.js";
//import { SR6Actor } from "./sheets/SR6Actor.js";
import { SR6Vehicle } from "./sheets/SR6Vehicle.js";
import { NPC } from "/systems/shadowrun6-eden/module/util/npc.js";
import { SYSTEM_NAME } from "/systems/shadowrun6-eden/module/constants.js";
//import { SR6TConfig } from "./util/config.js";

Hooks.on('init', () => {
    //CONFIG.Actor.documentClass = SR6BaseActor;
    //game.sr6.config = CONFIG.SR6 = new SR6TConfig();
    Actors.registerSheet("shadowrun6-eden", SR6Vehicle, { types: ["Vehicle"], makeDefault: true });
    /*document.addEventListener('paste', function(event) {
      event.stopImmediatePropagation();
      // TA logique ici
      console.log("Paste intercepté par MON module !");
      // Optionnel : event.preventDefault(); pour empêcher aussi un éventuel default
    }, true);*/ // true = phase de capture

    libWrapper.register(
        'shadowrun-6-eden-ameliorations',
        'game.sr6.roll.prototype.evaluate',
        async function (wrapped, options = {}) {
            const useWildDie =
                this?.data?.useWildDie ??
                this?.configured?.useWildDie ??
                options?.useWildDie ??
                false;

            if (!useWildDie || !this._formula || !this._formula.includes('cs>=5')) {
                return wrapped(options);
            }

            const originalPool = this.data?.pool;
            const originalConfiguredPool = this.configured?.pool;
            const originalFormula = this._formula;

            try {
                if (this.data && typeof this.data.pool === 'number') {
                    this.data.pool = this.data.pool + 1;
                }
                if (this.configured && typeof this.configured.pool === 'number') {
                    this.configured.pool = this.configured.pool + 1;
                }

                const terms = originalFormula.split(' + ');
                const newTerms = terms.map((term, idx) => {
                    if (idx % 2 !== 0) return term;
                    return term.replace(/^(\d+)d6/, (m, n) => `${parseInt(n, 10) + 1}d6`);
                });
                this._formula = newTerms.join(' + ');

                const ret = await wrapped(options);

                // Restaurer les valeurs originales pour l'affichage
                if (this.data) this.data.pool = originalPool;
                if (this.configured) this.configured.pool = originalConfiguredPool;

                // Reconstruire la formule "propre" comme le ferait evaluateResult()
                // basée sur le pool original (sans le +1 du wild die)
                if (typeof originalPool === 'number') {
                    this._formula = `${originalPool+1}d6`;
                } else {
                    this._formula = originalFormula;
                }

                return ret;
            } catch (err) {
                if (this.data) this.data.pool = originalPool;
                if (this.configured) this.configured.pool = originalConfiguredPool;
                this._formula = originalFormula;
                throw err;
            }
        },
        'WRAPPER'
    );




    /*libWrapper.register(
        'shadowrun-6-eden-ameliorations',
        'game.sr6.sr6roll.prototype.evaluate', // ou 'game.sr6.SR6Roll.prototype.evaluate'
        async function (wrapped, options = {}) {
            const useWildDie =
                this?.data?.useWildDie ??
                this?.configured?.useWildDie ??
                options?.useWildDie ??
                false;

            if(useWildDie) this._formula = (Number(this._formula[0]) + 1).toString() + this._formula.slice(1);

            const ret = await wrapped(options); // appelle la version d’origine

            if(useWildDie) this._formula = (Number(this._formula[0]) + 1).toString() + this._formula.slice(1);

            return ret; // on conserve la logique de base
        },
        'WRAPPER'
    );*/

    for(let status of CONFIG.statusEffects) {
        status.label = status.name;
    }
    //preloadHandlebarsTemplates();
});

Hooks.on('ready', () => {
    /*queueMicrotask(() => {
        game.sr6.config = CONFIG.SR6 = new SR6TConfig();
    })*/

    libWrapper.register(
        'shadowrun-6-eden-ameliorations',
        "CONFIG.Actor.sheetClasses.Player['shadowrun6-eden.Shadowrun6ActorSheetPC'].cls.prototype._render",
        actorSheet_render,
        "WRAPPER");

    const seen = new Set();
    const entries = Object.values(CONFIG.Actor.sheetClasses)
        .flatMap(scope => Object.values(scope));

    for (const entry of entries) {
        const cls = entry.cls ?? entry.sheet;      // selon version, l'un ou l'autre
        if (!cls?.name || seen.has(cls)) continue;
        seen.add(cls);
        Hooks.on(`render${cls.name}`, patchActorSheet);
    }

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

const TOKENIZER_ID = "vtta-tokenizer";

/**
 * Vérifie si le module Tokenizer est présent, actif, et a l'API nécessaire
 */
function isTokenizerAvailable() {
  const mod = game.modules.get(TOKENIZER_ID);
  return mod?.active === true && typeof mod.api?.tokenizeDoc === "function";
}

/**
 * Récupère le paramétrage natif du Tokenizer pour le comportement shift/clic
 * @returns {{disabled: boolean, shiftClick: boolean}}
 */
function getTokenizerSettings() {
  if (!isTokenizerAvailable()) {
    return { disabled: true, shiftClick: false };
  }

  try {
    const disabled = game.settings.get(TOKENIZER_ID, "disable-avatar-click");
    const shiftClick = game.settings.get(TOKENIZER_ID, "shift-click");
    return { disabled, shiftClick };
  } catch (e) {
    return { disabled: false, shiftClick: false };
  }
}

/**
 * Détermine si on doit lancer le Tokenizer selon l'événement et les settings
 */
function shouldLaunchTokenizer(event, settings) {
  if (settings.disabled) return false;

  return settings.shiftClick
    ? event.shiftKey
    : !event.shiftKey;
}

/**
 * Vérifie si l'image est éligible au Tokenizer
 * Exclut les images "persona" (icônes de personnage dans le chat, etc.)
 */
function isTokenizerEligible(target) {
  const imagePath = target.dataset.imagePath || "";
  return !imagePath.toLowerCase().includes("persona");
}

/**
 * Ouvre la preview d'image en grand
 */
async function openImagePreview(app, target) {
  const src = target.src || target.currentSrc;
  const img = app.document.img || src;

  new ImagePopout(img, {
    title: app.document.name,
    shareable: true,
    uuid: app.document.uuid
  }).render(true);
}

/**
 * Ouvre l'éditeur d'image natif (FilePicker)
 */
async function openNativeImageEditor(app, target) {
  const attr = target.dataset.imagePath
    ? (target.dataset.imagePath === "img" ? "img" : `system.${target.dataset.imagePath}`)
    : target.dataset.edit || "img";

  const current = foundry.utils.getProperty(app.document._source, attr) || target.src;
  const defaultArtwork = app.document.constructor.getDefaultArtwork?.(app.document._source) ?? {};
  const defaultImage = foundry.utils.getProperty(defaultArtwork, attr);

  const fp = new FilePicker.implementation({
    current,
    type: "image",
    redirectToRoot: defaultImage ? [defaultImage] : [],
    callback: path => {
      target.src = path;
      if (app.options?.form?.submitOnChange && app.form) {
        const submit = new Event("submit", { cancelable: true });
        app.form.dispatchEvent(submit);
      } else {
        const update = attr === "img" ? { img: path } : { [attr]: path };
        app.document.update(update);
      }
    },
    position: {
      top: (app.position?.top ?? 0) + 40,
      left: (app.position?.left ?? 0) + 10
    }
  });

  await fp.browse();
}

function patchActorSheet(app) {
  const root = app.element?.[0] ?? app.element;
  if (!(root instanceof HTMLElement)) return;
  if (!(app.document instanceof Actor)) return;
  if (root._tokenizerPatched) return;
  root._tokenizerPatched = true;

  // Référence lazy au tokenizer (évaluée au moment de l'usage)
  const getTokenizerApi = () => game.modules.get(TOKENIZER_ID)?.api;

  // ========== CLIQUE GAUCHE ==========
  root.addEventListener("click", async (event) => {
    const target = event.target.closest("img.profile-img");
    if (!target) return;

    const settings = getTokenizerSettings();
    const eligible = isTokenizerEligible(target);

    // Permission player : si tokenizer indique de bloquer et qu'on est player
    if (isTokenizerAvailable() && eligible) {
      let playerDisabled = false;
      try {
        playerDisabled = game.settings.get(TOKENIZER_ID, "disable-player");
      } catch {}
      if (!game.user.can("FILES_UPLOAD") && playerDisabled) {
        event.preventDefault();
        event.stopPropagation();
        await openImagePreview(app, target);
        return;
      }
    }

    // Déterminer l'action : Tokenizer ou preview native
    const launchTokenizer = eligible && shouldLaunchTokenizer(event, settings);

    // Bloquer l'événement natif
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (launchTokenizer) {
      getTokenizerApi().tokenizeDoc(app.document);
    } else {
      // Preview native (fallback si pas éligible ou si settings disent non)
      await openImagePreview(app, target);
    }
  }, true);

  // ========== CLIQUE DROIT : Edit natif + bloquer menu Firefox ==========
  // TOUJOURS ACTIF, même sans Tokenizer !
  root.addEventListener("contextmenu", async (event) => {
    const target = event.target.closest("img.profile-img");
    if (!target) return;

    // Bloquer le menu contextuel natif de Firefox
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Ouvrir l'éditeur d'image standard de Foundry
    await openNativeImageEditor(app, target);
  }, true);
}