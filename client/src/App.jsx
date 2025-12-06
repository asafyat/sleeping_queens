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
  Save,
  ChevronUp,
  ChevronDown,
  Menu, 
  X,
  LogOut,
  Trash2,
  RefreshCw,
  Users
} from 'lucide-react';

import './App.css';
// ==========================================
// 0. CONFIGURATION
// ==========================================
// Empty string means "use the same host/port I am currently on".
const API_URL = ''; 
const USE_MOCK_API = false;

// ==========================================
// 1. LOCALIZATION DICTIONARY
// ==========================================
import { TEXTS } from './utils/translation.js';


// ==========================================
// 2. GEMINI API INTEGRATION
// ==========================================
import { useGemini } from './services/gemini.js';

// ==========================================
// 3. MOCK SERVER (Fallback)
// ==========================================
import { mockServer } from './services/gameEngine.js';

// ==========================================
// 4. HELPERS
// ==========================================

import { translateMessage, getCardVisual } from './utils/formatters.js';

import { api } from './services/api';

// ==========================================
// 5. MAIN COMPONENT
// ==========================================
export default function App() {
  const [view, setView] = useState('lobby');
  // LOAD FROM STORAGE
  const [playerName, setPlayerName] = useState(localStorage.getItem('sq_player_name') || '');
  const [playerId, setPlayerId] = useState(localStorage.getItem('sq_player_id') || null);
  const [roomId, setRoomId] = useState(localStorage.getItem('sq_room_id') || '');
  
  const [gameState, setGameState] = useState(null);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [isKidMode, setIsKidMode] = useState(false);
  const [language, setLanguage] = useState('he');
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isHandOpen, setIsHandOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // New State for Rooms List
  const [roomsList, setRoomsList] = useState([]);

  // --- GEMINI HANDLERS ---
  const { 
    aiModalOpen, setAiModalOpen, 
    aiContent, aiLoading, aiType, 
    askAdvisor, askLore, askBard, spyOnOpponent 
  } = useGemini(gameState, playerId, language, apiKey, setShowKeyModal);

  const t = TEXTS[language];
  const toggleLanguage = () => setLanguage(prev => prev === 'he' ? 'en' : 'he');

  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowKeyModal(false);
  };

  const saveSession = (rId, pId, pName) => {
    localStorage.setItem('sq_room_id', rId);
    localStorage.setItem('sq_player_id', pId);
    localStorage.setItem('sq_player_name', pName);
  };

  const clearSession = () => {
    localStorage.removeItem('sq_room_id');
    localStorage.removeItem('sq_player_id');
    // We keep player name for convenience
    setRoomId('');
    setPlayerId(null);
  };

  const handleLogout = () => {
    if (confirm(t.logout + "?")) {
      clearSession();
      setGameState(null);
      setView('lobby');
    }
  };

const handleTerminate = async () => {
    if (confirm(t.terminate + "?")) {
      await api.terminateGame(roomId);
      clearSession();
      setGameState(null);
      setView('lobby');
    }
  };

  const fetchRooms = async () => {
    const rooms = await api.getRooms();
    setRoomsList(rooms);
  };

  useEffect(() => {
    if (view === 'lobby') fetchRooms();
  }, [view]);

// --- RECONNECTION LOGIC ---
  useEffect(() => {
    const checkActiveSession = async () => {
      // Only check if we are in lobby and have saved data
      if (view === 'lobby' && roomId && playerId) {
        try {
           // 1. Ask API for current state
           const data = await api.getGameState(roomId, playerId);
           
           // 2. Check if Game exists AND Player is actually in it
           if (data && data.players && data.players.find(p => p.id === playerId)) {
               setGameState(data);
               setView('game');
           } else {
               // Game doesn't exist OR Player ID is invalid (e.g., server restart or mock reset)
               clearSession(); 
           }
        } catch (e) {
           console.error("Reconnect failed:", e);
           // On network error, we do nothing. The user stays in Lobby with their ID filled in.
        }
      }
    };
    checkActiveSession();
  }, []); // Run once on mount

  // --- API CALLS ---

 const fetchGameState = async () => {
    if (!roomId && !USE_MOCK_API) return; // Note: You might need to import USE_MOCK_API or just rely on roomId check
    try {
      const data = await api.getGameState(roomId, playerId);
      if (data === null) {
        alert("Game session lost.");
        clearSession();
        setView('lobby');
        setGameState(null);
      } else {
        setGameState(data);
        if (data.apiKey && !apiKey) saveApiKey(data.apiKey);
      }
    } catch (err) { console.error('Error fetching state:', err); }
  };

const createGame = async () => {
    try {
      const data = await api.createRoom(apiKey, playerName, language);
      if (data.isMock) {
        setRoomId(data.roomId);
        setPlayerId(data.playerId);
        setGameState(mockServer.getState());
        setView('game');
      } else {
        setRoomId(data.roomId);
        await joinGame(data.roomId);
      }
    } catch (err) { setError('Failed to create: ' + err.message); }
  };

const joinGame = async (specificRoomId = null) => {
    const roomToJoin = specificRoomId || roomId;
    if (!roomToJoin || !playerName) { setError('Missing info'); return; }
    
    try {
      const data = await api.joinRoom(roomToJoin, playerName);
      setPlayerId(data.playerId);
      setRoomId(roomToJoin);
      saveSession(roomToJoin, data.playerId, playerName);
      setView('game');
      fetchGameState();
    } catch (err) {
      if (err.message === "404") { alert("Room not found!"); setRoomId(''); }
      else setError('Join failed: ' + err.message);
    }
  };

  // ... rest of the component (startGame, playMove, AI handlers, render) ...
const startGame = async () => {
    try {
      // 1. The API service handles the logic (Mock or Real)
      const data = await api.startGame(roomId);
      
      // 2. We just update the state with the result
      setGameState(data);
    } catch (err) {
      // 3. Centralized error handling
      setError(err.message || 'Failed to start game');
    }
  };

const playMove = async (targetId = null) => {
    if (selectedCardIds.length === 0 && !gameState.pendingRoseWake) return;
    const effectiveCardIds = (gameState.pendingRoseWake && selectedCardIds.length === 0) ? ['rose-bonus-action'] : selectedCardIds;
    const cardsToSend = gameState.pendingRoseWake ? [] : effectiveCardIds;

    // Mobile UI: Close hand immediately
    if (window.innerWidth <= 768) setIsHandOpen(false);

    try {
      const { state, isMock } = await api.playCard(roomId, playerId, cardsToSend, targetId, language);
      setGameState(state);
      setSelectedCardIds([]);

      // Handle Mock CPU Turn
      if (isMock && !state.winnerId) {
        setTimeout(() => {
           const cpuState = api.runCpuTurn(language);
           setGameState(cpuState);
        }, 1500);
      }
    } catch (err) {
      alert('Error: ' + err.message);
      setIsHandOpen(true); // Re-open hand if move failed
    }
  };

  useEffect(() => {
    if (view === 'game' && !USE_MOCK_API) {
      fetchGameState();
      const interval = setInterval(fetchGameState, 2000);
      return () => clearInterval(interval);
    }
  }, [view, roomId]);



  useEffect(() => {
    if (!gameState || !playerId) return;

    // Is it my turn now?
    const isMyTurn = gameState.turnPlayerId === playerId;

    if (isMyTurn) {
      // It's my turn! Show me the cards automatically
      setIsHandOpen(true);
    } else {
      // Not my turn. Minimize hand so I can see the board/opponents
      setIsHandOpen(false);
    }
  }, [gameState?.turnPlayerId]); // Only run when the turn changes

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

  const myPlayer = gameState?.players?.find(p => p.id === playerId);
  const isMyTurn = gameState?.turnPlayerId === playerId;
  
  const selectedType = selectedCardIds.length > 0 && myPlayer?.hand 
    ? myPlayer.hand.find(c => c.id === selectedCardIds[0])?.type 
    : null;

  const targetSleeping = isMyTurn && (selectedType === 'king' || gameState?.pendingRoseWake);
  const targetAwake = isMyTurn && (selectedType === 'knight' || selectedType === 'potion');

  // Helper to get turn player name
  const turnPlayerName = gameState?.players?.find(p => p.id === gameState.turnPlayerId)?.name;

if (view === 'lobby') {
    return (
        <div className={`app-container ${isKidMode ? 'theme-kid' : 'theme-default'} ${language === 'he' ? 'rtl' : ''}`}>            
            <div className="lobby-card">
                {/* --- TOGGLE BUTTONS (ADDED) --- */}
                <button className="toggle-lang" onClick={toggleLanguage}>
                    {t.toggleLang}
                </button>
                
                <button className="toggle-kid-mode" onClick={() => setIsKidMode(!isKidMode)}>
                    {isKidMode ? t.normalMode : t.kidMode}
                </button>
                {/* ----------------------------- */}

                <h1 className="lobby-title">{isKidMode ? t.kidTitle : t.appTitle}</h1>
                <div className="lobby-subtitle">{isKidMode ? t.kidSubtitle : t.lobbySubtitle}</div>

                <div className="input-group">
                    <input className="styled-input" placeholder={isKidMode ? t.kidName : t.enterName} value={playerName} onChange={e => setPlayerName(e.target.value)} />
                </div>
                
                <button className="action-btn btn-create" onClick={createGame}>{isKidMode ? t.kidCreate : t.createGame}</button>
                
                <div className="divider">{t.orJoin}</div>
                
                <div className="input-group">
                    <input className="styled-input" placeholder={t.pasteRoom} value={roomId} onChange={e => setRoomId(e.target.value)} />
                </div>
                
                <button className="action-btn btn-join" onClick={() => joinGame()}>{isKidMode ? t.kidJoin : t.joinGame}</button>
                
                {/* API KEY INPUT */}
                <div className="input-group" style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                    <div style={{position: 'relative'}}>
                        <input 
                            className="styled-input" 
                            type="password" 
                            placeholder={t.enterKey} 
                            value={apiKey} 
                            onChange={e => saveApiKey(e.target.value)}
                            style={{fontSize: '14px', paddingRight: language === 'he' ? '14px' : '40px', paddingLeft: language === 'he' ? '40px' : '14px'}} 
                        />
                        <div style={{position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: language === 'he' ? 'auto' : '10px', left: language === 'he' ? '10px' : 'auto', color: '#999'}}>
                            <Key size={18} />
                        </div>
                    </div>
                </div>

                {/* ROOM LIST */}
                <div className="rooms-list">
                    <div className="rooms-header">
                        <span>{t.availableRooms}</span>
                        <button onClick={fetchRooms} className="text-sm p-1 bg-gray-200 rounded"><RefreshCw size={14}/></button>
                    </div>
                    {roomsList.length === 0 ? (
                        <div className="text-gray-400 text-sm text-center italic">{t.noRooms}</div>
                    ) : (
                        roomsList.map(room => (
                            <div key={room.id} className="room-item" onClick={() => setRoomId(room.id)}>
                                <div>
                                    <span className="room-id">#{room.id}</span>
                                    <div className="text-xs text-gray-500 flex items-center gap-1"><Users size={10}/> {room.playerCount} Players</div>
                                </div>
                                <span className={`room-status ${room.started ? 'active' : ''}`}>{room.started ? 'Playing' : 'Waiting'}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
  }
  
  // --- GUARD AGAINST NULL GAMESTATE CRASH ---
  if (!gameState) return <div className="app-container flex justify-center items-center"><Loader2 className="animate-spin"/> {t.loading}</div>;

  return (
    <div className={`app-container ${isKidMode ? 'theme-kid' : 'theme-default'} ${language === 'he' ? 'rtl' : ''}`}>      
      <div className="game-layout">
            <div className="top-bar">
             {/* Room ID */}
             <div>{t.room}: <strong>{gameState.id}</strong></div>
             
             {/* Status Message */}
             <div>
                 {gameState.started 
                    ? (isMyTurn ? <span style={{color: '#2e7d32', fontWeight: 'bold'}}>{t.yourTurn}</span> : <span>{t.waiting} <span className="opacity-75">({turnPlayerName})</span></span>) 
                    : t.notStarted
                 }
             </div>

             <div className="flex items-center gap-2">
                {/* Start Game Button (Keep this visible) */}
                {!gameState.started && <button className="start-btn" onClick={startGame}>{t.startGame}</button>}
                
                {/* Menu Button (Now visible on ALL screens) */}
                {/* I removed 'md:hidden' so it appears on Desktop too */}
                <button onClick={() => setIsMenuOpen(true)} className="p-2" style={{background: 'none', border: 'none'}}>
                    <Menu size={28} />
                </button>
             </div>
          </div>
          
          <div className="game-scroll-area">
            {gameState.lastMessage && (
              <div className="message-bar">
                <span><strong>{t.lastAction}</strong> {translateMessage(gameState.lastMessage, language)}</span>
                <button className="btn-bard" onClick={askBard}><Music size={12} /></button>
              </div>
            )}
            <div className="opponents">
              {gameState.players.filter(p => p.id !== playerId).map(p => {
                const isOpponentTurn = p.id === gameState.turnPlayerId;
                return (
                  <div key={p.id} className={`opponent-card ${isOpponentTurn ? 'current-turn' : ''}`}>
                    {/* Name is here */}
                    <h4 className="flex items-center justify-center gap-2 font-bold">
                      {p.name}
                      {isOpponentTurn && <Loader2 size={14} className="animate-spin text-green-600"/>}
                    </h4>
                    <button className="btn-spy" onClick={() => spyOnOpponent(p)}><Eye size={12}/></button>
                    <div style={{fontSize: '0.9rem', color: '#666'}}>{t.cards}: <strong>{p.handCount !== undefined ? p.handCount : p.hand.length}</strong> | {t.score}: <strong>{p.score}</strong></div>
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
                );
              })}
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
          </div>

          <div className={`my-area-container ${isMyTurn ? 'active-turn' : ''}`}>
             <div className="my-area">
               <div className="mobile-toggle-handle" onClick={() => setIsHandOpen(!isHandOpen)}>
                  {isHandOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
               </div>
               
               {/* MINIMIZED VIEW LOGIC */}
               <div className={!isHandOpen ? 'minimized-content' : ''} style={{display: !isHandOpen ? 'none' : 'block'}}>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                     {/* Name is here */}
                     <h3 className="font-bold text-lg">{myPlayer?.name} <span className="text-sm font-normal">- {t.score}: {myPlayer?.score}</span></h3>
                     {gameState.started && <button className="btn-advisor" onClick={askAdvisor} disabled={!isMyTurn}><ScrollText size={16} /> {isKidMode ? t.kidAdvisor : t.advisorBtn}</button>}
                 </div>
                 <div>
                    <h4 style={{margin: '5px 0'}}>{t.myQueens}</h4>
                    <div className="hand-row">
                       {myPlayer?.queensAwake.length > 0 ? myPlayer.queensAwake.map(q => {
                           const visual = getCardVisual(q, language);
                           return <div key={q.id} className="playing-card queen" style={{backgroundColor: visual.color}} onClick={() => askLore(visual.label)}>
                               <div className="card-label">{visual.label}</div>
                               <div className="card-emoji">{visual.emoji}</div>
                               <div className="card-bottom-value">{q.value}</div>
                           </div>
                       }) : <span style={{color: '#999', fontSize: '0.8rem'}}>{t.noQueensYet}</span>}
                    </div>
                 </div>
                 <div>
                    <h4 style={{margin: '10px 0 5px 0'}}>{t.myHand}</h4>
                    <div className="hand-row">
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
               
               {/* HEADER ONLY WHEN MINIMIZED - ADDED NAME HERE */}
               {!isHandOpen && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px', color: '#333'}} onClick={() => setIsHandOpen(true)}>
                    <div className="font-bold flex items-center gap-2">
                        {myPlayer?.name}
                        {isMyTurn && <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"/>}
                    </div>
                    <div style={{fontSize: '0.85rem', color: '#666'}}>Show Hand ({myPlayer?.hand.length})</div>
                    <div className="font-bold">{t.score}: {myPlayer?.score}</div>
                  </div>
               )}
             </div>
          </div>
        </div>

      {/* MODALS */}
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

      {isMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white absolute top-0 right-0 h-full w-64 shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{t.appTitle}</h2><button onClick={() => setIsMenuOpen(false)}><X /></button></div>
            <div className="flex flex-col gap-4">
                <button onClick={() => { setIsMenuOpen(false); toggleLanguage(); }} className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 text-left"><span style={{fontSize: '1.2rem'}}>🌐</span><span>{t.toggleLang}</span></button>
                <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-left"><LogOut size={20} /><span>{t.logout}</span></button>
                <button onClick={() => { setIsMenuOpen(false); handleTerminate(); }} className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-left"><Trash2 size={20} /><span>{t.terminate}</span></button>
            </div>
          </div>
        </div>
      )}

      {gameState.winnerId && (
        <div className="modal-overlay" style={{background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)'}}>
          <div className="modal-content" style={{border: '4px solid #FFD700', background: 'linear-gradient(to bottom, #fff, #fff8e1)'}}>
             <div style={{fontSize: '60px', marginBottom: '10px'}}>🏆</div>
             <h1 style={{color: '#F57C00', margin: '0 0 10px 0', fontSize: '2rem'}}>{t.gameOver}</h1>
             <h2 style={{color: '#333', margin: '0 0 30px 0'}}>{t.winner}: <span style={{color: '#4a148c', fontWeight: 'bold'}}>{gameState.players.find(p => p.id === gameState.winnerId)?.name}</span></h2>
             <div style={{marginBottom: '30px', textAlign: 'left', background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '10px'}}>
                {gameState.players.map(p => (
                    <div key={p.id} style={{display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #eee'}}><span>{p.name} {p.id === gameState.winnerId && '👑'}</span><span style={{fontWeight:'bold'}}>{p.score} pts</span></div>
                ))}
             </div>
             <button className="action-btn" onClick={handleTerminate} style={{background: 'linear-gradient(45deg, #FF5252, #D32F2F)', color: 'white', fontWeight: 'bold', marginTop: '10px'}}>
                <Trash2 size={18} style={{display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom'}}/>{t.terminate}
             </button>
             <div style={{fontSize: '0.8rem', color: '#666', marginTop: '8px', opacity: 0.8}}>({language === 'he' ? 'פעולה זו תסיים את החדר לכולם' : 'This will close the room for everyone'})</div>
          </div>
        </div>
      )}
    </div>
  );
}