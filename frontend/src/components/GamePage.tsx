import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import { getRandomPuzzle } from "../api/puzzles";
import PuzzleBlockCanvas from "./PuzzleBlockCanvas";
import type { BlockOrientation, CubeDto, PuzzleDto } from "../types/puzzle";

type GamePageProps = {
  difficultyIndex: number;
};

type Axis = "X" | "Y" | "Z";
type RotationStep = -90 | -45 | 45 | 90;

const difficultyNames = ["Easy", "Medium", "Difficult"] as const;
const totalProgressSteps = 10;

const identityOrientation: BlockOrientation = {
  x: 0,
  y: 0,
  z: 0,
  w: 1,
};

const axisVectors: Record<Axis, Vector3> = {
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
  Z: new Vector3(0, 0, 1),
};

function formatTime(totalMilliseconds: number) {
  const minutes = Math.floor(totalMilliseconds / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2,"0")}:${String(milliseconds).padStart(3, "0")}`;
}

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

function getNextOrientation(
  currentOrientation: BlockOrientation,
  axis: Axis,
  degrees: number
) {
  const currentQuaternion = orientationToQuaternion(currentOrientation);

  const stepQuaternion = new Quaternion().setFromAxisAngle(
    axisVectors[axis],
    (degrees * Math.PI) / 180
  );

  const nextQuaternion = stepQuaternion
    .multiply(currentQuaternion)
    .normalize();

  return quaternionToOrientation(nextQuaternion);
}

function cleanNumber(value: number) {
  const rounded = Number(value.toFixed(4));
  return Math.abs(rounded) < 0.0001 ? 0 : rounded;
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

function getVisualStateSignature(
  cubes: CubeDto[],
  orientation: BlockOrientation
) {
  const quaternion = orientationToQuaternion(orientation);

  return getCenteredCubes(cubes)
    .map((cube) => {
      const rotatedPosition = new Vector3(cube.x, cube.y, cube.z).applyQuaternion(
        quaternion
      );

      return {
        x: cleanNumber(rotatedPosition.x),
        y: cleanNumber(rotatedPosition.y),
        z: cleanNumber(rotatedPosition.z),
        colorIndex: cube.colorIndex ?? 0,
      };
    })
    .sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      if (a.y !== b.y) return a.y - b.y;
      if (a.z !== b.z) return a.z - b.z;
      return a.colorIndex - b.colorIndex;
    })
    .map((cube) => `${cube.x},${cube.y},${cube.z},${cube.colorIndex}`)
    .join("|");
}

function doBlocksVisuallyMatch(
  cubes: CubeDto[],
  currentOrientation: BlockOrientation,
  targetOrientation: BlockOrientation
) {
  const currentState = getVisualStateSignature(cubes, currentOrientation);
  const targetState = getVisualStateSignature(cubes, targetOrientation);

  return currentState === targetState;
}

function ProgressGrid({
  currentStep,
  totalSteps,
  isSolved,
  isGameComplete,
}: {
  currentStep: number;
  totalSteps: number;
  isSolved: boolean;
  isGameComplete: boolean;
}) {
  const steps = useMemo(
    () => Array.from({ length: totalSteps }, (_, index) => index + 1),
    [totalSteps]
  );

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {steps.map((step) => {
        const isDone =
          isGameComplete ||
          step < currentStep ||
          (isSolved && step === currentStep);

        const isActive = step === currentStep && !isSolved && !isGameComplete;

        return (
          <div
            key={step}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-black transition ${
              isDone
                ? "border-[var(--color-emphasis)] bg-[var(--color-emphasis)] text-[var(--color-emphasis-contrast)]"
                : isActive
                ? "border-[var(--color-emphasis)] bg-[var(--color-active-bg)] text-[var(--color-emphasis)]"
                : "border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)] opacity-40"
            }`}
          >
            {isDone ? "✓" : step}
          </div>
        );
      })}
    </div>
  );
}

function GamePage({ difficultyIndex }: GamePageProps) {
  const difficultyName = difficultyNames[difficultyIndex] ?? "Easy";

  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const timerStartRef = useRef(performance.now());
  const [selectedRotationStep, setSelectedRotationStep] =
    useState<RotationStep>(90);
  const [currentProgressStep, setCurrentProgressStep] = useState(1);

  const [puzzle, setPuzzle] = useState<PuzzleDto | null>(null);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(true);
  const [puzzleError, setPuzzleError] = useState("");

  const [blockOrientation, setBlockOrientation] =
    useState<BlockOrientation>(identityOrientation);

  const [isSolved, setIsSolved] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  const solveTimeoutRef = useRef<number | null>(null);

  const loadPuzzle = useCallback(async () => {
    if (solveTimeoutRef.current !== null) {
      window.clearTimeout(solveTimeoutRef.current);
      solveTimeoutRef.current = null;
    }

    try {
      setIsLoadingPuzzle(true);
      setPuzzleError("");
      setIsSolved(false);
      setBlockOrientation(identityOrientation);

      let validPuzzle: PuzzleDto | null = null;

      for (let attempt = 0; attempt < 12; attempt++) {
        const candidatePuzzle = await getRandomPuzzle(difficultyName);

        const alreadySolved = doBlocksVisuallyMatch(
          candidatePuzzle.cubes,
          identityOrientation,
          candidatePuzzle.targetOrientation
        );

        if (!alreadySolved) {
          validPuzzle = candidatePuzzle;
          break;
        }
      }

      if (!validPuzzle) {
        throw new Error("Could not find a valid puzzle.");
      }

      setPuzzle(validPuzzle);
    } catch {
      setPuzzleError("Failed to load puzzle.");
    } finally {
      setIsLoadingPuzzle(false);
    }
  }, [difficultyName]);

  useEffect(() => {
    timerStartRef.current = performance.now();
    setElapsedMilliseconds(0);
    setCurrentProgressStep(1);
    setIsGameComplete(false);
    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
  timerStartRef.current = performance.now();

  const timer = window.setInterval(() => {
    const elapsed = Math.floor(performance.now() - timerStartRef.current);
    setElapsedMilliseconds(elapsed);
  }, 10);

  return () => window.clearInterval(timer);
}, []);

  useEffect(() => {
    return () => {
      if (solveTimeoutRef.current !== null) {
        window.clearTimeout(solveTimeoutRef.current);
      }
    };
  }, []);

  function moveToNextPuzzle() {
    solveTimeoutRef.current = null;

    if (currentProgressStep >= totalProgressSteps) {
      setIsGameComplete(true);
      setIsSolved(false);
      return;
    }

    setCurrentProgressStep((prev) => prev + 1);
    loadPuzzle();
  }

  function handleSolved() {
    if (isSolved || isGameComplete) return;

    setIsSolved(true);

    if (solveTimeoutRef.current !== null) {
      window.clearTimeout(solveTimeoutRef.current);
    }

    solveTimeoutRef.current = window.setTimeout(() => {
      moveToNextPuzzle();
    }, 800);
  }

  function handleRotate(axis: Axis) {
    if (!puzzle || isLoadingPuzzle || isSolved || isGameComplete) return;

    const nextOrientation = getNextOrientation(
      blockOrientation,
      axis,
      selectedRotationStep
    );

    setBlockOrientation(nextOrientation);

    const hasSolvedPuzzle = doBlocksVisuallyMatch(
      puzzle.cubes,
      nextOrientation,
      puzzle.targetOrientation
    );

    if (hasSolvedPuzzle) {
      handleSolved();
    }
  }

  function handleReset() {
    if (solveTimeoutRef.current !== null) {
      window.clearTimeout(solveTimeoutRef.current);
      solveTimeoutRef.current = null;
    }

    timerStartRef.current = performance.now();
    setElapsedMilliseconds(0);
    setSelectedRotationStep(90);
    setBlockOrientation(identityOrientation);
    setIsSolved(false);

    if (isGameComplete) {
      setCurrentProgressStep(1);
      setIsGameComplete(false);
      loadPuzzle();
    }
  }

  return (
    <section className="relative z-10 h-[calc(100vh-56px)] overflow-hidden px-8 py-6">
      <div className="grid h-full grid-cols-[260px_minmax(0,1fr)_220px] gap-7">
        <aside className="flex h-full min-h-0 flex-col">
          <p className="text-2xl font-black text-[var(--color-text-primary)]">
            Level:{" "}
            <span className="text-[var(--color-emphasis)]">
              {difficultyName}
            </span>
          </p>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-[var(--color-text-primary)]">
            Target
          </p>

          <div className="mt-4 flex aspect-square w-[240px] items-center justify-center rounded-[28px] border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)]">
            {isLoadingPuzzle && (
              <p className="text-sm font-bold opacity-60">Loading...</p>
            )}

            {!isLoadingPuzzle && puzzleError && (
              <p className="px-4 text-center text-sm font-bold text-[var(--color-emphasis)]">
                {puzzleError}
              </p>
            )}

            {!isLoadingPuzzle && puzzle && (
              <PuzzleBlockCanvas
                key={`target-${currentProgressStep}-${puzzle.id}`}
                cubes={puzzle.cubes}
                orientation={puzzle.targetOrientation}
                size="target"
              />
            )}
          </div>
        </aside>

        <main className="flex h-full min-h-0 flex-col gap-5">
          <div
            className={`mx-auto flex aspect-square w-[min(36vw,430px)] items-center justify-center rounded-[32px] border transition-colors duration-200 ${
              isSolved
                ? "border-4 border-green-300 bg-green-400/45 ring-4 ring-green-300/80"
                : "border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)]"
            }`}
          >
            {isLoadingPuzzle && (
              <p className="text-sm font-bold opacity-60">Loading puzzle...</p>
            )}

            {!isLoadingPuzzle && puzzleError && (
              <p className="text-sm font-bold text-[var(--color-emphasis)]">
                {puzzleError}
              </p>
            )}

            {!isLoadingPuzzle && puzzle && (
              <PuzzleBlockCanvas
                key={`main-${currentProgressStep}-${puzzle.id}`}
                cubes={puzzle.cubes}
                orientation={blockOrientation}
              />
            )}
          </div>

          <div className="px-5 py-3">

            <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
              Rotation Control
            </p>

            <div className="mt-4 flex flex-col items-center gap-3">
              {/* angle buttons */}
              <div className="flex items-center justify-center gap-3">
                {([-90, -45, 45, 90] as RotationStep[]).map((step) => {
                  const isActive = selectedRotationStep === step;

                  return (
                    <button
                      key={step}
                      type="button"
                      disabled={isLoadingPuzzle || isSolved || isGameComplete}
                      onClick={() => setSelectedRotationStep(step)}
                      className={`min-w-[78px] rounded-xl border px-4 py-2 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isActive
                          ? "border-[var(--color-emphasis)] bg-[var(--color-emphasis)] text-[var(--color-emphasis-contrast)]"
                          : "border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)] hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
                      }`}
                    >
                      {step}°
                    </button>
                  );
                })}
              </div>

              {/* axis buttons */}
              <div className="flex items-center justify-center gap-3">
                {(["X", "Y", "Z"] as Axis[]).map((axis) => (
                  <button
                    key={axis}
                    type="button"
                    disabled={isLoadingPuzzle || isSolved || isGameComplete}
                    onClick={() => handleRotate(axis)}
                    className="min-w-[102px] rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-2 text-base font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:bg-[var(--color-emphasis)] hover:text-[var(--color-emphasis-contrast)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Rotate {axis}
                  </button>
                ))}
              </div>

              {isSolved && (
                <p className="text-sm font-black text-green-300">
                  Matched! Loading next puzzle...
                </p>
              )}

              {isGameComplete && (
                <p className="text-sm font-black text-green-300">
                  Completed all puzzles!
                </p>
              )}
            </div>
          </div>
        </main>

        <aside className="flex h-full min-h-0 flex-col gap-4">
          <div className="px-2 py-2">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
              Time Elapsed
            </p>

            <p className="mt-4 text-4xl font-black text-[var(--color-text-primary)]">
              {formatTime(elapsedMilliseconds)}
            </p>
          </div>

          <div className="px-2 py-2">
            <div className="ml-1 w-[98px]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
                Progress
              </p>

              <div className="mt-5">
                <ProgressGrid
                  currentStep={currentProgressStep}
                  totalSteps={totalProgressSteps}
                  isSolved={isSolved}
                  isGameComplete={isGameComplete}
                />
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="mt-5 w-full rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-4 py-2 text-base font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:bg-[var(--color-emphasis)] hover:text-[var(--color-emphasis-contrast)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default GamePage;