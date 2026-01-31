import { useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useOfficeStore } from '../store/officeStore';
import type { Desk as DeskType } from '../types';

interface DeskProps {
  desk: DeskType;
}

export function Desk({ desk }: DeskProps) {
  const [hovered, setHovered] = useState(false);
  const assignToDesk = useOfficeStore((s) => s.assignToDesk);
  const freelancers = useOfficeStore((s) => s.freelancers);

  const unassignedFreelancers = freelancers.filter((f) => f.deskPosition === null);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!desk.occupied && unassignedFreelancers.length > 0) {
      // Assign first available freelancer
      assignToDesk(unassignedFreelancers[0].id, desk.id);
    }
  };

  return (
    <group position={desk.position}>
      {/* Desk surface */}
      <mesh
        position={[0, 0.75, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.5, 0.05, 0.8]} />
        <meshStandardMaterial
          color={hovered && !desk.occupied ? '#a8d5ff' : '#8b7355'}
        />
      </mesh>

      {/* Desk legs */}
      {[
        [-0.65, 0.375, -0.3],
        [0.65, 0.375, -0.3],
        [-0.65, 0.375, 0.3],
        [0.65, 0.375, 0.3],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#6b5344" />
        </mesh>
      ))}

      {/* Computer monitor */}
      <mesh position={[0, 1.1, -0.2]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.03]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Monitor screen */}
      <mesh position={[0, 1.1, -0.18]}>
        <planeGeometry args={[0.45, 0.3]} />
        <meshBasicMaterial color={desk.occupied ? '#4ade80' : '#1a1a2e'} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Chair */}
      <mesh position={[0, 0.5, 0.7]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={desk.occupied ? '#2563eb' : '#404040'} />
      </mesh>
      {/* Chair back */}
      <mesh position={[0, 0.9, 0.9]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.1]} />
        <meshStandardMaterial color={desk.occupied ? '#1d4ed8' : '#333'} />
      </mesh>

      {/* Desk indicator - shows if empty and clickable */}
      {!desk.occupied && unassignedFreelancers.length > 0 && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
