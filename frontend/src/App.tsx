import { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [difficultyIndex, setDifficultyIndex] = useState(0);

  return (
    <main
      className={`app-shell relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "" : "theme-light"
      } bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]`}
    >
      <Navbar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
      />

      <HeroSection
        difficultyIndex={difficultyIndex}
        onDifficultyChange={setDifficultyIndex}
      />
    </main>
  );
}

export default App;