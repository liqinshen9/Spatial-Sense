import { useState } from "react";
import { VolumeNotice, SunOne, Moon } from "@icon-park/react";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <main
      className={`app-shell relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "" : "theme-light"
      } bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]`}
    >
      {/* navbar */}
      <nav
        className="relative z-10 flex h-14 items-center justify-between border-b border-[var(--color-nav-border)] bg-[var(--color-nav-bg)] px-12 backdrop-blur-sm transition-colors duration-300"
      >
        <div className="flex h-full items-center gap-8">
          <button
            className="transition hover:text-[var(--color-emphasis)]"
            aria-label="Sound"
          >
            <VolumeNotice theme="outline" size="24" fill="currentColor" />
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="transition text-[var(--color-emphasis)]"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Moon theme="outline" size="24" fill="currentColor" />
            ) : (
              <SunOne theme="outline" size="24" fill="currentColor" />
            )}
          </button>

          <a href="#" className="text-sm font-bold text-[var(--color-emphasis)]">
            Home
          </a>

          <a
            href="#"
            className="text-sm font-bold transition hover:text-[var(--color-emphasis)]"
          >
            Leaderboard
          </a>
        </div>

        <button
          className="rounded-md bg-[var(--color-emphasis)] px-5 py-2 text-sm font-bold text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)]"
        >
          Login
        </button>
      </nav>

      {/* hero */}
      <section className="relative z-10 min-h-[calc(100vh-56px)]">
        <div className="absolute left-[7%] top-[14%]">
          <h1 className="select-none font-['Major_Mono_Display'] text-[7.2rem] uppercase leading-[0.85] tracking-[0.03em] md:text-[8rem]">
            <span className="block">Spatial</span>
            <span className="block">Sense</span>
          </h1>
        </div>
      </section>
    </main>
  );
}

export default App;