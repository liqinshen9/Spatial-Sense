import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BoxGeometry, EdgesGeometry, Quaternion } from "three";
import type { Group } from "three";
import type { CubeDto } from "../types/puzzle";

type BlockOrientation = {
  x: number;
  y: number;
  z: number;
  w: number;
};

type PuzzleBlockCanvasProps = {
  cubes: CubeDto[];
  orientation?: BlockOrientation;
  size?: "target" | "main";
};

type CenteredCube = {
  x: number;
  y: number;
  z: number;
  colorIndex: number;
};

function getCssVariableValue(variableName: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

const boxGeometry = new BoxGeometry(1, 1, 1);
const edgeGeometry = new EdgesGeometry(boxGeometry);

const cubeColors = {
  blue: getCssVariableValue("--color-3d-cube-main"),
  yellow: getCssVariableValue("--color-3d-cube-accent"),
  edge: getCssVariableValue("--color-3d-edge"),
};

function getCenteredCubes(cubes: CubeDto[]): CenteredCube[] {
  if (cubes.length === 0) return [];

  const xs = cubes.map((cube) => cube.x);
  const ys = cubes.map((cube) => cube.y);
  const zs = cubes.map((cube) => cube.z);

  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;

  return cubes.map((cube) => ({
    x: cube.x - centerX,
    y: cube.y - centerY,
    z: cube.z - centerZ,
    colorIndex: cube.colorIndex ?? 0,
  }));
}

function orientationToQuaternion(orientation?: BlockOrientation) {
  if (!orientation) {
    return new Quaternion(0, 0, 0, 1);
  }

  return new Quaternion(
    orientation.x,
    orientation.y,
    orientation.z,
    orientation.w
  ).normalize();
}

function Cube({ cube }: { cube: CenteredCube }) {
  const cubeColor =
    cube.colorIndex === 1 ? cubeColors.yellow : cubeColors.blue;

  return (
    <group position={[cube.x, cube.y, cube.z]}>
      <mesh geometry={boxGeometry}>
        <meshStandardMaterial
          color={cubeColor}
          roughness={0.48}
          metalness={0.02}
          emissive={cubeColor}
          emissiveIntensity={0.025}
        />
      </mesh>

      <lineSegments geometry={edgeGeometry} scale={1.004} renderOrder={2}>
        <lineBasicMaterial
          color={cubeColors.edge}
          transparent={false}
          opacity={1}
          depthTest={true}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      <lineSegments geometry={edgeGeometry} scale={1.01} renderOrder={3}>
        <lineBasicMaterial
          color={cubeColors.edge}
          transparent={false}
          opacity={1}
          depthTest={true}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function BlockModel({
  cubes,
  orientation,
  size,
}: {
  cubes: CubeDto[];
  orientation?: BlockOrientation;
  size: "target" | "main";
}) {
  const groupRef = useRef<Group>(null);
  const centeredCubes = useMemo(() => getCenteredCubes(cubes), [cubes]);

  const targetQuaternion = useMemo(
    () => orientationToQuaternion(orientation),
    [orientation]
  );

  const fixedScale = size === "target" ? 0.62 : 0.86;

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.quaternion.slerp(targetQuaternion, 0.18);
  });

  return (
    <group ref={groupRef} scale={[fixedScale, fixedScale, fixedScale]}>
      {centeredCubes.map((cube, index) => (
        <Cube key={index} cube={cube} />
      ))}
    </group>
  );
}

function PuzzleBlockCanvas({
  cubes,
  orientation,
  size = "main",
}: PuzzleBlockCanvasProps) {
  const cubeColors = useMemo(
    () => ({
      blue: getCssVariableValue("--color-3d-cube-main"),
      yellow: getCssVariableValue("--color-3d-cube-accent"),
      edge: getCssVariableValue("--color-3d-edge"),
    }),
    []
  );

  return (
    <Canvas
      camera={{
        position: size === "target" ? [4.4, 3.6, 5.4] : [5.6, 4.5, 6.6],
        fov: size === "target" ? 38 : 42,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
    >
      <ambientLight intensity={1.15} />
      <directionalLight position={[5, 8, 6]} intensity={2.1} />
      <directionalLight position={[-4, 3, 5]} intensity={0.7} />

      <BlockModel cubes={cubes} orientation={orientation} size={size} />
    </Canvas>
  );
}

export default PuzzleBlockCanvas;