import { useEffect, useRef, useState } from "react";
import { useAlgorithmStore } from "../../store/useAlgorithmStore";

const algorithms = [
    { id: "bubble", name: "Bubble Sort", complexity: "O(n²)" },
    { id: "selection", name: "Selection Sort", complexity: "O(n²)" },
    { id: "insertion", name: "Insertion Sort", complexity: "O(n²)" },
    { id: "exchange", name: "Exchange Sort", complexity: "O(n²)" },
    { id: "gnome", name: "Gnome Sort", complexity: "O(n²)" },
    { id: "merge", name: "Merge Sort", complexity: "O(n log n)" },
    { id: "quick", name: "Quick Sort", complexity: "O(n log n)" },
];

function TopBar() {
    const algorithm = useAlgorithmStore((state) => state.algorithmId);
    const setAlgorithm = useAlgorithmStore((state) => state.setAlgorithm);

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedAlgorithm = algorithms.find(
        (item) => item.id === algorithm
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <nav className="relative h-20 overflow-visible border-b border-slate-800 bg-slate-950 px-4 text-white sm:px-8">

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage:
                        "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />

            <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between">

                <div className="flex items-center gap-3 sm:gap-4">

                    <div className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-400/30 bg-cyan-400/5">

                        <div className="absolute inset-0 bg-cyan-400/10 opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />

                        <div className="relative flex h-5 items-end gap-0.5]">
                            <span className="h-2 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-3" />
                            <span className="h-4 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-2" />
                            <span className="h-3 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-5" />
                            <span className="h-5 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-3" />
                        </div>

                        <div className="absolute -right-5 -top-5 h-10 w-10 rounded-full bg-cyan-400/20 blur-xl" />
                    </div>

                    <div>
                        <h1 className="text-base font-bold tracking-[0.18em] sm:text-lg">
                            SORT<span className="text-cyan-400">MOTION</span>
                        </h1>

                        <div className="mt-0.5 flex items-center gap-2">
                            <span className="h-px w-4 bg-cyan-400/50" />

                            <p className="text-[8px] uppercase tracking-[0.3em] text-slate-500 sm:text-[9px]">
                                Sorting Visualizer
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-5">

                    <div className="hidden items-center gap-2 md:flex">

                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/70" />
                        </span>

                        <div>
                            <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-slate-600">
                                System
                            </p>

                            <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-400">
                                Ready
                            </p>
                        </div>
                    </div>

                    <div
                        ref={dropdownRef}
                        className="relative w-52 sm:w-60"
                    >

                        <button
                            type="button"
                            onClick={() => setOpen(!open)}
                            className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left backdrop-blur-xl transition-all duration-300 sm:px-4 ${
                                open
                                    ? "border-cyan-400/60 bg-slate-900 shadow-[0_0_25px_rgba(34,211,238,0.08)]"
                                    : "border-slate-700/80 bg-slate-900/70 hover:border-cyan-400/40 hover:bg-slate-900"
                            }`}
                        >

                            <div className="flex min-w-0 items-center gap-3">

                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] transition-all duration-300 ${
                                        open
                                            ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                                            : "border-slate-700 bg-slate-800/80 text-slate-500 group-hover:border-cyan-400/30 group-hover:text-cyan-400"
                                    }`}
                                >
                                    {String(
                                        algorithms.findIndex(
                                            (item) => item.id === algorithm
                                        ) + 1
                                    ).padStart(2, "0")}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[8px] uppercase tracking-[0.2em] text-slate-600">
                                        Algorithm
                                    </p>

                                    <p className="truncate text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
                                        {selectedAlgorithm?.name}
                                    </p>
                                </div>
                            </div>

                            <svg
                                className={`ml-2 h-4 w-4 shrink-0 text-cyan-400 transition-transform duration-300 ${
                                    open ? "rotate-180" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        <div
                            className={`absolute right-0 top-[calc(100%+10px)] z-50 w-full origin-top-right transition-all duration-200 ${
                                open
                                    ? "pointer-events-auto scale-100 opacity-100"
                                    : "pointer-events-none scale-[0.97] opacity-0"
                            }`}
                        >

                            <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl">

                                <div className="relative mb-2 flex items-center justify-between overflow-hidden rounded-lg border border-cyan-400/10 bg-cyan-400/3 px-3 py-2">

                                    <div className="absolute left-0 top-0 h-px w-1/3 bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />

                                    <span className="text-[8px] uppercase tracking-[0.25em] text-slate-500">
                                        Select Algorithm
                                    </span>

                                    <span className="font-mono text-[8px] text-cyan-500/70">
                                        {algorithms.length} AVAILABLE
                                    </span>
                                </div>

                                <div className="space-y-1">

                                    {algorithms.map((item, index) => {

                                        const selected = item.id === algorithm;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setAlgorithm(item.id);
                                                    setOpen(false);
                                                }}
                                                style={{
                                                    transitionDelay: open
                                                        ? `${index * 35}ms`
                                                        : "0ms",
                                                }}
                                                className={`group/item relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                                                    open
                                                        ? "translate-x-0 opacity-100"
                                                        : "translate-x-2 opacity-0"
                                                } ${
                                                    selected
                                                        ? "bg-cyan-400/8"
                                                        : "hover:bg-slate-800/70"
                                                }`}
                                            >

                                                <div
                                                    className={`absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 transition-all duration-200 ${
                                                        selected
                                                            ? "h-5"
                                                            : "group-hover/item:h-3"
                                                    }`}
                                                />

                                                <span
                                                    className={`w-5 font-mono text-[9px] transition-colors ${
                                                        selected
                                                            ? "text-cyan-400"
                                                            : "text-slate-700 group-hover/item:text-slate-500"
                                                    }`}
                                                >
                                                    {String(index + 1).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`text-sm transition-colors ${
                                                            selected
                                                                ? "text-cyan-300"
                                                                : "text-slate-300 group-hover/item:text-white"
                                                        }`}
                                                    >
                                                        {item.name}
                                                    </p>

                                                    <p className="font-mono text-[8px] text-slate-700 transition-colors group-hover/item:text-slate-600">
                                                        TIME {item.complexity}
                                                    </p>
                                                </div>

                                                {selected && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />
                                                        <span className="relative h-2 w-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/70" />
                                                    </span>
                                                )}

                                            </button>
                                        );
                                    })}

                                </div>

                                <div className="mt-2 flex items-center justify-between border-t border-slate-800 px-3 pt-2">

                                    <span className="text-[7px] uppercase tracking-[0.2em] text-slate-700">
                                        SortMotion Engine
                                    </span>

                                    <span className="font-mono text-[7px] text-slate-700">
                                        v1.0
                                    </span>

                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 h-px w-full bg-slate-900">
                <div className="h-px w-1/4 animate-[pulse_3s_ease-in-out_infinite] bg-linear-to-r from-transparent via-cyan-400/70 to-transparent" />
            </div>
        </nav>
    );
}

export default TopBar;
