import { useOfficeStore } from '../store/officeStore';
import type { Freelancer, FreelancerRole } from '../types';

export function Sidebar() {
  const freelancers = useOfficeStore((s) => s.freelancers);
  const removeFromDesk = useOfficeStore((s) => s.removeFromDesk);
  const selectFreelancer = useOfficeStore((s) => s.selectFreelancer);
  const setCollaborationSpace = useOfficeStore((s) => s.setCollaborationSpace);

  // Split into special (always assigned) and regular freelancers
  const specialFreelancers = freelancers.filter((f) => f.isSpecial);
  const regularFreelancers = freelancers.filter((f) => !f.isSpecial);
  const unassignedRegular = regularFreelancers.filter((f) => f.deskPosition === null);
  const assignedRegular = regularFreelancers.filter((f) => f.deskPosition !== null);

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

  const handleDragStart = (e: React.DragEvent, freelancer: Freelancer) => {
    e.dataTransfer.setData('freelancerId', freelancer.id);
  };

  const handleFreelancerClick = (freelancer: Freelancer) => {
    if (freelancer.deskPosition) {
      selectFreelancer(freelancer.id);
      setCollaborationSpace(true);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '280px',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto',
        boxShadow: '4px 0 15px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
          💰 MoneyChat
        </h1>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
          Your AI Freelancer Office
        </p>
      </div>

      {/* Special Team */}
      <div>
        <h2
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#9ca3af',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Core Team
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {specialFreelancers.map((f) => (
            <div
              key={f.id}
              onClick={() => handleFreelancerClick(f)}
              style={{
                background:
                  f.role === 'orchestrator'
                    ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.3) 0%, rgba(123, 31, 162, 0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(233, 30, 99, 0.3) 0%, rgba(194, 24, 91, 0.3) 100%)',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: `3px solid ${f.role === 'orchestrator' ? '#9C27B0' : '#E91E63'}`,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: f.avatar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                {roleIcon[f.role]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{f.name}</div>
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  {f.role === 'orchestrator' ? 'Orchestrator' : 'Developer'}
                </div>
                {f.currentTask && (
                  <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px' }}>
                    {f.currentTask}
                  </div>
                )}
              </div>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: f.status === 'working' ? '#eab308' : '#22c55e',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Available Freelancers */}
      <div>
        <h2
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#9ca3af',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Available Freelancers ({unassignedRegular.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {unassignedRegular.map((f) => (
            <div
              key={f.id}
              draggable
              onDragStart={(e) => handleDragStart(e, f)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: f.avatar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                {roleIcon[f.role]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{f.name}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {f.role} • {f.trustLevel}
                </div>
              </div>
            </div>
          ))}
          {unassignedRegular.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>
              All freelancers are assigned
            </p>
          )}
        </div>
      </div>

      {/* At Work */}
      <div>
        <h2
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#9ca3af',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          At Work ({assignedRegular.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assignedRegular.map((f) => (
            <div
              key={f.id}
              onClick={() => handleFreelancerClick(f)}
              style={{
                background:
                  f.status === 'working'
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: `3px solid ${f.status === 'working' ? '#eab308' : '#22c55e'}`,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: f.avatar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                {roleIcon[f.role]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{f.name}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {f.currentTask || 'Idle'}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromDesk(f.id);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.3)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#fca5a5',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 'auto' }}>
        <h2
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#9ca3af',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            + Hire New Freelancer
          </button>
          <button
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '12px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            📋 View Task History
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
              {freelancers.reduce((sum, f) => sum + f.completedTasks, 0)}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Tasks Done</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {Math.round(
                (freelancers.reduce((sum, f) => sum + f.approvalRate, 0) /
                  freelancers.length) *
                  100
              )}
              %
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Approval Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
