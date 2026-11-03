import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { asyncLock, debounce, throttle } from '../src/utils'

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('waits for a quiet period and invokes with the latest arguments and receiver', () => {
    const callback = vi.fn(function (this: { prefix: string }, value: string) {
      return this.prefix + value
    })
    const run = debounce(callback, 100)
    const receiver = { prefix: 'latest:' }

    expect(run.call({ prefix: 'old:' }, 'first')).toBeUndefined()
    vi.advanceTimersByTime(75)
    run.call(receiver, 'last')
    vi.advanceTimersByTime(99)
    expect(callback).not.toHaveBeenCalled()
    expect(run.pending()).toBe(true)
    vi.advanceTimersByTime(1)

    expect(callback).toHaveBeenCalledExactlyOnceWith('last')
    expect(callback.mock.contexts[0]).toBe(receiver)
    expect(run.pending()).toBe(false)
    expect(run.flush()).toBe('latest:last')
  })

  it('flushes exactly once and returns the cached result on later calls', () => {
    const callback = vi.fn((value: number) => value * 2)
    const run = debounce(callback, 100)
    run(3)
    expect(run.flush()).toBe(6)
    expect(run.pending()).toBe(false)
    vi.runAllTimers()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(run(4)).toBe(6)
    expect(run.flush()).toBe(8)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('cancels queued work and allows a fresh call', () => {
    const callback = vi.fn()
    const run = debounce(callback, 100)
    run('discarded')
    run.cancel()
    expect(run.pending()).toBe(false)
    expect(run.flush()).toBeUndefined()
    vi.runAllTimers()
    expect(callback).not.toHaveBeenCalled()
    run('fresh')
    vi.advanceTimersByTime(100)
    expect(callback).toHaveBeenCalledExactlyOnceWith('fresh')
  })

  it('preserves a reentrant invocation queued by the callback', () => {
    const seen: number[] = []
    const run = debounce((value: number): void => {
      seen.push(value)
      if (value === 1) run(2)
    }, 10)
    run(1)
    vi.advanceTimersByTime(10)
    expect(run.pending()).toBe(true)
    vi.advanceTimersByTime(10)
    expect(seen).toEqual([1, 2])
  })

  it('defers a zero-wait call until the next timer turn', () => {
    const callback = vi.fn()
    const run = debounce(callback, 0)
    run()
    expect(callback).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('throttle', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('invokes a single leading call without a duplicate trailing call', () => {
    const callback = vi.fn((value: number) => value * 2)
    const run = throttle(callback, 100)
    expect(run(3)).toBe(6)
    expect(run.pending()).toBe(false)
    vi.runAllTimers()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('keeps invoking the latest trailing call during sustained input', () => {
    const callback = vi.fn()
    const run = throttle(callback, 100)
    run('a')
    vi.advanceTimersByTime(30)
    run('b')
    vi.advanceTimersByTime(40)
    run('c')
    vi.advanceTimersByTime(30)
    expect(callback.mock.calls).toEqual([['a'], ['c']])
    vi.advanceTimersByTime(20)
    run('d')
    vi.advanceTimersByTime(50)
    run('e')
    vi.advanceTimersByTime(30)
    expect(callback.mock.calls).toEqual([['a'], ['c'], ['e']])
    vi.runAllTimers()
    expect(callback).toHaveBeenCalledTimes(3)
    expect(run.pending()).toBe(false)
  })

  it('uses the latest trailing receiver, and flush starts a fresh cooldown', () => {
    const callback = vi.fn(function (this: { factor: number }, value: number) {
      return this.factor * value
    })
    const run = throttle(callback, 100)
    expect(run.call({ factor: 1 }, 2)).toBe(2)
    vi.advanceTimersByTime(40)
    const receiver = { factor: 5 }
    expect(run.call(receiver, 3)).toBe(2)
    expect(run.pending()).toBe(true)
    expect(run.flush()).toBe(15)
    expect(callback.mock.contexts[1]).toBe(receiver)
    expect(run.pending()).toBe(false)
    vi.advanceTimersByTime(40)
    run.call({ factor: 2 }, 4)
    vi.advanceTimersByTime(59)
    expect(callback).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(3)
    expect(run.flush()).toBe(8)
    vi.runAllTimers()
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('cancels queued trailing work and resets the cooldown', () => {
    const callback = vi.fn()
    const run = throttle(callback, 100)
    run('leading')
    run('discarded')
    run.cancel()
    expect(run.pending()).toBe(false)
    run('fresh')
    vi.runAllTimers()
    expect(callback.mock.calls).toEqual([['leading'], ['fresh']])
  })

  it('allows reentrant calls to queue one trailing invocation', () => {
    const seen: number[] = []
    const run = throttle((value: number): void => {
      seen.push(value)
      if (value === 1) run(2)
    }, 10)
    run(1)
    expect(run.pending()).toBe(true)
    vi.runAllTimers()
    expect(seen).toEqual([1, 2])
  })

  it('supports zero wait without duplicating a lone call', () => {
    const callback = vi.fn()
    const run = throttle(callback, 0)
    run('a')
    run('b')
    expect(callback.mock.calls).toEqual([['a']])
    vi.runAllTimers()
    expect(callback.mock.calls).toEqual([['a'], ['b']])
  })
})

describe('wait validation', () => {
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rejects %s', wait => {
    expect(() => debounce(() => {}, wait)).toThrow(RangeError)
    expect(() => throttle(() => {}, wait)).toThrow(RangeError)
  })
})

describe('asyncLock', () => {
  it('shares the exact in-flight promise and the first call context', async () => {
    let finish!: () => void
    const callback = vi.fn(function (this: { prefix: string }, value: string) {
      return new Promise<string>(resolve => {
        finish = () => resolve(this.prefix + value)
      })
    })
    const run = asyncLock(callback)
    const receiver = { prefix: 'first:' }
    const first = run.call(receiver, 'a')
    const second = run.call({ prefix: 'ignored:' }, 'b')
    expect(second).toBe(first)
    expect(run.pending()).toBe(true)
    await Promise.resolve()
    expect(callback).toHaveBeenCalledExactlyOnceWith('a')
    expect(callback.mock.contexts[0]).toBe(receiver)
    finish()
    await expect(first).resolves.toBe('first:a')
    expect(run.pending()).toBe(false)
  })

  it('releases after success and creates a new promise for the next operation', async () => {
    const callback = vi.fn((value: number) => Promise.resolve(value * 2))
    const run = asyncLock(callback)
    const first = run(2)
    await expect(first).resolves.toBe(4)
    const next = run(3)
    expect(next).not.toBe(first)
    await expect(next).resolves.toBe(6)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('turns synchronous throws into rejection and releases the lock', async () => {
    const error = new Error('sync failure')
    let fails = true
    const run = asyncLock(() => {
      if (fails) throw error
      return 'recovered'
    })
    const failure = run()
    expect(run()).toBe(failure)
    await expect(failure).rejects.toBe(error)
    expect(run.pending()).toBe(false)
    fails = false
    await expect(run()).resolves.toBe('recovered')
  })

  it('releases after asynchronous rejection', async () => {
    const callback = vi.fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce('retry succeeded')
    const run = asyncLock(callback)
    const failure = run()
    expect(run()).toBe(failure)
    await expect(failure).rejects.toThrow('network failure')
    expect(run.pending()).toBe(false)
    await expect(run()).resolves.toBe('retry succeeded')
    expect(callback).toHaveBeenCalledTimes(2)
  })
})
