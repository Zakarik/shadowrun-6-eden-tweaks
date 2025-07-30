import { SR6Items } from "./sheets/SR6Items.js";

Hooks.on('init', () => {

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
});