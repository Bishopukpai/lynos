"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Sparkles,
  Loader2,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";

interface ResearchItem {
  _id: string;
  category: string;
  objective: string;
  rawSearchResults: Array<{ title: string; url: string; snippet: string }>;
  aiAnalysis: {
    executiveSummary: string;
    keyFindings: string[];
    marketOpportunities: string[];
    competitorsOrComps: Array<{ title: string; metrics?: string; relevance: string }>;
    strategicRecommendations: string[];
    riskFactors: string[];
  };
  createdAt: string;
}

const SAMPLE_PROMPTS = [
  { label: "Market Opportunity", text: "Research the current market opportunity and target demographic potential for this project." },
  { label: "Comparable Films", text: "Find comparable films or productions released recently and analyze how they performed in genre and audience." },
  { label: "Talent Discovery", text: "Research emerging actors, directors, and producers who fit this production's scope." },
  { label: "Audience Trends", text: "Research current audience trends for this genre and identify what themes are gaining traction." },
  { label: "Industry Opportunities", text: "Research major distribution opportunities, risks, and competitor developments in the industry." },
];

export default function ResearchIntelligence({ projectId }: { projectId: string }) {
  const [objective, setObjective] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ResearchItem[]>([]);
  const [activeResearch, setActiveResearch] = useState<ResearchItem | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function loadResearchHistory() {
      if (!projectId) return;

      try {
        const res = await fetch(`/api/projects/${projectId}/research`);
        if (res.ok) {
          const data: ResearchItem[] = await res.json();
          if (isSubscribed) {
            setHistory(data);
            if (data.length > 0) {
              setActiveResearch(data[0]);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load research history:", e);
      }
    }

    loadResearchHistory();

    return () => {
      isSubscribed = false;
    };
  }, [projectId]);

  async function handleRunResearch(customObjective?: string) {
    const query = customObjective || objective;
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: query }),
      });

      if (res.ok) {
        const newResult: ResearchItem = await res.json();
        setHistory((prev) => [newResult, ...prev]);
        setActiveResearch(newResult);
        setObjective("");
      }
    } catch (e) {
      console.error("Failed to execute research query:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Left Control Panel */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span>Parallel External Research</span>
          </div>
          <p className="text-xs text-slate-400">
            Searches public industry sources in real-time and synthesizes market insights with Gemini 3.6 Flash.
          </p>

          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Research current audience trends for high-concept sci-fi thrillers..."
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[100px]"
          />

          <button
            type="button"
            onClick={() => handleRunResearch()}
            disabled={loading || !objective.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? "Gathering External Intelligence..." : "Run Parallel Research"}</span>
          </button>
        </div>

        {/* Quick Sample Prompts */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sample Queries</span>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setObjective(prompt.text);
                  handleRunResearch(prompt.text);
                }}
                disabled={loading}
                className="text-left p-2 bg-slate-950 hover:bg-slate-800/60 border border-slate-800 rounded-md text-xs text-slate-300 transition"
              >
                <div className="font-medium text-indigo-300">{prompt.label}</div>
                <div className="truncate text-slate-400">{prompt.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* History Stream */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 flex-1 overflow-y-auto max-h-[300px]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Past Intelligence Reports</span>
          {history.length === 0 ? (
            <div className="text-xs text-slate-500 py-4 text-center">No research reports saved yet.</div>
          ) : (
            history.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setActiveResearch(item)}
                className={`w-full text-left p-3 rounded-lg border text-xs cursor-pointer transition ${
                  activeResearch?._id === item._id
                    ? "bg-indigo-950/40 border-indigo-500 text-indigo-200"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="font-medium line-clamp-1">{item.objective}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Intelligence Output Panel */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto">
        {activeResearch ? (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-mono uppercase text-emerald-400">Parallel Intelligence Analysis</span>
              <h1 className="text-xl font-bold text-white mt-1">{activeResearch.objective}</h1>
            </div>

            {/* Executive Summary */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <h3 className="text-sm font-semibold text-indigo-300 mb-2">Executive Summary</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {activeResearch.aiAnalysis.executiveSummary}
              </p>
            </div>

            {/* Key Findings & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <h3 className="text-sm font-semibold text-emerald-400 mb-2">Key Market Findings</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {activeResearch.aiAnalysis.keyFindings?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-400 mb-2">Market Opportunities</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {activeResearch.aiAnalysis.marketOpportunities?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations & Risk Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeResearch.aiAnalysis.strategicRecommendations?.length > 0 && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-sky-400 mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-sky-400" />
                    Strategic Recommendations
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    {activeResearch.aiAnalysis.strategicRecommendations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeResearch.aiAnalysis.riskFactors?.length > 0 && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-rose-400 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Risk Factors
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    {activeResearch.aiAnalysis.riskFactors.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Comparable Productions */}
            {activeResearch.aiAnalysis.competitorsOrComps?.length > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <h3 className="text-sm font-semibold text-indigo-300 mb-3">
                  Comparable Productions & Benchmarks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeResearch.aiAnalysis.competitorsOrComps.map((comp, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-md text-xs">
                      <div className="font-semibold text-white">{comp.title}</div>
                      {comp.metrics && (
                        <div className="text-emerald-400 font-mono text-[11px] mt-0.5">{comp.metrics}</div>
                      )}
                      <div className="text-slate-400 mt-1">{comp.relevance}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Web Sources (Parallel) */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Verified External Sources (Parallel Web Search)
              </h3>
              <div className="space-y-2">
                {activeResearch.rawSearchResults.map((source, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-md text-xs">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>{source.title}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                    <p className="text-slate-400 mt-1 line-clamp-2">{source.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <Search className="w-10 h-10 stroke-1" />
            <p className="text-sm">Select a query or launch a new research request above.</p>
          </div>
        )}
      </div>
    </div>
  );
}