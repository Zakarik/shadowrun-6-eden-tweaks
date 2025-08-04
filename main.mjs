import { SR6Items } from "./sheets/SR6Items.js";
import { SR6Actor } from "./sheets/SR6Actor.js";
import { SR6Vehicle } from "./sheets/SR6Vehicle.js";
import { preloadHandlebarsTemplates } from "./templates.js";

Hooks.on('init', () => {
    Actors.registerSheet("shadowrun6-eden", SR6Vehicle, { types: ["Vehicle"], makeDefault: true });
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