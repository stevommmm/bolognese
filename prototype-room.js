'use strict';

let util = require('util');

Object.defineProperty(Room.prototype, 'children', {
	get: function() {
		return this.memory._children || [];
	},
	set: function(roomName) { 
		let children = this.memory._children || [];
		children.push(roomName);
		this.memory._children = children;
	},
	configurable: true,
	enumerable: false,
});

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
		let sources = this.memory._sources || [];

		if (!sources || sources.length === 0 || Game.cpu.bucket === 10000) {
			sources = _.map(this.find(FIND_SOURCES), 'id');

			_.each(this.children, e => {
                try {
				_.each(Game.rooms[e].find(FIND_SOURCES), x => { sources.push(x.id)});
                } catch(e) {}
			});
		}

		this.memory._sources = _.uniq(sources);
		return sources;
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Room.prototype, 'deposits', {
	get: function() {
		if (!this.memory._deposits || Game.cpu.bucket === 10000) {
			this.memory._deposits = _.map(this.find(FIND_MY_STRUCTURES, {
				filter: (structure) => {
					return structure.structureType == STRUCTURE_SPAWN
						|| structure.structureType == STRUCTURE_EXTENSION
						|| structure.structureType == STRUCTURE_TOWER;
				}
			}), 'id');
		}
		return this.memory._deposits;
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Room.prototype, 'container', {
	get: function() {
		if (!this.memory._containers || Game.cpu.bucket === 10000) {
			this.memory._containers = _.map(this.find(FIND_STRUCTURES, {
				filter: (structure) => { return structure.structureType == STRUCTURE_CONTAINER; }
			}), 'id');
		}
		return Game.getObjectById(_.head(this.memory._containers));
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
					e => { return e.my && e.homeRoom === this.name; }
				),
				'memory.role'
			);
		}
		return this._units;
	},
	configurable: true,
	enumerable: false,
});

Object.defineProperty(Room.prototype, 'towers', {
	get: function() {
		if (!this.memory._towers || Game.time % 100 === 0) {
			this.memory._towers = _.map(this.find(FIND_MY_STRUCTURES, {filter: e => { return e.structureType === STRUCTURE_TOWER; }}), 'id');
		}
		return this.memory._towers;
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
					e => {return e.room.name === this.name || !e.room.spawn; }
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
