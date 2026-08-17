import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];

    /**
     * Currently selected workspace/organization.
     *
     * This is set only after the authenticated user has
     * been verified as an active member of the organization.
     */
    activeOrganizationId?: string;
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;

    /**
     * Currently selected workspace/organization.
     */
    activeOrganizationId?: string;
  }
}