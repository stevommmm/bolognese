'use strict';

let util = require('util');
let base = require('base');

class UnitSoldier extends base {
	constructor() {
		super();
		this.move_opts = {
			visualizePathStyle: {
				stroke: '#000000', 
				lineStyle: 'undefined'
			}
		};
	}
	get name() {
		return 'SOLDIER';
	}
	valueOf() {
		return this.name;
	}
	create(spawn) {
		let mods = [RANGED_ATTACK, MOVE];
		if (spawn.room.energyCapacityAvailable > 300) {
			mods.push(TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE);
		}
		if (spawn.room.energyCapacityAvailable > 500) {
			mods.push(RANGED_ATTACK, RANGED_ATTACK);
		}
		if (spawn.room.energyCapacityAvailable > 700) {
			mods.push(TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH);
		}

		switch(spawn.spawnCreep(util.sortByCost(mods), util.namer.gen('S_'), {memory: {role: 'soldier'}})) {
			case ERR_NAME_EXISTS:
				spawn.notice("Failed to spawn creep, name taken");
				break;
			case OK:
				spawn.notice("Spawning creep");
				break;
		}
	}
	tick(creep) {
		let targets = creep.room.find(FIND_HOSTILE_CREEPS);
		if (targets.length > 0) {
			switch(creep.rangedAttack(targets[0])) {
				case ERR_NOT_IN_RANGE:
					creep.cachedMoveTo(targets[0], this.move_opts);
					break;
			}
			return;
		}

		let mons = creep.room.find(FIND_FLAGS, {
			filter: { color: COLOR_RED}
		});
		creep.cachedMoveTo(mons[0], this.move_opts);
	}
}

module.exports = new UnitSoldier();