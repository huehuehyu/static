import React from 'react';
import { Player } from '../types/game';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardProps {
  players: Player[];
  onClose: () => void;
}

export default function Leaderboard({ players, onClose }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => a.totalScore - b.totalScore);

  const getIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="text-yellow-500" size={24} />;
      case 1: return <Medal className="text-gray-400" size={24} />;
      case 2: return <Award className="text-amber-600" size={24} />;
      default: return <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold">{position + 1}</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Leaderboard</h2>
        
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center space-x-4 p-4 rounded-lg ${
                index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
                index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
                index === 2 ? 'bg-amber-50 border-2 border-amber-200' :
                'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                {getIcon(index)}
              </div>
              
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{player.name}</div>
                <div className="text-sm text-gray-600">
                  Current: {player.score} pts | Total: {player.totalScore} pts
                </div>
              </div>
              
              {!player.isOnline && (
                <div className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                  Offline
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}