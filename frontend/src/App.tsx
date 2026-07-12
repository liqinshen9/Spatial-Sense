import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import GamePage from "./components/GamePage";
import LeaderboardPage from "./components/Leaderboard";
import AuthModal from "./components/AuthModel";
import ConfirmModal from "./components/ConfirmModal";
import ProfileModal from "./components/ProfileModal";
import type { CompletedScore } from "./components/GamePage";
import type { AuthUser } from "./types/auth";
import { createScore } from "./api/scores";

const USER_STORAGE_KEY = "spatialSenseUser";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [difficultyIndex, setDifficultyIndex] = useState(0);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingScore, setPendingScore] = useState<CompletedScore | null>(null);

  const [shouldWarnBeforeLeavingGame, setShouldWarnBeforeLeavingGame] =
    useState(false);

  const [isLeaveGameModalOpen, setIsLeaveGameModalOpen] = useState(false);

  const pendingLeaveActionRef = useRef<(() => void) | null>(null);
  const isSavingScoreRef = useRef(false);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!savedUser) return;

    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!shouldWarnBeforeLeavingGame || location.pathname !== "/game") {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [location.pathname, shouldWarnBeforeLeavingGame]);

  function requestLeaveGame(actionAfterLeaving: () => void) {
    if (location.pathname !== "/game" || !shouldWarnBeforeLeavingGame) {
      actionAfterLeaving();
      return;
    }

    pendingLeaveActionRef.current = actionAfterLeaving;
    setIsLeaveGameModalOpen(true);
  }

  function handleStayOnGame() {
    pendingLeaveActionRef.current = null;
    setIsLeaveGameModalOpen(false);
  }

  function handleConfirmLeaveGame() {
    const actionAfterLeaving = pendingLeaveActionRef.current;

    pendingLeaveActionRef.current = null;
    setIsLeaveGameModalOpen(false);
    setShouldWarnBeforeLeavingGame(false);

    actionAfterLeaving?.();
  }

  function handleGuardedNavigate(path: string) {
    requestLeaveGame(() => {
      setShouldWarnBeforeLeavingGame(false);
      navigate(path);
    });
  }

  function handleGuardedLoginClick() {
    requestLeaveGame(() => {
      setShouldWarnBeforeLeavingGame(false);

      if (location.pathname === "/game") {
        navigate("/");
      }

      handleOpenAuthModal(null);
    });
  }

  function saveUser(user: AuthUser) {
    setCurrentUser(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  function handleLogout() {
    setCurrentUser(null);
    setIsProfileModalOpen(false);
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

  function handleOpenProfileModal() {
    if (!currentUser) return;

    setIsProfileModalOpen(true);
  }

  function handleCloseProfileModal() {
    setIsProfileModalOpen(false);
  }

  function handleUserUpdated(user: AuthUser) {
    saveUser(user);
  }

  function handleAccountDeleted() {
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setIsAuthModalOpen(false);
    setPendingScore(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    navigate("/");
  }

  function handleBackHomeWithoutSaving() {
    setIsAuthModalOpen(false);
    setPendingScore(null);
    setShouldWarnBeforeLeavingGame(false);
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
      setShouldWarnBeforeLeavingGame(false);

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
        onNavigateRequest={handleGuardedNavigate}
        onLoginClick={handleGuardedLoginClick}
        onLogout={handleLogout}
        onProfileClick={handleOpenProfileModal}
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
              onGameProgressChange={setShouldWarnBeforeLeavingGame}
            />
          }
        />

        <Route
          path="/leaderboard"
          element={
            <LeaderboardPage
              currentUser={currentUser}
              onOpenProfileModal={handleOpenProfileModal}
            />
          }
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

      {isProfileModalOpen && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          onClose={handleCloseProfileModal}
          onUserUpdated={handleUserUpdated}
          onAccountDeleted={handleAccountDeleted}
        />
      )}

      {isLeaveGameModalOpen && (
        <ConfirmModal
          title="Leave game?"
          message="Leaving this page will end your current game and your score will not be saved."
          cancelText="Stay"
          confirmText="Leave"
          onCancel={handleStayOnGame}
          onConfirm={handleConfirmLeaveGame}
        />
      )}
    </main>
  );
}

export default App;