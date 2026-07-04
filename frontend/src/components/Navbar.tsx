import { VolumeNotice, SunOne, Moon } from "@icon-park/react";

type NavbarProps = {
  isDarkMode: boolean;
  activePage: "home" | "game" | "leaderboard";
  onToggleTheme: () => void;
  onGoHome: () => void;
  onGoLeaderboard: () => void;
};

function Navbar({
  isDarkMode,
  activePage,
  onToggleTheme,
  onGoHome,
  onGoLeaderboard,
}: NavbarProps) {
  const homeClass =
    activePage === "home"
      ? "rounded-full bg-[var(--color-active-bg)] px-5 py-2 text-sm font-bold text-[var(--color-emphasis)] shadow-[var(--active-shadow)]"
      : "px-5 py-2 text-sm font-bold transition hover:text-[var(--color-emphasis)]";

  const leaderboardClass =
    activePage === "leaderboard"
      ? "rounded-full bg-[var(--color-active-bg)] px-5 py-2 text-sm font-bold text-[var(--color-emphasis)] shadow-[var(--active-shadow)]"
      : "px-5 py-2 text-sm font-bold transition hover:text-[var(--color-emphasis)]";

  return (
    <nav className="relative z-10 flex h-14 items-center justify-between border-b border-[var(--color-nav-border)] bg-[var(--color-nav-bg)] px-12 shadow-[var(--nav-shadow)] backdrop-blur-md transition-colors duration-300">
      <div className="flex h-full items-center gap-8">
        <button
          type="button"
          className="transition hover:text-[var(--color-emphasis)]"
          aria-label="Sound"
        >
          <VolumeNotice theme="outline" size="24" fill="currentColor" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="text-[var(--color-emphasis)] transition hover:scale-110"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Moon theme="outline" size="24" fill="currentColor" />
          ) : (
            <SunOne theme="outline" size="24" fill="currentColor" />
          )}
        </button>

        <button type="button" onClick={onGoHome} className={homeClass}>
          Home
        </button>

        <button
          type="button"
          onClick={onGoLeaderboard}
          className={leaderboardClass}
        >
          Leaderboard
        </button>
      </div>

      <button
        type="button"
        className="rounded-lg bg-[var(--color-emphasis)] px-6 py-2 text-sm font-bold text-[var(--color-emphasis-contrast)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--color-emphasis-hover)]"
      >
        Login
      </button>
    </nav>
  );
}

export default Navbar;