const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const GameLogic = require('./gameLogic');
const RoomManager = require('./roomManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();
const gameLogic = new GameLogic();

// Store player socket mappings
const playerSockets = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('create-room', ({ playerName, scoreLimit }) => {
    try {
      const roomId = uuidv4().substring(0, 8).toUpperCase();
      const playerId = uuidv4();
      
      const player = {
        id: playerId,
        name: playerName,
        cards: [],
        score: 0,
        totalScore: 0,
        isHost: true,
        isOnline: true,
        hasShown: false,
        canShow: false
      };

      const room = roomManager.createRoom(roomId, playerId, player, scoreLimit);
      
      socket.join(roomId);
      playerSockets.set(playerId, socket.id);

      socket.emit('room-joined', { room, player });
      
      console.log(`Room created: ${roomId} by ${playerName}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('join-room', ({ playerName, roomId }) => {
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (room.players.length >= 8) {
        socket.emit('error', 'Room is full');
        return;
      }

      const playerId = uuidv4();
      const player = {
        id: playerId,
        name: playerName,
        cards: [],
        score: 0,
        totalScore: 0,
        isHost: false,
        isOnline: true,
        hasShown: false,
        canShow: false
      };

      room.players.push(player);
      
      socket.join(roomId);
      playerSockets.set(playerId, socket.id);

      socket.emit('room-joined', { room, player });
      io.to(roomId).emit('room-updated', room);
      
      console.log(`${playerName} joined room: ${roomId}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('start-game', ({ roomId }) => {
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (room.players.length < 2) {
        socket.emit('error', 'Need at least 2 players to start');
        return;
      }

      const gameState = gameLogic.initializeGame(room.players, room.scoreLimit);
      room.gameState = gameState;

      // Update all players with their cards
      room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(playerSockets.get(player.id));
        if (playerSocket) {
          playerSocket.emit('player-updated', player);
        }
      });

      io.to(roomId).emit('game-started', gameState);
      
      console.log(`Game started in room: ${roomId}`);
      
      // Start turn timer
      startTurnTimer(roomId);
      
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('game-action', (action) => {
    try {
      const room = roomManager.getRoom(action.roomId);
      if (!room || !room.gameState) {
        socket.emit('error', 'Game not found');
        return;
      }

      const result = gameLogic.processAction(room.gameState, action);
      
      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      // Update the player's cards
      const updatedPlayer = room.gameState.players.find(p => p.id === action.playerId);
      if (updatedPlayer) {
        const playerSocket = io.sockets.sockets.get(playerSockets.get(updatedPlayer.id));
        if (playerSocket) {
          playerSocket.emit('player-updated', updatedPlayer);
        }
      }

      io.to(action.roomId).emit('game-updated', room.gameState);

      if (room.gameState.gameEnded) {
        io.to(action.roomId).emit('game-ended', room.gameState);
        clearTurnTimer(action.roomId);
      } else {
        // Restart turn timer for next player
        clearTurnTimer(action.roomId);
        startTurnTimer(action.roomId);
      }
      
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('update-score-limit', ({ roomId, scoreLimit }) => {
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      room.scoreLimit = scoreLimit;
      if (room.gameState) {
        room.gameState.scoreLimit = scoreLimit;
      }

      io.to(roomId).emit('room-updated', room);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('leave-room', ({ roomId }) => {
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Find and remove the player
      const playerId = Array.from(playerSockets.entries())
        .find(([_, socketId]) => socketId === socket.id)?.[0];
      
      if (playerId) {
        room.players = room.players.filter(p => p.id !== playerId);
        playerSockets.delete(playerId);
        
        // If host left, make someone else host
        if (room.players.length > 0 && !room.players.some(p => p.isHost)) {
          room.players[0].isHost = true;
        }
        
        socket.leave(roomId);
        
        if (room.players.length === 0) {
          roomManager.deleteRoom(roomId);
          clearTurnTimer(roomId);
        } else {
          io.to(roomId).emit('room-updated', room);
          
          // If game is in progress and current player left, skip their turn
          if (room.gameState && !room.gameState.gameEnded) {
            const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
            if (currentPlayer.id === playerId) {
              gameLogic.skipTurn(room.gameState);
              io.to(roomId).emit('game-updated', room.gameState);
            }
          }
        }
      }
      
      console.log(`Player left room: ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Mark player as offline and handle disconnection
    const playerId = Array.from(playerSockets.entries())
      .find(([_, socketId]) => socketId === socket.id)?.[0];
    
    if (playerId) {
      // Find the room this player was in
      const rooms = roomManager.getAllRooms();
      for (const room of rooms.values()) {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          player.isOnline = false;
          
          // Auto-show cards if it's their turn and game is in progress
          if (room.gameState && !room.gameState.gameEnded) {
            const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
            if (currentPlayer.id === playerId && !currentPlayer.hasShown) {
              gameLogic.autoShowCards(room.gameState, playerId);
              io.to(room.id).emit('game-updated', room.gameState);
            }
          }
          
          io.to(room.id).emit('room-updated', room);
          break;
        }
      }
      
      playerSockets.delete(playerId);
    }
  });
});

// Turn timer management
const turnTimers = new Map();

function startTurnTimer(roomId) {
  const timer = setTimeout(() => {
    const room = roomManager.getRoom(roomId);
    if (room && room.gameState && !room.gameState.gameEnded) {
      const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
      
      // Auto-skip turn if player takes too long
      gameLogic.skipTurn(room.gameState);
      io.to(roomId).emit('game-updated', room.gameState);
      
      // Start timer for next player
      startTurnTimer(roomId);
    }
  }, 30000); // 30 seconds per turn
  
  turnTimers.set(roomId, timer);
}

function clearTurnTimer(roomId) {
  const timer = turnTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomId);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});