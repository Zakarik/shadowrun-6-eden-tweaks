/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        "modules/shadowrun-6-eden-ameliorations/templates/parts/section-gear.html",
    ];
    console.log(`SR6E | Load templates`);
    return loadTemplates(templatePaths);
};