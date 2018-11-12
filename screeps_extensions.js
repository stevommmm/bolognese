// -- Room ---------------------------------------------------------------------
Room.prototype.energy_sources = function() {
	if (!this.memory.energy_sources) {
		this.memory.energy_sources = _.map(this.find(FIND_SOURCES), 'id');
	}
	return this.memory.energy_sources;
}


// -- Spawn --------------------------------------------------------------------

StructureSpawn.prototype.notice = function(message) {
	this.room.visual.text("❕ " + message, this.pos.x + 1, this.pos.y, 
		{font: '0.5 monospace', color: '#ffffff', opacity: 0.4, backgroundColor: '#20202f', align: 'left'});
}

StructureSpawn.prototype.hud = function() {
	this.room.visual.text(this.room.energyAvailable + " / " + this.room.energyCapacityAvailable, this.pos.x, this.pos.y - 1.5, 
		{font: 'bold 0.5 monospace', color: '#ff0000', opacity: 1, backgroundColor: 'transparent', align: 'center'});
}


// -- Creep --------------------------------------------------------------------

Creep.prototype.findEnergySource = function() {
	if (Game.time % 60 === 0) {
		this.room.memory.energy_storage = undefined;
		this.room.memory.energy_extensions = undefined;
		console.log("Invalidated Energy Source Caches");
	}

	// Add any storage/containers to cache
	if (!this.room.memory.energy_storage) {
		let targets = this.room.find(FIND_STRUCTURES, {
			filter: (structure) => {
					return (structure.structureType == STRUCTURE_STORAGE 
						|| structure.structureType === STRUCTURE_CONTAINER)
			}
		});
		let src = this.room.memory.energy_storage || [];
		_.map(targets, e => { src.push(e.id) });
		this.room.memory.energy_storage = _.uniq(src);
	}
	// Check spawn capacity and cache
	if (!this.room.memory.energy_extensions) {
		let targets = this.room.find(FIND_MY_STRUCTURES, {
			filter: (structure) => {
					return structure.structureType == STRUCTURE_EXTENSION ||
						 ( structure.structureType == STRUCTURE_SPAWN);
			}
		});
		let src = this.room.memory.energy_extensions || [];
		_.map(targets, e => { src.push(e.id) });
		this.room.memory.energy_extensions = _.uniq(src);
	}
	// Find non-empty containers and return the object, or fall through
	if (this.room.memory.energy_storage) {
		let targets = _.filter(
			_.map(this.room.memory.energy_storage, Game.getObjectById),
			e => { return _.sum(e.store) > 0 }
		);
		if (targets.length > 0) {
			return _.head(targets);
		}
	}
	// There were no empty containers, start using spawn capacity
	if (this.room.memory.energy_extensions) {
		let targets = _.filter(
			_.map(this.room.memory.energy_extensions, Game.getObjectById),
			e => { return (e.structureType !== STRUCTURE_SPAWN || e.energy === e.energyCapacity) && e.energy > 0 }
		);
		if (targets.length > 0) {
			return _.head(targets);
		}
	}
}

Creep.prototype.findEnergyDeposit = function() {
	let targets = this.room.find(FIND_MY_STRUCTURES, {
		filter: (structure) => {
			return (
				structure.structureType == STRUCTURE_SPAWN
				|| structure.structureType == STRUCTURE_EXTENSION
				|| structure.structureType == STRUCTURE_TOWER
			) && structure.energy < structure.energyCapacity
		}
	});
	if (targets.length === 0) {
		targets = this.room.find(FIND_STRUCTURES, {
		filter: (structure) => {
				return (
					structure.structureType == STRUCTURE_STORAGE 
					|| structure.structureType === STRUCTURE_CONTAINER
				) && _.sum(structure.store) < structure.storeCapacity
			}
		});
	}
	if(targets.length > 0) {
		return targets[0];
	}
}

// pathing helper
function samePos(a, b) {
	return a !== undefined 
	&& b !== undefined 
	&& a.x === b.x
	&& a.y === b.y
	&& a.roomName === b.roomName;
}

function positionCount(pos) {
	if (!pos) {
		return 0;
	}
	return parseInt(pos.count);
}

Creep.prototype.cachedMoveTo = function(target, opts = {}) {
	if (this.fatigue > 0) {
		return ERR_TIRED;
	}
	if (samePos(this.pos, target.pos)) {
		return OK;
	}

	if (!('ignoreCreeps' in opts)) {
		opts['ignoreCreeps'] = true;
	}
	if (target instanceof Source) {
		opts['range'] = 1;
	}
	// If we're stick for >2 ticks, reset some things

	let count = positionCount(this.memory.lastPos);
	if (samePos(this.memory.lastPos, this.pos)) {
		if (count++ > 3) {
			this.say("😵");
			opts['ignoreCreeps'] = false;
			opts['reusePath'] = 1;
		}
	} else {
		count = 0;
	}

	this.memory.lastPos = {x: this.pos.x, y: this.pos.y, roomName: this.pos.roomName, count: count};

	let ret = this.moveTo(target, opts);
	if (ret !== 0) {
		this.log(`Moveto generated error: ${ret}`);
	}
	return ret;
}

Creep.prototype.isNextTo = function(target) {
	return this.pos.inRangeTo(this.pos.x, this.pos.y, target, 3);
}

Creep.prototype.log = function(message) {
	console.log(`[${this.name}]{${this.memory.state}}(${this.memory.target}) ${message}`);
}

Creep.prototype.displayState = function(state) {
	this.room.visual.text(state, this.pos, {align: 'center', font: '0.4'});
}
Creep.prototype.displayIdle = function() {
	this.displayState("💤");
}

Creep.prototype.getState = function() {
	return this.memory.state;
}
Creep.prototype.setState = function(state) {
	// this.log("+ Setting state to: " + state);
	this.resetTarget();
	this.memory.state = state;
}

Creep.prototype.getTarget = function() {
	return Game.getObjectById(this.memory.target);
}
Creep.prototype.setTarget = function(target) {
	// this.log('+ Set target' + target);
	this.memory.target = target.id;
}
Creep.prototype.resetTarget = function() {
	// this.log('+ Reset target');
	this.memory.target = undefined;
}