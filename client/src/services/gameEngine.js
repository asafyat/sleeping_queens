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
      if (victimId) {
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
      }
    } else if (type === 'potion') {
       let victimId = null, qIdx = -1;
       Object.entries(this.queensAwake).forEach(([pid, qs]) => {
         if (pid !== playerId) {
           const idx = qs.findIndex(q => q.id === targetCardId);
           if (idx !== -1) { victimId = pid; qIdx = idx; }
         }
       });
       if (victimId) {
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
    } else {
        // Fallback for simple discard
        msgObj = { key: 'discard', params: { player: player.name, card: type } };
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
export const mockServer = new MockGameEngine();