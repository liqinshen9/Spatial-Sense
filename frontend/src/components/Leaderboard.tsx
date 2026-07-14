import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getScoresByDifficulty } from "../api/scores";
import type { Difficulty, ScoreRanking } from "../types/score";
import type { AuthUser } from "../types/auth";
import BlockLoading from "./BlockLoading";

const API_BASE_URL = "http://localhost:5000";

type LeaderboardPageProps = {
  currentUser: AuthUser | null;
  onOpenProfileModal: () => void;
};

const difficultyOptions: { label: string; value: Difficulty }[] = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Difficult", value: "difficult" },
];

function normalizeDifficulty(value: string | null): Difficulty {
  if (value === "medium" || value === "difficult") {
    return value;
  }

  return "easy";
}

function getAvatarSrc(avatarUrl: string | null) {
  if (!avatarUrl) return "";

  if (avatarUrl.startsWith("http")) {
    return avatarUrl;
  }

  return `${API_BASE_URL}${avatarUrl}`;
}

function LeaderboardPage({
  currentUser,
  onOpenProfileModal,
}: LeaderboardPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDifficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const highlightScoreId = Number(searchParams.get("highlightScoreId"));

  const [rankings, setRankings] = useState<ScoreRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true);
        setError("");

        const scores = await getScoresByDifficulty(selectedDifficulty);
        setRankings(scores);
      } catch {
        setError("Failed to load leaderboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaderboard();
  }, [selectedDifficulty]);

  function handleDifficultyChange(difficulty: Difficulty) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("difficulty", difficulty);

    setSearchParams(nextParams);
  }

  return (
    <section className="relative z-10 min-h-[calc(100vh-56px)] px-4 py-6 sm:px-12 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex w-full items-center justify-between gap-3 sm:mb-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="shrink-0 rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)] sm:px-5 sm:py-2.5 sm:text-sm sm:tracking-[0.14em]"
          >
            ← <span className="hidden sm:inline">Back </span>Home
          </button>

          <div className="flex min-w-0 flex-1 justify-end">
            <div className="flex w-full max-w-[520px] rounded-2xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] p-1.5 backdrop-blur-md sm:w-fit sm:p-2">
              {difficultyOptions.map((difficulty) => {
                const isActive = selectedDifficulty === difficulty.value;

                return (
                  <button
                    key={difficulty.value}
                    type="button"
                    onClick={() => handleDifficultyChange(difficulty.value)}
                    className={`flex-1 rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-[0.12em] transition sm:flex-none sm:px-8 sm:text-sm sm:tracking-[0.18em] ${
                      isActive
                        ? "bg-[var(--color-emphasis)] text-[var(--color-emphasis-contrast)]"
                        : "text-[var(--color-text-primary)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    {difficulty.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] backdrop-blur-md">
          <div className="grid grid-cols-[56px_minmax(0,1fr)_88px] border-b border-[var(--color-nav-border)] px-4 py-4 text-[10px] font-black uppercase tracking-[0.14em] opacity-70 sm:grid-cols-[100px_1fr_180px] sm:px-8 sm:py-5 sm:text-sm sm:tracking-[0.2em]">
            <p>Rank</p>
            <p>Username</p>
            <p className="text-right">Time</p>
          </div>

          {isLoading && (
            <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)]">
              <BlockLoading size="lg" label="Loading leaderboard..." />
            </div>
          )}

          {!isLoading && error && (
            <p className="px-8 py-8 text-center text-sm font-bold text-[var(--color-emphasis)]">
              {error}
            </p>
          )}

          {!isLoading && !error && rankings.length === 0 && (
            <p className="px-8 py-8 text-center text-sm font-bold opacity-70">
              No scores yet.
            </p>
          )}

          {!isLoading &&
            !error &&
            rankings.map((player, index) => {
              const isCurrentUser =
                currentUser !== null && player.userId === currentUser.id;

              const isHighlighted =
                isCurrentUser && player.id === highlightScoreId;

              const avatarSrc = getAvatarSrc(player.avatarUrl);

              return (
                <div
                  key={player.id}
                  className={`relative grid grid-cols-[56px_minmax(0,1fr)_88px] items-center border-b border-[var(--color-nav-border)] px-4 py-4 last:border-b-0 sm:grid-cols-[100px_1fr_180px] sm:px-8 sm:py-5 ${
                    isHighlighted ? "bg-[var(--color-active-bg)]" : ""
                  }`}
                >
                  {isHighlighted && (
                    <div
                      className={`pointer-events-none absolute inset-[2px] z-10 border-2 border-[var(--color-emphasis)] ${
                        index === 0 ? "rounded-t-[22px]" : ""
                      } ${
                        index === rankings.length - 1 ? "rounded-b-[22px]" : ""
                      }`}
                    />
                  )}

                  <div className="relative z-20">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-emphasis)] text-sm font-black text-[var(--color-emphasis-contrast)] sm:h-10 sm:w-10 sm:text-lg">
                      {player.rank}
                    </span>
                  </div>

                  <div className="relative z-20 flex min-w-0 items-center gap-3 pr-3">
                    <button
                      type="button"
                      onClick={isCurrentUser ? onOpenProfileModal : undefined}
                      disabled={!isCurrentUser}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-emphasis)] bg-[var(--color-leaderboard-row)] text-sm font-black text-[var(--color-emphasis)] ${
                        isCurrentUser
                          ? "transition hover:scale-105"
                          : "cursor-default"
                      }`}
                      aria-label={
                        isCurrentUser
                          ? "Open account settings"
                          : `${player.username}'s avatar`
                      }
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={`${player.username}'s avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        player.username.charAt(0).toUpperCase()
                      )}
                    </button>

                    <p className="truncate text-base font-black text-[var(--color-text-primary)] sm:text-xl">
                      {player.username}
                    </p>
                  </div>

                  <p className="relative z-20 text-right font-mono text-base font-black text-[var(--color-emphasis)] sm:text-xl">
                    {player.time}
                  </p>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

export default LeaderboardPage;