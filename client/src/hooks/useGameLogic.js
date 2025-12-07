import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useGameLogic = (t, language) => {
  // --- STATE ---
  const [view, setView] = useState('lobby');
  const [gameState, setGameState] = useState(null);
  const [roomId, setRoomId] = useState(localStorage.getItem('sq_room_id') || '');
  const [playerId, setPlayerId] = useState(localStorage.getItem('sq_player_id') || null);
  const [playerName, setPlayerName] = useState(localStorage.getItem('sq_player_name') || '');
  const [roomsList, setRoomsList] = useState([]);
  const [error, setError] = useState('');
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [isHandOpen, setIsHandOpen] = useState(true);

  // --- HELPERS ---
  const saveSession = (rId, pId, pName) => {
    localStorage.setItem('sq_room_id', rId);
    localStorage.setItem('sq_player_id', pId);
    localStorage.setItem('sq_player_name', pName);
  };

  const clearSession = () => {
    localStorage.removeItem('sq_room_id');
    localStorage.removeItem('sq_player_id');
    setRoomId('');
    setPlayerId(null);
  };

  // --- ACTIONS ---

  const fetchRooms = async () => {
    const rooms = await api.getRooms();
    setRoomsList(rooms);
  };

  const fetchGameState = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await api.getGameState(roomId, playerId);
      if (data === null) {
        alert("Game session lost.");
        clearSession();
        setView('lobby');
        setGameState(null);
      } else {
        setGameState(data);
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  }, [roomId, playerId]);

  const createGame = async (apiKey) => {
    try {
      const data = await api.createRoom(apiKey, playerName, language);
      if (data.isMock) {
        setRoomId(data.roomId);
        setPlayerId(data.playerId);
        // We need to fetch state immediately for mock
        const state = await api.getGameState(data.roomId, data.playerId);
        setGameState(state);
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
      // Trigger a fetch immediately
      const state = await api.getGameState(roomToJoin, data.playerId);
      setGameState(state);
    } catch (err) {
      if (err.message === "404") { alert("Room not found!"); setRoomId(''); }
      else setError('Join failed: ' + err.message);
    }
  };

  const startGame = async () => {
    try {
      const data = await api.startGame(roomId);
      setGameState(data);
    } catch (err) { setError(err.message || 'Start failed'); }
  };

  const playMove = async (targetId = null) => {
    // Basic validation
    if (selectedCardIds.length === 0 && !gameState.pendingRoseWake) return;
    
    const effectiveCardIds = (gameState.pendingRoseWake && selectedCardIds.length === 0) 
        ? ['rose-bonus-action'] 
        : selectedCardIds;
    
    // Mobile UI: Close hand on play
    if (window.innerWidth <= 768) setIsHandOpen(false);

    try {
      const { state, isMock } = await api.playCard(roomId, playerId, effectiveCardIds, targetId, language);
      setGameState(state);
      setSelectedCardIds([]);

      // Mock CPU Logic
      if (isMock && !state.winnerId) {
        setTimeout(() => {
           const cpuState = api.runCpuTurn(language);
           setGameState(cpuState);
        }, 1500);
      }
    } catch (err) {
      alert(err.message);
      setIsHandOpen(true); // Re-open hand if error
    }
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

  // --- EFFECTS ---

  // 1. Initial Room Fetch
  useEffect(() => { if (view === 'lobby') fetchRooms(); }, [view]);

  // 2. Reconnection Logic
  useEffect(() => {
    const checkActiveSession = async () => {
      if (view === 'lobby' && roomId && playerId) {
           try {
             const data = await api.getGameState(roomId, playerId);
             if (data && data.players && data.players.find(p => p.id === playerId)) {
                 setGameState(data);
                 setView('game');
             } else { clearSession(); }
           } catch (e) { console.error("Reconnect failed:", e); }
      }
    };
    checkActiveSession();
  }, []); // Run once

  // 3. Polling (Game Loop)
  useEffect(() => {
    if (view === 'game') {
      fetchGameState();
      const interval = setInterval(fetchGameState, 2000);
      return () => clearInterval(interval);
    }
  }, [view, roomId, fetchGameState]);

  // 4. Mobile Auto-Minimize Hand
  useEffect(() => {
    if (window.innerWidth > 768) { if (!isHandOpen) setIsHandOpen(true); return; }
    if (!gameState || !playerId) return;
    const isMyTurn = gameState.turnPlayerId === playerId;
    setIsHandOpen(isMyTurn);
  }, [gameState?.turnPlayerId]); 

  // --- RETURN INTERFACE ---
  return {
    // State
    view, setView,
    gameState, setGameState,
    roomId, setRoomId,
    playerId, setPlayerId,
    playerName, setPlayerName,
    roomsList,
    error, setError,
    selectedCardIds, setSelectedCardIds,
    isHandOpen, setIsHandOpen,
    
    // Actions
    fetchRooms,
    createGame,
    joinGame,
    startGame,
    playMove,
    handleLogout,
    handleTerminate
  };
};