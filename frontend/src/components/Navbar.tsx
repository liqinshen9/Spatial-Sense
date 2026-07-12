import { VolumeNotice, SunOne, Moon } from "@icon-park/react";
import { NavLink } from "react-router-dom";
import type { AuthUser } from "../types/auth";

const API_BASE_URL = "http://localhost:5000";

type NavbarProps = {
  isDarkMode: boolean;
  currentUser: AuthUser | null;
  onToggleTheme: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onNavigateRequest: (path: string) => void;
  onProfileClick: () => void;
};

function getAvatarSrc(avatarUrl: string | null) {
  if (!avatarUrl) return "";

  if (avatarUrl.startsWith("http")) {
    return avatarUrl;
  }

  return `${API_BASE_URL}${avatarUrl}`;
}

function Navbar({
  isDarkMode,
  currentUser,
  onToggleTheme,
  onLoginClick,
  onLogout,
  onNavigateRequest,
  onProfileClick,
}: NavbarProps) {
  function getNavClass({ isActive }: { isActive: boolean }) {
    return isActive
      ? "whitespace-nowrap rounded-full bg-[var(--color-active-bg)] px-2 py-2 text-xs font-bold text-[var(--color-emphasis)] sm:px-5 sm:text-sm"
      : "whitespace-nowrap px-2 py-2 text-xs font-bold transition hover:text-[var(--color-emphasis)] sm:px-5 sm:text-sm";
  }

  const avatarSrc = currentUser ? getAvatarSrc(currentUser.avatarUrl) : "";

  return (
    <nav className="relative z-10 flex h-14 w-full items-center gap-2 border-b border-[var(--color-nav-border)] bg-[var(--color-nav-bg)] px-2 backdrop-blur-md transition-colors duration-300 sm:justify-between sm:px-8 lg:px-12">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-8">
        <button
          type="button"
          className="shrink-0 transition hover:text-[var(--color-emphasis)]"
          aria-label="Sound"
        >
          <VolumeNotice theme="outline" size="22" fill="currentColor" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="shrink-0 text-[var(--color-emphasis)] transition hover:scale-110"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Moon theme="outline" size="22" fill="currentColor" />
          ) : (
            <SunOne theme="outline" size="22" fill="currentColor" />
          )}
        </button>

        <NavLink
          to="/"
          onClick={(event) => {
            event.preventDefault();
            onNavigateRequest("/");
          }}
          className={getNavClass}
        >
          Home
        </NavLink>

        <NavLink
          to="/leaderboard"
          onClick={(event) => {
            event.preventDefault();
            onNavigateRequest("/leaderboard");
          }}
          className={getNavClass}
        >
          Leaderboard
        </NavLink>
      </div>

      {currentUser ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onProfileClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-emphasis)] bg-[var(--color-leaderboard-row)] text-sm font-black text-[var(--color-emphasis)] transition hover:scale-105"
            aria-label="Open account settings"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${currentUser.name}'s avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              currentUser.name.charAt(0).toUpperCase()
            )}
          </button>

          <p className="hidden text-sm pr-4 font-bold text-[var(--color-text-primary)] sm:block">
            Hello,{" "}
            <span className="text-[var(--color-emphasis)]">
              {currentUser.name}
            </span>
          </p>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-[var(--color-emphasis)] bg-[var(--color-emphasis)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)] hover:border-[var(--color-emphasis-hover)] sm:px-4 sm:py-2 sm:text-sm"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onLoginClick}
          className="shrink-0 rounded-lg bg-[var(--color-emphasis)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)] sm:px-6 sm:py-2 sm:text-sm"
        >
          Login
        </button>
      )}
    </nav>
  );
}

export default Navbar;