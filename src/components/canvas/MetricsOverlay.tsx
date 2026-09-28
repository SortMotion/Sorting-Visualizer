import { useMemo, useState } from "react";
import type { SortAlgorithm, SortStep } from "../../algorithms/types";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import { buildCumulativeCounts } from "../../utils/stepMetrics";

export type Lane = "primary" | "secondary";

type MetricsOverlayProps = {
    steps: SortStep[];
    algorithm: SortAlgorithm | undefined;
    lane?: Lane;
    className?: string;
};

const numberFormat = new Intl.NumberFormat("en-US");

function formatCount(n: number): string {
    return numberFormat.format(n);
}

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
            <dt className="text-[8px] uppercase tracking-[0.25em] text-[#5b6078]">
                {label}
            </dt>
            <dd
                className={`font-mono text-[11px] tabular-nums ${
                    highlight ? "text-[#8bd5ca]" : "text-[#cad3f5]"
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
    const [isExpanded, setIsExpanded] = useState(true);

    const currentStepIndex = usePlaybackStore((state) => state.currentStepIndex);
    const executionTime = usePlaybackStore((state) => state.executionTimes[lane]);

    const counts = useMemo(() => buildCumulativeCounts(steps), [steps]);

    const total = steps.length;
    const hasSteps = total > 0;

    const visibleIndex = hasSteps ? Math.min(currentStepIndex, total - 1) : -1;
    const isFinished = hasSteps && visibleIndex === total - 1;

    const comparisons = hasSteps ? counts.compares[visibleIndex] : 0;
    const swaps = hasSteps ? counts.swaps[visibleIndex] : 0;
    const writes = hasSteps ? counts.writes[visibleIndex] : 0;

    const usesWrites = hasSteps && counts.writes[total - 1] > 0;

    const progress = hasSteps
        ? total === 1
            ? 100
            : (visibleIndex / (total - 1)) * 100
        : 0;

    let status: { label: string; dot: string; text: string };
    if (!hasSteps) {
        status = { label: "Idle", dot: "bg-[#494d64]", text: "text-[#5b6078]" };
    } else if (isFinished) {
        status = { label: "Done", dot: "bg-[#a6da95]", text: "text-[#a6da95]" };
    } else {
        status = { label: "Running", dot: "bg-[#91d7e3]", text: "text-[#91d7e3]" };
    }

    const name = algorithm?.name ?? "No algorithm";
    const laneTag = lane === "primary" ? "A" : "B";

    return (
        <aside
            aria-label={`Metrics for ${name}`}
            className={`pointer-events-none absolute right-3 top-3 z-10 w-52 max-w-[calc(100%-1.5rem)] select-none overflow-hidden rounded-xl border border-[#363a4f]/60 bg-[#1e2030]/55 text-[#cad3f5] shadow-[0_8px_32px_rgba(24,24,37,0.45)] backdrop-blur-md transition-all duration-300 ${className}`}
        >
            <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="pointer-events-auto flex w-full cursor-pointer items-center justify-between gap-2 border-b border-[#363a4f]/50 px-3 py-2 transition-colors hover:bg-[#24273a]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91d7e3]/60"
                aria-expanded={isExpanded}
                title={isExpanded ? "Hide metrics" : "Show metrics"}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#91d7e3]/30 bg-[#91d7e3]/5 font-mono text-[9px] text-[#8bd5ca]">
                        {laneTag}
                    </span>
                    <p className="truncate text-[11px] font-semibold tracking-[0.08em] text-[#cad3f5]">
                        {name}
                    </p>
                </div>

                <span className="flex shrink-0 items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    <span className={`text-[8px] uppercase tracking-[0.25em] ${status.text}`}>
                        {status.label}
                    </span>
                    <svg
                        className={`ml-1 h-3.5 w-3.5 text-[#5b6078] transition-transform duration-300 ${
                            isExpanded ? "" : "rotate-180"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </span>
            </button>

            <div
                className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
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
                </div>
            </div>

            <div className="h-0.5 w-full bg-[#24273a]/80">
                <div
                    className={`h-full transition-[width] duration-150 ease-linear motion-reduce:transition-none ${
                        isFinished ? "bg-[#a6da95]" : "bg-[#91d7e3]"
                    }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </aside>
    );
}

export default MetricsOverlay;
