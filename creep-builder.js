'use strict';

let util = require('util');
let pathing = require('pathing');

const NAME = 'BUILDER';
const UNITS_TARGET = 4;

class Builder {
	constructor() {
		this.move_opts = {
			visualizePathStyle: {
				stroke: '#ff0000',
				lineStyle: 'undefined',
			}
		};
	}
	atCapacity(room) {
		if (!room.units[NAME]) {
			return false;
		}
		return room.units[NAME].length === UNITS_TARGET;
	}
	create(room) {
		let mods = [WORK, CARRY, MOVE];
		if (room.energyCapacityAvailable > 300) {
			mods.push(CARRY, MOVE);
		}
		if (room.energyCapacityAvailable > 500) {
			mods.push(WORK, CARRY, MOVE);
		}
		if (room.energyCapacityAvailable > 700) {
			mods.push(WORK, CARRY, MOVE);
		}
		switch(room.spawn.spawnCreep(util.sortByCost(mods), util.namer.gen('B_'), {memory: {role: NAME}})) {
			case ERR_NAME_EXISTS:
				console.log("Failed to spawn creep, name taken");
				break;
			case ERR_NOT_ENOUGH_ENERGY:
				console.log(`Missing energy for Builder. ${room.energyAvailable}/${util.bodyCost(mods)}`);
				break;
			case OK:
				console.log("Spawning creep");
				break;
		}
	}
	pre_tick(creep) {
		if(creep.carry.energy === 0 && creep.state !== 'harvesting') {
			creep.state = 'harvesting';
			creep.say('🚛');
			return;
		}
		if(creep.room.controller.ticksToDowngrade < 2000){
			creep.state = 'upgrading';
			creep.say('🔧');
			return;
		}
		if(creep.carry.energy === creep.carryCapacity && creep.state === 'harvesting') {
			if (creep.room.build_queue.length > 0) {
				creep.state = 'building';
				creep.say('🚧');
			} else {
				creep.state = 'upgrading';
				creep.say('🔧');
			}
		}
	}
	tick(creep) {
		switch(creep.state) {
			case 'harvesting':
				let energy_source = Game.rooms[creep.homeRoom].storage || Game.rooms[creep.homeRoom].container || Game.rooms[creep.homeRoom].spawn;
				if(energy_source) {
					switch(creep.withdraw(energy_source, RESOURCE_ENERGY)) {
						case ERR_NOT_IN_RANGE:
							pathing.moveTo(creep, energy_source, this.move_opts);
							break;
						case ERR_INVALID_TARGET:
						case ERR_NOT_ENOUGH_RESOURCES:
							break;
					}
					return;
				}
				break;
			case 'building':
				if (!creep.memory.target) {
					let t = Game.rooms[creep.homeRoom].build_queue.pop();
					if (t) {
						creep.memory.target = t;
						creep.log(`New Build target :${t}`);
					}
				}

				let target = Game.getObjectById(creep.memory.target);
				if (target) {
					if (target instanceof ConstructionSite) {
						switch(creep.build(target)) {
							case ERR_NOT_IN_RANGE:
								pathing.moveTo(creep, target, this.move_opts);
								break;
							case OK:
								break;
							default:
								creep.say("Issue target");
								creep.memory.target = undefined;
								break;
						}
						if (target.progress === target.progressTotal) {
							creep.memory.target = undefined;
						}
					} else {
						switch(creep.repair(target)) {
							case ERR_NOT_IN_RANGE:
								pathing.moveTo(creep, target, this.move_opts);
								break;
							case OK:
								break;
							default:
								creep.say("Issue target");
								creep.memory.target = undefined;
								break;
						}
						if (util.isGoodEnough(target)) {
							creep.memory.target = undefined;
						}
					}
				} else {
					creep.state = 'harvesting';
					creep.memory.target = undefined;
				}
				break;
			case 'upgrading':
				if(creep.upgradeController(Game.rooms[creep.homeRoom].controller) == ERR_NOT_IN_RANGE) {
					pathing.moveTo(creep, Game.rooms[creep.homeRoom].controller, this.move_opts);
				}
				break;
		}
	}
	post_tick(creep) {}
}

module.exports = new Builder();
