import { useState, useEffect, useCallback } from "react";
import { TaskStatus, TaskPriority } from "@/types/task";

export interface TaskMember {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

export interface TaskComment {
  _id: string;
  author: TaskMember;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  _id: string;
  actor: TaskMember;
  action: string;
  details?: string;
  createdAt: string;
}

export interface TaskItem {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: TaskMember;
  createdById: TaskMember;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  comments: TaskComment[];
  activities: TaskActivity[];
  createdAt: string;
}

export function useProjectTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch tasks");
      setTasks(data.tasks);
    } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError("An unexpected error occurred");
  }
} finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    if (isMounted) {
      await fetchTasks();
    }
  };

  loadData();

  return () => {
    isMounted = false;
  };
}, [fetchTasks]);

  const createTask = async (payload: {
    title: string;
    description?: string;
    assigneeId?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
  }) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create task");
    setTasks((prev) => [data.task, ...prev]);
    return data.task;
  };

  const updateTask = async (
    taskId: string,
    updates: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      comment?: string;
      title?: string;
      description?: string;
      dueDate?: string;
    }
  ) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update task");

    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? data.task : t))
    );
    return data.task;
  };

  return {
    tasks,
    loading,
    error,
    refreshTasks: fetchTasks,
    createTask,
    updateTask,
  };
}