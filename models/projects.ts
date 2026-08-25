import { ObjectId } from "mongodb";
import getMongoClient from "@/lib/mongodb";

export const PRODUCTION_STATUS = {
  IDEA: "IDEA",
  PRE_PRODUCTION: "PRE_PRODUCTION",
  IN_PRODUCTION: "IN_PRODUCTION",
  POST_PRODUCTION: "POST_PRODUCTION",
  COMPLETED: "COMPLETED",
} as const;

export type ProductionStatus =
  (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];

export interface Project {
  _id?: ObjectId;

  organizationId: ObjectId;

  title: string;

  description: string;

  genre: string;

  budget: number;

  targetAudience: string;

  productionStatus: ProductionStatus;

  createdBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

/**
 * Returns the MongoDB projects collection.
 */
export async function getProjectsCollection() {
  const client = await getMongoClient();

  const db = client.db();

  return db.collection<Project>("projects");
}

/**
 * Ensures all required project indexes exist.
 */
let indexesEnsured = false;
let indexPromise: Promise<void> | null = null;

export async function ensureProjectIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise = getProjectsCollection()
      .then(async (projects) => {
        /**
         * Efficiently retrieve projects belonging
         * to an organization.
         */
        await projects.createIndex(
          {
            organizationId: 1,
            createdAt: -1,
          },
          {
            name: "projects_organization_createdAt",
          }
        );

        /**
         * Efficiently retrieve projects created
         * by a specific user.
         */
        await projects.createIndex(
          {
            createdBy: 1,
            createdAt: -1,
          },
          {
            name: "projects_createdBy_createdAt",
          }
        );

        /**
         * Efficiently filter projects by
         * production status.
         */
        await projects.createIndex(
          {
            productionStatus: 1,
          },
          {
            name: "projects_productionStatus",
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