import React, { useState } from 'react';
import { 
  Crown, ScrollText, BookOpen, Loader2, Music, Eye, Sparkles, 
  ChevronUp, ChevronDown, Menu, X, LogOut, Trash2 
} from 'lucide-react';

// --- IMPORTS ---
import './styles/App.css';
import { TEXTS } from './utils/translation';
import { useGemini } from './services/gemini';
import { translateMessage } from './utils/formatters';
import { useGameLogic } from './hooks/useGameLogic'; // <--- NEW IMPORT

// --- COMPONENTS ---
import Card from './components/Card';
import Lobby from './components/Lobby';

export default function App() {
  // UI Settings (Local only)
  const [isKidMode, setIsKidMode] = useState(false);
  const [language, setLanguage] = useState('he');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const t = TEXTS[language];
  const toggleLanguage = () => setLanguage(prev => prev === 'he' ? 'en' : 'he');

  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowKeyModal(false);
  };

  // --- HOOKS ---
  
  // 1. Initialize Game Logic Hook
  const {
    view, setView,
    gameState,
    roomId, setRoomId,
    playerName, setPlayerName,
    playerId,
    roomsList, fetchRooms,
    selectedCardIds, setSelectedCardIds,
    isHandOpen, setIsHandOpen,
    createGame, joinGame, startGame, playMove, handleLogout, handleTerminate
  } = useGameLogic(t, language);

  // 2. Initialize AI Hook
  const { 
    aiModalOpen, setAiModalOpen, 
    aiContent, aiLoading, aiType, 
    askAdvisor, askLore, askBard, spyOnOpponent 
  } = useGemini(gameState, playerId, language, apiKey, setShowKeyModal);

  // --- HANDLERS ---
  const handleHandClick = (card) => {
    if (gameState?.turnPlayerId !== playerId) return;
    const player = gameState.players.find(p => p.id === playerId);
    const isNumber = card.type === 'number';
    const hasNumbers = selectedCardIds.some(id => player.hand.find(h=>h.id===id)?.type === 'number');
    if (selectedCardIds.length > 0) {
       if (isNumber !== hasNumbers) { alert("Cannot mix numbers/specials"); return; }
       if (!isNumber) { setSelectedCardIds(selectedCardIds.includes(card.id) ? [] : [card.id]); return; }
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

  // Derived State
  const myPlayer = gameState?.players?.find(p => p.id === playerId);
  const isMyTurn = gameState?.turnPlayerId === playerId;
  const selectedType = selectedCardIds.length > 0 && myPlayer?.hand ? myPlayer.hand.find(c => c.id === selectedCardIds[0])?.type : null;
  const targetSleeping = isMyTurn && (selectedType === 'king' || gameState?.pendingRoseWake);
  const targetAwake = isMyTurn && (selectedType === 'knight' || selectedType === 'potion');
  const turnPlayerName = gameState?.players?.find(p => p.id === gameState.turnPlayerId)?.name;

  if (view === 'lobby') {
    return (
        <div className={`app-container ${isKidMode ? 'theme-kid' : 'theme-default'} ${language === 'he' ? 'rtl' : ''}`}>
            <Lobby 
                t={t} language={language} toggleLanguage={toggleLanguage}
                isKidMode={isKidMode} setIsKidMode={setIsKidMode}
                playerName={playerName} setPlayerName={setPlayerName}
                roomId={roomId} setRoomId={setRoomId}
                apiKey={apiKey} saveApiKey={saveApiKey}
                createGame={() => createGame(apiKey)} joinGame={joinGame}
                roomsList={roomsList} fetchRooms={fetchRooms}
            />
        </div>
    );
  }
  
  if (!gameState) return <div className="app-container flex justify-center items-center"><Loader2 className="animate-spin"/> {t.loading}</div>;

  return (
    <div className={`app-container ${isKidMode ? 'theme-kid' : 'theme-default'} ${language === 'he' ? 'rtl' : ''}`}>
      <div className="game-layout">
          <div className="top-bar">
             <div>{t.room}: <strong>{gameState.id}</strong></div>
             <div>{gameState.started ? (isMyTurn ? <span style={{color: '#2e7d32', fontWeight: 'bold'}}>{t.yourTurn}</span> : <span>{t.waiting} <span className="opacity-75">({turnPlayerName})</span></span>) : t.notStarted}</div>
             <div className="flex items-center gap-2">
                {!gameState.started && <button className="start-btn" onClick={startGame}>{t.startGame}</button>}
                <button onClick={() => setIsMenuOpen(true)} className="p-2" style={{background: 'none', border: 'none'}}><Menu size={28} /></button>
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
                    <h4 className="flex items-center justify-center gap-2 font-bold">{p.name} {isOpponentTurn && <Loader2 size={14} className="animate-spin text-green-600"/>}</h4>
                    <button className="btn-spy" onClick={() => spyOnOpponent(p)}><Eye size={12}/></button>
                    <div style={{fontSize: '0.9rem', color: '#666'}}>{t.cards}: <strong>{p.handCount !== undefined ? p.handCount : p.hand.length}</strong> | {t.score}: <strong>{p.score}</strong></div>
                    <div className="card-row" style={{transform: 'scale(0.85)', marginTop: '5px'}}> 
                      {p.queensAwake.map(q => (
                        <Card key={q.id} card={q} language={language} onClick={() => handleOpponentQueenClick(q)} isSelected={false} disabled={!targetAwake} />
                      ))}
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
                      <Card key={c.id} card={c} language={language} onClick={() => handleQueenClick(c)} isSelected={false} disabled={!targetSleeping} isFaceUp={false} />
                  ))}
                </div>
              </div>
              <div className="discard-pile">
                  <h3>{t.discardPile}</h3>
                  {gameState.discardPile.length > 0 ? (
                      <Card card={gameState.discardPile[gameState.discardPile.length - 1]} language={language} />
                  ) : <div className="empty-slot">{t.empty}</div>}
              </div>
            </div>
          </div>

          <div className={`my-area-container ${isMyTurn ? 'active-turn' : ''}`}>
             <div className="my-area">
               <div className="mobile-toggle-handle" onClick={() => setIsHandOpen(!isHandOpen)}>{isHandOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</div>
               
               <div className={!isHandOpen ? 'minimized-content' : ''} style={{display: !isHandOpen ? 'none' : 'block'}}>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                     <h3 className="font-bold text-lg">{myPlayer?.name} <span className="text-sm font-normal">- {t.score}: {myPlayer?.score}</span></h3>
                     {gameState.started && <button className="btn-advisor" onClick={askAdvisor} disabled={!isMyTurn}><ScrollText size={16} /> {isKidMode ? t.kidAdvisor : t.advisorBtn}</button>}
                 </div>
                 <div>
                    <h4 style={{margin: '5px 0'}}>{t.myQueens}</h4>
                    <div className="hand-row">
                       {myPlayer?.queensAwake.length > 0 ? myPlayer.queensAwake.map(q => (
                           <Card key={q.id} card={q} language={language} onClick={() => askLore(q.name)} />
                       )) : <span style={{color: '#999', fontSize: '0.8rem'}}>{t.noQueensYet}</span>}
                    </div>
                 </div>
                 <div>
                    <h4 style={{margin: '5px 0 2px 0'}}>{t.myHand}</h4>
                    <div className="hand-row"> 
                       {myPlayer?.hand.map(card => (
                           <Card key={card.id} card={card} language={language} onClick={() => handleHandClick(card)} isSelected={selectedCardIds.includes(card.id)} disabled={!isMyTurn} />
                       ))}
                    </div>
                 </div>
                 <div style={{marginTop: '8px', height: '40px', display: 'flex', justifyContent: 'center'}}>
                   {selectedCardIds.length > 0 && (selectedType === 'number' || selectedType === 'jester') && (
                     <button onClick={() => playMove(null)} className="start-btn" style={{backgroundColor: '#2196F3', width: '100%', maxWidth: '200px'}}>{selectedType === 'jester' ? t.playJester : t.playNumbers}</button>
                   )}
                 </div>
               </div>
               
               {!isHandOpen && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px', color: '#333'}} onClick={() => setIsHandOpen(true)}>
                    <div className="font-bold flex items-center gap-2">{myPlayer?.name} {isMyTurn && <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"/>}</div>
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