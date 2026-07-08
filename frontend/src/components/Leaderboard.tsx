import { useState } from "react";

type Difficulty = "easy" | "medium" | "difficult";

type LeaderboardEntry = {
  rank: number;
  username: string;
  time: string;
};

const leaderboardData: Record<Difficulty, LeaderboardEntry[]> = {
  //sample players, will be replaced with real data from backend in the future
  easy: [
    { rank: 1, username: "ShapeRunner", time: "00:38" },
    { rank: 2, username: "BlueCube", time: "00:45" },
    { rank: 3, username: "PuzzleCat", time: "00:52" },
    { rank: 4, username: "FastBlock", time: "01:03" },
    { rank: 5, username: "QuietSolver", time: "01:18" },
  ],
  medium: [
    { rank: 1, username: "CubeWizard", time: "01:24" },
    { rank: 2, username: "LogicFox", time: "01:41" },
    { rank: 3, username: "RotateMaster", time: "01:59" },
    { rank: 4, username: "AngleHunter", time: "02:12" },
    { rank: 5, username: "GridGhost", time: "02:35" },
  ],
  difficult: [
    { rank: 1, username: "NoMercy", time: "03:08" },
    { rank: 2, username: "BrainBurn", time: "03:46" },
    { rank: 3, username: "FinalTry", time: "04:21" },
    { rank: 4, username: "ShapeDemon", time: "04:58" },
    { rank: 5, username: "StillThinking", time: "05:37" },
  ],
};

const difficultyOptions: { label: string; value: Difficulty }[] = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Difficult", value: "difficult" },
];

function LeaderboardPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");
  const currentRankings = leaderboardData[selectedDifficulty];

  return (
    <section className="relative z-10 min-h-[calc(100vh-56px)] px-12 py-10">
      <div className="mx-auto max-w-5xl">

        {/* difficulty control */}
        <div className="mb-8 flex w-fit rounded-2xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] p-2 backdrop-blur-md">
          {difficultyOptions.map((difficulty) => {
            const isActive = selectedDifficulty === difficulty.value;

            return (
              <button
                key={difficulty.value}
                type="button"
                onClick={() => setSelectedDifficulty(difficulty.value)}
                className={`rounded-xl px-8 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
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

        {/* ranking table */}
        <div className="overflow-hidden rounded-3xl border border-[var(--color-nav-border)] bg-[var(--color-leaderboard-card)] backdrop-blur-md">
          <div className="grid grid-cols-[100px_1fr_180px] border-b border-[var(--color-nav-border)] px-8 py-5 text-sm font-black uppercase tracking-[0.2em] opacity-70">
            <p>Rank</p>
            <p>Username</p>
            <p className="text-right">Time</p>
          </div>

          <div>
            {/*Go through every player inside currentRankings, and create one leaderboard row for each player.*/}
            {currentRankings.map((player) => (
              <div
                key={player.rank}
                className="grid grid-cols-[100px_1fr_180px] items-center border-b border-[var(--color-nav-border)] px-8 py-5 last:border-b-0"
              >
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-emphasis)] text-lg font-black text-[var(--color-emphasis-contrast)]">
                    {player.rank}
                  </span>
                </div>

                <p className="text-xl font-black text-[var(--color-text-primary)]">
                  {player.username}
                </p>

                <p className="text-right font-mono text-xl font-black text-[var(--color-emphasis)]">
                  {player.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LeaderboardPage;