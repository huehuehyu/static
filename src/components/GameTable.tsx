import { useState, useEffect } from 'react';
import { GameState, Player, Card as CardType, GameAction } from '../types/game';
import Card from './Card';
import { calculateHandValue } from '../utils/cards';
import { Clock, Trophy } from 'lucide-react';

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
  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];
  const myCards = currentPlayer.cards || [];
  const myHandValue = calculateHandValue(myCards, gameState.jokerValue);

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
      // Allow selecting multiple cards of the same value
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

    // Check if playing the same card as top discard (no need to pick)
    const firstSelectedCard = myCards.find(c => c.id === selectedCards[0]);
    const sameAsDiscard = topDiscardCard && firstSelectedCard?.value === topDiscardCard.value;

    if (sameAsDiscard || hasPickedCard) {
      // Play the selected cards
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

  const getPlayerSide = (playerIndex: number, totalPlayers: number, currentPlayerIndex: number) => {
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
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
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

  const myPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);

  return (
    <div className="min-h-screen bg-slate-800 text-white">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Least Count</h1>
          <span className="bg-slate-700 px-3 py-1 rounded">Room ID: {gameState.id}</span>
        </div>
        <div className="flex items-center space-x-4">
          {isMyTurn && (
            <div className="flex items-center space-x-2 text-orange-400">
              <Clock size={20} />
              <span className="font-bold">{turnTimeLeft}s</span>
            </div>
          )}
          <button
            onClick={onLeaveGame}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Sidebar - Deck and Joker */}
        <div className="w-64 bg-slate-900 p-6 flex flex-col items-center space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2">Joker</h3>
            <div className="text-4xl font-bold text-red-400">{gameState.jokerValue}</div>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">Deck</h3>
            <div className="relative">
              <Card
                card={{ id: 'deck', suit: 'spades', value: 'DECK', numericValue: 0 }}
                faceDown={true}
                isClickable={isMyTurn && !hasPickedCard}
                onDoubleClick={handlePickDeck}
                className={`w-24 h-36 ${isMyTurn && !hasPickedCard ? 'cursor-pointer hover:scale-105' : ''}`}
              />
              <div className="mt-2 text-sm text-slate-400">{gameState.deck.length} cards</div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative">
          {/* Players positioned at sides */}
          {gameState.players.map((player, index) => {
            const side = getPlayerSide(index, gameState.players.length, myPlayerIndex);
            const isCurrentTurn = index === gameState.currentPlayerIndex;
            const isMe = player.id === currentPlayer.id;
            
            let positionClasses = '';
            if (side === 'bottom') {
              positionClasses = 'absolute bottom-4 left-1/2 transform -translate-x-1/2';
            } else if (side === 'top') {
              positionClasses = 'absolute top-4 left-1/2 transform -translate-x-1/2';
            } else if (side === 'left') {
              positionClasses = 'absolute left-4 top-1/2 transform -translate-y-1/2';
            } else if (side === 'right') {
              positionClasses = 'absolute right-4 top-1/2 transform -translate-y-1/2';
            } else if (side === 'top-left') {
              positionClasses = 'absolute top-4 left-4';
            } else if (side === 'top-right') {
              positionClasses = 'absolute top-4 right-4';
            }

            return (
              <div key={player.id} className={positionClasses}>
                {/* Player Info */}
                <div className={`p-3 rounded-lg mb-2 text-center ${
                  isCurrentTurn 
                    ? 'bg-yellow-600 text-yellow-100' 
                    : isMe 
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                }`}>
                  <div className="font-bold">{player.name}</div>
                  <div className="text-sm">
                    {calculateHandValue(player.cards, gameState.jokerValue)} pts
                  </div>
                  {isCurrentTurn && (
                    <div className="text-xs font-bold">TURN</div>
                  )}
                </div>

                {/* Player Cards */}
                {isMe ? (
                  <div className="flex space-x-2 justify-center">
                    {myCards.map((card) => (
                      <div key={card.id} className="relative">
                        <Card
                          card={card}
                          isClickable={isMyTurn}
                          isSelected={selectedCards.includes(card.id)}
                          onDoubleClick={() => handleCardClick(card)}
                          className={`w-16 h-24 transition-all ${
                            selectedCards.includes(card.id) ? 'transform -translate-y-2' : ''
                          }`}
                        />
                        {card.isJoker && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                            J
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex space-x-1 justify-center">
                    {Array.from({ length: Math.min(player.cards.length, 7) }).map((_, i) => (
                      <Card
                        key={i}
                        card={{ id: `back-${i}`, suit: 'spades', value: '?', numericValue: 0 }}
                        faceDown={true}
                        className="w-12 h-18"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Center - Discard Pile */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">Table</h3>
              {topDiscardCard ? (
                <Card
                  card={topDiscardCard}
                  isClickable={isMyTurn && !hasPickedCard}
                  onDoubleClick={handlePickDiscard}
                  className={`w-24 h-36 ${isMyTurn && !hasPickedCard ? 'cursor-pointer hover:scale-105' : ''}`}
                />
              ) : (
                <div className="w-24 h-36 border-2 border-dashed border-slate-500 rounded-lg flex items-center justify-center">
                  <span className="text-slate-500">Empty</span>
                </div>
              )}
            </div>
          </div>

          {/* Turn Status */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-slate-700 px-4 py-2 rounded-lg text-center">
              {isMyTurn ? (
                <span className="text-green-400 font-bold">YOUR TURN</span>
              ) : (
                <span>{currentTurnPlayer?.name}'s Turn</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {isMyTurn && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 p-4">
          <div className="max-w-4xl mx-auto flex justify-center space-x-4">
            <button
              onClick={handlePickDeck}
              disabled={hasPickedCard}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
            >
              Pick Deck
            </button>
            
            <button
              onClick={handlePickDiscard}
              disabled={hasPickedCard || !topDiscardCard}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
            >
              Pick Table Card
            </button>

            <button
              onClick={handlePlayCards}
              disabled={selectedCards.length === 0 || (!hasPickedCard && !(topDiscardCard && myCards.find(c => c.id === selectedCards[0])?.value === topDiscardCard.value))}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
            >
              Play Cards ({selectedCards.length})
            </button>
          </div>
          
          {selectedCards.length > 0 && (
            <div className="text-center mt-2 text-sm text-slate-400">
              Selected: {selectedCards.length} card(s) • 
              {!hasPickedCard && topDiscardCard && myCards.find(c => c.id === selectedCards[0])?.value === topDiscardCard.value
                ? " Same as table card - no pick needed"
                : hasPickedCard 
                  ? " Ready to play"
                  : " Pick a card first"
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
