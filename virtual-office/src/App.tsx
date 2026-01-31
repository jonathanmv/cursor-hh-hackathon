import { useEffect } from 'react';
import { Office } from './components/Office';
import { Sidebar } from './components/Sidebar';
import { CollaborationSpace } from './components/CollaborationSpace';
import { MessageInbox } from './components/MessageInbox';
import { useOfficeStore } from './store/officeStore';
import { openclawService } from './services/openclawService';

function App() {
  const showCollaborationSpace = useOfficeStore((s) => s.showCollaborationSpace);
  const isConnected = useOfficeStore((s) => s.isConnected);

  // Connect to OpenClaw on mount
  useEffect(() => {
    openclawService.connect();
    return () => openclawService.disconnect();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 3D Office View */}
      <div
        style={{
          position: 'absolute',
          left: '280px',
          right: showCollaborationSpace ? '500px' : 0,
          top: 0,
          bottom: 0,
          transition: 'right 0.3s ease',
        }}
      >
        <Office />
      </div>

      {/* Left Sidebar - Freelancer List */}
      <Sidebar />

      {/* Right Panel - Collaboration Space */}
      {showCollaborationSpace && <CollaborationSpace />}

      {/* Message Inbox - Orchestrator's view */}
      <MessageInbox />

      {/* Instructions overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '300px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#ef4444',
            }}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span>🖱️ Drag to rotate</span>
        <span>📍 Click desk to assign</span>
        <span>👤 Click freelancer to chat</span>
      </div>
    </div>
  );
}

export default App;
