import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SendEmailValues {
  to: string
  subject: string
  body: string
}

export async function sendEmails({ to, subject, body }: SendEmailValues) {
  await resend.emails.send({
    from: "noreply@example.com",
    to,
    subject,
    html: body,
  })
}
