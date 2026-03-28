import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketInstance.on('connect', () => console.log('[Socket] Connected:', socketInstance?.id));
    socketInstance.on('connect_error', (err) => console.error('[Socket] Error:', err));
  }
  return socketInstance;
}

export const useSocket = () => {
  const socket = getSocket();
  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    if (socket.connected) setIsConnected(true);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return { socket, isConnected };
};
