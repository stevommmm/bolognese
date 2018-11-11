let unit_builder = require('unit_builder');
let unit_soldier = require('unit_soldier');
let unit_harvester = require('unit_harvester');

let util = require('util');
let roles = require('roles');

let move_opts = {visualizePathStyle: {stroke: '#fffff', lineStyle: 'undefined', strokeWidth: 0.2}}


function creepsBySrcId(sid) {
	let screeps = [];
	for (let creep of Object.values(Game.creeps)) {
		if (creep.memory.sid === sid) {
			screeps.push(creep);
		}
	}
	return screeps;
}

StructureSpawn.prototype.notice = function(message) {
	this.room.visual.text("❕ " + message, this.pos.x + 2, this.pos.y, 
		{font: 0.6, opacity: 0.6, backgroundColor: '#20202f', align: 'left'});
}

StructureSpawn.prototype.hud = function() {
	this.room.visual.text(this.room.energyAvailable + " / " + this.room.energyCapacityAvailable, this.pos.x, this.pos.y - 1.5, 
		{font: 'bold 0.5 monospace', color: '#ff0000', opacity: 1, backgroundColor: 'transparent', align: 'center'});
}

Creep.prototype.findEnergySource = function() {
	if (Game.time % 60 === 0) {
		this.room.memory.energy_storage = undefined;
		this.room.memory.energy_extensions = undefined;
		console.log("Invalidated Energy Source Caches");
	}

	// Add any storage/containers to cache
	if (!this.room.memory.energy_storage) {
		let targets = this.room.find(FIND_STRUCTURES, {
			filter: (structure) => {
					return (structure.structureType == STRUCTURE_STORAGE 
						|| structure.structureType === STRUCTURE_CONTAINER)
			}
		});
		let src = this.room.memory.energy_storage || [];
		_.map(targets, e => { src.push(e.id) });
		this.room.memory.energy_storage = _.uniq(src);
	}
	// Check spawn capacity and cache
	if (!this.room.memory.energy_extensions) {
		let targets = this.room.find(FIND_MY_STRUCTURES, {
			filter: (structure) => {
					return structure.structureType == STRUCTURE_EXTENSION ||
						 ( structure.structureType == STRUCTURE_SPAWN);
			}
		});
		let src = this.room.memory.energy_extensions || [];
		_.map(targets, e => { src.push(e.id) });
		this.room.memory.energy_extensions = _.uniq(src);
	}
	// Find non-empty containers and return the object, or fall through
	if (this.room.memory.energy_storage) {
		let targets = _.filter(
			_.map(this.room.memory.energy_storage, Game.getObjectById),
			e => { return _.sum(e.store) > 0 }
		);
		if (targets.length > 0) {
			return _.head(targets);
		}
	}
	// There were no empty containers, start using spawn capacity
	if (this.room.memory.energy_extensions) {
		let targets = _.filter(
			_.map(this.room.memory.energy_extensions, Game.getObjectById),
			e => { return (e.structureType !== STRUCTURE_SPAWN || e.energy === e.energyCapacity) && e.energy > 0 }
		);
		if (targets.length > 0) {
			return _.head(targets);
		}
	}
}

Creep.prototype.findEnergyDeposit = function() {
	let targets = this.room.find(FIND_MY_STRUCTURES, {
		filter: (structure) => {
			return (
				structure.structureType == STRUCTURE_SPAWN
				|| structure.structureType == STRUCTURE_EXTENSION
				|| structure.structureType == STRUCTURE_TOWER
			) && structure.energy < structure.energyCapacity
		}
	});
	if (targets.length === 0) {
		targets = this.room.find(FIND_STRUCTURES, {
		filter: (structure) => {
				return (
					structure.structureType == STRUCTURE_STORAGE 
					|| structure.structureType === STRUCTURE_CONTAINER
				) && _.sum(structure.store) < structure.storeCapacity
			}
		});
	}
	if(targets.length > 0) {
		return targets[0];
	}
}

Creep.prototype.cachedMoveTo = function(target, opts = {}) {
	if (this.pos.x === target.pos.x && this.pos.y === target.pos.y) {
		return;
	}

	return this.moveTo(target, opts);
}

Creep.prototype.isNextTo = function(target) {
	return this.pos.inRangeTo(this.pos.x, this.pos.y, target, 10);
}

Creep.prototype.log = function(message) {
	console.log(`[${this.name}]{${this.memory.state}}(${this.memory.target}) ${message}`);
}

Creep.prototype.getState = function() {
	return this.memory.state;
}
Creep.prototype.setState = function(state) {
	// this.log("+ Setting state to: " + state);
	this.resetTarget();
	this.memory.state = state;
}

Creep.prototype.getTarget = function() {
	return Game.getObjectById(this.memory.target);
}
Creep.prototype.setTarget = function(target) {
	// this.log('+ Set target' + target);
	this.memory.target = target.id;
}
Creep.prototype.resetTarget = function() {
	// this.log('+ Reset target');
	this.memory.target = undefined;
}

module.exports.loop = function () {
	let spawn = Game.spawns['Spawn1'];
	if (!spawn) {
		console.log('Could not find the spawn...');
		return;
	}

	if (Game.time % 10 === 0) {
		let history = spawn.memory.energy_history || [];
		history.push(spawn.room.energyAvailable);
		spawn.memory.energy_history = history.splice(-10);
	}

	spawn.hud();

	let tower = Game.getObjectById('5be598896540af23492e7a24');
	let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
	if(closestHostile) {
		tower.attack(closestHostile);
	}

	if (util.build_queue.isEmpty() && Game.time % 30 === 0) {
		console.log("Empty build queue, searching...");
		// Find things to repair
		let targets = spawn.room.find(FIND_STRUCTURES, {
			filter: (structure) => {
				return (
					structure.owner === undefined || structure.my
				) && !util.isGoodEnough(structure);
			}
		});
		if (targets.length > 0) {
			for (let t of targets) {
				util.build_queue.put(t);
			}
		}

		// New buildings
		for (let t of Object.values(Game.constructionSites)) {
			util.build_queue.put(t);
		}
		console.log("done...");
	}

	for(let name in Game.creeps) {
		let creep = Game.creeps[name];

		if (!creep.my || creep.spawning) {
			continue;
		}

		if (!creep) {
			Memory.creeps[name] = undefined;
			continue;
		}

		// Emergency dump all energy
		// if (false) {
		// 	if (creep.carry.energy > 0) {
		// 		let target = creep.findEnergyDeposit();
		// 		if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		// 			creep.moveTo(target, move_opts);
		// 		}
		// 	}
		// 	let targets = creep.room.find(FIND_DROPPED_RESOURCES);
		// 	if(targets.length > 0) {
		// 		if(creep.pickup(targets[0]) == ERR_NOT_IN_RANGE) {
		// 			creep.moveTo(targets[0], move_opts);
		// 		}
		// 	}
		// 	if (!targets && creep.carry.energy == 0) {
		// 		spawn.recycleCreep(creep);
		// 	}
		// 	continue;
		// }

		// Renew creeps lower than 50 back to 1000
		if (creep.ticksToLive >= 1000) {
			creep.memory.renewing = false;
		}
		if ((creep.ticksToLive < 50 || creep.memory.renewing) && util.bodyCost(creep.body) >= 250) {
			switch(spawn.renewCreep(creep)) {
				case ERR_NOT_IN_RANGE:
					creep.moveTo(spawn, move_opts);
					break;
				case OK:
					creep.memory.renewing = true;
			}
			continue;
		} else if (creep.ticksToLive < 50) {
			creep.say('☠️');
			let target = creep.findEnergyDeposit()
			if (target) {
				if (!(target instanceof String)) {
					target = target.id
				}
				let tob = Game.getObjectById(target);
				if (tob) {
					creep.memory.target = tob.id
					switch (creep.transfer(tob, RESOURCE_ENERGY)) {
						case ERR_NOT_IN_RANGE:
							creep.cachedMoveTo(tob, move_opts);
							break;
						case OK:
							break;
						default:
							creep.memory.target = undefined;
							break;
					}
				}
			}
			if (creep.carry.energy === 0) {
				creep.suicide();
				Memory.creeps[creep.name] = undefined;
			}
			continue;
		}

		let role = roles[creep.memory.role];
		if (!role) {
			creep.suicide();
			Memory.creeps[name] = undefined;
		} else {
			role.pre_tick(creep);
			role.tick(creep);
		}
	}

	let count = _.countBy(Object.values(Game.creeps), e => { return e.memory.role; });
	console.log(JSON.stringify(count));

	// Respawn creeps as needed.
	for (let src of spawn.room.find(FIND_SOURCES)) {
		let src_creeps = creepsBySrcId(src.id).length;
		if (creepsBySrcId(src.id).length < 4) {
			unit_harvester.create(spawn, src, count.HARVESTER === 0);
			// If we had less than the required creeps then return loop here
			return;
		}
	}
	if (count.BUILDER < 3) {
		unit_builder.create(spawn);
		return;
	}
	if (count.SOLDIER < 2) {
		unit_soldier.create(spawn);
		return;
	}
}