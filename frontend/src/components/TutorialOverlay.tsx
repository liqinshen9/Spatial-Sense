import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  BoxGeometry,
  EdgesGeometry,
  Quaternion,
  Vector3,
} from "three";

export type TutorialStep = {
  route: string;
  target: string;
  title: string;
  description: string;
  visual?: "rotation-demo";
};

type TutorialOverlayProps = {
  steps: TutorialStep[];
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipSize = {
  width: number;
  height: number;
};

type Vec3 = [number, number, number];

function getCssVariableValue(variableName: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

const currentRotation = new Quaternion();

const resultRotation = new Quaternion().setFromAxisAngle(
  new Vector3(0, 1, 0),
  Math.PI / 2
);

const demoBlockPositions: Vec3[] = [
  [-1, -1, 0],
  [0, -1, 0],
  [-1, 0, 0],
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [1, 2, 0],
  [0, 2, 0],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
    <mesh position={position} quaternion={quaternion} renderOrder={10}>
      <cylinderGeometry args={[0.018, 0.018, length, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} />
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
    <mesh position={position} quaternion={quaternion} renderOrder={10}>
      <coneGeometry args={[0.07, 0.2, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function SimpleAxisGuide() {
  const axisColors = useMemo(
    () => ({
      x: getCssVariableValue("--color-axis-x"),
      y: getCssVariableValue("--color-axis-y"),
      z: getCssVariableValue("--color-axis-z"),
    }),
    []
  );

  return (
    <group>
      <AxisLine start={[-2.75, 0, 0]} end={[2.75, 0, 0]} color={axisColors.x} />
      <AxisLine start={[0, -2.75, 0]} end={[0, 2.75, 0]} color={axisColors.y} />
      <AxisLine start={[0, 0, -2.75]} end={[0, 0, 2.75]} color={axisColors.z} />

      <AxisArrow
        position={[2.95, 0, 0]}
        direction={[1, 0, 0]}
        color={axisColors.x}
      />

      <AxisArrow
        position={[0, 2.95, 0]}
        direction={[0, 1, 0]}
        color={axisColors.y}
      />

      <AxisArrow
        position={[0, 0, 2.95]}
        direction={[0, 0, 1]}
        color={axisColors.z}
      />
    </group>
  );
}
function DemoCube({
  position,
  isAccent,
  accentColor,
  mainColor,
}: {
  position: Vec3;
  isAccent: boolean;
  accentColor: string;
  mainColor: string;
}) {
  const boxGeometry = useMemo(() => {
    return new BoxGeometry(1, 1, 1);
  }, []);

  const edgeGeometry = useMemo(() => {
    return new EdgesGeometry(boxGeometry);
  }, [boxGeometry]);

  return (
    <group position={position}>
      <mesh geometry={boxGeometry}>
        <meshStandardMaterial
          color={isAccent ? accentColor : mainColor}
          roughness={0.5}
          metalness={0.04}
        />
      </mesh>

      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          color={getCssVariableValue("--color-3d-edge")}
          transparent
          opacity={0.95}
        />
      </lineSegments>
    </group>
  );
}

function DemoBlock({ rotation }: { rotation: Quaternion }) {
  const centeredPositions = useMemo(() => {
    const xs = demoBlockPositions.map((position) => position[0]);
    const ys = demoBlockPositions.map((position) => position[1]);
    const zs = demoBlockPositions.map((position) => position[2]);

    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;

    return demoBlockPositions.map((position) => {
      return [
        position[0] - centerX,
        position[1] - centerY,
        position[2] - centerZ,
      ] as Vec3;
    });
  }, []);

  const axisColors = useMemo(
    () => ({
      accent: getCssVariableValue("--color-3d-cube-accent"),
      main: getCssVariableValue("--color-3d-cube-main"),
    }),
    []
  );

  return (
    <group quaternion={rotation} scale={0.72}>
      {centeredPositions.map((position, index) => {
        const isAccent = index === 2 || index === 3;

        return (
          <DemoCube
            key={`${position.join("-")}-${index}`}
            position={position}
            isAccent={isAccent}
            accentColor={axisColors.accent}
            mainColor={axisColors.main}
          />
        );
      })}
    </group>
  );
}

function DemoBlockCanvas({
  title,
  rotation,
  isResult = false,
}: {
  title: string;
  rotation: Quaternion;
  isResult?: boolean;
}) {
  return (
    <div className="relative pt-3">
      <div className="absolute left-6 top-3 z-20 -translate-y-1/2 rounded-full border border-[var(--color-nav-border)] bg-[var(--color-bg-primary)] px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-primary)]">
        {title}
      </div>

      <div
        className={`relative overflow-hidden rounded-[28px] border bg-[var(--color-leaderboard-card)] ${
          isResult
            ? "border-2 border-[var(--color-emphasis)] shadow-[0_0_18px_var(--color-emphasis)]"
            : "border-[var(--color-nav-border)]"
        }`}
      >
        <div className="pointer-events-none absolute left-[31%] top-7 z-10 text-2xl font-black text-[var(--color-emphasis)] drop-shadow-[0_0_8px_var(--color-emphasis)]">
          y
        </div>

        <div className="pointer-events-none absolute right-7 top-1/2 z-10 -translate-y-1/2 text-2xl font-black text-[var(--color-white)] drop-shadow-[0_0_8px_var(--color-white)]">
          x
        </div>

        <div className="pointer-events-none absolute bottom-6 left-7 z-10 text-2xl font-black text-[var(--color-axis-z)] drop-shadow-[0_0_8px_var(--color-axis-z)]">
          z
        </div>

        <div className="h-[210px] sm:h-[250px] lg:h-[300px]">
          <Canvas
            camera={{
              position: [4.2, 3.2, 5.2],
              fov: 42,
            }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={1.8} />
            <directionalLight position={[4, 6, 6]} intensity={1.35} />
            <directionalLight position={[-4, 2, -3]} intensity={0.5} />

            <SimpleAxisGuide />
            <DemoBlock rotation={rotation} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

function RotationControlsDemo() {
  return (
    <div className="rounded-[24px] bg-[var(--color-bg-primary)]/85 p-4 text-center shadow-xl">
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
                  : "bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)]"
              }`}
            >
              {angle}
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[var(--color-leaderboard-row)] px-2 py-2 text-xs font-black text-[var(--color-text-primary)]">
          Rotate X
        </div>

        <div className="rounded-lg bg-[var(--color-emphasis)] px-2 py-2 text-xs font-black text-[var(--color-emphasis-contrast)]">
          Rotate Y
        </div>

        <div className="rounded-lg bg-[var(--color-leaderboard-row)] px-2 py-2 text-xs font-black text-[var(--color-text-primary)]">
          Rotate Z
        </div>
      </div>

      <p className="mt-4 text-xs font-black leading-5 text-[var(--color-emphasis)]">
        Rotate 90° around y axis
      </p>
    </div>
  );
}

function RotationDemoModal({
  safeStepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
}: {
  safeStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-[90] overflow-y-auto bg-[var(--color-nav-bg)] px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl rounded-[32px] border border-[var(--color-nav-border)] bg-[var(--color-bg-primary)] p-5 text-[var(--color-text-primary)] shadow-2xl sm:p-7">
        <div className="relative border-b border-[var(--color-nav-border)] pb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-emphasis)]">
            Step {safeStepIndex + 1} of {totalSteps}
          </p>

          <h2 className="mt-3 text-center text-2xl font-black sm:text-3xl">
            How to Play?
          </h2>

          <button
            type="button"
            onClick={onSkip}
            className="group absolute right-0 top-0 h-11 w-11 rounded-full bg-[var(--color-leaderboard-row)] transition"
            aria-label="Close tutorial"
            >
            <span className="absolute left-1/2 top-1/2 h-[3px] w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-[var(--color-text-primary)] transition group-hover:bg-[var(--color-emphasis)]" />
            <span className="absolute left-1/2 top-1/2 h-[3px] w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-[var(--color-text-primary)] transition group-hover:bg-[var(--color-emphasis)]" />
            </button>
        </div>

        <p className="mt-6 text-center text-sm font-bold leading-6 opacity-85 sm:text-base">
          Recreate target object by manipulating current object.
        </p>

        <div className="mt-6 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_300px_minmax(0,1fr)]">
          <DemoBlockCanvas title="Current" rotation={currentRotation} />

          <RotationControlsDemo />

          <DemoBlockCanvas
            title="Target"
            rotation={resultRotation}
            isResult
            />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-[var(--color-nav-border)] px-4 py-2 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
          >
            Exit
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-[var(--color-nav-border)] px-4 py-2 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-[var(--color-emphasis)] px-4 py-2 text-sm font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)]"
            >
              Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialOverlay({
  steps,
  currentStepIndex,
  onNext,
  onBack,
  onSkip,
}: TutorialOverlayProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToTargetRef = useRef(false);

  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(
    null
  );

  const [isTargetReady, setIsTargetReady] = useState(false);

  const [tooltipSize, setTooltipSize] = useState<TooltipSize>({
    width: 340,
    height: 230,
  });

  const safeStepIndex = clamp(
    currentStepIndex,
    0,
    Math.max(steps.length - 1, 0)
  );

  const currentStep = steps[safeStepIndex];
  const isLastStep = safeStepIndex === steps.length - 1;
  const isRotationDemoStep = currentStep?.visual === "rotation-demo";

  useEffect(() => {
    if (!currentStep) return;

    if (currentStep.visual === "rotation-demo") {
      setHighlightRect(null);
      setIsTargetReady(true);
      return;
    }

    let isCancelled = false;
    let retryCount = 0;
    const retryTimeouts: number[] = [];

    hasScrolledToTargetRef.current = false;
    setIsTargetReady(false);

    function updateHighlight() {
      if (isCancelled || !currentStep) return;

      const targetElements = Array.from(
        document.querySelectorAll(`[data-tutorial="${currentStep.target}"]`)
      );

      const targetElement = targetElements.find((element) => {
        if (!(element instanceof HTMLElement)) return false;

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      });

      if (!(targetElement instanceof HTMLElement)) {
        retryCount++;

        if (retryCount < 30) {
          const retryTimeout = window.setTimeout(updateHighlight, 80);
          retryTimeouts.push(retryTimeout);
        }

        return;
      }

      if (!hasScrolledToTargetRef.current) {
        hasScrolledToTargetRef.current = true;

        const isMobile = window.innerWidth < 1024;

        const shouldJumpDirectlyOnMobile =
          isMobile &&
          (currentStep.target === "rotation-step-buttons" ||
            currentStep.target === "rotation-axis-buttons" ||
            currentStep.target === "progress-grid" ||
            currentStep.target === "timer-panel" ||
            currentStep.target === "reset-button");

        targetElement.scrollIntoView({
          block: "center",
          inline: "center",
          behavior: shouldJumpDirectlyOnMobile ? "auto" : "smooth",
        });
      }

      window.requestAnimationFrame(() => {
        if (isCancelled) return;

        const rect = targetElement.getBoundingClientRect();
        const paddingX = 16;
        const paddingY = 8;

        setHighlightRect({
          top: rect.top - paddingY,
          left: rect.left - paddingX,
          width: rect.width + paddingX * 2,
          height: rect.height + paddingY * 2,
        });

        setIsTargetReady(true);
      });
    }

    const firstTimeout = window.setTimeout(updateHighlight, 80);
    const secondTimeout = window.setTimeout(updateHighlight, 260);
    const thirdTimeout = window.setTimeout(updateHighlight, 520);
    const fourthTimeout = window.setTimeout(updateHighlight, 900);

    function handleResizeOrScroll() {
      updateHighlight();
    }

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      isCancelled = true;

      window.clearTimeout(firstTimeout);
      window.clearTimeout(secondTimeout);
      window.clearTimeout(thirdTimeout);
      window.clearTimeout(fourthTimeout);

      retryTimeouts.forEach((timeout) => {
        window.clearTimeout(timeout);
      });

      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [currentStep]);

  useEffect(() => {
    function updateTooltipSize() {
      if (!tooltipRef.current) return;

      const rect = tooltipRef.current.getBoundingClientRect();

      setTooltipSize({
        width: rect.width || 340,
        height: rect.height || 230,
      });
    }

    updateTooltipSize();

    const timeout = window.setTimeout(updateTooltipSize, 80);

    window.addEventListener("resize", updateTooltipSize);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", updateTooltipSize);
    };
  }, [currentStep, highlightRect]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSkip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSkip]);

  const tooltipStyle = useMemo(() => {
    if (!highlightRect || !currentStep) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const tooltipWidth = tooltipSize.width;
    const tooltipHeight = tooltipSize.height;
    const margin = 18;
    const screenPadding = 16;

    const maxTop = Math.max(
      screenPadding,
      window.innerHeight - tooltipHeight - screenPadding
    );

    const isMobile = window.innerWidth < 1024;

    const shouldPreferLeftSide =
      currentStep.target === "rotation-step-buttons" ||
      currentStep.target === "rotation-axis-buttons";

    if (shouldPreferLeftSide) {
      const leftSideLeft = highlightRect.left - tooltipWidth - margin;
      const rightSideLeft = highlightRect.left + highlightRect.width + margin;

      const canShowLeft = leftSideLeft >= screenPadding;
      const canShowRight =
        rightSideLeft + tooltipWidth <= window.innerWidth - screenPadding;

      if (canShowLeft || canShowRight) {
        return {
          top: clamp(
            highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2,
            screenPadding,
            maxTop
          ),
          left: canShowLeft ? leftSideLeft : rightSideLeft,
          transform: "none",
        };
      }
    }

    if (currentStep.target === "timer-panel" && isMobile) {
      const belowTargetTop = highlightRect.top + highlightRect.height + margin;
      const lowerScreenTop = window.innerHeight * 0.48;

      const top = clamp(
        Math.max(belowTargetTop, lowerScreenTop),
        screenPadding,
        maxTop
      );

      const left = clamp(
        highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
        screenPadding,
        window.innerWidth - tooltipWidth - screenPadding
      );

      return {
        top,
        left,
        transform: "none",
      };
    }

    const canShowBelow =
      highlightRect.top + highlightRect.height + tooltipHeight + margin <
      window.innerHeight - screenPadding;

    const preferredTop = canShowBelow
      ? highlightRect.top + highlightRect.height + margin
      : highlightRect.top - tooltipHeight - margin;

    const top = clamp(preferredTop, screenPadding, maxTop);

    const left = clamp(
      highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
      screenPadding,
      window.innerWidth - tooltipWidth - screenPadding
    );

    return {
      top,
      left,
      transform: "none",
    };
  }, [highlightRect, currentStep, tooltipSize]);

  if (!currentStep) {
    return null;
  }

  if (isRotationDemoStep) {
    return (
      <RotationDemoModal
        safeStepIndex={safeStepIndex}
        totalSteps={steps.length}
        onNext={onNext}
        onBack={onBack}
        onSkip={onSkip}
      />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {highlightRect && (
        <div
          className={`pointer-events-none fixed rounded-2xl border-2 border-[var(--color-emphasis)] bg-[var(--color-emphasis)]/10 shadow-[0_0_12px_var(--color-emphasis)] transition-all duration-500 ease-out ${
            isTargetReady ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className={`pretty-scrollbar pointer-events-auto fixed max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-[340px] overflow-y-auto rounded-3xl border border-[var(--color-nav-border)] bg-[var(--color-bg-primary)]/95 p-5 text-[var(--color-text-primary)] shadow-2xl transition-all duration-500 ease-out ${
          isTargetReady || highlightRect ? "opacity-100" : "opacity-0"
        }`}
        style={tooltipStyle}
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-emphasis)]">
          Step {safeStepIndex + 1} of {steps.length}
        </p>

        <h2 className="mt-3 text-xl font-black">{currentStep.title}</h2>

        <p className="mt-3 text-sm font-bold leading-6 opacity-75">
          {currentStep.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-[var(--color-nav-border)] px-4 py-2 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
          >
            Exit
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={safeStepIndex === 0}
              className="rounded-xl border border-[var(--color-nav-border)] px-4 py-2 text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-[var(--color-emphasis)] px-4 py-2 text-sm font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)]"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
