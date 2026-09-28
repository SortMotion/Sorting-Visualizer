import {
    BURST_LIFE_MS,
    CARET_POP_MS,
    NIGHT,
    PALETTE,
    WAVE_MS,
    WHITE,
    clamp,
    clamp01,
    easeOutBack,
    mix,
    sample,
    sampleAt,
    tweenProgress,
    waveStagger,
    type Bar,
    type RGB,
    type Scene,
} from "./animation";

// Función pura: dibuja la escena tal como se ve en el instante `now`.
// No guarda estado; todo el estado de la animación vive en `Scene`.

export interface RenderOptions {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    scene: Scene;
    now: number;
}

type Layout = {
    padX: number;
    top: number;
    base: number;
    chartH: number;
    slotW: number;
    barW: number;
    gap: number;
};

type Pose = {
    bar: Bar;
    p: number; // progreso del movimiento horizontal
    x: number;
    h: number;
    lift: number;
    flash: number;
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const GRAVITY = 0.00022; // px/ms²
// [retraso en progreso, opacidad] de las estelas de las barras que se mueven.
const GHOSTS: ReadonlyArray<readonly [number, number]> = [
    [0.08, 0.22],
    [0.16, 0.1],
];

function rgba(c: RGB, a = 1): string {
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

function rand(seed: number, k: number, salt: number): number {
    const x = Math.sin(seed * 12.9898 + k * 78.233 + salt * 37.719) * 43758.5453;
    return x - Math.floor(x);
}

function computeLayout(width: number, height: number, n: number): Layout {
    const padX = 10;
    const top = 30; // espacio para los marcadores de comparación
    const base = height - 6;
    const slotW = (width - padX * 2) / Math.max(n, 1);
    const gap = slotW >= 8 ? Math.max(1.5, slotW * 0.16) : slotW >= 3 ? 1 : 0;
    return {
        padX,
        top,
        base,
        chartH: Math.max(1, base - top),
        slotW,
        barW: Math.max(0.5, slotW - gap),
        gap,
    };
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, layout: Layout): void {
    const { padX, base, chartH } = layout;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(148,163,184,0.07)";
    ctx.beginPath();
    for (const f of [0.25, 0.5, 0.75, 1]) {
        const y = Math.round(base - chartH * f) + 0.5;
        ctx.moveTo(padX, y);
        ctx.lineTo(width - padX, y);
    }
    ctx.stroke();

    const g = ctx.createLinearGradient(padX, 0, width - padX, 0);
    g.addColorStop(0, "rgba(34,211,238,0)");
    g.addColorStop(0.5, "rgba(34,211,238,0.35)");
    g.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = g;
    ctx.fillRect(padX, base, width - padX * 2, 1);
}

function drawBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    bottom: number,
    w: number,
    h: number,
    color: RGB,
    alpha: number,
    gradient: boolean,
    glow: number
): void {
    if (h < 0.5 || w <= 0) return;
    const y = bottom - h;

    ctx.globalAlpha = alpha;
    if (glow > 0.04) {
        ctx.shadowColor = rgba(color, 0.9 * glow);
        ctx.shadowBlur = 20 * glow;
    }

    if (gradient && h > 2) {
        const g = ctx.createLinearGradient(0, y, 0, bottom);
        g.addColorStop(0, rgba(mix(color, WHITE, 0.28)));
        g.addColorStop(1, rgba(mix(color, NIGHT, 0.45)));
        ctx.fillStyle = g;
    } else {
        ctx.fillStyle = rgba(color);
    }

    // Esquinas superiores redondeadas cuando la barra es lo bastante ancha.
    const r = w >= 5 ? Math.min(w / 2, 5, h) : 0;
    ctx.beginPath();
    if (r > 0) {
        ctx.moveTo(x, bottom);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, bottom);
        ctx.closePath();
    } else {
        ctx.rect(x, y, w, h);
    }
    ctx.fill();

    if (glow > 0.04) {
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
    }
    ctx.globalAlpha = 1;
}

export function renderScene({ ctx, width, height, scene, now }: RenderOptions): void {
    ctx.clearRect(0, 0, width, height);

    const n = scene.count;
    const layout = computeLayout(width, height, n);
    const { padX, base, chartH, slotW, barW, gap } = layout;

    drawGrid(ctx, width, layout);
    if (n === 0) return;

    const maxV = Math.max(1, sample(scene.maxValue, now));
    const toH = (v: number) => (Math.max(0, v) / maxV) * chartH;
    const slotX = (s: number) => padX + s * slotW + gap / 2;
    const reduced = scene.reducedMotion;
    const fancy = n <= 200;

    // --- Rango activo de Merge Sort ---
    const rangeAlpha = sample(scene.range.alpha, now);
    if (rangeAlpha > 0.01) {
        const x0 = slotX(sample(scene.range.start, now)) - gap / 2;
        const x1 = slotX(sample(scene.range.end, now)) + barW + gap / 2;
        const y0 = layout.top - 12;
        ctx.fillStyle = rgba(PALETTE.range, 0.07 * rangeAlpha);
        ctx.fillRect(x0, y0, x1 - x0, base - y0);
        ctx.strokeStyle = rgba(PALETTE.range, 0.6 * rangeAlpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0 + 0.5, y0 + 8);
        ctx.lineTo(x0 + 0.5, y0 + 0.5);
        ctx.lineTo(x1 - 0.5, y0 + 0.5);
        ctx.lineTo(x1 - 0.5, y0 + 8);
        ctx.stroke();
    }

    // --- Pose actual de cada barra ---
    const hopMax = Math.min(34, chartH * 0.14);
    const waveHop = Math.min(12, chartH * 0.06);
    const stagger = waveStagger(n);
    const bySlot: (Pose | undefined)[] = new Array(n);
    const back: Pose[] = [];
    const front: Pose[] = [];

    for (const bar of scene.bars.values()) {
        const p = tweenProgress(bar.slot, now);
        let lift = bar.hop > 0 && p < 1 ? Math.sin(Math.PI * p) * bar.hop * hopMax : 0;
        let flash = bar.flash;

        // Ola final: recorre el arreglo de izquierda a derecha.
        if (scene.celebrateAt !== null) {
            const local = now - scene.celebrateAt - bar.slot.to * stagger;
            if (local > 0 && local < WAVE_MS) {
                const w = Math.sin((Math.PI * local) / WAVE_MS);
                flash = Math.max(flash, w * 0.8);
                if (!reduced) lift += w * waveHop;
            }
        }

        const pose: Pose = {
            bar,
            p,
            x: slotX(sampleAt(bar.slot, p)),
            h: toH(sample(bar.height, now)),
            lift,
            flash,
        };

        const target = bar.slot.to;
        if (target >= 0 && target < n) bySlot[target] = pose;
        // Lo que se mueve o brilla se dibuja encima del resto.
        (p < 1 || bar.glow > 0.05 ? front : back).push(pose);
    }

    const drawPose = (pose: Pose) => {
        const color = pose.flash > 0.01 ? mix(pose.bar.color, WHITE, pose.flash * 0.55) : pose.bar.color;
        drawBar(ctx, pose.x, base - pose.lift, barW, pose.h, color, 1, fancy, fancy ? pose.bar.glow : 0);
    };

    for (const pose of back) drawPose(pose);

    for (const pose of front) {
        const { bar, p } = pose;
        if (fancy && !reduced && bar.hop > 0 && p > 0 && p < 1) {
            for (const [lag, alpha] of GHOSTS) {
                const pg = p - lag;
                if (pg <= 0) continue;
                const gx = slotX(sampleAt(bar.slot, pg));
                const gl = Math.sin(Math.PI * pg) * bar.hop * hopMax;
                drawBar(ctx, gx, base - gl, barW, pose.h, bar.color, alpha, false, 0);
            }
        }
        drawPose(pose);
    }

    // --- Valores dentro de las barras (arreglos pequeños) ---
    if (n <= 24 && barW >= 20) {
        ctx.font = `600 10px ${MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(2,6,23,0.72)";
        for (const pose of bySlot) {
            if (!pose || pose.h < 18) continue;
            ctx.fillText(String(Math.round(pose.bar.value)), pose.x + barW / 2, base - pose.lift - 6);
        }
    }

    // --- Línea del pivote (Quick Sort) ---
    const pivotAlpha = sample(scene.pivot.alpha, now);
    const pivotBar = scene.pivot.id !== null ? scene.bars.get(scene.pivot.id) : undefined;
    if (pivotAlpha > 0.01 && pivotBar) {
        const y = Math.round(base - toH(sample(pivotBar.height, now))) + 0.5;
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(PALETTE.pivot, 0.55 * pivotAlpha);
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(width - padX, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `600 9px ${MONO}`;
        ctx.textAlign = "right";
        ctx.fillStyle = rgba(PALETTE.pivot, 0.85 * pivotAlpha);
        ctx.fillText("pivot", width - padX, y - 4);
        ctx.restore();
    }

    // --- Marcadores de comparación ---
    const step = scene.step;
    if (step?.kind === "compare") {
        const pop = easeOutBack(clamp01((now - scene.stepT0) / CARET_POP_MS));
        const size = clamp(barW * 0.7, 5, 11) * pop;
        if (size > 0.5) {
            ctx.fillStyle = rgba(PALETTE.compare);
            ctx.shadowColor = rgba(PALETTE.compare, 0.8);
            ctx.shadowBlur = 10;
            for (const i of step.indices) {
                const pose = bySlot[i];
                if (!pose) continue;
                const cx = pose.x + barW / 2;
                const tipY = base - pose.lift - pose.h - 5;
                ctx.beginPath();
                ctx.moveTo(cx - size / 2, tipY - size);
                ctx.lineTo(cx + size / 2, tipY - size);
                ctx.lineTo(cx, tipY);
                ctx.closePath();
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
        }
    }

    // --- Partículas ---
    if (scene.bursts.length > 0) {
        ctx.globalCompositeOperation = "lighter";
        for (const b of scene.bursts) {
            const age = now - b.t0;
            if (age < 0 || age >= BURST_LIFE_MS) continue;
            const t = age / BURST_LIFE_MS;
            const ox = padX + b.x * slotW;
            const oy = base - toH(b.value) - 6;
            ctx.fillStyle = rgba(b.color, Math.pow(1 - t, 1.5));
            for (let k = 0; k < b.count; k++) {
                const angle = -Math.PI / 2 + (rand(b.seed, k, 1) - 0.5) * Math.PI * 1.2;
                const speed = 0.06 + rand(b.seed, k, 2) * 0.12;
                const px = ox + Math.cos(angle) * speed * age;
                const py = oy + Math.sin(angle) * speed * age + 0.5 * GRAVITY * age * age;
                const r = (1 + rand(b.seed, k, 3) * 1.8) * (1 - t);
                ctx.beginPath();
                ctx.arc(px, py, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalCompositeOperation = "source-over";
    }
}
