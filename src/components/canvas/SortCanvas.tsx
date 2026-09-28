import { useEffect, useMemo, useRef, useState } from "react";
import type { SortAlgorithm, SortStep } from "../../algorithms/types";
import { INTERVAL_MS } from "../../hooks/usePlaybackEngine";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import { advanceScene, clamp, createScene, syncScene, type Scene } from "./animation";
import MetricsOverlay, { type Lane } from "./MetricsOverlay";
import { renderScene } from "./renderer";

// ---------------------------------------------------------------------------
// Reconstrucción del arreglo en un paso dado
// ---------------------------------------------------------------------------
// Los SortStep solo "narran" lo que pasó (Arquitectura.md §2): no traen el
// arreglo completo. Para dibujar el paso `i` hay que aplicar los pasos 0..i
// sobre los `values` originales. Para que avanzar, retroceder o saltar sea
// barato incluso con Stooge Sort (cientos de miles de pasos), se guarda una
// "foto" del estado cada CHECKPOINT_INTERVAL pasos y solo se reaplican los
// pasos que faltan desde la foto más cercana.
//
// Además del valor, cada posición guarda la identidad (`ids`) del elemento que
// la ocupa. Los swaps mueven la identidad junto con el valor; así la animación
// sabe qué barra viajó a dónde y la puede desplazar en lugar de repintarla.

const CHECKPOINT_INTERVAL = 256;

// Duraciones de la animación entre pasos.
const JUMP_MS = 650; // saltos grandes, datos nuevos o pasos nuevos
const MANUAL_MS = 340; // avance/retroceso manual en pausa
const MIN_STEP_MS = 70;
const MAX_STEP_MS = 420;

function stepDuration(isPlaying: boolean, speed: number): number {
    // Se deja ~15% del intervalo libre para que cada movimiento termine antes del siguiente paso.
    return isPlaying ? clamp((INTERVAL_MS / speed) * 0.85, MIN_STEP_MS, MAX_STEP_MS) : MANUAL_MS;
}

type Checkpoint = {
    array: number[];
    ids: Int32Array;
    sorted: Uint8Array;
};

type Timeline = {
    checkpoints: Checkpoint[];
};

type Frame = {
    array: number[];
    ids: Int32Array;
    sorted: Uint8Array;
    step: SortStep | null;
    index: number;
};

function inBounds(index: number, length: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < length;
}

function identity(n: number): Int32Array {
    const ids = new Int32Array(n);
    for (let i = 0; i < n; i++) ids[i] = i;
    return ids;
}

// Aplica un paso sobre el estado (muta `array`, `ids` y `sorted`).
// Los índices fuera de rango se ignoran: puede pasar durante el render en que
// `values` ya cambió pero BottomControls todavía no descarta los pasos viejos.
function applyStep(array: number[], ids: Int32Array, sorted: Uint8Array, step: SortStep): void {
    const n = array.length;

    switch (step.kind) {
        case "swap": {
            const [i, j] = step.indices;
            if (inBounds(i, n) && inBounds(j, n)) {
                [array[i], array[j]] = [array[j], array[i]];
                const id = ids[i];
                ids[i] = ids[j];
                ids[j] = id;
            }
            break;
        }
        case "set":
            if (inBounds(step.index, n)) array[step.index] = step.value;
            break;
        case "sorted":
            if (inBounds(step.index, n)) sorted[step.index] = 1;
            break;
        case "done":
            sorted.fill(1);
            break;
        // "compare", "pivot" y "merge-range" solo resaltan; no cambian el estado.
    }
}

// Checkpoint `c` = estado DESPUÉS de aplicar el paso `c * CHECKPOINT_INTERVAL`.
function buildTimeline(values: number[], steps: SortStep[]): Timeline {
    const array = [...values];
    const ids = identity(values.length);
    const sorted = new Uint8Array(values.length);
    const checkpoints: Checkpoint[] = [];

    for (let i = 0; i < steps.length; i++) {
        applyStep(array, ids, sorted, steps[i]);
        if (i % CHECKPOINT_INTERVAL === 0) {
            checkpoints.push({ array: array.slice(), ids: ids.slice(), sorted: sorted.slice() });
        }
    }

    return { checkpoints };
}

function getFrame(
    timeline: Timeline,
    values: number[],
    steps: SortStep[],
    stepIndex: number
): Frame {
    if (steps.length === 0 || timeline.checkpoints.length === 0) {
        return {
            array: values,
            ids: identity(values.length),
            sorted: new Uint8Array(values.length),
            step: null,
            index: -1,
        };
    }

    // Arquitectura.md §4.1: si este carril ya terminó, se queda congelado en
    // su último paso mientras el otro carril sigue avanzando.
    const index = Math.min(Math.max(stepIndex, 0), steps.length - 1);

    const checkpointIndex = Math.floor(index / CHECKPOINT_INTERVAL);
    const checkpoint = timeline.checkpoints[checkpointIndex];
    const array = checkpoint.array.slice();
    const ids = checkpoint.ids.slice();
    const sorted = checkpoint.sorted.slice();

    for (let i = checkpointIndex * CHECKPOINT_INTERVAL + 1; i <= index; i++) {
        applyStep(array, ids, sorted, steps[i]);
    }

    return { array, ids, sorted, step: steps[index], index };
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

type CanvasSize = {
    width: number;
    height: number;
    dpr: number;
};

type PrevFrameInfo = {
    steps: SortStep[];
    values: number[];
    index: number;
};

export type SortCanvasProps = {
    /** Pasos de este carril (`steps.primary` o `steps.secondary`). */
    steps: SortStep[];
    /** Arreglo original sobre el que se generaron los pasos. */
    values: number[];
    /** Algoritmo de este carril (nombre y complejidad para el overlay). */
    algorithm: SortAlgorithm | undefined;
    /** Carril: define qué `executionTimes[lane]` lee MetricsOverlay. */
    lane?: Lane;
    className?: string;
};

function SortCanvas({
    steps,
    values,
    algorithm,
    lane = "primary",
    className = "",
}: SortCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sizeRef = useRef<CanvasSize>({ width: 0, height: 0, dpr: 1 });
    const kickRef = useRef<() => void>(() => {});
    const prevFrameRef = useRef<PrevFrameInfo | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    if (sceneRef.current === null) sceneRef.current = createScene();

    const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 });
    const reducedMotion = usePrefersReducedMotion();

    const currentStepIndex = usePlaybackStore((state) => state.currentStepIndex);
    const isPlaying = usePlaybackStore((state) => state.isPlaying);
    const speed = usePlaybackStore((state) => state.speed);

    // Se recalcula solo cuando llegan pasos nuevos o cambian los datos.
    const timeline = useMemo(() => buildTimeline(values, steps), [values, steps]);

    const frame = useMemo(
        () => getFrame(timeline, values, steps, currentStepIndex),
        [timeline, values, steps, currentStepIndex]
    );

    // Observa el tamaño del contenedor (el callback inicial de ResizeObserver
    // da la primera medida, así que no hace falta medir a mano en el efecto).
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;

            const width = Math.floor(entry.contentRect.width);
            const height = Math.floor(entry.contentRect.height);
            const dpr = window.devicePixelRatio || 1;

            setSize((prev) =>
                prev.width === width && prev.height === height && prev.dpr === dpr
                    ? prev
                    : { width, height, dpr }
            );
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Loop de animación: solo corre mientras algo se mueve; `kick` lo despierta.
    useEffect(() => {
        let raf = 0;

        const loop = () => {
            raf = 0;
            const scene = sceneRef.current;
            const canvas = canvasRef.current;
            if (!scene) return;

            const now = performance.now();
            const active = advanceScene(scene, now);

            const { width, height, dpr } = sizeRef.current;
            const ctx = canvas && width > 0 && height > 0 ? canvas.getContext("2d") : null;
            if (ctx) {
                // El renderer trabaja en px CSS; la escala se encarga del resto.
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                renderScene({ ctx, width, height, scene, now });
            }

            if (active) raf = requestAnimationFrame(loop);
        };

        kickRef.current = () => {
            if (raf === 0) raf = requestAnimationFrame(loop);
        };
        kickRef.current();

        return () => {
            if (raf !== 0) cancelAnimationFrame(raf);
            raf = 0;
            kickRef.current = () => {};
        };
    }, []);

    // Resolución física = tamaño CSS × devicePixelRatio, para que las barras
    // no se vean borrosas en pantallas HiDPI.
    useEffect(() => {
        sizeRef.current = size;
        const canvas = canvasRef.current;
        if (!canvas || size.width === 0 || size.height === 0) return;

        const pixelWidth = Math.round(size.width * size.dpr);
        const pixelHeight = Math.round(size.height * size.dpr);
        if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
        if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

        kickRef.current();
    }, [size]);

    // Cada frame nuevo fija los destinos de la animación.
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const prev = prevFrameRef.current;
        const jump =
            prev !== null &&
            (prev.steps !== steps ||
                prev.values !== values ||
                Math.abs(frame.index - prev.index) > 1);
        prevFrameRef.current = { steps, values, index: frame.index };

        syncScene(scene, frame, {
            now: performance.now(),
            duration: jump ? JUMP_MS : stepDuration(isPlaying, speed),
            jump,
            reducedMotion,
        });
        kickRef.current();
    }, [frame, steps, values, isPlaying, speed, reducedMotion]);

    const name = algorithm?.name ?? "Sin algoritmo";

    return (
        <section
            className={`relative flex min-h-64 w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 ${className}`}
        >
            <div ref={containerRef} className="relative min-h-0 flex-1">
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={`Visualización de ${name} con ${values.length} elementos`}
                    className="absolute inset-0 block h-full w-full"
                />
            </div>

            <MetricsOverlay steps={steps} algorithm={algorithm} lane={lane} />
        </section>
    );
}

export default SortCanvas;
