import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "@/lib/prisma"
import { sendEmails } from "./email"
import { createAuthMiddleware, APIError } from "better-auth/api"
import { oAuthProxy } from "better-auth/plugins"
import { passwordSchema } from "./validation"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // redirectURI: "https://crm-mvp-2025.vercel.app/api/auth/callback/github",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // redirectURI: "https://crm-mvp-2025.vercel.app/api/auth/callback/google",
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendEmails({
        to: user.email,
        subject: "Reset your password",
        body: `Click this link to reset your password: ${url}`,
      })
    },
    // requireEmailVerification: true, // if user can access the app without email verified
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendEmails({
        to: user.email,
        subject: "Verify your email address",
        body: `Click this link to verify your email: ${url}`,
      })
    },
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 20,
  },
  user: {
    changeEmail: {
      enabled: true,
      async sendChangeEmailVerification({ user, newEmail, url }) {
        await sendEmails({
          to: user.email,
          subject: "Approve your email change",
          body: `Your email was changed to ${newEmail}. Click this link to approve your email change: ${url}`,
        })
      },
    },
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/sign-up/email" ||
        ctx.path === "/reset-password" ||
        ctx.path === "/change-password"
      ) {
        const password = ctx.body.password || ctx.body.newPassword
        const { error } = passwordSchema.safeParse(password)

        if (error) {
          throw new APIError("BAD_REQUEST", {
            message: "Password is not strong enough",
            cause: error,
          })
        }
      }
    }),
  }, // This hook is to implement zod validation on a back-end side
  plugins: [
    oAuthProxy({
      productionURL: "https://crm-mvp-2025.vercel.app",
      currentURL: "http://localhost:3000",
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
