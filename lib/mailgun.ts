export class Mailgun {
  private apiKey: string
  domain: string

  constructor(apiKey: string, domain: string) {
    this.apiKey = apiKey
    this.domain = domain
  }

  private authHeader(): string {
    return `Basic ${btoa(`api:${this.apiKey}`)}`
  }

  async sendEmail(options: {
    from: string
    to: string
    subject: string
    html: string
  }) {
    const body = new FormData()

    body.append("from", options.from)
    body.append("to", options.to)
    body.append("subject", options.subject)
    body.append("html", options.html)

    const res = await fetch(
      `https://api.mailgun.net/v3/${this.domain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: this.authHeader(),
        },
        body,
      },
    )

    if (res.status - 400 >= 0) {
      console.error(await res.text())
      throw new Error("HTTP Status is 400 or 500.")
    }
  }
}
