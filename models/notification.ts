import { ObjectId } from "mongodb";
import getMongoClient from "@/lib/mongodb";

/* =========================================================
 * TYPES
 * ========================================================= */

export type NotificationType =
  | "organization_invitation"
  | "system";

export type NotificationActionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

/* =========================================================
 * NOTIFICATION MODEL
 * ========================================================= */

export interface Notification {
  _id?: ObjectId;

  /**
   * User who should receive the notification.
   */
  recipientId: ObjectId;

  /**
   * Workspace associated with the notification.
   */
  organizationId?: ObjectId;

  /**
   * Optional user who triggered the notification.
   */
  actorId?: ObjectId;

  /**
   * Notification category.
   */
  type: NotificationType;

  /**
   * Short notification heading.
   */
  title: string;

  /**
   * Notification body.
   */
  message: string;

  /**
   * Invitation associated with this notification.
   */
  invitationId?: ObjectId;

  /**
   * Whether the user has opened/read
   * the notification.
   */
  read: boolean;

  /**
   * Current actionable state of the notification.
   *
   * For organization invitations:
   *
   * pending   -> invitation can still be accepted/declined
   * accepted  -> invitation was accepted
   * declined  -> invitation was declined
   * cancelled -> invitation was cancelled
   * expired   -> invitation expired
   */
  actionStatus?: NotificationActionStatus;

  /**
   * Notification creation timestamp.
   */
  createdAt: Date;

  /**
   * Notification last modification timestamp.
   */
  updatedAt: Date;
}

/* =========================================================
 * COLLECTION
 * ========================================================= */

export async function getNotificationsCollection() {
  const client = await getMongoClient();

  const db = client.db();

  return db.collection<Notification>(
    "notifications"
  );
}

/* =========================================================
 * INDEX MANAGEMENT
 * ========================================================= */

let indexesEnsured = false;

let indexPromise:
  | Promise<void>
  | null = null;

/**
 * Ensures all notification indexes exist.
 *
 * This function is safe to call repeatedly.
 *
 * The promise lock prevents multiple concurrent
 * requests from attempting to create the same
 * indexes at the same time during development.
 */
export async function ensureNotificationIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise =
      getNotificationsCollection()
        .then(async (notifications) => {
          /* -------------------------------------------------
           * 1. USER NOTIFICATIONS
           *
           * Supports:
           *
           * - recipient notifications
           * - unread notifications
           * - newest-first ordering
           * ------------------------------------------------- */

          await notifications.createIndex(
            {
              recipientId: 1,
              read: 1,
              createdAt: -1,
            },
            {
              name:
                "notifications_recipient_read_createdAt",
            }
          );

          /* -------------------------------------------------
           * 2. USER NOTIFICATIONS BY DATE
           *
           * Supports normal notification pagination.
           * ------------------------------------------------- */

          await notifications.createIndex(
            {
              recipientId: 1,
              createdAt: -1,
            },
            {
              name:
                "notifications_recipient_createdAt",
            }
          );

          /* -------------------------------------------------
           * 3. INVITATION LOOKUP
           *
           * Supports finding notifications associated
           * with a specific organization invitation.
           * ------------------------------------------------- */

          await notifications.createIndex(
            {
              invitationId: 1,
            },
            {
              name:
                "notifications_invitationId",
            }
          );

          /* -------------------------------------------------
           * 4. ACTIONABLE INVITATIONS
           *
           * Supports filtering notifications that are
           * currently actionable invitation notifications.
           *
           * Example:
           *
           * {
           *   recipientId,
           *   type: "organization_invitation",
           *   actionStatus: "pending"
           * }
           * ------------------------------------------------- */

          await notifications.createIndex(
            {
              recipientId: 1,
              type: 1,
              actionStatus: 1,
              createdAt: -1,
            },
            {
              name:
                "notifications_recipient_type_actionStatus_createdAt",
            }
          );
        })
        .catch((error) => {
          /*
           * Allow a later request to retry index creation
           * if the initial attempt fails.
           */
          indexPromise = null;

          throw error;
        });
  }

  await indexPromise;

  indexesEnsured = true;
}