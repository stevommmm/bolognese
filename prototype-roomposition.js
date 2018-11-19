'use strict';

RoomPosition.prototype.getAdjacent = function(direction) {
	switch (direction) {
		case TOP:
			return new RoomPosition(this.x, this.y - 1, this.roomName);
			break;
		case TOP_RIGHT:
			return new RoomPosition(this.x + 1, this.y - 1, this.roomName);
			break;
		case RIGHT:
			return new RoomPosition(this.x + 1, this.y, this.roomName);
			break;
		case BOTTOM_RIGHT:
			return new RoomPosition(this.x + 1, this.y + 1, this.roomName);
			break;
		case BOTTOM:
			return new RoomPosition(this.x, this.y + 1, this.roomName);
			break;
		case BOTTOM_LEFT:
			return new RoomPosition(this.x - 1, this.y + 1, this.roomName);
			break;
		case LEFT:
			return new RoomPosition(this.x - 1, this.y, this.roomName);
			break;
		case TOP_LEFT:
			return new RoomPosition(this.x -1, this.y - 1, this.roomName);
			break;
	}
}