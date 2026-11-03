export function validateWait(wait: number): void {
  if (!Number.isFinite(wait) || wait < 0) {
    throw new RangeError('wait must be a finite, non-negative number')
  }
}
