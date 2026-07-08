import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { BoxGeometry, EdgesGeometry, MathUtils, Vector3 } from "three";
import type { Group } from "three";

//a cube position in 3D space: [x, y, z]
type CubePosition = [number, number, number];

//each block instance has its own position, rotation, and scale
//all three blocks have the same shape, but different transforms
type BlockTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};


type BlockInstanceProps = {
  initialTransformIndex: number;
};

// Base block shape, made of 7 cubes:
//
// X
// X
// X X X X
//       X
const baseBlockShape: CubePosition[] = [
  [0, 2, 0],
  [0, 1, 0],
  [0, 0, 0],

  [1, 0, 0],
  [2, 0, 0],
  [3, 0, 0],

  [3, -1, 0],
];

// When the player clicks a block, it moves to the next transform.
const blockTransforms: BlockTransform[] = [
  {
    position: [-1.35, 1.85, 0],
    rotation: [
      MathUtils.degToRad(22),
      MathUtils.degToRad(45),
      MathUtils.degToRad(-32),
    ],
    scale: 0.72,
  },
  {
    position: [2.55, 0.45, 0],
    rotation: [
      MathUtils.degToRad(18),
      MathUtils.degToRad(135),
      MathUtils.degToRad(26),
    ],
    scale: 0.56,
  },
  {
    position: [-1.2, -2.65, 0],
    rotation: [
      MathUtils.degToRad(24),
      MathUtils.degToRad(-45),
      MathUtils.degToRad(38),
    ],
    scale: 0.78,
  },
];

// Shared cube geometry.
// This avoids creating a new BoxGeometry for every single cube.
const boxGeometry = new BoxGeometry(1, 1, 1);
const edgeGeometry = new EdgesGeometry(boxGeometry);

// Without this, the block rotates around one corner/end.
// After centering, the block rotates around its own centre.
function getCenteredCubes(cubes: CubePosition[]): CubePosition[] {
  const xs = cubes.map((cube) => cube[0]);
  const ys = cubes.map((cube) => cube[1]);
  const zs = cubes.map((cube) => cube[2]);

  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;

  return cubes.map(([x, y, z]) => [
    x - centerX,
    y - centerY,
    z - centerZ,
  ]);
}

// Renders one cube with a light blue fill and white outline.
function Cube({ position }: { position: CubePosition }) {
  return (
    <group position={position}>
      <mesh geometry={boxGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#8ee7ff"
          roughness={0.42}
          metalness={0.02}
          emissive="#00aee6"
          emissiveIntensity={0.08}
        />
      </mesh>

      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#ffffff" />
      </lineSegments>
    </group>
  );
}

// Renders one full block.
// All blocks use the same baseBlockShape, but each starts from a different transform.
function BlockInstance({ initialTransformIndex }: BlockInstanceProps) {
  const groupRef = useRef<Group>(null);
  const [transformIndex, setTransformIndex] = useState(initialTransformIndex);

  const centeredCubes = useMemo(() => getCenteredCubes(baseBlockShape), []);
  const targetTransform = blockTransforms[transformIndex];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    const time = clock.getElapsedTime();

    const floatingRotation =
      Math.sin(time * 1.4 + initialTransformIndex * 0.8) * 0.035;

    const floatingY =
      Math.sin(time * 1.2 + initialTransformIndex * 0.9) * 0.08;

    group.position.lerp(
      new Vector3(
        targetTransform.position[0],
        targetTransform.position[1] + floatingY,
        targetTransform.position[2]
      ),
      0.08
    );

    group.rotation.x = MathUtils.lerp(
      group.rotation.x,
      targetTransform.rotation[0] + floatingRotation,
      0.08
    );

    group.rotation.y = MathUtils.lerp(
      group.rotation.y,
      targetTransform.rotation[1] + floatingRotation,
      0.08
    );

    group.rotation.z = MathUtils.lerp(
      group.rotation.z,
      targetTransform.rotation[2],
      0.08
    );

    group.scale.lerp(
      new Vector3(
        targetTransform.scale,
        targetTransform.scale,
        targetTransform.scale
      ),
      0.08
    );
  });

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();

    setTransformIndex((currentIndex) => {
      return (currentIndex + 1) % blockTransforms.length;
    });
  }

  return (
    <group
      ref={groupRef}
      position={blockTransforms[initialTransformIndex].position}
      rotation={blockTransforms[initialTransformIndex].rotation}
      scale={blockTransforms[initialTransformIndex].scale}
      onClick={handleClick}
    >
      {centeredCubes.map((cubePosition, index) => (
        <Cube key={index} position={cubePosition} />
      ))}
    </group>
  );
}

// Creates the Three.js area on the homepage.
// It contains the camera, lights, and three copies of the same block.
function HomeBlocks() {
  return (
    <div className="absolute inset-y-0 right-0 z-0 hidden w-[55%] sm:block">
      <Canvas
        orthographic
        shadows
        camera={{
          position: [5, 5, 5],
          zoom: 78,
        }}
        className="cursor-pointer"
      >
        <ambientLight intensity={1.45} />

        <directionalLight position={[5, 8, 6]} intensity={2.2} castShadow />
        <directionalLight position={[-4, 3, 5]} intensity={0.9} />

        <BlockInstance initialTransformIndex={0} />
        <BlockInstance initialTransformIndex={1} />
        <BlockInstance initialTransformIndex={2} />
      </Canvas>
    </div>
  );
}

export default HomeBlocks;