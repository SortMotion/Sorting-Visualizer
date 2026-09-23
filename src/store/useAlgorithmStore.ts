import { create } from "zustand";
import { generateRandomArray } from "../utils/randomArray";

interface AlgorithmState {
  algorithmId: string;
  arraySize: number;
  values: number[];
  setAlgorithm: (id: string) => void;
  setArraySize: (n: number) => void;
  randomize: () => void;
}

export const useAlgorithmStore = create<AlgorithmState>((set) => ({
  algorithmId: "bubbleSort",
  arraySize: 0,
  values: [],
  setAlgorithm: (id: string) => set({ algorithmId: id }),
  setArraySize: (n: number) => set({ arraySize: n }),
  randomize: () => set((state) => ({ values: generateRandomArray(state.arraySize) })),
}));
