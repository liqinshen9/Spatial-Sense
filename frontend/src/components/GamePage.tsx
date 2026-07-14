import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import { getRandomPuzzle } from "../api/puzzles";
import PuzzleBlockCanvas from "./PuzzleBlockCanvas";
import type { BlockOrientation, CubeDto, PuzzleDto } from "../types/puzzle";
import type { AuthUser } from "../types/auth";
import {playButtonSound,playGameCompleteSound,playPuzzleSolvedSound} from "../utils/soundEffects";
import BlockLoading from "./BlockLoading";

export type CompletedScore = {
  difficultyName: string;
  elapsedMilliseconds: number;
  formattedTime: string;
};

type GamePageProps = {
  difficultyIndex: number;
  currentUser: AuthUser | null;
  onBackHome: () => void;
  onOpenAuthModal: (score: CompletedScore) => void;
  onViewLeaderboard: (score: CompletedScore) => void | Promise<void>;
  onGameProgressChange: (shouldWarn: boolean) => void;
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
      const rotatedPosition = new Vector3(
        cube.x,
        cube.y,
        cube.z
      ).applyQuaternion(quaternion);

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
    <div className="grid grid-cols-5 gap-2 lg:grid-cols-2 lg:gap-2.5">
      {steps.map((step) => {
        const isDone =
          isGameComplete ||
          step < currentStep ||
          (isSolved && step === currentStep);

        const isActive = step === currentStep && !isSolved && !isGameComplete;

        return (
          <div
            key={step}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-black transition lg:h-11 lg:w-11 lg:rounded-xl lg:text-sm ${
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

function GameCompleteModal({
  finalTime,
  isLoggedIn,
  onConfirm,
  onBackHome,
}: {
  finalTime: number;
  isLoggedIn: boolean;
  onConfirm: () => void;
  onBackHome: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-nav-bg)] px-5 backdrop-blur-sm md:px-6">
      <div className="game-complete-card w-full max-w-[340px] rounded-[20px] border border-[var(--color-nav-border)] px-6 py-8 shadow-2xl md:max-w-[912px] md:px-8">
        <h2 className="text-center text-2xl font-black text-[var(--color-text-primary)] md:text-3xl">
          Game Complete!
        </h2>

        <div className="mt-7 h-px w-full bg-[var(--color-nav-border)] md:mt-8" />

        <div className="mt-8 text-center md:mt-10">
          <p className="text-5xl font-black leading-none text-[var(--color-emphasis)] sm:text-6xl md:text-8xl">
            {formatTime(finalTime)}
          </p>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--color-text-primary)] opacity-60 md:text-sm">
            Final Time
          </p>
        </div>

        <div className="mt-24 text-center md:mt-44">
          <p className="text-base font-black text-[var(--color-text-primary)] opacity-70 md:text-lg">
            {isLoggedIn
              ? "View your rank on the leaderboard!"
              : "Log in to save your score!"}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3 md:mt-4">
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-lg bg-[var(--color-emphasis)] px-7 py-3 text-base font-black text-[var(--color-emphasis-contrast)] transition hover:scale-[1.02]"
            >
              {isLoggedIn ? "View Leaderboard" : "Confirm"}
            </button>

            {!isLoggedIn && (
              <button
                type="button"
                onClick={onBackHome}
                className="rounded-lg border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] px-7 py-3 text-base font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
              >
                Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GamePage({
  difficultyIndex,
  currentUser,
  onBackHome,
  onOpenAuthModal,
  onViewLeaderboard,
  onGameProgressChange,
}: GamePageProps) {
  const difficultyName = difficultyNames[difficultyIndex] ?? "Easy";

  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const [finalElapsedMilliseconds, setFinalElapsedMilliseconds] =
    useState<number | null>(null);

  const timerStartRef = useRef(performance.now());

  const [selectedRotationStep, setSelectedRotationStep] =
    useState<RotationStep>(90);

  const [selectedAxis, setSelectedAxis] = useState<Axis | null>(null);
  const [hoveredAxis, setHoveredAxis] = useState<Axis | null>(null);

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
      setSelectedAxis(null);
      setHoveredAxis(null);
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
  onGameProgressChange(!isGameComplete);

    return () => {
      onGameProgressChange(false);
    };
  }, [isGameComplete, onGameProgressChange]);

  useEffect(() => {
    timerStartRef.current = performance.now();

    setElapsedMilliseconds(0);
    setFinalElapsedMilliseconds(null);
    setCurrentProgressStep(1);
    setIsGameComplete(false);
    setIsSolved(false);
    setSelectedRotationStep(90);
    setSelectedAxis(null);
    setHoveredAxis(null);
    setBlockOrientation(identityOrientation);

    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if (isGameComplete) return;

    const timer = window.setInterval(() => {
      const elapsed = Math.floor(performance.now() - timerStartRef.current);
      setElapsedMilliseconds(elapsed);
    }, 10);

    return () => window.clearInterval(timer);
  }, [isGameComplete]);

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
      const finalTime = Math.floor(performance.now() - timerStartRef.current);

      setElapsedMilliseconds(finalTime);
      setFinalElapsedMilliseconds(finalTime);
      setIsGameComplete(true);
      setIsSolved(false);
      return;
    }

    setCurrentProgressStep((prev) => prev + 1);
    loadPuzzle();
  }

  function handleSolved() {
  if (isSolved || isGameComplete) return;

  if (currentProgressStep >= totalProgressSteps) {
    playGameCompleteSound();
  } else {
    playPuzzleSolvedSound();
  }

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

  setSelectedAxis(axis);

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
    return;
  }

  playButtonSound();
}

  function handleReset() {
    if (isSolved || isGameComplete) return;

    if (solveTimeoutRef.current !== null) {
      window.clearTimeout(solveTimeoutRef.current);
      solveTimeoutRef.current = null;
    }

    setBlockOrientation(identityOrientation);
    setSelectedAxis(null);
    setHoveredAxis(null);
  }

  function handleConfirmScore() {
    if (finalElapsedMilliseconds === null) return;

    const score = {
      difficultyName,
      elapsedMilliseconds: finalElapsedMilliseconds,
      formattedTime: formatTime(finalElapsedMilliseconds),
    };

    if (currentUser) {
      onViewLeaderboard(score);
      return;
    }

    onOpenAuthModal(score);
  }

  const highlightedAxis = hoveredAxis ?? selectedAxis;

  const stepsLeft = Math.max(
    totalProgressSteps -
      currentProgressStep +
      (isSolved || isGameComplete ? 0 : 1),
    0
  );

  return (
    <section className="relative z-10 min-h-[calc(100vh-56px)] overflow-y-auto px-4 py-5 lg:h-[calc(100vh-56px)] lg:overflow-hidden lg:px-8 lg:py-6">
      <div className="grid min-h-full grid-cols-1 gap-6 lg:h-full lg:grid-cols-[260px_minmax(0,1fr)_220px] lg:gap-7">
        <aside className="order-1 grid grid-cols-[132px_minmax(0,1fr)] items-start gap-x-4 sm:grid-cols-[160px_minmax(0,1fr)] lg:order-none lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:items-stretch lg:gap-x-0">
          <p className="col-span-2 mb-4 text-lg font-black text-[var(--color-text-primary)] lg:mb-0 lg:text-2xl">
            Level:{" "}
            <span className="text-[var(--color-emphasis)]">
              {difficultyName}
            </span>
          </p>

          <div className="min-w-0 lg:contents">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-text-primary)] lg:mt-8 lg:text-left lg:text-sm">
              Target
            </p>

            <div className="mt-3 flex aspect-square w-full items-center justify-center rounded-[22px] border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] lg:mt-4 lg:w-[240px] lg:rounded-[28px]">
              {isLoadingPuzzle && (
                <BlockLoading size="sm" label="Loading target..." />
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
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center pt-8 text-center lg:hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-text-primary)]">
              Time Elapsed
            </p>

            <p className="mt-2 text-2xl font-black text-[var(--color-emphasis)]">
              {formatTime(elapsedMilliseconds)}
            </p>

            <p className="mt-2 text-[10px] font-bold text-[var(--color-text-primary)] opacity-70">
              {stepsLeft} steps left
            </p>
          </div>
        </aside>

        <main className="order-2 flex min-h-0 flex-col gap-4 lg:order-none lg:h-full lg:gap-5">
          <div
            className={`mx-auto flex aspect-square w-full max-w-[330px] items-center justify-center rounded-[28px] border transition-colors duration-200 lg:w-[min(36vw,430px)] lg:max-w-none lg:rounded-[32px] ${
              isSolved
                ? "border-4 border-green-300 bg-green-400/45 ring-4 ring-green-300/80"
                : "border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)]"
            }`}
          >
            {isLoadingPuzzle && (
              <BlockLoading size="lg" label="Loading puzzles..." />
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

          <div className="px-0 py-2 lg:px-5 lg:py-3">
            <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
              Rotation Step
            </p>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2 lg:gap-3">
                {([-90, -45, 45, 90] as RotationStep[]).map((step) => {
                  const isActive = selectedRotationStep === step;

                  return (
                    <button
                      key={step}
                      type="button"
                      disabled={isLoadingPuzzle || isSolved || isGameComplete}
                      onClick={() => setSelectedRotationStep(step)}
                      className={`min-w-[56px] rounded-xl border px-3 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 lg:min-w-[78px] lg:px-4 lg:text-base ${
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

              <div className="flex items-center justify-center gap-2 lg:gap-3">
                {(["X", "Y", "Z"] as Axis[]).map((axis) => {
                  const isHighlightedAxis = highlightedAxis === axis;

                  return (
                    <button
                      key={axis}
                      type="button"
                      data-sound="off"
                      disabled={isLoadingPuzzle || isSolved || isGameComplete}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse") {
                          setHoveredAxis(axis);
                        }
                      }}
                      onPointerLeave={(event) => {
                        if (event.pointerType === "mouse") {
                          setHoveredAxis(null);
                        }
                      }}
                      onClick={() => handleRotate(axis)}
                      className={`min-w-[88px] rounded-xl border px-3 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 lg:min-w-[102px] lg:px-4 lg:text-base ${
                        isHighlightedAxis
                          ? "border-[var(--color-emphasis)] bg-[var(--color-emphasis)] text-[var(--color-emphasis-contrast)]"
                          : "border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)]"
                      }`}
                    >
                      Rotate {axis}
                    </button>
                  );
                })}
              </div>


              {isGameComplete && (
                <p className="text-sm font-black text-green-300">
                  Completed all puzzles!
                </p>
              )}
            </div>
          </div>
        </main>

        <aside className="order-3 flex min-h-0 flex-col items-center gap-5 pb-8 lg:order-none lg:h-full lg:items-stretch lg:gap-4 lg:pb-0">
          <div className="hidden px-2 py-2 lg:block">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
              Time Elapsed
            </p>

            <p className="mt-4 text-4xl font-black text-[var(--color-text-primary)]">
              {formatTime(elapsedMilliseconds)}
            </p>
          </div>

          <div className="w-full px-2 py-2 lg:w-auto">
            <div className="mx-auto w-fit lg:ml-1 lg:w-[98px]">
              <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)] lg:text-left">
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

      {isGameComplete && finalElapsedMilliseconds !== null && (
        <GameCompleteModal
          finalTime={finalElapsedMilliseconds}
          isLoggedIn={currentUser !== null}
          onConfirm={handleConfirmScore}
          onBackHome={onBackHome}
        />
      )}
    </section>
  );
}

export default GamePage;