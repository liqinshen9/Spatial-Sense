import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import GamePage from "./components/GamePage";
import LeaderboardPage from "./components/Leaderboard";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./components/AuthModel";
import type { CompletedScore } from "./components/GamePage";
import type { AuthUser } from "./types/auth";
import { createScore } from "./api/scores";

const USER_STORAGE_KEY = "spatialSenseUser";

function App() {
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [difficultyIndex, setDifficultyIndex] = useState(0);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingScore, setPendingScore] = useState<CompletedScore | null>(null);
  const isSavingScoreRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!savedUser) return;

    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  function saveUser(user: AuthUser) {
    setCurrentUser(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  function handleLogout() {
  setCurrentUser(null);
  localStorage.removeItem(USER_STORAGE_KEY);

  if (location.pathname === "/leaderboard") {
    const params = new URLSearchParams(location.search);
    params.delete("highlightScoreId");

    const query = params.toString();
    navigate(query ? `/leaderboard?${query}` : "/leaderboard", {
      replace: true,
    });
  }
}

  function handleBackHomeWithoutSaving() {
    setIsAuthModalOpen(false);
    setPendingScore(null);
    navigate("/");
  }

  function handleOpenAuthModal(score?: CompletedScore | null) {
    setPendingScore(score ?? null);
    setIsAuthModalOpen(true);
  }

  function handleCloseAuthModal() {
    setIsAuthModalOpen(false);
  }

  async function saveScoreAndOpenLeaderboard(
  score: CompletedScore,
  userOverride?: AuthUser
) {
  const user = userOverride ?? currentUser;

  if (!user) {
    handleOpenAuthModal(score);
    return;
  }

  if (isSavingScoreRef.current) {
    return;
  }

  try {
    isSavingScoreRef.current = true;

    const savedScore = await createScore({
      userId: user.id,
      difficulty: score.difficultyName,
      elapsedMilliseconds: score.elapsedMilliseconds,
    });

    const difficultyQuery = score.difficultyName.toLowerCase();

    setPendingScore(null);
    navigate(
      `/leaderboard?difficulty=${difficultyQuery}&highlightScoreId=${savedScore.id}`
    );
  } finally {
    isSavingScoreRef.current = false;
  }
}

  async function handleAuthenticated(user: AuthUser) {
    saveUser(user);
    setIsAuthModalOpen(false);

    if (pendingScore) {
      await saveScoreAndOpenLeaderboard(pendingScore, user);
    }
  }

  return (
    <main
      className={`app-shell relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
        isDarkMode ? "" : "theme-light"
      } bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]`}
    >
      <Navbar
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onLoginClick={() => handleOpenAuthModal(null)}
        onLogout={handleLogout}
      />

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
              currentUser={currentUser}
              onBackHome={handleBackHomeWithoutSaving}
              onOpenAuthModal={handleOpenAuthModal}
              onViewLeaderboard={saveScoreAndOpenLeaderboard}
            />
          }
        />

        <Route
        path="/leaderboard"
        element={<LeaderboardPage currentUser={currentUser} />}
      />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isAuthModalOpen && (
        <AuthModal
          pendingScore={pendingScore}
          onClose={handleCloseAuthModal}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </main>
  );
}

export default App;