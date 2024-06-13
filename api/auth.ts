import type { DB } from "@/lib/db"
import type { Mailgun } from "@/lib/mailgun"
import { activeToken, pendingVerification, user } from "@/lib/schema/schema"
import { SpanStatusCode, type Span } from "@opentelemetry/api"
import { eq, lt } from "drizzle-orm"
import { fnSpan } from "./tracer"

function byteToHex(byte: number): string {
  // convert the smallest 4 bits from a byte into a hexadecimal digit
  const rightNumber = byte & 0b00001111
  const right =
    rightNumber > 9
      ? String.fromCharCode(65 + rightNumber - 10)
      : String.fromCharCode(48 + rightNumber)

  // convert the largest 4 bits from a byte into a hexadecimal digit
  const leftNumber = byte >> 4
  const left =
    leftNumber > 9
      ? String.fromCharCode(65 + leftNumber - 10)
      : String.fromCharCode(48 + leftNumber)

  return left + right
}

export function generateCode(): string {
  // this will result in 8 digits of hexadecimal digits
  const buffer = new Uint8Array(new ArrayBuffer(4))
  crypto.getRandomValues(buffer)

  let code = ""
  for (let i = 0; i < buffer.length; i++) {
    code += byteToHex(buffer[i])
    if (i === 1) {
      code += "-"
    }
  }
  return code
}

export function generateToken(): string {
  // this will result in 32 digits of hexadecimal digits
  const buffer = new Uint8Array(new ArrayBuffer(16))
  crypto.getRandomValues(buffer)

  let code = ""
  for (let i = 0; i < buffer.length; i++) {
    code += byteToHex(buffer[i])
  }
  return code
}

export async function sendCode(
  span: Span | undefined,
  db: DB,
  mailgun: Mailgun,
  email: string,
) {
  return fnSpan(span, "sendCode", async (span) => {
    const code = generateCode()
    const token = generateToken()

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    if (span.isRecording()) {
      span.addEvent("set expiresAt", { expiresAt: expiresAt.toString() })
    }

    // purge expired codes before creating a new one
    await db
      .delete(pendingVerification)
      .where(lt(pendingVerification.expiresAt, new Date()))

    await db.insert(pendingVerification).values({
      code,
      email,
      token,
      expiresAt,
    })

    await mailgun.sendEmail({
      from: `studyap@${mailgun.domain}`,
      to: email,
      subject: "Verify your email address",
      html: `Please enter this verification code in the studyap.org app when prompted.
<br><br>
${code}
<br><br>
If you don't recognize this account, please ignore this email.`,
    })
  })
}

export async function verifyCode(
  span: Span | undefined,
  db: DB,
  code: string,
): Promise<string | undefined> {
  return fnSpan(span, "verifyCode", async (span) => {
    if (span.isRecording()) {
      span.setAttribute("code", code)
    }

    // purge expired codes before checking if a code exists
    await db
      .delete(pendingVerification)
      .where(lt(pendingVerification.expiresAt, new Date()))

    const [row] = await db
      .select()
      .from(pendingVerification)
      .where(eq(pendingVerification.code, code))
    if (!row) {
      if (span.isRecording()) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Code doesn't exist or has expired.",
        })
      }

      return
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(pendingVerification)
        .where(eq(pendingVerification.code, code))

      await tx.insert(user).values({ email: row.email }).onConflictDoNothing()

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 6)

      await tx.insert(activeToken).values({
        userEmail: row.email,
        token: row.token,
        expiresAt: expiresAt,
      })
    })

    return row.token
  })
}

export async function verifyToken(
  span: Span | undefined,
  db: DB,
  token: string,
): Promise<string | undefined> {
  return fnSpan(span, "verifyToken", async () => {
    await db.delete(activeToken).where(lt(activeToken.expiresAt, new Date()))

    const [row] = await db
      .select({ userEmail: activeToken.userEmail })
      .from(activeToken)
      .where(eq(activeToken.token, token))

    return row?.userEmail
  })
}
