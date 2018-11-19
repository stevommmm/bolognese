'use strict';

let roles = {
	'FRANK': require('creep-frank'),
	'HARVESTER': require('creep-harvester'),
	'BUILDER': require('creep-builder'),
}

function tick(creep) {
	if (creep.spawning) { return; }

	if (_.isArray(creep.memory.sid)) {
		creep.memory.sid = creep.memory.sid[0];
	}

	let role = roles[creep.memory.role];
	if (!role) {
		creep.log('unknown role...');
	} else {
		role.pre_tick(creep);
		role.tick(creep);
		role.post_tick(creep);
	}
}

module.exports = {
	tick: tick,
	roles: roles,
}