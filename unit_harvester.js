'use strict';

let util = require('util');
let base = require('base');

class UnitHarvester extends base {
	constructor() {
		super();
		this.move_opts = {
			visualizePathStyle: {
				stroke: '#ff0000', 
				lineStyle: 'undefined',
			}
		};
	}
	get name() {
		return 'HARVESTER';
	}
	valueOf() {
		console.log('valueOf called');
		return this.name;
	}
	create(spawn, src, force = false) {
		let mods = [WORK, CARRY, MOVE];                  // 200
		if (spawn.room.energyCapacityAvailable > 300) {
			mods.push(CARRY, MOVE);                      // 300
		}
		if (spawn.room.energyCapacityAvailable > 500) {
			mods.push(WORK, MOVE, MOVE);                 // 500
		}
		if (spawn.room.energyCapacityAvailable > 700) {
			mods.push(CARRY, CARRY, CARRY, MOVE);        // 000
		}
		if (spawn.room.energyCapacityAvailable > 900) {
			mods.push(WORK, WORK);
		}

		// Just incase everyone is dead and we don't have any energy...
		let ex = spawn.memory.energy_history[0];
		if (force || spawn.memory.energy_history.every(e => { return e === ex; })) {
			console.log("Something wrong with harvesters, panic!");
			mods = [WORK, CARRY, MOVE];
		}

		switch(spawn.spawnCreep(util.sortByCost(mods), util.namer.gen('H_'), {memory: {role: this.name, sid: src}})) {
			case ERR_NAME_EXISTS:
				spawn.notice("Failed to spawn creep, name taken");
				break;
			case ERR_NOT_ENOUGH_ENERGY:
				spawn.notice(`Missing energy. ${spawn.room.energyAvailable}/${util.bodyCost(mods)}`);
				break;
			case OK:
				spawn.notice("Spawning creep");
				break;
		}
	}
	pre_tick(creep) {
		let current_state = creep.getState();
		if (creep.carry.energy === 0 && current_state !== 'harvesting') {
			creep.setState('harvesting');
			creep.say('💥');
		}
		if (creep.carry.energy === creep.carryCapacity && current_state !== 'dumping') {
			creep.setState('dumping');
			creep.say('🚚');
		}
		if (current_state === 'harvesting' && !creep.getTarget()) {
			creep.setTarget(Game.getObjectById(creep.memory.sid));
		}
	}
	tick(creep) {
		switch(creep.getState()) {
			case 'harvesting':
				let sources = creep.room.find(FIND_TOMBSTONES);
				if (sources.length === 0) {
					let target = creep.getTarget();
					if (target) {
						sources = [target];
					}
				}
				if (sources.length === 0) {
					sources = creep.room.find(FIND_SOURCES, {filter: {id: creep.memory.sid}});
				}
				if (!sources || sources.length === 0) {
					creep.suicide();
					Memory.creeps[creep.name] = undefined;
				}
				let e = creep.harvest(sources[0]);
				switch(e) {
					case ERR_NOT_IN_RANGE:
						creep.cachedMoveTo(sources[0], this.move_opts);
						break;
					case ERR_INVALID_TARGET:
						creep.resetTarget();
					case OK:
						break;
					default:
						creep.log('Err; ' + e);
				}
				break;
			case 'dumping':
				let target = creep.getTarget() || creep.findEnergyDeposit();
				if(target) {
					creep.setTarget(target);
					switch(creep.transfer(target, RESOURCE_ENERGY)) {
						case ERR_NOT_IN_RANGE:
							creep.cachedMoveTo(target, this.move_opts);
							break;
						case OK:
							break;
						default:
							creep.resetTarget();
							break;
					}
				}
				break;
			default:
				creep.log('Unknown state, setting to harvesting');
				creep.setState('harvesting');
		}
	}
	post_tick(creep) {

	}
}

module.exports = new UnitHarvester();