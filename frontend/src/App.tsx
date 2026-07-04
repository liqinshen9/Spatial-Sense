import { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import GamePage from "./components/GamePage";
import LeaderboardPage from "./components/Leaderboard";

type Page = "home" | "game" | "leaderboard";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [difficultyIndex, setDifficultyIndex] = useState(0);
  //create a state called currentPage to record what page the user is on, with "home" as the default value
  const [currentPage, setCurrentPage] = useState<"home" | "game" | "leaderboard">("home");

  return (
    <main
      className={`app-shell relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "" : "theme-light"
      } bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]`}
    >
      <Navbar
      isDarkMode={isDarkMode}
      activePage={currentPage}
      onToggleTheme={() => setIsDarkMode((prev) => !prev)}
      onGoHome={() => setCurrentPage("home")}
      onGoLeaderboard={() => setCurrentPage("leaderboard")}
    />
      
      {/*when user clicks start game, set currentPage to "game" and React will re-render, user will go to game page*/}
      {currentPage === "home" && (
        <HeroSection
          difficultyIndex={difficultyIndex}
          onDifficultyChange={setDifficultyIndex}
          onStartGame={() => setCurrentPage("game")}
        />
      )}
      {currentPage === "game" && <GamePage difficultyIndex={difficultyIndex} />}
      {currentPage === "leaderboard" && <LeaderboardPage />}
    </main>
  );
}

export default App;