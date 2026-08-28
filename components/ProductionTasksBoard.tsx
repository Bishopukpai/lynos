"use client";

import { useState } from "react";
import {
  Clock,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "@/types/task";
import { useProjectTasks, TaskItem } from "@/hooks/useProjectTasks";
import { ProjectMember } from "@/hooks/useProjectMembers";

const STATUS_COLUMNS: { label: string; value: TaskStatus; style: string }[] = [
  { label: "Backlog", value: TaskStatus.BACKLOG, style: "bg-slate-100 text-slate-700" },
  { label: "To Do", value: TaskStatus.TODO, style: "bg-amber-50 text-amber-700" },
  { label: "In Production", value: TaskStatus.IN_PROGRESS, style: "bg-indigo-50 text-indigo-700" },
  { label: "In Review", value: TaskStatus.IN_REVIEW, style: "bg-purple-50 text-purple-700" },
  { label: "Done", value: TaskStatus.DONE, style: "bg-emerald-50 text-emerald-700" },
];

const PRIORITY_BADGES: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "bg-slate-100 text-slate-600",
  [TaskPriority.MEDIUM]: "bg-blue-50 text-blue-700",
  [TaskPriority.HIGH]: "bg-orange-50 text-orange-700",
  [TaskPriority.URGENT]: "bg-red-50 text-red-700 font-semibold",
};

interface Props {
  projectId: string;
  members?: ProjectMember[];
}

/**
  Helper function to extract user details safely whether ProjectMember represents:
  1. A direct user object ({ _id, name, email })
  2. A membership document containing a nested user ({ _id, userId: { _id, name, email } })
 */
function getMemberDetails(member: unknown): { id: string; name: string } {
  const m = member as Record<string, unknown> | null | undefined;
  const userObj = (m?.userId || m?.user || m) as Record<string, unknown> | null | undefined;

  const id = typeof userObj?._id === "string" ? userObj._id : typeof m?._id === "string" ? m._id : "";
  const name =
    (typeof userObj?.name === "string" && userObj.name) ||
    (typeof userObj?.email === "string" && userObj.email) ||
    (typeof m?.name === "string" && m.name) ||
    (typeof m?.email === "string" && m.email) ||
    "Unnamed Member";

  return { id, name };
}

export default function ProductionTasksBoard({ projectId, members = [] }: Props) {
  const { tasks, error, createTask, updateTask } = useProjectTasks(projectId);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newComment, setNewComment] = useState("");

  // New task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({
      title,
      description,
      priority,
      status,
      dueDate,
      ...(assigneeId ? { assigneeId } : {}),
    });
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setIsCreating(false);
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    const updated = await updateTask(selectedTask._id, { comment: newComment });
    if (updated) setSelectedTask(updated);
    setNewComment("");
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const updated = await updateTask(taskId, { status: newStatus });
    if (updated && selectedTask?._id === taskId) setSelectedTask(updated);
  };

  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    const updated = await updateTask(taskId, { assigneeId: newAssigneeId || null });
    if (updated && selectedTask?._id === taskId) setSelectedTask(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Production Tasks</h2>
          <p className="text-xs text-slate-500">
            Track asset creation, reviews, and workflow progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Task Kanban Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {STATUS_COLUMNS.map((col) => {
          const colTasks = tasks?.filter((t) => t.status === col.value) || [];

          return (
            <div
              key={col.value}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${col.style}`}>
                  {col.label}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                        {task.title}
                      </h4>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold ${
                          PRIORITY_BADGES[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-2">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-slate-400" />
                            {task.comments.length}
                          </span>
                        )}
                      </div>

                      {task.assigneeId && (
                        <span className="font-semibold text-slate-600">
                          {typeof task.assigneeId === "object" ? task.assigneeId.name : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">New Production Task</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                placeholder="e.g. Render scene sequence 04"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                placeholder="Add asset requirements or context..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  {Object.values(TaskPriority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  {STATUS_COLUMNS.map((col) => (
                    <option key={col.value} value={col.value}>{col.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {members.map((m, index) => {
                    const { id, name } = getMemberDetails(m);
                    return (
                      <option key={id || `create-member-${index}`} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Details Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Task Details
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 flex-1">
              <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
              {selectedTask.description && (
                <p className="text-xs text-slate-600">{selectedTask.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">Status:</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) =>
                      handleStatusChange(selectedTask._id, e.target.value as TaskStatus)
                    }
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold"
                  >
                    {STATUS_COLUMNS.map((col) => (
                      <option key={col.value} value={col.value}>{col.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">Assignee:</label>
                  <select
                    value={
                      typeof selectedTask.assigneeId === "object"
                        ? selectedTask.assigneeId?._id || ""
                        : selectedTask.assigneeId || ""
                    }
                    onChange={(e) =>
                      handleAssigneeChange(selectedTask._id, e.target.value)
                    }
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m, index) => {
                      const { id, name } = getMemberDetails(m);
                      return (
                        <option key={id || `member-${index}`} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Task Activity Audit Feed */}
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-900 mb-3">Activity Log</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTask.activities?.map((act) => (
                    <div key={act._id} className="text-[11px] text-slate-500 flex justify-between">
                      <span>
                        <strong className="text-slate-700">{act.actor?.name || "System"}</strong>:{" "}
                        {act.details}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Feed */}
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-900 mb-3">Comments</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {selectedTask.comments?.map((c) => (
                    <div key={c._id} className="rounded-xl bg-slate-50 p-3 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>{c.author?.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600">{c.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddComment}
                    className="rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}