import { useEffect, useMemo, useRef, useState } from "react";
import type { SortAlgorithm, SortStep } from "../../algorithms/types";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import MetricsOverlay, { type Lane } from "./MetricsOverlay";
import { renderCanvas } from "./renderer";

const CHECKPOINT_INTERVAL = 256;

type Checkpoint = {
    array: number[];
    sorted: Uint8Array;
};

type Timeline = {
    checkpoints: Checkpoint[];
};

type Frame = {
    array: number[];
    sorted: Set<number>;
    step: SortStep | null;
};

function inBounds(index: number, length: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < length;
}

function applyStep(array: number[], sorted: Uint8Array, step: SortStep): void {
    const n = array.length;

    switch (step.kind) {
        case "swap": {
            const [i, j] = step.indices;
            if (inBounds(i, n) && inBounds(j, n)) {
                [array[i], array[j]] = [array[j], array[i]];
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
    }
}

function buildTimeline(values: number[], steps: SortStep[]): Timeline {
    const array = [...values];
    const sorted = new Uint8Array(values.length);
    const checkpoints: Checkpoint[] = [];

    for (let i = 0; i < steps.length; i++) {
        applyStep(array, sorted, steps[i]);
        if (i % CHECKPOINT_INTERVAL === 0) {
            checkpoints.push({ array: array.slice(), sorted: sorted.slice() });
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
        return { array: values, sorted: new Set(), step: null };
    }

    const index = Math.min(Math.max(stepIndex, 0), steps.length - 1);

    const checkpointIndex = Math.floor(index / CHECKPOINT_INTERVAL);
    const checkpoint = timeline.checkpoints[checkpointIndex];
    const array = checkpoint.array.slice();
    const sortedFlags = checkpoint.sorted.slice();

    for (let i = checkpointIndex * CHECKPOINT_INTERVAL + 1; i <= index; i++) {
        applyStep(array, sortedFlags, steps[i]);
    }
    const sorted = new Set<number>();
    sortedFlags.forEach((flag, i) => {
        if (flag) sorted.add(i);
    });

    return { array, sorted, step: steps[index] };
}

type CanvasSize = {
    width: number;
    height: number;
    dpr: number;
};

export type SortCanvasProps = {
    steps: SortStep[];
    values: number[];
    algorithm: SortAlgorithm | undefined;
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
    const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 });

    const currentStepIndex = usePlaybackStore((state) => state.currentStepIndex);

    const timeline = useMemo(() => buildTimeline(values, steps), [values, steps]);

    const frame = useMemo(
        () => getFrame(timeline, values, steps, currentStepIndex),
        [timeline, values, steps, currentStepIndex]
    );

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || size.width === 0 || size.height === 0) return;

        const pixelWidth = Math.round(size.width * size.dpr);
        const pixelHeight = Math.round(size.height * size.dpr);
        if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
        if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);

        renderCanvas({
            ctx,
            width: size.width,
            height: size.height,
            array: frame.array,
            currentStep: frame.step,
            sortedIndices: frame.sorted,
        });
    }, [frame, size]);

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
