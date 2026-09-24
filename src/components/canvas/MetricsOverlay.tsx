import { useMemo } from "react";
import type { SortAlgorithm, SortStep } from "../../algorithms/types";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import { buildCumulativeCounts } from "../../utils/stepMetrics";

export type Lane = "primary" | "secondary";

type MetricsOverlayProps = {
    /** Pasos del carril que dibuja el SortCanvas padre (los mismos que recibe por props). */
    steps: SortStep[];
    /** Algoritmo del carril; de aquí sale el nombre y la complejidad teórica. */
    algorithm: SortAlgorithm | undefined;
    /** Carril del que se lee el tiempo de ejecución en usePlaybackStore.executionTimes. */
    lane?: Lane;
    className?: string;
};

const numberFormat = new Intl.NumberFormat("en-US");

function formatCount(n: number): string {
    return numberFormat.format(n);
}

// performance.now() puede venir redondeado por el navegador (precisión
// reducida por seguridad), así que tiempos muy pequeños se muestran como cota.
function formatTime(ms: number | null): string {
    if (ms === null) return "—";
    if (ms < 0.01) return "<0.01 ms";
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

type MetricProps = {
    label: string;
    value: string;
    highlight?: boolean;
};

function Metric({ label, value, highlight = false }: MetricProps) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[8px] uppercase tracking-[0.25em] text-slate-500">
                {label}
            </dt>
            <dd
                className={`font-mono text-[11px] tabular-nums ${
                    highlight ? "text-cyan-300" : "text-slate-200"
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

function MetricsOverlay({
    steps,
    algorithm,
    lane = "primary",
    className = "",
}: MetricsOverlayProps) {
    const currentStepIndex = usePlaybackStore((state) => state.currentStepIndex);
    const executionTime = usePlaybackStore((state) => state.executionTimes[lane]);

    // Solo se recalcula cuando cambia el arreglo de pasos (nuevo "Sort"),
    // no en cada avance de currentStepIndex.
    const counts = useMemo(() => buildCumulativeCounts(steps), [steps]);

    const total = steps.length;
    const hasSteps = total > 0;

    // Arquitectura.md §4.1: si este carril terminó antes que el otro,
    // se queda "congelado" en su último paso mientras el otro sigue.
    const visibleIndex = hasSteps ? Math.min(currentStepIndex, total - 1) : -1;
    const isFinished = hasSteps && visibleIndex === total - 1;

    const comparisons = hasSteps ? counts.compares[visibleIndex] : 0;
    const swaps = hasSteps ? counts.swaps[visibleIndex] : 0;
    const writes = hasSteps ? counts.writes[visibleIndex] : 0;

    // Insertion/Merge mueven datos con "set" en lugar de "swap"; sin esta
    // fila mostrarían 0 intercambios y parecería que no hicieron trabajo.
    const usesWrites = hasSteps && counts.writes[total - 1] > 0;

    const progress = hasSteps
        ? total === 1
            ? 100
            : (visibleIndex / (total - 1)) * 100
        : 0;

    let status: { label: string; dot: string; text: string };
    if (!hasSteps) {
        status = { label: "Idle", dot: "bg-slate-600", text: "text-slate-500" };
    } else if (isFinished) {
        status = { label: "Done", dot: "bg-emerald-400", text: "text-emerald-400" };
    } else {
        status = { label: "Running", dot: "bg-cyan-400", text: "text-cyan-400" };
    }

    const name = algorithm?.name ?? "No algorithm";
    const laneTag = lane === "primary" ? "A" : "B";

    return (
        <aside
            aria-label={`Metrics for ${name}`}
            className={`pointer-events-none absolute right-3 top-3 z-10 w-52 max-w-[calc(100%-1.5rem)] select-none overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/55 text-white shadow-[0_8px_32px_rgba(2,6,23,0.45)] backdrop-blur-md ${className}`}
        >
            {/* --- Encabezado: carril, nombre y estado --- */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-cyan-400/30 bg-cyan-400/5 font-mono text-[9px] text-cyan-300">
                        {laneTag}
                    </span>
                    <p className="truncate text-[11px] font-semibold tracking-[0.08em] text-slate-100">
                        {name}
                    </p>
                </div>

                <span className="flex shrink-0 items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    <span className={`text-[8px] uppercase tracking-[0.25em] ${status.text}`}>
                        {status.label}
                    </span>
                </span>
            </div>

            {/* --- Métricas --- */}
            <dl className="space-y-1.5 px-3 py-2.5">
                <Metric
                    label="Complexity"
                    value={algorithm?.complexity ?? "—"}
                    highlight
                />
                <Metric
                    label="Steps"
                    value={
                        hasSteps
                            ? `${formatCount(visibleIndex + 1)} / ${formatCount(total)}`
                            : "—"
                    }
                />
                <Metric
                    label="Comparisons"
                    value={hasSteps ? formatCount(comparisons) : "—"}
                />
                <Metric
                    label="Swaps"
                    value={hasSteps ? formatCount(swaps) : "—"}
                />
                {usesWrites && <Metric label="Writes" value={formatCount(writes)} />}
                <Metric label="Time" value={formatTime(executionTime)} />
            </dl>

            {/* --- Progreso de este carril --- */}
            <div className="h-0.5 w-full bg-slate-800/80">
                <div
                    className={`h-full transition-[width] duration-150 ease-linear motion-reduce:transition-none ${
                        isFinished ? "bg-emerald-400" : "bg-cyan-400"
                    }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </aside>
    );
}

export default MetricsOverlay;
