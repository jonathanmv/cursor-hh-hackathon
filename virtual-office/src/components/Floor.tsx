export function Floor() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e8e4de" />
      </mesh>

      {/* Grid lines for office floor effect */}
      {Array.from({ length: 21 }).map((_, i) => (
        <group key={`grid-${i}`}>
          <mesh position={[-10 + i, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.02, 20]} />
            <meshBasicMaterial color="#d0ccc4" />
          </mesh>
          <mesh position={[0, 0, -10 + i]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.02, 20]} />
            <meshBasicMaterial color="#d0ccc4" />
          </mesh>
        </group>
      ))}

      {/* Walls */}
      <mesh position={[0, 2, -10]} receiveShadow>
        <boxGeometry args={[20, 4, 0.2]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      <mesh position={[-10, 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, 4, 20]} />
        <meshStandardMaterial color="#f0f0eb" />
      </mesh>
    </group>
  );
}
