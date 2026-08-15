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

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }

  const realIp = req.headers?.["x-real-ip"];

  if (typeof realIp === "string" && realIp.length > 0) {
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
         * Server-side validation is the actual security boundary.
         */
        const result = signInSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;

        /*
         * Normalize the email before using it for:
         * - database lookup
         * - rate limiting
         */
        const normalizedEmail = email.toLowerCase().trim();

        /*
         * Identify the client.
         */
        const ip = getClientIp(req);

        /*
         * Check rate limit BEFORE performing authentication.
         *
         * After five failed attempts for the same
         * email + IP combination, authentication is blocked
         * for 15 minutes.
         */
        const rateLimit = await checkSignInRateLimit(
          normalizedEmail,
          ip
        );

        if (!rateLimit.allowed) {
          /*
           * Return null rather than revealing whether the
           * account exists or whether the user is locked.
           *
           * NextAuth will expose the same generic authentication
           * failure to the frontend.
           */
          throw new Error("RATE_LIMITED");
        }

        const users = await getUsersCollection();

        const user = await users.findOne({
          email: normalizedEmail,
        });

        /*
         * Always perform bcrypt comparison.
         *
         * Existing account:
         *   use the user's actual password hash.
         *
         * Non-existent/OAuth-only account:
         *   use the dummy hash.
         */
        const passwordHash =
          user?.password || DUMMY_PASSWORD_HASH;

        const passwordMatches = await bcrypt.compare(
          password,
          passwordHash
        );

        /*
         * Authentication failure.
         *
         * This covers:
         * - unknown email
         * - OAuth-only account
         * - incorrect password
         *
         * All failures are treated identically.
         */
        if (
          !user ||
          !user.password ||
          !passwordMatches
        ) {
          /*
           * Only failed credential attempts are recorded.
           */
          await recordFailedSignIn(
            normalizedEmail,
            ip
          );

          return null;
        }

        /*
         * Successful authentication.
         *
         * Remove the previous failed-attempt record so the
         * user starts with a clean rate-limit state.
         */
        await clearSignInRateLimit(
          normalizedEmail,
          ip
        );

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

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },

  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/signin",
  },
};