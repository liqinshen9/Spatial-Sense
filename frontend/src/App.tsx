import { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import GamePage from "./components/GamePage";
import LeaderboardPage from "./components/Leaderboard";
import { Navigate, Route, Routes } from "react-router-dom";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [difficultyIndex, setDifficultyIndex] = useState(0);

  return (
    <main
      className={`app-shell relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
        isDarkMode ? "" : "theme-light"
      } bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]`}
    >
      <Navbar
      isDarkMode={isDarkMode}
      onToggleTheme={() => setIsDarkMode((prev) => !prev)}/>

      <Routes>
        <Route
          path="/"
          element={
            <HeroSection
              difficultyIndex={difficultyIndex}
              onDifficultyChange={setDifficultyIndex}
            />
          }
        />

        <Route
          path="/game"
          element={<GamePage difficultyIndex={difficultyIndex} />}
        />

        <Route path="/leaderboard" element={<LeaderboardPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;