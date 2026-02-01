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

      {/* Area rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, -0.005, 1]} receiveShadow>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#d9d5cf" />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[2, -0.004, 1]}>
        {[
          { x: -2, z: -1.2, c: '#c4b6a6' },
          { x: 0.8, z: -1.2, c: '#b3b9bf' },
          { x: -2, z: 0.8, c: '#b3b9bf' },
          { x: 0.8, z: 0.8, c: '#c4b6a6' },
        ].map((tile, i) => (
          <mesh key={`rug-tile-${i}`} position={[tile.x, tile.z, 0]}>
            <planeGeometry args={[2, 1.6]} />
            <meshStandardMaterial color={tile.c} />
          </mesh>
        ))}
      </group>

      {/* Planters */}
      <group position={[-6.5, 0, -6]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.6, 0.9, 24]} />
          <meshStandardMaterial color="#c9c2b8" />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.65, 20, 20]} />
          <meshStandardMaterial color="#6f8b6f" />
        </mesh>
      </group>
      <group position={[7.5, 0, 4.5]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.45, 0.7, 24]} />
          <meshStandardMaterial color="#c9c2b8" />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <sphereGeometry args={[0.5, 20, 20]} />
          <meshStandardMaterial color="#7a9574" />
        </mesh>
      </group>

      {/* Low credenza */}
      <group position={[-4, 0.4, -8.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.5, 0.8, 0.8]} />
          <meshStandardMaterial color="#d6d0c6" />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[4.2, 0.2, 0.7]} />
          <meshStandardMaterial color="#c2bbb1" />
        </mesh>
      </group>

      {/* Wall art */}
      <group position={[3, 2.4, -9.9]}>
        <mesh>
          <boxGeometry args={[2.2, 1.4, 0.05]} />
          <meshStandardMaterial color="#f7f5f2" />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[2, 1.2, 0.01]} />
          <meshStandardMaterial color="#d6cfc4" />
        </mesh>
      </group>
      <group position={[-2.5, 2.4, -9.9]}>
        <mesh>
          <boxGeometry args={[1.2, 1.6, 0.05]} />
          <meshStandardMaterial color="#f7f5f2" />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[1, 1.4, 0.01]} />
          <meshStandardMaterial color="#c7c2bb" />
        </mesh>
      </group>
      <group position={[-0.6, 2.1, -9.9]}>
        <mesh>
          <boxGeometry args={[1, 1.1, 0.05]} />
          <meshStandardMaterial color="#f7f5f2" />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.8, 0.9, 0.01]} />
          <meshStandardMaterial color="#b9b0a3" />
        </mesh>
      </group>

      {/* Window frame */}
      <group position={[6.8, 2.2, -9.9]}>
        <mesh>
          <boxGeometry args={[3.2, 2.4, 0.06]} />
          <meshStandardMaterial color="#f2f1ec" />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[3, 2.2, 0.02]} />
          <meshStandardMaterial color="#b8d5e5" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Slatted accent panel */}
      <group position={[-9.9, 1.7, -3.5]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={`slat-${i}`} position={[0, -0.7 + i * 0.14, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[3.2, 0.1, 0.08]} />
            <meshStandardMaterial color="#c3b2a1" />
          </mesh>
        ))}
      </group>

      {/* Lounge corner */}
      <group position={[-6.5, 0.4, -2.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.6, 1.2]} />
          <meshStandardMaterial color="#c7cdd3" />
        </mesh>
        <mesh position={[-0.9, 0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.8, 1.2]} />
          <meshStandardMaterial color="#c0c7cd" />
        </mesh>
        <mesh position={[0, 0.7, -0.35]} castShadow>
          <boxGeometry args={[2.4, 0.5, 0.3]} />
          <meshStandardMaterial color="#b6bcc2" />
        </mesh>
      </group>
      <group position={[-5.3, 0.25, -1.1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.5, 0.7]} />
          <meshStandardMaterial color="#d6d0c6" />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#bdb6ab" />
        </mesh>
      </group>

      {/* Floating shelf with props */}
      <group position={[4.6, 2.8, -9.7]}>
        <mesh>
          <boxGeometry args={[4.2, 0.15, 0.3]} />
          <meshStandardMaterial color="#cdb9a5" />
        </mesh>
        {[
          { x: -1.5, y: 0.25, w: 0.5, h: 0.7, d: 0.2, c: '#d8d2c9' },
          { x: -0.7, y: 0.25, w: 0.4, h: 0.6, d: 0.2, c: '#b9b3aa' },
          { x: 0.6, y: 0.2, w: 0.35, h: 0.5, d: 0.2, c: '#d0cabf' },
          { x: 1.4, y: 0.2, w: 0.5, h: 0.4, d: 0.2, c: '#c2bbb1' },
        ].map((item, i) => (
          <mesh key={`shelf-item-${i}`} position={[item.x, item.y, 0.05]} castShadow>
            <boxGeometry args={[item.w, item.h, item.d]} />
            <meshStandardMaterial color={item.c} />
          </mesh>
        ))}
        <mesh position={[-0.1, 0.35, 0.05]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 16]} />
          <meshStandardMaterial color="#7f9b7c" />
        </mesh>
        <mesh position={[-0.1, 0.55, 0.05]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#6f8b6f" />
        </mesh>
      </group>

    </group>
  );
}
