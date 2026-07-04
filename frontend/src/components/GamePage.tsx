type GamePageProps = {
  difficultyIndex: number;
};

const difficultyNames = ["Easy", "Medium", "Difficult"] as const;

function GamePage({ difficultyIndex }: GamePageProps) {
  const difficultyName = difficultyNames[difficultyIndex] ?? "Easy";

  return (
    <section className="relative z-10 flex min-h-[calc(100vh-56px)] items-center justify-center px-12">
      <div className="text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[var(--color-emphasis)]">
          Current difficulty: {difficultyName}
        </p>

        <h1 className="text-5xl font-black text-[var(--color-text-primary)]">
          Game Area
        </h1>
      </div>
    </section>
  );
}

export default GamePage;