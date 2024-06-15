import { type Context, type Span, context, trace } from "@opentelemetry/api"

/**
 * - Returns an error object if the passed in object is an instanceof Error.
 * - Returns a string for any other type.
 */
export function narrowError(err: unknown): Error {
  if (err instanceof Error) {
    return err
  }
  return new Error(String(err))
}

export function createFnSpanner(tracerName: string) {
  const tracer = trace.getTracer(tracerName)

  return function fnSpan<T>(
    parent: Span | undefined,
    name: string,
    fn: (span: Span) => T,
    noCleanup?: boolean,
    noErrorHandling?: boolean,
  ) {
    let ctx: Context | undefined
    if (parent) {
      ctx = trace.setSpan(context.active(), parent)
    }
    const span = tracer.startSpan(`${tracerName}:${name}`, undefined, ctx)

    try {
      const output = fn(span)
      if (output instanceof Promise) {
        if (!noCleanup) {
          output
            .then(() => {
              if (!noCleanup) {
                span.end()
              }
            })
            .catch((err) => {
              if (!noErrorHandling) {
                span.recordException(err)
                span.setStatus({
                  code: 2, // this is the ERROR SpanStatusCode
                  message: err.message,
                })
              }
              if (!noCleanup) {
                span.end()
              }
            })
        }
        return output
      }
      if (!noCleanup) {
        span.end()
      }
      return output
    } catch (err) {
      if (!noErrorHandling) {
        span.recordException(narrowError(err))

        let message: string
        if (err instanceof Error) {
          message = err.message
        } else {
          message = String(err)
        }
        span.setStatus({
          code: 2, // this is the ERROR SpanStatusCode
          message: message,
        })
      }
      if (!noCleanup) {
        span.end()
      }
      throw err
    }
  }
}
