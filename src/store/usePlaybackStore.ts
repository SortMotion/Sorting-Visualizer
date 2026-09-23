import type { SortStep } from "../algorithms/types";
import { create } from "zustand";

interface PlaybackState {
  steps: SortStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  loadSteps: (steps: SortStep[]) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setSpeed: (s: number) => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  steps: [],
  currentStepIndex: 0,
  isPlaying: false,
  speed: 1,
  loadSteps: (steps: SortStep[]) => set({ steps, currentStepIndex: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  next: () => set((state) => ({ currentStepIndex: Math.min(state.currentStepIndex + 1, state.steps.length - 1) })),
  prev: () => set((state) => ({ currentStepIndex: Math.max(state.currentStepIndex - 1, 0) })),
  setSpeed: (s: number) => set({ speed: s }),
  reset: () => set({ currentStepIndex: 0 }),
}));
