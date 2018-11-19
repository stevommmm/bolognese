'use strict';

let util = require('util');

Object.defineProperty(Room.prototype, 'spawn', {
	get: function() {
		if (!this.memory._spawns) {
			this.memory._spawns = _.map(this.find(FIND_MY_SPAWNS), 'id');
		}
		return Game.getObjectById(_.head(this.memory._spawns));
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Room.prototype, 'sources', {
	get: function() {
		if (!this.memory._sources) {
			this.memory._sources = _.map(this.find(FIND_SOURCES), 'id');
		}
		return this.memory._sources;
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Room.prototype, 'deposits', {
	get: function() {
		if (!this.memory._deposits || Game.cpu.bucket > 5000) {
			this.memory._deposits = _.map(this.find(FIND_MY_STRUCTURES, {
				filter: (structure) => {
					return structure.structureType == STRUCTURE_SPAWN
						|| structure.structureType == STRUCTURE_EXTENSION;
				}
			}), 'id');
		}
		return this.memory._deposits;
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Room.prototype, 'units', {
	get: function() {
		if (!this._units) {
			this._units = _.groupBy(
				_.filter(
					Game.creeps, 
					e => { return e.my && e.room.name === this.name; }
				),
				'memory.role'
			);
		}
		return this._units;
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Room.prototype, 'build_queue', {
	get: function() {
		let build_queue = this.memory._build_queue || [];

		if (build_queue.length === 0 && Game.cpu.bucket === 10000) {
			console.log("Empty build queue, searching...");
			// Find things to repair
			let targets = this.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (
						structure.owner === undefined || structure.my
					) && !util.isGoodEnough(structure);
				}
			});
			_.each(targets, t => { build_queue.push(t.id); });
			// New buildings
			_.each(
				_.filter(
					Game.constructionSites, 
					e => {return e.room.name === this.name; }
				),
				t => { build_queue.push(t.id); }
			);
			console.log("done...");
			this.memory._build_queue = build_queue;
		}
		return build_queue;
	},
	configurable: true,
	enumerable: false,
});