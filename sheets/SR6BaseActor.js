import { Shadowrun6Actor } from "/systems/shadowrun6-eden/module/Shadowrun6Actor.js";

function isLifeform(obj) {
    return obj.attributes != undefined;
}
function isSpiritOrSprite(obj) {
    return obj.rating != undefined;
}
function isMatrixUser(obj) {
    return obj.persona != undefined;
}
function isPlayer(obj) {
    return obj.karma != undefined;
}
function isGear(obj) {
    return obj.skill != undefined;
}
function isVehicle(obj) {
    return obj.skill != undefined && (obj.type === "VEHICLES" || obj.type === "DRONES");
}
function isSpell(obj) {
    return obj.category != undefined;
}
function isWeapon(obj) {
    return ((obj.type === "WEAPON_FIREARMS" || obj.type === "WEAPON_CLOSE_COMBAT" || obj.type === "WEAPON_RANGED" || obj.type === "WEAPON_SPECIAL") &&
        obj.dmg != undefined);
}
function isArmor(obj) {
    return obj.defense != undefined;
}
function isComplexForm(obj) {
    return obj.fading != undefined;
}
function isMatrixDevice(obj) {
    return obj.d != undefined && (obj.type == "ELECTRONICS" || obj.type == 'CYBERWARE');
}
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
function getItemData(obj) {
    if (game.release.generation >= 10)
        return obj;
    return obj.data;
}
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {Shadowrun6ActorSheet}
 */
export class SR6BaseActor extends Shadowrun6Actor {

    //---------------------------------------------------------
    /**
     * Apply the force rating as a attribute and skill modifier
     */
    _applySpiritPreset(force) {
        super._applySpiritPreset(force);

        const system = getSystemData(this);

        switch (system.spiritType) {
            case 'sang':
                system.attributes.bod.mod = 4;
                system.attributes.agi.mod = 2;
                system.attributes.rea.mod = 1;
                system.attributes.str.mod = 3;
                system.attributes.wil.mod = 1;
                system.attributes.log.mod = 0;
                system.attributes.int.mod = 0;
                system.attributes.cha.mod = -1;
                system.attributes.mag.mod = 0;
                system.defenserating.physical.base = force+4;
                system.initiative.physical.base = (force * 2)+1;
                system.skills["astral"].points = 1;
                system.skills["athletics"].points = 1;
                system.skills["close_combat"].points = 1;
                system.skills["outdoors"].points = 1;
                system.skills["perception"].points = 1;
                break;
        }
    }
    //---------------------------------------------------------
    /*
     * Calculate the pool when using items with assigned skills
     */
    _prepareItemPools() {
        super._prepareItemPools();
        const actorData = getActorData(this);
        const system = getSystemData(this);
        if (!isLifeform(system))
            return;
        actorData.items.forEach((tmpItem) => {
            let item = getItemData(tmpItem);
            let system = getSystemData(tmpItem);
            if (tmpItem.type == "gear" && isWeapon(system)) {
                if (system.stun == "false") {
                    system.stun = false;
                }
                else if (system.stun == "true") {
                    system.stun = true;
                }
                let suffix = ((item.calculated.stun ?? system.stun) === true || (item.calculated.stun ?? system.stun) === "true")
                    ? game.i18n.localize("shadowrun6.item.stun_damage")
                    : game.i18n.localize("shadowrun6.item.physical_damage");
                system.dmgDef = item.calculated.dmg + suffix;
            }
        });
    }
}