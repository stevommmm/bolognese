'use strict';
class BaseRole {
	get name() {}
	create(spawn) {}
	pre_tick(creep) {}
	tick(creep) {}
	post_tick(creep) {}
}

module.exports = BaseRole