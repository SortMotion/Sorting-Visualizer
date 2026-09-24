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

function AlgorithmDropdown({
    selectedId,
    disabledId,
    onSelect,
    label = "Algorithm",
}: {
    selectedId: string;
    disabledId?: string | null;
    onSelect: (id: string) => void;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedAlgorithm = algorithms.find((item) => item.id === selectedId);

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
        <div ref={dropdownRef} className="relative w-44 sm:w-52">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left backdrop-blur-xl transition-all duration-300 ${
                    open
                        ? "border-cyan-400/60 bg-slate-900 shadow-[0_0_25px_rgba(34,211,238,0.08)]"
                        : "border-slate-700/80 bg-slate-900/70 hover:border-cyan-400/40 hover:bg-slate-900"
                }`}
            >
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] transition-all duration-300 ${
                            open
                                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                                : "border-slate-700 bg-slate-800/80 text-slate-500 group-hover:border-cyan-400/30 group-hover:text-cyan-400"
                        }`}
                    >
                        {String(
                            Math.max(
                                0,
                                algorithms.findIndex((item) => item.id === selectedId)
                            ) + 1
                        ).padStart(2, "0")}
                    </div>

                    <div className="min-w-0">
                        <p className="text-[7px] uppercase tracking-[0.2em] text-slate-500">
                            {label}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-200 transition-colors group-hover:text-white">
                            {selectedAlgorithm?.name || "Select"}
                        </p>
                    </div>
                </div>

                <svg
                    className={`ml-1 h-3.5 w-3.5 shrink-0 text-cyan-400 transition-transform duration-300 ${
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
                className={`absolute right-0 top-[calc(100%+8px)] z-50 w-full origin-top-right transition-all duration-200 ${
                    open
                        ? "pointer-events-auto scale-100 opacity-100"
                        : "pointer-events-none scale-[0.97] opacity-0"
                }`}
            >
                <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl">
                    <div className="relative mb-2 flex items-center justify-between overflow-hidden rounded-lg border border-cyan-400/10 bg-cyan-400/5 px-2.5 py-1.5">
                        <span className="text-[8px] uppercase tracking-[0.25em] text-slate-500">
                            Select Algorithm
                        </span>
                        <span className="font-mono text-[8px] text-cyan-500/70">
                            {algorithms.length} AVAILABLE
                        </span>
                    </div>

                    <div className="space-y-1">
                        {algorithms.map((item, index) => {
                            const selected = item.id === selectedId;
                            const isDisabled = item.id === disabledId;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            onSelect(item.id);
                                            setOpen(false);
                                        }
                                    }}
                                    className={`group/item relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-left transition-all duration-200 ${
                                        isDisabled
                                            ? "cursor-not-allowed opacity-30 bg-slate-900/40"
                                            : selected
                                            ? "bg-cyan-400/10 text-cyan-300"
                                            : "hover:bg-slate-800/70 text-slate-300"
                                    }`}
                                >
                                    <span
                                        className={`w-4 font-mono text-[9px] ${
                                            selected
                                                ? "text-cyan-400"
                                                : "text-slate-600 group-hover/item:text-slate-400"
                                        }`}
                                    >
                                        {String(index + 1).padStart(2, "0")}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium">
                                            {item.name}
                                        </p>
                                        <p className="font-mono text-[8px] text-slate-600">
                                            {item.complexity}
                                        </p>
                                    </div>

                                    {isDisabled && (
                                        <span className="text-[8px] uppercase font-mono text-slate-600">
                                            Active
                                        </span>
                                    )}

                                    {selected && (
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />
                                            <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TopBar() {
    const algorithmId = useAlgorithmStore((state) => state.algorithmId);
    const compareAlgorithmId = useAlgorithmStore((state) => state.compareAlgorithmId);
    const isComparing = useAlgorithmStore((state) => state.isComparing);

    const setAlgorithm = useAlgorithmStore((state) => state.setAlgorithm);
    const setCompareAlgorithm = useAlgorithmStore((state) => state.setCompareAlgorithm);
    const toggleCompare = useAlgorithmStore((state) => state.toggleCompare);

    const handleToggleCompare = () => {
        toggleCompare();

        // Si activamos el modo comparación y aún no hay un algoritmo secundario seleccionado, elegimos uno diferente por defecto
        if (!isComparing && (!compareAlgorithmId || compareAlgorithmId === algorithmId)) {
            const alternative = algorithms.find((a) => a.id !== algorithmId);
            if (alternative) {
                setCompareAlgorithm(alternative.id);
            }
        }
    };

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

            <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-400/30 bg-cyan-400/5">
                        <div className="absolute inset-0 bg-cyan-400/10 opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />
                        <div className="relative flex h-5 items-end gap-0.5">
                            <span className="h-2 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-3" />
                            <span className="h-4 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-2" />
                            <span className="h-3 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-5" />
                            <span className="h-5 w-0.75 rounded-sm bg-cyan-400 transition-all duration-300 group-hover:h-3" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-base font-bold tracking-[0.18em] sm:text-lg">
                            SORT<span className="text-cyan-400">MOTION</span>
                        </h1>
                        <div className="mt-0.5 flex items-center gap-2">
                            <span className="h-px w-4 bg-cyan-400/50" />
                            <p className="text-[8px] uppercase tracking-[0.3em] text-slate-500 sm:text-[9px]">
                                Visualizer
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={handleToggleCompare}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold tracking-wider transition-all duration-300 ${
                            isComparing
                                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                                : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                    >
                        <span className="font-mono text-[10px]">VS</span>
                        <span>DUAL MODE</span>
                        <span
                            className={`h-2 w-2 rounded-full transition-all ${
                                isComparing ? "bg-cyan-400 shadow-sm shadow-cyan-400" : "bg-slate-700"
                            }`}
                        />
                    </button>

                    <AlgorithmDropdown
                        selectedId={algorithmId}
                        disabledId={isComparing ? compareAlgorithmId : null}
                        onSelect={setAlgorithm}
                        label={isComparing ? "Algo A" : "Algorithm"}
                    />

                    {isComparing && (
                        <AlgorithmDropdown
                            selectedId={compareAlgorithmId || ""}
                            disabledId={algorithmId}
                            onSelect={setCompareAlgorithm}
                            label="Algo B"
                        />
                    )}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 h-px w-full bg-slate-900">
                <div className="h-px w-1/4 animate-[pulse_3s_ease-in-out_infinite] bg-linear-to-r from-transparent via-cyan-400/70 to-transparent" />
            </div>
        </nav>
    );
}

export default TopBar;
