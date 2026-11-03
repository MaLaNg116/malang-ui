/** A callable whose parameter, result and receiver types can be preserved. */
// `any` is intentional here: the concrete function type supplies the public API.
export type AnyFunction = (this: any, ...args: any[]) => any

/**
 * A scheduled call returns the latest completed invocation's value, or undefined
 * before the first invocation. `pending` reports queued work, not a cooldown.
 */
export type ScheduledFunction<F extends AnyFunction> = {
  (this: ThisParameterType<F>, ...args: Parameters<F>): ReturnType<F> | undefined
  cancel(): void
  flush(): ReturnType<F> | undefined
  pending(): boolean
}

export type AsyncLockedFunction<F extends AnyFunction> = {
  (this: ThisParameterType<F>, ...args: Parameters<F>): Promise<Awaited<ReturnType<F>>>
  pending(): boolean
}
