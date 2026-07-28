import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { CreateRoomRequest, JoinRoomRequest } from '../../types/multiplayer';
import { Copy, Check, Plus, LogIn } from 'lucide-react';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (req: CreateRoomRequest) => Promise<string | undefined>;
  onJoinRoom: (req: JoinRoomRequest) => Promise<boolean>;
  createdRoomId?: string;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  createdRoomId,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('Player 1');
  const [timeControl, setTimeControl] = useState(10);
  const [side, setSide] = useState<'WHITE' | 'BLACK' | 'RANDOM'>('WHITE');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateRoom({ playerName, timeControlMinutes: timeControl, preferredColor: side.toLowerCase() });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    setLoading(true);
    try {
      const ok = await onJoinRoom({ roomId: joinRoomId.trim(), playerName });
      if (ok) onClose();
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    if (createdRoomId) {
      navigator.clipboard.writeText(createdRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="1v1 Online Multiplayer Rooms">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setTab('create')}
            className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
              tab === 'create'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" /> Create Room
          </button>

          <button
            onClick={() => setTab('join')}
            className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
              tab === 'join'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Time Control (Minutes)</label>
              <select
                value={timeControl}
                onChange={(e) => setTimeControl(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value={3}>3 Minutes (Blitz)</option>
                <option value={5}>5 Minutes (Blitz)</option>
                <option value={10}>10 Minutes (Rapid)</option>
                <option value={15}>15 Minutes (Rapid)</option>
                <option value={30}>30 Minutes (Classical)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Choose Side</label>
              <div className="grid grid-cols-3 gap-2">
                {(['WHITE', 'BLACK', 'RANDOM'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      side === s
                        ? 'bg-cyan-950 text-cyan-400 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {createdRoomId && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl space-y-2">
                <span className="text-xs text-cyan-300 font-semibold block">Room Created! Share Room Code with Opponent:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdRoomId}
                    className="flex-1 bg-slate-950 border border-cyan-800 rounded-lg px-3 py-1.5 font-mono text-sm text-cyan-300 select-all"
                  />
                  <Button type="button" variant="primary" size="sm" onClick={copyRoomCode}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" variant="accent" className="w-full" disabled={loading}>
              {loading ? 'Creating Room...' : 'Create Room'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Room ID Code</label>
              <input
                type="text"
                placeholder="e.g. A1B2C3D4"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Joining Room...' : 'Join 1v1 Room'}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};
