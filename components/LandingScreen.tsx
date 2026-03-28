'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Globe } from 'lucide-react';
import { usePeerStore } from '@/store/usePeerStore';
import { useSocket } from '@/hooks/useSocket';
import { dict } from '@/lib/locales';

export function LandingScreen() {
  const { username, setUsername, setRoomId, lanPeers, language, setLanguage } = usePeerStore();
  const { isConnected, socket } = useSocket();
  const t = dict[language];
  const isRtl = language === 'ar';

  const [inputRoom, setInputRoom] = useState('');
  const [inputName, setInputName] = useState(username);
  const [searchQuery, setSearchQuery] = useState('');

  const activeLanPeers = lanPeers.filter(p => p.roomId);

  const roomsMap = new Map<string, { roomId: string; peers: typeof lanPeers }>();
  activeLanPeers.forEach(peer => {
    if (peer.roomId) {
      if (!roomsMap.has(peer.roomId)) {
        roomsMap.set(peer.roomId, { roomId: peer.roomId, peers: [] });
      }
      roomsMap.get(peer.roomId)!.peers.push(peer);
    }
  });

  const roomsList = Array.from(roomsMap.values());
  const query = searchQuery.toLowerCase();
  const filteredRooms = roomsList.filter(room =>
    room.roomId.toLowerCase().includes(query) || room.peers.some(p => p.username.toLowerCase().includes(query))
  );

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoom.length === 4 && inputName) {
      setUsername(inputName);
      setRoomId(inputRoom.toUpperCase());
    }
  };

  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setUsername(inputName);
    setRoomId(code);
    if (socket && isConnected) {
      socket.emit('update-presence', { username: inputName, roomId: code });
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-200 p-4 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full bg-orange-600/5 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(245,158,11,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-stone-900/80 backdrop-blur-2xl border border-stone-800 p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md relative z-10"
      >
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} text-stone-500 hover:text-stone-200 flex items-center gap-1.5 text-xs font-medium transition-colors bg-stone-800/50 hover:bg-stone-800 px-3 py-1.5 rounded-full border border-stone-700/50`}
        >
          <Globe size={13} />
          {language === 'en' ? 'العربية' : 'English'}
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
            <span className="text-2xl font-display font-bold text-stone-950">S</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? t.online : t.disconnected}
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold mb-8 text-center text-stone-100">{t.appTitle}</h1>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 mb-1.5">{t.usernameLabel}</label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full bg-stone-950 text-stone-200 p-3 rounded-xl border border-stone-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all placeholder:text-stone-700 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 mb-1.5">{t.roomCodeLabel}</label>
            <input
              type="text"
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
              maxLength={4}
              className="w-full bg-stone-950 text-stone-200 p-3 rounded-xl border border-stone-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all uppercase placeholder:text-stone-700 tracking-[0.3em] font-mono text-sm"
              placeholder="X7B2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98] text-sm"
          >
            {t.joinRoom}
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-stone-800" />
            <span className="flex-shrink-0 mx-4 text-xs text-stone-600 font-medium uppercase tracking-widest">{t.or}</span>
            <div className="flex-grow border-t border-stone-800" />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="w-full bg-stone-800/60 hover:bg-stone-800 text-stone-300 hover:text-stone-100 font-medium py-3 rounded-xl transition-all active:scale-[0.98] border border-stone-700/50 text-sm"
          >
            {t.createNewRoom}
          </button>

          <div className="flex justify-center mt-1">
            <button
              type="button"
              onClick={() => {
                if (socket && isConnected) socket.emit('update-presence', { username, roomId: null });
              }}
              className="text-[10px] uppercase tracking-[0.15em] text-stone-600 hover:text-amber-400 transition-colors"
            >
              ↻ {t.refreshDiscovery}
            </button>
          </div>
        </form>

        {/* LAN Rooms */}
        {roomsList.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-stone-800"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500/80 flex items-center">
                <Users size={12} className="ltr:mr-1.5 rtl:ml-1.5" /> {t.localNetworkRooms}
              </h2>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchRooms}
                className="w-full bg-stone-950 text-stone-300 p-2.5 text-xs rounded-xl border border-stone-800 focus:border-amber-500/30 outline-none transition-all placeholder:text-stone-700"
              />
            </div>

            <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {filteredRooms.map((room, i) => (
                <motion.li
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  key={i}
                  onClick={() => {
                    setUsername(inputName);
                    setRoomId(room.roomId);
                  }}
                  className="bg-stone-950/80 hover:bg-stone-800/50 border border-stone-800 hover:border-amber-500/20 p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-stone-950 font-bold ltr:mr-3 rtl:ml-3 text-xs">
                      {room.peers[0].username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-stone-300">
                        {room.peers[0].username}
                        {room.peers.length > 1 ? <span className="text-stone-600 text-xs ltr:ml-1 rtl:mr-1">+{room.peers.length - 1}</span> : null}
                      </div>
                      <div className="text-[10px] text-stone-600 flex items-center gap-1.5 mt-0.5">
                        <span>{t.roomCode}: <span className="font-mono font-bold text-amber-500">{room.roomId}</span></span>
                        <span className="w-1 h-1 rounded-full bg-stone-700" />
                        <span>{room.peers.length} {t.peersCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {t.join}
                  </div>
                </motion.li>
              ))}
              {filteredRooms.length === 0 ? (
                <li className="text-center py-4 text-xs text-stone-600 bg-stone-950/50 rounded-xl border border-stone-800/50 border-dashed">
                  {t.noRoomsFound}
                </li>
              ) : null}
            </ul>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
}
