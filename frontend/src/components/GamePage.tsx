import { useEffect, useMemo, useState } from "react";

type GamePageProps = {
  difficultyIndex: number;
};

type Axis = "X" | "Y" | "Z";
type RotationStep = -90 | -45 | 45 | 90;

const difficultyNames = ["Easy", "Medium", "Difficult"] as const;

//format elapsed time into mm:ss, e.g. 01:08
function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2,"0")}`;
}

function ProgressGrid({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const steps = useMemo(
    () => Array.from({ length: totalSteps }, (_, i) => i + 1),
    [totalSteps]
  );

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <div
            key={step}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-black transition ${
              isActive
                ? "border-[var(--color-emphasis)] bg-[var(--color-active-bg)] text-[var(--color-emphasis)]"
                : isDone
                ? "border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)] opacity-85"
                : "border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)] opacity-40"
            }`}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

function GamePage({ difficultyIndex }: GamePageProps) {
  const difficultyName = difficultyNames[difficultyIndex] ?? "Easy";

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedRotationStep, setSelectedRotationStep] =
    useState<RotationStep>(90);
  const [currentProgressStep, setCurrentProgressStep] = useState(1);

  //start a simple timer when the game page is mounted
  //this will later be replaced by game session timing
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  //later this will call the real block rotation logic
  function handleRotate(_axis: Axis) {
    setCurrentProgressStep((prev) => (prev < 10 ? prev + 1 : prev));
  }

  function handleReset() {
    setElapsedSeconds(0);
    setSelectedRotationStep(90);
    setCurrentProgressStep(1);
  }

  return (
    <section className="relative z-10 h-[calc(100vh-56px)] overflow-hidden px-8 py-6">
      <div className="grid h-full grid-cols-[260px_minmax(0,1fr)_220px] gap-7">
        {/* left side */}
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

          <div className="mt-4 flex aspect-square w-[240px] items-center justify-center rounded-[28px] border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)]" />
        </aside>

        {/* center workspace */}
        <main className="flex h-full min-h-0 flex-col gap-5">
          {/*Backend-generated blocks can be rendered here later*/}
          <div className="mx-auto flex aspect-square w-[min(44vw,520px)] items-center justify-center rounded-[32px] border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)]" />


          <div className="px-5 py-3">
            <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
              Rotation Control
            </p>

            <div className="mt-4 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-3">
                {([-90, -45, 45, 90] as RotationStep[]).map((step) => {
                  const isActive = selectedRotationStep === step;

                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setSelectedRotationStep(step)}
                      className={`min-w-[74px] rounded-xl px-4 py-2.5 text-base font-black transition ${
                        isActive
                          ? "bg-[var(--color-emphasis)] text-[var(--color-emphasis-contrast)]"
                          : "border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-row)] text-[var(--color-text-primary)] hover:text-[var(--color-emphasis)]"
                      }`}
                    >
                      {step}°
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-3">
                {(["X", "Y", "Z"] as Axis[]).map((axis) => (
                  <button
                    key={axis}
                    type="button"
                    onClick={() => handleRotate(axis)}
                    className="rounded-xl bg-[var(--color-active-bg)] px-6 py-3 text-base font-black text-[var(--color-text-primary)] transition hover:text-[var(--color-emphasis)]"
                  >
                    Rotate {axis}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* right side */}
        <aside className="flex h-full min-h-0 flex-col gap-4">
        
          <div className="px-2 py-2">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
              Time Elapsed
            </p>

            <p className="mt-4 text-4xl font-black text-[var(--color-text-primary)]">
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          {/* progress and reset are grouped together*/}
          <div className="px-2 py-2">
            <div className="ml-1 w-[98px]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-emphasis)]">
                Progress
              </p>

              <div className="mt-5">
                <ProgressGrid
                  currentStep={currentProgressStep}
                  totalSteps={10}
                />
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="mt-5 w-full rounded-xl bg-[var(--color-emphasis)] py-2.5 text-sm font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)]"
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