'use strict';
let util = require('util');
let util_creep = require('util-creep');

const all_directions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];


let x = null;
const layout = [
	[     STRUCTURE_ROAD,    STRUCTURE_TOWER,                  x,STRUCTURE_EXTENSION,                  x,                  x,     STRUCTURE_ROAD],
	[                  x,     STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,     STRUCTURE_ROAD,                  x],
	[                  x,STRUCTURE_EXTENSION,     STRUCTURE_ROAD,     STRUCTURE_ROAD,     STRUCTURE_ROAD,STRUCTURE_EXTENSION,                  x],
	[STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,     STRUCTURE_ROAD,    STRUCTURE_SPAWN,     STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION],
	[                  x,STRUCTURE_EXTENSION,     STRUCTURE_ROAD,  STRUCTURE_STORAGE,     STRUCTURE_ROAD,STRUCTURE_EXTENSION,                  x],
	[                  x,     STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,     STRUCTURE_ROAD,                  x],
	[     STRUCTURE_ROAD,                  x,                  x,STRUCTURE_EXTENSION,                  x,    STRUCTURE_TOWER,     STRUCTURE_ROAD],
];


function containsType(tileElements, structure_type) {
	return !structure_type || _.any(tileElements, e => {
		return (e.type === LOOK_CONSTRUCTION_SITES && e.constructionSite.structureType === structure_type)
		 || (e.type === LOOK_STRUCTURES && e.structure.structureType === structure_type)
	});
}

function layoutBase(room) {
	if (!room.spawn) {
		return;
	}

	// Inital circle around spawn
	let center = room.spawn.pos;
	let topmost_left = center;
	_.times(3, e => { topmost_left = topmost_left.getAdjacent(TOP_LEFT); });

	let row = topmost_left;
	_.times(7, y => {
		let col = row;
		_.times(7, x => {
			if (layout[y][x] !== null && !containsType(room.lookAt(col), layout[y][x])) {
				col.createConstructionSite(layout[y][x]);
				room.visual.circle(col);
			}
			col = col.getAdjacent(RIGHT);
		});
		row = row.getAdjacent(BOTTOM);
	});
}

function usedCpu(func, name) {
	let cpu = Game.cpu.getUsed();
	func();
	let used = Game.cpu.getUsed() - cpu;
	console.log(`CPU ${name}, used ${used}`);
}

function tick(room) {
	if (Game.cpu.bucket === 10000 && Game.time % 100 === 0) {
		layoutBase(room);
	}

	if (!room.spawn) {
		return;
	}
	
	for (let tower_id of room.towers) {
		let tower = Game.getObjectById(tower_id);
		let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		if(closestHostile) {
			tower.attack(closestHostile);
		}
	}

	if (!util_creep.roles['FRANK'].atCapacity(room)) {
		util_creep.roles['FRANK'].create(room);
		return;
	}
	if (!util_creep.roles['HARVESTER'].atCapacity(room)) {
		util_creep.roles['HARVESTER'].create(room);
		return;
	}
	for (let role of _.keys(util_creep.roles)) {
		if (!util_creep.roles[role].atCapacity(room)) {
			util_creep.roles[role].create(room);
			return;
		}
	}
}

module.exports = {
	tick: tick,
}
