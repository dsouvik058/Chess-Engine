import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../../types/multiplayer';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myPlayerId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  myPlayerId,
}) => {
  const [text, setText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <Card className="flex flex-col h-64 p-3.5 bg-white/90 border-slate-200 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-2 pb-2.5 mb-2 border-b border-slate-200 text-xs font-bold text-slate-800 font-serif-classic">
        <MessageSquare className="w-4 h-4 text-amber-700" />
        <span>Opponent Match Chat</span>
      </div>

      {/* Message List */}
      <div ref={logRef} className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {messages.length === 0 ? (
          <div className="text-center py-6 text-slate-400 italic">Connected to 1v1 Room. Say hi to your opponent!</div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === myPlayerId;
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-bold">
                  {isMine ? 'You' : msg.senderName || 'Opponent'} • {msg.timestamp || ''}
                </span>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words shadow-sm text-xs ${
                    isMine
                      ? 'bg-amber-600 text-white rounded-br-none font-medium'
                      : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none font-medium'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm"
          maxLength={200}
        />
        <Button type="submit" variant="classic" size="sm" className="rounded-xl px-3" disabled={!text.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </Card>
  );
};

