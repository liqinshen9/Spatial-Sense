import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BoxGeometry, EdgesGeometry, MathUtils, Vector3, Euler, Quaternion } from "three";
import type { Group } from "three";

type CubePosition = [number, number, number];

type BlockTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

const baseBlockShape: CubePosition[] = [
  [0, 2, 0],
  [0, 1, 0],
  [0, 0, 0],
  [1, 0, 0],
  [2, 0, 0],
  [3, 0, 0],
  [3, -1, 0],
];

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

const boxGeometry = new BoxGeometry(1, 1, 1);
const edgeGeometry = new EdgesGeometry(boxGeometry);

function getCenteredCubes(cubes: CubePosition[]): CubePosition[] {
  const xs = cubes.map((cube) => cube[0]);
  const ys = cubes.map((cube) => cube[1]);
  const zs = cubes.map((cube) => cube[2]);

  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;

  return cubes.map(([x, y, z]) => [x - centerX, y - centerY, z - centerZ]);
}

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
          side={2}
        />
      </mesh>

      <lineSegments geometry={edgeGeometry} raycast={() => null}>
        <lineBasicMaterial color="#ffffff" />
      </lineSegments>
    </group>
  );
}

type BlockInstanceProps = {
  index: number;
  transform: BlockTransform;
};

function BlockInstance({ index, transform }: BlockInstanceProps) {
  const groupRef = useRef<Group>(null);
  const centeredCubes = useMemo(() => getCenteredCubes(baseBlockShape), []);
  const tmpPos = useRef(new Vector3());
  const tmpScale = useRef(new Vector3());
  const tmpEuler = useRef(new Euler());
  const tmpQuat = useRef(new Quaternion());

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const floatingRotation = Math.sin(time * 1.4 + index * 0.8) * 0.035;
    const floatingY = Math.sin(time * 1.2 + index * 0.9) * 0.08;
    const damping = 8;
    const t = 1 - Math.exp(-damping * Math.max(0, delta));

    tmpPos.current.set(transform.position[0], transform.position[1] + floatingY, transform.position[2]);
    tmpScale.current.set(transform.scale, transform.scale, transform.scale);
    tmpEuler.current.set(
      transform.rotation[0] + floatingRotation,
      transform.rotation[1] + floatingRotation,
      transform.rotation[2] + floatingRotation
    );
    tmpQuat.current.setFromEuler(tmpEuler.current);

    groupRef.current.position.lerp(tmpPos.current, t);
    groupRef.current.scale.lerp(tmpScale.current, t);
    groupRef.current.quaternion.slerp(tmpQuat.current, t);
  });

  return (
    <group ref={groupRef} position={transform.position} rotation={transform.rotation} scale={transform.scale}>
      {centeredCubes.map((cubePosition, cubeIndex) => (
        <Cube key={cubeIndex} position={cubePosition} />
      ))}
    </group>
  );
}

function HomeBlocks() {
  return (
    <div className="absolute inset-y-0 right-0 z-0 hidden w-[55%] sm:block">
      <Canvas orthographic shadows camera={{ position: [5, 5, 5], zoom: 78 }} className="pointer-events-none">
        <ambientLight intensity={1.45} />
        <directionalLight position={[5, 8, 6]} intensity={2.2} castShadow />
        <directionalLight position={[-4, 3, 5]} intensity={0.9} />

        <BlockInstance index={0} transform={blockTransforms[0]} />
        <BlockInstance index={1} transform={blockTransforms[1]} />
        <BlockInstance index={2} transform={blockTransforms[2]} />
      </Canvas>
    </div>
  );
}

export default HomeBlocks;