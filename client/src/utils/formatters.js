import { Crown, Sword, Shield, FlaskConical, Wand2, Sparkles } from 'lucide-react';
import { TEXTS } from './translation';

export const translateMessage = (msgObj, lang) => {
  if (!msgObj) return "";
  if (typeof msgObj === 'string') return msgObj; // Handle backend strings
  if (!msgObj.key) return "";

  const p = msgObj.params || {};
  const t = TEXTS[lang].queenNames;
  const trQ = (name) => t[name] ? (lang === 'he' ? `מלכת ה${t[name]}` : `${t[name]} Queen`) : name;
  const trC = (type) => TEXTS[lang].cardLabels[type] || type;

  if (lang === 'he') {
    switch(msgObj.key) {
      case 'created': return "המשחק נוצר";
      case 'started': return `המשחק התחיל! תורו של ${p.player}.`;
      case 'discard': return `${p.player} זרק ${trC(p.card)}.`;
      case 'roseWake': return `בונוס ורד: ${p.player} העיר את ${trQ(p.queen)}!`;
      case 'discardNums': return `${p.player} זרק מספרים: ${p.values}`;
      case 'woke': return `${p.player} העיר את ${trQ(p.queen)}`;
      case 'blockSteal': return `${p.attacker} ניסה לגנוב, אך ${p.defender} השתמש בדרקון!`;
      case 'stole': return `${p.player} גנב את ${trQ(p.queen)}!`;
      case 'blockSleep': return `${p.attacker} ניסה להרדים, אך ${p.defender} השתמש בשרביט!`;
      case 'slept': return `${p.player} הרדים את ${trQ(p.queen)}!`;
      case 'jesterEmpty': return "הליצן שוחק אך החפיסה ריקה!";
      case 'jesterWoke': return `ספרנו עד ${p.target} שהעיר את ${trQ(p.queen)}!`;
      case 'jesterNothing': return `ספרנו עד ${p.target}, אך אין מלכות ישנות!`;
      case 'jesterMagic': return `קסם! ${p.player} קיבל ${trC(p.card)} ומשחק שוב.`;
      case 'win': return `ניצחון! ${p.player} ניצח את המשחק!`;
      default: return JSON.stringify(msgObj);
    }
  } else {
    // English
    switch(msgObj.key) {
      case 'created': return "Game created";
      case 'started': return `Game Started! ${p.player}'s turn.`;
      case 'discard': return `${p.player} discarded a ${trC(p.card)}.`;
      case 'roseWake': return `Rose Bonus: ${p.player} woke ${trQ(p.queen)}!`;
      case 'discardNums': return `${p.player} discarded numbers: ${p.values}`;
      case 'woke': return `${p.player} woke ${trQ(p.queen)}`;
      case 'blockSteal': return `${p.attacker} tried to steal, but ${p.defender} used a Dragon!`;
      case 'stole': return `${p.player} stole ${trQ(p.queen)}!`;
      case 'blockSleep': return `${p.attacker} tried to sleep, but ${p.defender} used a Wand!`;
      case 'slept': return `${p.player} put ${trQ(p.queen)} to sleep!`;
      case 'jesterEmpty': return "Jester played, but deck empty!";
      case 'jesterWoke': return `Counted to ${p.target} who woke ${trQ(p.queen)}!`;
      case 'jesterNothing': return `Counted to ${p.target}, but no queens sleeping!`;
      case 'jesterMagic': return `Magic! ${p.player} got a ${trC(p.card)} and plays again.`;
      case 'win': return `VICTORY! ${p.player} WINS!`;
      default: return JSON.stringify(msgObj);
    }
  }
};

export const getCardVisual = (card, lang) => {
  const labels = TEXTS[lang].cardLabels;
  const qNames = TEXTS[lang].queenNames;
  if (!card) return { emoji: '', color: '#fff', label: '' };
  
  switch (card.type) {
    case 'king': return { emoji: '🤴', color: '#FFF8E1', label: labels.king, icon: Crown };
    case 'knight': return { emoji: '⚔️', color: '#ECEFF1', label: labels.knight, icon: Sword };
    case 'potion': return { emoji: '🧪', color: '#E8F5E9', label: labels.potion, icon: FlaskConical };
    case 'dragon': return { emoji: '🐉', color: '#FFEBEE', label: labels.dragon, icon: Shield };
    case 'wand': return { emoji: '🪄', color: '#F3E5F5', label: labels.wand, icon: Wand2 };
    case 'jester': return { emoji: '🃏', color: '#FFF3E0', label: labels.jester, icon: Sparkles };
    case 'number': return { emoji: card.value, color: '#E3F2FD', label: labels.number, icon: null };
    case 'queen':
      let emoji = '👸';
      if (card.name === 'Rose') emoji = '🌹';
      else if (card.name === 'Dog') emoji = '🐶';
      else if (card.name === 'Cat') emoji = '🐱';
      else if (card.name === 'Sunflower') emoji = '🌻';
      else if (card.name === 'Moon') emoji = '🌙';
      else if (card.name === 'Heart') emoji = '❤️';
      else if (card.name === 'Star') emoji = '⭐';
      
      const localizedName = qNames[card.name] 
          ? (lang === 'he' ? `מלכת ה${qNames[card.name]}` : `${qNames[card.name]} Queen`)
          : card.name;
      return { emoji, color: '#FCE4EC', label: localizedName.replace(' Queen', '').replace('מלכת ה', ''), icon: Crown };
    default: return { emoji: '?', color: '#eee', label: card.type };
  }
};