'use strict';

let util = require('util');
let base = require('base');


class UnitBuilder extends base {
	constructor() {
		super();
		this.move_opts = {
			visualizePathStyle: {
				stroke: '#00ff00', 
				lineStyle: 'undefined'
			}
		};
	}
	get name() {
		return 'BUILDER';
	}
	valueOf() {
		return this.name;
	}
	create(spawn) {
		let mods = [WORK, CARRY, MOVE];
		if (spawn.room.energyCapacityAvailable > 300) {
			mods.push(WORK, CARRY, MOVE);
		}
		if (spawn.room.energyCapacityAvailable > 500) {
			mods.push(WORK, CARRY, MOVE);
		}
		if (spawn.room.energyCapacityAvailable > 700) {
			mods.push(WORK, CARRY, MOVE);
		}
		switch(spawn.spawnCreep(util.sortByCost(mods), util.namer.gen('B_'), {memory: {role: this.name}})) {
			case ERR_NAME_EXISTS:
				spawn.notice("Failed to spawn creep, name taken");
				break;
			case OK:
				spawn.notice("Spawning creep");
				break;
		}
	}
	pre_tick(creep) {
		let current_state = creep.getState();
		let current_target = creep.getTarget();
		if(creep.carry.energy === 0 && current_state !== 'harvesting') {
			creep.setState('harvesting');
			creep.say('🚛');
		}
		if(creep.carry.energy === creep.carryCapacity && current_state === 'harvesting') {
			if (!util.build_queue.isEmpty()) {
				creep.setState('building');
				creep.say('🚧');
			} else {
				creep.setState('upgrading');
				creep.say('🔧');
			}
		}
		// creep.log(current_state + " > " + creep.getState() + "(" + current_target + ")");
	}
	tick(creep) {
		switch(creep.getState()) {
			case 'harvesting':
			let sources = creep.room.find(FIND_TOMBSTONES);
			if (sources.length > 0) {
				switch(creep.harvest(sources[0])) {
					case ERR_NOT_IN_RANGE:
						creep.cachedMoveTo(sources[0], move_opts);
						break;
					case OK:
						break;
				}
				return;
			}

			let targets = creep.room.find(FIND_DROPPED_RESOURCES);
			if(targets.length > 0) {
				if(creep.pickup(targets[0]) == ERR_NOT_IN_RANGE) {
					creep.cachedMoveTo(targets[0], this.move_opts);
				}
				return;
			}

			let energy_source = creep.getTarget() || creep.findEnergySource();
			if(energy_source) {
				creep.setTarget(energy_source); 
				switch(creep.withdraw(energy_source, RESOURCE_ENERGY)) {
					case ERR_NOT_IN_RANGE:
						creep.cachedMoveTo(energy_source, this.move_opts);
						break;
					case ERR_INVALID_TARGET:
					case ERR_NOT_ENOUGH_RESOURCES:
						creep.resetTarget();
						break;
				}
				return;
			} else {
				creep.displayIdle();
			}
			break;
		case 'building':
			if (!creep.getTarget()) {
				let t = util.build_queue.get();
				if (t) { 
					creep.setTarget(t);
					creep.log("New Target (" + t.id + "|" + t.structureType + ")");
				}
			}
			let target = creep.getTarget();
			if (target) {
				if (target instanceof ConstructionSite) {
					switch(creep.build(target)) {
						case ERR_NOT_IN_RANGE:
							creep.cachedMoveTo(target, this.move_opts);
							break;
						case OK:
							break;
						default:
							creep.say("Issue target");
							creep.resetTarget();
							break;
					}
					if (target.progress === target.progressTotal) {
						creep.resetTarget();
					}
				} else {
					switch(creep.repair(target)) {
						case ERR_NOT_IN_RANGE:
							creep.cachedMoveTo(target, this.move_opts);
							break;
						case OK:
							break;
						default:
							creep.say("Issue target");
							creep.resetTarget();
							break;
					}
					if (util.isGoodEnough(target)) {
						creep.resetTarget();
					}
				}
			} else {
				creep.setState('harvesting');
			}
			break;
		case 'upgrading':
			if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
				creep.cachedMoveTo(creep.room.controller, this.move_opts);
			}
			break;
		default:
			creep.log("Unknown state, resetting");
			creep.setState('harvesting');
		}
	}
}

module.exports = new UnitBuilder();