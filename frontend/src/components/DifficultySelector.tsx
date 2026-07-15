import { useState, type ChangeEvent } from "react";

type DifficultySelectorProps = {
  difficultyIndex: number;
  onDifficultyChange: (nextDifficulty: number) => void;
};

const difficulties = [
  {
    label: "Easy",
    message: "No judgement",
  },
  {
    label: "Medium",
    message: "It's not fun",
  },
  {
    label: "Difficult",
    message: "You've been warned",
  },
] as const;

function DifficultySelector({
  difficultyIndex,
  onDifficultyChange,
}: DifficultySelectorProps) {
  const [shakeKey, setShakeKey] = useState(0);

  const currentDifficulty = difficulties[difficultyIndex] ?? difficulties[0];

  function handleDifficultyChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDifficulty = Number(event.target.value);

    if (nextDifficulty === difficultyIndex) return;

    onDifficultyChange(nextDifficulty);
    setShakeKey((prev) => prev + 1);
  }

  return (
    <div
      key={shakeKey}
      data-tutorial="difficulty-selector"
      className="flex w-full flex-col gap-2 sm:w-auto"
      style={{
        animation:
          shakeKey > 0 ? "difficulty-shake 0.35s ease-in-out" : "none",
      }}
    >
      <p className="text-xs font-bold text-[var(--color-text-primary)] opacity-70">
        Select difficulty
      </p>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="relative h-8 w-[195px] rounded-full border-2 border-[var(--color-text-primary)] bg-[var(--color-slider-bg)] sm:w-[190px]">
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={difficultyIndex}
            onChange={handleDifficultyChange}
            aria-label="Select difficulty"
            className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
          />

          <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-primary)] opacity-70" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-primary)] opacity-70" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-primary)] opacity-70" />
          </div>

          <div
            className="absolute left-1 top-1 z-10 h-6 w-6 rounded-full bg-[var(--color-emphasis)] transition-transform duration-300"
            style={{
              transform: `translateX(${difficultyIndex * 80}px)`,
            }}
          />
        </div>

        <div className="min-w-0 sm:min-w-[240px]">
          <p className="text-lg font-black text-[var(--color-text-primary)] sm:text-xl">
            {currentDifficulty.label}
          </p>

          <p className="mt-1 text-sm font-bold tracking-wide text-[var(--color-emphasis)]">
            {currentDifficulty.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DifficultySelector;