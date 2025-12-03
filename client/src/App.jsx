import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Sword, 
  Shield, 
  FlaskConical, 
  Wand2, 
  Sparkles, 
  ScrollText, 
  BookOpen, 
  Loader2,
  Music,    
  Eye,
  Key,
  Save
} from 'lucide-react';

// ==========================================
// 0. CONFIGURATION
// ==========================================
// Empty string means "use the same host/port I am currently on".
// This lets Nginx proxy the requests to /rooms correctly.
// If running locally without Nginx, use 'http://127.0.0.1:5000'
const API_URL = ''; 
const USE_MOCK_API = false;

// ==========================================
// 1. LOCALIZATION DICTIONARY
// ==========================================
const TEXTS = {
  he: {
    appTitle: "מלכות ישנות",
    kidTitle: "הממלכה הקסומה",
    lobbySubtitle: "משחק קלפים אסטרטגי",
    kidSubtitle: "בואו להעיר את המלכות!",
    enterName: "הכנס שם",
    kidName: "איך קוראים לך?",
    createGame: "צור משחק חדש",
    kidCreate: "התחל משחק חדש! 🚀",
    joinGame: "הצטרף לחדר 🚀",
    kidJoin: "הצטרף לחדר 🚪",
    roomId: "מספר החדר",
    pasteRoom: "הדבק מספר חדר...",
    orJoin: "או הצטרף לחדר קיים",
    room: "חדר",
    yourTurn: "🟢 תורך!",
    waiting: "🔴 מחכים...",
    notStarted: "ממתין להתחלה...",
    startGame: "התחל משחק",
    lastAction: "מה קרה:",
    cards: "קלפים",
    score: "נקודות",
    noQueens: "אין מלכות",
    sleepingQueens: "מלכות ישנות",
    discardPile: "ערימת זריקה",
    empty: "ריק",
    myQueens: "המלכות שלי:",
    myHand: "היד שלי:",
    noQueensYet: "אין לך מלכות עדיין",
    selectQueen: "(בחר מלכה!)",
    roseBonus: "🌹 בונוס ורד! בחר עוד אחת! 🌹",
    advisorBtn: "היועץ המלכותי",
    kidAdvisor: "שאל את הפיה",
    playJester: "הפעל ליצן 🃏",
    playNumbers: "זרוק מספרים",
    gameOver: "המשחק נגמר!",
    winner: "המנצח הוא",
    playAgain: "שחק שוב",
    loading: "טוען...",
    toggleLang: "Switch to English 🇺🇸",
    kidMode: "מצב ילדים 🎈",
    normalMode: "מצב רגיל 👔",
    aiThinking: "מתייעץ עם הכוכבים...",
    enterKey: "מפתח API (עבור ה-AI)",
    saveKey: "שמור מפתח",
    apiKeyMissing: "חסר מפתח API. נא להזין אותו בהגדרות.",
    cardLabels: {
      king: "מלך", knight: "אביר", potion: "שיקוי", dragon: "דרקון", wand: "שרביט", jester: "ליצן", number: "מספר"
    },
    queenNames: {
      Rose: "וורדים", Dog: "כלבים", Cat: "חתולים", Sunflower: "חמניות", Rainbow: "קשת", 
      Moon: "ירח", Star: "כוכבים", Heart: "לבבות", Pancake: "פנקייק", IceCream: "גלידה", Fire: "אש", Book: "ספרים"
    }
  },
  en: {
    appTitle: "Sleeping Queens",
    kidTitle: "Magic Kingdom",
    lobbySubtitle: "Strategic Card Game",
    kidSubtitle: "Let's wake the queens!",
    enterName: "Enter Name",
    kidName: "What's your name?",
    createGame: "Create New Game",
    kidCreate: "Start New Game! 🚀",
    joinGame: "Join Room 🚀",
    kidJoin: "Enter Room 🚪",
    roomId: "Room ID",
    pasteRoom: "Paste Room ID...",
    orJoin: "OR Join Existing",
    room: "Room",
    yourTurn: "🟢 Your Turn!",
    waiting: "🔴 Waiting...",
    notStarted: "Not Started...",
    startGame: "Start Game",
    lastAction: "Last Action:",
    cards: "Cards",
    score: "Score",
    noQueens: "No Queens",
    sleepingQueens: "Sleeping Queens",
    discardPile: "Discard Pile",
    empty: "Empty",
    myQueens: "My Queens:",
    myHand: "My Hand:",
    noQueensYet: "You have no queens yet",
    selectQueen: "(Select a Queen!)",
    roseBonus: "🌹 ROSE BONUS! Pick another! 🌹",
    advisorBtn: "Royal Advisor",
    kidAdvisor: "Ask Fairy",
    playJester: "Play Jester 🃏",
    playNumbers: "Discard Numbers",
    gameOver: "GAME OVER!",
    winner: "Winner is",
    playAgain: "Play Again",
    loading: "Loading...",
    toggleLang: "עבור לעברית 🇮🇱",
    kidMode: "Kid Mode 🎈",
    normalMode: "Normal Mode 👔",
    aiThinking: "Consulting the stars...",
    enterKey: "Gemini API Key (for AI)",
    saveKey: "Save Key",
    apiKeyMissing: "API Key missing. Please enter it in settings.",
    cardLabels: {
      king: "King", knight: "Knight", potion: "Potion", dragon: "Dragon", wand: "Wand", jester: "Jester", number: "Number"
    },
    queenNames: {
      Rose: "Rose", Dog: "Dog", Cat: "Cat", Sunflower: "Sunflower", Rainbow: "Rainbow", 
      Moon: "Moon", Star: "Star", Heart: "Heart", Pancake: "Pancake", IceCream: "Ice Cream", Fire: "Fire", Book: "Book"
    }
  }
};

// ==========================================
// 2. GEMINI API INTEGRATION
// ==========================================
const callGemini = async (prompt, apiKey) => {
  if (!apiKey) return "API Key missing. Please check settings.";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "The stars are silent...";
    text = text.replace(/[\*\#\`]/g, '');
    return text;
  } catch (e) {
    console.error("Gemini API Error:", e);
    return "Connection error.";
  }
};

// ==========================================
// 3. MOCK SERVER (Fallback)
// ==========================================
class MockGameEngine {
  constructor() {
    this.reset();
  }

  reset(apiKey = null) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.players = {};
    this.deck = this.createDeck();
    this.discardPile = [];
    this.queensSleeping = this.createQueens();
    this.queensAwake = {}; 
    this.turnPlayerId = null;
    this.started = false;
    this.lastMessage = { key: 'created', params: {} };
    this.winnerId = null;
    this.pendingRoseWake = false;
    this.apiKey = apiKey; 
  }

  createQueens() {
    const names = ["Rose", "Dog", "Cat", "Sunflower", "Rainbow", "Moon", "Star", "Heart", "Pancake", "Ice Cream", "Fire", "Book"];
    const values = [5, 15, 15, 10, 10, 10, 10, 15, 15, 20, 20, 10];
    return names.map((name, i) => ({ id: `q-${i}`, type: 'queen', name: name, value: values[i] })).sort(() => Math.random() - 0.5);
  }

  createDeck() {
    let cards = [];
    const add = (t, c) => { for(let i=0; i<c; i++) cards.push({ id: `${t}-${Math.random().toString(36).substr(2,5)}`, type: t, value: 0 }) };
    add('king', 8); add('knight', 4); add('potion', 4); add('dragon', 3); add('wand', 3); add('jester', 4);
    for(let v=1; v<=10; v++) { for(let i=0; i<4; i++) cards.push({ id: `n-${v}-${i}`, type: 'number', value: v }); }
    return cards.sort(() => Math.random() - 0.5);
  }

  addPlayer(name) {
    const id = Math.random().toString(36).substr(2, 9);
    this.players[id] = { id, name, hand: [], score: 0 };
    this.queensAwake[id] = [];
    return { playerId: id };
  }

  drawCard(playerId, count = 1) {
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        if (this.discardPile.length === 0) break;
        this.deck = this.discardPile;
        this.discardPile = [];
        this.deck.sort(() => Math.random() - 0.5);
      }
      if (this.deck.length > 0) {
        this.players[playerId].hand.push(this.deck.pop());
      }
    }
  }

  startGame() {
    if (Object.keys(this.players).length < 2) throw new Error("Need at least 2 players");
    this.deck = this.deck.filter(c => c.type !== 'queen');
    Object.keys(this.players).forEach(pid => this.drawCard(pid, 5));
    this.turnPlayerId = Object.keys(this.players)[0];
    this.started = true;
    this.lastMessage = { key: 'started', params: { player: this.players[this.turnPlayerId].name } };
    return this.getState();
  }

  nextTurn() {
    const pids = Object.keys(this.players);
    const idx = pids.indexOf(this.turnPlayerId);
    this.turnPlayerId = pids[(idx + 1) % pids.length];
  }

  cpuAutoPlay(lang = 'en') {
    if (!this.started || this.winnerId) return;
    const cpuId = this.turnPlayerId;
    const cpu = this.players[cpuId];
    if (!cpu || (!cpu.name.toUpperCase().includes("CPU") && !cpu.name.includes("מחשב"))) return; 

    const king = cpu.hand.find(c => c.type === 'king');
    if (king && this.queensSleeping.length > 0) { this.playCard(cpuId, [king.id], this.queensSleeping[0].id, lang); return; }
    
    const knight = cpu.hand.find(c => c.type === 'knight');
    const oppId = Object.keys(this.queensAwake).find(pid => pid !== cpuId && this.queensAwake[pid].length > 0);
    if (knight && oppId) { this.playCard(cpuId, [knight.id], this.queensAwake[oppId][0].id, lang); return; }

    const discard = cpu.hand[0];
    if (discard) this.finishTurn(cpuId, [discard], { key: 'discard', params: { player: cpu.name, card: discard.type } }, false);
  }

  playCard(playerId, cardIds, targetCardId, lang = 'en') {
    const player = this.players[playerId];
    
    if (this.pendingRoseWake) {
      const qIdx = this.queensSleeping.findIndex(q => q.id === targetCardId);
      if (qIdx === -1) throw new Error("Select a sleeping queen for bonus!");
      const queen = this.queensSleeping.splice(qIdx, 1)[0];
      this.queensAwake[playerId].push(queen);
      this.pendingRoseWake = false;
      this.finishTurn(playerId, [], { key: 'roseWake', params: { player: player.name, queen: queen.name } });
      return this.getState();
    }

    const cards = player.hand.filter(c => cardIds.includes(c.id));
    if (cards.length === 0) throw new Error("Cards not in hand");

    const type = cards[0].type;
    let msgObj = {};
    let extraTurn = false;

    if (type === 'number') {
      msgObj = { key: 'discardNums', params: { player: player.name, values: cards.map(c=>c.value).join(', ') } };
    } else if (type === 'king') {
      const qIdx = this.queensSleeping.findIndex(q => q.id === targetCardId);
      if (qIdx === -1) throw new Error("Select a sleeping queen!");
      const queen = this.queensSleeping.splice(qIdx, 1)[0];
      this.queensAwake[playerId].push(queen);
      msgObj = { key: 'woke', params: { player: player.name, queen: queen.name } };
      if (queen.name === "Rose") this.pendingRoseWake = true;
    } else if (type === 'knight') {
      let victimId = null, qIdx = -1;
      Object.entries(this.queensAwake).forEach(([pid, qs]) => {
        if (pid !== playerId) {
          const idx = qs.findIndex(q => q.id === targetCardId);
          if (idx !== -1) { victimId = pid; qIdx = idx; }
        }
      });
      if (!victimId) throw new Error("Target queen not found");
      const victim = this.players[victimId];
      const dragonIdx = victim.hand.findIndex(c => c.type === 'dragon');
      if (dragonIdx !== -1) {
        const dragon = victim.hand.splice(dragonIdx, 1)[0];
        this.discardPile.push(dragon);
        this.drawCard(victimId, 1);
        msgObj = { key: 'blockSteal', params: { attacker: player.name, defender: victim.name } };
      } else {
        const queen = this.queensAwake[victimId].splice(qIdx, 1)[0];
        this.queensAwake[playerId].push(queen);
        msgObj = { key: 'stole', params: { player: player.name, queen: queen.name } };
      }
    } else if (type === 'potion') {
       let victimId = null, qIdx = -1;
       Object.entries(this.queensAwake).forEach(([pid, qs]) => {
         if (pid !== playerId) {
           const idx = qs.findIndex(q => q.id === targetCardId);
           if (idx !== -1) { victimId = pid; qIdx = idx; }
         }
       });
       if (!victimId) throw new Error("Target queen not found");
       const victim = this.players[victimId];
       const wandIdx = victim.hand.findIndex(c => c.type === 'wand');
       if (wandIdx !== -1) {
         const wand = victim.hand.splice(wandIdx, 1)[0];
         this.discardPile.push(wand);
         this.drawCard(victimId, 1);
         msgObj = { key: 'blockSleep', params: { attacker: player.name, defender: victim.name } };
       } else {
         const queen = this.queensAwake[victimId].splice(qIdx, 1)[0];
         this.queensSleeping.push(queen);
         msgObj = { key: 'slept', params: { player: player.name, queen: queen.name } };
       }
    } else if (type === 'jester') {
      if(this.deck.length === 0 && this.discardPile.length > 0) {
         this.deck = this.discardPile; this.discardPile = []; this.deck.sort(() => Math.random()-0.5);
      }
      if(this.deck.length === 0) {
        msgObj = { key: 'jesterEmpty', params: {} };
      } else {
        const revealed = this.deck.pop();
        if (revealed.type !== 'number') {
          player.hand.push(revealed);
          extraTurn = true;
          msgObj = { key: 'jesterMagic', params: { player: player.name, card: revealed.type } };
        } else {
          this.discardPile.push(revealed);
          const pids = Object.keys(this.players);
          const currIdx = pids.indexOf(playerId);
          const targetIdx = (currIdx + revealed.value - 1) % pids.length;
          const targetPid = pids[targetIdx];
          const targetName = this.players[targetPid].name;
          if (this.queensSleeping.length > 0) {
            const queen = this.queensSleeping.shift();
            this.queensAwake[targetPid].push(queen);
            msgObj = { key: 'jesterWoke', params: { player: player.name, value: revealed.value, target: targetName, queen: queen.name } };
          } else {
            msgObj = { key: 'jesterNothing', params: { player: player.name, value: revealed.value, target: targetName } };
          }
        }
      }
    }
    this.finishTurn(playerId, cards, msgObj, extraTurn);
    return this.getState();
  }

  finishTurn(playerId, cardsPlayed, msgObj, extraTurn) {
    const player = this.players[playerId];
    cardsPlayed.forEach(c => {
      const idx = player.hand.findIndex(h => h.id === c.id);
      if(idx!==-1) player.hand.splice(idx,1);
      this.discardPile.push(c);
    });
    this.drawCard(playerId, 5 - player.hand.length);
    const score = this.queensAwake[playerId].reduce((a,b)=>a+b.value,0);
    const count = this.queensAwake[playerId].length;
    player.score = score;
    if (score >= 50 || count >= 5) {
      this.winnerId = playerId;
      this.lastMessage = { key: 'win', params: { player: player.name } };
    } else {
      this.lastMessage = msgObj;
      if (!this.pendingRoseWake && !extraTurn) this.nextTurn();
    }
  }

  getState() {
    return {
      id: this.id,
      started: this.started,
      lastMessage: this.lastMessage,
      turnPlayerId: this.turnPlayerId,
      winnerId: this.winnerId,
      pendingRoseWake: this.pendingRoseWake,
      discardPile: this.discardPile.slice(-1), 
      queensSleeping: this.queensSleeping,
      players: Object.values(this.players).map(p => ({ ...p, queensAwake: this.queensAwake[p.id] || [] })),
      deckSize: this.deck.length,
      apiKey: this.apiKey // Return API Key to clients
    };
  }
}
const mockServer = new MockGameEngine();

// ==========================================
// 4. HELPERS
// ==========================================
const translateMessage = (msgObj, lang) => {
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

const getCardVisual = (card, lang) => {
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

const styles = `
* { box-sizing: border-box; }
body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow-x: hidden; }
#root { width: 100%; min-height: 100vh; margin: 0; padding: 0; text-align: center; }
.app-background { min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
.theme-default { background: linear-gradient(135deg, #2c3e50 0%, #4a148c 100%); direction: ltr; }
.theme-default.rtl { direction: rtl; }
.theme-kid { background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%); color: #000; font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif; }
.theme-kid.rtl { direction: rtl; }
.lobby-card { background: rgba(255, 255, 255, 0.95); padding: 40px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); width: 90%; max-width: 450px; text-align: center; border: 3px solid #FFD700; position: relative; overflow: hidden; margin: 0 auto; }
.theme-kid .lobby-card { border: 5px solid #FF69B4; border-radius: 30px; }
.lobby-title { color: #4a148c; font-size: 2.5rem; margin: 0 0 10px 0; }
.lobby-subtitle { color: #666; margin-bottom: 30px; font-size: 1.1rem; }
.input-group { margin-bottom: 15px; text-align: left; }
.rtl .input-group { text-align: right; }
.styled-input { width: 100%; padding: 14px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 16px; transition: all 0.3s; background: #f9f9f9; }
.styled-input:focus { border-color: #4a148c; outline: none; }
.action-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: bold; transition: transform 0.1s; margin-bottom: 10px; }
.action-btn:active { transform: scale(0.98); }
.btn-create { background: linear-gradient(45deg, #FFD700, #FFA000); color: #3e2723; }
.btn-join { background: linear-gradient(45deg, #9C27B0, #673AB7); color: white; }
.btn-advisor { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4); }
.btn-bard { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #880e4f; padding: 4px 10px; border-radius: 6px; font-size: 12px; border: 1px solid #ffc1e3; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.btn-spy { background: #333; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid #666; cursor: pointer; position: absolute; top: -5px; right: -5px; z-index: 20; }
.divider { display: flex; align-items: center; text-align: center; color: #888; margin: 20px 0; font-size: 0.9rem; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #ddd; }
.divider::before { margin-right: 10px; }
.divider::after { margin-left: 10px; }
.game-board { background: rgba(255, 255, 255, 0.95); border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); padding: 20px; width: 100%; max-width: 1200px; text-align: center; border: 2px solid #FFD700; margin: 20px auto; }
.top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
.start-btn { background-color: #4CAF50; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; }
.opponents { display: flex; justify-content: center; gap: 15px; background: #f5f5f5; padding: 15px; border-radius: 12px; flex-wrap: wrap; margin-bottom: 25px; }
.opponent-card { border: 1px solid #ddd; padding: 10px 15px; background: white; min-width: 120px; border-radius: 8px; position: relative; }
.table-center { display: flex; justify-content: space-around; align-items: flex-start; padding: 25px; background-color: #e8f5e9; border-radius: 15px; min-height: 180px; flex-wrap: wrap; gap: 30px; margin-bottom: 25px; }
.my-area { border: 2px solid #e0e0e0; padding: 25px; border-radius: 15px; background: #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
.active-turn { border-color: #2196F3; box-shadow: 0 0 20px rgba(33, 150, 243, 0.3); background-color: #fafdff; }
.theme-kid .my-area { border-top: 10px solid #76ff03; border-radius: 30px 30px 0 0; }
.card-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 15px; }
.playing-card { width: 85px; height: 120px; border: 1px solid #bbb; border-radius: 10px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; background: white; cursor: pointer; transition: all 0.2s; padding: 5px; box-shadow: 2px 4px 8px rgba(0,0,0,0.15); position: relative; user-select: none; }
.playing-card:hover:not(:disabled) { transform: translateY(-8px); z-index: 10; }
.card-label { font-size: 11px; font-weight: bold; text-transform: uppercase; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; margin-top: 2px; }
.card-emoji { font-size: 42px; line-height: 1; }
.card-bottom-value { font-size: 18px; font-weight: bold; align-self: flex-end; margin-right: 4px; margin-bottom: 2px; }
.card-back { width: 65px; height: 90px; background: linear-gradient(135deg, #673AB7, #512DA8); color: white; display: flex; justify-content: center; align-items: center; border-radius: 8px; border: 2px solid white; cursor: pointer; font-size: 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); } 
.queen { border-color: #B8860B; background-color: #fffde7; }
.selected-card { border: 3px solid #2196F3; background-color: #e3f2fd; transform: translateY(-12px) !important; }
.clickable-target { cursor: pointer; box-shadow: 0 0 15px #FFD700; animation: pulse 1.5s infinite; border-color: #FFD700; }
.message-bar { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: #e3f2fd; border-radius: 8px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: white; padding: 25px; border-radius: 16px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 2px solid #764ba2; position: relative; }
.advisor-text { font-style: italic; color: #4a148c; line-height: 1.6; margin: 15px 0; background: #f3e5f5; padding: 15px; border-radius: 8px; }
.rtl .advisor-text { direction: rtl; }
.close-btn { position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer; color: #666; }
.rtl .close-btn { right: auto; left: 10px; }
.toggle-kid-mode { position: absolute; top: 10px; left: 10px; background: white; border: 2px solid #333; border-radius: 20px; padding: 5px 10px; cursor: pointer; font-size: 0.9rem; z-index: 100; }
.rtl .toggle-kid-mode { left: auto; right: 10px; }
.toggle-lang { position: absolute; top: 10px; right: 10px; background: white; border: 2px solid #333; border-radius: 20px; padding: 5px 10px; cursor: pointer; font-size: 0.9rem; z-index: 100; }
.rtl .toggle-lang { right: auto; left: 10px; }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
.empty-slot { width: 85px; height: 120px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #999; border-radius: 10px; background: rgba(0,0,0,0.02); }
`;

// ==========================================
// 5. MAIN COMPONENT
// ==========================================
export default function App() {
  const [view, setView] = useState('lobby');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [isKidMode, setIsKidMode] = useState(false);
  const [language, setLanguage] = useState('he');
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState(''); 

  const t = TEXTS[language];
  const toggleLanguage = () => setLanguage(prev => prev === 'he' ? 'en' : 'he');

  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowKeyModal(false);
  };

  useEffect(() => {
    if (!apiKey) setShowKeyModal(true);
  }, []);

  // --- API CALLS (Hybrid Mock/Real) ---

  const fetchGameState = async () => {
    if (USE_MOCK_API) {
      const state = mockServer.getState();
      setGameState(state);
      if (state.apiKey && !apiKey) {
        saveApiKey(state.apiKey);
      }
      return;
    }
    if (!roomId) return;
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`);
      if (res.status === 404) {
        alert("Game not found (Server might have restarted). Returning to lobby.");
        setView('lobby');
        setRoomId('');
        setGameState(null);
        return;
      }
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setGameState(data);
      if (data.apiKey && !apiKey) {
        saveApiKey(data.apiKey);
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  };

  const createGame = async () => {
    if (USE_MOCK_API) {
      mockServer.reset(apiKey); // Pass API Key to Mock Server
      const p = mockServer.addPlayer(playerName || (language==='he' ? "שחקן" : "Player"));
      mockServer.addPlayer(language==='he' ? "מחשב" : "CPU"); 
      setRoomId(mockServer.id);
      setPlayerId(p.playerId);
      setGameState(mockServer.getState());
      setView('game');
    } else {
      try {
        const res = await fetch(`${API_URL}/rooms`, { 
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ apiKey }) // Send API Key to Backend
        });
        const data = await res.json();
        setRoomId(data.roomId);
        await joinGame(data.roomId); 
      } catch (err) {
        setError('Failed to create game: ' + err.message);
      }
    }
  };

  const joinGame = async (specificRoomId = null) => {
    const roomToJoin = specificRoomId || roomId;
    if (!roomToJoin || !playerName) {
      setError('Must provide Room ID and Name');
      return;
    }

    if (USE_MOCK_API) {
      setPlayerId('simulated-join-id');
      setView('game');
    } else {
      try {
        const res = await fetch(`${API_URL}/rooms/${roomToJoin}/join`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name: playerName }),
        });
        
        if (res.status === 404) {
             alert("Room not found! The server might have restarted or you hit a different worker process.");
             setRoomId(''); // Clear invalid ID
             return;
        }

        if (!res.ok) throw new Error('Room not found or full');
        const data = await res.json();
        setPlayerId(data.playerId);
        setRoomId(roomToJoin);
        setView('game');
        fetchGameState();
      } catch (err) {
        setError('Failed to join room: ' + err.message);
      }
    }
  };

  const startGame = async () => {
    if (USE_MOCK_API) {
      try { setGameState(mockServer.startGame()); } catch(e) { setError(e.message); }
    } else {
      try {
        const res = await fetch(`${API_URL}/rooms/${roomId}/start`, { method: 'POST' });
        const data = await res.json();
        if (data.error) setError(data.error);
        else setGameState(data);
      } catch (err) { setError('Failed to start game'); }
    }
  };

  const playMove = async (targetId = null) => {
    if (selectedCardIds.length === 0 && !gameState.pendingRoseWake) return;
    const effectiveCardIds = (gameState.pendingRoseWake && selectedCardIds.length === 0) 
        ? ['rose-bonus-action'] 
        : selectedCardIds;
    const cardsToSend = gameState.pendingRoseWake ? [] : effectiveCardIds;

    if (USE_MOCK_API) {
      try {
        setGameState(mockServer.playCard(playerId, cardsToSend, targetId, language));
        setSelectedCardIds([]);
        if (!gameState.winnerId) {
            setTimeout(() => {
               mockServer.cpuAutoPlay(language);
               setGameState(mockServer.getState());
            }, 1500);
        }
      } catch (err) { alert(err.message); }
    } else {
      try {
        const res = await fetch(`${API_URL}/rooms/${roomId}/play`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ playerId, cardIds: cardsToSend, targetCardId: targetId }),
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else {
          setGameState(data);
          setSelectedCardIds([]); 
        }
      } catch (err) { alert('Error playing move: ' + err.message); }
    }
  };

  // --- POLLING ---
  useEffect(() => {
    if (view === 'game' && !USE_MOCK_API) {
      fetchGameState();
      const interval = setInterval(fetchGameState, 2000);
      return () => clearInterval(interval);
    }
  }, [view, roomId]);

  // --- GEMINI HANDLERS ---
  const askAdvisor = async () => {
    if (!apiKey) { setShowKeyModal(true); return; }
    setAiType('advisor');
    setAiModalOpen(true);
    setAiLoading(true);
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    const myHand = player.hand.map(c=>`${c.type} ${c.value||''}`).join(', ');
    const queensSleeping = gameState.queensSleeping.length;
    const opponentStatus = gameState.players.filter(p=>p.id!==playerId).map(p=>`${p.name} has ${p.queensAwake.length} queens`).join(', ');
    
    // --- UPDATED & FIXED STRATEGY PROMPT ---
    const strategyTips = language === 'he' 
      ? `סדר עדיפויות אסטרטגי:
         1. אם יש מלך (King) או ליצן (Jester) - שחק אותם מיד.
         2. אם יש אביר (Knight) או שיקוי (Potion) - שחק רק אם יש ליריב מלכות לתקוף.
         3. שרביט (Wand) ודרקון (Dragon) - **אל תשחק!** שמור אותם להגנה.
         4. אם יש משוואה מתמטית (3 קלפים ומעלה) - זרוק אותם כדי לרענן את היד.
         5. אם יש זוג מספרים זהים - זרוק אותם.
         6. רק אם אין ברירה - זרוק מספר בודד (עדיף גבוה).`
      : `Strategy Priority:
         1. Play King or Jester immediately.
         2. Play Knight or Potion ONLY if opponent has queens.
         3. Wand & Dragon are DEFENSE - **Hold them!** Do not play them.
         4. Discard Math Equation (3+ cards) to cycle hand.
         5. Discard Pair (2 cards) to cycle hand.
         6. Discard Single Number (Last resort).`;

    let prompt = "";
    if (language === 'he') {
        prompt = `
          אתה היועץ המלכותי החכם במשחק מלכות ישנות.
          היד שלי: [${myHand}]
          מלכות ישנות שנותרו: ${queensSleeping}
          יריבים: ${opponentStatus}
          
          ${strategyTips}
          
          בהתבסס על סדר העדיפויות הזה, מה המהלך הטוב ביותר שלי? תן תשובה קצרה ומשעשעת בעברית.
        `;
    } else {
        prompt = `
          You are the Wise Royal Advisor in Sleeping Queens.
          My Hand: [${myHand}]
          Sleeping Queens left: ${queensSleeping}
          Opponents: ${opponentStatus}
          
          ${strategyTips}
          
          Based on this priority, what is my BEST move? Be concise and speak like a wise wizard.
        `;
    }
    const response = await callGemini(prompt, apiKey);
    setAiContent(response);
    setAiLoading(false);
  };

  const askLore = async (cardName) => {
    if (!apiKey) { setShowKeyModal(true); return; }
    setAiType('lore');
    setAiModalOpen(true);
    setAiLoading(true);
    const prompt = language === 'he' 
        ? `כתוב סיפור רקע אגדי, קצר (1-2 משפטים) ושובב בעברית עבור "${cardName}" בממלכת המלכות הישנות.`
        : `Write a legendary, short (1-2 sentences) and playful backstory in English for "${cardName}" in the Kingdom of Sleeping Queens.`;
    const response = await callGemini(prompt, apiKey);
    setAiContent(response);
    setAiLoading(false);
  };

  const askBard = async () => {
    if (!apiKey) { setShowKeyModal(true); return; }
    setAiType('bard');
    setAiModalOpen(true);
    setAiLoading(true);
    const msg = translateMessage(gameState.lastMessage, language);
    // --- UPDATED BARD PROMPT FOR KIDS ---
    const prompt = language === 'he'
        ? `כתוב שיר ילדים קצרצר (2-4 שורות), מצחיק, מתוק ועדין מאוד בעברית על מה שקרה במשחק: "${msg}".
           השתמש בחרוזים פשוטים ושפה קלילה שמתאימה לקטנטנים. בלי מילים מורכבות.`
        : `Write a very gentle, short, and funny nursery rhyme (2-4 lines) for young kids in English about: "${msg}".
           Make it sweet, simple, and rhyming like a children's book.`;
    const response = await callGemini(prompt, apiKey);
    setAiContent(response);
    setAiLoading(false);
  };

  const spyOnOpponent = async (opp) => {
    if (!apiKey) { setShowKeyModal(true); return; }
    setAiType('spy');
    setAiModalOpen(true);
    setAiLoading(true);
    // --- UPDATED SPY PROMPT FOR KIDS ---
    const prompt = language === 'he'
        ? `אתה שדון סקרן, חמוד וידידותי מאוד. הצצת בקלפים של החבר/ה "${opp.name}".
           יש לו/ה ${opp.score} נקודות ו-${opp.hand.length} קלפים ביד.
           במקום לתת "דו"ח ריגול", תן מחמאה מצחיקה או הערה חמודה לילדים על המצב שלהם.
           למשל: "וואו! איזה אוסף יפה!" או "נראה שהם מתכננים מסיבת הפתעה!". היה קצר ומתוק.`
        : `You are a cute, friendly, and curious little scout. You took a peek at "${opp.name}"'s cards.
           They have ${opp.score} points and ${opp.hand.length} cards.
           Instead of a "spy report", give a funny compliment or a sweet comment for kids.
           For example: "Wow! What a great collection!" or "Looks like they are planning a surprise party!". Be short and sweet.`;
    const response = await callGemini(prompt, apiKey);
    setAiContent(response);
    setAiLoading(false);
  };

  // --- INTERACTION HANDLERS ---
  const handleHandClick = (card) => {
    if (gameState?.turnPlayerId !== playerId) return;
    const player = gameState.players.find(p => p.id === playerId);
    const isNumber = card.type === 'number';
    const hasNumbers = selectedCardIds.some(id => player.hand.find(h=>h.id===id)?.type === 'number');

    if (selectedCardIds.length > 0) {
       if (isNumber !== hasNumbers) { alert("Cannot mix numbers and specials"); return; }
       if (!isNumber) {
           setSelectedCardIds(selectedCardIds.includes(card.id) ? [] : [card.id]);
           return;
       }
    }
    setSelectedCardIds(selectedCardIds.includes(card.id) ? selectedCardIds.filter(id=>id!==card.id) : [...selectedCardIds, card.id]);
  };

  const handleQueenClick = (queen) => {
    if (gameState?.turnPlayerId !== playerId) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (gameState.pendingRoseWake) { playMove(queen.id); return; }
    if (selectedCardIds.length === 1) {
        const card = player.hand.find(c => c.id === selectedCardIds[0]);
        if (card && card.type === 'king') playMove(queen.id);
    }
  };

  const handleOpponentQueenClick = (queen) => {
    if (gameState?.turnPlayerId !== playerId) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (selectedCardIds.length === 1) {
        const card = player.hand.find(c => c.id === selectedCardIds[0]);
        if (card && (card.type === 'knight' || card.type === 'potion')) playMove(queen.id);
    }
  };

  // --- DERIVED STATE FOR RENDER ---
  const myPlayer = gameState?.players?.find(p => p.id === playerId);
  const isMyTurn = gameState?.turnPlayerId === playerId;
  
  const selectedType = selectedCardIds.length > 0 && myPlayer?.hand 
    ? myPlayer.hand.find(c => c.id === selectedCardIds[0])?.type 
    : null;

  const targetSleeping = isMyTurn && (selectedType === 'king' || gameState?.pendingRoseWake);
  const targetAwake = isMyTurn && (selectedType === 'knight' || selectedType === 'potion');

  // --- RENDER ---
  return (
    <div className={`app-container ${isKidMode ? 'theme-kid' : 'theme-default'} ${language === 'he' ? 'rtl' : ''}`}>
      <style>{styles}</style>
      <button className="toggle-kid-mode" onClick={() => setIsKidMode(!isKidMode)}>{isKidMode ? t.normalMode : t.kidMode}</button>
      <button className="toggle-lang" onClick={toggleLanguage}>{t.toggleLang}</button>
      <button className="toggle-lang" style={{top: 50}} onClick={() => setShowKeyModal(true)}><Key size={14}/></button>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
             <button className="close-btn" onClick={() => setShowKeyModal(false)}>×</button>
             <h2>{t.enterKey}</h2>
             <input type="text" className="styled-input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." style={{marginBottom: 10}} />
             <button className="action-btn btn-create" onClick={() => saveApiKey(apiKey)}><Save size={16}/> {t.saveKey}</button>
          </div>
        </div>
      )}

      {view === 'lobby' ? (
        <div className="lobby-card">
          <h1 className="lobby-title">{isKidMode ? t.kidTitle : t.appTitle}</h1>
          <p className="lobby-subtitle">{isKidMode ? t.kidSubtitle : t.lobbySubtitle}</p>
          <div className="input-group"><input className="styled-input" placeholder={isKidMode ? t.kidName : t.enterName} value={playerName} onChange={e => setPlayerName(e.target.value)} /></div>
          
          {/* API Key Input for Creator */}
          <div className="input-group">
             <input 
               type="text" 
               className="styled-input" 
               value={apiKey} 
               onChange={e => { setApiKey(e.target.value); localStorage.setItem('gemini_api_key', e.target.value); }} 
               placeholder={t.enterKey} 
               style={{borderColor: '#FFD700'}}
             />
          </div>

          <button className="action-btn btn-create" onClick={createGame}>{isKidMode ? t.kidCreate : t.createGame}</button>
          <div className="divider">{t.orJoin}</div>
          <div className="input-group"><input className="styled-input" placeholder={t.pasteRoom} value={roomId} onChange={e => setRoomId(e.target.value)} /></div>
          <button className="action-btn btn-join" onClick={() => joinGame()}>{isKidMode ? t.kidJoin : t.joinGame}</button>
          {error && <p style={{color:'red'}}>{error}</p>}
        </div>
      ) : (gameState && gameState.winnerId) ? (
        <div className="lobby-card">
            <h1 style={{color: 'gold', fontSize: '3rem', margin: 0}}>🏆</h1>
            <h2 className="lobby-title">{t.gameOver}</h2>
            <h3>{t.winner}: {gameState.players.find(p => p.id === gameState.winnerId)?.name}</h3>
            <button className="action-btn btn-create" onClick={() => window.location.reload()}>{t.playAgain}</button>
        </div>
      ) : gameState ? (
        <div className="game-board">
          <div className="top-bar">
             <div>{t.room}: <strong>{gameState.id}</strong></div>
             <div>{gameState.started ? (isMyTurn ? t.yourTurn : t.waiting) : t.notStarted}</div>
             {!gameState.started && <button className="start-btn" onClick={startGame}>{t.startGame}</button>}
          </div>
          {gameState.lastMessage && (
            <div className="message-bar">
              <span><strong>{t.lastAction}</strong> {translateMessage(gameState.lastMessage, language)}</span>
              <button className="btn-bard" onClick={askBard}><Music size={12} /></button>
            </div>
          )}
          <div className="opponents">
            {gameState.players.filter(p => p.id !== playerId).map(p => (
              <div key={p.id} className="opponent-card">
                <h4>{p.name}</h4>
                <button className="btn-spy" onClick={() => spyOnOpponent(p)}><Eye size={12}/></button>
                <div style={{fontSize: '0.9rem', color: '#666'}}>{t.cards}: <strong>{p.hand.length}</strong> | {t.score}: <strong>{p.score}</strong></div>
                <div className="card-row" style={{transform: 'scale(0.85)', marginTop: '5px'}}> 
                  {p.queensAwake.map(q => {
                    const visual = getCardVisual(q, language);
                    return <div key={q.id} className={`playing-card queen ${targetAwake ? 'clickable-target' : ''}`} onClick={() => handleOpponentQueenClick(q)} style={{backgroundColor: visual.color}}>
                        <div className="card-label">{visual.label}</div><div className="card-emoji">{visual.emoji}</div><div className="card-bottom-value">{q.value}</div>
                    </div>;
                  })}
                  {p.queensAwake.length === 0 && <span style={{fontSize: '12px', color: '#999'}}>{t.noQueens}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="table-center">
            <div className="sleeping-queens">
              <h3>{t.sleepingQueens} ({gameState.queensSleeping.length}) {targetSleeping && <span style={{color: 'red'}}>{t.selectQueen}</span>}
                {gameState.pendingRoseWake && isMyTurn && <div style={{color: '#E91E63', animation: 'pulse 1s infinite'}}>{t.roseBonus}</div>}
              </h3>
              <div className="card-row">
                {gameState.queensSleeping.map((c) => (
                  <div key={c.id} className={`card-back ${targetSleeping ? 'clickable-target' : ''}`} onClick={() => handleQueenClick(c)}><span>👸</span></div>
                ))}
              </div>
            </div>
            <div className="discard-pile">
                <h3>{t.discardPile}</h3>
                {gameState.discardPile.length > 0 ? (() => {
                     const visual = getCardVisual(gameState.discardPile[gameState.discardPile.length - 1], language);
                     return <div className="playing-card" style={{backgroundColor: visual.color}}>
                        <div className="card-label">{visual.label}</div><div className="card-emoji">{visual.emoji}</div><div className="card-bottom-value">{visual.emoji === '?' ? '' : (gameState.discardPile[gameState.discardPile.length - 1].value || '')}</div>
                     </div>
                })() : <div className="empty-slot">{t.empty}</div>}
            </div>
          </div>
          <div className={`my-area ${isMyTurn ? 'active-turn' : ''}`}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                 <h3>{myPlayer?.name} - {t.score}: {myPlayer?.score}</h3>
                 {gameState.started && <button className="btn-advisor" onClick={askAdvisor} disabled={!isMyTurn}><ScrollText size={16} /> {isKidMode ? t.kidAdvisor : t.advisorBtn}</button>}
             </div>
             <div>
                <h4 style={{margin: '5px 0'}}>{t.myQueens}</h4>
                <div className="card-row">
                   {myPlayer?.queensAwake.length > 0 ? myPlayer.queensAwake.map(q => {
                       const visual = getCardVisual(q, language);
                       return <div key={q.id} className="playing-card queen" style={{backgroundColor: visual.color}} onClick={() => askLore(visual.label)}>
                           <div className="card-label">{visual.label}</div><div className="card-emoji">{visual.emoji}</div><div className="card-bottom-value">{q.value}</div>
                       </div>
                   }) : <span style={{color: '#999'}}>{t.noQueensYet}</span>}
                </div>
             </div>
             <div>
                <h4 style={{margin: '10px 0 5px 0'}}>{t.myHand}</h4>
                <div className="card-row">
                   {myPlayer?.hand.map(card => {
                       const visual = getCardVisual(card, language);
                       return <button key={card.id} className={`playing-card hand-card ${selectedCardIds.includes(card.id) ? 'selected-card' : ''}`} onClick={() => handleHandClick(card)} disabled={!isMyTurn} style={{backgroundColor: visual.color}}>
                           <div className="card-label">{visual.label}</div>
                           {visual.icon ? <visual.icon size={24} /> : <div style={{fontSize:28}}>{visual.emoji}</div>}
                           <div className="card-bottom-value">{card.value || ''}</div>
                       </button>
                   })}
                </div>
             </div>
             <div style={{marginTop: '20px', height: '50px'}}>
               {selectedCardIds.length > 0 && (selectedType === 'number' || selectedType === 'jester') && (
                 <button onClick={() => playMove(null)} className="start-btn" style={{backgroundColor: '#2196F3', width: '250px'}}>
                   {selectedType === 'jester' ? t.playJester : t.playNumbers}
                 </button>
               )}
             </div>
          </div>
        </div>
      ) : <div style={{textAlign:'center', marginTop:50}}>{t.loading}</div>}

      {/* AI Modal */}
      {aiModalOpen && (
          <div className="modal-overlay" onClick={() => setAiModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setAiModalOpen(false)}>×</button>
              <h2 style={{color: '#4a148c', display:'flex', alignItems:'center', justifyContent:'center', gap:10}}>
                  {aiType === 'advisor' && <><Sparkles size={24} /> {t.advisorBtn}</>}
                  {aiType === 'lore' && <><BookOpen size={24} /> Lore</>}
                  {aiType === 'bard' && <><Music size={24} /> Bard</>}
                  {aiType === 'spy' && <><Eye size={24} /> Spy</>}
              </h2>
              {aiLoading ? <div style={{padding:20}}><Loader2 className="animate-spin" size={32} style={{margin:'0 auto'}}/> {t.aiThinking}</div> : <div className="advisor-text">"{aiContent}"</div>}
            </div>
          </div>
      )}
    </div>
  );
}