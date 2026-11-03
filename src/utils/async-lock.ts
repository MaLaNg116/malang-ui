import type { AnyFunction, AsyncLockedFunction } from './types'

/**
 * Share one in-flight promise between callers, using the first call's arguments
 * and receiver. Invocation starts in a microtask, so synchronous throws become
 * promise rejections and reentrant calls observe the existing lock.
 */
export function asyncLock<F extends AnyFunction>(fn: F): AsyncLockedFunction<F> {
  type Result = Awaited<ReturnType<F>>
  let active: Promise<Result> | undefined

  function locked(this: ThisParameterType<F>, ...args: Parameters<F>): Promise<Result> {
    if (active !== undefined) return active
    const receiver = this
    const invocation = Promise.resolve().then<Result>(() =>
      Promise.resolve(fn.apply(receiver, args) as ReturnType<F>),
    )
    const pending: Promise<Result> = invocation.then(
      value => {
        if (active === pending) active = undefined
        return value
      },
      error => {
        if (active === pending) active = undefined
        throw error
      },
    )
    active = pending
    return pending
  }

  return Object.assign(locked, {
    pending: (): boolean => active !== undefined,
  })
}
