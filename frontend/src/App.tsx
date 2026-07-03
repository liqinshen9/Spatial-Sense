import { useState, type ChangeEvent } from "react";
import { VolumeNotice, SunOne, Moon } from "@icon-park/react";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [difficultyIndex, setDifficultyIndex] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

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

  const currentDifficulty = difficulties[difficultyIndex] ?? difficulties[0];

  function handleDifficultyChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDifficulty = Number(event.target.value);

    if (nextDifficulty === difficultyIndex) return;

    setDifficultyIndex(nextDifficulty);
    setShakeKey((prev) => prev + 1);
  }

  return (
    <main
      className={`app-shell relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "" : "theme-light"
      } bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]`}
    >
      {/* navbar */}
      <nav className="relative z-10 flex h-14 items-center justify-between border-b border-[var(--color-nav-border)] bg-[var(--color-nav-bg)] px-12 shadow-[var(--nav-shadow)] backdrop-blur-md transition-colors duration-300">
        <div className="flex h-full items-center gap-8">
          <button
            className="transition hover:text-[var(--color-emphasis)]"
            aria-label="Sound"
          >
            <VolumeNotice theme="outline" size="24" fill="currentColor" />
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-[var(--color-emphasis)] transition hover:scale-110"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Moon theme="outline" size="24" fill="currentColor" />
            ) : (
              <SunOne theme="outline" size="24" fill="currentColor" />
            )}
          </button>

          <a href="#" className="rounded-full bg-[var(--color-active-bg)] px-5 py-2 text-sm font-bold text-[var(--color-emphasis)] shadow-[var(--active-shadow)]">
            Home
          </a>

          <a
            href="#"
            className="text-sm font-bold transition hover:text-[var(--color-emphasis)]"
          >
            Leaderboard
          </a>
        </div>

        <button className="rounded-lg bg-[var(--color-emphasis)] px-6 py-2 text-sm font-bold text-[var(--color-emphasis-contrast)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--color-emphasis-hover)]">
          Login
        </button>
      </nav>

      {/* hero */}
      <section className="relative z-10 min-h-[calc(100vh-56px)]">
        <div className="absolute left-[7%] top-[14%]">
          <h1 className="select-none font-['Major_Mono_Display'] text-[7.2rem] uppercase leading-[0.85] tracking-[0.03em] md:text-[8rem]">
            <span className="block">Spatial</span>
            <span className="block">
              Se
              <span className="text-[var(--color-emphasis)]">n</span>
              se
            </span>
          </h1>

          {/* start button + difficulty selector */}
          <div className="mt-8 flex items-end gap-6">
            <button className="rounded-xl bg-[var(--color-emphasis)] px-8 py-4 text-lg font-black text-[var(--color-emphasis-contrast)] shadow-[var(--button-shadow)] transition hover:-translate-y-1 hover:bg-[var(--color-emphasis-hover)]">
              Start Game
            </button>

            <div
              key={shakeKey}
              className="flex flex-col gap-2"
              style={{
                animation:
                  shakeKey > 0
                    ? "difficulty-shake 0.35s ease-in-out"
                    : "none",
              }}
            >
              <p className="text-xs font-bold text-[var(--color-text-primary)]">
                Select difficulty
              </p>

              <div className="flex items-center gap-5">
                <div className="relative h-8 w-[190px] rounded-full border-2 border-[var(--color-text-primary)] bg-[var(--color-slider-bg)] shadow-[var(--slider-shadow)]">
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
                    className="absolute left-1 top-1 z-10 h-6 w-6 rounded-full bg-[var(--color-emphasis)] shadow-[var(--button-shadow)] transition-transform duration-300"
                    style={{
                      transform: `translateX(${difficultyIndex * 78}px)`,
                    }}
                  />
                </div>

                <div className="min-w-[240px]">
                  <p className="text-xl font-black text-[var(--color-text-primary)]">
                    {currentDifficulty.label}
                  </p>

                  <p className="mt-1 text-sm font-bold tracking-wide text-[var(--color-emphasis)]">
                    {currentDifficulty.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;