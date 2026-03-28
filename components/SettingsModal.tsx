'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { Locale } from '@/lib/locales';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (name: string) => void;
  t: Locale;
}

export function SettingsModal({ isOpen, onClose, currentName, onSave, t }: SettingsModalProps) {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
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
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-stone-100 font-display">{t.userSettings}</h2>
                <button onClick={onClose} className="text-stone-500 hover:text-red-400 bg-stone-800 hover:bg-stone-800/80 p-2 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/80 mb-2 font-mono">{t.usernameLabel}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-950 text-stone-100 p-3.5 rounded-xl border border-stone-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all"
                    required
                    maxLength={32}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-stone-800">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition-colors">
                    {t.cancel}
                  </button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all active:scale-[0.98]">
                    {t.saveChanges}
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
