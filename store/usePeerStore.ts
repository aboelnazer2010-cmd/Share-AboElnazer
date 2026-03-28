import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LanPeer {
  socketId: string;
  username: string;
  roomId?: string;
  ip: string;
}

interface PeerState {
  roomId: string | null;
  username: string;
  sessionId: string;
  language: 'en' | 'ar';
  peers: string[];
  lanPeers: LanPeer[];
  channels: string[];
  currentChannel: string;
  setRoomId: (id: string | null) => void;
  setUsername: (name: string) => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  addPeer: (id: string) => void;
  removePeer: (id: string) => void;
  setPeers: (peers: string[]) => void;
  setLanPeers: (peers: LanPeer[]) => void;
  addChannel: (channel: string) => void;
  setChannels: (channels: string[]) => void;
  setCurrentChannel: (channel: string) => void;
}

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
};

const generateUsername = () => {
  const arr = new Uint16Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    arr[0] = Math.floor(Math.random() * 65535);
  }
  return `User-${arr[0]}`;
};

export const usePeerStore = create<PeerState>()(
  persist(
    (set) => ({
      roomId: null,
      username: generateUsername(),
      sessionId: generateSessionId(),
      language: 'en',
      peers: [],
      lanPeers: [],
      channels: ['general'],
      currentChannel: 'general',
      setRoomId: (id) => set({ roomId: id }),
      setUsername: (name) => set({ username: name }),
      setLanguage: (lang) => set({ language: lang }),
      addPeer: (id) => set((state) => ({ peers: [...new Set([...state.peers, id])] })),
      removePeer: (id) => set((state) => ({ peers: state.peers.filter((p) => p !== id) })),
      setPeers: (peers) => set({ peers }),
      setLanPeers: (peers) => set({ lanPeers: peers }),
      addChannel: (channel) => set((state) => ({ channels: [...new Set([...state.channels, channel])] })),
      setChannels: (channels) => set({ channels }),
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
    }),
    {
      name: 'share-aboelnazer-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        language: state.language,
        channels: state.channels,
      }),
    }
  )
);
