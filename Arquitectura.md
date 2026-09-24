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
  id: string;   // "bubble" | "selection" | "insertion" | "exchange" | "gnome" | "merge" | "quick" | "stooge"
  name: string; // nombre visible en el menú, ej. "Bubble Sort"
  complexity: string; // complejidad teórica, ej. "O(n²)" — la lee MetricsOverlay directo de aquí
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
  complexity: "O(n²)",
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
import { stoogeSort } from "./stoogeSort";
import type { SortAlgorithm } from "./types";

export const ALGORITHMS: SortAlgorithm[] = [
  bubbleSort, selectionSort, insertionSort, exchangeSort, gnomeSort, mergeSort, quickSort, stoogeSort,
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

  // --- Modo comparación (dos algoritmos en paralelo) ---
  isComparing: boolean;              // default: false
  compareAlgorithmId: string | null; // default: null (sin selección hasta que el usuario elige)
  toggleCompare: () => void;
  setCompareAlgorithm: (id: string) => void;
}
```

```ts
// src/store/usePlaybackStore.ts
interface PlaybackState {
  // `steps` ahora soporta dos "carriles" de pasos para animar ambos algoritmos
  // sobre los mismos datos sin duplicar el motor de reproducción.
  steps: { primary: SortStep[]; secondary: SortStep[] | null };
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number; // 0.5, 1, 2, 4 ...

  // Tiempo real de ejecución (medido con performance.now() por runAndMeasure,
  // ver sección 4.2). `null` mientras no se haya corrido ese algoritmo todavía.
  executionTimes: { primary: number | null; secondary: number | null };

  loadSteps: (steps: { primary: SortStep[]; secondary: SortStep[] | null }) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setSpeed: (s: number) => void;
  reset: () => void;
}
```

Quien construye la UI de controles (BottomControls) solo necesita saber que existen estos dos stores y sus funciones — no necesita saber cómo están implementados los algoritmos ni el canvas.

### 4.1 `next()` / `prev()` en modo comparación

Cuando `steps.secondary` no es `null`, el límite superior de `currentStepIndex` ya no es `steps.primary.length`, sino el `Math.max` de la longitud de ambos arreglos:

```ts
const maxLength = Math.max(
  steps.primary.length,
  steps.secondary?.length ?? 0
);
```

Si un algoritmo termina antes que el otro (sus arreglos de pasos tienen distinta longitud), su índice visual se queda "congelado" en su último paso (`done`) mientras el otro sigue avanzando — `SortCanvas` simplemente sigue mostrando el último `SortStep` disponible de ese carril cuando `currentStepIndex` supera su longitud.

### 4.2 Medición de tiempo de ejecución: `runAndMeasure`

Archivo a crear: `src/utils/runAndMeasure.ts`. Es una función pura (no sabe nada de React ni de Zustand) que envuelve la materialización del generador con `performance.now()` para obtener milisegundos reales de CPU:

```ts
// src/utils/runAndMeasure.ts
import type { SortAlgorithm, SortStep } from "../algorithms/types";

export function runAndMeasure(
  algorithm: SortAlgorithm,
  values: number[]
): { steps: SortStep[]; time: number } {
  const start = performance.now();
  const steps = [...algorithm.run(values)];
  const end = performance.now();
  return { steps, time: end - start };
}
```

Se llama una vez para `primary` y, si `isComparing` es `true`, una segunda vez para `secondary`. El resultado de cada llamada alimenta tanto `usePlaybackStore.loadSteps()` como `usePlaybackStore.executionTimes`. Fuente oficial sobre `performance.now()` (alta resolución, en milisegundos): https://developer.mozilla.org/en-US/docs/Web/API/Performance/now

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
    stoogeSort.ts       
    index.ts           # registro de todos
  components/
    layout/
      TopBar.tsx        # selector de algoritmo + toggle "Comparar algoritmos"
      BottomControls.tsx # cantidad, randomizar, ordenar, play/pause/velocidad/retroceder
    canvas/
      CanvasLayout.tsx  # contenedor inteligente: decide 1 o 2 columnas según isComparing
      SortCanvas.tsx    # componente puro: <canvas> + resize + integra MetricsOverlay
      MetricsOverlay.tsx # panel flotante con métricas por algoritmo
      renderer.ts       # función pura: dibuja un frame (bar chart) según values + step actual
  store/
    useAlgorithmStore.ts
    usePlaybackStore.ts
  hooks/
    usePlaybackEngine.ts # avanza currentStepIndex automáticamente según isPlaying/speed
  utils/
    randomArray.ts
    runAndMeasure.ts    # ejecuta un algoritmo y mide su tiempo con performance.now()
  App.tsx
  main.tsx
```

## 6. Modo comparación: `CanvasLayout`, `SortCanvas` y `MetricsOverlay`

Para mostrar dos algoritmos animándose en paralelo sin duplicar lógica, se separa la responsabilidad de "cuántos canvas mostrar" (layout) de "cómo dibujar un canvas" (componente puro):

- **`CanvasLayout.tsx`** (contenedor inteligente): lee `isComparing` de `useAlgorithmStore` y `steps.primary` / `steps.secondary` de `usePlaybackStore`.
  - Si `isComparing` es `false`: renderiza un contenedor de 1 columna con un solo `<SortCanvas />` (datos de `primary`).
  - Si `isComparing` es `true`: renderiza un grid responsivo (`grid-cols-1 md:grid-cols-2`) con dos `<SortCanvas />`, izquierda = `primary`, derecha = `secondary`.
- **`SortCanvas.tsx`** (componente puro de dibujo): recibe por *props* `steps`, el título del algoritmo y el tiempo de ejecución; mantiene el `useRef` al `<canvas>`, observa su tamaño con `ResizeObserver` (fuente oficial: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) y llama a `renderer.ts` en cada cambio de `currentStepIndex` o de dimensiones. Internamente monta `<MetricsOverlay />`, pasándole los mismos `steps` recibidos por *props*.
- **`MetricsOverlay.tsx`** (panel flotante, estilo *glassmorphism*, posicionado `absolute` en una esquina superior del canvas): muestra, calculado dinámicamente hasta `currentStepIndex`:
  - Complejidad teórica (leída de `algorithm.complexity`).
  - Pasos actuales (`currentStepIndex` / total de pasos).
  - Comparaciones (conteo de pasos con `kind === "compare"` recorridos).
  - Intercambios (conteo de pasos con `kind === "swap"` recorridos).
  - Tiempo de ejecución en ms (leído de `executionTimes` en `usePlaybackStore`, mostrando algo como "—" si aún es `null`).

### 6.1 Activar la comparación desde `TopBar.tsx`

`TopBar.tsx` agrega un control tipo *Toggle/Switch* etiquetado "Comparar algoritmos", conectado a `toggleCompare()` de `useAlgorithmStore`. Cuando `isComparing` es `true`, se renderiza condicionalmente un segundo `<select>` con el mismo diseño que el actual, conectado a `compareAlgorithmId` y `setCompareAlgorithm()`. Ese segundo menú deshabilita la opción ya elegida en el primer menú, para no poder comparar un algoritmo contra sí mismo. Fuente oficial sobre renderizado condicional en React: https://react.dev/learn/conditional-rendering

## 7. Flujo completo

1. Usuario elige algoritmo (`TopBar` → `useAlgorithmStore`) y cantidad/randomiza (`BottomControls` → `useAlgorithmStore`). Opcionalmente activa "Comparar algoritmos" y elige un segundo algoritmo (sección 6.1).
2. Usuario da clic en "Ordenar" → se busca cada algoritmo en `ALGORITHMS` por `id` y se ejecuta con `runAndMeasure(algorithm, values)` (sección 4.2), una vez para `primary` y, si `isComparing` es `true`, otra vez para `secondary` → el resultado alimenta `usePlaybackStore.loadSteps({ primary, secondary })` y `executionTimes`.
3. `usePlaybackEngine` (hook) observa `isPlaying` y `speed`; en un intervalo llama `usePlaybackStore.next()`, cuyo límite superior es el `Math.max` de la longitud de ambos carriles de pasos (sección 4.1).
4. `CanvasLayout` decide 1 o 2 columnas según `isComparing` (sección 6) y monta uno o dos `SortCanvas`, cada uno suscrito a `currentStepIndex` y a los `values`; en cada cambio llama a `renderer.ts` para dibujar el bar chart con el color correspondiente según el `kind` del `SortStep` actual (comparando, swap, pivote, ordenado, etc.), y cada uno muestra su propio `MetricsOverlay`.
5. `BottomControls` llama `pause()/play()/prev()/next()/setSpeed()` directo sobre `usePlaybackStore`.

## 8. Git workflow 

- Branches: `feature/<nombre-tarea>` (ej. `feature/quick-sort`, `feature/canvas-renderer`, `feature/topbar`).
- Commits: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`, `chore:`) — facilita revisar el historial y es estándar en la industria.
- PRs pequeños y enfocados en un solo módulo (un algoritmo, un componente), para que la revisión sea rápida.

## 9. Reparto de tareas propuesto

| # | Tarea | Sugerido para | Bloquea a |
|---|---|---|---|
| 1 | `algorithms/types.ts` (contrato) | Andy | Todo lo demás |
| 2 | Setup Vite + TS + Tailwind + Zustand | Andy | Todo lo demás |
| 3 | `utils/randomArray.ts` | Adriel | Nada |
| 4 | Bubble Sort | Diego | Nada |
| 5 | Selection Sort | Omar | Nada |
| 6 | Insertion Sort | Omar | Nada |
| 7 | Exchange Sort | Omar | Nada |
| 8 | Gnome Sort | Andy | Nada |
| 9 | Merge Sort | Diego | Nada |
| 10 | Quick Sort | Diego | Nada |
| 11 | Stooge Sort | Adriel | Nada |
| 12 | `TopBar.tsx` (+ toggle "Comparar algoritmos") | Diego | Nada (usa datos mock hasta integrar) |
| 13 | `BottomControls.tsx` | Adriel | Nada |
| 14 | `renderer.ts` (dibujo bar chart) | Diego | SortCanvas |
| 15 | `CanvasLayout.tsx` + `SortCanvas.tsx` | Andy | Integración final |
| 16 | `MetricsOverlay.tsx` | Adriel | Nada (usa datos mock hasta integrar) |
| 17 | `utils/runAndMeasure.ts` | Andy | usePlaybackEngine |
| 18 | `usePlaybackStore.ts` + `usePlaybackEngine.ts` (soporte comparación) | Andy | Integración final |
| 19 | Integración en `App.tsx` | Andy | — (al final) |
| 20 | Deploy en Vercel + CI check | Andy | — |

Todas estas tareas van a `Backlog` ahora mismo; se mueven a `In Progress` cuando cada quien empiece, a `In Review` al abrir el PR, y a `Done` al mergear.
