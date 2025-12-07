import React from 'react';
import { RefreshCw, Users, Key } from 'lucide-react';

export default function Lobby({ 
    t, 
    language, 
    toggleLanguage, 
    isKidMode, 
    setIsKidMode, 
    playerName, 
    setPlayerName, 
    roomId, 
    setRoomId, 
    apiKey, 
    saveApiKey, 
    createGame, 
    joinGame, 
    roomsList, 
    fetchRooms 
}) {
    return (
        <div className="lobby-card">
            {/* Toggles */}
            <button className="toggle-lang" onClick={toggleLanguage}>
                {t.toggleLang}
            </button>
            
            <button className="toggle-kid-mode" onClick={() => setIsKidMode(!isKidMode)}>
                {isKidMode ? t.normalMode : t.kidMode}
            </button>

            {/* Title */}
            <h1 className="lobby-title">{isKidMode ? t.kidTitle : t.appTitle}</h1>
            <div className="lobby-subtitle">{isKidMode ? t.kidSubtitle : t.lobbySubtitle}</div>

            {/* Name Input */}
            <div className="input-group">
                <input 
                    className="styled-input" 
                    placeholder={isKidMode ? t.kidName : t.enterName} 
                    value={playerName} 
                    onChange={e => setPlayerName(e.target.value)} 
                />
            </div>
            
            <button className="action-btn btn-create" onClick={createGame}>{isKidMode ? t.kidCreate : t.createGame}</button>
            
            <div className="divider">{t.orJoin}</div>
            
            {/* Room Input */}
            <div className="input-group">
                <input 
                    className="styled-input" 
                    placeholder={t.pasteRoom} 
                    value={roomId} 
                    onChange={e => setRoomId(e.target.value)} 
                />
            </div>
            
            <button className="action-btn btn-join" onClick={() => joinGame()}>{isKidMode ? t.kidJoin : t.joinGame}</button>
            
            {/* API Key Input */}
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

            {/* Room List */}
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
    );
}