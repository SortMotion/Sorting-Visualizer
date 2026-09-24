import type { SortStep } from "../algorithms/types";

export type CumulativeCounts = {
    compares: Uint32Array;
    swaps: Uint32Array;
    writes: Uint32Array;
};

// Recorre los pasos UNA sola vez y guarda conteos acumulados:
// compares[i] = número de "compare" en steps[0..i] (inclusive).
// Así cada frame obtiene sus métricas en O(1) en lugar de volver a
// recorrer el arreglo: Stooge Sort con 100 elementos genera cientos
// de miles de pasos y contarlos 60 veces por segundo congelaría la UI.
export function buildCumulativeCounts(steps: SortStep[]): CumulativeCounts {
    const n = steps.length;
    const compares = new Uint32Array(n);
    const swaps = new Uint32Array(n);
    const writes = new Uint32Array(n);

    let c = 0;
    let s = 0;
    let w = 0;

    for (let i = 0; i < n; i++) {
        switch (steps[i].kind) {
            case "compare":
                c++;
                break;
            case "swap":
                s++;
                break;
            case "set":
                w++;
                break;
        }
        compares[i] = c;
        swaps[i] = s;
        writes[i] = w;
    }

    return { compares, swaps, writes };
}
