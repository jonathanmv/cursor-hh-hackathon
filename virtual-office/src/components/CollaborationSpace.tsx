import { useState } from 'react';
import { useOfficeStore } from '../store/officeStore';

export function CollaborationSpace() {
  const selectedFreelancer = useOfficeStore((s) => s.selectedFreelancer);
  const freelancers = useOfficeStore((s) => s.freelancers);
  const tasks = useOfficeStore((s) => s.tasks);
  const telegramMessages = useOfficeStore((s) => s.telegramMessages);
  const setCollaborationSpace = useOfficeStore((s) => s.setCollaborationSpace);
  const updateFreelancer = useOfficeStore((s) => s.updateFreelancer);
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<
    { role: 'user' | 'ai'; content: string }[]
  >([]);
  const [output, setOutput] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const freelancer = freelancers.find((f) => f.id === selectedFreelancer);

  if (!freelancer) return null;

  // Get tasks assigned to this freelancer
  const freelancerTasks = tasks.filter((t) => t.assignedTo === freelancer.id);
  const completedTasks = freelancerTasks.filter((t) => t.status === 'completed');
  const inProgressTasks = freelancerTasks.filter((t) => t.status === 'in-progress');

  // Get current task context (from routed telegram message)
  const currentTaskMessage = inProgressTasks.length > 0
    ? telegramMessages.find((m) => m.id === inProgressTasks[0].sourceMessageId)
    : null;

  const roleIcon: Record<string, string> = {
    orchestrator: '📞',
    developer: '💻',
    copywriter: '✍️',
    accountant: '📊',
    researcher: '🔍',
    'sales-agent': '💼',
    'content-creator': '🎬',
    general: '🤖',
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    setConversation((prev) => [...prev, { role: 'user', content: input }]);

    // Update freelancer status
    updateFreelancer(freelancer.id, {
      status: 'working',
      currentTask: input.slice(0, 50) + '...',
    });

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        orchestrator:
          "Ich habe deine Nachricht erhalten! Lass mich analysieren, an wen ich das weiterleiten soll...",
        developer:
          "Verstanden! Ich werde die Infrastruktur entsprechend anpassen. Hier ist mein Plan...",
        copywriter:
          "I'll draft that for you! Here's my initial version based on your brand voice...",
        accountant:
          "I've analyzed the numbers. Here's a breakdown of your finances...",
        researcher:
          "I found some interesting insights. Let me share my research findings...",
        'sales-agent':
          "I've reviewed the contract terms. Here are my recommendations...",
        'content-creator':
          "Here are 5 content ideas based on your recent performance data...",
        general: "I'm on it! Here's what I've put together for you...",
      };

      setConversation((prev) => [
        ...prev,
        { role: 'ai', content: responses[freelancer.role] || responses.general },
      ]);

      // Generate sample output
      if (freelancer.role === 'copywriter') {
        setOutput(`# Newsletter Draft

## Subject: Your Weekly Gut Health Update 🌱

Hey there!

This week has been incredible! I've been diving deep into the connection between gut health and mental clarity, and I can't wait to share what I've learned.

**3 Quick Tips:**
1. Start your morning with warm lemon water
2. Add fermented foods to at least one meal
3. Take a 10-minute walk after dinner

What's working for you? Reply and let me know!

With love,
Chiara ❤️

---
*Unsubscribe | Update preferences*`);
      }

      updateFreelancer(freelancer.id, {
        status: 'waiting-approval',
      });
    }, 1500);

    setInput('');
  };

  const handleApprove = () => {
    updateFreelancer(freelancer.id, {
      status: 'idle',
      currentTask: null,
      completedTasks: freelancer.completedTasks + 1,
    });
    setOutput(null);
    setConversation((prev) => [
      ...prev,
      { role: 'ai', content: '✅ Great! The output has been approved and is ready to use.' },
    ]);
  };

  const handleReject = () => {
    updateFreelancer(freelancer.id, {
      status: 'working',
    });
    setConversation((prev) => [
      ...prev,
      {
        role: 'ai',
        content:
          "No problem! I'll revise this. What specific changes would you like me to make?",
      },
    ]);
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '500px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: freelancer.avatar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          {roleIcon[freelancer.role]}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {freelancer.name}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            {freelancer.role} • {freelancer.trustLevel} •{' '}
            {Math.round(freelancer.approvalRate * 100)}% approval
          </p>
        </div>
        <button
          onClick={() => setCollaborationSpace(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af',
          }}
        >
          ×
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        <button
          onClick={() => setShowHistory(false)}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: !showHistory ? 'white' : 'transparent',
            borderBottom: !showHistory ? '2px solid #3b82f6' : '2px solid transparent',
            fontWeight: !showHistory ? '600' : '400',
            color: !showHistory ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
          }}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setShowHistory(true)}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: showHistory ? 'white' : 'transparent',
            borderBottom: showHistory ? '2px solid #3b82f6' : '2px solid transparent',
            fontWeight: showHistory ? '600' : '400',
            color: showHistory ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
          }}
        >
          📋 History ({completedTasks.length})
        </button>
      </div>

      {/* Content Area - Split View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* History View */}
        {showHistory ? (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
              Task History
            </h3>
            {freelancerTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px' }}>
                <p>No tasks assigned yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {freelancerTasks.map((task) => {
                  const sourceMsg = telegramMessages.find((m) => m.id === task.sourceMessageId);
                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: '12px',
                        background: task.status === 'completed' ? '#f0fdf4' : '#fefce8',
                        borderRadius: '8px',
                        border: `1px solid ${task.status === 'completed' ? '#86efac' : '#fde047'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '⏳' : '📝'}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: task.status === 'completed' ? '#22c55e' : '#eab308',
                            color: 'white',
                          }}
                        >
                          {task.status}
                        </span>
                        {sourceMsg && (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            from {sourceMsg.from}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>
                        {task.description}
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#9ca3af' }}>
                        {task.createdAt instanceof Date
                          ? task.createdAt.toLocaleString()
                          : new Date(task.createdAt).toLocaleString()}
                        {task.completedAt && (
                          <> → Completed {task.completedAt instanceof Date
                            ? task.completedAt.toLocaleString()
                            : new Date(task.completedAt).toLocaleString()}</>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
        /* Chat View */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: output ? '1px solid #e5e7eb' : 'none',
          }}
        >
          {/* Current Task Banner */}
          {currentTaskMessage && (
            <div
              style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderBottom: '1px solid #f59e0b',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                📨 Working on message from {currentTaskMessage.from}
              </div>
              <div style={{ color: '#92400e' }}>{currentTaskMessage.content}</div>
            </div>
          )}

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {conversation.length === 0 && !currentTaskMessage && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  marginTop: '40px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {roleIcon[freelancer.role]}
                </div>
                <p>Start a conversation with {freelancer.name}</p>
                <p style={{ fontSize: '13px' }}>
                  Describe what you need help with
                </p>
              </div>
            )}
            {conversation.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                }}
              >
                {msg.content}
              </div>
            ))}
            {freelancer.status === 'working' && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  borderRadius: '16px',
                  color: '#6b7280',
                }}
              >
                <span className="typing-indicator">Working on it...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Tell ${freelancer.name} what you need...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
        )}

        {/* Output Preview */}
        {output && (
          <div
            style={{
              width: '50%',
              display: 'flex',
              flexDirection: 'column',
              background: '#fafafa',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              📄 Output Preview
            </div>
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
                background: 'white',
                margin: '8px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              {output}
            </div>
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <button
                onClick={handleReject}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'white',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ❌ Revise
              </button>
              <button
                onClick={handleApprove}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ✅ Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
