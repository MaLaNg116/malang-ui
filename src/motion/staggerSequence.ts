import { gsap } from 'gsap';

export type StaggerSequencePhase = 'idle' | 'enter' | 'settled';
export interface StaggerSequenceState {
  readonly time: number;
  readonly duration: number;
  readonly progress: number;
  readonly phase: StaggerSequencePhase;
  readonly playing: boolean;
  readonly reducedMotion: boolean;
  readonly disposed: boolean;
}
export interface StaggerSequenceOptions {
  reducedMotion?: boolean | 'system';
  /** Movement towards the resting position: up starts below, left starts right. */
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  /** Per-item duration in seconds; controller.duration includes all stagger gaps. */
  duration?: number;
  stagger?: number;
  speed?: number;
  onUpdate?: (state: StaggerSequenceState) => void;
}
export interface StaggerSequenceController {
  readonly duration: number;
  readonly state: StaggerSequenceState;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  replay(): void;
  dispose(): void;
}

const owners = new WeakMap<HTMLElement, symbol>();

/** Animate dedicated wrappers; this instance exclusively owns their transform/opacity. */
export function createStaggerSequence(targets: readonly HTMLElement[], options: StaggerSequenceOptions = {}): StaggerSequenceController {
  const elements = [...new Set(targets)];
  const direction = options.direction ?? 'up', distance = options.distance ?? 18;
  const itemDuration = options.duration ?? .42, stagger = options.stagger ?? .08, speed = options.speed ?? 1;
  if (!['up', 'down', 'left', 'right'].includes(direction)) throw new RangeError('direction must be up, down, left or right.');
  if (!Number.isFinite(distance) || distance < 0) throw new RangeError('distance must be a non-negative finite number.');
  if (!Number.isFinite(itemDuration) || itemDuration <= 0) throw new RangeError('duration must be a positive finite number.');
  if (!Number.isFinite(stagger) || stagger < 0) throw new RangeError('stagger must be a non-negative finite number.');
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('speed must be a positive finite number.');
  const duration = elements.length ? itemDuration + (elements.length - 1) * stagger : 0;
  if (!Number.isFinite(duration)) throw new RangeError('The total stagger duration must be finite.');
  const document = elements[0]?.ownerDocument;
  const browser = document?.defaultView;
  for (const element of elements) {
    if (!browser || element.ownerDocument !== document || !element.isConnected || !(element instanceof browser.HTMLElement)) throw new TypeError('Stagger targets must be connected HTMLElements in the same document.');
    if (owners.has(element)) throw new Error('This stagger wrapper already belongs to another sequence. Dispose its owner before binding it again.');
  }
  const owner = Symbol('stagger');
  const preference = browser?.matchMedia?.('(prefers-reduced-motion: reduce)');
  const followsPreference = options.reducedMotion === undefined || options.reducedMotion === 'system';
  let reducedMotion = followsPreference ? preference?.matches ?? false : options.reducedMotion === true;
  let time = 0, phase: StaggerSequencePhase = elements.length ? 'idle' : 'settled', playing = false, disposed = false;
  let timeline: gsap.core.Timeline | undefined;
  let baseline: { element: HTMLElement; properties: { name: string; value: string; priority: string }[] }[] = [];
  const context = gsap.context(() => {});
  const state = (): StaggerSequenceState => ({ time, duration, progress: duration ? time / duration : 1, phase, playing, reducedMotion, disposed });
  function notify() {
    // A user's callback may create another animation/controller. It is never
    // part of this instance's context, even when called by a GSAP callback.
    if (!disposed) context.ignore(() => options.onUpdate?.(state()));
  }
  function focused() {
    return elements.some(element => {
      const root = element.getRootNode() as Document | ShadowRoot;
      const active = root.activeElement ?? document?.activeElement;
      return Boolean(active && (active === element || element.contains(active)));
    });
  }
  function releaseAnimation() {
    timeline?.pause(); context.revert(); timeline = undefined;
    // CSSPlugin normalizes individual transforms and its style saver does not
    // retain !important priorities. Restore only the channels this wrapper owns.
    for (const snapshot of baseline) for (const property of snapshot.properties) {
      if (property.value) snapshot.element.style.setProperty(property.name, property.value, property.priority);
      else snapshot.element.style.removeProperty(property.name);
    }
    baseline = [];
  }
  function settle() {
    if (disposed) return;
    playing = false; time = duration; phase = 'settled'; releaseAnimation(); notify();
  }
  function staticOnly() { return reducedMotion || Boolean(document?.hidden) || focused(); }
  function build() {
    if (timeline || !elements.length || disposed) return;
    const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
    const offset = direction === 'up' || direction === 'left' ? distance : -distance;
    const relative = (value: number) => `${value < 0 ? '-=' : '+='}${Math.abs(value)}`;
    const opacity = elements.map(element => Number.parseFloat(browser!.getComputedStyle(element).opacity));
    baseline = elements.map(element => ({ element, properties: ['transform', 'transform-origin', 'translate', 'rotate', 'scale', 'opacity'].map(name => ({ name, value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) })) }));
    context.add(() => {
      // Preparing all wrappers together keeps later stagger slots at their start
      // position. GSAP saves their authored transforms before resolving offsets.
      gsap.set(elements, { [axis]: relative(offset), opacity: 0, parseTransform: true, overwrite: false });
      timeline = gsap.timeline({ paused: true,
        onUpdate: () => { if (!disposed && timeline) { time = Math.min(duration, timeline.time()); phase = 'enter'; notify(); } },
        onComplete: settle,
      });
      elements.forEach((element, index) => timeline!.to(element, { [axis]: relative(-offset), opacity: Number.isFinite(opacity[index]) ? opacity[index]! : 1, duration: itemDuration, ease: 'power2.out', overwrite: false }, index * stagger));
      timeline.timeScale(speed);
    });
  }
  function play() {
    if (disposed) return;
    if (!elements.length || staticOnly()) { settle(); return; }
    if (!timeline || time >= duration) { releaseAnimation(); time = 0; build(); }
    phase = 'enter'; playing = true; timeline!.play(); notify();
  }
  function pause() {
    if (disposed) return;
    playing = false; timeline?.pause(); if (timeline) time = Math.min(duration, timeline.time()); notify();
  }
  function seek(seconds: number) {
    if (disposed) return;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration) throw new RangeError(`seek time must be a finite number from 0 to ${duration}.`);
    if (seconds === duration || staticOnly()) { settle(); return; }
    build(); time = seconds; phase = 'enter';
    timeline!.time(seconds, true); if (playing) timeline!.play(); else timeline!.pause(); notify();
  }
  function replay() {
    if (disposed) return;
    if (!elements.length || staticOnly()) { settle(); return; }
    releaseAnimation(); time = 0; phase = 'enter'; playing = false; play();
  }
  function preferenceChanged(event: MediaQueryListEvent) { if (disposed) return; reducedMotion = event.matches; if (reducedMotion) settle(); else notify(); }
  function focusEntered() { settle(); }
  function visibilityChanged() { if (document?.hidden) settle(); }
  function pageHidden(event: PageTransitionEvent) { if (event.persisted) settle(); else dispose(); }
  function dispose() {
    if (disposed) return;
    disposed = true; playing = false; releaseAnimation();
    if (followsPreference) preference?.removeEventListener('change', preferenceChanged);
    document?.removeEventListener('visibilitychange', visibilityChanged); browser?.removeEventListener('pagehide', pageHidden);
    for (const element of elements) { element.removeEventListener('focusin', focusEntered, true); if (owners.get(element) === owner) owners.delete(element); }
  }
  try {
    for (const element of elements) { owners.set(element, owner); element.addEventListener('focusin', focusEntered, true); }
    if (elements.length) {
      if (followsPreference) preference?.addEventListener('change', preferenceChanged);
      document?.addEventListener('visibilitychange', visibilityChanged); browser?.addEventListener('pagehide', pageHidden);
      if (staticOnly()) { time = duration; phase = 'settled'; }
    }
    notify();
  } catch (error) { dispose(); throw error; }
  return { get duration() { return duration; }, get state() { return state(); }, play, pause, seek, replay, dispose };
}
