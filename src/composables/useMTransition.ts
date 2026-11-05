import { computed, getCurrentScope, onScopeDispose, toValue, watch } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, TransitionProps, VNode, VNodeProps } from 'vue';

export type MTransitionPreset = 'reveal' | 'fold' | 'stamp';

export interface MTransitionOptions {
  preset?: MTransitionPreset;
  /** Enter duration in milliseconds. Leave uses 74% of this duration. */
  duration?: number;
  /** Take departing keyed items out of flow for TransitionGroup's native move. */
  group?: boolean;
  disabled?: MaybeRefOrGetter<boolean>;
  focusTarget?: () => HTMLElement | null;
}

type Hooks = Required<Pick<TransitionProps, 'css' | 'onBeforeEnter' | 'onEnter' | 'onAfterEnter' | 'onEnterCancelled' | 'onBeforeLeave' | 'onLeave' | 'onAfterLeave' | 'onLeaveCancelled'>>
  & Pick<VNodeProps, 'onVnodeMounted' | 'onVnodeBeforeUpdate' | 'onVnodeUpdated' | 'onVnodeBeforeUnmount'>;
type MoveClass = 'ui-transition-move' | 'ui-transition-static';
type Phase = 'enter' | 'leave';

interface LeaveGuard {
  ariaHidden: string | null;
  controls: Set<Element>;
  restoreLayout?: () => void;
}

interface RunningMotion {
  stop: (complete: boolean) => void;
  pose: () => Keyframe;
}

interface GroupPosition { left: number; top: number; width: number; height: number }

const ownedAttribute = 'ui-transition';
const formControls = 'button, input, select, textarea, fieldset';
const reduceQuery = '(prefers-reduced-motion: reduce)';
const defaultEnterEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';
const defaultLeaveEasing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

function durationToken(value: string) {
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(value.trim());
  return match ? Number(match[1]) * (match[2] === 's' ? 1000 : 1) : 190;
}

function activeElement(element: Element) {
  const root = element.getRootNode();
  return 'activeElement' in root ? (root as Document | ShadowRoot).activeElement : element.ownerDocument.activeElement;
}

function restoreAttribute(element: Element, name: string, owned: string, previous: string | null) {
  if (element.getAttribute(name) !== owned) return;
  if (previous === null) element.removeAttribute(name);
  else element.setAttribute(name, previous);
}

function motionFrames(preset: MTransitionPreset, phase: Phase, style: CSSStyleDeclaration): Keyframe[] {
  const resting: Keyframe = { opacity: style.opacity || '1' };
  const moving: Keyframe = { opacity: Number(resting.opacity) * (phase === 'leave' ? .15 : preset === 'reveal' ? .36 : .65) };
  if (style.translate === 'none' || !style.translate) {
    resting.translate = '0px 0px';
    moving.translate = preset === 'stamp' ? '0px -2px' : phase === 'leave' || preset === 'fold' ? '0px -4px' : '0px 6px';
  }
  if (preset === 'fold' && /^\d+(\.\d+)?px$/.test(style.blockSize)) {
    resting.blockSize = style.blockSize;
    moving.blockSize = '0px';
    resting.overflow = moving.overflow = 'hidden';
  }
  if (preset === 'stamp' && (style.scale === 'none' || !style.scale)) {
    resting.scale = '1';
    moving.scale = phase === 'leave' ? '.99' : '.975';
  }
  return phase === 'enter' ? [moving, resting] : [resting, moving];
}

function groupPosition(element: Element): GroupPosition | undefined {
  const view = element.ownerDocument.defaultView as (Window & typeof globalThis) | null;
  if (!view || !(element instanceof view.HTMLElement) || !element.offsetParent) return;
  const style = view.getComputedStyle(element);
  return {
    left: element.offsetLeft - (parseFloat(style.marginLeft) || 0),
    top: element.offsetTop - (parseFloat(style.marginTop) || 0),
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

function holdGroupPosition(element: Element, position: GroupPosition | undefined) {
  if (!position) return;
  const { style } = element as HTMLElement;
  const values = {
    position: 'absolute',
    left: `${position.left}px`,
    top: `${position.top}px`,
    right: 'auto',
    bottom: 'auto',
    width: `${position.width}px`,
    height: `${position.height}px`,
    'box-sizing': 'border-box',
  };
  const original = Object.entries(values).map(([name, value]) => {
    const previous = style.getPropertyValue(name);
    const priority = style.getPropertyPriority(name);
    style.setProperty(name, value);
    return { name, previous, priority, owned: style.getPropertyValue(name) };
  });
  return () => {
    for (const { name, previous, priority, owned } of original) {
      if (style.getPropertyValue(name) === owned && !style.getPropertyPriority(name)) {
        style.setProperty(name, previous, priority);
      }
    }
  };
}

function finishGroupMoves(root: Element) {
  for (const child of root.children) {
    if (!child.classList.contains('ui-transition-move')) continue;
    for (const animation of child.getAnimations?.() ?? []) {
      if ('transitionProperty' in animation && animation.transitionProperty === 'transform') animation.finish();
    }
  }
}

function excludeControls(element: Element, guard: LeaveGuard) {
  const controls = [...element.querySelectorAll(formControls)];
  if (element.matches(formControls)) controls.unshift(element);
  for (const control of controls) {
    if (control.hasAttribute('disabled')) continue;
    control.setAttribute('disabled', ownedAttribute);
    guard.controls.add(control);
  }
}

/**
 * Vue Transition hooks for short DOM changes. Use moveClass with TransitionGroup
 * to give keyed siblings the same timing via Vue's native FLIP.
 */
export function useMTransition(options: MTransitionOptions = {}): {
  transition: Hooks;
  moveClass: ComputedRef<MoveClass>;
} {
  const running = new Map<Element, RunningMotion>();
  const guarded = new Map<Element, LeaveGuard>();
  const pending = new WeakMap<Element, symbol>();
  const interrupted = new WeakMap<Element, Keyframe>();
  const groupRoots = new Set<Element>();
  const groupPositions = new WeakMap<Element, Map<Element, GroupPosition>>();
  const groupFocus = new WeakMap<Element, HTMLElement>();
  const disabled = computed(() => Boolean(toValue(options.disabled)) || (Number.isFinite(options.duration) && options.duration! <= 0));
  const moveClass = computed<MoveClass>(() => disabled.value ? 'ui-transition-static' : 'ui-transition-move');

  function snapshotGroup(root: Element) {
    const positions = new Map<Element, GroupPosition>();
    for (const child of root.children) {
      const position = groupPosition(child);
      if (position) positions.set(child, position);
    }
    groupPositions.set(root, positions);
    queueMicrotask(() => {
      if (groupPositions.get(root) === positions) groupPositions.delete(root);
    });
    return positions;
  }

  function groupRoot(vnode: VNode) {
    return vnode.el?.nodeType === 1 ? vnode.el as Element : undefined;
  }

  function groupBeforeUpdate(vnode: VNode, previous: VNode | null) {
    // Snapshot before Vue patches keyed children. The first absolute leave
    // would otherwise shift the layout used to position subsequent leaves.
    const root = (previous && groupRoot(previous)) || groupRoot(vnode);
    if (!root) return;
    snapshotGroup(root);
    const active = activeElement(root) as HTMLElement | null;
    if (active && root.contains(active) && typeof active.focus === 'function') groupFocus.set(root, active);
    else groupFocus.delete(root);
  }

  function groupUpdated(vnode: VNode) {
    const root = groupRoot(vnode);
    if (!root) return;
    const focused = groupFocus.get(root);
    groupFocus.delete(root);
    if (!focused?.isConnected || !root.contains(focused) || focused.matches(':disabled') || focused.closest('[inert], [hidden], [aria-hidden="true"]')) return;
    const document = root.ownerDocument;
    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) focused.focus({ preventScroll: true });
  }

  function departGroup(element: Element) {
    const root = element.parentElement;
    if (!root) return;
    const positions = groupPositions.get(root) ?? snapshotGroup(root);
    return holdGroupPosition(element, positions.get(element) ?? groupPosition(element));
  }

  function releaseLeave(element: Element) {
    const guard = guarded.get(element);
    if (!guard) return;
    guarded.delete(element);
    restoreAttribute(element, 'inert', ownedAttribute, null);
    restoreAttribute(element, 'aria-hidden', 'true', guard.ariaHidden);
    for (const control of guard.controls) {
      restoreAttribute(control, 'disabled', ownedAttribute, null);
    }
    guard.restoreLayout?.();
  }

  function prepareLeave(element: Element) {
    pending.delete(element);
    const active = activeElement(element);
    if (active && element.contains(active)) {
      const target = options.focusTarget?.();
      if (target?.isConnected && target.ownerDocument === element.ownerDocument && !element.contains(target) && !target.closest('[inert]') && !target.matches(':disabled')) {
        target.focus({ preventScroll: true });
      }
      const remaining = activeElement(element) as HTMLElement | null;
      if (remaining && element.contains(remaining)) remaining.blur?.();
    }
    const guard: LeaveGuard = {
      ariaHidden: element.getAttribute('aria-hidden'),
      controls: new Set<Element>(),
      restoreLayout: options.group ? departGroup(element) : undefined,
    };
    guarded.set(element, guard);
    if (!element.hasAttribute('inert')) element.setAttribute('inert', ownedAttribute);
    element.setAttribute('aria-hidden', 'true');
    excludeControls(element, guard);
  }

  function start(element: Element, phase: Phase, done: () => void) {
    running.get(element)?.stop(false);
    pending.delete(element);
    const from = interrupted.get(element);
    interrupted.delete(element);
    // Vue's out-in leave callback can render the next child. Let the current
    // patch finish even when reduced motion skips the animation.
    const complete = () => {
      const token = Symbol();
      pending.set(element, token);
      queueMicrotask(() => {
        if (pending.get(element) !== token) return;
        pending.delete(element);
        done();
      });
    };
    const view = element.ownerDocument.defaultView as (Window & typeof globalThis) | null;
    const media = view?.matchMedia?.(reduceQuery);
    const reduced = () => disabled.value || media?.matches || Boolean(element.closest('[data-ui-motion="reduced"]'));
    if (!view || typeof element.animate !== 'function' || reduced() || (phase === 'enter' && element.contains(activeElement(element)))) {
      complete();
      return;
    }
    const style = view.getComputedStyle(element);
    const baseDuration = durationToken(style.getPropertyValue('--ui-motion-duration-transition'));
    const duration = options.duration !== undefined && Number.isFinite(options.duration) ? Math.max(0, options.duration) : baseDuration;
    if (!baseDuration || !duration) {
      complete();
      return;
    }
    const easingToken = phase === 'enter' ? '--ui-motion-ease-emphasized' : '--ui-motion-ease-standard';
    const easing = style.getPropertyValue(easingToken).trim() || (phase === 'enter' ? defaultEnterEasing : defaultLeaveEasing);
    const preset = options.preset ?? 'reveal';
    const frames = motionFrames(preset, phase, style);
    if (from) {
      for (const property of Object.keys(frames[0]!)) {
        if (Object.hasOwn(from, property)) frames[0]![property] = from[property];
      }
    }
    let animation: Animation;
    try {
      animation = element.animate(frames, {
        duration: phase === 'enter' ? duration : Math.round(duration * .74),
        easing,
        fill: 'both',
      });
    } catch {
      complete();
      return;
    }
    animation.id = `ui-transition-${phase}`;
    const previousPhase = element.getAttribute('data-ui-transition-phase');
    const previousPreset = element.getAttribute('data-ui-transition-preset');
    element.setAttribute('data-ui-transition-phase', phase);
    element.setAttribute('data-ui-transition-preset', preset);
    const document = element.ownerDocument;
    let pointer: number | undefined;
    let releaseFrame: number | undefined;
    let observer: MutationObserver | undefined;
    const session: RunningMotion = {
      pose() {
        const style = view.getComputedStyle(element);
        const pose: Keyframe = { opacity: style.opacity };
        if (Object.hasOwn(frames[0]!, 'translate')) pose.translate = style.translate;
        if (Object.hasOwn(frames[0]!, 'scale')) pose.scale = style.scale;
        if (Object.hasOwn(frames[0]!, 'blockSize') && style.blockSize.endsWith('px')) pose.blockSize = style.blockSize;
        return pose;
      },
      stop(settle) {
        if (running.get(element) !== session) return;
        running.delete(element);
        observer?.disconnect();
        media?.removeEventListener('change', preference);
        element.removeEventListener('focusin', focused);
        element.removeEventListener('pointerdown', pressed, true);
        document.removeEventListener('pointerup', released, true);
        document.removeEventListener('pointercancel', cancelled, true);
        view.removeEventListener('blur', endPointer);
        if (releaseFrame !== undefined) view.cancelAnimationFrame(releaseFrame);
        animation.onfinish = animation.oncancel = null;
        animation.cancel();
        restoreAttribute(element, 'data-ui-transition-phase', phase, previousPhase);
        restoreAttribute(element, 'data-ui-transition-preset', preset, previousPreset);
        if (settle) complete();
      },
    };
    const endPointer = () => session.stop(true);
    function pressed(event: Event) {
      const press = event as PointerEvent;
      if (!press.isPrimary || press.button !== 0 || pointer !== undefined) return;
      pointer = press.pointerId;
      const time = animation.currentTime;
      animation.pause();
      animation.currentTime = time ?? 0;
      document.addEventListener('pointerup', released, true);
      document.addEventListener('pointercancel', cancelled, true);
      view!.addEventListener('blur', endPointer);
    }
    function released(event: PointerEvent) {
      if (event.pointerId !== pointer || releaseFrame !== undefined) return;
      // Pointer up and its click must both hit the geometry used for pointer down.
      releaseFrame = view!.requestAnimationFrame(endPointer);
    }
    function cancelled(event: PointerEvent) {
      if (event.pointerId === pointer) endPointer();
    }
    function focused() {
      if (pointer === undefined) session.stop(true);
    }
    function preference() {
      if (reduced()) session.stop(true);
    }
    running.set(element, session);
    animation.onfinish = animation.oncancel = () => session.stop(true);
    if (phase === 'enter') {
      element.addEventListener('focusin', focused);
      element.addEventListener('pointerdown', pressed, true);
    }
    media?.addEventListener('change', preference);
    if (view.MutationObserver) {
      observer = new view.MutationObserver(records => {
        if (records.some(record => record.attributeName === 'data-ui-motion')) preference();
        const guard = guarded.get(element);
        if (guard) excludeControls(element, guard);
      });
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const trackControls = ancestor === element && phase === 'leave';
        observer.observe(ancestor, {
          attributes: true,
          attributeFilter: trackControls ? ['data-ui-motion', 'disabled'] : ['data-ui-motion'],
          childList: trackControls,
          subtree: trackControls,
        });
      }
    }
  }

  function prepareEnter(element: Element) {
    pending.delete(element);
    releaseLeave(element);
  }
  function clearEnter(element: Element) {
    pending.delete(element);
    interrupted.delete(element);
    running.get(element)?.stop(false);
  }
  function clearLeave(element: Element) {
    clearEnter(element);
    releaseLeave(element);
  }
  function reverse(element: Element) {
    pending.delete(element);
    const current = running.get(element);
    if (!current) return;
    interrupted.set(element, current.pose());
    current.stop(false);
  }

  if (getCurrentScope()) {
    watch(disabled, value => {
      if (!value) return;
      for (const session of [...running.values()]) session.stop(true);
      for (const root of groupRoots) finishGroupMoves(root);
    }, { flush: 'sync' });
    onScopeDispose(() => {
      for (const session of [...running.values()]) session.stop(true);
      for (const element of guarded.keys()) releaseLeave(element);
      for (const root of groupRoots) finishGroupMoves(root);
      groupRoots.clear();
    });
  }

  return {
    transition: {
      css: false,
      onBeforeEnter: prepareEnter,
      onEnter: (element, done) => start(element, 'enter', done),
      onAfterEnter: clearEnter,
      onEnterCancelled: reverse,
      onBeforeLeave: prepareLeave,
      onLeave: (element, done) => start(element, 'leave', done),
      onAfterLeave: clearLeave,
      onLeaveCancelled(element) {
        reverse(element);
        releaseLeave(element);
      },
      ...(options.group ? {
        onVnodeMounted(vnode: VNode) {
          const root = groupRoot(vnode);
          if (root) groupRoots.add(root);
        },
        onVnodeBeforeUpdate: groupBeforeUpdate,
        onVnodeUpdated: groupUpdated,
        onVnodeBeforeUnmount(vnode: VNode) {
          const root = groupRoot(vnode);
          if (!root) return;
          finishGroupMoves(root);
          groupRoots.delete(root);
        },
      } : {}),
    },
    moveClass,
  };
}
