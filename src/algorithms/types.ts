export type SortStep =
  | { kind: "compare"; indices: [number, number] }
  | { kind: "swap"; indices: [number, number] }
  | { kind: "set"; index: number; value: number }
  | { kind: "sorted"; index: number }
  | { kind: "pivot"; index: number }
  | { kind: "merge-range"; range: [number, number] }
  | { kind: "done" };


export type SortAlgorithm = {
  id: string;
  name: string;
  complexity: string;
  run: (input: number[]) => Generator<SortStep, void, void>;
};
