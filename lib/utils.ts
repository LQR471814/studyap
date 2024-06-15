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

const UNSET = Symbol("unset")

/**
 * Creates a function that will only run once, then cache it's result for every
 * next call (similar to an esm module).
 */
export function memo<A extends unknown[], R>(
  fn: (...args: A) => R,
  changeOnArgs?: Record<number, boolean>,
): (...args: A) => R {
  let lastArgs: A | undefined
  let memoized: R | symbol = UNSET

  return (...args: A): R => {
    if (memoized === UNSET || !lastArgs || lastArgs.length !== args.length) {
      lastArgs = args

      memoized = fn(...args)
      return memoized
    }

    for (let i = 0; i < lastArgs!.length; i++) {
      if (!changeOnArgs?.[i]) {
        continue
      }
      if (lastArgs![i] !== args[i]) {
        lastArgs = args

        memoized = fn(...args)
        return memoized
      }
    }

    return memoized as R
  }
}

/**
 * Grabs a random subset of elements from the list.
 */
export function grabRandom<T>(
  randomThunk: () => number,
  list: T[],
  count: number,
): T[] {
  if (count > list.length) {
    throw new Error("You cannot grab more than the size of the list!")
  }
  if (count === list.length) {
    return list
  }

  const result: T[] = []
  while (result.length < count) {
    const e = list[Math.floor(randomThunk() * list.length)]
    if (result.includes(e)) {
      continue
    }
    result.push(e)
  }

  return result
}
