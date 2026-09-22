import type { SortAlgorithm, SortStep } from "./types";

function* mergeSortGenerator (array: number[]): Generator<SortStep, void, unknown>{
    const arr = [...array];

    function* mergeSortRecursive (
        left: number,
        right: number
    ): Generator<SortStep, void, unknown> {
        if (left >= right) return;

        const mid = Math.floor((left + right)/2);

        yield {
            kind: "merge-range",
            range: [left, right],
        };

        yield* mergeSortRecursive(left, mid);
        yield* mergeSortRecursive(mid + 1, right);

        const temp: number[] = [];
        let i = left;
        let j = right;

        while (i<= mid && j <= right){
            yield {
                kind: "compare",
                indices: [i, j],
            };

            if (arr[i] <= arr[j]){
                temp.push(arr[i]);
                i++;
            }else {
                temp.push(arr[j]);
                j++;
            }
        }

        while (i <= mid){
            temp.push(arr[i]);
            i++;
        }

        while (j <= right){
            temp.push(arr[j]);
            j++;
        }

        for (let k = 0; k < temp.length; k++){
            const targetIndex = left + k;
            arr[targetIndex] = temp[k];

            yield {
                kind: "set",
                index: targetIndex,
                value: temp[k],
            };
        }

        for (let index = left; index <= right; index++){
            yield {
                kind: "sorted",
                index
            };
        }
    }

    yield* mergeSortRecursive(0, arr.length - 1);

    for (let index = 0; index < arr.length; index++){
        yield {
            kind: "done",
        }
    }
}

export const mergeSort: SortAlgorithm = {
    id: "merge",
    name: "Merge Sort",
    run: mergeSortGenerator,
};

export default mergeSort;