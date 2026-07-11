import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getScoresByDifficulty } from "../api/scores";
import type { Difficulty, ScoreRanking } from "../types/score";
import type { AuthUser } from "../types/auth";

type LeaderboardPageProps = {
  currentUser: AuthUser | null;
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

function LeaderboardPage({ currentUser }: LeaderboardPageProps) {
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
        <div className="mb-6 flex w-full rounded-2xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] p-1.5 backdrop-blur-md sm:mb-8 sm:w-fit sm:p-2">
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

        <div className="overflow-hidden rounded-3xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] backdrop-blur-md">
          <div className="grid grid-cols-[56px_minmax(0,1fr)_88px] border-b border-[var(--color-nav-border)] px-4 py-4 text-[10px] font-black uppercase tracking-[0.14em] opacity-70 sm:grid-cols-[100px_1fr_180px] sm:px-8 sm:py-5 sm:text-sm sm:tracking-[0.2em]">
            <p>Rank</p>
            <p>Username</p>
            <p className="text-right">Time</p>
          </div>

          {isLoading && (
            <p className="px-8 py-8 text-center text-sm font-bold opacity-70">
              Loading leaderboard...
            </p>
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
              const isHighlighted =
                currentUser !== null &&
                player.id === highlightScoreId &&
                player.userId === currentUser.id;

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
                      } ${index === rankings.length - 1 ? "rounded-b-[22px]" : ""}`}
                    />
                  )}

                  <div className="relative z-20">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-emphasis)] text-sm font-black text-[var(--color-emphasis-contrast)] sm:h-10 sm:w-10 sm:text-lg">
                      {player.rank}
                    </span>
                  </div>

                  <p className="relative z-20 truncate pr-3 text-base font-black text-[var(--color-text-primary)] sm:text-xl">
                    {player.username}
                  </p>

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