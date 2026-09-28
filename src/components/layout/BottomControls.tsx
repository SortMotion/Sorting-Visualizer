import { useEffect, type ReactNode } from "react";
import { ALGORITHMS } from "../../algorithms";
import {
    MAX_ARRAY_SIZE,
    MIN_ARRAY_SIZE,
    useAlgorithmStore,
} from "../../store/useAlgorithmStore";
import {
    getTotalSteps,
    usePlaybackStore,
} from "../../store/usePlaybackStore";
import { runAndMeasure } from "../../utils/runAndMeasure";

const SPEEDS = [0.5, 1, 2, 4];

const FOCUS_RING =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91d7e3]/60";

function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <p className="text-[8px] uppercase tracking-[0.25em] text-[#494d64]">
            {children}
        </p>
    );
}

type IconButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    children: ReactNode;
};

function IconButton({ label, onClick, disabled = false, children }: IconButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8087a2] transition hover:bg-[#24273a] hover:text-[#91d7e3] disabled:pointer-events-none disabled:text-[#363a4f] motion-reduce:transition-none ${FOCUS_RING}`}
        >
            {children}
        </button>
    );
}

function BottomControls() {
    const arraySize = useAlgorithmStore((state) => state.arraySize);
    const values = useAlgorithmStore((state) => state.values);
    const algorithmId = useAlgorithmStore((state) => state.algorithmId);
    const isComparing = useAlgorithmStore((state) => state.isComparing);
    const compareAlgorithmId = useAlgorithmStore((state) => state.compareAlgorithmId);
    const setArraySize = useAlgorithmStore((state) => state.setArraySize);
    const randomize = useAlgorithmStore((state) => state.randomize);

    const steps = usePlaybackStore((state) => state.steps);
    const currentStepIndex = usePlaybackStore((state) => state.currentStepIndex);
    const isPlaying = usePlaybackStore((state) => state.isPlaying);
    const speed = usePlaybackStore((state) => state.speed);
    const loadSteps = usePlaybackStore((state) => state.loadSteps);
    const play = usePlaybackStore((state) => state.play);
    const pause = usePlaybackStore((state) => state.pause);
    const next = usePlaybackStore((state) => state.next);
    const prev = usePlaybackStore((state) => state.prev);
    const setSpeed = usePlaybackStore((state) => state.setSpeed);
    const reset = usePlaybackStore((state) => state.reset);

    useEffect(() => {
        loadSteps({ primary: [], secondary: null });
    }, [values, algorithmId, isComparing, compareAlgorithmId, loadSteps]);

    const totalSteps = getTotalSteps(steps);
    const hasSteps = totalSteps > 0;
    const lastIndex = totalSteps - 1;
    const atStart = currentStepIndex === 0;
    const atEnd = hasSteps && currentStepIndex >= lastIndex;
    const progress = hasSteps
        ? lastIndex === 0
            ? 100
            : (currentStepIndex / lastIndex) * 100
        : 0;

    const needsCompareChoice = isComparing && !compareAlgorithmId;
    const canSort = values.length > 0 && !needsCompareChoice;

    let status: { label: string; dot: string; text: string };
    if (!hasSteps) {
        status = { label: "Idle", dot: "bg-[#494d64]", text: "text-[#5b6078]" };
    } else if (isPlaying) {
        status = { label: "Playing", dot: "bg-[#91d7e3]", text: "text-[#91d7e3]" };
    } else if (atEnd) {
        status = { label: "Done", dot: "bg-[#a6da95]", text: "text-[#a6da95]" };
    } else if (atStart) {
        status = { label: "Ready", dot: "bg-[#91d7e3]/60", text: "text-[#8bd5ca]" };
    } else {
        status = { label: "Paused", dot: "bg-[#eed49f]", text: "text-[#eed49f]" };
    }

    const handleSort = () => {
        const primaryAlgorithm = ALGORITHMS.find((a) => a.id === algorithmId);
        if (!primaryAlgorithm || !canSort) return;

        const primary = runAndMeasure(primaryAlgorithm, values);

        const secondaryAlgorithm =
            isComparing && compareAlgorithmId
                ? ALGORITHMS.find((a) => a.id === compareAlgorithmId)
                : undefined;
        const secondary = secondaryAlgorithm
            ? runAndMeasure(secondaryAlgorithm, values)
            : null;

        loadSteps({
            primary: primary.steps,
            secondary: secondary?.steps ?? null,
        });
        usePlaybackStore.setState({
            executionTimes: {
                primary: primary.time,
                secondary: secondary?.time ?? null,
            },
        });
        play();
    };

    const handlePrev = () => {
        pause();
        prev();
    };

    const handleNext = () => {
        pause();
        next();
    };

    const playLabel = isPlaying ? "Pause" : atEnd ? "Replay" : "Play";

    return (
        <footer className="relative border-t border-[#24273a] bg-[#181825] px-4 pb-4 pt-5 text-[#cad3f5] sm:px-8">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: "linear-gradient(#91d7e3 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />

            <div
                className="absolute left-0 top-0 h-0.5 w-full bg-[#1e2030]"
                role="progressbar"
                aria-label="Sorting progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
            >
                <div
                    className="h-full bg-[#91d7e3] shadow-[0_0_8px_rgba(145,215,227,0.6)] transition-[width] duration-150 ease-linear motion-reduce:transition-none"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="relative mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">

                <div className="flex flex-wrap items-end gap-3">

                    <div className="w-full sm:w-64">
                        <div className="mb-1.5 flex items-center justify-between">
                            <SectionLabel>Array Size</SectionLabel>
                            <span className="font-mono text-[10px] text-[#8bd5ca]">
                                {arraySize}
                            </span>
                        </div>

                        <div className="flex h-10 items-center gap-2 rounded-lg border border-[#363a4f] bg-[#1e2030] px-1">
                            <IconButton
                                label="Decrease array size"
                                onClick={() => setArraySize(arraySize - 1)}
                                disabled={arraySize <= MIN_ARRAY_SIZE}
                            >
                                <span className="text-lg leading-none">−</span>
                            </IconButton>

                            <input
                                type="range"
                                min={MIN_ARRAY_SIZE}
                                max={MAX_ARRAY_SIZE}
                                step={1}
                                value={arraySize}
                                onChange={(e) => setArraySize(Number(e.target.value))}
                                aria-label="Array size"
                                className={`h-1 w-full cursor-pointer rounded-full accent-[#91d7e3] ${FOCUS_RING}`}
                            />

                            <IconButton
                                label="Increase array size"
                                onClick={() => setArraySize(arraySize + 1)}
                                disabled={arraySize >= MAX_ARRAY_SIZE}
                            >
                                <span className="text-lg leading-none">+</span>
                            </IconButton>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={randomize}
                        className={`flex h-10 items-center gap-2 rounded-lg border border-[#363a4f] bg-[#1e2030] px-4 text-[10px] font-medium uppercase tracking-[0.15em] text-[#8087a2] transition hover:border-[#91d7e3]/40 hover:bg-[#91d7e3]/5 hover:text-[#8bd5ca] motion-reduce:transition-none ${FOCUS_RING}`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                        </svg>
                        Randomize
                    </button>

                    <button
                        type="button"
                        onClick={handleSort}
                        disabled={!canSort}
                        title={needsCompareChoice ? "Choose a second algorithm to compare" : "Sort"}
                        className={`group relative flex h-10 items-center gap-2 overflow-hidden rounded-lg border border-[#91d7e3]/40 bg-[#91d7e3]/10 px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8bd5ca] transition hover:border-[#91d7e3]/70 hover:bg-[#91d7e3]/15 disabled:pointer-events-none disabled:border-[#24273a] disabled:bg-[#1e2030] disabled:text-[#494d64] motion-reduce:transition-none ${FOCUS_RING}`}
                    >
                        <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-[#91d7e3]/10 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden" />
                        <svg className="relative h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20V10M12 20V4M18 20v-7" />
                        </svg>
                        <span className="relative">Sort</span>
                    </button>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                    <div className="flex w-full items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5" aria-live="polite">
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            <span className={`text-[8px] uppercase tracking-[0.25em] ${status.text}`}>
                                {status.label}
                            </span>
                        </span>

                        <span className="font-mono text-[9px] text-[#5b6078]">
                            {hasSteps ? `${currentStepIndex + 1} / ${totalSteps}` : "— / —"}
                        </span>
                    </div>

                    <div className="flex h-10 items-center gap-0.5 rounded-lg border border-[#363a4f] bg-[#1e2030] p-1">
                        <IconButton label="Back to start" onClick={reset} disabled={!hasSteps || atStart}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 5v14M18 5l-9 7 9 7z" />
                            </svg>
                        </IconButton>

                        <IconButton label="Previous step" onClick={handlePrev} disabled={!hasSteps || atStart}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                            </svg>
                        </IconButton>

                        <button
                            type="button"
                            onClick={isPlaying ? pause : play}
                            disabled={!hasSteps}
                            aria-label={playLabel}
                            title={playLabel}
                            className={`mx-1 flex h-8 w-10 items-center justify-center rounded-md bg-[#91d7e3] text-[#181825] transition hover:bg-[#8bd5ca] disabled:pointer-events-none disabled:bg-[#24273a] disabled:text-[#494d64] motion-reduce:transition-none ${FOCUS_RING}`}
                        >
                            {isPlaying ? (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M8 5v14M16 5v14" />
                                </svg>
                            ) : atEnd ? (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
                                </svg>
                            ) : (
                                <svg className="ml-0.5 h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <IconButton label="Next step" onClick={handleNext} disabled={!hasSteps || atEnd}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                            </svg>
                        </IconButton>
                    </div>
                </div>

                <div className="flex lg:justify-end">
                    <div>
                        <div className="mb-1.5">
                            <SectionLabel>Speed</SectionLabel>
                        </div>

                        <div
                            className="flex h-10 items-center gap-0.5 rounded-lg border border-[#363a4f] bg-[#1e2030] p-1"
                            role="group"
                            aria-label="Playback speed"
                        >
                            {SPEEDS.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setSpeed(value)}
                                    aria-pressed={speed === value}
                                    className={`h-8 min-w-10 rounded-md px-2 font-mono text-[10px] transition motion-reduce:transition-none ${FOCUS_RING} ${
                                        speed === value
                                            ? "bg-[#91d7e3]/10 text-[#8bd5ca]"
                                            : "text-[#5b6078] hover:bg-[#24273a] hover:text-[#b8c0e0]"
                                    }`}
                                >
                                    {value}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}

export default BottomControls;
