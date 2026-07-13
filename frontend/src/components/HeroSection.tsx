import { useNavigate } from "react-router-dom";
import DifficultySelector from "./DifficultySelector";
import HomeBlocks from "./HomeBlocks";

type HeroSectionProps = {
  difficultyIndex: number;
  onDifficultyChange: (nextDifficulty: number) => void;
};

function HeroSection({
  difficultyIndex,
  onDifficultyChange,
}: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 min-h-[calc(100vh-56px)] overflow-hidden px-6 pt-16 sm:px-0 sm:pt-0">
      <HomeBlocks />

      <div className="relative z-10 mx-auto flex w-full max-w-[320px] flex-col items-start sm:absolute sm:left-[7%] sm:top-[14%] sm:mx-0 sm:max-w-none">
        <h1 className="select-none font-['Major_Mono_Display'] text-[3.35rem] uppercase leading-[0.88] tracking-[0.01em] sm:text-[7.2rem] sm:leading-[0.85] sm:tracking-[0.03em] md:text-[8rem]">
          <span className="block">Spatial</span>
          <span className="block">
            Se
            <span className="text-[var(--color-emphasis)]">n</span>
            se
          </span>
        </h1>

        <div className="mt-7 flex w-full flex-col items-start gap-6 sm:mt-8 sm:w-auto sm:flex-row sm:items-end sm:gap-6">
          <button
            type="button"
            data-sound="start-game"
            onClick={() => navigate("/game")}
            className="rounded-xl bg-[var(--color-emphasis)] px-7 py-3 text-base font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)] sm:px-8 sm:py-4 sm:text-lg"
          >
            Start Game
          </button>

          <DifficultySelector
            difficultyIndex={difficultyIndex}
            onDifficultyChange={onDifficultyChange}
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;