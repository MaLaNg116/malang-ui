import { gsap } from 'gsap';

const DURATION = 4.8;
const TAU = Math.PI * 2;
const PHASES = ['gather', 'shape', 'respond', 'complete'] as const;

export type OrbitPhase = (typeof PHASES)[number];

export interface OrbitPalette {
  accent: string;
  secondary: string;
  border: string;
  surface: string;
  text: string;
  onAccent: string;
}

export interface OrbitSequenceState {
  readonly time: number;
  readonly duration: number;
  readonly progress: number;
  readonly phase: OrbitPhase;
  readonly playing: boolean;
  readonly reducedMotion: boolean;
  readonly disposed: boolean;
}

export interface OrbitSequenceOptions {
  /** Follow the operating-system preference unless explicitly overridden. */
  reducedMotion?: boolean | 'system';
  /** Size of the gathering pulse and completion fragments, from 0.6 to 1.8. */
  amplitude?: number;
  /** Positive playback multiplier. Seeking always uses timeline seconds. */
  speed?: number;
  /** Unspecified colors are read from the canvas's inherited --ui-* tokens. */
  colors?: Partial<OrbitPalette>;
  onUpdate?: (state: OrbitSequenceState) => void;
}

export interface OrbitSequenceController {
  readonly duration: number;
  readonly state: OrbitSequenceState;
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
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
};
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

/**
 * Create an isolated, manually played GSAP composition.
 *
 * Nothing accesses browser globals until this factory is called. Each instance
 * owns its timeline and subscriptions; disposing it never clears GSAP globally.
 */
export function createOrbitSequence(
  canvas: HTMLCanvasElement,
  options: OrbitSequenceOptions = {},
): OrbitSequenceController {
  const browser = canvas.ownerDocument.defaultView;
  const document = canvas.ownerDocument;
  const context = canvas.getContext('2d');
  if (!browser || !context) throw new Error('OrbitSequence requires a browser canvas with a 2D context.');

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
  let palette: OrbitPalette;

  function state(): OrbitSequenceState {
    const progress = playhead.value / DURATION;
    const phase = progress < 0.34 ? 0 : progress < 0.64 ? 1 : progress < 0.84 ? 2 : 3;
    return {
      time: playhead.value,
      duration: DURATION,
      progress,
      phase: PHASES[phase]!,
      playing,
      reducedMotion,
      disposed,
    };
  }

  function readPalette(): OrbitPalette {
    const styles = browser!.getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(`--ui-${name}`).trim() || fallback;
    return {
      accent: options.colors?.accent ?? token('color-accent', '#6340db'),
      secondary: options.colors?.secondary ?? token('color-secondary-accent', '#057d77'),
      border: options.colors?.border ?? token('color-border', '#d7d3e6'),
      surface: options.colors?.surface ?? token('color-surface', '#faf9ff'),
      text: options.colors?.text ?? token('color-text', '#1b1730'),
      onAccent: options.colors?.onAccent ?? token('color-on-accent', '#ffffff'),
    };
  }

  function project(angle: number, band: number, spin: number) {
    const radius = Math.min(width * 0.27, height * 0.365) * (1 + band * 0.115);
    const tilt = [0.53, 1.19, -0.74][band]!;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * Math.cos(tilt);
    const z = Math.sin(angle) * radius * Math.sin(tilt);
    const rotation = -0.47 + Math.sin(spin * 0.4) * 0.12;
    const scale = 520 / (520 + z);
    return {
      x: (x * Math.cos(rotation) - y * Math.sin(rotation)) * scale,
      y: (x * Math.sin(rotation) + y * Math.cos(rotation)) * scale,
      z,
      scale,
    };
  }

  function tile(x: number, y: number, tileWidth: number, tileHeight: number, angle: number, color: string, alpha: number) {
    context!.save();
    context!.translate(x, y);
    context!.rotate(angle);
    context!.globalAlpha = clamp(alpha);
    context!.fillStyle = color;
    context!.beginPath();
    context!.roundRect(-tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight, Math.min(tileWidth, tileHeight) * 0.23);
    context!.fill();
    context!.restore();
  }

  function draw() {
    if (disposed || width === 0 || height === 0) return;
    context!.clearRect(0, 0, width, height);
    const progress = playhead.value / DURATION;
    const morph = smooth((progress - 0.34) / 0.30);
    const pulse = Math.sin(Math.PI * clamp(progress / 0.37));
    const spin = playhead.value * 0.85 + Math.sin(clamp(progress / 0.43) * Math.PI) * 0.65;
    context!.save();
    context!.translate(width / 2, height / 2);

    const glow = context!.createRadialGradient(0, 0, 8, 0, 0, Math.min(width, height) * 0.6);
    glow.addColorStop(0, palette.accent);
    glow.addColorStop(1, 'transparent');
    context!.globalAlpha = 0.12;
    context!.fillStyle = glow;
    context!.fillRect(-width / 2, -height / 2, width, height);

    const orbitAlpha = 1 - smooth((progress - 0.31) / 0.26);
    for (let band = 0; band < 3; band++) {
      context!.beginPath();
      for (let segment = 0; segment <= 100; segment++) {
        const point = project((segment / 100) * TAU + spin, band, spin);
        const x = point.x * (1 + pulse * 0.10 * amplitude);
        const y = point.y * (1 + pulse * 0.10 * amplitude);
        if (segment === 0) context!.moveTo(x, y);
        else context!.lineTo(x, y);
      }
      context!.globalAlpha = 0.35 * orbitAlpha;
      context!.strokeStyle = band === 1 ? palette.secondary : palette.accent;
      context!.lineWidth = 1;
      context!.stroke();
    }

    const tiles = [];
    const buttonWidth = Math.min(230, width * 0.72);
    for (let index = 0; index < 96; index++) {
      const band = index % 3;
      const angle = (Math.floor(index / 3) / 32) * TAU + spin + band * 0.20;
      const source = project(angle, band, spin);
      const targetAngle = (index / 96) * TAU;
      const cos = Math.cos(targetAngle);
      const sin = Math.sin(targetAngle);
      const targetX = Math.sign(cos) * Math.pow(Math.abs(cos), 0.38) * buttonWidth / 2;
      const targetY = Math.sign(sin) * Math.pow(Math.abs(sin), 0.38) * 37;
      const delayedMorph = smooth((morph - (index % 7) * 0.012) / 0.928);
      tiles.push({
        x: lerp(source.x * (1 + pulse * 0.10 * amplitude), targetX, delayedMorph),
        y: lerp(source.y * (1 + pulse * 0.10 * amplitude), targetY, delayedMorph),
        z: source.z,
        width: lerp((band === 1 ? 9 : 6) * source.scale, 4, delayedMorph),
        height: lerp((index % 5 === 0 ? 20 : 11) * source.scale, 4, delayedMorph),
        angle: lerp(angle + 0.5, targetAngle, delayedMorph),
        color: band === 1 ? palette.secondary : palette.accent,
        alpha: lerp(0.40 + (source.z + 180) / 520, 0.8, delayedMorph),
      });
    }
    tiles.sort((first, second) => second.z - first.z);
    for (const point of tiles) tile(point.x, point.y, point.width, point.height, point.angle, point.color, point.alpha);

    const visible = smooth((progress - 0.57) / 0.10);
    if (visible > 0) {
      const complete = progress >= 0.84;
      context!.globalAlpha = visible;
      context!.fillStyle = complete ? palette.accent : palette.surface;
      context!.beginPath();
      context!.roundRect(-buttonWidth / 2 + 8, -29, buttonWidth - 16, 58, 13);
      context!.fill();
      context!.fillStyle = complete ? palette.onAccent : palette.text;
      context!.font = '500 16px "Segoe UI", "Microsoft YaHei", sans-serif';
      context!.textAlign = 'center';
      context!.textBaseline = 'middle';
      context!.fillText(complete ? '✓  空间已就绪' : '创建空间  ↗', 0, 1);
    }

    const burst = clamp((progress - 0.79) / 0.21);
    if (burst > 0 && burst < 1) {
      for (let index = 0; index < 24; index++) {
        const angle = (index / 24) * TAU;
        const radius = 25 + Math.pow(burst, 0.55) * (85 + (index % 4) * 18) * amplitude;
        tile(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.70,
          3 + (index % 3) * 2,
          6 + (index % 4) * 2,
          angle + burst * 2,
          index % 3 === 0 ? palette.secondary : palette.accent,
          Math.sin(Math.PI * burst) * 0.8,
        );
      }
    }
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
    // A cached document retains this controller and its subscriptions. Hold its
    // frame so returning through the back/forward cache remains interactive.
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
    onComplete: () => {
      playing = false;
      render();
    },
  });
  timeline.to(playhead, { value: DURATION, duration: DURATION, ease: 'none' }, 0);
  timeline.addLabel('gather', 0).addLabel('shape', DURATION * 0.34).addLabel('respond', DURATION * 0.64).addLabel('complete', DURATION * 0.84);
  timeline.timeScale(speed);

  resizeObserver?.observe(canvas);
  for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement) {
    themeObserver?.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'data-ui-theme', 'data-ui-palette'] });
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
