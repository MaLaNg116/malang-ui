import { gsap } from 'gsap';

const DURATION = 2.8;
const STATIC_TIME = 1.4;
type Point = readonly [number, number];

export type WaitingSequencePhase = 'outbound' | 'exchange' | 'return' | 'rejoin';
export interface WaitingSequenceColors {
  accent: string;
  secondary: string;
  ink: string;
  paper: string;
  metal: string;
  text: string;
  border: string;
  onAccent: string;
}
export interface WaitingSequenceState {
  readonly time: number;
  readonly duration: number;
  /** Position within the animation cycle, not application progress. */
  readonly progress: number;
  readonly phase: WaitingSequencePhase;
  /** Natural returns to the beginning; manual replay starts a new run at zero. */
  readonly cycle: number;
  readonly playing: boolean;
  readonly reducedMotion: boolean;
  readonly disposed: boolean;
}
export interface WaitingSequenceOptions {
  loop?: boolean;
  speed?: number;
  /** Track separation and pigment trail strength, from 0.6 to 1.8. */
  amplitude?: number;
  reducedMotion?: boolean | 'system';
  colors?: Partial<WaitingSequenceColors>;
  onUpdate?: (state: WaitingSequenceState) => void;
}
export interface WaitingSequenceController {
  readonly duration: number;
  readonly state: WaitingSequenceState;
  play(): void;
  pause(): void;
  /** Seeking pauses the animation, including the exact cycle endpoint. */
  seek(seconds: number): void;
  replay(): void;
  dispose(): void;
}

const fraction = (value: number) => ((value % 1) + 1) % 1;
function track(halfWidth: number, halfHeight: number, cut: number): Point[] {
  return [[-halfWidth + cut, -halfHeight], [halfWidth - cut, -halfHeight], [halfWidth, -halfHeight + cut], [halfWidth, halfHeight - cut], [halfWidth - cut, halfHeight], [-halfWidth + cut, halfHeight], [-halfWidth, halfHeight - cut], [-halfWidth, -halfHeight + cut]];
}
function pointOnTrack(points: readonly Point[], position: number) {
  const lengths = points.map((point, index) => { const next = points[(index + 1) % points.length]!; return Math.hypot(next[0] - point[0], next[1] - point[1]); });
  let remaining = fraction(position) * lengths.reduce((sum, length) => sum + length, 0);
  for (let index = 0; index < points.length; index++) {
    if (remaining > lengths[index]!) { remaining -= lengths[index]!; continue; }
    const point = points[index]!, next = points[(index + 1) % points.length]!;
    const amount = remaining / lengths[index]!;
    return { x: point[0] + (next[0] - point[0]) * amount, y: point[1] + (next[1] - point[1]) * amount, angle: Math.atan2(next[1] - point[1], next[0] - point[0]) };
  }
  return { x: points[0]![0], y: points[0]![1], angle: 0 };
}

/** Original circulating mechanical rails. Importing this module does not access a DOM. */
export function createWaitingSequence(canvas: HTMLCanvasElement, options: WaitingSequenceOptions = {}): WaitingSequenceController {
  const document = canvas.ownerDocument;
  const browser = document.defaultView;
  const context = canvas.getContext('2d');
  if (!browser || !context) throw new Error('WaitingSequence requires a browser canvas with a 2D context.');
  const amplitude = options.amplitude ?? 1, speed = options.speed ?? 1, loop = options.loop ?? true;
  if (!Number.isFinite(amplitude) || amplitude < .6 || amplitude > 1.8) throw new RangeError('amplitude must be a finite number from 0.6 to 1.8.');
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('speed must be a positive finite number.');

  const preference = browser.matchMedia?.('(prefers-reduced-motion: reduce)');
  const followsPreference = options.reducedMotion === undefined || options.reducedMotion === 'system';
  let reducedMotion = followsPreference ? preference?.matches ?? false : options.reducedMotion === true;
  let width = 0, height = 0, playing = false, disposed = false, cycle = 0;
  const playhead = { value: 0 };
  let timeline: gsap.core.Timeline | undefined;
  let palette: WaitingSequenceColors;
  let fontFamily = '"STKaiti", "KaiTi", serif';
  let dprQuery: MediaQueryList | undefined; let watchedRatio = 0;
  const outer = track(244, 58 + amplitude * 7, 34);
  const inner = track(214, 30 + amplitude * 5, 24);

  function state(): WaitingSequenceState {
    const time = Math.max(0, Math.min(DURATION, playhead.value));
    return { time, duration: DURATION, progress: time / DURATION, phase: time < .7 ? 'outbound' : time < 1.4 ? 'exchange' : time < 2.1 ? 'return' : 'rejoin', cycle, playing, reducedMotion, disposed };
  }
  function readPalette() {
    const styles = browser!.getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(`--ui-color-${name}`).trim() || fallback;
    fontFamily = styles.getPropertyValue('--ui-font-family-display').trim() || '"STKaiti", "KaiTi", serif';
    palette = {
      accent: options.colors?.accent ?? token('accent', '#9f342b'), secondary: options.colors?.secondary ?? token('secondary-accent', '#3f7168'),
      ink: options.colors?.ink ?? token('ink', '#242c29'), paper: options.colors?.paper ?? token('paper', '#eee9dd'),
      metal: options.colors?.metal ?? token('metal', '#68746b'), text: options.colors?.text ?? token('text', '#242c29'),
      border: options.colors?.border ?? token('border', '#838d81'), onAccent: options.colors?.onAccent ?? token('on-accent', '#fff8e7'),
    };
  }
  function line(points: readonly Point[], color: string, alpha: number, thickness = 1, closed = false) {
    context!.globalAlpha = Math.max(0, Math.min(1, alpha)); context!.strokeStyle = color; context!.lineWidth = thickness;
    context!.beginPath(); points.forEach((point, index) => index ? context!.lineTo(point[0], point[1]) : context!.moveTo(point[0], point[1]));
    if (closed) context!.closePath(); context!.stroke();
  }
  function carriage(points: readonly Point[], position: number, color: string, direction: 1 | -1, unit: number) {
    for (let index = 18; index > 0; index--) {
      const from = pointOnTrack(points, position - direction * index * .0045), to = pointOnTrack(points, position - direction * (index - 1) * .0045);
      line([[from.x, from.y], [to.x, to.y]], color, (1 - index / 20) * .6, (1.8 + amplitude) / unit);
    }
    const point = pointOnTrack(points, position);
    context!.save(); context!.translate(point.x, point.y); context!.rotate(point.angle + (direction < 0 ? Math.PI : 0));
    context!.globalAlpha = 1; context!.fillStyle = palette.paper;
    const profile: Point[] = [[-10, -7], [5, -7], [12, 0], [5, 7], [-10, 7]];
    context!.beginPath(); profile.forEach((vertex, index) => index ? context!.lineTo(vertex[0], vertex[1]) : context!.moveTo(vertex[0], vertex[1])); context!.closePath(); context!.fill();
    context!.strokeStyle = color; context!.lineWidth = 1.2 / unit; context!.stroke();
    line([[-6, -4], [-6, 4]], color, .9, 2 / unit);
    line([[1, -3], [4, 0], [1, 3]], color, .85, 1 / unit);
    context!.restore();
  }
  function draw() {
    if (disposed || !width || !height) return;
    context!.clearRect(0, 0, width, height); context!.save(); context!.translate(width / 2, height / 2);
    const unit = Math.min(width / 640, height / 300); context!.scale(unit, unit);
    const position = playhead.value / DURATION;
    line([[-282, -108], [-282, -122], [-252, -122]], palette.metal, .7, 1 / unit);
    line([[282, 108], [282, 122], [252, 122]], palette.metal, .7, 1 / unit);
    line([[-282, 108], [-282, 122], [-252, 122]], palette.border, .4, 1 / unit);
    line([[282, -108], [282, -122], [252, -122]], palette.border, .4, 1 / unit);
    line(outer, palette.ink, .14, 5 / unit, true); line(outer, palette.metal, .55, .8 / unit, true);
    line(inner, palette.ink, .09, 4 / unit, true); line(inner, palette.metal, .35, .8 / unit, true);
    for (const side of [-1, 1]) {
      for (let tick = 0; tick < 9; tick++) {
        const x = -156 + tick * 39;
        line([[x, side * 84], [x, side * (tick % 2 ? 89 : 94)]], palette.metal, .38, .8 / unit);
      }
      line([[side * 256, -16], [side * 270, -16], [side * 270, 16], [side * 256, 16]], palette.secondary, .65, 1 / unit);
      line([[side * 250, -5], [side * 258, 0], [side * 250, 5]], palette.metal, .7, 1 / unit);
    }
    carriage(outer, position, palette.accent, 1, unit);
    carriage(inner, .5 - position, palette.secondary, -1, unit);
    // Persistent flow arrows make a paused or reduced-motion frame read as processing.
    for (const side of [-1, 1]) {
      line([[-32, side * 65], [-26, side * 65 - side * 4], [-32, side * 65 - side * 8]], palette.accent, .55, 1 / unit);
      line([[32, side * 35], [26, side * 35 + side * 4], [32, side * 35 + side * 8]], palette.secondary, .55, 1 / unit);
    }
    context!.globalAlpha = .84; context!.fillStyle = palette.text; context!.textAlign = 'center'; context!.textBaseline = 'middle';
    context!.font = `500 42px ${fontFamily}`; context!.fillText('候', 0, -6);
    context!.font = '9px ui-monospace, monospace'; context!.globalAlpha = .62; context!.fillText('PROCESSING', 0, 23);
    context!.font = '9px ui-monospace, monospace'; context!.textAlign = 'left'; context!.globalAlpha = .6; context!.fillStyle = palette.metal;
    context!.fillText('01 / OUTBOUND', -238, -108); context!.textAlign = 'right'; context!.fillText('02 / RETURN', 238, 110);
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
    playing = false; timeline!.pause(seconds, true); render();
  }
  function play() {
    if (disposed) return;
    if (reducedMotion) { playing = false; timeline!.pause(STATIC_TIME, true); render(); return; }
    if (document.hidden) { pause(); return; }
    if (playhead.value >= DURATION) { cycle = 0; timeline!.pause(0, true); }
    playing = true; timeline!.play(); render();
  }
  function replay() { if (!disposed) { cycle = 0; timeline!.pause(0, true); play(); } }
  function complete() {
    if (disposed) return;
    if (loop && playing && !reducedMotion && !document.hidden) { cycle++; timeline!.restart(); render(); }
    else { playing = false; render(); }
  }
  function preferenceChanged(event: MediaQueryListEvent) {
    reducedMotion = event.matches;
    if (reducedMotion) { playing = false; timeline!.pause(STATIC_TIME, true); }
    render();
  }
  function visibilityChanged() { if (document.hidden && playing) pause(); }
  function pageHidden(event: PageTransitionEvent) { if (event.persisted) pause(); else dispose(); }
  function pageShown(event: PageTransitionEvent) { if (event.persisted && !disposed) resize(); }
  function themeChanged() { if (!disposed) { readPalette(); render(); } }
  const resizeObserver = typeof browser.ResizeObserver === 'function' ? new browser.ResizeObserver(resize) : undefined;
  const themeObserver = typeof browser.MutationObserver === 'function' ? new browser.MutationObserver(themeChanged) : undefined;
  function dispose() {
    if (disposed) return;
    disposed = true; playing = false; timeline?.kill(); resizeObserver?.disconnect(); themeObserver?.disconnect();
    browser!.removeEventListener('resize', resize); browser!.removeEventListener('pagehide', pageHidden); browser!.removeEventListener('pageshow', pageShown);
    document.removeEventListener('visibilitychange', visibilityChanged); document.fonts?.removeEventListener('loadingdone', themeChanged);
    if (followsPreference) preference?.removeEventListener('change', preferenceChanged);
    dprQuery?.removeEventListener('change', dprChanged); options.onUpdate?.(state());
  }
  readPalette();
  timeline = gsap.timeline({ paused: true, onUpdate: render, onComplete: complete });
  timeline.to(playhead, { value: DURATION, duration: DURATION, ease: 'none' });
  timeline.addLabel('outbound', 0).addLabel('exchange', .7).addLabel('return', 1.4).addLabel('rejoin', 2.1).timeScale(speed);
  if (reducedMotion) timeline.pause(STATIC_TIME, true);
  resizeObserver?.observe(canvas);
  for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement) themeObserver?.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'data-ui-theme', 'data-ui-palette'] });
  browser.addEventListener('resize', resize); browser.addEventListener('pagehide', pageHidden); browser.addEventListener('pageshow', pageShown);
  document.addEventListener('visibilitychange', visibilityChanged); document.fonts?.addEventListener('loadingdone', themeChanged);
  if (followsPreference) preference?.addEventListener('change', preferenceChanged);
  void document.fonts?.ready.then(() => { if (!disposed) themeChanged(); });
  resize();
  return { get duration() { return DURATION; }, get state() { return state(); }, play, pause, seek, replay, dispose };
}
