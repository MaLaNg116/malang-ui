import { gsap } from 'gsap';

const DURATION = 5;
const TAU = Math.PI * 2;

export type InkPhase = 'gather' | 'cut' | 'assemble' | 'complete';

export interface InkPalette {
  accent: string;
  secondary: string;
  ink: string;
  paper: string;
  metal: string;
  text: string;
  border: string;
  onAccent: string;
}

export interface InkSequenceState {
  readonly time: number;
  readonly duration: number;
  readonly progress: number;
  readonly phase: InkPhase;
  readonly playing: boolean;
  readonly reducedMotion: boolean;
  readonly disposed: boolean;
}

export interface InkSequenceOptions {
  /** Follow the operating-system preference unless explicitly overridden. */
  reducedMotion?: boolean | 'system';
  /** Brush separation and flying-fragment distance, from 0.6 to 1.8. */
  amplitude?: number;
  /** Positive playback multiplier. Seeking always uses timeline seconds. */
  speed?: number;
  /** Unspecified colors are read from the canvas's inherited --ui-* tokens. */
  colors?: Partial<InkPalette>;
  onUpdate?: (state: InkSequenceState) => void;
}

export interface InkSequenceController {
  readonly duration: number;
  readonly state: InkSequenceState;
  play(): void;
  pause(): void;
  /** Seek within [0, duration]. Reaching the endpoint pauses playback. */
  seek(seconds: number): void;
  replay(): void;
  /** Idempotent. Later control calls are harmless no-ops. */
  dispose(): void;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
// Hashing stable indices keeps every seek, replay and instance on the same frame.
const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/**
 * An original ink / cut-plane / seal composition. No raster assets or autoplay.
 * Browser state, GSAP ownership and subscriptions are isolated per instance.
 */
export function createInkSequence(
  canvas: HTMLCanvasElement,
  options: InkSequenceOptions = {},
): InkSequenceController {
  const document = canvas.ownerDocument;
  const browser = document.defaultView;
  const context = canvas.getContext('2d');
  if (!browser || !context) throw new Error('InkSequence requires a browser canvas with a 2D context.');

  const amplitude = options.amplitude ?? 1;
  const speed = options.speed ?? 1;
  if (!Number.isFinite(amplitude) || amplitude < 0.6 || amplitude > 1.8) {
    throw new RangeError('amplitude must be a finite number from 0.6 to 1.8.');
  }
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new RangeError('speed must be a positive finite number.');
  }

  const preference = browser.matchMedia?.('(prefers-reduced-motion: reduce)');
  const followsPreference = options.reducedMotion === undefined || options.reducedMotion === 'system';
  let reducedMotion = followsPreference ? (preference?.matches ?? false) : options.reducedMotion === true;
  let width = 0;
  let height = 0;
  let playing = false;
  let disposed = false;
  const playhead = { value: 0 };
  let timeline: gsap.core.Timeline | undefined;
  let palette: InkPalette;

  function state(): InkSequenceState {
    const time = playhead.value;
    return {
      time,
      duration: DURATION,
      progress: time / DURATION,
      phase: time < 1.4 ? 'gather' : time < 2.55 ? 'cut' : time < 4.3 ? 'assemble' : 'complete',
      playing,
      reducedMotion,
      disposed,
    };
  }

  function readPalette(): InkPalette {
    const styles = browser!.getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(`--ui-color-${name}`).trim() || fallback;
    return {
      accent: options.colors?.accent ?? token('accent', '#b83e35'),
      secondary: options.colors?.secondary ?? token('secondary-accent', '#43877c'),
      ink: options.colors?.ink ?? token('ink', token('text', '#252824')),
      paper: options.colors?.paper ?? token('paper', token('surface', '#f1eee5')),
      metal: options.colors?.metal ?? token('metal', '#9c988c'),
      text: options.colors?.text ?? token('text', '#252824'),
      border: options.colors?.border ?? token('border', '#d1cdbf'),
      onAccent: options.colors?.onAccent ?? token('on-accent', '#fff6e9'),
    };
  }

  function line(points: readonly number[], color: string, alpha: number, thickness = 1) {
    context!.globalAlpha = clamp(alpha);
    context!.strokeStyle = color;
    context!.lineWidth = thickness;
    context!.beginPath();
    for (let index = 0; index < points.length; index += 2) {
      if (index === 0) context!.moveTo(points[index]!, points[index + 1]!);
      else context!.lineTo(points[index]!, points[index + 1]!);
    }
    context!.stroke();
  }

  function polygon(points: readonly number[], color: string, alpha: number) {
    context!.globalAlpha = clamp(alpha);
    context!.fillStyle = color;
    context!.beginPath();
    for (let index = 0; index < points.length; index += 2) {
      if (index === 0) context!.moveTo(points[index]!, points[index + 1]!);
      else context!.lineTo(points[index]!, points[index + 1]!);
    }
    context!.closePath();
    context!.fill();
  }

  function guides(time: number, settle: number) {
    const opening = smooth(time / 0.6);
    const alpha = 0.18 + settle * 0.14;
    const size = lerp(126, 82, settle);
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        line([x * (size - 15), y * size, x * size, y * size, x * size, y * (size - 15)], palette.metal, alpha * opening);
      }
    }
    line([-287, 0, -264, 0], palette.secondary, 0.55 * opening);
    line([264, 0, 287, 0], palette.secondary, 0.55 * opening);
    line([0, -139, 0, -128], palette.metal, alpha);
    line([0, 128, 0, 139], palette.metal, alpha);
    for (let index = 0; index < 11; index++) {
      const x = -70 + index * 14;
      line([x, 140, x, 140 + (index % 5 === 0 ? 7 : 3)], palette.metal, alpha * 0.7);
    }
  }

  function brush(time: number, settle: number) {
    // Keep a trace of the gesture after the moving brush has withdrawn.
    if (settle > 0) {
      line([-112, 43, -88, 38, -74, 39], palette.ink, 0.16 * settle, 1.5);
      line([-103, 47, -89, 43], palette.ink, 0.1 * settle, 0.7);
    }
    const reveal = 0.13 + 0.87 * smooth(time / 1.45);
    const split = smooth((time - 1.5) / 0.55);
    const release = smooth((time - 2.4) / 1.05);
    const opacity = (1 - release) * 0.92;
    if (opacity < 0.001) return;
    context!.save();
    context!.rotate(-0.17);
    context!.translate(-12, 8);

    for (let bristle = 0; bristle < 62; bristle++) {
      const seed = bristle + 10;
      const offset = (bristle / 61 - 0.5) * 93;
      const side = offset < 0 ? -1 : 1;
      const travel = side * split * (12 + random(seed) * 18) * amplitude;
      const width = 1 + random(seed + 40) * 4.7;
      const start = -240 + random(seed + 20) * 60;
      const length = 360 + random(seed + 30) * 100;
      const delay = random(seed + 50) * 0.14;
      const front = clamp((reveal - delay) / (1 - delay));
      for (let segment = 0; segment < 26; segment++) {
        const portion = segment / 26;
        if (portion > front || random(seed * 41 + segment) < 0.19) continue;
        const next = Math.min((segment + 1.2) / 26, front);
        const x = start + portion * length;
        const nextX = start + next * length;
        const envelope = Math.sin(portion * Math.PI) * 0.62 + 0.38;
        const y = offset * envelope + Math.sin(portion * 8 + bristle * 0.3) * 4 + travel;
        const nextY = offset * (Math.sin(next * Math.PI) * 0.62 + 0.38) + Math.sin(next * 8 + bristle * 0.3) * 4 + travel;
        const color = bristle % 17 === 0 ? palette.secondary : bristle % 13 === 0 ? palette.accent : palette.ink;
        line([x, y, nextX, nextY], color, opacity * (0.35 + random(seed + 70) * 0.55), width * envelope);
      }
    }

    // Small disconnected beads leave genuine negative space between the fibres.
    for (let index = 0; index < 54; index++) {
      const seed = index + 390;
      const localReveal = smooth((reveal - random(seed) * 0.7) / 0.25);
      const x = -247 + random(seed + 1) * 493;
      const y = (random(seed + 2) - 0.5) * 148 + (random(seed + 2) < 0.5 ? -1 : 1) * split * 28 * amplitude;
      context!.globalAlpha = opacity * localReveal * (0.2 + random(seed + 3) * 0.5);
      context!.fillStyle = index % 9 === 0 ? palette.accent : palette.ink;
      context!.fillRect(x + release * (x * 0.35), y, 0.8 + random(seed + 4) * 2.2, 0.5 + random(seed + 5) * 1.3);
    }
    context!.restore();
  }

  function cut(time: number) {
    const progress = clamp((time - 1.4) / 1.15);
    if (progress <= 0 || progress >= 1) return;
    const enter = smooth(progress / 0.28);
    const fade = 1 - smooth((progress - 0.58) / 0.42);
    const reach = 290 * enter;
    const width = Math.sin(progress * Math.PI) * 14;
    context!.save();
    context!.rotate(-0.36);
    polygon([-reach - 35, 6, reach, -width, reach + 42, -11, -reach, 13], palette.accent, 0.93 * fade);
    polygon([-reach + 25, 15, reach - 35, 0, reach - 25, 2, -reach + 42, 19], palette.paper, 0.85 * fade);
    line([-reach - 50, -12, reach + 50, -12], palette.secondary, fade * 0.7, 1);
    for (let index = 0; index < 13; index++) {
      const seed = index + 800;
      const x = -220 + index * 37;
      const distance = (18 + random(seed) * 45) * smooth((progress - 0.15) / 0.7) * amplitude;
      const direction = index % 2 === 0 ? -1 : 1;
      line([x - 12, direction * distance, x + 7, direction * distance - 4, x + 12, direction * distance - 8], index % 3 === 0 ? palette.secondary : palette.metal, fade * 0.62);
    }
    context!.restore();
  }

  function planes(time: number, settle: number) {
    const begin = smooth((time - 1.85) / 0.55);
    if (begin <= 0) return;
    const gather = smooth((time - 2.55) / 1.45);
    const alpha = begin * (1 - smooth((time - 3.82) / 0.65));
    for (let index = 0; index < 20; index++) {
      const seed = index + 1100;
      const angle = (index / 20) * TAU;
      const distance = (142 + random(seed) * 105) * (0.5 + amplitude * 0.5);
      const cornerX = Math.sign(Math.cos(angle)) * 49;
      const cornerY = Math.sign(Math.sin(angle)) * 49;
      const x = lerp(Math.cos(angle) * distance, cornerX, gather);
      const y = lerp(Math.sin(angle) * distance * 0.49, cornerY, gather);
      const slant = (1 - gather) * (random(seed + 1) - 0.5) * 1.4;
      const length = lerp(19 + random(seed + 2) * 34, 12, gather);
      context!.save();
      context!.translate(x, y);
      context!.rotate(slant + angle * (1 - gather));
      polygon([-length / 2, -3, length / 2, -3, length / 2 - 7, 3, -length / 2 - 7, 3], index % 4 === 0 ? palette.secondary : index % 3 === 0 ? palette.accent : palette.metal, alpha * (0.35 + random(seed + 3) * 0.45));
      line([-length / 2, -6, length / 2 + 6, -6], palette.text, alpha * 0.22, 0.7);
      context!.restore();
    }
    if (settle < 1) {
      const pulse = Math.sin(clamp((time - 3.72) / 1.28) * Math.PI);
      for (let index = 0; index < 24; index++) {
        const angle = index / 24 * TAU;
        const radius = 68 + smooth((time - 3.72) / 1.1) * 54 * amplitude;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        line([x, y, x + Math.cos(angle) * 3, y + Math.sin(angle) * 3], index % 6 === 0 ? palette.accent : palette.metal, pulse * 0.44);
      }
    }
  }

  function seal(time: number, settle: number) {
    const appear = smooth((time - 2.9) / 1.2);
    if (appear <= 0) return;
    const scale = lerp(0.77, 1, appear) + Math.sin(clamp((time - 3.7) / 0.6) * Math.PI) * 0.045;
    context!.save();
    context!.scale(scale, scale);
    context!.rotate((1 - appear) * -0.15);
    context!.globalAlpha = appear * 0.07;
    context!.fillStyle = palette.accent;
    context!.fillRect(-64, -64, 128, 128);
    line([-48, -54, 36, -54, 54, -36, 54, 48, 48, 54, -36, 54, -54, 36, -54, -48, -48, -54], palette.accent, appear, 3);
    line([-41, -42, 28, -42, 42, -28, 42, 41, -28, 41, -42, 27, -42, -41], palette.accent, appear * 0.45, 0.8);
    // Three interlocking, angular strokes form an original abstract seal.
    polygon([-28, -25, -13, -25, -13, 4, 14, -25, 29, -25, -7, 15, -7, 30, -21, 30, -21, 10, -28, 10], palette.accent, appear);
    polygon([12, -8, 29, -8, 29, 30, 15, 30, 15, 5, 1, 19, -8, 10], palette.accent, appear);
    // The registration incision and final jade stitch keep the seal mechanical.
    line([-37, 34, 33, -36], palette.paper, appear * 0.85, 1.4);
    line([44, -51, 51, -44], palette.secondary, appear * settle, 3);
    line([-68, 62, -56, 62], palette.secondary, appear * settle, 1);
    line([56, -62, 68, -62], palette.secondary, appear * settle, 1);
    context!.restore();
  }

  function draw() {
    if (disposed || width === 0 || height === 0) return;
    context!.clearRect(0, 0, width, height);
    const time = playhead.value;
    const settle = smooth((time - 3.8) / 1.2);
    const scale = Math.min(width / 720, height / 360);
    context!.save();
    context!.translate(width / 2, height / 2);
    context!.scale(scale, scale);
    context!.lineCap = 'butt';
    context!.lineJoin = 'miter';
    guides(time, settle);
    brush(time, settle);
    planes(time, settle);
    cut(time);
    seal(time, settle);
    context!.restore();
    context!.globalAlpha = 1;
  }

  function render() {
    if (disposed) return;
    draw();
    options.onUpdate?.(state());
  }

  function resize() {
    if (disposed) return;
    const box = canvas.getBoundingClientRect();
    width = Math.max(0, box.width);
    height = Math.max(0, box.height);
    const ratio = Math.min(browser!.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    palette = readPalette();
    render();
  }

  function pause() {
    if (disposed) return;
    playing = false;
    timeline?.pause();
    render();
  }

  function seek(seconds: number) {
    if (disposed) return;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > DURATION) {
      throw new RangeError(`seek time must be a finite number from 0 to ${DURATION}.`);
    }
    if (seconds === DURATION) {
      playing = false;
      timeline!.pause(seconds, true);
    } else {
      timeline!.time(seconds, true);
    }
    render();
  }

  function play() {
    if (disposed) return;
    if (reducedMotion) {
      playing = false;
      timeline!.pause(DURATION, true);
      render();
      return;
    }
    if (playhead.value >= DURATION) timeline!.time(0, true);
    playing = true;
    timeline!.play();
    render();
  }

  function replay() {
    if (disposed) return;
    timeline!.pause(0, true);
    play();
  }

  function preferenceChanged(event: MediaQueryListEvent) {
    reducedMotion = event.matches;
    if (reducedMotion && playing) {
      playing = false;
      timeline!.pause(DURATION, true);
    }
    render();
  }

  function visibilityChanged() {
    if (document.hidden && playing) pause();
  }

  function pageHidden(event: PageTransitionEvent) {
    if (event.persisted) pause();
    else dispose();
  }

  function pageShown(event: PageTransitionEvent) {
    if (event.persisted && !disposed) resize();
  }

  function themeChanged() {
    if (disposed) return;
    palette = readPalette();
    render();
  }

  const resizeObserver = typeof browser.ResizeObserver === 'function' ? new browser.ResizeObserver(resize) : undefined;
  const themeObserver = typeof browser.MutationObserver === 'function' ? new browser.MutationObserver(themeChanged) : undefined;

  function dispose() {
    if (disposed) return;
    disposed = true;
    playing = false;
    timeline?.kill();
    resizeObserver?.disconnect();
    themeObserver?.disconnect();
    browser!.removeEventListener('resize', resize);
    browser!.removeEventListener('pagehide', pageHidden);
    browser!.removeEventListener('pageshow', pageShown);
    document.removeEventListener('visibilitychange', visibilityChanged);
    if (followsPreference) preference?.removeEventListener('change', preferenceChanged);
  }

  palette = readPalette();
  timeline = gsap.timeline({
    paused: true,
    onUpdate: render,
    onComplete: () => { playing = false; render(); },
  });
  timeline.to(playhead, { value: DURATION, duration: DURATION, ease: 'none' }, 0);
  timeline.addLabel('gather', 0).addLabel('cut', 1.4).addLabel('assemble', 2.55).addLabel('complete', 4.3);
  timeline.timeScale(speed);

  resizeObserver?.observe(canvas);
  for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement) {
    themeObserver?.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'data-ui-theme'] });
  }
  browser.addEventListener('resize', resize);
  browser.addEventListener('pagehide', pageHidden);
  browser.addEventListener('pageshow', pageShown);
  document.addEventListener('visibilitychange', visibilityChanged);
  if (followsPreference) preference?.addEventListener('change', preferenceChanged);
  resize();

  return {
    get duration() { return DURATION; },
    get state() { return state(); },
    play,
    pause,
    seek,
    replay,
    dispose,
  };
}
