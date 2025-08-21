import { Card } from '../types/game';

const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  suits.forEach(suit => {
    values.forEach(value => {
      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
        numericValue: getCardValue(value)
      });
    });
  });

  // Add 2 jokers
  deck.push({
    id: 'joker-1',
    suit: 'hearts',
    value: 'JOKER',
    numericValue: 0
  });
  
  deck.push({
    id: 'joker-2',
    suit: 'spades', 
    value: 'JOKER',
    numericValue: 0
  });

  return shuffleDeck(deck);
}

export function getCardValue(value: string): number {
  if (value === 'A') return 1;
  if (['J', 'Q', 'K'].includes(value)) return 10;
  if (value === 'JOKER') return 0;
  return parseInt(value);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateHandValue(cards: Card[], jokerValue: string): number {
  return cards.reduce((total, card) => {
    if (card.value === 'JOKER' || card.value === jokerValue) {
      return total; // Jokers count as 0
    }
    return total + card.numericValue;
  }, 0);
}

export function getSuitColor(suit: string): string {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';
}

export function getSuitSymbol(suit: string): string {
  const symbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[suit as keyof typeof symbols] || '';
}