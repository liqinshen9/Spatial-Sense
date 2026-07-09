import { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import GamePage from "./components/GamePage";
import LeaderboardPage from "./components/Leaderboard";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AuthModal from "./components/AuthModel";
import type { CompletedScore } from "./components/GamePage";

function App() {
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [difficultyIndex, setDifficultyIndex] = useState(0);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingScore, setPendingScore] = useState<CompletedScore | null>(null);

  function handleBackHomeWithoutSaving() {
    setIsAuthModalOpen(false);
    setPendingScore(null);
    navigate("/");
  }

  function handleOpenAuthModal(score: CompletedScore) {
    setPendingScore(score);
    setIsAuthModalOpen(true);
  }

  function handleCloseAuthModal() {
    setIsAuthModalOpen(false);
  }

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
          element={
            <GamePage
              difficultyIndex={difficultyIndex}
              onBackHome={handleBackHomeWithoutSaving}
              onOpenAuthModal={handleOpenAuthModal}
            />
          }
        />

        <Route path="/leaderboard" element={<LeaderboardPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isAuthModalOpen && (
        <AuthModal
          pendingScore={pendingScore}
          onClose={handleCloseAuthModal}
        />
      )}
    </main>
  );
}

export default App;