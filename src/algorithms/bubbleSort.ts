import type { SortAlgorithm, SortStep } from "./types";

function* bubbleSortGenerator(
    array: number[]
): Generator<SortStep, void, void> {
    const arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
    let swapped = false;

    for (let j = 0; j < n - i - 1; j++) {
        yield {
        kind: "compare",
        indices: [j, j + 1],
        };

        if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;

        yield {
            kind: "swap",
            indices: [j, j + 1],
        };
        }
    }

    yield {
        kind: "sorted",
        index: n - 1 - i,
    };

    if (!swapped) {
        for (let k = 0; k < n - 1 - i; k++) {
        yield {
            kind: "sorted",
            index: k,
        };
        }
        break;
    }
    }

    yield {
    kind: "sorted",
    index: 0,
    };

    yield { kind: "done" };
}

export const bubbleSort: SortAlgorithm = {
    id: "bubble",
    name: "Bubble Sort",
    complexity: "O(n²)",
    run: bubbleSortGenerator,
};