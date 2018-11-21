'use strict';

const STUCK = 3;


// map x,y into a single plane
function interleave(x, y) {
	let B = [0x55555555, 0x33333333, 0x0F0F0F0F, 0x00FF00FF];
	let S = [1, 2, 4, 8];
	x = (x | (x << S[3])) & B[3];
	x = (x | (x << S[2])) & B[2];
	x = (x | (x << S[1])) & B[1];
	x = (x | (x << S[0])) & B[0];
	y = (y | (y << S[3])) & B[3];
	y = (y | (y << S[2])) & B[2];
	y = (y | (y << S[1])) & B[1];
	y = (y | (y << S[0])) & B[0];
	let z = x | (y << 1);
	return z;
}


// pathing helper
function samePos(a, b) {
	return a !== undefined
	&& b !== undefined
	&& a.x === b.x
	&& a.y === b.y
	&& a.roomName === b.roomName;
}

function getLastPos(creep) {
	return creep.memory.lastPos || {x: undefined, y: undefined, roomName: undefined, count: 0};
}

function setLastPos(creep, count) {
	creep.memory.lastPos = {x: creep.pos.x, y: creep.pos.y, roomName: creep.pos.roomName, count: count};
}

function moveNear(creep, to, range) {
	if (creep.pos.inRangeTo(to, range)) {
		return;
	}
	moveTo(creep, to);
}

function moveTo(creep, to, opts = {}) {
	if (samePos(creep.pos, to.pos)) {
		return OK;
	}

	let path = creep.memory._path;

	// Work out if we're stuck for some reason - other creeps most likely
	let last_pos = getLastPos(creep);
	let count = last_pos.count;
	if (samePos(last_pos, creep.pos)) {
		count++;
	} else {
		count = 0;
	}
	setLastPos(creep, count);

	if (!path || path.length === 0 || count > STUCK) {
		creep.log(`Finding path from ${creep.pos.roomName},${creep.pos.x},${creep.pos.y} to ${to.pos.roomName},${to.pos.x},${to.pos.y}. Stuck: ${count}.`);
		path = _.map(
			creep.pos.findPathTo(to, {
				'serialize': false,
				'ignoreCreeps': !(count > STUCK),
				'range': count > STUCK ? 1 : 0}),
			'direction'
		);
	}

	let e = creep.move(path.shift());
	switch(e) {
		case ERR_INVALID_ARGS:
			path = undefined;
			break;
	}
	creep.memory._path = path;
}

module.exports = {
	moveTo: moveTo,
	moveNear: moveNear
}
