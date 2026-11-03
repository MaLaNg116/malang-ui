import { validateWait } from './timing'
import type { AnyFunction, ScheduledFunction } from './types'

/**
 * Invoke after a quiet period, using the latest arguments and receiver.
 * The returned callable and `flush` return the last invocation's result.
 * Cancelling discards queued work while preserving that completed result.
 */
export function debounce<F extends AnyFunction>(fn: F, wait: number): ScheduledFunction<F> {
  validateWait(wait)

  let timer: ReturnType<typeof setTimeout> | undefined
  let args: Parameters<F> | undefined
  let receiver: ThisParameterType<F> | undefined
  let result: ReturnType<F> | undefined

  function clearTimer(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  function invoke(): ReturnType<F> | undefined {
    if (args === undefined) return result
    const pendingArgs = args
    const pendingReceiver = receiver
    args = undefined
    receiver = undefined
    clearTimer()
    // Clear queued state before calling user code so reentrant calls survive.
    result = fn.apply(pendingReceiver, pendingArgs) as ReturnType<F>
    return result
  }

  function scheduled(this: ThisParameterType<F>, ...nextArgs: Parameters<F>): ReturnType<F> | undefined {
    args = nextArgs
    receiver = this
    clearTimer()
    timer = setTimeout(invoke, wait)
    return result
  }

  return Object.assign(scheduled, {
    cancel(): void {
      clearTimer()
      args = undefined
      receiver = undefined
    },
    flush: invoke,
    pending: (): boolean => args !== undefined,
  })
}
