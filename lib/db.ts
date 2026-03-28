import Dexie, { type EntityTable } from 'dexie';

export interface Message {
  id?: number;
  sender: string;
  content?: string;
  timestamp: number;
  roomId: string;
  channelId: string;
  type: 'chat' | 'file';
  url?: string;
  name?: string;
  size?: number;
}

export interface FileTransfer {
  id?: number;
  name: string;
  size: number;
  sender: string;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  roomId: string;
  sessionId: string;
  progress: number;
  data?: Blob;
}

const db = new Dexie('NexusP2P') as Dexie & {
  files: EntityTable<FileTransfer, 'id'>;
};

db.version(5).stores({
  files: '++id, name, sender, roomId, sessionId, status, [roomId+sessionId]'
}).upgrade(tx => {
  return tx.table('files').toCollection().modify(file => {
    file.sessionId = file.sessionId || 'legacy';
  });
});

export { db };
