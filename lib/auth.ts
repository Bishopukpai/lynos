import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { getUsersCollection } from "@/lib/users";
import { signInSchema } from "@/lib/validation/auth";
import {
  checkSignInRateLimit,
  clearSignInRateLimit,
  recordFailedSignIn,
} from "@/lib/rate-limit";

/**
 * Dummy bcrypt hash used when the requested account does not exist
 * or does not have a password.
 *
 * bcrypt.compare() is still executed in these cases to reduce
 * timing differences between existing and non-existing accounts.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$oF8JSm0pUAb7mpIvY9DlYOe5WXQzdqgLDYBqngLQ6s8GIBJe8EG3m";

/**
 * Extract the client's IP address.
 *
 * x-forwarded-for is commonly provided by reverse proxies such as
 * Vercel and other hosting platforms.
 *
 * IMPORTANT:
 * Only trust forwarded headers when your application is behind
 * a trusted proxy.
 */
function getClientIp(req: {
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const forwardedFor = req.headers?.["x-forwarded-for"];

  if (
    typeof forwardedFor === "string" &&
    forwardedFor.length > 0
  ) {
    return forwardedFor.split(",")[0].trim();
  }

  if (
    Array.isArray(forwardedFor) &&
    forwardedFor.length > 0
  ) {
    return forwardedFor[0].trim();
  }

  const realIp = req.headers?.["x-real-ip"];

  if (
    typeof realIp === "string" &&
    realIp.length > 0
  ) {
    return realIp.trim();
  }

  return "unknown";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials, req) {
        /*
         * -------------------------------------------------------
         * 1. VALIDATE CREDENTIALS
         * -------------------------------------------------------
         *
         * Server-side validation is the actual security boundary.
         */

        const result =
          signInSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;

        /*
         * -------------------------------------------------------
         * 2. NORMALIZE EMAIL
         * -------------------------------------------------------
         *
         * The same normalized email is used for:
         *
         * - database lookup
         * - rate limiting
         */

        const normalizedEmail =
          email.toLowerCase().trim();

        /*
         * -------------------------------------------------------
         * 3. IDENTIFY CLIENT
         * -------------------------------------------------------
         */

        const ip = getClientIp(req);

        /*
         * -------------------------------------------------------
         * 4. CHECK SIGN-IN RATE LIMIT
         * -------------------------------------------------------
         *
         * After five failed attempts for the same
         * email + IP combination, authentication is blocked
         * for 15 minutes.
         */

        const rateLimit =
          await checkSignInRateLimit(
            normalizedEmail,
            ip
          );

        if (!rateLimit.allowed) {
          /*
           * Do not reveal whether the account exists
           * or whether the account is currently locked.
           */
          throw new Error("RATE_LIMITED");
        }

        /*
         * -------------------------------------------------------
         * 5. FIND USER
         * -------------------------------------------------------
         */

        const users =
          await getUsersCollection();

        const user =
          await users.findOne({
            email: normalizedEmail,
          });

        /*
         * -------------------------------------------------------
         * 6. PASSWORD VERIFICATION
         * -------------------------------------------------------
         *
         * Always perform bcrypt comparison.
         *
         * Existing account:
         *   use the user's actual password hash.
         *
         * Non-existent/OAuth-only account:
         *   use the dummy hash.
         *
         * This helps reduce timing differences between
         * existing and non-existing accounts.
         */

        const passwordHash =
          user?.password ||
          DUMMY_PASSWORD_HASH;

        const passwordMatches =
          await bcrypt.compare(
            password,
            passwordHash
          );

        /*
         * -------------------------------------------------------
         * 7. AUTHENTICATION FAILURE
         * -------------------------------------------------------
         *
         * These cases are intentionally treated identically:
         *
         * - unknown email
         * - OAuth-only account
         * - incorrect password
         */

        if (
          !user ||
          !user.password ||
          !passwordMatches
        ) {
          await recordFailedSignIn(
            normalizedEmail,
            ip
          );

          return null;
        }

        /*
         * -------------------------------------------------------
         * 8. SUCCESSFUL AUTHENTICATION
         * -------------------------------------------------------
         *
         * Clear the previous failed-attempt record.
         */

        await clearSignInRateLimit(
          normalizedEmail,
          ip
        );

        /*
         * Do not set activeOrganizationId here.
         *
         * A user may belong to multiple organizations.
         *
         * The workspace-switching flow will establish the
         * active organization after verifying membership.
         */

        return {
          id: user._id
            ? user._id.toString()
            : "",

          name: user.name,

          email: user.email,
        };
      },
    }),
  ],

  /*
   * ---------------------------------------------------------
   * SESSION CONFIGURATION
   * ---------------------------------------------------------
   */

  session: {
    strategy: "jwt",
  },

  /*
   * ---------------------------------------------------------
   * CALLBACKS
   * ---------------------------------------------------------
   */

  callbacks: {
    /**
     * JWT callback.
     *
     * The JWT stores:
     *
     * - authenticated user's ID
     * - currently selected workspace ID
     */
    async jwt({
      token,
      user,
      trigger,
      session,
    }) {
      /*
       * Initial sign-in.
       *
       * Store the authenticated user's ID
       * inside the JWT.
       */

      if (user) {
        token.id = user.id;
      }

      /*
       * Workspace switching.
       *
       * The client calls:
       *
       * update({
       *   activeOrganizationId: organizationId
       * })
       *
       * after the switch API has verified that the
       * authenticated user belongs to that organization.
       */

      if (
        trigger === "update" &&
        session?.activeOrganizationId
      ) {
        token.activeOrganizationId =
          session.activeOrganizationId;
      }

      return token;
    },

    /**
     * Session callback.
     *
     * Exposes the authenticated user's ID and
     * active workspace ID to the application.
     */
    async session({
      session,
      token,
    }) {
      /*
       * Add user ID to the session.
       */

      if (
        session.user &&
        token.id
      ) {
        session.user.id =
          token.id as string;
      }

      /*
       * Add active workspace to the session.
       */

      if (
        token.activeOrganizationId
      ) {
        session.activeOrganizationId =
          token.activeOrganizationId as string;
      }

      return session;
    },
  },

  /*
   * ---------------------------------------------------------
   * AUTH SECRET
   * ---------------------------------------------------------
   */

  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET,

  /*
   * ---------------------------------------------------------
   * CUSTOM SIGN-IN PAGE
   * ---------------------------------------------------------
   */

  pages: {
    signIn: "/signin",
  },
};