import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '7860', 10);
const app = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: {
      // Allow all origins in production for Hugging Face proxy compatibility
      origin: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  const rooms = new Map<string, Set<string>>();
  
  interface UserInfo {
    socketId: string;
    username: string;
    roomId?: string;
    ip: string;
  }
  
  const users = new Map<string, UserInfo>();
  const ipGroups = new Map<string, Set<string>>();

  // Rate limiting for join-room (Flaw #4)
  const joinAttempts = new Map<string, { count: number; resetAt: number }>();
  const MAX_JOIN_ATTEMPTS = 15;
  const RATE_LIMIT_WINDOW = 60000; // 1 minute

  const checkRateLimit = (socketId: string): boolean => {
    const now = Date.now();
    const record = joinAttempts.get(socketId);
    if (!record || now > record.resetAt) {
      joinAttempts.set(socketId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      return true;
    }
    record.count++;
    return record.count <= MAX_JOIN_ATTEMPTS;
  };

  const broadcastLanPeers = (ip: string) => {
    const group = ipGroups.get(ip);
    if (!group) return;
    
    const peers = Array.from(group)
      .map(id => users.get(id))
      .filter((u): u is UserInfo => u !== undefined);
      
    for (const socketId of group) {
      const otherPeers = peers.filter(p => p.socketId !== socketId);
      io.to(socketId).emit('lan-peers', otherPeers);
    }
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                     socket.handshake.headers['x-real-ip'] || 
                     socket.handshake.address;
    
    const normalizeIp = (ip: string): string => {
      let cleaned = ip.replace('::ffff:', '');
      if (cleaned === '::1') return '127.0.0.1';
      return cleaned;
    };
    
    const getNetworkGroup = (rawIp: string) => {
      const ip = normalizeIp(rawIp);
      if (
        ip === '127.0.0.1' || 
        ip.startsWith('192.168.') || 
        ip.startsWith('10.') || 
        ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
        ip.startsWith('172.20.') ||
        ip.toLowerCase().startsWith('fe80')
      ) {
        return 'LOCAL_NETWORK';
      }
      if (ip.startsWith('172.')) return 'LOCAL_NETWORK';
      return ip;
    };
    
    const ipStr = Array.isArray(clientIp) ? clientIp[0] : clientIp;
    const networkGroup = getNetworkGroup(ipStr);
    
    console.log(`[Socket] Connected: ${socket.id} | IP: ${ipStr} | Group: ${networkGroup}`);

    users.set(socket.id, {
      socketId: socket.id,
      username: 'Anonymous',
      ip: networkGroup,
    });
    
    if (!ipGroups.has(networkGroup)) {
      ipGroups.set(networkGroup, new Set());
    }
    ipGroups.get(networkGroup)!.add(socket.id);
    
    broadcastLanPeers(networkGroup);

    socket.on('update-presence', (data: { username: string; roomId?: string }) => {
      const user = users.get(socket.id);
      if (user) {
        user.username = data.username;
        user.roomId = data.roomId;
        broadcastLanPeers(user.ip);
      }
    });

    socket.on('join-room', (roomId: string) => {
      // Rate limiting (Flaw #4)
      if (!checkRateLimit(socket.id)) {
        socket.emit('rate-limited', { message: 'Too many join attempts. Please wait.' });
        return;
      }
      
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      const room = rooms.get(roomId)!;
      room.add(socket.id);

      socket.to(roomId).emit('user-joined', socket.id);
      const otherUsers = Array.from(room).filter(id => id !== socket.id);
      socket.emit('room-users', otherUsers);
    });

    socket.on('signal', (data: { to: string; signal: any }) => {
      io.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal,
      });
    });

    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user-left', socket.id);
          const room = rooms.get(roomId);
          if (room) {
            room.delete(socket.id);
            if (room.size === 0) {
              rooms.delete(roomId);
            }
          }
        }
      }
    });

    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        const group = ipGroups.get(user.ip);
        if (group) {
          group.delete(socket.id);
          if (group.size === 0) {
            ipGroups.delete(user.ip);
          } else {
            broadcastLanPeers(user.ip);
          }
        }
        users.delete(socket.id);
      }
      joinAttempts.delete(socket.id);
    });
  });

  expressApp.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
