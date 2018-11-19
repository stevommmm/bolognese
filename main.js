'use strict';

require('prototype-room');
require('prototype-creep');
require('prototype-roomposition');

let util_room = require('util-room');
let util_creep = require('util-creep');


module.exports.loop = function () {
	console.log(JSON.stringify(Game.cpu));
	for (let room of Object.values(Game.rooms)) {
		util_room.tick(room);
	}

	for (let creep of Object.values(Game.creeps)) {
		util_creep.tick(creep);
	}
}