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
    <section className="relative z-10 min-h-[calc(100vh-56px)]">
      <HomeBlocks />
      <div className="absolute left-[7%] top-[14%] z-10">
        <h1 className="select-none font-['Major_Mono_Display'] text-[7.2rem] uppercase leading-[0.85] tracking-[0.03em] md:text-[8rem]">
          <span className="block">Spatial</span>
          <span className="block">
            Se
            <span className="text-[var(--color-emphasis)]">n</span>
            se
          </span>
        </h1>

        <div className="mt-8 flex items-end gap-6">
          <button
            type="button"
            onClick={() => navigate("/game")}
            className="rounded-xl bg-[var(--color-emphasis)] px-8 py-4 text-lg font-black text-[var(--color-emphasis-contrast)] transition hover:bg-[var(--color-emphasis-hover)]"
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