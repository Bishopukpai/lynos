"use client";

import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";
import InviteMemberModal from "@/components/InviteMemberModal";
import CreateProjectModal from "@/components/CreateProjectModal";
import { AddProjectMemberModal } from "@/components/AddProjectMemberModal";

import type { ProjectMember } from "@/hooks/useProjectMembers";
import type { ProjectMemberRole } from "@/models/ProjectMember";

interface DashboardModalsProps {
  createWorkspaceOpen: boolean;
  setCreateWorkspaceOpen: (open: boolean) => void;

  workspaceName: string;
  setWorkspaceName: (value: string) => void;

  workspaceDescription: string;
  setWorkspaceDescription: (value: string) => void;

  creatingWorkspace: boolean;
  createWorkspaceError: string | null;

  handleCreateWorkspace: (
    event: React.FormEvent
  ) => Promise<void>;

  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;

  inviteEmail: string;
  setInviteEmail: (value: string) => void;

  inviteRole: "admin" | "member";
  setInviteRole: (value: "admin" | "member") => void;

  sendingInvite: boolean;
  inviteError: string | null;
  inviteSuccess: string | null;

  handleSendInvitation: (
    event: React.FormEvent
  ) => Promise<void>;

  createProjectOpen: boolean;
  setCreateProjectOpen: (open: boolean) => void;

  creatingProject: boolean;
  createProjectError: string | null;

  handleCreateProject: (formData: {
    title: string;
    description: string;
    genre: string;
    budget: number;
    targetAudience: string;
  }) => Promise<void>;

  isAddProjectMemberModalOpen: boolean;
  setIsAddProjectMemberModalOpen: (open: boolean) => void;

  selectedProjectId: string | null;

  members: ProjectMember[];
  addingMember: boolean;
  projectMemberError: string | null;

  addProjectMember: (
    identifier: string,
    role: ProjectMemberRole
  ) => Promise<boolean>;
}

export default function DashboardModals({
  createWorkspaceOpen,
  setCreateWorkspaceOpen,
  workspaceName,
  setWorkspaceName,
  workspaceDescription,
  setWorkspaceDescription,
  creatingWorkspace,
  createWorkspaceError,
  handleCreateWorkspace,

  inviteModalOpen,
  setInviteModalOpen,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  sendingInvite,
  inviteError,
  inviteSuccess,
  handleSendInvitation,

  createProjectOpen,
  setCreateProjectOpen,
  creatingProject,
  createProjectError,
  handleCreateProject,

  isAddProjectMemberModalOpen,
  setIsAddProjectMemberModalOpen,
  selectedProjectId,
  members,
  addingMember,
  projectMemberError,
  addProjectMember,
}: DashboardModalsProps) {
  return (
    <>
      {/* Create Workspace */}
      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() =>
          setCreateWorkspaceOpen(false)
        }
        workspaceName={workspaceName}
        setWorkspaceName={setWorkspaceName}
        workspaceDescription={
          workspaceDescription
        }
        setWorkspaceDescription={
          setWorkspaceDescription
        }
        creatingWorkspace={creatingWorkspace}
        createWorkspaceError={
          createWorkspaceError
        }
        onSubmit={handleCreateWorkspace}
      />

      {/* Invite Workspace Member */}
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() =>
          setInviteModalOpen(false)
        }
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        sendingInvite={sendingInvite}
        inviteError={inviteError}
        inviteSuccess={inviteSuccess}
        onSubmit={handleSendInvitation}
      />

      {/* Create Project */}
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() =>
          setCreateProjectOpen(false)
        }
        creating={creatingProject}
        error={createProjectError}
        onSubmit={handleCreateProject}
      />

      {/* Add Project Member */}
      {selectedProjectId && (
        <AddProjectMemberModal
          isOpen={isAddProjectMemberModalOpen}
          onClose={() =>
            setIsAddProjectMemberModalOpen(false)
          }
          onSubmit={addProjectMember}
          isLoading={addingMember}
          error={projectMemberError}
          members={members}
          loadingMembers={false}
        />
      )}
    </>
  );
}