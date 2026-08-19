import { ObjectId } from "mongodb";
import getMongoClient from "@/lib/mongodb";

export interface Organization {
  _id?: ObjectId;

  /**
   * Human-readable organization/workspace name.
   */
  name: string;

  /**
   * URL-safe unique identifier.
   *
   * Example: "my-production-studio"
   */
  slug: string;

  /**
   * User who originally created the organization.
   *
   * Organization-level roles are stored separately
   * in organization_members.
   */
  ownerId: ObjectId;

  /**
   * Optional organization description.
   */
  description?: string;

  /**
   * Organization lifecycle status.
   *
   * Active organizations are available for normal use.
   * Archived organizations are retained but should not
   * normally be used for new operations.
   */
  status: "active" | "archived";

  /**
   * Timestamps.
   */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns the MongoDB organizations collection.
 */
export async function getOrganizationsCollection() {
  const client = await getMongoClient();

  const db = client.db();

  return db.collection<Organization>("organizations");
}

let indexesEnsured = false;
let indexPromise: Promise<void> | null = null;

/**
 * Ensures all required organization indexes exist.
 *
 * Indexes:
 *
 * 1. Unique slug
 *    Prevents duplicate organization slugs.
 *
 * 2. Owner ID
 *    Allows efficient lookup of organizations owned
 *    by a specific user.
 *
 * 3. Status
 *    Allows efficient filtering of active/archived
 *    organizations.
 */
export async function ensureOrganizationIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise = getOrganizationsCollection()
      .then(async (organizations) => {
        /**
         * Unique, case-insensitive organization slug.
         *
         * Example:
         * "My-Studio" and "my-studio"
         * cannot both exist.
         */
        await organizations.createIndex(
          {
            slug: 1,
          },
          {
            unique: true,
            name: "organizations_slug_unique",
            collation: {
              locale: "en",
              strength: 2,
            },
          }
        );

        /**
         * Efficient lookup of organizations owned by
         * a specific user, especially when filtering
         * by organization status.
         */
        await organizations.createIndex(
          {
            ownerId: 1,
            status: 1,
          },
          {
            name: "organizations_ownerId_status",
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