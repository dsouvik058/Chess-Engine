import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { Users, Monitor, Globe, Copy, Check, Play, Plus, LogIn, Loader2, Clock, Flame, Zap, Sliders } from 'lucide-react';
import { api } from '../../services/api';
import { wsService } from '../../services/websocket';
import type { PlayerColor } from '../../types/chess';
import type { GameRoom } from '../../types/multiplayer';
import type { TimeControlCategory } from './PreGameModal';

interface PreGame1v1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLocalGame: (userColor: PlayerColor, timeMinutes: number) => void;
  onStartOnlineGame: (roomId: string, myPlayerId: string, myColor: PlayerColor, myName: string, timeMinutes: number) => void;
  initialRoomId?: string;
}

export const PreGame1v1Modal: React.FC<PreGame1v1ModalProps> = ({
  isOpen,
  onClose,
  onStartLocalGame,
  onStartOnlineGame,
  initialRoomId = '',
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local');
  const [onlineSubtype, setOnlineSubtype] = useState<'create' | 'join'>('create');

  // Time Control States
  const [category, setCategory] = useState<TimeControlCategory>('rapid');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customIncrementSecs, setCustomIncrementSecs] = useState<number>(5);

  // Side Choice State
  const [chosenSide, setChosenSide] = useState<'white' | 'black' | 'random'>('white');

  // Online config
  const [playerName, setPlayerName] = useState('Player 1');
  const [joinRoomIdInput, setJoinRoomIdInput] = useState(initialRoomId);
  const [createdRoomId, setCreatedRoomId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Reset stale room code whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCreatedRoomId('');
      setCodeCopied(false);
    }
  }, [isOpen]);

  // Sync initialRoomId if opened via link
  useEffect(() => {
    if (initialRoomId) {
      setActiveTab('online');
      setOnlineSubtype('join');
      setJoinRoomIdInput(initialRoomId);
    }
  }, [initialRoomId]);

  const handleCategorySelect = (cat: TimeControlCategory) => {
    setCategory(cat);
    if (cat === 'rapid') {
      setSelectedMinutes(10);
    } else if (cat === 'blitz') {
      setSelectedMinutes(3);
    } else if (cat === 'bullet') {
      setSelectedMinutes(1);
    }
  };

  const getEffectiveMinutes = () => {
    return category === 'custom' ? customMinutes : selectedMinutes;
  };

  const getEffectiveColor = (): PlayerColor => {
    if (chosenSide === 'random') {
      return Math.random() < 0.5 ? 'white' : 'black';
    }
    return chosenSide;
  };

  // Host room creation logic
  const handleCreateRoom = async () => {
    setIsLoading(true);
    const effMinutes = getEffectiveMinutes();
    const effSide = chosenSide;

    try {
      const resp = await api.createRoom({
        playerName: playerName.trim() || 'Host',
        timeControlMinutes: effMinutes,
        preferredColor: effSide,
      });

      const newRoomId = resp.room.roomId;
      const myId = resp.playerId;
      const myCol = resp.playerColor || 'white';

      setCreatedRoomId(newRoomId);

      // Subscribe to WebSocket room topic immediately & wait for opponent to join
      await wsService.connect();
      wsService.subscribeToRoom(newRoomId, (data) => {
        if ('status' in data) {
          const roomObj = data as GameRoom;
          if (roomObj.status === 'IN_PROGRESS') {
            onStartOnlineGame(
              newRoomId,
              myId,
              myCol,
              playerName.trim() || 'Host',
              effMinutes
            );
            setCreatedRoomId('');
            onClose();
          }
        }
      });
    } catch (e) {
      console.error('Failed to create room:', e);
      alert('Error creating multiplayer room');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest room join logic
  const handleJoinRoom = async () => {
    if (!joinRoomIdInput.trim()) return;
    setIsLoading(true);
    try {
      const resp = await api.joinRoom({
        roomId: joinRoomIdInput.trim().toUpperCase(),
        playerName: playerName.trim() || 'Guest',
      });

      const roomTimeControl = resp.room.timeControlMinutes || getEffectiveMinutes();

      onStartOnlineGame(
        resp.room.roomId,
        resp.playerId,
        resp.playerColor || 'black',
        playerName.trim() || 'Guest',
        roomTimeControl
      );
      setCreatedRoomId('');
      onClose();
    } catch (e) {
      console.error('Failed to join room:', e);
      alert('Room not found, full, or you are joining your own room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(createdRoomId).then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2500);
      }).catch(() => {
        fallbackCopyText(createdRoomId);
      });
    } else {
      fallbackCopyText(createdRoomId);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    } catch (e) {
      console.error('Fallback copy failed', e);
    }
    document.body.removeChild(textArea);
  };

  const handleStartLocal = () => {
    const finalColor = getEffectiveColor();
    const effMinutes = getEffectiveMinutes();
    onStartLocalGame(finalColor, effMinutes);
    setCreatedRoomId('');
    onClose();
  };

  const handleModalClose = () => {
    setCreatedRoomId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Configure Play 1 vs 1 Match">
      <div className="space-y-5 text-slate-900">
        {/* Main Tab Bar */}
        <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Local PC (Same Screen)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('online')}
            className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'online'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Online Multiple Devices</span>
          </button>
        </div>

        {/* Common Time Control & Side Chooser Section */}
        <div className="space-y-4 pt-1">
          {/* Time Control Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Time Control Category</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleCategorySelect('rapid')}
                className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  category === 'rapid'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Rapid</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('blitz')}
                className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  category === 'blitz'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Blitz</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('bullet')}
                className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  category === 'bullet'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Bullet</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('custom')}
                className={`py-2.5 px-1 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  category === 'custom'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Time Presets or Custom Sliders */}
          {category === 'rapid' && (
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                    selectedMinutes === mins
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          )}

          {category === 'blitz' && (
            <div className="grid grid-cols-2 gap-2">
              {[3, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                    selectedMinutes === mins
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          )}

          {category === 'bullet' && (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                    selectedMinutes === mins
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mins} Minute{mins > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          )}

          {category === 'custom' && (
            <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-4">
              <Slider
                label="Time Per Side (Minutes)"
                min={1}
                max={60}
                step={1}
                value={customMinutes}
                valueDisplay={`${customMinutes} Min`}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
              />

              <Slider
                label="Increment Per Move (Seconds)"
                min={0}
                max={60}
                step={1}
                value={customIncrementSecs}
                valueDisplay={`${customIncrementSecs} Seconds`}
                onChange={(e) => setCustomIncrementSecs(Number(e.target.value))}
              />
            </div>
          )}

          {/* Side Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Choose Your Side</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setChosenSide('white')}
                className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  chosenSide === 'white'
                    ? 'bg-white text-slate-900 border-amber-500 shadow-md scale-[1.02] ring-1 ring-amber-400'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-sm" />
                <span>White</span>
              </button>

              <button
                type="button"
                onClick={() => setChosenSide('black')}
                className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  chosenSide === 'black'
                    ? 'bg-slate-900 text-white border-slate-950 shadow-md scale-[1.02]'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 shadow-sm" />
                <span>Black</span>
              </button>

              <button
                type="button"
                onClick={() => setChosenSide('random')}
                className={`py-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  chosenSide === 'random'
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-md scale-[1.02]'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-white to-slate-900 border border-slate-400 shadow-sm" />
                <span>Random</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Local PC Config */}
        {activeTab === 'local' && (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs text-slate-700 leading-relaxed flex items-center gap-3.5 shadow-sm">
              <Users className="w-8 h-8 text-amber-700 flex-shrink-0" />
              <div>
                <h4 className="font-extrabold text-slate-900 mb-0.5 text-sm font-serif-classic">Local Pass & Play</h4>
                <p>Play against a friend on the same computer screen. Board turns rotate automatically.</p>
              </div>
            </div>

            <Button
              variant="classic"
              className="w-full py-3.5 font-extrabold rounded-2xl text-base shadow-xl"
              onClick={handleStartLocal}
            >
              <Play className="w-5 h-5 fill-current" /> Start Local Battle
            </Button>
          </div>
        )}

        {/* Tab 2: Online Multiple Devices Config */}
        {activeTab === 'online' && (
          <div className="space-y-4 pt-1">
            {/* Player Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Display Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            {/* Sub-toggle: Create vs Join */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOnlineSubtype('create');
                  setCreatedRoomId('');
                }}
                className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  onlineSubtype === 'create'
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Room</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlineSubtype('join');
                  setCreatedRoomId('');
                }}
                className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  onlineSubtype === 'join'
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-sm font-black'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join Existing Room</span>
              </button>
            </div>

            {/* Create Room Mode */}
            {onlineSubtype === 'create' && (
              <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-center">
                {!createdRoomId ? (
                  <Button
                    variant="accent"
                    className="w-full py-3 font-bold rounded-xl shadow-md"
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating Room...' : 'Generate Room Code'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-amber-300 flex items-center justify-between shadow-sm">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Room Code</span>
                        <span className="text-2xl font-black font-mono text-amber-900 tracking-wider">
                          {createdRoomId}
                        </span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={handleCopyCode} className="gap-1.5 font-bold rounded-xl">
                        {codeCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
                        <span>{codeCopied ? 'Copied' : 'Copy Room Code'}</span>
                      </Button>
                    </div>

                    {/* Waiting Indicator */}
                    <div className="flex items-center justify-center gap-2 py-3 bg-amber-100/60 border border-amber-300 rounded-2xl text-xs font-semibold text-amber-950">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                      <span className="animate-pulse">Waiting for opponent to join...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Join Room Mode */}
            {onlineSubtype === 'join' && (
              <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Enter Room ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ROOM-8492"
                    value={joinRoomIdInput}
                    onChange={(e) => setJoinRoomIdInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm font-bold"
                  />
                </div>

                <Button
                  variant="accent"
                  className="w-full py-3 font-bold rounded-xl shadow-md"
                  onClick={handleJoinRoom}
                  disabled={isLoading || !joinRoomIdInput.trim()}
                >
                  {isLoading ? 'Joining...' : 'Join Game Room'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};


