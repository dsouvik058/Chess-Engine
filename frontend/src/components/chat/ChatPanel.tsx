import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types/multiplayer';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myPlayerId: string;
  opponentName?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  myPlayerId,
  opponentName = 'Opponent',
}) => {
  const [inputText, setInputText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-64 bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-200">
        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
        <span>Match Chat ({opponentName})</span>
      </div>

      {/* Messages Feed */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 font-sans text-xs"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic text-[11px]">
            No messages yet. Say hi to your opponent!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === myPlayerId;
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-0.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {isMe ? 'You' : msg.senderName || opponentName}
                  </span>
                  <span>•</span>
                  <span>
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words ${
                    isMe
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2 bg-slate-950/90 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={200}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />
        <Button
          type="submit"
          variant="accent"
          size="sm"
          className="px-3 py-1.5"
          disabled={!inputText.trim()}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
};
