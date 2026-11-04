import { gsap } from 'gsap';

const DURATION = 3.6;
const TAU = Math.PI * 2;

export type SealPhase = 'gather' | 'align' | 'stamp' | 'settle';
export interface SealPalette {
  accent: string;
  secondary: string;
  ink: string;
  paper: string;
  metal: string;
  text: string;
  border: string;
  onAccent: string;
}
export interface SealSequenceState {
  readonly time: number;
  readonly duration: number;
  readonly progress: number;
  readonly phase: SealPhase;
  readonly playing: boolean;
  readonly reducedMotion: boolean;
  readonly disposed: boolean;
}
export interface SealSequenceOptions {
  reducedMotion?: boolean | 'system';
  /** Rail separation and ink echoes, from 0.6 to 1.8. */
  amplitude?: number;
  /** Positive playback multiplier; seek positions remain seconds. */
  speed?: number;
  colors?: Partial<SealPalette>;
  onUpdate?: (state: SealSequenceState) => void;
}
export interface SealSequenceController {
  readonly duration: number;
  readonly state: SealSequenceState;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  replay(): void;
  dispose(): void;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const amount = clamp(value); return amount * amount * (3 - 2 * amount); };
const out = (value: number) => 1 - Math.pow(1 - clamp(value), 3);
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const random = (seed: number) => { const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };

/** An original mechanical seal impression, with no DOM access before creation. */
export function createSealSequence(canvas: HTMLCanvasElement, options: SealSequenceOptions = {}): SealSequenceController {
  const document = canvas.ownerDocument;
  const browser = document.defaultView;
  const context = canvas.getContext('2d');
  if (!browser || !context) throw new Error('SealSequence requires a browser canvas with a 2D context.');
  const amplitude = options.amplitude ?? 1;
  const speed = options.speed ?? 1;
  if (!Number.isFinite(amplitude) || amplitude < 0.6 || amplitude > 1.8) throw new RangeError('amplitude must be a finite number from 0.6 to 1.8.');
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('speed must be a positive finite number.');

  const preference = browser.matchMedia?.('(prefers-reduced-motion: reduce)');
  const followsPreference = options.reducedMotion === undefined || options.reducedMotion === 'system';
  let reducedMotion = followsPreference ? preference?.matches ?? false : options.reducedMotion === true;
  let width = 0, height = 0, playing = false, disposed = false;
  const playhead = { value: 0 };
  let timeline: gsap.core.Timeline | undefined;
  let palette: SealPalette;
  let fontFamily = '"STKaiti", "KaiTi", serif';
  let dprQuery: MediaQueryList | undefined;
  let watchedRatio = 0;
  const impression = document.createElement('canvas');
  impression.width = impression.height = 512;
  const ink = impression.getContext('2d');
  if (!ink) throw new Error('SealSequence requires an offscreen 2D canvas.');

  function state(): SealSequenceState {
    const time = playhead.value;
    return { time, duration: DURATION, progress: time / DURATION, phase: time < 0.8 ? 'gather' : time < 1.65 ? 'align' : time < 2.6 ? 'stamp' : 'settle', playing, reducedMotion, disposed };
  }
  function readPalette() {
    const styles = browser!.getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(`--ui-color-${name}`).trim() || fallback;
    fontFamily = styles.getPropertyValue('--ui-font-family-display').trim() || '"STKaiti", "KaiTi", serif';
    palette = {
      accent: options.colors?.accent ?? token('seal', token('accent', '#9f342b')), secondary: options.colors?.secondary ?? token('secondary-accent', '#3f7168'),
      ink: options.colors?.ink ?? token('ink', '#242c29'), paper: options.colors?.paper ?? token('paper', '#eee9dd'),
      metal: options.colors?.metal ?? token('metal', '#68746b'), text: options.colors?.text ?? token('text', '#242c29'),
      border: options.colors?.border ?? token('border', '#838d81'), onAccent: options.colors?.onAccent ?? token('on-accent', '#fff8e7'),
    };
    ink!.setTransform(2, 0, 0, 2, 0, 0); ink!.clearRect(0, 0, 256, 256); ink!.save(); ink!.translate(128, 128);
    const outline = (inset: number) => {
      const edge = 104 - inset, cut = 12;
      ink!.beginPath(); ink!.moveTo(-edge + cut, -edge); ink!.lineTo(edge, -edge); ink!.lineTo(edge, edge - cut); ink!.lineTo(edge - cut, edge); ink!.lineTo(-edge, edge); ink!.lineTo(-edge, -edge + cut); ink!.closePath();
    };
    ink!.fillStyle = palette.accent; ink!.globalAlpha = 0.055; outline(0); ink!.fill(); ink!.globalAlpha = 1;
    ink!.strokeStyle = palette.accent; ink!.lineWidth = 4; outline(0); ink!.stroke(); ink!.lineWidth = 1.5; outline(9); ink!.stroke();
    ink!.textAlign = 'center'; ink!.textBaseline = 'middle'; ink!.font = `600 68px ${fontFamily}`;
    ink!.fillText('成', 0, -35); ink!.fillText('章', 0, 36);
    // Fixed pigment gaps add print texture without changing between seeks.
    ink!.globalCompositeOperation = 'destination-out';
    for (let index = 0; index < 130; index++) {
      ink!.beginPath(); ink!.arc((random(index + 1) - 0.5) * 212, (random(index + 131) - 0.5) * 212, 0.35 + random(index + 261) * 0.7, 0, TAU); ink!.fill();
    }
    ink!.restore();
  }
  function line(points: readonly number[], color: string, alpha: number, thickness = 1) {
    context!.globalAlpha = clamp(alpha); context!.strokeStyle = color; context!.lineWidth = thickness;
    context!.beginPath();
    for (let index = 0; index < points.length; index += 2) { if (index === 0) context!.moveTo(points[index]!, points[index + 1]!); else context!.lineTo(points[index]!, points[index + 1]!); }
    context!.stroke();
  }
  function draw() {
    if (disposed || !width || !height) return;
    context!.clearRect(0, 0, width, height); context!.save(); context!.translate(width / 2, height / 2);
    const unit = Math.min(width / 460, height / 350);
    context!.scale(unit, unit);
    const time = playhead.value, gather = smooth(time / 0.8), align = smooth((time - 0.8) / 0.85), drop = out((time - 1.65) / 0.4), settle = smooth((time - 2.6) / 1);
    const echo = clamp((time - 2.02) / 0.85), echoAlpha = Math.sin(Math.PI * echo);
    const pulse = Math.sin(Math.PI * clamp((time - 1.95) / 0.42));

    line([0, -140, 190, 0, 0, 140, -190, 0, 0, -140], palette.metal, 0.24, 0.8 / unit);
    line([0, -119, 161, 0, 0, 119, -161, 0, 0, -119], palette.metal, 0.10, 0.8 / unit);
    for (let axis = 0; axis < 4; axis++) {
      context!.save(); context!.rotate(axis * Math.PI / 2);
      const distance = mix(196, 88, gather) - align * 9 + settle * 26 + pulse * 5 * amplitude;
      line([212, 0, 116, 0], palette.metal, 0.38, 0.8 / unit);
      line([212, -7, 194, -7, 194, 7, 212, 7], palette.secondary, 0.58, 1 / unit);
      for (let tick = 0; tick < 6; tick++) line([125 + tick * 12, -4, 125 + tick * 12, tick % 2 ? 4 : 8], palette.metal, 0.36, 0.7 / unit);
      context!.translate(distance, 0);
      context!.globalAlpha = 0.76; context!.fillStyle = palette.paper; context!.beginPath(); context!.moveTo(0, -26); context!.lineTo(17, -16); context!.lineTo(17, 16); context!.lineTo(0, 26); context!.lineTo(-8, 18); context!.lineTo(-8, -18); context!.closePath(); context!.fill();
      context!.strokeStyle = palette.metal; context!.lineWidth = 1 / unit; context!.stroke();
      line([-5, -15, -5, 15], axis % 2 ? palette.secondary : palette.accent, 0.8, 2 / unit);
      line([5, -11, 10, -6, 10, 6, 5, 11], palette.metal, 0.58, 0.7 / unit);
      context!.restore();
    }

    // Dry, converging strokes leave the centre quiet before the die aligns.
    if (align < 1) {
      for (let index = 0; index < 16; index++) {
        const angle = (index / 16) * TAU + random(index + 21) * 0.22;
        const radius = mix(180 + random(index + 51) * 28, 82, gather) * (1 + (amplitude - 1) * 0.15);
        const length = 8 + random(index + 87) * 23;
        line([Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, Math.cos(angle) * (radius + length), Math.sin(angle) * (radius + length) * 0.72], index % 4 ? palette.ink : palette.accent, (0.14 + gather * 0.28) * (1 - align), (0.7 + random(index + 108) * 1.4) / unit);
      }
    }

    const dieVisible = smooth((time - 0.78) / 0.45);
    if (dieVisible > 0 && drop < 1) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const x = quarter % 2 ? 1 : -1, y = quarter > 1 ? 1 : -1;
        context!.save(); context!.translate(x * (1 - align) * 31 * amplitude, y * (1 - align) * 20 * amplitude - (1 - drop) * 12);
        context!.beginPath(); context!.rect(x < 0 ? -70 : 0, y < 0 ? -70 : 0, 70, 70); context!.clip();
        context!.globalAlpha = dieVisible * 0.2 * (1 - drop); context!.drawImage(impression, -76, -76, 152, 152); context!.restore();
      }
    }
    if (time >= 1.65) {
      const scale = mix(1.10, 1, drop) + pulse * 0.018;
      context!.save(); context!.translate(0, mix(-22, 0, drop)); context!.rotate(-Math.PI / 120 * drop); context!.scale(scale, scale);
      context!.globalAlpha = drop; context!.drawImage(impression, -76, -76, 152, 152); context!.restore();
    }

    if (echo > 0 && echo < 1) {
      const radius = 86 + out(echo) * 43 * amplitude;
      line([-radius + 12, -radius, radius, -radius, radius, radius - 12, radius - 12, radius, -radius, radius, -radius, -radius + 12], palette.accent, echoAlpha * 0.23, 0.8 / unit);
      for (let index = 0; index < 20; index++) {
        const angle = index / 20 * TAU + random(index + 320) * 0.15;
        const stretch = out(echo) * (15 + random(index + 350) * 26) * amplitude;
        const radius = 83 + stretch;
        line([Math.cos(angle) * radius, Math.sin(angle) * radius, Math.cos(angle) * (radius + 3 + index % 4), Math.sin(angle) * (radius + 3 + index % 4)], index % 4 ? palette.accent : palette.secondary, echoAlpha * 0.5, (index % 3 ? 0.9 : 1.4) / unit);
      }
    }
    if (drop > 0) {
      for (let index = 0; index < 30; index++) {
        const angle = random(index + 500) * TAU, radius = 75 + random(index + 550) * 10;
        context!.globalAlpha = drop * (0.15 + random(index + 600) * 0.18); context!.fillStyle = palette.accent;
        context!.beginPath(); context!.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, (0.35 + random(index + 650) * 0.65) / unit, 0, TAU); context!.fill();
      }
    }
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
  const resizeObserver = typeof browser.ResizeObserver === 'function' ? new browser.ResizeObserver(resize) : undefined;
  const themeObserver = typeof browser.MutationObserver === 'function' ? new browser.MutationObserver(themeChanged) : undefined;
  function dispose() {
    if (disposed) return;
    disposed = true; playing = false; timeline?.kill(); resizeObserver?.disconnect(); themeObserver?.disconnect();
    browser!.removeEventListener('resize', resize); browser!.removeEventListener('pagehide', pageHidden); browser!.removeEventListener('pageshow', pageShown);
    document.removeEventListener('visibilitychange', visibilityChanged); document.fonts?.removeEventListener('loadingdone', themeChanged);
    if (followsPreference) preference?.removeEventListener('change', preferenceChanged);
    dprQuery?.removeEventListener('change', dprChanged);
    impression.width = impression.height = 0;
  }
  readPalette();
  timeline = gsap.timeline({ paused: true, onUpdate: render, onComplete: () => { playing = false; render(); } });
  timeline.to(playhead, { value: DURATION, duration: DURATION, ease: 'none' }, 0);
  timeline.addLabel('gather', 0).addLabel('align', 0.8).addLabel('stamp', 1.65).addLabel('settle', 2.6); timeline.timeScale(speed);
  if (reducedMotion) timeline.pause(DURATION, true);
  resizeObserver?.observe(canvas);
  for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement) themeObserver?.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'data-ui-theme', 'data-ui-palette'] });
  browser.addEventListener('resize', resize); browser.addEventListener('pagehide', pageHidden); browser.addEventListener('pageshow', pageShown);
  document.addEventListener('visibilitychange', visibilityChanged); document.fonts?.addEventListener('loadingdone', themeChanged);
  if (followsPreference) preference?.addEventListener('change', preferenceChanged);
  resize();
  return { get duration() { return DURATION; }, get state() { return state(); }, play, pause, seek, replay, dispose };
}
