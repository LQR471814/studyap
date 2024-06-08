/**
 * Returns a list of segment lengths.
 *
 * If the segment lengths reaches "total" but the remaining
 * space available is less than min, then the last segment
 * will be the remaining space available.
 */
export function generateRandomSegments(
  total: number,
  segmentLengthRange: [min: number, max: number],
): number[] {
  const segments: number[] = []
  let accumulated = 0

  const [min, max] = segmentLengthRange
  if (max === 0) {
    throw new Error("segment length range max cannot be 0")
  }

  const range = max - min
  while (accumulated < total) {
    let length = Math.round(min + Math.random() * range)
    if (length === 0) {
      continue
    }

    const newTotal = accumulated + length

    // chop off overflow
    if (newTotal > total) {
      length = total - accumulated
    }

    segments.push(length)
    accumulated = newTotal
  }

  return segments
}

/**
 * Retries an async function if it rejects.
 */
export function retryAsyncFn<I extends unknown[], O>(
  name: string,
  count: number,
  callback: (...args: I) => Promise<O>,
) {
  return async (...args: I): Promise<O> => {
    for (let i = 0; i < count; i++) {
      try {
        return await callback.apply(undefined, args)
      } catch (err) {
        console.warn(
          `WARN: got error while executing ${name}, retrying...`,
          err,
        )
      }
    }
    throw new Error(`function ${name} failed ${count} times in a row.`)
  }
}

const optionPrefix = /^[A-Z]\./

export function formatMCQOption(index: number, option: string) {
  if (option.match(optionPrefix)) {
    return option
  }
  return `${String.fromCharCode(65 + index)}. ${option}`
}

/**
 * Ensures a string has a given prefix.
 */
export function ensurePrefix(prefix: string, str: string) {
  if (str.startsWith(prefix)) {
    return str
  }
  return prefix + str
}

/**
 * Creates a function that won't rerun unless its arguments change.
 */
export function memo<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  let lastArgs: A | undefined
  let memoized: R | undefined
  return (...args: A): R => {
    if (!lastArgs || lastArgs.length !== args.length || !memoized) {
      lastArgs = args
      memoized = fn(...args)
      return memoized
    }
    for (let i = 0; i < args.length; i++) {
      if (lastArgs[i] !== args[i]) {
        lastArgs = args
        memoized = fn(...args)
        return memoized
      }
    }
    return memoized
  }
}
