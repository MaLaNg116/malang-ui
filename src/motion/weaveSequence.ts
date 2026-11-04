import { gsap } from 'gsap';

const DURATION = 4.2;
const WARP = 14;
const WEFT = 10;
const TAU = Math.PI * 2;

export type WeaveSequencePhase = 'lay' | 'cross' | 'weave' | 'rest';
export interface WeaveSequenceColors {
  accent: string;
  secondary: string;
  seal: string;
  ink: string;
  paper: string;
  metal: string;
  text: string;
  border: string;
}
export interface WeaveSequenceState {
  readonly time: number;
  readonly duration: number;
  readonly progress: number;
  readonly phase: WeaveSequencePhase;
  readonly playing: boolean;
  readonly reducedMotion: boolean;
  readonly disposed: boolean;
}
export interface WeaveSequenceOptions {
  reducedMotion?: boolean | 'system';
  /** Thread tension and shuttle separation, from 0.6 to 1.8. */
  amplitude?: number;
  /** Positive playback multiplier. Seek positions remain seconds. */
  speed?: number;
  colors?: Partial<WeaveSequenceColors>;
  onUpdate?: (state: WeaveSequenceState) => void;
}
export interface WeaveSequenceController {
  readonly duration: number;
  readonly state: WeaveSequenceState;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  replay(): void;
  dispose(): void;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const out = (value: number) => 1 - Math.pow(1 - clamp(value), 3);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;
type Point = readonly [number, number];
const surface = (u: number, v: number): Point => [(u - 0.5) * 360 + (v - 0.5) * 86, (v - 0.5) * 218 - (u - 0.5) * 26];

/** An original finite silk-plane study. Importing it does not access the DOM. */
export function createWeaveSequence(canvas: HTMLCanvasElement, options: WeaveSequenceOptions = {}): WeaveSequenceController {
  const amplitude = options.amplitude ?? 1, speed = options.speed ?? 1;
  if (!Number.isFinite(amplitude) || amplitude < 0.6 || amplitude > 1.8) throw new RangeError('amplitude must be a finite number from 0.6 to 1.8.');
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('speed must be a positive finite number.');
  if (options.reducedMotion !== undefined && options.reducedMotion !== 'system' && typeof options.reducedMotion !== 'boolean') throw new TypeError('reducedMotion must be a boolean or system.');
  if (options.onUpdate !== undefined && typeof options.onUpdate !== 'function') throw new TypeError('onUpdate must be a function.');
  for (const value of Object.values(options.colors ?? {})) if (typeof value !== 'string' || !value.trim()) throw new TypeError('colors must contain non-empty CSS color strings.');
  const document = canvas?.ownerDocument, browser = document?.defaultView;
  const context = typeof canvas?.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!browser || !context) throw new Error('WeaveSequence requires a browser canvas with a 2D context.');
  for (const value of Object.values(options.colors ?? {})) if (browser.CSS?.supports && !browser.CSS.supports('color', value)) throw new TypeError('colors must contain valid CSS colors.');

  const preference = browser.matchMedia?.('(prefers-reduced-motion: reduce)');
  const followsPreference = options.reducedMotion === undefined || options.reducedMotion === 'system';
  let reducedMotion = followsPreference ? preference?.matches ?? false : options.reducedMotion === true;
  let playing = false, disposed = false, width = 0, height = 0;
  const playhead = { value: 0 };
  let timeline: gsap.core.Timeline | undefined, resizeObserver: ResizeObserver | undefined, themeObserver: MutationObserver | undefined;
  let dprQuery: MediaQueryList | undefined, watchedRatio = 0;
  let palette: WeaveSequenceColors, displayFont = '"STKaiti", "KaiTi", serif', monoFont = 'monospace';

  function state(): WeaveSequenceState {
    const time = playhead.value;
    return { time, duration: DURATION, progress: time / DURATION, phase: time < 0.85 ? 'lay' : time < 1.9 ? 'cross' : time < 3.3 ? 'weave' : 'rest', playing, reducedMotion, disposed };
  }
  function readPalette() {
    const styles = browser!.getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(`--ui-color-${name}`).trim() || fallback;
    palette = {
      accent: options.colors?.accent ?? token('accent', '#b08b3b'), secondary: options.colors?.secondary ?? token('secondary-accent', '#3f7168'),
      seal: options.colors?.seal ?? token('seal', '#9f342b'), ink: options.colors?.ink ?? token('ink', '#242c29'),
      paper: options.colors?.paper ?? token('paper', '#eee9dd'), metal: options.colors?.metal ?? token('metal', '#68746b'),
      text: options.colors?.text ?? token('text', '#242c29'), border: options.colors?.border ?? token('border', '#838d81'),
    };
    displayFont = styles.getPropertyValue('--ui-font-family-display').trim() || '"STKaiti", "KaiTi", serif';
    monoFont = styles.getPropertyValue('--ui-font-family-mono').trim() || 'monospace';
  }
  function line(points: readonly Point[], color: string, alpha: number, thickness = 1) {
    context!.globalAlpha = clamp(alpha); context!.strokeStyle = color; context!.lineWidth = thickness; context!.beginPath();
    points.forEach(([x, y], index) => { if (index === 0) context!.moveTo(x, y); else context!.lineTo(x, y); }); context!.stroke();
  }
  function plane(alpha: number, color: string) {
    context!.fillStyle = color; context!.globalAlpha = clamp(alpha); context!.beginPath();
    [surface(0, 0), surface(1, 0), surface(1, 1), surface(0, 1)].forEach(([x, y], index) => { if (index === 0) context!.moveTo(x, y); else context!.lineTo(x, y); });
    context!.closePath(); context!.fill();
  }
  function dot(point: Point, color: string, alpha: number, radius: number) {
    context!.globalAlpha = clamp(alpha); context!.fillStyle = color; context!.beginPath(); context!.arc(point[0], point[1], radius, 0, TAU); context!.fill();
  }
  function draw() {
    if (disposed || !width || !height) return;
    context!.clearRect(0, 0, width, height); context!.save(); context!.translate(width / 2, height / 2);
    const unit = Math.min(width / 760, height / 440); context!.scale(unit, unit);
    const time = playhead.value, lay = out(time / 0.85), cross = smooth((time - 0.85) / 1.05), weave = smooth((time - 1.9) / 1.4), rest = smooth((time - 3.3) / 0.9);
    const tension = Math.sin(Math.PI * clamp((time - 0.45) / 2.8)) * amplitude;
    const quiet = mix(1, 0.36, rest);

    // Open datum rails leave the silk edges free; the image never closes into a stamp.
    for (const side of [-1, 1]) {
      line([[side * 346, -136], [side * 270, -136], [side * 254, -120]], palette.border, 0.36 * quiet, 0.8 / unit);
      line([[side * 346, 132], [side * 278, 132], [side * 260, 114]], palette.metal, 0.36 * quiet, 0.8 / unit);
      for (let tick = 0; tick < 5; tick++) line([[side * (278 + tick * 14), -142], [side * (278 + tick * 14), -136 + (tick % 2 ? 0 : 4)]], palette.secondary, 0.48 * quiet, 0.7 / unit);
      const shuttle = side * mix(326, 232, lay);
      line([[shuttle, -64], [shuttle + side * 8, -57], [shuttle + side * 8, 57], [shuttle, 64]], palette.secondary, 0.65 * quiet, 1.2 / unit);
    }

    context!.save(); context!.translate(0, -8);
    plane(lay * 0.65, palette.paper); plane(weave * 0.025, palette.secondary);
    for (let column = 0; column <= WARP; column++) {
      const u = column / WARP, reveal = out((time - column * 0.025) / 0.85);
      const points: Point[] = [];
      for (let part = 0; part <= 18; part++) {
        const v = part / 18 * reveal, [x, y] = surface(u, v);
        points.push([x + Math.sin(v * Math.PI) * Math.sin(column * 1.7 + time * 2.2) * 5 * tension, y]);
      }
      line(points, column % 4 === 0 ? palette.secondary : palette.ink, (column % 4 === 0 ? 0.64 : 0.35) * reveal, (column % 4 ? 0.7 : 1) / unit);
      const endpoint = surface(u, reveal);
      if (reveal > 0 && reveal < 1) dot(endpoint, palette.secondary, (1 - reveal) * 0.8, 1.8 / unit);
      // Fine dry filaments flank selected threads without making the weave dense.
      if (column % 3 === 0) line(points.map(([x, y]) => [x + 2.5, y + 0.5]), palette.ink, 0.1 * reveal, 0.55 / unit);
    }

    for (let row = 0; row <= WEFT; row++) {
      const v = row / WEFT, reveal = out((time - 0.8 - row * 0.058) / 1.12), forward = row % 2 === 0;
      const points: Point[] = [];
      for (let part = 0; part <= 24; part++) {
        const u = forward ? part / 24 * reveal : 1 - part / 24 * reveal, [x, y] = surface(u, v);
        points.push([x, y + Math.sin(u * Math.PI) * Math.sin(row * 1.3 + time * 2) * 4 * tension]);
      }
      const color = row % 4 === 1 ? palette.accent : row % 4 === 3 ? palette.secondary : palette.ink;
      line(points, color, reveal * (row % 2 ? 0.58 : 0.38), (row % 2 ? 1.05 : 0.75) / unit);
      for (let column = 0; column <= WARP; column++) {
        const u = column / WARP;
        if ((forward ? u : 1 - u) > reveal || reveal <= 0) continue;
        const point = surface(u, v), over = (row + column) % 2 === 0;
        const spread = weave * 4;
        // Alternate over/under bridges, revealing an actual woven topology at rest.
        const bridge: Point[] = over ? [[point[0] - spread, point[1] + spread * 26 / 360], [point[0] + spread, point[1] - spread * 26 / 360]] : [[point[0] - spread * 86 / 218, point[1] - spread], [point[0] + spread * 86 / 218, point[1] + spread]];
        line(bridge, palette.paper, weave * 0.95, 3.6 / unit);
        line(bridge, over ? color : column % 4 === 0 ? palette.secondary : palette.ink, weave * 0.72, (over ? 1.05 : 0.8) / unit);
        if (weave > 0 && column % 4 === 2 && row % 3 === 1) dot(point, row % 2 ? palette.accent : palette.secondary, weave * 0.72, 1.55 / unit);
      }
      if (reveal > 0 && reveal < 1) {
        const point = surface(forward ? reveal : 1 - reveal, v);
        dot(point, color, 0.22, 5 / unit); dot(point, color, 0.95, 1.9 / unit);
      }
    }

    // Light shuttles travel once and retire. They express construction, never a percentage.
    for (let shuttle = 0; shuttle < 6; shuttle++) {
      const travel = clamp((time - 1.45 - shuttle * 0.13) / 1.35), glow = Math.sin(Math.PI * travel);
      if (glow <= 0) continue;
      const v = (shuttle + 1) / 7, u = shuttle % 2 ? 1 - travel : travel, point = surface(u, v);
      const color = shuttle % 2 ? palette.secondary : palette.accent;
      line([[point[0] - 18 * (shuttle % 2 ? -1 : 1), point[1] + 1.3 * (shuttle % 2 ? -1 : 1)], point], color, glow * 0.32, 2 / unit);
      dot(point, color, glow * 0.14, 7 / unit); dot(point, color, glow, 2.2 / unit);
    }

    // Only two register cuts use vermilion. The plane itself remains ink and jade.
    for (const [u, v, direction] of [[0, 0, 1], [1, 1, -1]] as const) {
      const [x, y] = surface(u, v), lock = out((time - 2.65) / 0.55);
      line([[x - 8 * direction, y - 7 * direction], [x + 8 * direction * lock, y - 7 * direction]], palette.seal, lock, 2 / unit);
      line([[x - 8 * direction, y - 3 * direction], [x - 8 * direction, y + 6 * direction * lock]], palette.seal, lock, 1 / unit);
    }
    line([surface(0, 0), surface(0.25 * weave, 0)], palette.secondary, weave * 0.7, 1.3 / unit);
    line([surface(1, 1), surface(1 - 0.25 * weave, 1)], palette.accent, weave * 0.65, 1.3 / unit);
    context!.restore();

    context!.font = `500 58px ${displayFont}`; context!.textAlign = 'center'; context!.textBaseline = 'middle'; context!.fillStyle = palette.text;
    context!.globalAlpha = 0.18 + lay * 0.82;
    context!.fillText('经', -295, -5 + (1 - lay) * 10); context!.fillText('纬', 295, -5 - (1 - lay) * 10);
    line([[-294, 42], [-294, 50], [-280, 50]], palette.seal, cross * 0.6, 1 / unit);
    line([[294, -48], [294, -56], [280, -56]], palette.secondary, cross * 0.7, 1 / unit);
    context!.font = `10px ${monoFont}`; context!.fillStyle = palette.metal; context!.globalAlpha = weave * 0.8;
    context!.fillText('W A R P   /   W E F T', 0, 159);
    line([[-160, 159], [-95, 159]], palette.border, weave * 0.35, 0.8 / unit);
    line([[95, 159], [160, 159]], palette.border, weave * 0.35, 0.8 / unit);
    context!.restore(); context!.globalAlpha = 1;
  }
  function render() { if (!disposed) { draw(); options.onUpdate?.(state()); } }
  function dprChanged() { if (!disposed) resize(); }
  function watchRatio() {
    const next = browser!.devicePixelRatio || 1;
    if (next === watchedRatio) return;
    dprQuery?.removeEventListener('change', dprChanged); watchedRatio = next;
    dprQuery = browser!.matchMedia?.(`(resolution: ${next}dppx)`); dprQuery?.addEventListener('change', dprChanged);
  }
  function resize() {
    if (disposed) return;
    const box = canvas.getBoundingClientRect(); width = Math.max(0, box.width); height = Math.max(0, box.height);
    const ratio = Math.min(browser!.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    watchRatio(); render();
  }
  function pause() { if (!disposed) { playing = false; timeline?.pause(); render(); } }
  function seek(seconds: number) {
    if (disposed) return;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > DURATION) throw new RangeError(`seek time must be a finite number from 0 to ${DURATION}.`);
    if (seconds === DURATION) { playing = false; timeline!.pause(seconds, true); } else timeline!.time(seconds, true);
    render();
  }
  function play() {
    if (disposed) return;
    if (reducedMotion) { playing = false; timeline!.pause(DURATION, true); render(); return; }
    if (document.hidden) { pause(); return; }
    if (playhead.value >= DURATION) timeline!.time(0, true);
    playing = true; timeline!.play(); render();
  }
  function replay() { if (!disposed) { timeline!.pause(0, true); play(); } }
  function preferenceChanged(event: MediaQueryListEvent) { reducedMotion = event.matches; if (reducedMotion) { playing = false; timeline!.pause(DURATION, true); } render(); }
  function visibilityChanged() { if (document.hidden && playing) pause(); }
  function pageHidden(event: PageTransitionEvent) { if (event.persisted) pause(); else dispose(); }
  function pageShown(event: PageTransitionEvent) { if (event.persisted && !disposed) resize(); }
  function themeChanged() { if (!disposed) { readPalette(); render(); } }
  function dispose() {
    if (disposed) return;
    disposed = true; playing = false; timeline?.kill(); resizeObserver?.disconnect(); themeObserver?.disconnect();
    browser!.removeEventListener('resize', resize); browser!.removeEventListener('pagehide', pageHidden); browser!.removeEventListener('pageshow', pageShown);
    document.removeEventListener('visibilitychange', visibilityChanged); document.fonts?.removeEventListener('loadingdone', themeChanged);
    if (followsPreference) preference?.removeEventListener('change', preferenceChanged);
    dprQuery?.removeEventListener('change', dprChanged);
  }
  try {
    readPalette();
    timeline = gsap.timeline({ paused: true, onUpdate: render, onComplete: () => { playing = false; render(); } });
    timeline.to(playhead, { value: DURATION, duration: DURATION, ease: 'none' }, 0);
    timeline.addLabel('lay', 0).addLabel('cross', 0.85).addLabel('weave', 1.9).addLabel('rest', 3.3); timeline.timeScale(speed);
    if (reducedMotion) timeline.pause(DURATION, true);
    resizeObserver = typeof browser.ResizeObserver === 'function' ? new browser.ResizeObserver(resize) : undefined;
    themeObserver = typeof browser.MutationObserver === 'function' ? new browser.MutationObserver(themeChanged) : undefined;
    resizeObserver?.observe(canvas);
    for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement) themeObserver?.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'data-ui-theme', 'data-ui-palette'] });
    browser.addEventListener('resize', resize); browser.addEventListener('pagehide', pageHidden); browser.addEventListener('pageshow', pageShown);
    document.addEventListener('visibilitychange', visibilityChanged); document.fonts?.addEventListener('loadingdone', themeChanged);
    if (followsPreference) preference?.addEventListener('change', preferenceChanged);
    resize();
  } catch (error) { dispose(); throw error; }
  return { get duration() { return DURATION; }, get state() { return state(); }, play, pause, seek, replay, dispose };
}
