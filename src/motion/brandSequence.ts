import { gsap } from 'gsap';

const DURATION = 4.8;
const WORDMARK = 'MALANG UI';
const TAU = Math.PI * 2;

export type BrandSequencePhase = 'gather' | 'carve' | 'reveal' | 'rest';
export interface BrandSequenceColors {
  accent: string;
  secondary: string;
  ink: string;
  paper: string;
  metal: string;
  text: string;
  border: string;
}
export interface BrandSequenceState {
  readonly time: number;
  readonly duration: number;
  readonly progress: number;
  readonly phase: BrandSequencePhase;
  readonly playing: boolean;
  readonly reducedMotion: boolean;
  readonly disposed: boolean;
}
export interface BrandSequenceOptions {
  reducedMotion?: boolean | 'system';
  /** Rail travel and separated ink fragments, from 0.6 to 1.8. */
  amplitude?: number;
  /** Positive playback multiplier. Timeline positions remain seconds. */
  speed?: number;
  colors?: Partial<BrandSequenceColors>;
  onUpdate?: (state: BrandSequenceState) => void;
}
export interface BrandSequenceController {
  readonly duration: number;
  readonly state: BrandSequenceState;
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

/** A finite original MaLang identity study. Importing this module does not touch the DOM. */
export function createBrandSequence(canvas: HTMLCanvasElement, options: BrandSequenceOptions = {}): BrandSequenceController {
  // Reject invalid options before acquiring textures, timelines or subscriptions.
  const amplitude = options.amplitude ?? 1, speed = options.speed ?? 1;
  if (!Number.isFinite(amplitude) || amplitude < 0.6 || amplitude > 1.8) throw new RangeError('amplitude must be a finite number from 0.6 to 1.8.');
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('speed must be a positive finite number.');
  if (options.reducedMotion !== undefined && options.reducedMotion !== 'system' && typeof options.reducedMotion !== 'boolean') throw new TypeError('reducedMotion must be a boolean or system.');
  if (options.onUpdate !== undefined && typeof options.onUpdate !== 'function') throw new TypeError('onUpdate must be a function.');
  for (const value of Object.values(options.colors ?? {})) if (typeof value !== 'string' || !value.trim()) throw new TypeError('colors must contain non-empty CSS color strings.');
  const document = canvas?.ownerDocument;
  const browser = document?.defaultView;
  const context = typeof canvas?.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!browser || !context) throw new Error('BrandSequence requires a browser canvas with a 2D context.');
  for (const value of Object.values(options.colors ?? {})) if (browser.CSS?.supports && !browser.CSS.supports('color', value)) throw new TypeError('colors must contain valid CSS colors.');

  const preference = browser.matchMedia?.('(prefers-reduced-motion: reduce)');
  const followsPreference = options.reducedMotion === undefined || options.reducedMotion === 'system';
  let reducedMotion = followsPreference ? preference?.matches ?? false : options.reducedMotion === true;
  let width = 0, height = 0, playing = false, disposed = false;
  const playhead = { value: 0 };
  let timeline: gsap.core.Timeline | undefined;
  let palette: BrandSequenceColors;
  let fontFamily = 'sans-serif';
  let wordFont = '650 60px sans-serif', wordWidth = 0;
  const letters: { character: string; x: number }[] = [];
  let dprQuery: MediaQueryList | undefined, watchedRatio = 0;
  let resizeObserver: ResizeObserver | undefined, themeObserver: MutationObserver | undefined;
  const monogram = document.createElement('canvas');
  monogram.width = 1024; monogram.height = 640;
  const pigment = monogram.getContext('2d');
  if (!pigment) throw new Error('BrandSequence requires an offscreen 2D canvas.');

  function state(): BrandSequenceState {
    const time = playhead.value;
    return { time, duration: DURATION, progress: time / DURATION, phase: time < 0.9 ? 'gather' : time < 2.1 ? 'carve' : time < 3.85 ? 'reveal' : 'rest', playing, reducedMotion, disposed };
  }
  function polygon(points: readonly number[], color: string, alpha = 1) {
    context!.globalAlpha = clamp(alpha); context!.fillStyle = color; context!.beginPath();
    for (let index = 0; index < points.length; index += 2) { if (index === 0) context!.moveTo(points[index]!, points[index + 1]!); else context!.lineTo(points[index]!, points[index + 1]!); }
    context!.closePath(); context!.fill();
  }
  function line(points: readonly number[], color: string, alpha: number, thickness = 1) {
    context!.globalAlpha = clamp(alpha); context!.strokeStyle = color; context!.lineWidth = thickness; context!.beginPath();
    for (let index = 0; index < points.length; index += 2) { if (index === 0) context!.moveTo(points[index]!, points[index + 1]!); else context!.lineTo(points[index]!, points[index + 1]!); }
    context!.stroke();
  }
  function readPalette() {
    const styles = browser!.getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(`--ui-color-${name}`).trim() || fallback;
    palette = {
      accent: options.colors?.accent ?? token('accent', '#9f342b'), secondary: options.colors?.secondary ?? token('secondary-accent', '#3f7168'),
      ink: options.colors?.ink ?? token('ink', '#242c29'), paper: options.colors?.paper ?? token('paper', '#eee9dd'),
      metal: options.colors?.metal ?? token('metal', '#68746b'), text: options.colors?.text ?? token('text', '#242c29'), border: options.colors?.border ?? token('border', '#838d81'),
    };
    fontFamily = styles.getPropertyValue('--ui-font-family').trim() || 'sans-serif';
    wordFont = `650 60px ${fontFamily}`; context!.font = wordFont;
    letters.length = 0; wordWidth = 0;
    for (const character of WORDMARK) { letters.push({ character, x: wordWidth }); wordWidth += context!.measureText(character).width + 6; }
    wordWidth -= 6;

    // Three asymmetric ribbons form a dry-brush M, independent of any font or seal.
    pigment!.setTransform(2, 0, 0, 2, 512, 320); pigment!.clearRect(-256, -160, 512, 320); pigment!.save();
    const ribbon = (points: number[]) => {
      pigment!.beginPath(); points.forEach((value, index) => { if (index % 2 === 0) { if (index === 0) pigment!.moveTo(value, points[index + 1]!); else pigment!.lineTo(value, points[index + 1]!); } });
      pigment!.closePath(); pigment!.fill();
    };
    pigment!.fillStyle = palette.ink;
    ribbon([-113, 68, -78, -102, -48, -85, -75, 66, -91, 71]);
    ribbon([-78, -102, -44, -84, 0, -25, 44, -84, 78, -102, 12, 25, -12, 25]);
    ribbon([48, -85, 78, -102, 113, 68, 91, 71, 75, 66]);
    pigment!.globalCompositeOperation = 'destination-out';
    // Repeatable pigment gaps keep manual seeks visually stable.
    for (let index = 0; index < 380; index++) {
      const x = (random(index + 1) - 0.5) * 230, y = (random(index + 401) - 0.5) * 185 - 12;
      pigment!.globalAlpha = 0.25 + random(index + 801) * 0.65;
      pigment!.beginPath(); pigment!.ellipse(x, y, 0.25 + random(index + 1201) * 1.1, 0.25 + random(index + 1601) * 0.55, -0.35, 0, TAU); pigment!.fill();
    }
    pigment!.globalAlpha = 0.75; pigment!.lineWidth = 0.65;
    for (let index = 0; index < 28; index++) {
      const x = (random(index + 2001) - 0.5) * 210, y = (random(index + 2101) - 0.5) * 140;
      pigment!.beginPath(); pigment!.moveTo(x, y); pigment!.lineTo(x + 2 + random(index + 2201) * 9, y - 12 - random(index + 2301) * 24); pigment!.stroke();
    }
    // A deliberate diagonal void becomes the vermilion joint, not an enclosing stamp.
    pigment!.globalAlpha = 1; ribbon([-125, 29, 122, -14, 123, -7, -125, 36]);
    pigment!.restore();
  }
  function draw() {
    if (disposed || !width || !height) return;
    context!.clearRect(0, 0, width, height); context!.save(); context!.translate(width / 2, height / 2);
    const unit = Math.min(width / 760, height / 430);
    context!.scale(unit, unit);
    const time = playhead.value, gather = out(time / 0.9), carve = smooth((time - 0.9) / 1.2), reveal = smooth((time - 2.1) / 1.75), rest = smooth((time - 3.85) / 0.95);
    const strike = Math.sin(Math.PI * clamp((time - 2.04) / 0.68)), orbit = 1 - smooth((time - 2.3) / 1.1);
    const quiet = mix(1, 0.32, rest);

    // Interrupted datum rails travel towards the mark instead of circling it.
    for (const side of [-1, 1]) {
      const x = side * mix(338, 150, gather);
      line([side * 338, -45, side * 238, -45, side * 218, -65, side * 164, -65], palette.border, 0.26 * quiet, 0.85 / unit);
      line([side * 338, 25, side * 252, 25, side * 231, 46, side * 164, 46], palette.secondary, 0.32 * quiet, 0.85 / unit);
      for (let tick = 0; tick < 6; tick++) line([side * (240 + tick * 16), -53, side * (240 + tick * 16), tick % 2 ? -49 : -44], palette.metal, 0.32 * quiet, 0.7 / unit);
      const shift = (1 - carve) * 12 * amplitude;
      line([x, -96 - shift, x - side * 19, -96 - shift, x - side * 19, -70 - shift], palette.secondary, mix(0.45, 0.8, gather) * quiet, 1.8 / unit);
      line([x, 73 + shift, x - side * 19, 73 + shift, x - side * 19, 47 + shift], palette.metal, 0.62 * quiet, 1 / unit);
      polygon([x - side * 6, -19, x + side * 5, -12, x + side * 5, 13, x - side * 6, 20], palette.paper, gather * quiet);
      polygon([x - side * 5, -16, x + side * 2, -10, x + side * 2, 11, x - side * 5, 17], palette.secondary, 0.6 * gather * quiet);
    }

    context!.save(); context!.translate(0, -40);
    if (orbit > 0) {
      for (let index = 0; index < 12; index++) {
        const angle = index / 12 * TAU + 0.2, distance = mix(210, 123, gather) + (1 - carve) * (index % 3) * 9 * amplitude;
        const x = Math.cos(angle) * distance, y = Math.sin(angle) * distance * 0.64;
        line([x, y, x + Math.cos(angle) * 11, y + Math.sin(angle) * 11], index % 4 ? palette.ink : palette.accent, (0.18 + carve * 0.25) * orbit, (index % 3 ? 0.7 : 1.3) / unit);
      }
    }
    for (let slice = 0; slice < 3; slice++) {
      const local = out((time - 0.82 - slice * 0.16) / 1.12);
      const movement = (1 - local) * amplitude;
      context!.save(); context!.translate((slice - 1) * 36 * movement, (slice % 2 ? -1 : 1) * 22 * movement); context!.rotate((slice - 1) * movement * 0.055);
      context!.beginPath(); context!.rect(-126 + slice * 84, -128, 84, 220 * local); context!.clip();
      context!.globalAlpha = local; context!.drawImage(monogram, -256, -160, 512, 320); context!.restore();
    }
    if (time > 1.6) {
      const joint = out((time - 1.6) / 0.72);
      line([-109, 29, mix(-109, -26, joint), mix(29, 14.5, joint)], palette.accent, joint, 3 / unit);
      line([20, 7, mix(20, 107, joint), mix(7, -8, joint)], palette.accent, joint, 3 / unit);
      const anchor = 121 + strike * 9 * amplitude;
      for (const side of [-1, 1]) line([side * anchor, -18, side * anchor, -5, side * (anchor - 9), 4], palette.accent, joint * (0.65 - rest * 0.28), 1 / unit);
    }
    if (strike > 0) {
      for (let index = 0; index < 18; index++) {
        const side = index % 2 ? 1 : -1, step = clamp((time - 2.04) / 0.68), travel = out(step) * (25 + random(index + 2500) * 45) * amplitude;
        const x = side * (105 + travel), y = -8 + side * -travel * 0.17 + (random(index + 2600) - 0.5) * 18;
        line([x, y, x + side * (3 + random(index + 2700) * 8), y - side * 1.5], index % 5 ? palette.accent : palette.secondary, strike * 0.58, 0.8 / unit);
      }
    }
    context!.restore();

    // Letter-by-letter arrival ends in an unmasked, legible wordmark.
    context!.font = wordFont; context!.textBaseline = 'alphabetic'; context!.textAlign = 'left';
    const fit = Math.min(1, 510 / Math.max(1, wordWidth));
    context!.save(); context!.scale(fit, fit);
    for (let index = 0; index < letters.length; index++) {
      const letter = letters[index]!, arrival = out((time - 2.12 - index * 0.075) / 0.72);
      context!.globalAlpha = arrival; context!.fillStyle = index > 6 ? palette.accent : palette.text;
      context!.fillText(letter.character, letter.x - wordWidth / 2, (122 + (1 - arrival) * 16) / fit);
    }
    context!.restore();
    line([-214, 147, -65, 147], palette.metal, reveal * 0.32, 0.8 / unit);
    line([65, 147, 214, 147], palette.metal, reveal * 0.32, 0.8 / unit);
    line([-22, 147, -4, 147], palette.accent, reveal * 0.8, 1.5 / unit);
    line([4, 147, 22, 147], palette.secondary, reveal * 0.8, 1.5 / unit);
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
    monogram.width = monogram.height = 0; letters.length = 0;
  }
  try {
    readPalette();
    timeline = gsap.timeline({ paused: true, onUpdate: render, onComplete: () => { playing = false; render(); } });
    timeline.to(playhead, { value: DURATION, duration: DURATION, ease: 'none' }, 0);
    timeline.addLabel('gather', 0).addLabel('carve', 0.9).addLabel('reveal', 2.1).addLabel('rest', 3.85); timeline.timeScale(speed);
    if (reducedMotion) timeline.pause(DURATION, true);
    resizeObserver = typeof browser.ResizeObserver === 'function' ? new browser.ResizeObserver(resize) : undefined;
    themeObserver = typeof browser.MutationObserver === 'function' ? new browser.MutationObserver(themeChanged) : undefined;
    resizeObserver?.observe(canvas);
    for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement) themeObserver?.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'data-ui-theme'] });
    browser.addEventListener('resize', resize); browser.addEventListener('pagehide', pageHidden); browser.addEventListener('pageshow', pageShown);
    document.addEventListener('visibilitychange', visibilityChanged); document.fonts?.addEventListener('loadingdone', themeChanged);
    if (followsPreference) preference?.addEventListener('change', preferenceChanged);
    resize();
  } catch (error) { dispose(); throw error; }
  return { get duration() { return DURATION; }, get state() { return state(); }, play, pause, seek, replay, dispose };
}
