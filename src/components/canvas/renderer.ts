import type { SortStep } from "../../algorithms/types";

export interface RenderOptions {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    array: number[];
    currentStep: SortStep | null;
    sortedIndices?: Set<number>;
}

const COLORS = {
    default: "#3B82F6",   
    compare: "#EF4444",
    swap: "#10B981",       
    pivot: "#F59E0B",      
    sorted: "#10B981",     
    mergeRange: "#8B5CF6", 
};

export function renderCanvas({
    ctx,
    width,
    height,
    array,
    currentStep,
    sortedIndices = new Set(),
}: RenderOptions): void {
    ctx.clearRect(0, 0, width, height);

    if (array.length === 0) return;

    const barWidth = width / array.length;
    const maxValue = Math.max(...array, 1);
    const activeIndices = new Set<number>();
    let stepKind: SortStep["kind"] | null = null;
    let activeRange: [number, number] | null = null;

    if (currentStep) {
    stepKind = currentStep.kind;

    if (currentStep.kind === "compare" || currentStep.kind === "swap") {
        currentStep.indices.forEach((idx) => activeIndices.add(idx));
    } else if (currentStep.kind === "set") {
        activeIndices.add(currentStep.index);
    } else if (currentStep.kind === "pivot") {
        activeIndices.add(currentStep.index);
    } else if (currentStep.kind === "sorted") {
        sortedIndices.add(currentStep.index);
    } else if (currentStep.kind === "merge-range") {
        activeRange = currentStep.range;
    }
    }

    for (let i = 0; i < array.length; i++) {
    const value = array[i];
    const barHeight = (value / maxValue) * (height * 0.88);
    const x = i * barWidth;
    const y = height - barHeight;

    let fillColor = COLORS.default;

    if (sortedIndices.has(i)) {
        fillColor = COLORS.sorted;
    } else if (activeIndices.has(i) && stepKind) {
        switch (stepKind) {
        case "compare":
            fillColor = COLORS.compare;
            break;
        case "swap":
        case "set":
            fillColor = COLORS.swap;
            break;
        case "pivot":
            fillColor = COLORS.pivot;
            break;
        }
    } else if (
        activeRange &&
        i >= activeRange[0] &&
        i <= activeRange[1]
    ) {
        fillColor = COLORS.mergeRange;
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
}