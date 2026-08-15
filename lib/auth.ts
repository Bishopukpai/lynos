import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { getUsersCollection } from "@/lib/users";
import { signInSchema } from "@/lib/validation/auth";

/**
 * Dummy bcrypt hash used when the requested account does not exist
 * or does not have a password.
 *
 * bcrypt.compare() is intentionally still executed in these cases
 * to reduce timing differences that could otherwise help reveal
 * whether an email address exists.
 *
 * Generate your own hash locally before committing:
 *
 * node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('StudioOS-Dummy-Password-Only', 12))"
 */
const DUMMY_PASSWORD_HASH = "$2b$12$oF8JSm0pUAb7mpIvY9DlYOe5WXQzdqgLDYBqngLQ6s8GIBJe8EG3m";

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

      async authorize(credentials) {
        /*
         * Server-side validation is the actual security boundary.
         */
        const result = signInSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;

        const users = await getUsersCollection();

        const user = await users.findOne({
          email,
        });

        /*
         * Always perform bcrypt comparison.
         *
         * Existing account:
         *   compare against the user's real password hash.
         *
         * Non-existent/OAuth-only account:
         *   compare against the dummy hash.
         */
        const passwordHash = user?.password || DUMMY_PASSWORD_HASH;

        const passwordMatches = await bcrypt.compare(
          password,
          passwordHash
        );

        /*
         * Use the same failure response for:
         * - unknown email
         * - OAuth-only account
         * - incorrect password
         */
        if (!user || !user.password || !passwordMatches) {
          return null;
        }

        return {
          id: user._id ? user._id.toString() : "",
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
        session.user.id = token.id;
      }

      return session;
    },
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/signin",
  },
};