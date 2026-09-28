import type { SortStep } from "../../algorithms/types";

export type RGB = readonly [number, number, number];
type MutableRGB = [number, number, number];

function hex(value: string): RGB {
    const n = parseInt(value.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const PALETTE = {
    low: hex("#7dc4e4"),
    high: hex("#91d7e3"),
    compare: hex("#ed8796"),
    swap: hex("#eed49f"),
    pivot: hex("#c6a0f6"),
    sorted: hex("#a6da95"),
    range: hex("#f5bde6"),
} as const;

export const WHITE: RGB = [202, 211, 245];
export const NIGHT: RGB = [24, 24, 37];

export function mix(a: RGB, b: RGB, t: number): MutableRGB {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

export const clamp01 = (t: number) => clamp(t, 0, 1);

export type Ease = (t: number) => number;
export const easeInOutCubic: Ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutBack: Ease = (t) => {
    const c1 = 1.5;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export type Tween = { from: number; to: number; t0: number; dur: number; ease: Ease };

export function createTween(value: number, ease: Ease = easeInOutCubic): Tween {
    return { from: value, to: value, t0: 0, dur: 0, ease };
}

export function tweenProgress(tw: Tween, now: number): number {
    return tw.dur <= 0 ? 1 : clamp01((now - tw.t0) / tw.dur);
}

export function sampleAt(tw: Tween, progress: number): number {
    return tw.from + (tw.to - tw.from) * tw.ease(progress);
}

export function sample(tw: Tween, now: number): number {
    return sampleAt(tw, tweenProgress(tw, now));
}

export function retarget(tw: Tween, to: number, now: number, dur: number): boolean {
    if (tw.to === to) return false;
    tw.from = sample(tw, now);
    tw.to = to;
    tw.t0 = now;
    tw.dur = dur;
    return true;
}

function snap(tw: Tween, value: number): void {
    tw.from = value;
    tw.to = value;
    tw.dur = 0;
}

export const BURST_LIFE_MS = 700;
export const CARET_POP_MS = 220;
export const WAVE_MS = 380;
const FLASH_TAU_MS = 180;
const ALPHA_MS = 220;
const MAX_BURSTS = 48;
const MAX_BURST_BARS = 160;

export function waveStagger(n: number): number {
    return Math.min(16, 900 / Math.max(n, 1));
}

export type Bar = {
    id: number;
    value: number;
    slot: Tween;
    height: Tween;
    hop: number;
    color: MutableRGB;
    target: MutableRGB;
    glow: number;
    glowTarget: number;
    flash: number;
    sorted: boolean;
};

export type Burst = {
    x: number;
    value: number;
    t0: number;
    color: RGB;
    count: number;
    seed: number;
};

export type Scene = {
    bars: Map<number, Bar>;
    count: number;
    maxValue: Tween;
    step: SortStep | null;
    stepT0: number;
    pivot: { id: number | null; alpha: Tween };
    range: { start: Tween; end: Tween; alpha: Tween };
    bursts: Burst[];
    burstSeed: number;
    celebrateAt: number | null;
    colorTau: number;
    reducedMotion: boolean;
    lastTime: number;
};

export function createScene(): Scene {
    return {
        bars: new Map(),
        count: 0,
        maxValue: createTween(1),
        step: null,
        stepT0: 0,
        pivot: { id: null, alpha: createTween(0) },
        range: { start: createTween(0), end: createTween(0), alpha: createTween(0) },
        bursts: [],
        burstSeed: 1,
        celebrateAt: null,
        colorTau: 80,
        reducedMotion: false,
        lastTime: performance.now(),
    };
}

export type SceneFrame = {
    array: number[];
    ids: ArrayLike<number>;
    sorted: ArrayLike<number>;
    step: SortStep | null;
};

export type SyncOptions = {
    now: number;
    duration: number;
    jump: boolean;
    reducedMotion: boolean;
};

type ActiveRole = "compare" | "swap" | "pivot";

function addBurst(scene: Scene, x: number, value: number, color: RGB, count: number, now: number) {
    scene.bursts.push({ x, value, t0: now, color, count, seed: scene.burstSeed++ });
    if (scene.bursts.length > MAX_BURSTS) {
        scene.bursts.splice(0, scene.bursts.length - MAX_BURSTS);
    }
}

export function syncScene(scene: Scene, frame: SceneFrame, opts: SyncOptions): void {
    const { now, jump, reducedMotion } = opts;
    const dur = reducedMotion ? 0 : opts.duration;
    const alphaDur = reducedMotion ? 0 : ALPHA_MS;
    const { array, ids, sorted, step } = frame;
    const n = array.length;
    const valid = (i: number) => Number.isInteger(i) && i >= 0 && i < n;

    scene.count = n;
    scene.reducedMotion = reducedMotion;
    scene.colorTau = reducedMotion ? 0 : clamp(dur * 0.3, 25, 110);

    let maxValue = 1;
    for (let i = 0; i < n; i++) if (array[i] > maxValue) maxValue = array[i];
    retarget(scene.maxValue, maxValue, now, dur);

    const stepChanged = step !== scene.step;
    if (stepChanged) {
        scene.step = step;
        scene.stepT0 = now;
    }

    if (jump) {
        retarget(scene.pivot.alpha, 0, now, alphaDur);
        retarget(scene.range.alpha, 0, now, alphaDur);
    }

    if (step?.kind === "pivot" && valid(step.index)) {
        scene.pivot.id = ids[step.index];
        retarget(scene.pivot.alpha, 1, now, alphaDur);
    } else if (step?.kind === "merge-range") {
        const a = clamp(step.range[0], 0, Math.max(n - 1, 0));
        const b = clamp(step.range[1], 0, Math.max(n - 1, 0));
        const hidden = scene.range.alpha.to === 0 && sample(scene.range.alpha, now) < 0.05;
        if (hidden) {
            snap(scene.range.start, a);
            snap(scene.range.end, b);
        } else {
            retarget(scene.range.start, a, now, dur);
            retarget(scene.range.end, b, now, dur);
        }
        retarget(scene.range.alpha, 1, now, alphaDur);
    } else if (step === null || step.kind === "done") {
        retarget(scene.pivot.alpha, 0, now, alphaDur);
        retarget(scene.range.alpha, 0, now, alphaDur);
    }

    if (step?.kind === "done") {
        if (stepChanged) scene.celebrateAt = now;
    } else {
        scene.celebrateAt = null;
    }

    const active = new Map<number, ActiveRole>();
    if (step) {
        switch (step.kind) {
            case "compare":
                for (const i of step.indices) if (valid(i)) active.set(i, "compare");
                break;
            case "swap":
                for (const i of step.indices) if (valid(i)) active.set(i, "swap");
                break;
            case "set":
                if (valid(step.index)) active.set(step.index, "swap");
                break;
            case "pivot":
                if (valid(step.index)) active.set(step.index, "pivot");
                break;
        }
    }

    const rangeOn = scene.range.alpha.to > 0;
    const rangeA = scene.range.start.to;
    const rangeB = scene.range.end.to;
    const pivotId = scene.pivot.alpha.to > 0 ? scene.pivot.id : null;
    const seen = new Set<number>();

    for (let slot = 0; slot < n; slot++) {
        const id = ids[slot];
        const value = array[slot];
        seen.add(id);

        let bar = scene.bars.get(id);
        if (!bar) {
            bar = {
                id,
                value,
                slot: createTween(slot),
                height: createTween(0, easeOutBack),
                hop: 0,
                color: [...PALETTE.low],
                target: [...PALETTE.low],
                glow: 0,
                glowTarget: 0,
                flash: 0,
                sorted: false,
            };
            scene.bars.set(id, bar);
        }

        const fromSlot = bar.slot.to;
        if (retarget(bar.slot, slot, now, dur)) {
            const distance = Math.abs(slot - fromSlot);
            bar.hop = jump || reducedMotion ? 0 : (slot > fromSlot ? 1 : 0.35) * Math.min(1, 0.45 + distance * 0.06);
        }
        retarget(bar.height, value, now, dur);
        bar.value = value;

        const isSorted = sorted[slot] === 1;
        if (isSorted && !bar.sorted && !jump && step?.kind !== "done") bar.flash = 1;
        bar.sorted = isSorted;
        if (isSorted && id === scene.pivot.id) retarget(scene.pivot.alpha, 0, now, alphaDur);

        const base = mix(PALETTE.low, PALETTE.high, value / maxValue);
        const role = active.get(slot);
        let target: MutableRGB;
        let glow = 0;

        if (role) {
            target = [...PALETTE[role]];
            glow = role === "compare" ? 0.75 : 1;
        } else if (isSorted) {
            target = [...PALETTE.sorted];
        } else if (pivotId !== null && id === pivotId) {
            target = mix(PALETTE.pivot, base, 0.25);
            glow = 0.35;
        } else if (rangeOn && slot >= rangeA && slot <= rangeB) {
            target = mix(base, PALETTE.range, 0.6);
        } else {
            target = base;
        }

        bar.target = target;
        bar.glowTarget = glow;
    }

    for (const id of scene.bars.keys()) {
        if (!seen.has(id)) scene.bars.delete(id);
    }

    if (stepChanged && step && !jump && !reducedMotion && n <= MAX_BURST_BARS) {
        if (step.kind === "swap") {
            const [i, j] = step.indices;
            if (valid(i) && valid(j)) {
                addBurst(scene, (i + j) / 2 + 0.5, Math.max(array[i], array[j]), PALETTE.swap, 12, now);
            }
        } else if (step.kind === "set" && valid(step.index)) {
            addBurst(scene, step.index + 0.5, array[step.index], PALETTE.swap, 7, now);
        } else if (step.kind === "sorted" && valid(step.index)) {
            addBurst(scene, step.index + 0.5, array[step.index], PALETTE.sorted, 6, now);
        }
    }
}

export function advanceScene(scene: Scene, now: number): boolean {
    const dt = Math.max(0, now - scene.lastTime);
    scene.lastTime = now;

    const k = scene.colorTau <= 0 ? 1 : 1 - Math.exp(-dt / scene.colorTau);
    const flashDecay = Math.exp(-dt / FLASH_TAU_MS);
    let active = false;

    for (const bar of scene.bars.values()) {
        for (let c = 0; c < 3; c++) {
            const diff = bar.target[c] - bar.color[c];
            bar.color[c] += diff * k;
            if (Math.abs(diff) > 0.5) active = true;
        }

        const glowDiff = bar.glowTarget - bar.glow;
        bar.glow += glowDiff * k;
        if (Math.abs(glowDiff) > 0.01) active = true;

        if (bar.flash > 0.01) {
            bar.flash *= flashDecay;
            active = true;
        } else {
            bar.flash = 0;
        }

        if (tweenProgress(bar.slot, now) < 1 || tweenProgress(bar.height, now) < 1) active = true;
    }

    scene.bursts = scene.bursts.filter((b) => now - b.t0 < BURST_LIFE_MS);
    if (scene.bursts.length > 0) active = true;

    const tweens = [
        scene.maxValue,
        scene.pivot.alpha,
        scene.range.alpha,
        scene.range.start,
        scene.range.end,
    ];
    if (tweens.some((tw) => tweenProgress(tw, now) < 1)) active = true;

    if (scene.step?.kind === "compare" && now - scene.stepT0 < CARET_POP_MS) active = true;

    if (
        scene.celebrateAt !== null &&
        now - scene.celebrateAt < WAVE_MS + scene.count * waveStagger(scene.count)
    ) {
        active = true;
    }

    return active;
}
