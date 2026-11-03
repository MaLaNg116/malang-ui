export interface InkBrushFrame {
  reveal: number;
  split: number;
  opacity: number;
  amplitude: number;
  ink: string;
}

export interface InkBrush {
  draw(context: CanvasRenderingContext2D, frame: InkBrushFrame): void;
  dispose(): void;
}

const LEFT = -280;
const TOP = -100;
const WIDTH = 560;
const HEIGHT = 200;
const RESOLUTION = 2;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const center = (t: number) => 24 - 72 * t * t + Math.sin(t * Math.PI * 1.5) * 5;
const pressure = (t: number) => (
  28 * Math.pow(1 - t, 0.65)
  + 16 * Math.exp(-Math.pow((t - 0.1) / 0.15, 2))
) * (1 - Math.sin(t * 13) * 0.07);
const xAt = (t: number) => -242 + t * 480;
const edge = (t: number, side: number) => center(t)
  + side * pressure(t) * (side < 0 ? 0.74 : 1.05)
  + (Math.sin(t * 191 + side) * 0.6 + Math.sin(t * 73) * 0.9) * (1 - t);

function silhouette(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(xAt(0), edge(0, -1));
  for (let index = 1; index <= 100; index++) {
    const t = index / 100;
    context.lineTo(xAt(t), edge(t, -1));
  }
  for (let index = 99; index >= 0; index--) {
    const t = index / 100;
    context.lineTo(xAt(t), edge(t, 1));
  }
  // A pressed heel, rather than a second tapered point, gives the stroke weight.
  context.bezierCurveTo(-256, 72, -267, 57, -261, 44);
  context.bezierCurveTo(-266, 30, -262, 13, -259, 5);
  context.bezierCurveTo(-257, -9, -249, -9, xAt(0), edge(0, -1));
  context.closePath();
}

/** A per-instance brush texture; animation only reveals and separates its image. */
export function createInkBrush(document: Document): InkBrush {
  let texture: HTMLCanvasElement | undefined;
  let cachedInk: string | undefined;
  let disposed = false;

  function rebuild(ink: string) {
    texture ??= document.createElement('canvas');
    texture.width = WIDTH * RESOLUTION;
    texture.height = HEIGHT * RESOLUTION;
    const context = texture.getContext('2d');
    if (!context) throw new Error('InkBrush requires a canvas with a 2D context.');
    context.setTransform(RESOLUTION, 0, 0, RESOLUTION, -LEFT * RESOLUTION, -TOP * RESOLUTION);

    let seed = 0x243f6a88;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    context.fillStyle = ink;
    context.strokeStyle = ink;
    // Small uneven deposits soften the edge without a shadow or pixel filter.
    for (let index = 0; index < 420; index++) {
      const t = random() * 0.96;
      const side = random() < 0.5 ? -1 : 1;
      const radius = 0.3 + random() * 1.45 * (1 - t * 0.6);
      context.globalAlpha = 0.03 + random() * 0.17;
      context.beginPath();
      context.ellipse(xAt(t) + (random() - 0.5) * 3, edge(t, side) + (random() - 0.5) * 3.5, radius * 1.4, radius, -0.2, 0, Math.PI * 2);
      context.fill();
    }

    silhouette(context);
    context.globalAlpha = 0.48;
    context.fill();
    context.save();
    context.clip();

    const wet = context.createLinearGradient(-245, 0, 230, 0);
    wet.addColorStop(0, ink);
    wet.addColorStop(0.3, ink);
    wet.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = wet;
    context.globalAlpha = 0.94;
    context.fillRect(LEFT, TOP, WIDTH, HEIGHT);
    context.fillStyle = ink;

    // Broad, overlapping wet passages are deliberately irregular in length.
    for (let index = 0; index < 18; index++) {
      const start = random() * 0.6;
      const end = Math.min(1, start + 0.2 + random() * 0.45);
      const offset = -0.65 + random() * 0.55;
      context.globalAlpha = 0.03 + random() * 0.1;
      context.lineWidth = 4 + random() * 17;
      context.beginPath();
      for (let point = 0; point <= 18; point++) {
        const t = start + (end - start) * point / 18;
        const x = xAt(t);
        const y = center(t) + pressure(t) * offset + Math.sin(t * 11 + index) * 2;
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }

    // Pigment collects in small islands instead of a uniformly filled ribbon.
    for (let index = 0; index < 580; index++) {
      const t = random();
      const radius = 0.3 + random() * 1.5;
      context.globalAlpha = 0.035 + random() * 0.18;
      context.beginPath();
      context.ellipse(xAt(t), center(t) + (random() - 0.5) * pressure(t) * 2, radius * (0.6 + random()), radius, random(), 0, Math.PI * 2);
      context.fill();
    }

    // Transparent, wandering gaps reveal the actual theme beneath the dry tip.
    context.globalCompositeOperation = 'destination-out';
    // Broad, faint pockets vary pigment density without a per-frame blur pass.
    for (let index = 0; index < 42; index++) {
      const t = random() * 0.72;
      const x = xAt(t);
      const y = center(t) + (random() - 0.5) * pressure(t) * 1.5;
      const radius = 4 + random() * 14;
      const wash = context.createRadialGradient(x, y, 0, x, y, radius);
      wash.addColorStop(0, 'rgba(0, 0, 0, 1)');
      wash.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = wash;
      context.globalAlpha = 0.015 + random() * 0.035;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    context.fillStyle = ink;
    for (let index = 0; index < 68; index++) {
      const start = 0.08 + Math.pow(random(), 0.65) * 0.8;
      const end = Math.min(1, start + 0.035 + random() * 0.29);
      const offset = (0.15 + random() * 0.8) * (index % 8 === 0 ? -1 : 1);
      const width = 0.25 + random() * (index % 7 === 0 ? 2.9 : 1.25);
      const points: { x: number; y: number; width: number }[] = [];
      for (let point = 0; point <= 14; point++) {
        const portion = point / 14;
        const t = start + (end - start) * portion;
        points.push({
          x: xAt(t),
          y: center(t) + pressure(t) * offset + Math.sin(t * 35 + index) * 1.5,
          width: Math.pow(Math.sin(portion * Math.PI), 0.7) * width * (0.45 + random() * 0.55),
        });
      }
      context.beginPath();
      points.forEach((point, position) => {
        if (position === 0) context.moveTo(point.x, point.y - point.width);
        else context.lineTo(point.x, point.y - point.width);
      });
      for (let point = points.length - 1; point >= 0; point--) {
        context.lineTo(points[point]!.x, points[point]!.y + points[point]!.width);
      }
      context.closePath();
      context.globalAlpha = 0.28 + random() * 0.7;
      context.fill();
    }
    for (let index = 0; index < 430; index++) {
      const t = 0.1 + Math.pow(random(), 0.6) * 0.9;
      const radius = 0.2 + random() * 1.05;
      context.globalAlpha = 0.3 + random() * 0.7;
      context.beginPath();
      context.ellipse(xAt(t), center(t) + (random() - 0.5) * pressure(t) * 2.05, radius * (0.8 + random() * 1.5), radius, -0.35, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = ink;
    context.lineCap = 'round';

    // A few escaped hairs carry the tip beyond the main pressure silhouette.
    for (let index = 0; index < 13; index++) {
      const start = 0.65 + random() * 0.2;
      const end = 0.9 + random() * 0.095;
      const offset = (random() - 0.5) * 2.25;
      context.globalAlpha = 0.14 + random() * 0.32;
      context.lineWidth = 0.35 + random() * 0.7;
      context.beginPath();
      context.moveTo(xAt(start), center(start) + pressure(start) * offset);
      context.quadraticCurveTo(xAt((start + end) / 2), center((start + end) / 2) + offset * 7, xAt(end) + random() * 7, center(end) + offset * 4);
      context.stroke();
    }

    // Rounded droplets remain sparse and close to the pressed heel.
    context.fillStyle = ink;
    for (let index = 0; index < 11; index++) {
      const x = index < 8 ? -257 + random() * 93 : -135 + random() * 170;
      const y = index < 8 ? 49 + random() * 28 : -18 - random() * 12;
      const radius = 0.6 + Math.pow(random(), 2) * 2.5;
      context.globalAlpha = 0.25 + random() * 0.5;
      context.beginPath();
      context.ellipse(x, y, radius * (0.85 + random() * 0.3), radius, random(), 0, Math.PI * 2);
      context.fill();
    }
    cachedInk = ink;
  }

  function draw(context: CanvasRenderingContext2D, frame: InkBrushFrame) {
    if (disposed || frame.opacity <= 0 || frame.reveal <= 0) return;
    if (!texture || cachedInk !== frame.ink) rebuild(frame.ink);
    const split = clamp(frame.split);
    const amplitude = Math.max(0, frame.amplitude);
    context.save();
    context.globalAlpha = clamp(frame.opacity);
    context.beginPath();
    context.rect(LEFT, TOP - 80, WIDTH * clamp(frame.reveal), HEIGHT + 160);
    context.clip();
    // Drawing the intact texture once avoids an antialiased seam before the cut.
    if (split === 0) {
      context.drawImage(texture!, LEFT, TOP, WIDTH, HEIGHT);
      context.restore();
      return;
    }
    for (const side of [-1, 1]) {
      context.save();
      context.translate(-side * split * amplitude * 5, side * split * amplitude * 19);
      context.rotate(-side * split * 0.008);
      context.beginPath();
      context.moveTo(LEFT - 30, side < 0 ? TOP - 20 : TOP + HEIGHT + 20);
      context.lineTo(LEFT + WIDTH + 30, side < 0 ? TOP - 20 : TOP + HEIGHT + 20);
      context.lineTo(LEFT + WIDTH + 30, -0.19 * (LEFT + WIDTH + 30) + 1);
      context.lineTo(LEFT - 30, -0.19 * (LEFT - 30) + 1);
      context.closePath();
      context.clip();
      context.drawImage(texture!, LEFT, TOP, WIDTH, HEIGHT);
      context.restore();
    }
    context.restore();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (texture) { texture.width = 0; texture.height = 0; }
    texture = undefined;
    cachedInk = undefined;
  }

  return { draw, dispose };
}
