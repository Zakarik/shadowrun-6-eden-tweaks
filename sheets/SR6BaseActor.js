import { Shadowrun6Actor } from "/systems/shadowrun6-eden/module/Shadowrun6Actor.js";

function getSystemData(obj) {
    if (game.release.generation >= 10)
        return obj.system;
    return obj.data.data;
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
}