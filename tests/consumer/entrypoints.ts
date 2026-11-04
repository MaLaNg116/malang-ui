// Import every declared entry without substituting source files for dist.
import { debounce, throttle, asyncLock } from 'malang-ui/utils';
import { createInkSequence, createOrbitSequence, createSealSequence, createBrandSequence, createWaitingSequence, createStaggerSequence } from 'malang-ui/motion';
import { MButton, createInkSequence as allInk } from 'malang-ui/all';
import type { BrandSequencePhase, WaitingSequencePhase, StaggerSequencePhase } from 'malang-ui/motion';
function verifyMotionContracts(canvas: HTMLCanvasElement, elements: HTMLElement[]) {
  const brand = createBrandSequence(canvas, { amplitude: 1.2, reducedMotion: true, onUpdate(state) { const phase: BrandSequencePhase = state.phase; void phase; } });
  const waiting = createWaitingSequence(canvas, { loop: false, onUpdate(state) { const phase: WaitingSequencePhase = state.phase; void [phase, state.cycle.toFixed()]; } });
  const stagger = createStaggerSequence(elements, { direction: 'left', distance: 20, duration: .4, stagger: .08, onUpdate(state) { const phase: StaggerSequencePhase = state.phase; void phase; } });
  for (const controller of [brand, waiting, stagger]) { controller.pause(); controller.seek(controller.duration); controller.replay(); controller.dispose(); }
}
void verifyMotionContracts;
void [debounce, throttle, asyncLock, createInkSequence, createOrbitSequence, createSealSequence, createBrandSequence, createWaitingSequence, createStaggerSequence, MButton, allInk];
