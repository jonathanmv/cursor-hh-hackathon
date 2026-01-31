import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useOfficeStore } from '../store/officeStore';
import type { Freelancer } from '../types';
import * as THREE from 'three';

interface FreelancerModelProps {
  freelancer: Freelancer;
}

export function FreelancerModel({ freelancer }: FreelancerModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const selectFreelancer = useOfficeStore((s) => s.selectFreelancer);
  const selectedFreelancer = useOfficeStore((s) => s.selectedFreelancer);
  const setCollaborationSpace = useOfficeStore((s) => s.setCollaborationSpace);

  const isSelected = selectedFreelancer === freelancer.id;
  const position = freelancer.deskPosition;

  // Idle animation - subtle bobbing when working
  useFrame((state) => {
    if (meshRef.current && freelancer.status === 'working') {
      meshRef.current.position.y =
        1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  if (!position) return null;

  const handleClick = () => {
    selectFreelancer(freelancer.id);
    setCollaborationSpace(true);
  };

  const statusColor = {
    idle: '#22c55e',
    working: '#eab308',
    'waiting-approval': '#f97316',
    offline: '#6b7280',
  }[freelancer.status];

  const roleIcon = {
    orchestrator: '📞',
    developer: '💻',
    copywriter: '✍️',
    accountant: '📊',
    researcher: '🔍',
    'sales-agent': '💼',
    'content-creator': '🎬',
    general: '🤖',
  }[freelancer.role];

  return (
    <group
      ref={meshRef}
      position={[position[0], 1.2, position[2] + 0.7]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
        <meshStandardMaterial color={freelancer.avatar} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ffd7b5" />
      </mesh>

      {/* Status indicator */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Selection ring */}
      {(isSelected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#3b82f6' : '#60a5fa'}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Name label on hover */}
      {hovered && (
        <Html position={[0, 1.2, 0]} center>
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {roleIcon} {freelancer.name}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {freelancer.role} • {freelancer.trustLevel}
            </div>
            <div style={{ fontSize: '11px', color: statusColor, marginTop: '4px' }}>
              {freelancer.status === 'working'
                ? `Working: ${freelancer.currentTask || 'Task'}`
                : freelancer.status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
