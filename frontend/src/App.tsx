import { useCallback, useEffect, useRef } from "react";
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
import TutorialOverlay from "./components/TutorialOverlay";
import type { TutorialStep } from "./components/TutorialOverlay";
import type { CompletedScore } from "./components/GamePage";
import type { AuthUser } from "./types/auth";
import { wakeDatabaseConnection } from "./api/config";
import { createScore } from "./api/scores";
import { useMinimalSoundEffects } from "./hooks/useMinimalSoundEffects";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  closeTutorial as closeTutorialState,
  setAuthModalOpen,
  setCurrentUser,
  setDifficultyIndex,
  setLeaveGameModalOpen,
  setPendingScore,
  setProfileModalOpen,
  setShouldWarnBeforeLeavingGame,
  setSoundEnabled,
  setTutorialStepIndex,
  SOUND_STORAGE_KEY,
  startTutorial,
  toggleTheme,
  TUTORIAL_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "./store/appSlice";
import {
  playSoundToggleOffSound,
  playSoundToggleOnSound,
  setSoundEffectsEnabled,
} from "./utils/soundEffects";

const tutorialSteps: TutorialStep[] = [
  {
    route: "/",
    target: "tutorial-button",
    showHighlight: false,
    title: "Tutorial",
    description:
      "You can replay this guide anytime from the Tutorial button in the navbar. Click Exit to exit the tutorial mode.",
  },
  {
    route: "/",
    target: "difficulty-selector",
    title: "Choose Difficulty",
    description:
      "Use this slider to choose Easy, Medium, or Difficult before starting.",
  },
  {
    route: "/",
    target: "start-game",
    title: "Start Game",
    description:
      "When you are ready, start the game. Be prepared because the timer will start accordingly.",
  },
  {
    route: "/game",
    target: "target-block",
    title: "Target Block",
    description:
      "This is the target orientation. Try to make your block look exactly like this.",
  },
  {
    route: "/game",
    target: "player-block",
    title: "Your Block",
    description:
      "This is the block you control. Rotate it until it matches the target block.",
  },
  {
    route: "/game",
    target: "rotation-axis-buttons",
    title: "Rotation Axis",
    description:
      "Choose the X, Y, or Z axis you want to rotate around.",
  },
  {
    route: "/game",
    target: "rotation-step-buttons",
    title: "Rotation Degrees",
    description:
      "Click a degree button to rotate the selected axis. Some puzzles need 45 degree rotations.",
  },
  {
    route: "/game",
    target: "progress-grid",
    title: "Progress",
    description:
      "Each tick means one puzzle is completed. Finish all puzzles to complete the game.",
  },
  {
    route: "/game",
    target: "timer-panel",
    title: "Timer and Penalty",
    description:
      "Your score is based on time. In Easy and Medium mode, there is no penalty. In Difficult mode, extra rotations after the free steps add time penalty.",
  },
  {
    route: "/game",
    target: "reset-button",
    title: "Reset",
    description:
      "Reset only resets the current block orientation. It does not reset the timer or penalty.",
  },
  {
    route: "/game",
    target: "rotation-axis-buttons",
    title: "How to Play?",
    description:
      "This example shows how a 90° rotation around the Y axis changes the block.",
    visual: "rotation-demo",
  },
];

function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isDarkMode,
    isSoundEnabled,
    difficultyIndex,
    currentUser,
    isAuthModalOpen,
    isProfileModalOpen,
    pendingScore,
    shouldWarnBeforeLeavingGame,
    isLeaveGameModalOpen,
    isTutorialOpen,
    tutorialStepIndex,
  } = useAppSelector((state) => state.app);

  const pendingLeaveActionRef = useRef<(() => void) | null>(null);
  const isSavingScoreRef = useRef(false);
  const handleGameProgressChange = useCallback(
    (shouldWarn: boolean) => {
      dispatch(setShouldWarnBeforeLeavingGame(shouldWarn));
    },
    [dispatch]
  );

  useMinimalSoundEffects(isSoundEnabled);

  useEffect(() => {
    wakeDatabaseConnection().catch(() => {
      // Keep database warm-up invisible; user actions still use retry handling.
    });
  }, []);

  useEffect(() => {
    const hasSeenTutorial =
      localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";

    if (!hasSeenTutorial) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!isTutorialOpen) return;

    const currentStep = tutorialSteps[tutorialStepIndex];

    if (!currentStep) return;

    if (location.pathname !== currentStep.route) {
      dispatch(setShouldWarnBeforeLeavingGame(false));
      navigate(currentStep.route);
    }
  }, [
    dispatch,
    isTutorialOpen,
    tutorialStepIndex,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (
      !shouldWarnBeforeLeavingGame ||
      location.pathname !== "/game" ||
      isTutorialOpen
    ) {
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
  }, [location.pathname, shouldWarnBeforeLeavingGame, isTutorialOpen]);

  function handleToggleSound() {
    const nextValue = !isSoundEnabled;

    if (isSoundEnabled) {
      playSoundToggleOffSound();
    }

    setSoundEffectsEnabled(nextValue);

    if (nextValue) {
      playSoundToggleOnSound();
    }

    dispatch(setSoundEnabled(nextValue));
    localStorage.setItem(SOUND_STORAGE_KEY, String(nextValue));
  }

  function requestLeaveGame(actionAfterLeaving: () => void) {
    if (
      location.pathname !== "/game" ||
      !shouldWarnBeforeLeavingGame ||
      isTutorialOpen
    ) {
      actionAfterLeaving();
      return;
    }

    pendingLeaveActionRef.current = actionAfterLeaving;
    dispatch(setLeaveGameModalOpen(true));
  }

  function handleStayOnGame() {
    pendingLeaveActionRef.current = null;
    dispatch(setLeaveGameModalOpen(false));
  }

  function handleConfirmLeaveGame() {
    const actionAfterLeaving = pendingLeaveActionRef.current;

    pendingLeaveActionRef.current = null;
    dispatch(setLeaveGameModalOpen(false));
    dispatch(setShouldWarnBeforeLeavingGame(false));

    actionAfterLeaving?.();
  }

  function handleGuardedNavigate(path: string) {
    requestLeaveGame(() => {
      dispatch(setShouldWarnBeforeLeavingGame(false));
      navigate(path);
    });
  }

  function handleGuardedLoginClick() {
    requestLeaveGame(() => {
      dispatch(setShouldWarnBeforeLeavingGame(false));

      if (location.pathname === "/game") {
        navigate("/");
      }

      handleOpenAuthModal(null);
    });
  }

  function saveUser(user: AuthUser) {
    dispatch(setCurrentUser(user));
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  function handleLogout() {
    dispatch(setCurrentUser(null));
    dispatch(setProfileModalOpen(false));
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

    dispatch(setProfileModalOpen(true));
  }

  function handleCloseProfileModal() {
    dispatch(setProfileModalOpen(false));
  }

  function handleUserUpdated(user: AuthUser) {
    saveUser(user);
  }

  function handleAccountDeleted() {
    dispatch(setCurrentUser(null));
    dispatch(setProfileModalOpen(false));
    dispatch(setAuthModalOpen(false));
    dispatch(setPendingScore(null));
    localStorage.removeItem(USER_STORAGE_KEY);
    navigate("/");
  }

  function handleBackHomeWithoutSaving() {
    dispatch(setAuthModalOpen(false));
    dispatch(setPendingScore(null));
    dispatch(setShouldWarnBeforeLeavingGame(false));
    navigate("/");
  }

  function handleOpenAuthModal(score?: CompletedScore | null) {
    dispatch(setPendingScore(score ?? null));
    dispatch(setAuthModalOpen(true));
  }

  function handleCloseAuthModal() {
    dispatch(setAuthModalOpen(false));
  }

  function handleStartTutorial() {
    requestLeaveGame(() => {
      dispatch(startTutorial());
      navigate("/");
    });
  }

  function closeTutorial() {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    dispatch(closeTutorialState());

    if (location.pathname === "/game") {
      navigate("/");
    }
  }

  function goToTutorialStep(nextIndex: number) {
    const safeNextIndex = Math.min(
      Math.max(nextIndex, 0),
      tutorialSteps.length - 1
    );

    const nextStep = tutorialSteps[safeNextIndex];

    dispatch(setTutorialStepIndex(safeNextIndex));
    dispatch(setShouldWarnBeforeLeavingGame(false));

    if (location.pathname !== nextStep.route) {
      navigate(nextStep.route);
    }
  }

  function handleTutorialNext() {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      closeTutorial();
      return;
    }

    goToTutorialStep(tutorialStepIndex + 1);
  }

  function handleTutorialBack() {
    goToTutorialStep(tutorialStepIndex - 1);
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

      dispatch(setPendingScore(null));
      dispatch(setShouldWarnBeforeLeavingGame(false));

      navigate(
        `/leaderboard?difficulty=${difficultyQuery}&highlightScoreId=${savedScore.id}`
      );
    } finally {
      isSavingScoreRef.current = false;
    }
  }

  async function handleAuthenticated(user: AuthUser) {
    saveUser(user);
    dispatch(setAuthModalOpen(false));

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
        isSoundEnabled={isSoundEnabled}
        currentUser={currentUser}
        isTutorialActive={isTutorialOpen}
        onToggleTheme={() => dispatch(toggleTheme())}
        onToggleSound={handleToggleSound}
        onNavigateRequest={handleGuardedNavigate}
        onLoginClick={handleGuardedLoginClick}
        onLogout={handleLogout}
        onProfileClick={handleOpenProfileModal}
        onStartTutorial={handleStartTutorial}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HeroSection
              difficultyIndex={difficultyIndex}
              onDifficultyChange={(nextDifficulty) =>
                dispatch(setDifficultyIndex(nextDifficulty))
              }
              isTutorialActive={isTutorialOpen}
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
              onGameProgressChange={handleGameProgressChange}
              isTutorialActive={isTutorialOpen}
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

      {isTutorialOpen && (
        <TutorialOverlay
          steps={tutorialSteps}
          currentStepIndex={tutorialStepIndex}
          onNext={handleTutorialNext}
          onBack={handleTutorialBack}
          onSkip={closeTutorial}
        />
      )}
    </main>
  );
}

export default App;
