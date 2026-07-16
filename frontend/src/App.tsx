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
import TutorialOverlay from "./components/TutorialOverlay";
import type { TutorialStep } from "./components/TutorialOverlay";
import type { CompletedScore } from "./components/GamePage";
import type { AuthUser } from "./types/auth";
import { createScore } from "./api/scores";
import { useMinimalSoundEffects } from "./hooks/useMinimalSoundEffects";
import {
  playSoundToggleOffSound,
  playSoundToggleOnSound,
  setSoundEffectsEnabled,
} from "./utils/soundEffects";

const USER_STORAGE_KEY = "spatialSenseUser";
const SOUND_STORAGE_KEY = "spatialSenseSoundEnabled";
const TUTORIAL_STORAGE_KEY = "spatialSenseTutorialSeen";
const TUTORIAL_DIFFICULTY_INDEX = 2;

const tutorialSteps: TutorialStep[] = [
  {
    route: "/",
    target: "tutorial-button",
    title: "Tutorial",
    description:
      "You can replay this guide anytime from the Tutorial button in the navbar. Click Skip to exit the tutorial mode.",
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
      "When you are ready, start the game. The goal is to rotate your block until it matches the target.",
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
    target: "rotation-step-buttons",
    title: "Rotation Step",
    description:
      "Choose how many degrees each rotation should apply. Some puzzles need smaller 45 degree rotations.",
  },
  {
    route: "/game",
    target: "rotation-axis-buttons",
    title: "Rotate X, Y, and Z",
    description:
      "Use these buttons to rotate the block around different axes. Try different directions to match the target.",
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
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(true);

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== "false";
  });

  const [difficultyIndex, setDifficultyIndex] = useState(0);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingScore, setPendingScore] = useState<CompletedScore | null>(null);

  const [shouldWarnBeforeLeavingGame, setShouldWarnBeforeLeavingGame] =
    useState(false);

  const [isLeaveGameModalOpen, setIsLeaveGameModalOpen] = useState(false);

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);

  const pendingLeaveActionRef = useRef<(() => void) | null>(null);
  const isSavingScoreRef = useRef(false);

  useMinimalSoundEffects(isSoundEnabled);

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
    const hasSeenTutorial =
      localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";

    if (!hasSeenTutorial) {
      setDifficultyIndex(TUTORIAL_DIFFICULTY_INDEX);
      setTutorialStepIndex(0);
      setIsTutorialOpen(true);
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!isTutorialOpen) return;

    const currentStep = tutorialSteps[tutorialStepIndex];

    if (!currentStep) return;

    if (location.pathname !== currentStep.route) {
      setShouldWarnBeforeLeavingGame(false);
      navigate(currentStep.route);
    }
  }, [isTutorialOpen, tutorialStepIndex, location.pathname, navigate]);

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

    setIsSoundEnabled(nextValue);
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

  function handleStartTutorial() {
    requestLeaveGame(() => {
      setIsAuthModalOpen(false);
      setIsProfileModalOpen(false);
      setPendingScore(null);
      setShouldWarnBeforeLeavingGame(false);
      setDifficultyIndex(TUTORIAL_DIFFICULTY_INDEX);
      setTutorialStepIndex(0);
      setIsTutorialOpen(true);
      navigate("/");
    });
  }

  function closeTutorial() {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setIsTutorialOpen(false);
    setTutorialStepIndex(0);
    setShouldWarnBeforeLeavingGame(false);

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

  setTutorialStepIndex(safeNextIndex);
  setShouldWarnBeforeLeavingGame(false);

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
        isSoundEnabled={isSoundEnabled}
        currentUser={currentUser}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
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
              onDifficultyChange={setDifficultyIndex}
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
              onGameProgressChange={setShouldWarnBeforeLeavingGame}
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