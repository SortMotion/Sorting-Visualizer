import { useMemo } from "react";
import { ALGORITHMS } from "../../algorithms";
import { useAlgorithmStore } from "../../store/useAlgorithmStore";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import SortCanvas from "./SortCanvas";

// Arquitectura.md §6: contenedor inteligente. Decide cuántos SortCanvas
// mostrar (1 o 2) y les pasa los datos de su carril; el dibujo vive en
// SortCanvas y las métricas en MetricsOverlay.

type CanvasLayoutProps = {
    className?: string;
};

function findAlgorithm(id: string | null) {
    return id ? ALGORITHMS.find((a) => a.id === id) : undefined;
}

function PickAlgorithmPlaceholder() {
    return (
        <section className="flex min-h-64 w-full items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
            <p className="max-w-xs text-sm text-slate-400">
                Choose <span className="text-cyan-300">Algo B</span> in the top bar to
                compare both algorithms on the same data.
            </p>
        </section>
    );
}

function CanvasLayout({ className = "" }: CanvasLayoutProps) {
    // --- useAlgorithmStore ---
    const values = useAlgorithmStore((state) => state.values);
    const algorithmId = useAlgorithmStore((state) => state.algorithmId);
    const isComparing = useAlgorithmStore((state) => state.isComparing);
    const compareAlgorithmId = useAlgorithmStore((state) => state.compareAlgorithmId);

    // --- usePlaybackStore ---
    const primarySteps = usePlaybackStore((state) => state.steps.primary);
    const secondarySteps = usePlaybackStore((state) => state.steps.secondary);

    const primaryAlgorithm = useMemo(() => findAlgorithm(algorithmId), [algorithmId]);
    const secondaryAlgorithm = useMemo(
        () => findAlgorithm(compareAlgorithmId),
        [compareAlgorithmId]
    );

    // Referencia estable para que SortCanvas no reconstruya su timeline en
    // cada render mientras el carril B todavía no tiene pasos.
    const secondaryLane = useMemo(() => secondarySteps ?? [], [secondarySteps]);

    return (
        <main
            className={`grid min-h-0 w-full flex-1 gap-4 p-4 ${
                isComparing ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            } ${className}`}
        >
            <SortCanvas
                key="primary"
                lane="primary"
                steps={primarySteps}
                values={values}
                algorithm={primaryAlgorithm}
            />

            {isComparing &&
                (secondaryAlgorithm ? (
                    <SortCanvas
                        key="secondary"
                        lane="secondary"
                        steps={secondaryLane}
                        values={values}
                        algorithm={secondaryAlgorithm}
                    />
                ) : (
                    <PickAlgorithmPlaceholder />
                ))}
        </main>
    );
}

export default CanvasLayout;
