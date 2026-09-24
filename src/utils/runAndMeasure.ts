import type { SortAlgorithm, SortStep } from "../algorithms/types";

export function runAndMeasure(
  algorithm: SortAlgorithm,
  values: number[]
): { steps: SortStep[]; time: number } {
  const start = performance.now();
  const steps = [...algorithm.run(values)];
  const end = performance.now();
  return { steps, time: end - start };
}
