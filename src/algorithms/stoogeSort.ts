import type { SortAlgorithm, SortStep } from "./types";

function* stoogeSortSteps(arr: number[]): Generator<SortStep> {
    const a = [...arr];

    function* stooge(i: number, j: number): Generator<SortStep> {
    yield { kind: "merge-range", range: [i, j] };

    yield { kind: "compare", indices: [i, j] };
    if (a[i] > a[j]) {
        [a[i], a[j]] = [a[j], a[i]];
        yield { kind: "swap", indices: [i, j] };
    }

    if (j - i + 1 > 2) {
        const tercio = Math.floor((j - i + 1) / 3);
        yield* stooge(i, j - tercio);
        yield* stooge(i + tercio, j);
        yield* stooge(i, j - tercio);
    }
}

yield* stooge(0, a.length - 1);

for (let k = 0; k < a.length; k++) {
    yield { kind: "sorted", index: k };
}
    yield { kind: "done" };
}

export const stoogeSort: SortAlgorithm = {
    id: "stooge",
    name: "Stooge Sort",
    complexity: "O(n^(log 3 / log 1.5)) ≈ O(n^2.71)",
    run: stoogeSortSteps,
};