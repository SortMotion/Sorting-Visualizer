import type { SortAlgorithm, SortStep } from "./types";

function* selectionSortSteps(input: number[]): Generator<SortStep, void, void> {
    const a = [...input];
    const n = a.length;

    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;

        for (let j = i + 1; j < n; j++) {
            yield { kind: "compare", indices: [minIndex, j] };
            if (a[j] < a[minIndex]) {
                minIndex = j;
            }
        }

        if (minIndex !== i) {
            [a[i], a[minIndex]] = [a[minIndex], a[i]];
            yield { kind: "swap", indices: [i, minIndex] };
        }

        yield { kind: "sorted", index: i };
    }

    if (n > 0) {
        yield { kind: "sorted", index: n - 1 };
    }

    yield { kind: "done" };
}

export const selectionSort: SortAlgorithm = {
    id: "selection",
    name: "Selection Sort",
    complexity: "O(n²)",
    run: selectionSortSteps,
};
