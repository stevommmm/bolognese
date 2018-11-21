'use strict';

let util = require('util');
let pathing = require('pathing');

const NAME = 'SCOUT';
const UNITS_TARGET = 1;

class Scout {
	constructor() {
		this.move_opts = {
			visualizePathStyle: {
				stroke: '#ff0000',
				lineStyle: 'undefined',
			}
		};
	}
	atCapacity(room) {
		if (!Game.flags.scout) {
			return true;
		}
		return room.units[NAME] !== undefined && room.units[NAME].length >= UNITS_TARGET;
	}
	create(room) {
		let mods = [MOVE];
		switch(room.spawn.spawnCreep(util.sortByCost(mods), util.namer.gen('S_'), {memory: {role: NAME}})) {
			case ERR_NAME_EXISTS:
				console.log("Failed to spawn creep, name taken");
				break;
			case ERR_NOT_ENOUGH_ENERGY:
				console.log(`Missing energy for Scout. ${room.energyAvailable}/${util.bodyCost(mods)}`);
				break;
			case OK:
				console.log("Spawning creep");
				break;
		}
	}
	pre_tick(creep) {}
	tick(creep) {
		if (Game.flags.scout) {
			pathing.moveNear(creep, Game.flags.scout, 3);
		}

	}
	post_tick(creep) {}
}

module.exports = new Scout();
