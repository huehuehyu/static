import React from 'react';
import { Room, Player } from '../types/game';
import { Users, Crown, Play, Copy, LogOut } from 'lucide-react';

interface RoomLobbyProps {
  room: Room;
  currentPlayer: Player;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onUpdateScoreLimit: (limit: number) => void;
}

export default function RoomLobby({ room, currentPlayer, onStartGame, onLeaveRoom, onUpdateScoreLimit }: RoomLobbyProps) {
  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    alert('Room ID copied to clipboard!');
  };

  const canStartGame = room.players.length >= 2 && currentPlayer.isHost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Game Lobby</h1>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <span>Room ID: {room.id}</span>
            <button 
              onClick={copyRoomId}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy Room ID"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center space-x-2">
              <Users size={20} />
              <span>Players ({room.players.length}/8)</span>
            </h2>
            <button
              onClick={onLeaveRoom}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <LogOut size={16} />
              <span>Leave</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg border-2 flex items-center space-x-3 ${
                  player.isOnline 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${
                  player.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="font-medium text-gray-700">
                  {player.name}
                  {player.isHost && <Crown size={16} className="inline ml-2 text-yellow-500" />}
                </span>
              </div>
            ))}
          </div>
        </div>

        {currentPlayer.isHost && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score Limit
            </label>
            <select
              value={room.scoreLimit}
              onChange={(e) => onUpdateScoreLimit(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={50}>50 Points</option>
              <option value={100}>100 Points</option>
              <option value={150}>150 Points</option>
              <option value={200}>200 Points</option>
            </select>
          </div>
        )}

        <div className="text-center">
          {canStartGame ? (
            <button
              onClick={onStartGame}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto text-lg font-semibold"
            >
              <Play size={24} />
              <span>Start Game</span>
            </button>
          ) : (
            <div className="text-gray-500">
              {room.players.length < 2 
                ? 'Waiting for more players (minimum 2 required)...' 
                : 'Waiting for host to start the game...'}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-2">Share the Room ID with friends to join!</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-700">Quick Rules Reminder:</p>
            <ul className="text-xs mt-2 space-y-1 text-left">
              <li>• Each player starts with 7 cards</li>
              <li>• Pick from deck or discard pile, then drop a card</li>
              <li>• Goal: minimize your hand value (A=1, J/Q/K=10)</li>
              <li>• Can't show cards in the first round</li>
              <li>• Double-click cards to interact</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}