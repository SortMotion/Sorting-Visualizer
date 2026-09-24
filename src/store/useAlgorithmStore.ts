import { create } from "zustand";
import { generateRandomArray } from "../utils/randomArray";

export const MIN_ARRAY_SIZE = 5;
export const MAX_ARRAY_SIZE = 100;
const DEFAULT_ARRAY_SIZE = 30;

const MIN_VALUE = 5;
const MAX_VALUE = 100;

function clampSize(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_ARRAY_SIZE;
  return Math.min(MAX_ARRAY_SIZE, Math.max(MIN_ARRAY_SIZE, Math.round(n)));
}

function newValues(size: number): number[] {
  return generateRandomArray(size, MIN_VALUE, MAX_VALUE);
}

interface AlgorithmState {
  algorithmId: string;
  arraySize: number;
  values: number[];
  setAlgorithm: (id: string) => void;
  setArraySize: (n: number) => void;
  randomize: () => void;

  isComparing: boolean;
  compareAlgorithmId: string | null;
  toggleCompare: () => void;
  setCompareAlgorithm: (id: string) => void;
}

export const useAlgorithmStore = create<AlgorithmState>((set) => ({
  algorithmId: "bubble",
  arraySize: DEFAULT_ARRAY_SIZE,
  values: newValues(DEFAULT_ARRAY_SIZE),

  setAlgorithm: (id) =>
    set((state) => ({
      algorithmId: id,
      compareAlgorithmId:
        state.compareAlgorithmId === id ? null : state.compareAlgorithmId,
    })),

  setArraySize: (n) =>
    set((state) => {
      const size = clampSize(n);
      if (size === state.arraySize) return state;
      return { arraySize: size, values: newValues(size) };
    }),

  randomize: () => set((state) => ({ values: newValues(state.arraySize) })),

  isComparing: false,
  compareAlgorithmId: null,

  toggleCompare: () =>
    set((state) => ({
      isComparing: !state.isComparing,
      compareAlgorithmId: state.isComparing ? null : state.compareAlgorithmId,
    })),

  setCompareAlgorithm: (id) =>
    set((state) =>
      id === state.algorithmId ? state : { compareAlgorithmId: id }
    ),
}));
