import React, { useState } from 'react';
import { Users, Plus, LogIn } from 'lucide-react';

interface LandingPageProps {
  onJoinRoom: (name: string, roomId?: string) => void;
  onCreateRoom: (name: string, scoreLimit: number) => void;
}

export default function LandingPage({ onJoinRoom, onCreateRoom }: LandingPageProps) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [scoreLimit, setScoreLimit] = useState(100);
  const [captcha, setCaptcha] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${num1} + ${num2}`);
    setCaptchaAnswer((num1 + num2).toString());
  };

  const handleJoinRoom = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (captcha !== captchaAnswer) {
      alert('Incorrect captcha answer');
      generateCaptcha();
      setCaptcha('');
      return;
    }
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    onJoinRoom(name.trim(), roomId.trim());
  };

  const handleCreateRoom = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (captcha !== captchaAnswer) {
      alert('Incorrect captcha answer');
      generateCaptcha();
      setCaptcha('');
      return;
    }
    onCreateRoom(name.trim(), scoreLimit);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Least Count</h1>
          <p className="text-gray-600">Multiplayer Card Game</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Captcha: {captchaQuestion} = ?
            </label>
            <input
              type="text"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter the answer"
            />
          </div>

          {!isCreating ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter room ID to join"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Limit
              </label>
              <select
                value={scoreLimit}
                onChange={(e) => setScoreLimit(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={50}>50 Points</option>
                <option value={100}>100 Points</option>
                <option value={150}>150 Points</option>
                <option value={200}>200 Points</option>
              </select>
            </div>
          )}

          <div className="flex space-x-4">
            {!isCreating ? (
              <>
                <button
                  onClick={handleJoinRoom}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <LogIn size={20} />
                  <span>Join Room</span>
                </button>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Create</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Users size={20} />
                  <span>Create Room</span>
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Game Rules:</p>
          <ul className="text-xs mt-2 space-y-1">
            <li>• Start with 7 cards, minimize your total</li>
            <li>• A=1, J/Q/K=10, others face value</li>
            <li>• Double-click cards to pick/drop</li>
            <li>• Can't show in first round</li>
          </ul>
        </div>
      </div>
    </div>
  );
}