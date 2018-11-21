'use strict';

let util = require('util');
let pathing = require('pathing');

const NAME = 'HARVESTER';
const UNITS_PER_SRC = 3;

class Harvester {
	constructor() {
		this.move_opts = {
			visualizePathStyle: {
				stroke: '#00ff00',
				lineStyle: 'undefined',
			}
		};
	}
	atCapacity(room) {
		if (!room.units[NAME]) {
			return false;
		}
		return room.units[NAME].length >= (room.sources.length * UNITS_PER_SRC);
	}
	create(room) {
		let mods = [WORK, CARRY, MOVE];                  // 200
		if (room.energyCapacityAvailable > 300) {
			mods.push(CARRY, MOVE);                      // 300
		}
		if (room.energyCapacityAvailable > 500) {
			mods.push(WORK, MOVE, MOVE);                 // 500
		}
		if (room.energyCapacityAvailable > 700) {
			mods.push(CARRY, CARRY, CARRY, MOVE);        // 000
		}
		if (room.energyCapacityAvailable > 900) {
			mods.push(WORK, WORK);
		}
		if (room.energyCapacityAvailable > 1100) {
			mods.push(CARRY, CARRY, MOVE, MOVE);
		}

		// Just incase everyone is dead and we don't have any energy...
		if (!room.units[NAME] || room.units[NAME] === 0) {
			console.log("Something wrong with harvesters, panic!");
			mods = [WORK, CARRY, MOVE];
		}

		let src_counts = _.countBy(_.map(room.units['HARVESTER'], 'memory.sid'));
		let src = undefined;
		let src_count = 999;

		for (let s of room.sources) {
			if (!(s in src_counts)) {
				src = s;
				src_count = 0;
			} else if (src_counts[s] <= src_count) {
				src = s;
				src_count = src_counts[s];
			}
		}

		console.log(`Spawning creep to source ${src} (${JSON.stringify(src_counts)})`);

		if (!src) { return; }

		switch(room.spawn.spawnCreep(util.sortByCost(mods), util.namer.gen('H_'), {memory: {role: NAME, sid: src, homeRoom: room.name }})) {
			case ERR_NAME_EXISTS:
				console.log("Failed to spawn creep, name taken");
				break;
			case ERR_NOT_ENOUGH_ENERGY:
				console.log(`Missing energy for Harvester. ${room.energyAvailable}/${util.bodyCost(mods)}`);
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
	tick(creep, type_count) {
		switch(creep.state) {
			case 'harvesting':
				let source = Game.getObjectById(creep.memory.sid);
				if (!source) {
					// creep.suicide();
					// Memory.creeps[creep.name] = undefined;
					creep.log(`I don't have a valid sid, I have ${creep.memory.sid} though`);
				}
				let e = creep.harvest(source);
				switch(e) {
					case ERR_NOT_IN_RANGE:
						pathing.moveTo(creep, source, this.move_opts);
						break;
					case OK:
						break;
					default:
						creep.log('Err; ' + e);
				}
				break;
			case 'dumping':
				let target = Game.rooms[creep.homeRoom].storage || Game.rooms[creep.homeRoom].container;
				if (!target) {
					target = _.head(_.filter(
						_.map(Game.rooms[creep.homeRoom].deposits, Game.getObjectById),
						e => { return e && e.energy < e.energyCapacity; }
					));
				}
				if(target) {
					switch(creep.transfer(target, RESOURCE_ENERGY)) {
						case ERR_NOT_IN_RANGE:
							pathing.moveTo(creep, target, this.move_opts);
							break;
						case OK:
							break;
					}
				}
				break;
		}
	}
	post_tick(creep) {

	}
}

module.exports = new Harvester();
