import { useState, useEffect } from 'react';
import { GameState, Player, Room, GameAction } from './types/game';
import LandingPage from './components/LandingPage';
import RoomLobby from './components/RoomLobby';
import GameTable from './components/GameTable';
import Leaderboard from './components/Leaderboard';
import socketService from './utils/socket';
import { Trophy } from 'lucide-react';

type AppState = 'landing' | 'lobby' | 'game';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    // Socket event listeners
    socket.on('room-joined', (data: { room: Room; player: Player }) => {
      setRoom(data.room);
      setCurrentPlayer(data.player);
      setAppState('lobby');
    });

    socket.on('room-updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on('game-started', (initialGameState: GameState) => {
      setGameState(initialGameState);
      setAppState('game');
    });

    socket.on('game-updated', (updatedGameState: GameState) => {
      setGameState(updatedGameState);
    });

    socket.on('player-updated', (updatedPlayer: Player) => {
      setCurrentPlayer(updatedPlayer);
    });

    socket.on('error', (errorMessage: string) => {
      alert(errorMessage);
    });

    socket.on('game-ended', (finalGameState: GameState) => {
      setGameState(finalGameState);
    });

    return () => {
      socket.off('room-joined');
      socket.off('room-updated');
      socket.off('game-started');
      socket.off('game-updated');
      socket.off('player-updated');
      socket.off('error');
      socket.off('game-ended');
    };
  }, []);

  const handleJoinRoom = (name: string, roomId?: string) => {
    const socket = socketService.getSocket();
    if (!socket) return;

    if (roomId) {
      socket.emit('join-room', { playerName: name, roomId });
    } else {
      socket.emit('create-room', { playerName: name, scoreLimit: 100 });
    }
  };

  const handleCreateRoom = (name: string, scoreLimit: number) => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit('create-room', { playerName: name, scoreLimit });
  };

  const handleStartGame = () => {
    const socket = socketService.getSocket();
    if (!socket || !room) return;

    socket.emit('start-game', { roomId: room.id });
  };

  const handleGameAction = (action: GameAction) => {
    const socket = socketService.getSocket();
    if (!socket || !room) return;

    socket.emit('game-action', { ...action, roomId: room.id });
  };

  const handleLeaveRoom = () => {
    const socket = socketService.getSocket();
    if (!socket || !room) return;

    socket.emit('leave-room', { roomId: room.id });
    
    setRoom(null);
    setCurrentPlayer(null);
    setGameState(null);
    setAppState('landing');
  };

  const handleUpdateScoreLimit = (limit: number) => {
    const socket = socketService.getSocket();
    if (!socket || !room || !currentPlayer?.isHost) return;

    socket.emit('update-score-limit', { roomId: room.id, scoreLimit: limit });
  };

  if (appState === 'landing') {
    return (
      <LandingPage 
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    );
  }

  if (appState === 'lobby' && room && currentPlayer) {
    return (
      <RoomLobby
        room={room}
        currentPlayer={currentPlayer}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        onUpdateScoreLimit={handleUpdateScoreLimit}
      />
    );
  }

  if (appState === 'game' && gameState && currentPlayer) {
    return (
      <>
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="bg-yellow-500 text-white p-3 rounded-full hover:bg-yellow-600 transition-colors shadow-lg"
            title="Show Leaderboard"
          >
            <Trophy size={24} />
          </button>
        </div>

        <GameTable
          gameState={gameState}
          currentPlayer={currentPlayer}
          onGameAction={handleGameAction}
          onLeaveGame={handleLeaveRoom}
        />

        {showLeaderboard && (
          <Leaderboard
            players={gameState.players}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}

export default App;