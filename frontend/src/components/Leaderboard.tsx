import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../api/config";
import { getScoresByDifficulty } from "../api/scores";
import type { Difficulty, ScoreRanking } from "../types/score";
import type { AuthUser } from "../types/auth";
import BlockLoading from "./BlockLoading";

const playersPerPage = 5;

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

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(maxVisiblePages / 2);

  let startPage = currentPage - halfWindow;
  let endPage = currentPage + halfWindow;

  if (startPage < 1) {
    startPage = 1;
    endPage = maxVisiblePages;
  }

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = totalPages - maxVisiblePages + 1;
  }

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(rankings.length / playersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const firstRankingIndex = (safeCurrentPage - 1) * playersPerPage;
  const lastRankingIndex = firstRankingIndex + playersPerPage;
  const visibleRankings = rankings.slice(firstRankingIndex, lastRankingIndex);

  const emptyRowCount = Math.max(playersPerPage - visibleRankings.length, 0);

  const visiblePageNumbers = getVisiblePageNumbers(
    safeCurrentPage,
    totalPages
  );

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

  useEffect(() => {
    if (!highlightScoreId || rankings.length === 0 || !currentUser) return;

    const highlightedIndex = rankings.findIndex((player) => {
      return player.id === highlightScoreId && player.userId === currentUser.id;
    });

    if (highlightedIndex === -1) return;

    const highlightedPage = Math.floor(highlightedIndex / playersPerPage) + 1;

    setCurrentPage(highlightedPage);
  }, [highlightScoreId, rankings, currentUser]);

  function handleDifficultyChange(difficulty: Difficulty) {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("difficulty", difficulty);

    setCurrentPage(1);
    setSearchParams(nextParams);
  }

  function handlePreviousPage() {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function handleNextPage() {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }

  return (
    <section className="relative z-10 h-[calc(100vh-56px)] overflow-hidden px-4 py-4 sm:px-12 sm:py-5">
      <div className="mx-auto flex h-full max-w-5xl flex-col">
        <div className="mb-4 flex w-full items-center justify-between gap-3 sm:mb-5">
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
          <div className="grid grid-cols-[56px_minmax(0,1fr)_104px] border-b border-[var(--color-nav-border)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] opacity-70 sm:grid-cols-[100px_1fr_220px] sm:px-8 sm:py-4 sm:text-sm sm:tracking-[0.2em]">
            <p className="col-start-2">Username</p>
            <p className="col-start-3 pr-2 text-right sm:pr-0">Time</p>
          </div>

          {isLoading && (
            <div className="flex min-h-[360px] items-center justify-center">
              <BlockLoading size="lg" label="Loading leaderboard..." />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex min-h-[360px] items-center justify-center px-8 py-8 text-center text-sm font-bold text-[var(--color-emphasis)]">
              {error}
            </div>
          )}

          {!isLoading && !error && rankings.length === 0 && (
            <div className="flex min-h-[360px] items-center justify-center px-8 py-8 text-center text-sm font-bold opacity-70">
              No scores yet.
            </div>
          )}

          {!isLoading && !error && rankings.length > 0 && (
            <>
              {visibleRankings.map((player, index) => {
                const isCurrentUser =
                  currentUser !== null && player.userId === currentUser.id;

                const isHighlighted =
                  isCurrentUser && player.id === highlightScoreId;

                const avatarSrc = getAvatarSrc(player.avatarUrl);

                return (
                  <div
                    key={player.id}
                    className={`relative grid min-h-[64px] grid-cols-[56px_minmax(0,1fr)_104px] items-center border-b border-[var(--color-nav-border)] px-4 py-3 sm:min-h-[72px] sm:grid-cols-[100px_1fr_220px] sm:px-8 sm:py-4 ${
                      index === playersPerPage - 1 && emptyRowCount === 0
                        ? "border-b-0"
                        : ""
                    } ${isHighlighted ? "bg-[var(--color-active-bg)]" : ""}`}
                  >
                    {isHighlighted && (
                      <div className="pointer-events-none absolute inset-[2px] z-10 border-2 border-[var(--color-emphasis)]" />
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

              {Array.from({ length: emptyRowCount }, (_, index) => {
                const isLastEmptyRow = index === emptyRowCount - 1;

                return (
                  <div
                    key={`empty-row-${index}`}
                    aria-hidden="true"
                    className={`grid min-h-[64px] grid-cols-[56px_minmax(0,1fr)_104px] items-center border-b border-[var(--color-nav-border)] px-4 py-3 opacity-0 sm:min-h-[72px] sm:grid-cols-[100px_1fr_220px] sm:px-8 sm:py-4 ${
                      isLastEmptyRow ? "border-b-0" : ""
                    }`}
                  >
                    <p>0</p>
                    <p>placeholder</p>
                    <p>00:00:000</p>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="mt-4 flex min-h-[44px] flex-col items-center justify-between gap-3 sm:flex-row">
          {!isLoading && !error && rankings.length > 0 && (
            <>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-primary)] opacity-60">
                Showing {firstRankingIndex + 1}-
                {Math.min(lastRankingIndex, rankings.length)} of{" "}
                {rankings.length}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={safeCurrentPage === 1}
                  className="rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Prev
                </button>

                {visiblePageNumbers[0] > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
                    >
                      1
                    </button>

                    <span className="px-1 text-sm font-black opacity-60">
                      ...
                    </span>
                  </>
                )}

                {visiblePageNumbers.map((pageNumber) => {
                  const isActive = pageNumber === safeCurrentPage;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black transition ${
                        isActive
                          ? "bg-[var(--color-emphasis)] text-[var(--color-emphasis-contrast)]"
                          : "border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] text-[var(--color-text-primary)] hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {visiblePageNumbers[visiblePageNumbers.length - 1] <
                  totalPages && (
                  <>
                    <span className="px-1 text-sm font-black opacity-60">
                      ...
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] text-sm font-black text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)]"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={safeCurrentPage === totalPages}
                  className="rounded-xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-primary)] transition hover:border-[var(--color-emphasis)] hover:text-[var(--color-emphasis)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default LeaderboardPage;
