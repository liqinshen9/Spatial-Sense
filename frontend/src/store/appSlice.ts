import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "../types/auth";

export const USER_STORAGE_KEY = "spatialSenseUser";
export const SOUND_STORAGE_KEY = "spatialSenseSoundEnabled";
export const TUTORIAL_STORAGE_KEY = "spatialSenseTutorialSeen";
export const TUTORIAL_DIFFICULTY_INDEX = 2;

type PendingScore = {
  difficultyName: string;
  elapsedMilliseconds: number;
  formattedTime: string;
};

type AppState = {
  isDarkMode: boolean;
  isSoundEnabled: boolean;
  difficultyIndex: number;
  currentUser: AuthUser | null;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  pendingScore: PendingScore | null;
  shouldWarnBeforeLeavingGame: boolean;
  isLeaveGameModalOpen: boolean;
  isTutorialOpen: boolean;
  tutorialStepIndex: number;
};

function getStoredUser() {
  const savedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";

const initialState: AppState = {
  isDarkMode: true,
  isSoundEnabled: localStorage.getItem(SOUND_STORAGE_KEY) !== "false",
  difficultyIndex: hasSeenTutorial ? 0 : TUTORIAL_DIFFICULTY_INDEX,
  currentUser: getStoredUser(),
  isAuthModalOpen: false,
  isProfileModalOpen: false,
  pendingScore: null,
  shouldWarnBeforeLeavingGame: false,
  isLeaveGameModalOpen: false,
  isTutorialOpen: !hasSeenTutorial,
  tutorialStepIndex: 0,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.isDarkMode = !state.isDarkMode;
    },
    setSoundEnabled(state, action: PayloadAction<boolean>) {
      state.isSoundEnabled = action.payload;
    },
    setDifficultyIndex(state, action: PayloadAction<number>) {
      state.difficultyIndex = action.payload;
    },
    setCurrentUser(state, action: PayloadAction<AuthUser | null>) {
      state.currentUser = action.payload;
    },
    setAuthModalOpen(state, action: PayloadAction<boolean>) {
      state.isAuthModalOpen = action.payload;
    },
    setProfileModalOpen(state, action: PayloadAction<boolean>) {
      state.isProfileModalOpen = action.payload;
    },
    setPendingScore(state, action: PayloadAction<PendingScore | null>) {
      state.pendingScore = action.payload;
    },
    setShouldWarnBeforeLeavingGame(state, action: PayloadAction<boolean>) {
      state.shouldWarnBeforeLeavingGame = action.payload;
    },
    setLeaveGameModalOpen(state, action: PayloadAction<boolean>) {
      state.isLeaveGameModalOpen = action.payload;
    },
    startTutorial(state) {
      state.isAuthModalOpen = false;
      state.isProfileModalOpen = false;
      state.pendingScore = null;
      state.shouldWarnBeforeLeavingGame = false;
      state.difficultyIndex = TUTORIAL_DIFFICULTY_INDEX;
      state.tutorialStepIndex = 0;
      state.isTutorialOpen = true;
    },
    closeTutorial(state) {
      state.isTutorialOpen = false;
      state.tutorialStepIndex = 0;
      state.shouldWarnBeforeLeavingGame = false;
    },
    setTutorialStepIndex(state, action: PayloadAction<number>) {
      state.tutorialStepIndex = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setSoundEnabled,
  setDifficultyIndex,
  setCurrentUser,
  setAuthModalOpen,
  setProfileModalOpen,
  setPendingScore,
  setShouldWarnBeforeLeavingGame,
  setLeaveGameModalOpen,
  startTutorial,
  closeTutorial,
  setTutorialStepIndex,
} = appSlice.actions;

export default appSlice.reducer;

//this file defines the app-level state and reducers