import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Tips } from "@icon-park/react";
import {
  BoxGeometry,
  EdgesGeometry,
  Quaternion,
  Vector3,
  type Group,
} from "three";
import type { BlockOrientation, CubeDto } from "../types/puzzle";

type Vec3 = [number, number, number];

type RotationTipProps = {
  cubes: CubeDto[];
  orientation: BlockOrientation;
};

type RotationTipModalProps = {
  cubes: CubeDto[];
  orientation: BlockOrientation;
  onClose: () => void;
};

function orientationToQuaternion(orientation: BlockOrientation) {
  return new Quaternion(
    orientation.x,
    orientation.y,
    orientation.z,
    orientation.w
  ).normalize();
}

function quaternionToOrientation(quaternion: Quaternion): BlockOrientation {
  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

function getExampleYAxisOrientation(orientation: BlockOrientation) {
  const currentQuaternion = orientationToQuaternion(orientation);

  const yRotationQuaternion = new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    Math.PI / 2
  );

  const nextQuaternion = yRotationQuaternion
    .multiply(currentQuaternion)
    .normalize();

  return quaternionToOrientation(nextQuaternion);
}

function getCenteredCubes(cubes: CubeDto[]) {
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

function AxisLine({
  start,
  end,
  color,
}: {
  start: Vec3;
  end: Vec3;
  color: string;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const startVector = new Vector3(...start);
    const endVector = new Vector3(...end);

    const direction = new Vector3().subVectors(endVector, startVector);
    const lineLength = direction.length();

    const midpoint = new Vector3()
      .addVectors(startVector, endVector)
      .multiplyScalar(0.5);

    const lineQuaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    return {
      position: midpoint,
      quaternion: lineQuaternion,
      length: lineLength,
    };
  }, [start, end]);

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={20}>
      <cylinderGeometry args={[0.025, 0.025, length, 14]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        transparent
        opacity={0.95}
        depthTest={false}
      />
    </mesh>
  );
}

function AxisArrow({
  position,
  direction,
  color,
}: {
  position: Vec3;
  direction: Vec3;
  color: string;
}) {
  const quaternion = useMemo(() => {
    return new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      new Vector3(...direction).normalize()
    );
  }, [direction]);

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={20}>
      <coneGeometry args={[0.1, 0.28, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        depthTest={false}
      />
    </mesh>
  );
}

function AxisGuide() {
  return (
    <group>
      <AxisLine start={[-3.1, 0, 0]} end={[3.1, 0, 0]} color="#ffffff" />
      <AxisLine start={[0, -3.1, 0]} end={[0, 3.1, 0]} color="#fffa17" />
      <AxisLine start={[0, 0, -3.1]} end={[0, 0, 3.1]} color="#00d4ff" />

      <AxisArrow
        position={[3.28, 0, 0]}
        direction={[1, 0, 0]}
        color="#ffffff"
      />

      <AxisArrow
        position={[0, 3.28, 0]}
        direction={[0, 1, 0]}
        color="#fffa17"
      />

      <AxisArrow
        position={[0, 0, 3.28]}
        direction={[0, 0, 1]}
        color="#00d4ff"
      />
    </group>
  );
}

function CubePiece({
  position,
  color,
}: {
  position: Vec3;
  color: string;
}) {
  const boxGeometry = useMemo(() => {
    return new BoxGeometry(0.95, 0.95, 0.95);
  }, []);

  const edgeGeometry = useMemo(() => {
    return new EdgesGeometry(boxGeometry);
  }, [boxGeometry]);

  return (
    <group position={position}>
      <mesh geometry={boxGeometry}>
        <meshStandardMaterial
          color={color}
          roughness={0.48}
          metalness={0.04}
        />
      </mesh>

      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </lineSegments>
    </group>
  );
}

function BlockTree({
  cubes,
  orientation,
}: {
  cubes: CubeDto[];
  orientation: BlockOrientation;
}) {
  const groupRef = useRef<Group | null>(null);

  const centeredCubes = useMemo(() => {
    return getCenteredCubes(cubes);
  }, [cubes]);

  const quaternion = useMemo(() => {
    return orientationToQuaternion(orientation);
  }, [orientation]);

  const blockScale = useMemo(() => {
    if (centeredCubes.length === 0) return 0.8;

    const xs = centeredCubes.map((cube) => cube.x);
    const ys = centeredCubes.map((cube) => cube.y);
    const zs = centeredCubes.map((cube) => cube.z);

    const width = Math.max(...xs) - Math.min(...xs) + 1;
    const height = Math.max(...ys) - Math.min(...ys) + 1;
    const depth = Math.max(...zs) - Math.min(...zs) + 1;

    const maxSize = Math.max(width, height, depth);

    if (maxSize >= 4) return 0.62;
    if (maxSize >= 3) return 0.72;
    return 0.86;
  }, [centeredCubes]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    groupRef.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.035;
  });

  return (
    <group ref={groupRef} quaternion={quaternion} scale={blockScale}>
      {centeredCubes.map((cube, index) => {
        const color = cube.colorIndex === 1 ? "#fffa17" : "#002fa5";

        return (
          <CubePiece
            key={`${cube.x}-${cube.y}-${cube.z}-${index}`}
            position={[cube.x, cube.y, cube.z]}
            color={color}
          />
        );
      })}
    </group>
  );
}

function BlockPreviewCanvas({
  title,
  cubes,
  orientation,
  isResult = false,
}: {
  title: string;
  cubes: CubeDto[];
  orientation: BlockOrientation;
  isResult?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border bg-[var(--color-leaderboard-card)] ${
        isResult
          ? "border-2 border-[var(--color-emphasis)] shadow-[0_0_18px_var(--color-emphasis)]"
          : "border-[var(--color-nav-border)]"
      }`}
    >
      <div className="absolute left-4 top-4 z-10 rounded-full bg-[var(--color-bg-primary)]/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-primary)]">
        {title}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 text-2xl font-black text-[var(--color-emphasis)] drop-shadow-[0_0_8px_var(--color-emphasis)]">
        Y
      </div>

      <div className="pointer-events-none absolute right-6 top-1/2 z-10 -translate-y-1/2 text-2xl font-black text-white drop-shadow-[0_0_8px_white]">
        X
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-2xl font-black text-[#00d4ff] drop-shadow-[0_0_8px_#00d4ff]">
        Z
      </div>

      <div className="h-[220px] sm:h-[260px] lg:h-[320px]">
        <Canvas
          camera={{
            position: [4.2, 3.2, 5.2],
            fov: 42,
          }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={1.75} />
          <directionalLight position={[4, 6, 6]} intensity={1.3} />
          <directionalLight position={[-4, 2, -3]} intensity={0.45} />

          <BlockTree cubes={cubes} orientation={orientation} />
          <AxisGuide />
        </Canvas>
      </div>
    </div>
  );
}

function RotationControlsPreview() {
  return (
    <div className="rounded-[24px] border border-[var(--color-nav-border)] bg-[var(--color-bg-primary)]/80 p-4 text-center shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)]">
        Rotation Step
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {["-90°", "-45°", "45°", "90°"].map((angle) => {
          const isActive = angle === "90°";

          return (
            <div
              key={angle}
              className={`rounded-lg px-2 py-2 text-xs font-black ${
                isActive
                  ? "bg-[var(--color-emphasis)] text-[var(--color-emphasis-contrast)]"
                  : "border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)]"
              }`}
            >
              {angle}
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-2 py-2 text-xs font-black text-[var(--color-text-primary)]">
          Rotate X
        </div>

        <div className="rounded-lg bg-[var(--color-emphasis)] px-2 py-2 text-xs font-black text-[var(--color-emphasis-contrast)]">
          Rotate Y
        </div>

        <div className="rounded-lg border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-2 py-2 text-xs font-black text-[var(--color-text-primary)]">
          Rotate Z
        </div>
      </div>

      <p className="mt-4 text-xs font-black leading-5 text-[var(--color-emphasis)]">
        Example: 90° around Y axis
      </p>
    </div>
  );
}

function RotationTipModal({
  cubes,
  orientation,
  onClose,
}: RotationTipModalProps) {
  const yRotationResult = useMemo(() => {
    return getExampleYAxisOrientation(orientation);
  }, [orientation]);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[var(--color-nav-bg)] px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl rounded-[32px] border border-[var(--color-nav-border)] bg-[var(--color-bg-primary)] p-5 text-[var(--color-text-primary)] shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-nav-border)] pb-5">
          <div className="min-w-0 flex-1 text-center">
            <h2 className="text-2xl font-black sm:text-3xl">
              How to Play?
            </h2>

            <p className="mt-4 text-sm font-bold leading-6 opacity-80 sm:text-base">
              This example shows what happens when you rotate the current block
              90° around the Y axis.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-leaderboard-row)] text-3xl leading-none text-[var(--color-text-primary)] transition hover:text-[var(--color-emphasis)]"
            aria-label="Close rotation tip"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_300px_minmax(0,1fr)]">
          <BlockPreviewCanvas
            title="Current Block"
            cubes={cubes}
            orientation={orientation}
          />

          <RotationControlsPreview />

          <BlockPreviewCanvas
            title="After Rotate Y"
            cubes={cubes}
            orientation={yRotationResult}
            isResult
          />
        </div>
      </div>
    </div>
  );
}

function RotationTip({ cubes, orientation }: RotationTipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--color-emphasis)] bg-[var(--color-bg-primary)] text-[var(--color-emphasis)] shadow-[0_0_14px_var(--color-emphasis)] transition hover:scale-105 hover:bg-[var(--color-emphasis)] hover:text-[var(--color-emphasis-contrast)]"
        aria-label="Show rotation tip"
      >
        <Tips theme="outline" size="22" strokeWidth={4} />
      </button>

      {isOpen && (
        <RotationTipModal
          cubes={cubes}
          orientation={orientation}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default RotationTip;