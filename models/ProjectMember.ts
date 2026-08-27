import { ObjectId } from "mongodb";
import getMongoClient from "@/lib/mongodb";

export type ProjectMemberRole =
  | "admin"
  | "producer"
  | "director"
  | "editor"
  | "writer"
  | "cinematographer"
  | "designer"
  | "member";

export interface ProjectMember {
  _id?: ObjectId;

  /**
   * Project this membership belongs to.
   */
  projectId: ObjectId;

  /**
   * Organization this project belongs to.
   *
   * This allows us to enforce organization-level
   * membership when managing project members.
   */
  organizationId: ObjectId;

  /**
   * User assigned to the project.
   */
  userId: ObjectId;

  /**
   * User's role within this project.
   */
  role: ProjectMemberRole;

  /**
   * Timestamps.
   */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns the MongoDB project members collection.
 */
export async function getProjectMembersCollection() {
  const client = await getMongoClient();

  const db = client.db();

  return db.collection<ProjectMember>("project_members");
}

let indexesEnsured = false;
let indexPromise: Promise<void> | null = null;

/**
 * Ensures all required project membership indexes exist.
 */
export async function ensureProjectMemberIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (!indexPromise) {
    indexPromise = getProjectMembersCollection()
      .then(async (members) => {
        /**
         * Prevents the same user from being added
         * to the same project more than once.
         */
        await members.createIndex(
          {
            projectId: 1,
            userId: 1,
          },
          {
            unique: true,
            name: "project_members_project_user_unique",
          }
        );

        /**
         * Efficiently retrieve all members of a project.
         */
        await members.createIndex(
          {
            projectId: 1,
            role: 1,
          },
          {
            name: "project_members_project_role",
          }
        );

        /**
         * Efficiently retrieve all projects
         * belonging to a specific user.
         */
        await members.createIndex(
          {
            userId: 1,
            projectId: 1,
          },
          {
            name: "project_members_user_project",
          }
        );

        /**
         * Efficiently scope project membership
         * to an organization.
         */
        await members.createIndex(
          {
            organizationId: 1,
            projectId: 1,
          },
          {
            name: "project_members_organization_project",
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