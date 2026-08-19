import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { authOptions } from "@/lib/auth";

import {
  getNotificationsCollection,
  ensureNotificationIndexes,
} from "@/models/notification";

/* =========================================================
 * VALIDATION
 * ========================================================= */

const markNotificationReadSchema = z.object({
  notificationId: z
    .string()
    .trim()
    .min(1, "Notification ID is required.")
    .max(64, "Invalid notification ID."),

  read: z.boolean(),
});

/* =========================================================
 * HELPERS
 * ========================================================= */

/**
 * Safely converts a MongoDB ObjectId to a string.
 */
function serializeObjectId(
  value?: ObjectId | null
): string | null {
  return value ? value.toString() : null;
}

/**
 * Converts a query parameter into a positive integer.
 */
function parsePositiveInteger(
  value: string | null,
  defaultValue: number
): number | null {
  if (value === null) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return null;
  }

  return parsed;
}

/* =========================================================
 * GET
 * ========================================================= */

/**
 * GET /api/notifications
 *
 * Returns notifications belonging to the
 * authenticated user.
 *
 * Supported query parameters:
 *
 * ?page=1
 * ?limit=20
 * ?unreadOnly=true
 * ?organizationId=<organizationId>
 */
export async function GET(
  request: Request
) {
  try {
    /* -------------------------------------------------------
     * 1. AUTHENTICATION
     * ------------------------------------------------------- */

    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* -------------------------------------------------------
     * 2. VALIDATE AUTHENTICATED USER ID
     * ------------------------------------------------------- */

    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          error:
            "Invalid authenticated user.",
        },
        {
          status: 401,
        }
      );
    }

    const recipientId =
      new ObjectId(session.user.id);

    /* -------------------------------------------------------
     * 3. GET COLLECTION
     * ------------------------------------------------------- */

    const notifications =
      await getNotificationsCollection();

    /* -------------------------------------------------------
     * 4. ENSURE INDEXES
     * ------------------------------------------------------- */

    await ensureNotificationIndexes();

    /* -------------------------------------------------------
     * 5. QUERY PARAMETERS
     * ------------------------------------------------------- */

    const url =
      new URL(request.url);

    const pageParameter =
      url.searchParams.get("page");

    const limitParameter =
      url.searchParams.get("limit");

    const unreadOnlyParameter =
      url.searchParams.get("unreadOnly");

    const organizationIdParameter =
      url.searchParams.get(
        "organizationId"
      );

    /* -------------------------------------------------------
     * 6. PAGINATION
     * ------------------------------------------------------- */

    const page =
      parsePositiveInteger(
        pageParameter,
        1
      );

    if (page === null) {
      return NextResponse.json(
        {
          error:
            "Page must be a positive integer.",
        },
        {
          status: 400,
        }
      );
    }

    const limit =
      parsePositiveInteger(
        limitParameter,
        20
      );

    if (limit === null || limit > 100) {
      return NextResponse.json(
        {
          error:
            "Limit must be an integer between 1 and 100.",
        },
        {
          status: 400,
        }
      );
    }

    const skip =
      (page - 1) * limit;

    /* -------------------------------------------------------
     * 7. UNREAD FILTER
     * ------------------------------------------------------- */

    let unreadOnly = false;

    if (
      unreadOnlyParameter !== null
    ) {
      if (
        unreadOnlyParameter !== "true" &&
        unreadOnlyParameter !== "false"
      ) {
        return NextResponse.json(
          {
            error:
              "unreadOnly must be either true or false.",
          },
          {
            status: 400,
          }
        );
      }

      unreadOnly =
        unreadOnlyParameter === "true";
    }

    /* -------------------------------------------------------
     * 8. ORGANIZATION FILTER
     * ------------------------------------------------------- */

    let organizationObjectId:
      | ObjectId
      | undefined;

    if (
      organizationIdParameter !== null
    ) {
      if (
        !ObjectId.isValid(
          organizationIdParameter
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid organization ID.",
          },
          {
            status: 400,
          }
        );
      }

      organizationObjectId =
        new ObjectId(
          organizationIdParameter
        );
    }

    /* -------------------------------------------------------
     * 9. BUILD QUERY
     * ------------------------------------------------------- */

    const query: {
      recipientId: ObjectId;
      read?: boolean;
      organizationId?: ObjectId;
    } = {
      recipientId,
    };

    if (unreadOnly) {
      query.read = false;
    }

    if (organizationObjectId) {
      query.organizationId =
        organizationObjectId;
    }

    /* -------------------------------------------------------
     * 10. QUERY NOTIFICATIONS
     * ------------------------------------------------------- */

    const [
      notificationDocuments,
      total,
      unreadCount,
    ] = await Promise.all([
      notifications
        .find(query)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .toArray(),

      notifications.countDocuments(
        query
      ),

      notifications.countDocuments({
        recipientId,

        read: false,

        ...(organizationObjectId
          ? {
              organizationId:
                organizationObjectId,
            }
          : {}),
      }),
    ]);

    /* -------------------------------------------------------
     * 11. SERIALIZE NOTIFICATIONS
     * ------------------------------------------------------- */

    const serializedNotifications =
      notificationDocuments.map(
        (notification) => ({
          id:
            serializeObjectId(
              notification._id
            ),

          recipientId:
            notification.recipientId.toString(),

          organizationId:
            serializeObjectId(
              notification.organizationId
            ),

          actorId:
            serializeObjectId(
              notification.actorId
            ),

          invitationId:
            serializeObjectId(
              notification.invitationId
            ),

          type:
            notification.type,

          title:
            notification.title,

          message:
            notification.message,

          read:
            notification.read,

          actionStatus:
            notification.actionStatus ??
            null,

          createdAt:
            notification.createdAt,

          updatedAt:
            notification.updatedAt,
        })
      );

    /* -------------------------------------------------------
     * 12. PAGINATION METADATA
     * ------------------------------------------------------- */

    const totalPages =
      Math.ceil(
        total / limit
      );

    const hasNextPage =
      skip +
        notificationDocuments.length <
      total;

    const hasPreviousPage =
      page > 1;

    /* -------------------------------------------------------
     * 13. RETURN RESPONSE
     * ------------------------------------------------------- */

    return NextResponse.json(
      {
        notifications:
          serializedNotifications,

        unreadCount,

        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while loading notifications.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
 * PATCH
 * ========================================================= */

/**
 * PATCH /api/notifications
 *
 * Marks one notification as read or unread.
 *
 * Request body:
 *
 * {
 *   "notificationId": "...",
 *   "read": true
 * }
 *
 * IMPORTANT:
 *
 * This endpoint only changes the `read` field.
 *
 * It does NOT change `actionStatus`.
 *
 * Invitation action states must only be changed by:
 *
 * POST /api/notifications/[notificationId]/accept
 *
 * POST /api/notifications/[notificationId]/decline
 */
export async function PATCH(
  request: Request
) {
  try {
    /* -------------------------------------------------------
     * 1. AUTHENTICATION
     * ------------------------------------------------------- */

    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* -------------------------------------------------------
     * 2. VALIDATE USER ID
     * ------------------------------------------------------- */

    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          error:
            "Invalid authenticated user.",
        },
        {
          status: 401,
        }
      );
    }

    const recipientId =
      new ObjectId(session.user.id);

    /* -------------------------------------------------------
     * 3. PARSE REQUEST BODY
     * ------------------------------------------------------- */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
     * 4. VALIDATE REQUEST
     * ------------------------------------------------------- */

    const validation =
      markNotificationReadSchema.safeParse(
        body
      );

    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            "Invalid notification data.",

          details:
            validation.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      notificationId,
      read,
    } = validation.data;

    /* -------------------------------------------------------
     * 5. VALIDATE NOTIFICATION ID
     * ------------------------------------------------------- */

    if (
      !ObjectId.isValid(
        notificationId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid notification ID.",
        },
        {
          status: 400,
        }
      );
    }

    const notificationObjectId =
      new ObjectId(
        notificationId
      );

    /* -------------------------------------------------------
     * 6. GET COLLECTION
     * ------------------------------------------------------- */

    const notifications =
      await getNotificationsCollection();

    await ensureNotificationIndexes();

    /* -------------------------------------------------------
     * 7. FIND NOTIFICATION
     * ------------------------------------------------------- */

    const existingNotification =
      await notifications.findOne({
        _id:
          notificationObjectId,

        recipientId,
      });

    if (!existingNotification) {
      return NextResponse.json(
        {
          error:
            "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
     * 8. UPDATE READ STATE
     * ------------------------------------------------------- */

    const now = new Date();

    const result =
      await notifications.updateOne(
        {
          _id:
            notificationObjectId,

          recipientId,
        },
        {
          $set: {
            read,
            updatedAt: now,
          },
        }
      );

    /* -------------------------------------------------------
     * 9. VERIFY UPDATE
     * ------------------------------------------------------- */

    if (
      result.matchedCount !== 1
    ) {
      return NextResponse.json(
        {
          error:
            "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
     * 10. RETURN SUCCESS
     * ------------------------------------------------------- */

    return NextResponse.json(
      {
        message:
          read
            ? "Notification marked as read."
            : "Notification marked as unread.",

        notification: {
          id:
            notificationObjectId.toString(),

          recipientId:
            recipientId.toString(),

          read,

          actionStatus:
            existingNotification.actionStatus ??
            null,

          updatedAt: now,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update notification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating the notification.",
      },
      {
        status: 500,
      }
    );
  }
}