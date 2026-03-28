'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Hash, Users, File, Plus, Settings, LogOut, Copy, X, Globe } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Locale } from '@/lib/locales';
import type { LanPeer } from '@/store/usePeerStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isRtl: boolean;
  t: Locale;
  roomId: string;
  username: string;
  sessionId: string;
  peers: string[];
  lanPeers: LanPeer[];
  channels: string[];
  currentChannel: string;
  onChannelSelect: (channel: string) => void;
  onCreateChannel: () => void;
  onLeaveRoom: () => void;
  onOpenSettings: () => void;
  onJoinRoom: (roomId: string) => void;
}

export function Sidebar({
  isOpen, onClose, isRtl, t, roomId, username, sessionId,
  peers, lanPeers, channels, currentChannel,
  onChannelSelect, onCreateChannel, onLeaveRoom, onOpenSettings, onJoinRoom,
}: SidebarProps) {
  const fileTransfers = useLiveQuery(
    () => db.files.where({ roomId: roomId || '', sessionId }).toArray(),
    [roomId, sessionId]
  ) || [];

  return (
    <>
      {/* Overlay */}
      {isOpen ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      ) : null}

      <div className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-50 w-72 bg-stone-950/95 backdrop-blur-2xl border-r border-stone-800/60 flex flex-col transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')} flex-shrink-0`}>
        
        {/* Header */}
        <div className="h-16 border-b border-stone-800/60 flex items-center px-5 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm shadow-lg shadow-amber-500/20">
              <span className="font-display font-bold text-stone-950">S</span>
            </div>
            <span className="font-display font-semibold text-stone-200 tracking-tight text-sm">{t.nexusRoom}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLeaveRoom} className="text-stone-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-stone-800/50" title={t.leaveRoom}>
              <LogOut size={16} />
            </button>
            <button className="md:hidden text-stone-500 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800/50" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Text Channels */}
          <div>
            <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em] mb-2 flex items-center justify-between px-1">
              <span>{t.textChannels}</span>
              <button onClick={onCreateChannel} className="hover:text-amber-400 transition-colors">
                <Plus size={14} />
              </button>
            </h2>
            <ul className="space-y-0.5">
              {channels.map((channel, i) => (
                <li
                  key={i}
                  onClick={() => { onChannelSelect(channel); onClose(); }}
                  className={`flex items-center px-2 py-1.5 rounded-lg cursor-pointer transition-all group text-sm ${currentChannel === channel ? 'bg-stone-800/80 text-stone-100' : 'text-stone-500 hover:bg-stone-800/40 hover:text-stone-300'}`}
                >
                  <Hash size={16} className={`ltr:mr-1.5 rtl:ml-1.5 flex-shrink-0 ${currentChannel === channel ? 'text-amber-500' : 'text-stone-600 group-hover:text-stone-500'}`} />
                  <span className={`truncate ${currentChannel === channel ? 'font-medium' : ''}`}>{channel}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Room Code */}
          <div>
            <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em] mb-2 px-1">{t.roomCode}</h2>
            <div
              className="bg-stone-900 border border-stone-800 p-3 rounded-xl flex items-center justify-between group cursor-pointer hover:border-amber-500/30 transition-colors"
              onClick={() => navigator.clipboard.writeText(roomId)}
            >
              <span className="font-mono text-lg tracking-[0.25em] text-amber-500 font-bold">{roomId}</span>
              <div className="p-1.5 rounded-md text-stone-500 group-hover:text-amber-400 transition-colors">
                <Copy size={14} />
              </div>
            </div>
          </div>

          {/* Connected Peers — show usernames (Flaw #8 fix) */}
          <div>
            <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em] mb-2 px-1 flex items-center">
              <Users size={11} className="ltr:mr-1.5 rtl:ml-1.5" />
              {t.connectedPeers}
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-md ltr:ml-2 rtl:mr-2 font-mono">{peers.length}</span>
            </h2>
            <ul className="space-y-1">
              {peers.map((peer, i) => (
                <li key={i} className="flex items-center px-3 py-2 hover:bg-stone-800/40 rounded-lg text-stone-400 hover:text-stone-200 transition-colors">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-stone-950 font-bold ltr:mr-3 rtl:ml-3 flex-shrink-0 text-[10px]">
                      {peer.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 ltr:right-1.5 rtl:-left-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-stone-950 rounded-full" />
                  </div>
                  <span className="truncate text-sm">{peer}</span>
                </li>
              ))}
              {peers.length === 0 ? (
                <li className="text-xs text-stone-600 italic px-3 py-3 bg-stone-900/50 rounded-lg border border-stone-800/50 border-dashed text-center">{t.waitingForOthers}</li>
              ) : null}
            </ul>
          </div>

          {/* LAN Peers */}
          {lanPeers.length > 0 ? (
            <div>
              <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em] mb-2 px-1 flex items-center">
                <Globe size={11} className="ltr:mr-1.5 rtl:ml-1.5" />
                {t.localNetwork}
              </h2>
              <ul className="space-y-1">
                {lanPeers.map((peer, i) => (
                  <li key={i} className="flex items-center px-3 py-2 hover:bg-stone-800/40 rounded-lg text-stone-500 hover:text-stone-300 transition-colors group">
                    <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 font-bold ltr:mr-3 rtl:ml-3 flex-shrink-0 text-[10px]">
                      {peer.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{peer.username}</div>
                      <div className="text-[10px] text-stone-600 truncate">
                        {peer.roomId ? `${t.roomCode}: ${peer.roomId}` : t.notInRoom}
                      </div>
                    </div>
                    {peer.roomId && peer.roomId !== roomId ? (
                      <button
                        onClick={() => onJoinRoom(peer.roomId!)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-stone-950 px-2 py-1 rounded-md ltr:ml-2 rtl:mr-2 transition-all"
                      >
                        {t.join}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Transfers */}
          <div>
            <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em] mb-2 px-1 flex items-center">
              <File size={11} className="ltr:mr-1.5 rtl:ml-1.5" />
              {t.transfers}
            </h2>
            <ul className="space-y-2">
              {fileTransfers.map((transfer, i) => (
                <li key={i} className="bg-stone-900/80 border border-stone-800/50 p-3 rounded-xl text-sm">
                  <div className="flex justify-between items-center text-stone-400 mb-2">
                    <span className="truncate flex-1 ltr:mr-2 rtl:ml-2 font-medium text-xs text-stone-300" title={transfer.name}>{transfer.name}</span>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-800 px-1.5 py-0.5 rounded flex-shrink-0">{transfer.progress}%</span>
                  </div>
                  <div className="w-full bg-stone-800 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${transfer.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${transfer.progress}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-medium text-stone-600 mt-1.5 flex justify-between uppercase tracking-wider">
                    <span>{transfer.sender === username ? t.sending : t.receiving}</span>
                    <span className={transfer.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}>{transfer.status}</span>
                  </div>
                </li>
              ))}
              {fileTransfers.length === 0 ? (
                <li className="text-xs text-stone-600 italic px-3 py-3 bg-stone-900/50 rounded-lg border border-stone-800/50 border-dashed text-center">{t.noActiveTransfers}</li>
              ) : null}
            </ul>
          </div>
        </div>

        {/* User Footer */}
        <div className="h-16 bg-stone-950 border-t border-stone-800/60 flex items-center px-4 flex-shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold ltr:mr-3 rtl:ml-3 text-sm font-display">
              {username.substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 ltr:right-1.5 rtl:-left-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-stone-950 rounded-full" />
          </div>
          <div className="flex-1 truncate">
            <div className="text-sm font-semibold text-stone-200 truncate">{username}</div>
            <div className="text-[10px] text-emerald-400 font-medium tracking-wider">{t.online}</div>
          </div>
          <button
            className="text-stone-500 hover:text-stone-300 p-2 rounded-lg hover:bg-stone-800/50 transition-colors"
            onClick={onOpenSettings}
            title={t.userSettings}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
