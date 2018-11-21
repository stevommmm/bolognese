'use strict';

class BuildQueue {
	get() {
		let i = Memory.build_queue.pop();
		if (i) {
			return Game.getObjectById(i);
		}
	}
	isEmpty() {
		if (!Memory.build_queue) {
			Memory.build_queue = [];
		}
		return Memory.build_queue.length === 0
	}
	put(target) {
		Memory.build_queue.push(target.id);
	}
}

function unitCount() {
	if (!Memory.unit_counts) {
		Memory.unit_counts = _.countBy(Object.values(Game.creeps), 'memory.role');
	}
	return Memory.unit_counts;
}

function sortByCost(parts) {
	return _.sortBy(parts, e => { return BODYPART_COST[e] })
}

function bodyCost(body) {
	return body.reduce(function (cost, part) {
		return cost + BODYPART_COST[part];
	}, 0);
}

function isGoodEnough(structure) {
	return structure.hits === undefined 
		|| ((structure.hits/structure.hitsMax) * 100) > 60 
		|| structure.hits > 10000
}

function energyInStructure(structure) {
	if (structure.energy !== undefined) {
		return structure.energy;
	}
	if (structure.store[RESOURCE_ENERGY] !== undefined) {
		return structure.store[RESOURCE_ENERGY];
	}
	return 0;
}

class NameGenerator {
	constructor() {
		Memory.name_index = parseInt(Memory.name_index || 0) % 1000;
	}
	gen(prefix) {
		return prefix + Memory.name_index++;
	}
}

module.exports = {
	build_queue: new BuildQueue(),
	isGoodEnough: isGoodEnough,
	bodyCost: bodyCost,
	sortByCost: sortByCost,
	energyInStructure: energyInStructure,
	namer: new NameGenerator(),
	unitCount: unitCount
}