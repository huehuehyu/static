export interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  numericValue: number;
  isJoker?: boolean;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  score: number;
  totalScore: number;
  isHost: boolean;
  isOnline: boolean;
  hasShown: boolean;
  canShow: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  jokerValue: string;
  isFirstRound: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  scoreLimit: number;
  roundNumber: number;
}

export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  gameState: GameState | null;
  maxPlayers: number;
  scoreLimit: number;
  createdAt: string;
}

export interface GameAction {
  type: 'PICK_DECK' | 'PICK_DISCARD' | 'DROP_CARD' | 'SHOW_CARDS' | 'PASS_TURN';
  cardId?: string;
  playerId: string;
}