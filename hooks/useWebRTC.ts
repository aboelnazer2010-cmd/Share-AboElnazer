import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { usePeerStore } from '@/store/usePeerStore';
import { db } from '@/lib/db';

type SignalData = {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

// Toast callback type for notifications
type ToastCallback = (message: string, type?: 'info' | 'success' | 'error') => void;

export const useWebRTC = (onToast?: ToastCallback) => {
  const { socket, isConnected } = useSocket();
  const { roomId, username, sessionId, addPeer, removePeer, setPeers, setLanPeers, channels, addChannel, currentChannel } = usePeerStore();
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel[]>>(new Map());
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, any[]>>({});
  
  const fileChunksRef = useRef<Map<string, ArrayBuffer[]>>(new Map());
  const fileMetadataRef = useRef<Map<string, any>>(new Map());
  const fileReceivedCountRef = useRef<Map<string, number>>(new Map());
  const fileInitPromisesRef = useRef<Map<string, Promise<{ writable: FileSystemWritableFileStream, handle: FileSystemFileHandle } | null>>>(new Map());
  const writeQueuesRef = useRef<Map<string, Promise<void>>>(new Map());
  const fileReceivedChunksRef = useRef<Map<string, Set<number>>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // Cleanup incomplete file transfers (Flaw #7)
  const cleanupFileTransfers = useCallback((peerId?: string) => {
    fileChunksRef.current.clear();
    fileMetadataRef.current.clear();
    fileReceivedCountRef.current.clear();
    fileReceivedChunksRef.current.clear();
    fileInitPromisesRef.current.clear();
    writeQueuesRef.current.clear();
  }, []);

  const handleDataChannelMessage = useCallback((peerId: string, event: MessageEvent) => {
    if (typeof event.data === 'string') {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          const channelId = data.channelId || 'general';
          // Use receiver's timestamp (Flaw #14)
          const receivedMsg = { ...data, peerId, timestamp: Date.now() };
          setMessagesByChannel((prev) => ({
            ...prev,
            [channelId]: [...(prev[channelId] || []), receivedMsg]
          }));
          // Toast notification (Flaw #15)
          if (channelId !== usePeerStore.getState().currentChannel && onToast) {
            onToast(`${data.sender}: ${data.content?.substring(0, 50)}`, 'info');
          }
        } else if (data.type === 'channel-create') {
          addChannel(data.channelName);
        } else if (data.type === 'channel-sync') {
          data.channels.forEach((c: string) => addChannel(c));
        } else if (data.type === 'file-header') {
          fileMetadataRef.current.set(data.fileId, data);
          fileReceivedCountRef.current.set(data.fileId, 0);
          fileReceivedChunksRef.current.set(data.fileId, new Set());
          
          const initPromise = (async () => {
            try {
              const root = await navigator.storage.getDirectory();
              const draftDir = await root.getDirectoryHandle('downloads', { create: true });
              const handle = await draftDir.getFileHandle(`${data.fileId}-${data.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`, { create: true });
              const writable = await handle.createWritable();
              return { writable, handle };
            } catch (e) {
              console.warn('OPFS not supported, falling back to memory', e);
              fileChunksRef.current.set(data.fileId, new Array(data.totalChunks));
              return null;
            }
          })();
          fileInitPromisesRef.current.set(data.fileId, initPromise);

          db.files.add({
            name: data.name,
            size: data.size,
            sender: data.sender,
            status: 'transferring',
            roomId: roomId || '',
            sessionId,
            progress: 0,
          }).then(id => {
            const meta = fileMetadataRef.current.get(data.fileId);
            if (meta) meta.dbId = id;
          });
        }
        // Removed: file-progress handling (Flaw #11 - was never processed anyway)
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    } else if (event.data instanceof ArrayBuffer) {
      const view = new DataView(event.data);
      const fileIdNum = view.getUint32(0);
      const fileId = fileIdNum.toString();
      const chunkIndex = view.getUint32(4);
      const chunkData = event.data.slice(8);

      const initPromise = fileInitPromisesRef.current.get(fileId);
      if (!initPromise) return;

      const queue = writeQueuesRef.current.get(fileId) || Promise.resolve();
      writeQueuesRef.current.set(fileId, queue.then(async () => {
        const receivedChunks = fileReceivedChunksRef.current.get(fileId);
        if (!receivedChunks || receivedChunks.has(chunkIndex)) return;
        receivedChunks.add(chunkIndex);

        const opfs = await initPromise;
        const meta = fileMetadataRef.current.get(fileId);
        if (!meta) return;

        if (opfs) {
          const cSize = meta.chunkSize || 65536;
          await opfs.writable.write({ type: 'write', position: chunkIndex * cSize, data: chunkData });
        } else {
          let chunks = fileChunksRef.current.get(fileId);
          if (!chunks) {
            chunks = [];
            fileChunksRef.current.set(fileId, chunks);
          }
          chunks[chunkIndex] = chunkData;
        }

        const currentCount = fileReceivedCountRef.current.get(fileId) || 0;
        const newCount = currentCount + 1;
        fileReceivedCountRef.current.set(fileId, newCount);

        const progress = Math.floor((newCount / meta.totalChunks) * 100);
        if (meta.dbId && (newCount % 20 === 0 || newCount === meta.totalChunks)) {
          db.files.update(meta.dbId, {
            progress,
            status: newCount === meta.totalChunks ? 'completed' : 'transferring'
          });
        }

        if (newCount === meta.totalChunks) {
          let fileBlob: File | Blob;
          if (opfs) {
            await opfs.writable.close();
            fileBlob = await opfs.handle.getFile();
          } else {
            fileBlob = new Blob(fileChunksRef.current.get(fileId));
          }

          const url = URL.createObjectURL(fileBlob);
          const channelId = meta.channelId || 'general';
          setMessagesByChannel((prevMsg) => ({
            ...prevMsg,
            [channelId]: [...(prevMsg[channelId] || []), { 
              type: 'file', 
              url, 
              name: meta.name, 
              size: meta.size, 
              sender: meta.sender,
              peerId,
              timestamp: Date.now(),
            }]
          }));

          // Toast for file received (Flaw #15)
          if (onToast) {
            onToast(`${meta.sender} → ${meta.name}`, 'success');
          }

          if (meta.dbId && !opfs) {
            db.files.update(meta.dbId, { data: fileBlob });
          }

          fileChunksRef.current.delete(fileId);
          fileMetadataRef.current.delete(fileId);
          fileReceivedCountRef.current.delete(fileId);
          fileReceivedChunksRef.current.delete(fileId);
          fileInitPromisesRef.current.delete(fileId);
          writeQueuesRef.current.delete(fileId);
        }
      }).catch(err => {
        console.error('Error writing chunk', err);
      }));
    }
  }, [roomId, addChannel, sessionId, onToast]);

  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: navigator.onLine ? [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
      ] : [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 2, // Reduced from 10 (Flaw #20)
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal', {
          to: peerId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        addPeer(peerId);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeer(peerId);
        peersRef.current.delete(peerId);
        dataChannelsRef.current.delete(peerId);
        cleanupFileTransfers(peerId); // Flaw #7
      }
    };

    if (isInitiator) {
      const channels: RTCDataChannel[] = [];
      for (let i = 0; i < 4; i++) {
        const dc = pc.createDataChannel(`data-${i}`);
        dc.binaryType = 'arraybuffer';
        dc.bufferedAmountLowThreshold = 256 * 1024; // 256KB threshold
        dc.onmessage = (e) => handleDataChannelMessage(peerId, e);
        dc.onopen = () => {
          console.log(`Data channel ${i} opened with`, peerId);
          if (i === 0) {
            dc.send(JSON.stringify({ type: 'channel-sync', channels: usePeerStore.getState().channels }));
          }
        };
        channels.push(dc);
      }
      dataChannelsRef.current.set(peerId, channels);
    } else {
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.binaryType = 'arraybuffer';
        dc.bufferedAmountLowThreshold = 256 * 1024;
        dc.onmessage = (e) => handleDataChannelMessage(peerId, e);
        dc.onopen = () => {
          console.log(`Data channel opened with`, peerId);
          dc.send(JSON.stringify({ type: 'channel-sync', channels: usePeerStore.getState().channels }));
        };
        
        const channels = dataChannelsRef.current.get(peerId) || [];
        channels.push(dc);
        dataChannelsRef.current.set(peerId, channels);
      };
    }

    peersRef.current.set(peerId, pc);
    return pc;
  }, [socket, addPeer, removePeer, handleDataChannelMessage, cleanupFileTransfers]);

  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    const currentPeersRef = peersRef;
    const currentDataChannelsRef = dataChannelsRef;

    socket.emit('join-room', roomId);

    socket.on('room-users', async (users: string[]) => {
      console.log('[WebRTC] Received room-users:', users);
      setPeers(users);
      for (const userId of users) {
        try {
          const pc = createPeerConnection(userId, true);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal', {
            to: userId,
            signal: { type: 'offer', sdp: offer },
          });
        } catch (err) {
          console.error(`[WebRTC] Error creating offer for ${userId}:`, err);
        }
      }
    });

    socket.on('user-joined', (_userId: string) => {
      // New user will create the offer
    });

    socket.on('user-left', (userId: string) => {
      removePeer(userId);
      currentPeersRef.current.get(userId)?.close();
      currentPeersRef.current.delete(userId);
      currentDataChannelsRef.current.delete(userId);
    });

    socket.on('signal', async (data: { from: string; signal: SignalData }) => {
      const { from, signal } = data;
      let pc = currentPeersRef.current.get(from);

      const drainCandidates = async (peerId: string, peerConnection: RTCPeerConnection) => {
        const candidates = pendingCandidatesRef.current.get(peerId) || [];
        for (const candidate of candidates) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error(`[WebRTC] Error adding queued candidate:`, e);
          }
        }
        pendingCandidatesRef.current.delete(peerId);
      };

      try {
        if (signal.type === 'offer') {
          if (!pc) {
            pc = createPeerConnection(from, false);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp!));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', {
            to: from,
            signal: { type: 'answer', sdp: answer },
          });
          await drainCandidates(from, pc);
        } else if (signal.type === 'answer') {
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp!));
            await drainCandidates(from, pc);
          }
        } else if (signal.type === 'candidate') {
          // Fixed: Queue candidates even if pc doesn't exist yet (Flaw #5)
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate!));
          } else {
            const candidates = pendingCandidatesRef.current.get(from) || [];
            candidates.push(signal.candidate!);
            pendingCandidatesRef.current.set(from, candidates);
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Error handling signal ${signal.type} from ${from}:`, err);
      }
    });

    return () => {
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('signal');
      
      currentPeersRef.current.forEach((pc) => pc.close());
      currentPeersRef.current.clear();
      currentDataChannelsRef.current.clear();
    };
  }, [socket, isConnected, roomId, createPeerConnection, setPeers, removePeer]);

  // Clear messages when room ID changes (Fix: prevent history leak)
  useEffect(() => {
    setMessagesByChannel({});
    cleanupFileTransfers();
  }, [roomId, cleanupFileTransfers]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleLanPeers = (peers: any[]) => {
      setLanPeers(peers);
    };

    socket.on('lan-peers', handleLanPeers);
    return () => { socket.off('lan-peers', handleLanPeers); };
  }, [socket, isConnected, setLanPeers]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('update-presence', { username, roomId });
    }
  }, [socket, isConnected, username, roomId]);

  const sendMessage = useCallback((content: string) => {
    const msg = { type: 'chat', content, sender: username, timestamp: Date.now(), channelId: currentChannel };
    setMessagesByChannel((prev) => ({
      ...prev,
      [currentChannel]: [...(prev[currentChannel] || []), { ...msg, isMe: true }]
    }));
    dataChannelsRef.current.forEach((channels) => {
      const dc = channels[0];
      if (dc && dc.readyState === 'open') {
        dc.send(JSON.stringify(msg));
      }
    });
  }, [username, currentChannel, roomId]);

  const createChannelAction = useCallback((channelName: string) => {
    addChannel(channelName);
    const msg = { type: 'channel-create', channelName };
    dataChannelsRef.current.forEach((channels) => {
      const dc = channels[0];
      if (dc && dc.readyState === 'open') {
        dc.send(JSON.stringify(msg));
      }
    });
  }, [addChannel]);

  const sendFile = useCallback(async (file: File) => {
    // Use crypto.getRandomValues() for file IDs (Flaw #9)
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const fileIdNum = arr[0];
    const fileId = fileIdNum.toString();
    const chunkSize = 65536; // 64KB for robust WebRTC browser compatibility
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
    
    const header = { type: 'file-header', fileId, name: file.name, size: file.size, totalChunks, chunkSize, sender: username, channelId: currentChannel };
    
    const dbFileId = await db.files.add({
      name: file.name,
      size: file.size,
      sender: username,
      status: 'transferring',
      roomId: roomId || '',
      sessionId,
      progress: 0,
    });
    
    dataChannelsRef.current.forEach((channels) => {
      const dc = channels[0];
      if (dc && dc.readyState === 'open') {
        dc.send(JSON.stringify(header));
      }
    });

    setMessagesByChannel((prevMsg) => ({
      ...prevMsg,
      [currentChannel]: [...(prevMsg[currentChannel] || []), { type: 'file', url: URL.createObjectURL(file), name: file.name, size: file.size, isMe: true, sender: username, timestamp: Date.now() }]
    }));

    dataChannelsRef.current.forEach((channels) => {
      const openChannels = channels.filter(c => c.readyState === 'open');
      if (openChannels.length === 0) return;

      let chunkIndex = 0;
      let chunksSent = 0;
      
      const sendLoop = async () => {
        while (true) {
          const currentChunkIndex = chunkIndex++;
          if (currentChunkIndex >= totalChunks) break;

          const channel = openChannels[currentChunkIndex % openChannels.length];
          
          // Smart backpressure using bufferedAmountLowThreshold
          if (channel.bufferedAmount > 2 * 1024 * 1024) { // 2MB limit
            await new Promise(resolve => {
              const listener = () => {
                channel.removeEventListener('bufferedamountlow', listener);
                resolve(null);
              };
              channel.addEventListener('bufferedamountlow', listener);
            });
          }

          const start = currentChunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const slice = file.slice(start, end);
          const chunkData = await slice.arrayBuffer();
          
          const payload = new ArrayBuffer(8 + chunkData.byteLength);
          const view = new DataView(payload);
          view.setUint32(0, fileIdNum);
          view.setUint32(4, currentChunkIndex);
          new Uint8Array(payload, 8).set(new Uint8Array(chunkData));
          
          try {
            channel.send(payload);
          } catch (e) {
            console.error('Failed to send chunk, channel might be closed', e);
            break;
          }
          
          chunksSent++;
          
          if (chunksSent % 50 === 0 || chunksSent === totalChunks) {
            const progress = Math.floor((chunksSent / totalChunks) * 100);
            db.files.update(dbFileId, {
              progress,
              status: chunksSent === totalChunks ? 'completed' : 'transferring'
            });
          }
        }
      };

      const concurrency = Math.min(openChannels.length, 4);
      for (let i = 0; i < concurrency; i++) {
        sendLoop();
      }
    });

  }, [username, roomId, currentChannel, sessionId]);

  const messages = messagesByChannel[currentChannel] || [];

  return { messages, sendMessage, sendFile, createChannel: createChannelAction };
};
