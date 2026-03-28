'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, X } from 'lucide-react';
import type { Locale } from '@/lib/locales';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  t: Locale;
}

export function CreateChannelModal({ isOpen, onClose, onCreate, t }: CreateChannelModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim().toLowerCase().replace(/\s+/g, '-'));
      setName('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-stone-100 font-display">{t.createChannel}</h2>
                <button onClick={onClose} className="text-stone-500 hover:text-red-400 bg-stone-800 p-2 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500/80 mb-2 font-mono">{t.channelName}</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-950 text-stone-100 p-3.5 pl-10 rounded-xl border border-stone-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
                      placeholder="new-channel"
                      required
                      maxLength={32}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-stone-800">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition-colors">
                    {t.cancel}
                  </button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-bold text-stone-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all active:scale-[0.98]">
                    {t.create}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
