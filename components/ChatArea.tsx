'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, File, Send, Plus, Copy, Menu, Upload } from 'lucide-react';
import type { Locale } from '@/lib/locales';

interface ChatAreaProps {
  isRtl: boolean;
  t: Locale;
  roomId: string;
  username: string;
  currentChannel: string;
  messages: any[];
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
  onOpenSidebar: () => void;
}

export function ChatArea({
  isRtl, t, roomId, username, currentChannel,
  messages, onSendMessage, onSendFile, onOpenSidebar,
}: ChatAreaProps) {
  const [chatInput, setChatInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => onSendFile(file));
    }
    e.target.value = '';
  };

  // Drag & Drop (Flaw #17)
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => onSendFile(file));
    }
  }, [onSendFile]);

  return (
    <div
      className="flex-1 flex flex-col min-w-0 w-full relative z-10"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-amber-500/50 rounded-xl m-2"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Upload size={36} className="text-amber-400" />
              </div>
              <p className="text-amber-400 font-display font-bold text-xl">{t.dropFilesHere}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Channel Header */}
      <div className="h-14 border-b border-stone-800/60 flex items-center px-4 md:px-6 flex-shrink-0 bg-stone-950/80 backdrop-blur-xl z-20">
        <button className="md:hidden ltr:mr-4 rtl:ml-4 text-stone-500 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800/50 transition-colors" onClick={onOpenSidebar}>
          <Menu size={20} />
        </button>
        <Hash size={18} className="text-amber-500/60 ltr:mr-2 rtl:ml-2" />
        <span className="font-display font-semibold text-stone-200 text-base tracking-tight">{currentChannel}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 z-10 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMe = msg.sender === username || !msg.sender;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex group hover:bg-stone-900/40 -mx-4 px-4 py-2 transition-colors rounded-lg"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0 mt-0.5 text-xs ltr:mr-3.5 rtl:ml-3.5 ${isMe ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950' : 'bg-gradient-to-br from-stone-700 to-stone-800 text-stone-300'}`}>
                  {msg.sender ? msg.sender.substring(0, 2).toUpperCase() : 'ME'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold text-sm ${isMe ? 'text-amber-400' : 'text-stone-200'}`}>{msg.sender || 'Me'}</span>
                    <span className="text-[10px] text-stone-600 font-mono">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {msg.type === 'chat' ? (
                    <div className="mt-0.5 relative group/msg">
                      <div className="text-sm leading-relaxed break-words text-stone-400">
                        {msg.content}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="absolute -top-6 ltr:right-0 rtl:left-0 opacity-0 group-hover/msg:opacity-100 text-stone-500 hover:text-stone-200 transition-all p-1.5 bg-stone-800 border border-stone-700 rounded-lg shadow-lg"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 bg-stone-900 border border-stone-800 rounded-xl p-3 flex items-center max-w-sm hover:border-amber-500/30 transition-colors group/file cursor-pointer">
                      <div className="w-10 h-10 bg-stone-950 rounded-lg flex items-center justify-center ltr:mr-3 rtl:ml-3 border border-stone-800 group-hover/file:scale-105 transition-transform">
                        <File size={18} className={isMe ? 'text-amber-400' : 'text-emerald-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium hover:underline truncate ${isMe ? 'text-amber-400' : 'text-emerald-400'}`} dir="ltr">
                          <a href={msg.url} download={msg.name}>{msg.name}</a>
                        </div>
                        <div className="text-[10px] text-stone-600 mt-0.5 font-mono" dir="ltr">{(msg.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-600 px-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mb-6">
              <Hash size={36} className="text-amber-500/40" />
            </div>
            <h3 className="text-2xl font-display font-bold text-stone-300 mb-3">
              {t.welcomeTo} <span className="text-amber-400">#{currentChannel}</span>
            </h3>
            <p className="text-stone-500 max-w-md leading-relaxed text-sm">
              {t.startOfChannel} <span className="text-stone-300 font-medium">#{currentChannel}</span> {t.channelInRoom}{' '}
              <span className="font-mono font-bold text-amber-500">{roomId}</span>
            </p>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 flex-shrink-0 z-20 border-t border-stone-800/40">
        <form onSubmit={handleSend} className="bg-stone-900 border border-stone-800 rounded-xl flex items-center px-2 py-1.5 focus-within:border-amber-500/30 transition-all">
          <label className="cursor-pointer text-stone-500 hover:text-amber-400 p-2 rounded-lg hover:bg-stone-800/50 transition-colors ltr:mr-1 rtl:ml-1 group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <input type="file" multiple className="hidden" onChange={handleFileChange} />
          </label>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`${t.message} #${currentChannel}`}
            className="flex-1 bg-transparent border-none outline-none text-stone-200 placeholder-stone-600 text-sm px-2"
          />
          <button
            type="submit"
            className={`p-2 rounded-lg transition-all ltr:ml-1 rtl:mr-1 ${chatInput.trim() ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20' : 'text-stone-600'}`}
            disabled={!chatInput.trim()}
          >
            <Send size={16} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
}
