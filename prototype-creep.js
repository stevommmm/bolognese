'use strict';

Creep.prototype.log = function(message) {
	console.log(`[${this.name}](${this.state}) ${message}`);
}

Object.defineProperty(Creep.prototype, 'state', {
	get: function() {
		return this.memory._state;
	},
	set: function(state) {
		this.memory._state = state;
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Creep.prototype, 'homeRoom', {
	get: function() {
		return this.memory._homeRoom;
	},
	configurable: true,
	enumerable: false,
});