"use client";

interface DashboardStatsProps {
  activeProjects: number;
  agentRuns: number;
  teamMembers: number;
  recentActivity: number;
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function DashboardStats({
  activeProjects,
  agentRuns,
  teamMembers,
  recentActivity,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatItem
        label="Active Projects"
        value={activeProjects}
      />

      <StatItem
        label="AI Agent Runs"
        value={agentRuns}
      />

      <StatItem
        label="Team Members"
        value={teamMembers}
      />

      <StatItem
        label="Recent Activity"
        value={recentActivity}
      />
    </div>
  );
}