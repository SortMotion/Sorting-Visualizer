import type { SortAlgorithm, SortStep } from "./types";

function* exchangeSortGenerator(
    array: number[]
): Generator<SortStep, void, void> {
    const arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
        yield {
        kind: "compare",
        indices: [i, j],
        };

        if (arr[i] > arr[j]) {
        [arr[i], arr[j]] = [arr[j], arr[i]];

        yield {
            kind: "swap",
            indices: [i, j],
        };
        }
    }

    yield {
        kind: "sorted",
        index: i,
    };
    }

    yield {
    kind: "sorted",
    index: n - 1,
    };

    yield { kind: "done" };
}

export const exchangeSort: SortAlgorithm = {
    id: "exchange",
    name: "Exchange Sort",
    complexity: "O(n²)",
    run: exchangeSortGenerator,
};