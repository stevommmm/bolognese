
const CPU_WARN          = 2;
const TARGET_HARVESTERS = 5;
const TARGET_BUILDERS   = 2;
const TARGET_SOLDIERS   = 2;


let util = require('util');
let roles = require('roles');

require('screeps_extensions');

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
					creep.cachedMoveTo(spawn, move_opts);
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
			creep.log('unknown role...');
			creep.suicide();
			Memory.creeps[name] = undefined;
		} else {
			let cpu = Game.cpu.getUsed();
			role.pre_tick(creep);
			role.tick(creep);
			let used = Game.cpu.getUsed() - cpu;
			if (used > CPU_WARN) {
				creep.say("🤑");
				creep.log(`CPU Warning, used ${used}`);
			}
		}
	}

	let count = _.countBy(Object.values(Game.creeps), 'memory.role');
	// console.log(JSON.stringify(count));

	// Respawn creeps as needed.
	for (let id of spawn.room.energy_sources()) {
		let src_creeps = creepsBySrcId(id).length;
		if (creepsBySrcId(id).length < TARGET_HARVESTERS) {
			roles.HARVESTER.create(spawn, id,  !count.HARVESTER || count.HARVESTER === 0);
			// If we had less than the required creeps then return loop here
			return;
		}
	}
	if (!count.BUILDER || count.BUILDER < TARGET_BUILDERS) {
		roles.BUILDER.create(spawn);
		return;
	}
	if (!count.SOLDIER || count.SOLDIER < TARGET_SOLDIERS) {
		roles.SOLDIER.create(spawn);
		return;
	}
}