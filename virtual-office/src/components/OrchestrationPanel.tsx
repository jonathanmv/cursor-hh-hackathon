import { useOrchestrationStore, type ConversationPhase } from '../store/orchestrationStore';
import { useOfficeStore } from '../store/officeStore';

const phaseLabels: Record<ConversationPhase, string> = {
  gathering: 'Gathering Information',
  processing: 'Analyzing Request',
  generating: 'Creating Content',
  review: 'Awaiting Review',
  complete: 'Completed',
};

const phaseColors: Record<ConversationPhase, string> = {
  gathering: '#FFA726',
  processing: '#42A5F5',
  generating: '#AB47BC',
  review: '#66BB6A',
  complete: '#9E9E9E',
};

export function OrchestrationPanel() {
  const conversations = useOrchestrationStore((s) => s.conversations);
  const freelancers = useOfficeStore((s) => s.freelancers);

  const activeConversations = Array.from(conversations.values()).filter(
    (c) => c.phase !== 'complete'
  );

  if (activeConversations.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '320px',
        background: 'rgba(30, 30, 40, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>
        Active Orchestrations
      </h3>

      {activeConversations.map((conversation) => {
        const assignedFreelancer = conversation.assignedTo
          ? freelancers.find((f) => f.id === conversation.assignedTo)
          : null;

        return (
          <div
            key={conversation.id}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
            }}
          >
            {/* Phase indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: phaseColors[conversation.phase],
                  animation: conversation.phase !== 'complete' ? 'pulse 2s infinite' : undefined,
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>
                {phaseLabels[conversation.phase]}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                {conversation.intent !== 'unknown' && conversation.intent.toUpperCase()}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                marginBottom: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: getProgressWidth(conversation.phase),
                  background: phaseColors[conversation.phase],
                  transition: 'width 0.5s ease',
                }}
              />
            </div>

            {/* Collected fields */}
            {Object.keys(conversation.collectedFields).length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '6px',
                  }}
                >
                  Collected Information
                </div>
                {Object.entries(conversation.collectedFields).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      fontSize: '12px',
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{key}:</span>
                    <span style={{ color: 'white' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Assigned freelancer */}
            {assignedFreelancer && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: assignedFreelancer.avatar,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {assignedFreelancer.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>
                    {assignedFreelancer.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {assignedFreelancer.role}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 8px',
                    background: 'rgba(102, 187, 106, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#66BB6A',
                  }}
                >
                  Working
                </div>
              </div>
            )}

            {/* Recent messages */}
            {conversation.messages.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '6px',
                  }}
                >
                  Last Message
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {conversation.messages[conversation.messages.length - 1].content.slice(0, 100)}
                  {conversation.messages[conversation.messages.length - 1].content.length > 100 && '...'}
                </div>
              </div>
            )}

            {/* Newsletter preview link */}
            {conversation.result && conversation.phase === 'review' && (
              <div style={{ marginTop: '12px' }}>
                <a
                  href={`/review/${conversation.result.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '6px',
                    color: 'white',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  View Newsletter Preview
                </a>
              </div>
            )}
          </div>
        );
      })}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}

function getProgressWidth(phase: ConversationPhase): string {
  switch (phase) {
    case 'gathering':
      return '25%';
    case 'processing':
      return '50%';
    case 'generating':
      return '75%';
    case 'review':
      return '90%';
    case 'complete':
      return '100%';
    default:
      return '0%';
  }
}
