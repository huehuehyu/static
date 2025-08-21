import { useState, useEffect } from 'react';
import { GameState, Player, Card as CardType, GameAction } from '../types/game';
import Card from './Card';
import { calculateHandValue } from '../utils/cards';
import { Clock, Trophy, Users, Star } from 'lucide-react';

interface GameTableProps {
  gameState: GameState;
  currentPlayer: Player;
  onGameAction: (action: GameAction) => void;
  onLeaveGame: () => void;
}

export default function GameTable({ gameState, currentPlayer, onGameAction, onLeaveGame }: GameTableProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [hasPickedCard, setHasPickedCard] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(60);

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayer.id;
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];
  const myCards = currentPlayer.cards || [];

  useEffect(() => {
    setSelectedCards([]);
    setHasPickedCard(false);
    setTurnTimeLeft(60);
  }, [gameState.currentPlayerIndex]);

  useEffect(() => {
    if (isMyTurn && turnTimeLeft > 0) {
      const timer = setTimeout(() => {
        setTurnTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, turnTimeLeft]);

  const handleCardClick = (card: CardType) => {
    if (!isMyTurn) return;

    const cardId = card.id;
    if (selectedCards.includes(cardId)) {
      setSelectedCards(prev => prev.filter(id => id !== cardId));
    } else {
      const cardValue = card.value;
      if (selectedCards.length === 0) {
        setSelectedCards([cardId]);
      } else {
        const firstSelectedCard = myCards.find(c => c.id === selectedCards[0]);
        if (firstSelectedCard?.value === cardValue) {
          setSelectedCards(prev => [...prev, cardId]);
        }
      }
    }
  };

  const handlePickDeck = () => {
    if (!isMyTurn || hasPickedCard) return;
    onGameAction({
      type: 'PICK_DECK',
      playerId: currentPlayer.id
    });
    setHasPickedCard(true);
  };

  const handlePickDiscard = () => {
    if (!isMyTurn || hasPickedCard || !topDiscardCard) return;
    onGameAction({
      type: 'PICK_DISCARD',
      playerId: currentPlayer.id
    });
    setHasPickedCard(true);
  };

  const handlePlayCards = () => {
    if (!isMyTurn || selectedCards.length === 0) return;

    const firstSelectedCard = myCards.find(c => c.id === selectedCards[0]);
    const sameAsDiscard = topDiscardCard && firstSelectedCard?.value === topDiscardCard.value;

    if (sameAsDiscard || hasPickedCard) {
      selectedCards.forEach((cardId, index) => {
        setTimeout(() => {
          onGameAction({
            type: 'DROP_CARD',
            cardId: cardId,
            playerId: currentPlayer.id
          });
        }, index * 100);
      });
      
      setSelectedCards([]);
      setHasPickedCard(false);
    }
  };

  const handleShowCards = () => {
    if (!isMyTurn) return;
    onGameAction({
      type: 'SHOW_CARDS',
      playerId: currentPlayer.id
    });
  };

  const getPlayerPosition = (playerIndex: number, totalPlayers: number, currentPlayerIndex: number) => {
    const relativePosition = (playerIndex - currentPlayerIndex + totalPlayers) % totalPlayers;
    
    if (totalPlayers === 2) {
      return relativePosition === 0 ? 'bottom' : 'top';
    } else if (totalPlayers === 3) {
      return ['bottom', 'top-left', 'top-right'][relativePosition];
    } else if (totalPlayers === 4) {
      return ['bottom', 'left', 'top', 'right'][relativePosition];
    }
    return 'bottom';
  };

  if (gameState.gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Trophy size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Winner!</h1>
          <p className="text-2xl text-green-600 font-bold mb-6">{gameState.winner}</p>
          
          <div className="mb-6 bg-gray-50 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Final Scores</h3>
            <div className="space-y-3">
              {gameState.players
                .sort((a, b) => a.totalScore - b.totalScore)
                .map((player, index) => (
                  <div key={player.id} className={`flex justify-between items-center p-3 rounded-xl ${
                    index === 0 ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-white'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {index === 0 && <Star size={16} />}
                      <span className="font-semibold">{player.name}</span>
                    </div>
                    <span className="font-bold">{player.totalScore} pts</span>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={onLeaveGame}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  const myPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900">
      {/* Top Header - RummyCircle Style */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Least Count</h1>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">Room: {gameState.id.slice(0, 8)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <Users size={16} className="text-white" />
              <span className="text-white font-medium">{gameState.players.length} Players</span>
            </div>
            
            {isMyTurn && (
              <div className="flex items-center space-x-2 bg-yellow-400 text-black rounded-lg px-3 py-2 animate-pulse">
                <Clock size={16} />
                <span className="font-bold">{turnTimeLeft}s</span>
              </div>
            )}
            
            <button
              onClick={onLeaveGame}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Table */}
      <div className="relative h-screen overflow-hidden">
        {/* Players positioned around the table - RummyCircle style */}
        {gameState.players.map((player, index) => {
          const side = getPlayerPosition(index, gameState.players.length, myPlayerIndex);
          const isCurrentTurn = index === gameState.currentPlayerIndex;
          const isMe = player.id === currentPlayer.id;
          
          let positionClasses = '';
          let cardDirection = 'flex-row';
          
          if (side === 'bottom') {
            positionClasses = 'absolute bottom-4 left-1/2 transform -translate-x-1/2';
          } else if (side === 'top') {
            positionClasses = 'absolute top-20 left-1/2 transform -translate-x-1/2';
            cardDirection = 'flex-row';
          } else if (side === 'left') {
            positionClasses = 'absolute left-4 top-1/2 transform -translate-y-1/2';
            cardDirection = 'flex-col';
          } else if (side === 'right') {
            positionClasses = 'absolute right-4 top-1/2 transform -translate-y-1/2';
            cardDirection = 'flex-col';
          } else if (side === 'top-left') {
            positionClasses = 'absolute top-20 left-8';
          } else if (side === 'top-right') {
            positionClasses = 'absolute top-20 right-8';
          }

          return (
            <div key={player.id} className={positionClasses}>
              {/* Player Avatar and Info - RummyCircle Style */}
              <div className={`mb-3 ${side === 'left' || side === 'right' ? 'mb-2' : ''}`}>
                <div className={`relative p-3 rounded-2xl shadow-lg min-w-32 ${
                  isCurrentTurn 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse' 
                    : isMe 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white text-gray-800'
                }`}>
                  {/* Avatar Circle */}
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg ${
                    isCurrentTurn ? 'bg-white text-orange-500' : isMe ? 'bg-white text-blue-600' : 'bg-gray-200'
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-sm">{player.name}</div>
                    <div className="text-xs opacity-90">
                      {calculateHandValue(player.cards, gameState.jokerValue)} pts
                    </div>
                    <div className="text-xs opacity-75">
                      Total: {player.totalScore}
                    </div>
                    
                    {isCurrentTurn && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                        TURN
                      </div>
                    )}
                    
                    {player.hasShown && (
                      <div className="mt-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        FINISHED
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Player Cards */}
              <div className={`flex ${cardDirection} ${side === 'left' || side === 'right' ? 'space-y-1' : 'space-x-1'} justify-center items-center`}>
                {isMe ? (
                  myCards.map((card) => (
                    <div key={card.id} className="relative">
                      <Card
                        card={card}
                        isClickable={isMyTurn}
                        isSelected={selectedCards.includes(card.id)}
                        onDoubleClick={() => handleCardClick(card)}
                        className={`${side === 'left' || side === 'right' ? 'w-10 h-14' : 'w-12 h-18'} transition-all duration-200 ${
                          selectedCards.includes(card.id) ? 'transform -translate-y-2 scale-110' : ''
                        } ${card.isJoker ? 'ring-2 ring-red-400' : ''}`}
                      />
                      {card.isJoker && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full font-bold animate-pulse">
                          J
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  Array.from({ length: Math.min(player.cards.length, 7) }).map((_, i) => (
                    <Card
                      key={i}
                      card={{ id: `back-${i}`, suit: 'spades', value: '?', numericValue: 0 }}
                      faceDown={true}
                      className={`${side === 'left' || side === 'right' ? 'w-8 h-12' : 'w-10 h-14'}`}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Center Table Area - RummyCircle Style */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center space-x-8">
            {/* Closed Deck */}
            <div className="text-center">
              <div className="relative mb-2">
                <Card
                  card={{ id: 'deck', suit: 'spades', value: 'DECK', numericValue: 0 }}
                  faceDown={true}
                  isClickable={isMyTurn && !hasPickedCard}
                  onDoubleClick={handlePickDeck}
                  className={`w-20 h-28 shadow-lg ${isMyTurn && !hasPickedCard ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''}`}
                />
                {isMyTurn && !hasPickedCard && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="text-xs font-bold text-gray-800">CLOSED DECK</div>
                <div className="text-xs text-gray-600">{gameState.deck.length} cards</div>
              </div>
            </div>

            {/* Open Card/Discard Pile */}
            <div className="text-center">
              <div className="relative mb-2">
                {topDiscardCard ? (
                  <>
                    <Card
                      card={topDiscardCard}
                      isClickable={isMyTurn && !hasPickedCard}
                      onDoubleClick={handlePickDiscard}
                      className={`w-20 h-28 shadow-lg ${isMyTurn && !hasPickedCard ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''}`}
                    />
                    {isMyTurn && !hasPickedCard && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-ping">
                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-20 h-28 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center bg-green-600/30">
                    <span className="text-white text-xs font-bold">EMPTY</span>
                  </div>
                )}
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="text-xs font-bold text-gray-800">OPEN CARD</div>
              </div>
            </div>
          </div>

          {/* Joker Display */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-3 shadow-lg">
              <div className="text-center">
                <div className="text-white text-xs font-bold mb-1">JOKER</div>
                <div className="text-white text-2xl font-bold">{gameState.jokerValue}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Turn Indicator */}
        {isMyTurn && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse">
              🎯 YOUR TURN!
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Panel - RummyCircle Style */}
      {isMyTurn && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-600">
          <div className="max-w-6xl mx-auto p-4">
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mb-2">
              <button
                onClick={handlePickDeck}
                disabled={hasPickedCard}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span>🃏</span>
                <span>PICK DECK</span>
              </button>
              
              <button
                onClick={handlePickDiscard}
                disabled={hasPickedCard || !topDiscardCard}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span>♻️</span>
                <span>PICK OPEN</span>
              </button>

              <button
                onClick={handlePlayCards}
                disabled={selectedCards.length === 0 || (!hasPickedCard && !(topDiscardCard && myCards.find(c => c.id === selectedCards[0])?.value === topDiscardCard.value))}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span>🎯</span>
                <span>DISCARD ({selectedCards.length})</span>
              </button>

              <button
                onClick={handleShowCards}
                disabled={!hasPickedCard && selectedCards.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span>🏆</span>
                <span>DECLARE</span>
              </button>
            </div>
            
            {/* Status Text */}
            <div className="text-center text-sm text-gray-300">
              {selectedCards.length > 0 ? (
                <span>
                  {selectedCards.length} card(s) selected • 
                  {!hasPickedCard && topDiscardCard && myCards.find(c => c.id === selectedCards[0])?.value === topDiscardCard.value
                    ? " Same as open card - no pick needed"
                    : hasPickedCard 
                      ? " Ready to discard"
                      : " Pick a card first"
                  }
                </span>
              ) : (
                <span>Select cards to discard • {hasPickedCard ? "Card picked - select cards to discard" : "Pick a card from deck or open pile first"}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
