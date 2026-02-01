import { useOfficeStore } from '../store/officeStore';
import type { TelegramMessage, FreelancerRole, TelegramMessageType } from '../types';

// Sample messages for demo purposes
const sampleMessages = [
  { from: 'Chiara', type: 'text' as TelegramMessageType, content: 'Can you write a newsletter about gut health for my audience?' },
  { from: 'Chiara', type: 'voice' as TelegramMessageType, content: '[Voice message] Hey, I need help with my taxes for Q4...' },
  { from: 'Chiara', type: 'photo' as TelegramMessageType, content: '[Photo] Can you make this into a social media post?' },
  { from: 'Chiara', type: 'text' as TelegramMessageType, content: 'Research the top 5 competitors in the wellness space' },
  { from: 'Chiara', type: 'text' as TelegramMessageType, content: 'Update the website to show the new pricing' },
];

export function MessageInbox() {
  const telegramMessages = useOfficeStore((s) => s.telegramMessages);
  const freelancers = useOfficeStore((s) => s.freelancers);
  const routeTelegramMessage = useOfficeStore((s) => s.routeTelegramMessage);
  const addTelegramMessage = useOfficeStore((s) => s.addTelegramMessage);
  const isConnected = useOfficeStore((s) => s.isConnected);

  const unprocessedMessages = telegramMessages.filter((m) => !m.processed);
  const availableFreelancers = freelancers.filter(
    (f) => f.status === 'idle' && f.role !== 'orchestrator'
  );

  const messageTypeIcon: Record<string, string> = {
    text: '💬',
    voice: '🎤',
    photo: '📷',
    video: '🎥',
    document: '📄',
  };

  const roleIcon: Record<FreelancerRole, string> = {
    orchestrator: '📞',
    developer: '💻',
    copywriter: '✍️',
    accountant: '📊',
    researcher: '🔍',
    'sales-agent': '💼',
    'content-creator': '🎬',
    general: '🤖',
  };

  const handleRoute = (message: TelegramMessage, freelancerId: string) => {
    routeTelegramMessage(message.id, freelancerId);
  };

  const simulateMessage = () => {
    const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    addTelegramMessage({
      chatId: 'demo-123',
      from: randomMessage.from,
      type: randomMessage.type,
      content: randomMessage.content,
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '300px',
        width: '350px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📞</span>
          <span style={{ fontWeight: '600' }}>Orchestrator - Alex</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={simulateMessage}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Simulate incoming message"
          >
            +
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#4ade80' : '#ef4444',
              }}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}
      >
        {unprocessedMessages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#9ca3af',
              padding: '24px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <p>No new messages</p>
            <p style={{ fontSize: '12px', marginBottom: '16px' }}>
              Messages from Telegram will appear here
            </p>
            <button
              onClick={simulateMessage}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Simulate Telegram Message
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...unprocessedMessages].reverse().map((message) => (
              <div
                key={message.id}
                style={{
                  background: '#f9fafb',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span>{messageTypeIcon[message.type]}</span>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>
                    {message.from}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: '#374151',
                  }}
                >
                  {message.content}
                </p>

                {/* Route buttons */}
                <div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '8px',
                    }}
                  >
                    Route to:
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    {availableFreelancers.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleRoute(message, f.id)}
                        style={{
                          padding: '6px 10px',
                          background: f.avatar,
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {roleIcon[f.role]} {f.name}
                      </button>
                    ))}
                    {availableFreelancers.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        No available freelancers
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent routed */}
      {telegramMessages.filter((m) => m.processed).length > 0 && (
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid #e5e7eb',
            background: '#fafafa',
          }}
        >
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Recently routed:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {telegramMessages
              .filter((m) => m.processed)
              .slice(-3)
              .reverse()
              .map((m) => {
                const freelancer = freelancers.find((f) => f.id === m.routedTo);
                return (
                  <div
                    key={m.id}
                    style={{
                      fontSize: '12px',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ color: '#9ca3af' }}>→</span>
                    <span>{m.content.slice(0, 25)}...</span>
                    <span style={{ color: freelancer?.avatar }}>
                      {freelancer?.name}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
