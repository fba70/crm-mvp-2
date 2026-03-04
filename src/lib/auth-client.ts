import { nextCookies } from "better-auth/next-js"
import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import { auth } from "./auth"

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  sendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  updateUser,
  changeEmail,
  changePassword,
  revokeSessions,
} = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), nextCookies()],
})
