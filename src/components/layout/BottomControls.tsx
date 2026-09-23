import { useAlgorithmStore } from "../../store/useAlgorithmStore";
import { usePlaybackStore } from "../../store/usePlaybackStore";

const speeds = [0.5, 1, 2, 4];

function BottomControls() {
    const arraySize = useAlgorithmStore((state) => state.arraySize);
    const setArraySize = useAlgorithmStore((state) => state.setArraySize);
    const randomize = useAlgorithmStore((state) => state.randomize);

    const isPlaying = usePlaybackStore((state) => state.isPlaying);
    const speed = usePlaybackStore((state) => state.speed);
    const play = usePlaybackStore((state) => state.play);
    const pause = usePlaybackStore((state) => state.pause);
    const next = usePlaybackStore((state) => state.next);
    const prev = usePlaybackStore((state) => state.prev);
    const setSpeed = usePlaybackStore((state) => state.setSpeed);
    const reset = usePlaybackStore((state) => state.reset);

    const handleArraySizeChange = (value: number) => {
        if (value >= 0) {
            setArraySize(value);
        }
    };

    return (
        <div className="relative border-t border-slate-800 bg-slate-950 px-4 py-4 text-white sm:px-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
                <div
                    className="h-full w-full"
                    style={{
                        backgroundImage:
                            "linear-gradient(#22d3ee 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
            </div>

            <div className="relative mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                <div className="flex flex-wrap items-end gap-3">

                    <div>
                        <p className="mb-1.5 text-[8px] uppercase tracking-[0.25em] text-slate-600">
                            Array Size
                        </p>

                        <div className="flex h-10 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                            <button
                                type="button"
                                onClick={() =>
                                    handleArraySizeChange(arraySize - 1)
                                }
                                className="flex w-9 items-center justify-center text-lg text-slate-500 transition hover:bg-slate-800 hover:text-cyan-400"
                                aria-label="Decrease array size"
                            >
                                −
                            </button>

                            <span className="flex min-w-14 items-center justify-center border-x border-slate-700 px-3 font-mono text-sm text-cyan-300">
                                {arraySize}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    handleArraySizeChange(arraySize + 1)
                                }
                                className="flex w-9 items-center justify-center text-lg text-slate-500 transition hover:bg-slate-800 hover:text-cyan-400"
                                aria-label="Increase array size"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={randomize}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-4 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/5 hover:text-cyan-300"
                    >
                        Randomize
                    </button>

                </div>

                <div className="flex items-end gap-3">

                    <button
                        type="button"
                        onClick={play}
                        className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 transition hover:border-cyan-400/70 hover:bg-cyan-400/15"
                    >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                        <svg
                            className="relative h-3.5 w-3.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>

                        <span className="relative">
                            Sort
                        </span>
                    </button>

                    <div className="flex items-end gap-3">

                        <div>
                            <p className="mb-1.5 text-right text-[8px] uppercase tracking-[0.25em] text-slate-600">
                                Playback
                            </p>

                            <div className="flex h-10 items-center rounded-lg border border-slate-700 bg-slate-900 p-1">

                                <button
                                    type="button"
                                    onClick={prev}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-cyan-400"
                                    aria-label="Previous step"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.8}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={isPlaying ? pause : play}
                                    className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400 text-slate-950 transition hover:bg-cyan-300"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 5v14M16 5v14"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="ml-0.5 h-3.5 w-3.5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={next}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-cyan-400"
                                    aria-label="Next step"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.8}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={reset}
                                    className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-800 hover:text-cyan-400"
                                    aria-label="Reset playback"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.8}
                                            d="M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 11.8 2.1L20 15M4 9l2.7-2.1A7 7 0 0 1 18.5 9"
                                        />
                                    </svg>
                                </button>

                            </div>
                        </div>

                        <div>
                            <p className="mb-1.5 text-[8px] uppercase tracking-[0.25em] text-slate-600">
                                Speed
                            </p>

                            <div className="flex h-10 items-center rounded-lg border border-slate-700 bg-slate-900 p-1">

                                {speeds.map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setSpeed(value)}
                                        className={`h-8 rounded-md px-2 font-mono text-[9px] transition ${
                                            speed === value
                                                ? "bg-cyan-400/10 text-cyan-300"
                                                : "text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                                        }`}
                                    >
                                        {value}x
                                    </button>
                                ))}

                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 h-px w-full bg-slate-900">
                <div className="h-px w-1/4 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            </div>
        </div>
    );
}

export default BottomControls;