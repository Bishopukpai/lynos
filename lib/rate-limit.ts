import { ObjectId } from "mongodb";

import getMongoClientPromise from "@/lib/mongodb";

const RATE_LIMIT_COLLECTION = "auth_rate_limits";

// Maximum number of failed attempts allowed within the window.
const MAX_FAILED_ATTEMPTS = 5;

// Number of milliseconds in the failed-attempt window.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// How long a user/IP combination remains locked after reaching the limit.
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// MongoDB automatically removes records after this amount of inactivity.
const TTL_SECONDS = 60 * 60; // 1 hour

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
 * Ensures the indexes required by the rate limiter exist.
 *
 * The initialization is cached so we don't repeatedly attempt to
 * create the same indexes during authentication requests.
 */
let indexesEnsured = false;
let indexPromise: Promise<void> | null = null;

export async function ensureRateLimitIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise = getRateLimitCollection()
      .then(async (collection) => {
        // Ensures one rate-limit record exists per email + IP combination.
        await collection.createIndex(
          { key: 1 },
          {
            unique: true,
          }
        );

        // Automatically remove old rate-limit records.
        await collection.createIndex(
          { lastAttemptAt: 1 },
          {
            expireAfterSeconds: TTL_SECONDS,
          }
        );
      })
      .catch((error) => {
        // Allow a later request to retry initialization if it failed.
        indexPromise = null;
        throw error;
      });
  }

  await indexPromise;

  indexesEnsured = true;
}

/**
 * Normalizes an email address before it is used in the rate-limit key.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Creates the identifier used by the rate limiter.
 *
 * The combination of email + IP means that repeated failed attempts
 * against one account from one IP are throttled.
 */
function createRateLimitKey(email: string, ip: string): string {
  return `${normalizeEmail(email)}:${ip}`;
}

/**
 * Checks whether another sign-in attempt is currently allowed.
 */
export async function checkSignInRateLimit(
  email: string,
  ip: string
): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
}> {
  await ensureRateLimitIndexes();

  const collection = await getRateLimitCollection();
  const key = createRateLimitKey(email, ip);

  const record = await collection.findOne({ key });

  // No previous failures.
  if (!record) {
    return {
      allowed: true,
    };
  }

  const now = Date.now();

  /*
   * Check active lockout first.
   */
  if (record.lockedUntil) {
    const lockedUntilMs = record.lockedUntil.getTime();

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

  /*
   * Check whether the failed-attempt window has expired.
   */
  const firstAttemptMs = record.firstAttemptAt.getTime();

  if (now - firstAttemptMs >= WINDOW_MS) {
    await collection.deleteOne({ key });

    return {
      allowed: true,
    };
  }

  /*
   * Check whether the maximum number of failures has been reached.
   */
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil(
      (firstAttemptMs + WINDOW_MS - now) / 1000
    );

    return {
      allowed: false,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Records a failed sign-in attempt.
 *
 * Uses an atomic MongoDB increment for existing records to reduce
 * race-condition problems when multiple requests arrive simultaneously.
 */
export async function recordFailedSignIn(
  email: string,
  ip: string
): Promise<void> {
  await ensureRateLimitIndexes();

  const collection = await getRateLimitCollection();

  const key = createRateLimitKey(email, ip);

  const now = new Date();
  const nowMs = now.getTime();

  const existingRecord = await collection.findOne({ key });

  /*
   * No existing record or the previous attempt window has expired.
   *
   * Start a new window.
   */
  if (
    !existingRecord ||
    nowMs - existingRecord.firstAttemptAt.getTime() >= WINDOW_MS
  ) {
    await collection.updateOne(
      { key },
      {
        $set: {
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

  /*
   * Atomically increment the failure count.
   */
  const updatedRecord = await collection.findOneAndUpdate(
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

  /*
   * Lock the email + IP combination once the maximum
   * number of failed attempts has been reached.
   */
  if (
    updatedRecord &&
    updatedRecord.failedAttempts >= MAX_FAILED_ATTEMPTS &&
    !updatedRecord.lockedUntil
  ) {
    await collection.updateOne(
      {
        key,
        lockedUntil: {
          $exists: false,
        },
      },
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
 * Clears the failed sign-in history after a successful login.
 */
export async function clearSignInRateLimit(
  email: string,
  ip: string
): Promise<void> {
  await ensureRateLimitIndexes();

  const collection = await getRateLimitCollection();

  const key = createRateLimitKey(email, ip);

  await collection.deleteOne({ key });
}