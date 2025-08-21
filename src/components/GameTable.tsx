import { useState, useEffect } from 'react';
import { GameState, Player, Card as CardType, GameAction } from '../types/game';
import Card from './Card';
import { calculateHandValue } from '../utils/cards';
import { Eye, SkipForward, Clock, Trophy } from 'lucide-react';

interface GameTableProps {
  gameState: GameState;
  currentPlayer: Player;
  onGameAction: (action: GameAction) => void;
  onLeaveGame: () => void;
}

export default function GameTable({ gameState, currentPlayer, onGameAction, onLeaveGame }: GameTableProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasPerformedAction, setHasPerformedAction] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayer.id;
  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];
  const myCards = currentPlayer.cards || [];
  const myHandValue = calculateHandValue(myCards, gameState.jokerValue);

  useEffect(() => {
    setHasPerformedAction(false);
    setTurnTimeLeft(30);
  }, [gameState.currentPlayerIndex]);

  useEffect(() => {
    if (isMyTurn && !hasPerformedAction && turnTimeLeft > 0) {
      const timer = setTimeout(() => {
        setTurnTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, hasPerformedAction, turnTimeLeft]);

  const handleCardDoubleClick = (card: CardType) => {
    if (!isMyTurn || hasPerformedAction) return;

    // Check if it's a card from my hand (drop action)
    if (myCards.some(c => c.id === card.id)) {
      if (selectedCard) {
        // Drop the selected card
        onGameAction({
          type: 'DROP_CARD',
          cardId: selectedCard,
          playerId: currentPlayer.id
        });
        setHasPerformedAction(true);
        setSelectedCard(null);
      } else {
        setSelectedCard(card.id);
      }
    }
  };

  const handlePickDeck = () => {
    if (!isMyTurn || hasPerformedAction) return;
    onGameAction({
      type: 'PICK_DECK',
      playerId: currentPlayer.id
    });
    setHasPerformedAction(true);
  };

  const handlePickDiscard = () => {
    if (!isMyTurn || hasPerformedAction || !topDiscardCard) return;
    onGameAction({
      type: 'PICK_DISCARD',
      playerId: currentPlayer.id
    });
    setHasPerformedAction(true);
  };

  const handleShowCards = () => {
    if (!isMyTurn || hasPerformedAction || (gameState.isFirstRound && !currentPlayer.canShow)) return;
    onGameAction({
      type: 'SHOW_CARDS',
      playerId: currentPlayer.id
    });
    setHasPerformedAction(true);
  };

  const handlePassTurn = () => {
    if (!isMyTurn) return;
    onGameAction({
      type: 'PASS_TURN',
      playerId: currentPlayer.id
    });
    setHasPerformedAction(false);
  };

  const getPlayerPosition = (index: number, totalPlayers: number) => {
    const angle = (index * 360) / totalPlayers;
    const radius = 200;
    const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
    return { x, y };
  };

  if (gameState.gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <Trophy size={64} className="mx-auto mb-4 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h1>
          <p className="text-xl text-gray-600 mb-6">
            Winner: <span className="font-bold text-green-600">{gameState.winner}</span>
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Final Scores:</h3>
            <div className="space-y-2">
              {gameState.players
                .sort((a, b) => a.totalScore - b.totalScore)
                .map((player, index) => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span className={`${index === 0 ? 'font-bold text-green-600' : ''}`}>
                      {player.name}
                    </span>
                    <span className={`${index === 0 ? 'font-bold text-green-600' : ''}`}>
                      {player.totalScore} pts
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={onLeaveGame}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-emerald-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 sm:p-6 mb-4 border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg">
                <h1 className="text-xl sm:text-2xl font-bold">♠ Least Count ♦</h1>
              </div>
              <div className="text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                <div className="font-semibold">Round {gameState.roundNumber}</div>
                <div className="text-xs">Joker: <span className="font-bold text-red-600">{gameState.jokerValue}</span></div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isMyTurn && (
                <div className="flex items-center space-x-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg animate-pulse">
                  <Clock size={18} />
                  <span className="font-bold">{turnTimeLeft}s</span>
                </div>
              )}
              <div className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-lg">
                <div className="font-semibold">Your Score</div>
                <div className="text-center font-bold">{myHandValue} pts</div>
              </div>
              <button
                onClick={onLeaveGame}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Game Table */}
        <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 rounded-3xl shadow-2xl p-4 sm:p-8 border-4 border-green-800" style={{ minHeight: '500px' }}>
          {/* Table surface texture */}
          <div className="absolute inset-0 bg-green-700/30 rounded-3xl"></div>
          
          {/* Players around the table */}
          <div className="relative z-10">
            {gameState.players.map((player, index) => {
              const position = getPlayerPosition(index, gameState.players.length);
              const isCurrentTurn = index === gameState.currentPlayerIndex;
              const isMe = player.id === currentPlayer.id;
              
              return (
                <div
                  key={player.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(50% + ${position.x * 0.8}px)`,
                    top: `calc(50% + ${position.y * 0.8}px)`
                  }}
                >
                  {/* Player info card */}
                  <div className={`text-center p-3 rounded-xl shadow-lg min-w-36 transition-all duration-300 ${
                    isCurrentTurn 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 transform scale-110 shadow-xl' 
                      : isMe
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                        : 'bg-white/95 backdrop-blur-sm text-gray-800'
                  } border-2 ${isCurrentTurn ? 'border-yellow-600' : isMe ? 'border-blue-700' : 'border-white/30'}`}>
                    
                    <div className="font-bold text-sm mb-1">{player.name}</div>
                    <div className="text-xs mb-1">
                      Hand: {calculateHandValue(player.cards, gameState.jokerValue)} pts
                    </div>
                    <div className="text-xs">
                      Total: <span className="font-bold">{player.totalScore}</span>
                    </div>
                    {player.hasShown && (
                      <div className="text-xs bg-green-600 text-white px-2 py-1 rounded-full mt-1 font-bold">
                        SHOWN
                      </div>
                    )}
                    {isCurrentTurn && (
                      <div className="text-xs bg-yellow-700 text-yellow-100 px-2 py-1 rounded-full mt-1 font-bold animate-bounce">
                        TURN
                      </div>
                    )}
                  </div>
                  
                  {/* Player's cards preview */}
                  <div className="flex mt-3 justify-center space-x-1">
                    {player.cards.slice(0, Math.min(4, player.cards.length)).map((card, cardIndex) => (
                      <div
                        key={card.id}
                        className={`w-8 h-12 sm:w-10 sm:h-14 rounded shadow-md transition-transform hover:scale-105 ${
                          player.id !== currentPlayer.id && !player.hasShown
                            ? 'bg-gradient-to-br from-blue-900 to-blue-700 border-2 border-blue-800'
                            : card.isJoker
                              ? 'bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-800'
                              : 'bg-white border border-gray-300'
                        }`}
                        style={{ transform: `rotate(${(cardIndex - 1.5) * 5}deg)` }}
                      >
                        {player.id === currentPlayer.id || player.hasShown ? (
                          <Card
                            card={card}
                            faceDown={false}
                            className="w-full h-full text-xs"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                            ?
                          </div>
                        )}
                      </div>
                    ))}
                    {player.cards.length > 4 && (
                      <div className="w-8 h-12 sm:w-10 sm:h-14 bg-gray-500/80 rounded flex items-center justify-center text-white text-xs font-bold shadow-md">
                        +{player.cards.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Center area with deck and discard pile */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-6 sm:space-x-12 z-20">
            {/* Deck */}
            <div className="text-center">
              <div className="mb-3 relative">
                {/* Stack effect for deck */}
                <div className="absolute top-1 left-1 w-20 h-28 bg-blue-800 rounded-lg shadow-lg"></div>
                <div className="absolute top-0.5 left-0.5 w-20 h-28 bg-blue-700 rounded-lg shadow-lg"></div>
                <Card
                  card={{ id: 'deck', suit: 'spades', value: 'DECK', numericValue: 0 }}
                  faceDown={true}
                  isClickable={isMyTurn && !hasPerformedAction}
                  onDoubleClick={handlePickDeck}
                  className={`w-20 h-28 relative z-10 transition-transform duration-200 ${
                    isMyTurn && !hasPerformedAction ? 'hover:scale-105 cursor-pointer' : ''
                  }`}
                />
                {isMyTurn && !hasPerformedAction && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    !
                  </div>
                )}
              </div>
              <div className="bg-white/90 backdrop-blur-sm text-green-800 text-sm font-bold px-3 py-1 rounded-lg shadow-lg">
                Deck ({gameState.deck.length})
              </div>
            </div>

            {/* Discard pile */}
            <div className="text-center">
              <div className="mb-3 relative">
                {topDiscardCard ? (
                  <>
                    <Card
                      card={topDiscardCard}
                      isClickable={isMyTurn && !hasPerformedAction}
                      onDoubleClick={handlePickDiscard}
                      className={`w-20 h-28 shadow-xl transition-transform duration-200 ${
                        isMyTurn && !hasPerformedAction ? 'hover:scale-105 cursor-pointer' : ''
                      }`}
                    />
                    {isMyTurn && !hasPerformedAction && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                        !
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-20 h-28 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center bg-green-600/30">
                    <span className="text-white text-xs font-bold">Empty</span>
                  </div>
                )}
              </div>
              <div className="bg-white/90 backdrop-blur-sm text-green-800 text-sm font-bold px-3 py-1 rounded-lg shadow-lg">
                Discard
              </div>
            </div>
          </div>

          {/* Turn indicator */}
          {isMyTurn && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold text-lg shadow-xl animate-bounce">
              YOUR TURN!
            </div>
          )}
        </div>

        {/* Enhanced My Cards Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 mt-4 border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center space-x-2">
              <span>🃏</span>
              <span>Your Hand (Value: {myHandValue})</span>
            </h3>
            <div className={`text-sm px-4 py-2 rounded-lg font-semibold ${
              isMyTurn ? 
                'bg-green-100 text-green-700' : 
                'bg-gray-100 text-gray-600'
            }`}>
              {isMyTurn ? (
                hasPerformedAction ? 'Waiting for turn to complete...' : '🎯 Your turn - Make your move!'
              ) : (
                `⏳ ${currentTurnPlayer?.name}'s turn`
              )}
            </div>
          </div>
          
          {/* Cards display */}
          <div className="flex space-x-2 mb-6 justify-center flex-wrap gap-2">
            {myCards.map((card) => (
              <div key={card.id} className="relative">
                <Card
                  card={card}
                  isClickable={isMyTurn && !hasPerformedAction}
                  isSelected={selectedCard === card.id}
                  onDoubleClick={handleCardDoubleClick}
                  className={`transition-all duration-200 ${
                    selectedCard === card.id ? 'transform -translate-y-2 shadow-xl' : ''
                  } ${card.isJoker ? 'ring-2 ring-red-400' : ''}`}
                />
                {card.isJoker && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full font-bold">
                    J
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handlePickDeck}
              disabled={!isMyTurn || hasPerformedAction}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
            >
              <span>🃏</span>
              <span>Pick Deck</span>
            </button>
            
            <button
              onClick={handlePickDiscard}
              disabled={!isMyTurn || hasPerformedAction || !topDiscardCard}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
            >
              <span>♻️</span>
              <span>Pick Discard</span>
            </button>

            <button
              onClick={handleShowCards}
              disabled={!isMyTurn || hasPerformedAction || (gameState.isFirstRound && !currentPlayer.canShow)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>Show Cards</span>
            </button>

            <button
              onClick={handlePassTurn}
              disabled={!isMyTurn}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
            >
              <SkipForward size={16} />
              <span>Pass Turn</span>
            </button>
          </div>

          {/* Helper text */}
          {selectedCard && (
            <div className="mt-4 text-center">
              <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg inline-block">
                💡 Card selected! Double-click another card to drop the selected one
              </div>
            </div>
          )}
          
          {isMyTurn && !hasPerformedAction && !selectedCard && (
            <div className="mt-4 text-center">
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg inline-block">
                🎮 Pick a card from deck/discard, then drop one from your hand
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}