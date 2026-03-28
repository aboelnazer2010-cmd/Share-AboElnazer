'use client';

import { useState } from 'react';
import { usePeerStore } from '@/store/usePeerStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useSocket } from '@/hooks/useSocket';
import { dict } from '@/lib/locales';
import { LandingScreen } from './LandingScreen';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { SettingsModal } from './SettingsModal';
import { CreateChannelModal } from './CreateChannelModal';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast, ToastContainer } from './Toast';

export default function NexusApp() {
  const {
    roomId, setRoomId, username, setUsername, sessionId,
    peers, lanPeers, channels, currentChannel, setCurrentChannel,
    language,
  } = usePeerStore();
  const t = dict[language];
  const isRtl = language === 'ar';

  const { toasts, addToast, removeToast } = useToast();
  const { socket, isConnected } = useSocket();
  const { messages, sendMessage, sendFile, createChannel } = useWebRTC(addToast);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  if (!roomId) {
    return (
      <>
        <LandingScreen />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <div
      className="flex h-screen bg-stone-950 text-stone-400 font-sans overflow-hidden relative selection:bg-amber-500/30 selection:text-amber-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[35%] h-[35%] bg-amber-500/3 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-orange-600/3 blur-[100px] rounded-full" />
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isRtl={isRtl}
        t={t}
        roomId={roomId}
        username={username}
        sessionId={sessionId}
        peers={peers}
        lanPeers={lanPeers}
        channels={channels}
        currentChannel={currentChannel}
        onChannelSelect={setCurrentChannel}
        onCreateChannel={() => setIsCreateChannelOpen(true)}
        onLeaveRoom={() => setIsLeaveConfirmOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onJoinRoom={(id) => {
          setRoomId(id);
          setIsSidebarOpen(false);
        }}
      />

      <ChatArea
        isRtl={isRtl}
        t={t}
        roomId={roomId}
        username={username}
        currentChannel={currentChannel}
        messages={messages}
        onSendMessage={sendMessage}
        onSendFile={sendFile}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentName={username}
        onSave={setUsername}
        t={t}
      />

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onCreate={createChannel}
        t={t}
      />

      <ConfirmDialog
        isOpen={isLeaveConfirmOpen}
        title={t.leaveRoom}
        message={t.leaveRoomConfirm}
        confirmLabel={t.confirm}
        cancelLabel={t.cancel}
        onConfirm={() => {
          setRoomId(null);
          setIsLeaveConfirmOpen(false);
        }}
        onCancel={() => setIsLeaveConfirmOpen(false)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
