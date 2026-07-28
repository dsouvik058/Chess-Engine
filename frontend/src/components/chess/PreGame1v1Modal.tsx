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
  const [customMinutes, setCustomMinutes] = useState<number>(1.5);
  const [customIncrementSecs, setCustomIncrementSecs] = useState<number>(1);

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
    navigator.clipboard.writeText(createdRoomId);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
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
      <div className="space-y-5">
        {/* Main Tab Bar: Local PC vs Online Multiple Devices */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'local'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Local PC (Same Screen)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('online')}
            className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'online'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
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
            <label className="block text-xs font-semibold text-slate-300 mb-2">Time Control Category</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleCategorySelect('rapid')}
                className={`py-2 px-1 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  category === 'rapid'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Rapid</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('blitz')}
                className={`py-2 px-1 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  category === 'blitz'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Blitz</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('bullet')}
                className={`py-2 px-1 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  category === 'bullet'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Bullet</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('custom')}
                className={`py-2 px-1 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  category === 'custom'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
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
                  className={`py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                    selectedMinutes === mins
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
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
                  className={`py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                    selectedMinutes === mins
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
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
                  className={`py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                    selectedMinutes === mins
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {mins} Minute{mins > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          )}

          {category === 'custom' && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
              <Slider
                label="Time Per Side (Max 1.5 min)"
                min={0.25}
                max={1.5}
                step={0.25}
                value={customMinutes}
                valueDisplay={`${customMinutes} Min (${Math.round(customMinutes * 60)}s)`}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
              />

              <Slider
                label="Increment Per Move (Max 1.5 min / 90s)"
                min={0}
                max={90}
                step={1}
                value={customIncrementSecs}
                valueDisplay={`${customIncrementSecs} Seconds`}
                onChange={(e) => setCustomIncrementSecs(Number(e.target.value))}
              />
            </div>
          )}

          {/* Side Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Choose Your Side</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setChosenSide('white')}
                className={`py-2.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  chosenSide === 'white'
                    ? 'bg-slate-100 text-slate-950 border-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-300" />
                <span>White</span>
              </button>

              <button
                type="button"
                onClick={() => setChosenSide('black')}
                className={`py-2.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  chosenSide === 'black'
                    ? 'bg-slate-950 text-white border-cyan-500 shadow-lg'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700" />
                <span>Black</span>
              </button>

              <button
                type="button"
                onClick={() => setChosenSide('random')}
                className={`py-2.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  chosenSide === 'random'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-lg'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-950 border border-slate-500" />
                <span>Random</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Local PC Config */}
        {activeTab === 'local' && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-slate-200 mb-0.5">Local Pass & Play</h4>
                <p>Play against a friend on the same computer screen. Board turns rotate automatically.</p>
              </div>
            </div>

            <Button
              variant="accent"
              className="w-full py-3"
              onClick={handleStartLocal}
            >
              <Play className="w-4 h-4" /> Start Local Battle
            </Button>
          </div>
        )}

        {/* Tab 2: Online Multiple Devices Config */}
        {activeTab === 'online' && (
          <div className="space-y-4 pt-1">
            {/* Player Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Display Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
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
                className={`py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  onlineSubtype === 'create'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
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
                className={`py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  onlineSubtype === 'join'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join Existing Room</span>
              </button>
            </div>

            {/* Create Room Mode */}
            {onlineSubtype === 'create' && (
              <div className="space-y-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                {!createdRoomId ? (
                  <Button
                    variant="accent"
                    className="w-full py-2.5"
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating Room...' : 'Generate Room Code'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Room Code</span>
                        <span className="text-2xl font-black font-mono text-cyan-300 tracking-wider">
                          {createdRoomId}
                        </span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={handleCopyCode} className="gap-1.5">
                        {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                        <span>{codeCopied ? 'Copied' : 'Copy Room Code'}</span>
                      </Button>
                    </div>

                    {/* Waiting Indicator - Game auto-starts when opponent joins */}
                    <div className="flex items-center justify-center gap-2 py-3 bg-cyan-950/40 border border-cyan-500/20 rounded-xl text-xs font-semibold text-cyan-300">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="animate-pulse">Waiting for the opponent to join the game...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Join Room Mode */}
            {onlineSubtype === 'join' && (
              <div className="space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Room ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ROOM-8492"
                    value={joinRoomIdInput}
                    onChange={(e) => setJoinRoomIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <Button
                  variant="accent"
                  className="w-full py-2.5"
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
