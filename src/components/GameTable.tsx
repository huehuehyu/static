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
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">Least Count</h1>
            <div className="text-sm text-gray-600">
              Round {gameState.roundNumber} • Joker: {gameState.jokerValue}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isMyTurn && (
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock size={20} />
                <span>{turnTimeLeft}s</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              Your Score: {myHandValue} pts
            </div>
            <button
              onClick={onLeaveGame}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>

        {/* Game Table */}
        <div className="relative bg-green-700 rounded-2xl shadow-2xl p-8" style={{ minHeight: '600px' }}>
          {/* Players around the table */}
          <div className="absolute inset-0 flex items-center justify-center">
            {gameState.players.map((player, index) => {
              const position = getPlayerPosition(index, gameState.players.length);
              const isCurrentTurn = index === gameState.currentPlayerIndex;
              
              return (
                <div
                  key={player.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`
                  }}
                >
                  <div className={`text-center p-3 rounded-lg ${
                    isCurrentTurn ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-gray-800'
                  } shadow-lg min-w-32`}>
                    <div className="font-bold text-sm">{player.name}</div>
                    <div className="text-xs">
                      {calculateHandValue(player.cards, gameState.jokerValue)} pts
                    </div>
                    <div className="text-xs">
                      Total: {player.totalScore}
                    </div>
                    {player.hasShown && (
                      <div className="text-xs text-green-600 font-bold">SHOWN</div>
                    )}
                  </div>
                  
                  {/* Player's cards (face down for others) */}
                  <div className="flex mt-2 justify-center space-x-1">
                    {player.cards.slice(0, Math.min(3, player.cards.length)).map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        faceDown={player.id !== currentPlayer.id && !player.hasShown}
                        className="w-10 h-14"
                      />
                    ))}
                    {player.cards.length > 3 && (
                      <div className="w-10 h-14 bg-gray-400 rounded flex items-center justify-center text-white text-xs">
                        +{player.cards.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center area with deck and discard pile */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-8">
            {/* Deck */}
            <div className="text-center">
              <div className="mb-2">
                <Card
                  card={{ id: 'deck', suit: 'spades', value: 'DECK', numericValue: 0 }}
                  faceDown={true}
                  isClickable={isMyTurn && !hasPerformedAction}
                  onDoubleClick={handlePickDeck}
                  className="w-20 h-28"
                />
              </div>
              <div className="text-white text-sm font-bold">
                Deck ({gameState.deck.length})
              </div>
            </div>

            {/* Discard pile */}
            <div className="text-center">
              <div className="mb-2">
                {topDiscardCard ? (
                  <Card
                    card={topDiscardCard}
                    isClickable={isMyTurn && !hasPerformedAction}
                    onDoubleClick={handlePickDiscard}
                    className="w-20 h-28"
                  />
                ) : (
                  <div className="w-20 h-28 border-2 border-dashed border-white rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">Empty</span>
                  </div>
                )}
              </div>
              <div className="text-white text-sm font-bold">Discard</div>
            </div>
          </div>
        </div>

        {/* My Cards */}
        <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Your Cards (Value: {myHandValue})
            </h3>
            <div className="text-sm text-gray-600">
              {isMyTurn ? (
                hasPerformedAction ? 'Waiting for your turn to complete' : 'Your turn!'
              ) : (
                `${currentTurnPlayer?.name}'s turn`
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 mb-4 justify-center flex-wrap gap-2">
            {myCards.map((card) => (
              <Card
                key={card.id}
                card={card}
                isClickable={isMyTurn && !hasPerformedAction}
                isSelected={selectedCard === card.id}
                onDoubleClick={handleCardDoubleClick}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePickDeck}
              disabled={!isMyTurn || hasPerformedAction}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Pick Deck
            </button>
            
            <button
              onClick={handlePickDiscard}
              disabled={!isMyTurn || hasPerformedAction || !topDiscardCard}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Pick Discard
            </button>

            <button
              onClick={handleShowCards}
              disabled={!isMyTurn || hasPerformedAction || (gameState.isFirstRound && !currentPlayer.canShow)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>Show</span>
            </button>

            <button
              onClick={handlePassTurn}
              disabled={!isMyTurn}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <SkipForward size={16} />
              <span>Pass</span>
            </button>
          </div>

          {selectedCard && (
            <div className="mt-2 text-center text-sm text-blue-600">
              Card selected. Double-click another card to drop it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}