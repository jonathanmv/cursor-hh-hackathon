import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Floor } from './Floor';
import { Desk } from './Desk';
import { FreelancerModel } from './FreelancerModel';
import { useOfficeStore } from '../store/officeStore';

export function Office() {
  const desks = useOfficeStore((s) => s.desks);
  const freelancers = useOfficeStore((s) => s.freelancers);

  const assignedFreelancers = freelancers.filter((f) => f.deskPosition !== null);

  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={25}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />

      {/* Floor */}
      <Floor />

      {/* Desks */}
      {desks.map((desk) => (
        <Desk key={desk.id} desk={desk} />
      ))}

      {/* Freelancers at desks */}
      {assignedFreelancers.map((freelancer) => (
        <FreelancerModel key={freelancer.id} freelancer={freelancer} />
      ))}
    </Canvas>
  );
}
