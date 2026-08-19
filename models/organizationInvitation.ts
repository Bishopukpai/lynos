import { ObjectId } from "mongodb";
import getMongoClient from "@/lib/mongodb";

export type OrganizationInvitationRole =
  | "admin"
  | "member";

export type OrganizationInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export interface OrganizationInvitation {
  _id?: ObjectId;

  /**
   * Organization/workspace the invitation belongs to.
   */
  organizationId: ObjectId;

  /**
   * Email address the invitation was sent to.
   *
   * Stored in normalized lowercase form.
   */
  email: string;

  /**
   * Role the invited user will receive
   * after accepting the invitation.
   */
  role: OrganizationInvitationRole;

  /**
   * Secure hash of the invitation token.
   *
   * The raw token is never stored in MongoDB.
   */
  tokenHash: string;

  /**
   * User who created the invitation.
   */
  invitedBy: ObjectId;

  /**
   * Invitation lifecycle status.
   */
  status: OrganizationInvitationStatus;

  /**
   * Invitation expiration time.
   */
  expiresAt: Date;

  /**
   * User who accepted the invitation.
   *
   * Only populated after acceptance.
   */
  acceptedBy?: ObjectId;

  /**
   * Time the invitation was accepted.
   */
  acceptedAt?: Date;

  /**
   * Time the invitation was declined.
   */
  declinedAt?: Date;

  /**
   * Time the invitation was cancelled.
   */
  cancelledAt?: Date;

  /**
   * Timestamps.
   */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns the MongoDB organization invitations collection.
 *
 * IMPORTANT:
 *
 * The database name is already embedded inside MONGODB_URI.
 *
 * Therefore we deliberately use:
 *
 *     client.db()
 *
 * and DO NOT read MONGODB_DB separately.
 */
export async function getOrganizationInvitationsCollection() {
  const client = await getMongoClient();

  const db = client.db();

  return db.collection<OrganizationInvitation>(
    "organization_invitations"
  );
}

let indexesEnsured = false;
let indexPromise: Promise<void> | null = null;

/**
 * Ensures all required organization invitation indexes exist.
 */
export async function ensureOrganizationInvitationIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise = getOrganizationInvitationsCollection()
      .then(async (invitations) => {
        /**
         * Prevents the same token hash from being stored
         * more than once.
         */
        await invitations.createIndex(
          {
            tokenHash: 1,
          },
          {
            unique: true,
            name: "organization_invitations_tokenHash_unique",
          }
        );

        /**
         * Allows efficient lookup of invitations belonging
         * to a specific organization.
         */
        await invitations.createIndex(
          {
            organizationId: 1,
            status: 1,
          },
          {
            name: "organization_invitations_organization_status",
          }
        );

        /**
         * Allows efficient lookup of invitations sent
         * to a specific email address.
         */
        await invitations.createIndex(
          {
            email: 1,
            status: 1,
          },
          {
            name: "organization_invitations_email_status",
          }
        );

        /**
         * Allows efficient lookup of invitations created
         * by a specific user.
         */
        await invitations.createIndex(
          {
            invitedBy: 1,
            status: 1,
          },
          {
            name: "organization_invitations_invitedBy_status",
          }
        );

        /**
         * Allows efficient cleanup and expiration queries.
         */
        await invitations.createIndex(
          {
            expiresAt: 1,
          },
          {
            name: "organization_invitations_expiresAt",
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