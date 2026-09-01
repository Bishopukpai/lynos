"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, ListPlus, Send, Loader2 } from "lucide-react";
import { AIAssistantResponse } from "@/lib/ai/schemas";

interface Props {
  projectId: string;
  onTasksCreated?: () => void;
}

export default function ScenePilotAI({ projectId, onTasksCreated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIAssistantResponse | null>(null);
  const [savingTasks, setSavingTasks] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAskAI = async (customPrompt?: string) => {
    const query = customPrompt || prompt;
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    setSavedSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "AI request failed");
      }

      const data: AIAssistantResponse = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      console.error("AI prompt error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to fetch AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndSaveTasks = async () => {
    if (!response?.generatedTasks || response.generatedTasks.length === 0) return;
    setSavingTasks(true);
    setSaveError(null);

    try {
      // Execute creation requests concurrently for all generated tasks
      const taskPromises = response.generatedTasks.map(async (task) => {
        // Fallback and normalize values to uppercase matching backend enums
        const normalizedPriority = task.priority
          ? task.priority.toString().toUpperCase()
          : "MEDIUM";

        const res = await fetch(`/api/projects/${projectId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description || "",
            department: task.department || "General",
            priority: normalizedPriority,
            status: "TODO",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to create task: "${task.title}"`);
        }

        return res.json();
      });

      await Promise.all(taskPromises);

      setSavedSuccess(true);

      // Trigger board or list refresh
      if (onTasksCreated) {
        onTasksCreated();
      }
    } catch (err: unknown) {
      console.error("Failed to save tasks:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to save generated tasks"
      );
    } finally {
      setSavingTasks(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-indigo-100 bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            ScenePilot AI Production Intelligence
          </h3>
          <p className="text-xs text-slate-500">
            Contextual insights, risk assessment, and automated task breakdowns.
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {[
          "What are the biggest risks for this production?",
          "Create tasks for pre-production.",
          "Summarize the current production status.",
          "Generate a schedule for the next two weeks.",
        ].map((q, i) => (
          <button
            key={i}
            onClick={() => {
              setPrompt(q);
              void handleAskAI(q);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Prompt Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleAskAI();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask ScenePilot AI anything about your project context..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Ask AI
        </button>
      </form>

      {/* Output Render Area */}
      {response && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Summary & Health Indicator */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Intent: {response.intent}
              </span>
              <p className="mt-1 text-xs font-medium text-slate-800">
                {response.summary}
              </p>
            </div>
            {response.projectHealth && (
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  response.projectHealth === "Healthy"
                    ? "bg-emerald-50 text-emerald-700"
                    : response.projectHealth === "Moderate Risk"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {response.projectHealth}
              </span>
            )}
          </div>

          {/* Risks */}
          {response.risks && response.risks.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <AlertTriangle className="h-3.5 w-3.5" /> Identified Risks
              </h4>
              <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                {response.risks.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {response.recommendations && response.recommendations.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Recommendations
              </h4>
              <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                {response.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Human Review Step for AI Task Generation */}
          {response.generatedTasks && response.generatedTasks.length > 0 && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <ListPlus className="h-4 w-4" /> AI Generated Tasks (Requires Human Approval)
                </h4>
                {!savedSuccess ? (
                  <button
                    onClick={() => void handleApproveAndSaveTasks()}
                    disabled={savingTasks}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingTasks ? "Saving to Project..." : "Approve & Create Tasks"}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Tasks Approved & Saved!
                  </span>
                )}
              </div>

              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {response.generatedTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-900">
                        {t.title}
                      </h5>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                        {t.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {t.description}
                    </p>
                    <span className="mt-2 inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {t.department}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}