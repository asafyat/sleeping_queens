import { mockServer } from './gameEngine';

// CONFIGURATION
const API_URL = ''; 
const USE_MOCK_API = false;

export const api = {
  // --- READ ---
  getRooms: async () => {
    if (USE_MOCK_API) return []; // Mock doesn't support room lists yet
    try {
      const res = await fetch(`${API_URL}/rooms`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      return data.rooms || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getGameState: async (roomId, playerId) => {
    if (USE_MOCK_API) {
      const state = mockServer.getState();
      // Return a deep copy to mimic network request
      return JSON.parse(JSON.stringify(state));
    }
    
    const res = await fetch(`${API_URL}/rooms/${roomId}?playerId=${playerId}`);
    if (res.status === 404) return null; // Game lost/over
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  },

  // --- WRITE ---
  createRoom: async (apiKey, playerName, language) => {
    if (USE_MOCK_API) {
      mockServer.reset(apiKey);
      const p = mockServer.addPlayer(playerName || (language === 'he' ? "שחקן" : "Player"));
      mockServer.addPlayer(language === 'he' ? "מחשב" : "CPU");
      return { roomId: mockServer.id, playerId: p.playerId, isMock: true };
    }

    const res = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (!res.ok) throw new Error("Failed to create room");
    return await res.json(); // Returns { roomId }
  },

  joinRoom: async (roomId, playerName) => {
    if (USE_MOCK_API) {
      return { playerId: 'simulated-join-id', roomId: mockServer.id };
    }

    const res = await fetch(`${API_URL}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });
    
    if (res.status === 404) throw new Error("404");
    if (!res.ok) throw new Error("Room full or error");
    return await res.json(); // Returns { playerId, ... }
  },

  startGame: async (roomId) => {
    if (USE_MOCK_API) {
      return mockServer.startGame();
    }
    
    const res = await fetch(`${API_URL}/rooms/${roomId}/start`, { method: 'POST' });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  playCard: async (roomId, playerId, cardIds, targetId, language) => {
    if (USE_MOCK_API) {
      const newState = mockServer.playCard(playerId, cardIds, targetId, language);
      return { state: newState, isMock: true };
    }

    const res = await fetch(`${API_URL}/rooms/${roomId}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, cardIds, targetCardId: targetId }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return { state: data, isMock: false };
  },

  // Mock-specific helper
  runCpuTurn: (language) => {
    if (USE_MOCK_API) {
      mockServer.cpuAutoPlay(language);
      return mockServer.getState();
    }
    return null;
  },

  terminateGame: async (roomId) => {
    if (!USE_MOCK_API && roomId) {
      try {
        await fetch(`${API_URL}/rooms/${roomId}`, { method: 'DELETE' });
      } catch (e) {
        console.error("Termination failed", e);
      }
    }
  }
};