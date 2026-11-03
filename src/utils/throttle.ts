import { validateWait } from './timing'
import type { AnyFunction, ScheduledFunction } from './types'

/**
 * Invoke immediately, then at most once per interval with the latest call.
 * A single leading call does not create a duplicate trailing invocation.
 * Flushing queued work begins a fresh cooldown; cancel resets the cooldown.
 */
export function throttle<F extends AnyFunction>(fn: F, wait: number): ScheduledFunction<F> {
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
    result = fn.apply(pendingReceiver, pendingArgs) as ReturnType<F>
    return result
  }

  function startCooldown(): void {
    timer = setTimeout(() => {
      timer = undefined
      if (args !== undefined) {
        // Establish the next window before user code, including reentrant calls.
        startCooldown()
        invoke()
      }
    }, wait)
  }

  function scheduled(this: ThisParameterType<F>, ...nextArgs: Parameters<F>): ReturnType<F> | undefined {
    args = nextArgs
    receiver = this
    if (timer === undefined) {
      startCooldown()
      return invoke()
    }
    return result
  }

  return Object.assign(scheduled, {
    cancel(): void {
      clearTimer()
      args = undefined
      receiver = undefined
    },
    flush(): ReturnType<F> | undefined {
      if (args === undefined) return result
      clearTimer()
      startCooldown()
      return invoke()
    },
    pending: (): boolean => args !== undefined,
  })
}
