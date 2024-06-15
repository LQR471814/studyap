import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { Resource } from "@opentelemetry/resources"
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node"
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

export function initializeOtel(serviceName: string, debug?: boolean) {
  if (debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)
  }

  const exporter = new OTLPTraceExporter({
    url: "https://api.honeycomb.io/v1/traces",
    headers: { "x-honeycomb-team": process.env.HONEYCOMB_API_KEY },
  })
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
    }),
  })
  provider.addSpanProcessor(new BatchSpanProcessor(exporter))
  provider.register()

  return () => provider.shutdown()
}
