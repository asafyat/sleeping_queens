import React from 'react';
import { getCardVisual } from '../utils/formatters';

export default function Card({ card, language, onClick, isSelected, disabled, isFaceUp = true }) {
  // 1. If Face Down (e.g. Sleeping Queens in the center)
  if (!isFaceUp) {
    return (
      <div className={`card-back ${!disabled ? 'clickable-target' : ''}`} onClick={onClick}>
        <span>👸</span>
      </div>
    );
  }

  // 2. Get Visuals (Emoji, Color, Label)
  const visual = getCardVisual(card, language);
  
  // 3. Render Card
  return (
    <button 
      className={`playing-card ${card.type === 'queen' ? 'queen' : ''} ${isSelected ? 'selected-card' : ''}`} 
      onClick={onClick} 
      disabled={disabled}
      style={{ backgroundColor: visual.color }}
    >
      <div className="card-label">{visual.label}</div>
      {visual.icon ? <visual.icon size={20} /> : <div className="card-emoji">{visual.emoji}</div>}
      <div className="card-bottom-value">{card.value || ''}</div>
    </button>
  );
}