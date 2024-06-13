import type { DB } from "@/lib/db"
import type { Mailgun } from "@/lib/mailgun"
import type { Span } from "@opentelemetry/api"
import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import { z } from "zod"
import { sendCode, verifyCode } from "./auth"

export type Context = {
  span: Span
  db: DB
  mailgun: Mailgun
}

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const publicRouter = t.router({
  sendCode: t.procedure
    .input(z.string().describe("email"))
    .mutation(({ ctx, input }) => {
      return sendCode(ctx.span, ctx.db, ctx.mailgun, input)
    }),
  verifyCode: t.procedure
    .input(z.string().describe("code"))
    .mutation(({ ctx, input }) => {
      return verifyCode(ctx.span, ctx.db, input)
    }),
})

export type PublicRouter = typeof publicRouter

