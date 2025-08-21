import React from 'react';
import { Card as CardType } from '../types/game';
import { getSuitColor, getSuitSymbol } from '../utils/cards';

interface CardProps {
  card: CardType;
  isClickable?: boolean;
  isSelected?: boolean;
  onDoubleClick?: (card: CardType) => void;
  className?: string;
  faceDown?: boolean;
}

export default function Card({ 
  card, 
  isClickable = false, 
  isSelected = false, 
  onDoubleClick,
  className = '',
  faceDown = false
}: CardProps) {
  const handleDoubleClick = () => {
    if (isClickable && onDoubleClick) {
      onDoubleClick(card);
    }
  };

  if (faceDown) {
    return (
      <div 
        className={`w-16 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-900 flex items-center justify-center cursor-pointer transform transition-all duration-200 hover:scale-105 shadow-lg ${className}`}
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-8 h-8 bg-blue-300 rounded-full opacity-30"></div>
      </div>
    );
  }

  const isJoker = card.value === 'JOKER';
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);

  return (
    <div 
      className={`
        w-16 h-24 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-between p-2 
        transform transition-all duration-200 shadow-lg
        ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''}
        ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
        ${card.isJoker ? 'bg-yellow-50 border-yellow-400' : ''}
        ${className}
      `}
      onDoubleClick={handleDoubleClick}
    >
      <div className={`text-xs font-bold ${isJoker ? 'text-yellow-600' : suitColor}`}>
        {card.value}
      </div>
      <div className={`text-2xl ${isJoker ? 'text-yellow-600' : suitColor}`}>
        {isJoker ? '🃏' : suitSymbol}
      </div>
      <div className={`text-xs font-bold rotate-180 ${isJoker ? 'text-yellow-600' : suitColor}`}>
        {card.value}
      </div>
    </div>
  );
}