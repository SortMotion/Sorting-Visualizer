# Visualizador de Algoritmos de Ordenamiento — Arquitectura y Contratos

> Objetivo de este documento: que los 4 integrantes podamos trabajar en paralelo desde hoy, sin bloquearnos entre sí, porque todos conocen de antemano la "forma"(contrato) de lo que reciben y entregan los demás.

## 0. Resumen del proyecto

- SPA (una sola página) que anima algoritmos de ordenamiento en un `<canvas>`.
- Algoritmos v1: Bubble, Selection, Insertion, Exchange, Gnome, Merge, Quick Sort.
- Layout: barra superior (selector de algoritmo) → canvas central (animación) → barra inferior (cantidad de elementos, randomizar, ordenar, controles tipo video: play/pause/velocidad/retroceder).
- Stack: Vite + React + TypeScript, Tailwind CSS, Zustand, desplegado en Vercel.

## 1. Stack y por qué

| Herramienta | Uso | Fuente oficial |
|---|---|---|
| Vite + React + TS | Base del proyecto | https://vite.dev/guide/ |
| Tailwind CSS | Estilos | https://tailwindcss.com/docs/installation/using-vite |
| Zustand | Estado global (sin boilerplate, sin Provider hell) | https://zustand.docs.pmnd.rs/getting-started/introduction |
| Canvas API | Dibujo del arreglo/animación | https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API |
| Generator functions (JS/TS) | Los algoritmos "emiten" pasos uno a uno | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function* |
| Vercel | Deploy + preview deployments automáticos por PR | https://vercel.com/docs/deployments/git |

## 2. La idea central: el algoritmo nunca dibuja, solo "narra" lo que hace

Cada algoritmo se implementa como una **función generadora** que recibe el arreglo y va `yield`-eando un objeto `SortStep` cada vez que compara, intercambia, etc. Nadie ejecuta el algoritmo en vivo mientras se anima: **primero se materializan todos los pasos en un arreglo (`SortStep[]`)**, y luego el reproductor solo avanza/retrocede un índice sobre ese arreglo. Esto es lo que hace trivial el control tipo video (pausa, velocidad, retroceder), porque "retroceder" es solo `currentIndex--`.

```ts
// Ejemplo de uso (esto va en el componente/hook que dispara el ordenamiento)
const steps: SortStep[] = [...quickSort.run(values)]; // se consume todo el generador de una vez
playbackStore.loadSteps(steps);
```

## 3. Contratos en TypeScript

Archivo: `src/algorithms/types.ts`. **Nadie modifica este archivo sin avisar**, porque todos dependen de él.

```ts
// src/algorithms/types.ts

// Un "paso" es la unidad mínima de animación. El motor de Canvas
// solo necesita saber dibujar cada uno de estos, sin saber nada
// del algoritmo que lo generó.
export type SortStep =
  | { kind: "compare"; indices: [number, number] }
  | { kind: "swap"; indices: [number, number] }
  | { kind: "set"; index: number; value: number } // sobrescribir un valor (usado en insertion/merge)
  | { kind: "sorted"; index: number }              // elemento ya en su posición final
  | { kind: "pivot"; index: number }               // resaltado especial para Quick Sort
  | { kind: "merge-range"; range: [number, number] } // sub-arreglo activo en Merge Sort
  | { kind: "done" };                              // fin del algoritmo

// Cada archivo de algoritmo exporta un objeto con esta forma.
export type SortAlgorithm = {
  id: string;   // "bubble" | "selection" | "insertion" | "exchange" | "gnome" | "merge" | "quick"
  name: string; // nombre visible en el menú, ej. "Bubble Sort"
  run: (input: number[]) => Generator<SortStep, void, void>;
};
```

Ejemplo de implementación (referencia para quien haga cada algoritmo):

```ts
// src/algorithms/bubbleSort.ts
import type { SortAlgorithm, SortStep } from "./types";

function* bubbleSortSteps(arr: number[]): Generator<SortStep> {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      yield { kind: "compare", indices: [j, j + 1] };
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        yield { kind: "swap", indices: [j, j + 1] };
      }
    }
    yield { kind: "sorted", index: a.length - 1 - i };
  }
  yield { kind: "sorted", index: 0 };
  yield { kind: "done" };
}

export const bubbleSort: SortAlgorithm = {
  id: "bubble",
  name: "Bubble Sort",
  run: bubbleSortSteps,
};
```

Registro central (así el menú y todo lo demás no necesita conocer cada algoritmo por separado):

```ts
// src/algorithms/index.ts
import { bubbleSort } from "./bubbleSort";
import { selectionSort } from "./selectionSort";
import { insertionSort } from "./insertionSort";
import { exchangeSort } from "./exchangeSort";
import { gnomeSort } from "./gnomeSort";
import { mergeSort } from "./mergeSort";
import { quickSort } from "./quickSort";
import type { SortAlgorithm } from "./types";

export const ALGORITHMS: SortAlgorithm[] = [
  bubbleSort, selectionSort, insertionSort, exchangeSort, gnomeSort, mergeSort, quickSort,
];
```

## 4. Estado global (Zustand) — contratos de los stores

```ts
// src/store/useAlgorithmStore.ts
interface AlgorithmState {
  algorithmId: string;
  arraySize: number;
  values: number[];
  setAlgorithm: (id: string) => void;
  setArraySize: (n: number) => void;
  randomize: () => void;
}
```

```ts
// src/store/usePlaybackStore.ts
interface PlaybackState {
  steps: SortStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number; // 0.5, 1, 2, 4 ...
  loadSteps: (steps: SortStep[]) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setSpeed: (s: number) => void;
  reset: () => void;
}
```

Quien construye la UI de controles (BottomControls) solo necesita saber que existen estos dos stores y sus funciones — no necesita saber cómo están implementados los algoritmos ni el canvas.

## 5. Estructura de carpetas

```
src/
  algorithms/
    types.ts          # CONTRATO
    bubbleSort.ts
    selectionSort.ts
    insertionSort.ts
    exchangeSort.ts
    gnomeSort.ts
    mergeSort.ts
    quickSort.ts
    index.ts           # registro de todos
  components/
    layout/
      TopBar.tsx        # selector de algoritmo
      BottomControls.tsx # cantidad, randomizar, ordenar, play/pause/velocidad/retroceder
    canvas/
      SortCanvas.tsx    # <canvas> + resize
      renderer.ts       # función pura: dibuja un frame (bar chart) según values + step actual
  store/
    useAlgorithmStore.ts
    usePlaybackStore.ts
  hooks/
    usePlaybackEngine.ts # avanza currentStepIndex automáticamente según isPlaying/speed
  utils/
    randomArray.ts
  App.tsx
  main.tsx
```

## 6. Flujo completo

1. Usuario elige algoritmo (`TopBar` → `useAlgorithmStore`) y cantidad/randomiza (`BottomControls` → `useAlgorithmStore`).
2. Usuario da clic en "Ordenar" → se busca el algoritmo en `ALGORITHMS` por `id`, se llama `algorithm.run(values)` y se materializa con `[...generador]` → `usePlaybackStore.loadSteps(steps)`.
3. `usePlaybackEngine` (hook) observa `isPlaying` y `speed`; en un intervalo llama `usePlaybackStore.next()`.
4. `SortCanvas` se suscribe a `currentStepIndex` y a `values`, y en cada cambio llama a `renderer.ts` para dibujar el bar chart con el color correspondiente según el `kind` del `SortStep` actual (comparando, swap, pivote, ordenado, etc.).
5. `BottomControls` llama `pause()/play()/prev()/next()/setSpeed()` directo sobre `usePlaybackStore`.

## 7. Git workflow 

- Branches: `feature/<nombre-tarea>` (ej. `feature/quick-sort`, `feature/canvas-renderer`, `feature/topbar`).
- Commits: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`, `chore:`) — facilita revisar el historial y es estándar en la industria.
- PRs pequeños y enfocados en un solo módulo (un algoritmo, un componente), para que la revisión sea rápida.

## 8. Reparto de tareas propuesto

| # | Tarea | Sugerido para | Bloquea a |
|---|---|---|---|
| 1 | `algorithms/types.ts` (contrato) | Andy | Todo lo demás |
| 2 | Setup Vite + TS + Tailwind + Zustand | Andy | Todo lo demás |
| 3 | `utils/randomArray.ts` | Adriel | Nada |
| 4 | Bubble Sort | Omar | Nada |
| 5 | Selection Sort | Omar | Nada |
| 6 | Insertion Sort | Omar | Nada |
| 7 | Exchange Sort | Omar | Nada |
| 8 | Gnome Sort | Adriel | Nada |
| 9 | Merge Sort | Diego | Nada |
| 10 | Quick Sort | Diego | Nada |
| 11 | `TopBar.tsx` | Adriel | Nada (usa datos mock hasta integrar) |
| 12 | `BottomControls.tsx` | Adriel | Nada |
| 13 | `renderer.ts` (dibujo bar chart) | Diego | SortCanvas |
| 14 | `SortCanvas.tsx` | Diego | Integración final |
| 15 | `usePlaybackStore.ts` + `usePlaybackEngine.ts` | Andy | Integración final |
| 16 | Integración en `App.tsx` | Andy | — (al final) |
| 17 | Deploy en Vercel + CI check | Andy | — |

Todas estas tareas van a `Backlog` ahora mismo; se mueven a `In Progress` cuando cada quien empiece, a `In Review` al abrir el PR, y a `Done` al mergear.
