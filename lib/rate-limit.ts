import { ObjectId } from "mongodb";
import getMongoClientPromise from "@/lib/mongodb";

const RATE_LIMIT_COLLECTION = "auth_rate_limits";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

interface RateLimitRecord {
  _id?: ObjectId;
  key: string;
  failedAttempts: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
  lockedUntil?: Date;
}

async function getRateLimitCollection() {
  const client = await getMongoClientPromise();
  const db = client.db(process.env.MONGODB_DB);

  return db.collection<RateLimitRecord>(RATE_LIMIT_COLLECTION);
}

/**
 * Creates the indexes required by the rate-limit collection.
 *
 * The unique key prevents duplicate records for the same
 * email + IP combination.
 *
 * The TTL index is only for database cleanup.
 * Actual lockout enforcement is handled by checkSignInRateLimit().
 */
export async function ensureRateLimitIndexes() {
  const collection = await getRateLimitCollection();

  await collection.createIndex(
    { key: 1 },
    { unique: true }
  );

  await collection.createIndex(
    { lastAttemptAt: 1 },
    { expireAfterSeconds: 15 * 60 }
  );
}

/**
 * Creates a rate-limit key using both the normalized email
 * address and the originating IP address.
 */
function createRateLimitKey(
  email: string,
  ip: string
): string {
  return `${email.toLowerCase().trim()}:${ip}`;
}

/**
 * Checks whether a sign-in attempt is currently allowed.
 */
export async function checkSignInRateLimit(
  email: string,
  ip: string
): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
}> {
  const collection = await getRateLimitCollection();
  const key = createRateLimitKey(email, ip);

  const record = await collection.findOne({ key });

  if (!record) {
    return {
      allowed: true,
    };
  }

  const now = Date.now();

  /**
   * Check active lockout.
   */
  if (record.lockedUntil) {
    const lockedUntilMs =
      record.lockedUntil.getTime();

    if (lockedUntilMs > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(
          (lockedUntilMs - now) / 1000
        ),
      };
    }

    // Lockout has expired.
    await collection.deleteOne({ key });

    return {
      allowed: true,
    };
  }

  /**
   * Check whether the current failure window has expired.
   */
  const firstAttemptMs =
    record.firstAttemptAt.getTime();

  if (now - firstAttemptMs >= WINDOW_MS) {
    await collection.deleteOne({ key });

    return {
      allowed: true,
    };
  }

  /**
   * Five failed attempts means the account/IP
   * combination is temporarily blocked.
   */
  if (
    record.failedAttempts >=
    MAX_FAILED_ATTEMPTS
  ) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (firstAttemptMs + WINDOW_MS - now) / 1000
      ),
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Records a failed sign-in attempt.
 *
 * Failed attempts are tracked separately for each
 * email + IP combination.
 */
export async function recordFailedSignIn(
  email: string,
  ip: string
): Promise<void> {
  const collection = await getRateLimitCollection();

  const key = createRateLimitKey(email, ip);
  const now = new Date();
  const nowMs = now.getTime();

  const record = await collection.findOne({ key });

  /**
   * Start a new failure window if:
   *
   * - no record exists, or
   * - the previous failure window expired.
   */
  if (
    !record ||
    nowMs -
      record.firstAttemptAt.getTime() >=
      WINDOW_MS
  ) {
    await collection.updateOne(
      { key },
      {
        $set: {
          key,
          failedAttempts: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
        },
        $unset: {
          lockedUntil: "",
        },
      },
      {
        upsert: true,
      }
    );

    return;
  }

  /**
   * Atomically increment the failed-attempt counter.
   */
  const updatedRecord =
    await collection.findOneAndUpdate(
      { key },
      {
        $inc: {
          failedAttempts: 1,
        },
        $set: {
          lastAttemptAt: now,
        },
      },
      {
        returnDocument: "after",
      }
    );

  /**
   * Lock the email + IP combination after
   * the fifth failed attempt.
   */
  if (
    updatedRecord &&
    updatedRecord.failedAttempts >=
      MAX_FAILED_ATTEMPTS &&
    !updatedRecord.lockedUntil
  ) {
    await collection.updateOne(
      { key },
      {
        $set: {
          lockedUntil: new Date(
            nowMs + LOCKOUT_MS
          ),
        },
      }
    );
  }
}

/**
 * Clears the failed-login record after
 * a successful authentication.
 */
export async function clearSignInRateLimit(
  email: string,
  ip: string
): Promise<void> {
  const collection = await getRateLimitCollection();

  const key = createRateLimitKey(email, ip);

  await collection.deleteOne({ key });
}