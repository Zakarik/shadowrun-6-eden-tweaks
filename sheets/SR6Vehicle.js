import Shadowrun6ActorSheetVehicle from "/systems/shadowrun6-eden/module/applications/sheets/ActorSheetVehicle.js";
function getSystemData(obj) {
    if (game.release.generation >= 10)
        return obj.system;
    return obj.data.data;
}

export class SR6Vehicle extends Shadowrun6ActorSheetVehicle {
    /** @override */
    async _onSpeedChange(acceleration) {
        console.log("SR6E | _onSpeedChange", this);
        let system = getSystemData(this.actor);

        let currentSpeed = system.vehicle.speed;
        let speedChangeFactor = ((system.vehicle.offRoad ? system.accOff : system.accOn));
        let newSpeed = currentSpeed + (acceleration ? speedChangeFactor : -speedChangeFactor);
        newSpeed = Math.max(0, Math.min(newSpeed, system.tspd));

        await this.actor.update({ ["system.vehicle.speed"]: newSpeed });
    }
};