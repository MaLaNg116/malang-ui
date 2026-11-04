import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import type { MFloatingPlacement } from '../components/types';

/** One floating surface owns its observers and ignores stale async measurements. */
export function floatingPosition(
  reference: HTMLElement,
  surface: HTMLElement,
  placement: () => MFloatingPlacement,
  positioned: () => void,
) {
  let disposed = false;
  let revision = 0;
  const update = () => {
    if (disposed || !reference.isConnected || !surface.isConnected) return;
    const request = ++revision;
    void computePosition(reference, surface, {
      strategy: 'fixed', placement: placement(),
      middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12, crossAxis: true })],
    }).then(result => {
      if (disposed || request !== revision) return;
      surface.style.left = `${result.x}px`;
      surface.style.top = `${result.y}px`;
      surface.dataset.placement = result.placement;
      positioned();
    });
  };
  const view = reference.ownerDocument.defaultView;
  const cleanup = autoUpdate(reference, surface, update, {
    elementResize: typeof view?.ResizeObserver === 'function',
    layoutShift: typeof view?.IntersectionObserver === 'function',
  });
  return {
    update,
    dispose() { if (disposed) return; disposed = true; revision++; cleanup(); },
  };
}
