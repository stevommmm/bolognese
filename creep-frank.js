'use strict';

let util = require('util');

const NAME = 'FRANK';
const UNITS_TARGET = 1;

class FRANK {
	constructor() {
		this.move_opts = {
			visualizePathStyle: {
				stroke: '#0000ff',
				lineStyle: 'undefined',
			}
		};
	}
	atCapacity(room) {
		if (!room.storage && !room.container) {
			return true;
		}
		if (!room.units[NAME]) {
			return false;
		}
		return room.units[NAME].length === UNITS_TARGET;
	}
	create(room) {
		let mods = [CARRY, MOVE];
		if (room.energyCapacityAvailable > 300) {
			mods.push(CARRY, MOVE);
		}
		if (room.energyCapacityAvailable > 500) {
			mods.push(CARRY, MOVE);
		}
		if (room.energyCapacityAvailable > 700) {
			mods.push(CARRY, MOVE);
		}
		switch(room.spawn.spawnCreep(util.sortByCost(mods), util.namer.gen('F_'), {memory: {role: NAME}})) {
			case ERR_NAME_EXISTS:
				console.log("Failed to spawn creep, name taken");
				break;
			case OK:
				console.log("Spawning creep");
				break;
		}
	}
	pre_tick(creep) {
		if (creep.carry.energy === 0 && creep.state !== 'harvesting') {
			creep.state = 'harvesting';
			creep.say('💥');
		}
		if (creep.carry.energy === creep.carryCapacity && creep.state !== 'dumping') {
			creep.state ='dumping';
			creep.say('🚚');
		}
	}
	tick(creep) {
		switch(creep.state) {
			case 'harvesting':
				let energy_source = creep.room.storage || creep.room.container || creep.room.spawn;
				if(energy_source) {
					switch(creep.withdraw(energy_source, RESOURCE_ENERGY)) {
						case ERR_NOT_IN_RANGE:
							creep.moveTo(energy_source, this.move_opts);
							break;
						case ERR_INVALID_TARGET:
						case ERR_NOT_ENOUGH_RESOURCES:
							break;
					}
					return;
				}
				break;
			case 'dumping':
				let target = _.head(_.filter(
					_.map(creep.room.deposits, Game.getObjectById),
					e => { return e && e.energy < e.energyCapacity; }
				));
				if(target) {
					switch(creep.transfer(target, RESOURCE_ENERGY)) {
						case ERR_NOT_IN_RANGE:
							creep.moveTo(target, this.move_opts);
							break;
						case OK:
							break;
					}
				}
				break;
		}
	}
	post_tick(creep) {}
}

module.exports = new FRANK();
