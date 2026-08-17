import { ObjectId } from "mongodb";
import getMongoClient from "@/lib/mongodb";

export type OrganizationRole =
  | "owner"
  | "admin"
  | "member";

export interface OrganizationMember {
  _id?: ObjectId;

  /**
   * Organization this membership belongs to.
   */
  organizationId: ObjectId;

  /**
   * User who belongs to the organization.
   */
  userId: ObjectId;

  /**
   * User's role within this organization.
   *
   * A user's role is organization-specific.
   */
  role: OrganizationRole;

  /**
   * Membership lifecycle status.
   *
   * Active members can access the organization.
   * Suspended members remain associated with the
   * organization but cannot access it normally.
   */
  status: "active" | "suspended";

  /**
   * Timestamps.
   */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns the MongoDB organization members collection.
 */
export async function getOrganizationMembersCollection() {
  const client = await getMongoClient();

  const db = client.db();

  return db.collection<OrganizationMember>("organization_members");
}

let indexesEnsured = false;
let indexPromise: Promise<void> | null = null;

/**
 * Ensures all required organization membership indexes exist.
 */
export async function ensureOrganizationMemberIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise = getOrganizationMembersCollection()
      .then(async (members) => {
        /**
         * Prevents a user from being added to the
         * same organization more than once.
         */
        await members.createIndex(
          {
            organizationId: 1,
            userId: 1,
          },
          {
            unique: true,
            name: "organization_members_organization_user_unique",
          }
        );

        /**
         * Allows efficient lookup of all organizations
         * belonging to a specific user.
         */
        await members.createIndex(
          {
            userId: 1,
            status: 1,
          },
          {
            name: "organization_members_user_status",
          }
        );

        /**
         * Allows efficient lookup of all members
         * belonging to an organization.
         */
        await members.createIndex(
          {
            organizationId: 1,
            status: 1,
          },
          {
            name: "organization_members_organization_status",
          }
        );
      })
      .catch((error) => {
        indexPromise = null;
        throw error;
      });
  }

  await indexPromise;

  indexesEnsured = true;
}