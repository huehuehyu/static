class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, hostId, hostPlayer, scoreLimit) {
    if (this.rooms.has(roomId)) {
      throw new Error('Room already exists');
    }

    const room = {
      id: roomId,
      hostId,
      players: [hostPlayer],
      gameState: null,
      maxPlayers: 8,
      scoreLimit,
      createdAt: new Date().toISOString()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getAllRooms() {
    return this.rooms;
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  updateRoom(roomId, updateData) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    Object.assign(room, updateData);
    return room;
  }

  getRoomByPlayerId(playerId) {
    for (const room of this.rooms.values()) {
      if (room.players.some(player => player.id === playerId)) {
        return room;
      }
    }
    return null;
  }
}

module.exports = RoomManager;