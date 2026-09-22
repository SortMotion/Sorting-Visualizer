import type { SortAlgorithm, SortStep } from "./types";

function* gnomeSortSteps(arr: number[]): Generator<SortStep> {
    const a = [...arr];
    let i = 0;

    while (i < a.length) {
        if (i === 0) {
            i++;
        } else {
            yield { kind: "compare", indices: [i - 1, i] };
            if (a[i] >= a[i - 1]) {
                i++;
            } else {
                [a[i], a[i - 1]] = [a[i - 1], a[i]];
                yield { kind: "swap", indices: [i - 1, i] };
                i--;
            }
        }
    }

    for (let j = 0; j < a.length; j++) {
        yield { kind: "sorted", index: j };
    }

    yield { kind: "done" };
}

export const gnomeSort: SortAlgorithm = {
    id: "gnome",
    name: "Gnome Sort",
    run: gnomeSortSteps,
};
