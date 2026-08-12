import { ObjectId } from "mongodb";
import getMongoClient from "./mongodb";

export interface User {
  _id?: ObjectId;

  // Account information
  name: string;
  email: string;
  password: string;

  // Location information
  country: string;
  timezone: string;
  language: string;
  stateRegion?: string;

  // Workspace information
  role?: string;
  useCases: string[];
  companyName?: string;
  teamSize?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export async function getUsersCollection() {
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB);

  return db.collection<User>("users");
}

let indexesEnsured = false;
let indexPromise: Promise<string> | null = null;

export async function ensureUserIndexes() {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise = getUsersCollection()
      .then((users) =>
        users.createIndex(
          { email: 1 },
          { unique: true }
        )
      )
      .catch((error) => {
        indexPromise = null;
        throw error;
      });
  }

  await indexPromise;

  indexesEnsured = true;
}