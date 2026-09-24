import type { SortAlgorithm, SortStep } from "./types";

function* quickSortGenerator(array: number[]): Generator<SortStep, void, unknown> {
    const arr = [...array];


    function swap(i: number, j: number): void {
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    function* partition(
        low: number,
        high: number
    ): Generator<SortStep, number, unknown> {
        const pivotValue = arr[high];
        const pivotIndex = high;

        yield {
            kind: "pivot",
            index: pivotIndex,
        };

        let i = low - 1;

        for (let j = low; j < high; j++) {
            yield {
                kind: "compare",
                indices: [j, pivotIndex],
            };

            if (arr[j] < pivotValue) {
                i++;
                if (i !== j) {
                    swap(i, j);
                    yield {
                        kind: "swap",
                        indices: [i, j],
                    };
                }
            }
        }

        if (i + 1!== high) {
            swap(i + 1, high);
            yield {
                kind: "swap",
                indices: [i + 1, high],
            };
        }

        const finalPivotIndex = i + 1;

        yield {
            kind: "sorted",
            index: finalPivotIndex,
        };

        return finalPivotIndex;
    }

    function* quickSortRecursive(
        low: number,
        high: number
    ): Generator<SortStep, void, unknown> {
        if (low < high) {
            const pIndex: number = yield* partition(low, high);

            yield* quickSortRecursive(low, pIndex - 1);
            yield* quickSortRecursive(pIndex + 1, high);
        }else if (low === high) {
            yield {
                kind: "sorted",
                index: low,
            };
        }
    }

    yield* quickSortRecursive(0, arr.length - 1);
    yield { kind: "done"};
}

export const quickSort: SortAlgorithm = {
    id: "quick",
    name: "Quick Sort",
    complexity: "O(n log n)",
    run: quickSortGenerator,
};