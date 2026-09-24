import type { SortAlgorithm, SortStep } from "./types";

// Insertion Sort: toma cada elemento (key) y recorre hacia la derecha
// los mayores que él hasta encontrar su lugar dentro del tramo ya ordenado.
function* insertionSortSteps(input: number[]): Generator<SortStep, void, void> {
    const a = [...input];
    const n = a.length;

    for (let i = 1; i < n; i++) {
        const key = a[i];
        let j = i - 1;

        while (j >= 0) {
            // La key "viaja" en la posición j + 1 mientras se compara.
            yield { kind: "compare", indices: [j, j + 1] };
            if (a[j] <= key) break;

            // Desplaza el mayor una posición a la derecha.
            a[j + 1] = a[j];
            yield { kind: "set", index: j + 1, value: a[j] };
            j--;
        }

        // Coloca la key en el hueco que quedó libre.
        if (j + 1 !== i) {
            a[j + 1] = key;
            yield { kind: "set", index: j + 1, value: key };
        }
    }

    // En Insertion Sort ningún elemento es definitivo hasta el final,
    // así que se marcan todos como ordenados al terminar.
    for (let k = 0; k < n; k++) {
        yield { kind: "sorted", index: k };
    }

    yield { kind: "done" };
}

export const insertionSort: SortAlgorithm = {
    id: "insertion",
    name: "Insertion Sort",
    complexity: "O(n²)",
    run: insertionSortSteps,
};
