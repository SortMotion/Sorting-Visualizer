import { create } from "zustand";
import type { SortStep } from "../algorithms/types";

export type StepLanes = { primary: SortStep[]; secondary: SortStep[] | null };
export type ExecutionTimes = { primary: number | null; secondary: number | null };

interface PlaybackState {
  steps: StepLanes;
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  executionTimes: ExecutionTimes;

  loadSteps: (steps: StepLanes) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setSpeed: (s: number) => void;
  reset: () => void;
}

const EMPTY_TIMES: ExecutionTimes = { primary: null, secondary: null };

export function getTotalSteps(steps: StepLanes): number {
  return Math.max(steps.primary.length, steps.secondary?.length ?? 0);
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  steps: { primary: [], secondary: null },
  currentStepIndex: 0,
  isPlaying: false,
  speed: 1,
  executionTimes: EMPTY_TIMES,

  loadSteps: (steps) =>
    set({
      steps,
      currentStepIndex: 0,
      isPlaying: false,
      executionTimes: EMPTY_TIMES,
    }),

  play: () =>
    set((state) => {
      const total = getTotalSteps(state.steps);
      if (total === 0) return state;
      if (state.currentStepIndex >= total - 1) {
        return { currentStepIndex: 0, isPlaying: true };
      }
      return { isPlaying: true };
    }),

  pause: () => set({ isPlaying: false }),

  next: () =>
    set((state) => {
      const total = getTotalSteps(state.steps);
      if (total === 0) return state;

      const last = total - 1;
      const nextIndex = Math.min(state.currentStepIndex + 1, last);

      return {
        currentStepIndex: nextIndex,
        isPlaying: state.isPlaying && nextIndex < last,
      };
    }),

  prev: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    })),

  setSpeed: (s) => set({ speed: s }),

  reset: () => set({ currentStepIndex: 0, isPlaying: false }),
}));
