import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "ScenePilot — AI-Powered Production Command Center",
  description:
    "Plan, research, and manage your film and TV productions with autonomous AI agents in one unified workspace.",
  keywords: [
    "ScenePilot AI",
    "AI Production Software",
    "Film Greenlight Agent",
    "Gemini Director Agent",
    "Parallel Research API",
    "Film Pre-Production OS",
  ],
  alternates: {
    canonical: "https://scenepilot.ai",
  },
  openGraph: {
    title: "ScenePilot — AI-Powered Production Command Center",
    description:
      "Autonomous intelligence for film greenlighting, talent discovery, and pre-production planning.",
    url: "https://scenepilot.ai",
    siteName: "ScenePilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ScenePilot Platform Interface Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScenePilot — AI Production Command Center",
    description:
      "Transform script analysis and greenlight workflow with autonomous agents.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <div className="relative bg-slate-950 text-slate-100 min-h-screen overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ambient Lighting & Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

      {/* Semantic Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <nav
          className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between"
          aria-label="Main Navigation"
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black tracking-tight text-white group"
          >
            <span className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-600/40 group-hover:scale-105 transition-transform">
              🎬
            </span>
            Scene<span className="text-indigo-400">Pilot</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link
              href="#features"
              className="hover:text-slate-100 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#interface"
              className="hover:text-slate-100 transition-colors"
            >
              Interface
            </Link>
            <Link
              href="#workflow"
              className="hover:text-slate-100 transition-colors"
            >
              Workflow
            </Link>
            <Link
              href="#architecture"
              className="hover:text-slate-100 transition-colors"
            >
              Architecture
            </Link>
          </div>
          {/* Authentication Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Project →
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content" className="relative z-10">
        {/* SECTION 1: HERO SECTION */}
        <section
          className="pt-20 pb-24 px-6 max-w-7xl mx-auto text-center"
          aria-labelledby="hero-heading"
        >
          {/* Hackathon Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Built for Google Cloud Agentic Cinema Hackathon
          </div>
          <h1
            id="hero-heading"
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.08]"
          >
            Your AI-Powered <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Production Command Center
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Plan, research, and manage your productions with intelligent AI
            agents in one unified workspace.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-white shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Project
            </Link>
            <Link
              href="#interface"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-semibold text-slate-300 transition-all"
            >
              Explore Platform UI
            </Link>
          </div>

          {/* Large Dashboard Preview */}
          <div className="max-w-6xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl overflow-hidden p-2">
            <div className="px-4 py-3 bg-slate-950/80 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-500 hidden sm:inline-block">
                  https://app.scenepilot.ai/dashboard
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full fill-emerald-500/10 text-emerald-400 bg-emerald-500/10 stroke-emerald-500/20 font-mono">
                  ● Gemini Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 p-4 text-left bg-slate-950/60">
              <div className="hidden lg:col-span-3 lg:flex flex-col gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Active Workspace
                </div>
                <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-800/50 flex items-center justify-between">
                  <div className="font-semibold text-indigo-200 text-sm">
                    🎬 Cyberpunk Lagos
                  </div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    PROD
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-4 mb-1">
                  Agent Status
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-800/40">
                    <span className="text-slate-300">Director Agent</span>
                    <span className="text-emerald-400 font-medium">Ready</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-slate-800/40">
                    <span className="text-slate-300">Parallel Research</span>
                    <span className="text-indigo-400 font-medium">Scanning</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-slate-800/40">
                    <span className="text-slate-300">Budget Analyst</span>
                    <span className="text-slate-400">Idle</span>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      Target Production Budget
                    </div>
                    <div className="text-2xl font-black text-white mt-1">
                      $8,700,000
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-1">
                      ↑ 12% below regional cap
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      Greenlight Feasibility
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      87.4%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      High Audience Fit
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      Box-Office Comps
                    </div>
                    <div className="text-2xl font-black text-indigo-400 mt-1">
                      14 Titles
                    </div>
                    <div className="text-[11px] text-indigo-300 mt-1">
                      Parallel Research Verified
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-3">
                  <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-2">
                    <span>EXECUTION LOGS</span>
                    <span className="text-indigo-400">Gemini 3.6 Flash</span>
                  </div>
                  <div className="flex items-start gap-2 text-indigo-300">
                    <span className="text-indigo-500 font-bold">&gt;</span>
                    <p>
                      Evaluating casting availability &amp; location tax incentives for West Africa...
                    </p>
                  </div>
                  <div className="pl-4 border-l-2 border-indigo-500/30 space-y-1.5 text-slate-400">
                    <p className="text-purple-300">
                      [Parallel Search] Querying box office benchmarks ($5M - $15M bracket)...
                    </p>
                    <p className="text-emerald-400">
                      ✓ Retrived 14 comps. Average IRR estimated at 23.4%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proof / Tech Stack Section */}
        <section className="py-12 border-y border-slate-800/60 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
              Powered by Enterprise AI &amp; Cloud Infrastructure
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-75 font-semibold text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Gemini Enterprise AI
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Parallel Web Research MCP
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Google Cloud Platform
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                MongoDB Atlas
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PRODUCT FEATURES SECTION */}
        <section
          id="features"
          className="py-28 max-w-7xl mx-auto px-6"
          aria-labelledby="features-heading"
        >
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2
              id="features-heading"
              className="text-3xl md:text-5xl font-black tracking-tight mb-6"
            >
              Engineered for End-to-End Production Intelligence
            </h2>
            <p className="text-slate-400 text-lg">
              ScenePilot replaces fragmented tools and intuition-based decks with automated, evidence-backed decision systems.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🧠
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  AI Director Agent
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Translates high-level studio goals into executable research pipelines, coordinates specialized sub-agents, and synthesizes evidence.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400">
                <span>Autonomous Reasoning</span>
                <span>Active</span>
              </div>
            </article>

            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  📋
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Production Planning
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Automatically generates detailed pre-production schedules, shooting breakdowns, budget estimations, and location logistics.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400">
                <span>Automated Schedules</span>
                <span>Active</span>
              </div>
            </article>

            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🌐
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Market Research
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Crawls live web data via Parallel MCP to analyze box-office benchmarks, audience demand trends, and genre comps.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400">
                <span>Parallel Integration</span>
                <span>Active</span>
              </div>
            </article>

            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🎭
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Talent Discovery
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Identifies optimal cast and crew pairings based on sentiment, regional popularity, availability, and budget constraints.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400">
                <span>Cast Matching</span>
                <span>Active</span>
              </div>
            </article>

            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-pink-500/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  👥
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Project Collaboration
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Enable team members, executives, and producers to review, comment, edit, and approve agent decisions seamlessly.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-pink-400">
                <span>Role-based Controls</span>
                <span>Active</span>
              </div>
            </article>

            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  📊
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Production Analytics
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Real-time financial models, greenlight scorecards, and risk assessment indicators for confidence in pitch meetings.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400">
                <span>Risk Scorecards</span>
                <span>Active</span>
              </div>
            </article>
          </div>
        </section>

        {/* SECTION 3: PRODUCT INTERFACE SHOWCASE */}
        <section
          id="interface"
          className="py-24 bg-slate-900/40 border-y border-slate-800/80"
          aria-labelledby="interface-heading"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2
                id="interface-heading"
                className="text-3xl md:text-5xl font-black tracking-tight mb-4"
              >
                Everything you need to manage a production
              </h2>
              <p className="text-slate-400 text-lg">
                Explore the modular interface designed for studio executives, producers, and directors.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="flex border-b border-slate-800 overflow-x-auto bg-slate-900/80">
                <button className="px-6 py-4 text-sm font-semibold text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10 whitespace-nowrap">
                  Dashboard
                </button>
                <button className="px-6 py-4 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent whitespace-nowrap">
                  Project Workspace
                </button>
                <button className="px-6 py-4 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent whitespace-nowrap">
                  AI Director Agent
                </button>
                <button className="px-6 py-4 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent whitespace-nowrap">
                  Production Plan
                </button>
                <button className="px-6 py-4 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent whitespace-nowrap">
                  Research Results
                </button>
              </div>

              <div className="p-6 md:p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="inline-block px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                      Modular UI
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      Unified Studio Control Panel
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Monitor all ongoing projects, agent execution streams, greenlight status metrics, and team activity from a single responsive view.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Real-time execution logs
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Live financial projections
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Customizable agent permissions
                      </li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        ACTIVE GREENLIGHT PIPELINE
                      </span>
                      <span className="text-xs text-indigo-400 font-mono">
                        UPDATED LIVE
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded bg-slate-950 border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Project: Neon Lagos
                          </div>
                          <div className="text-xs text-slate-400">
                            Genre: Cyberpunk Thriller
                          </div>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          87% Score
                        </span>
                      </div>
                      <div className="p-3 rounded bg-slate-950 border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Project: Sahara Horizon
                          </div>
                          <div className="text-xs text-slate-400">
                            Genre: Sci-Fi Drama
                          </div>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          72% Score
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: WORKFLOW SECTION */}
        <section
          id="workflow"
          className="py-28 max-w-7xl mx-auto px-6"
          aria-labelledby="workflow-heading"
        >
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2
              id="workflow-heading"
              className="text-3xl md:text-5xl font-black tracking-tight mb-4"
            >
              How ScenePilot Accelerates Greenlighting
            </h2>
            <p className="text-slate-400 text-lg">
              Go from initial pitch concept to an approved production plan in four simple steps.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 relative space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Create Project</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Input your script logline, genre target, target budget, and production goals into the platform.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 relative space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
                2
              </div>
              <h3 className="text-xl font-bold text-white">AI Research</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gemini and Parallel autonomous agents scan live web data for market comps, talent, and locations.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 relative space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
                3
              </div>
              <h3 className="text-xl font-bold text-white">
                Generate Production Plan
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive an evidence-backed budget breakdown, timeline schedule, and feasibility score.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 relative space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
                4
              </div>
              <h3 className="text-xl font-bold text-white">Review &amp; Approve</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Human-in-the-loop review allows executives to adjust variables and greenlight with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: CALL TO ACTION */}
        <section className="py-28 px-6 relative">
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Bring your production from idea to action.
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Empower your studio team with Gemini-backed agents, live web intelligence, and automated pre-production planning today.
            </p>
            <Link
              href="/signup"
              className="inline-block px-10 py-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-lg shadow-xl shadow-indigo-600/40 transition-all duration-200 hover:scale-105"
            >
              Start Your Project →
            </Link>
          </div>
        </section>
      </main>

      {/* MULTI-COLUMN LANDING PAGE FOOTER */}
      <footer className="bg-slate-950 text-white pt-20 pb-10 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800/80 pb-16">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">
                🎬
              </div>
              <span className="text-xl font-bold tracking-tight">
                Scene<span className="text-indigo-400">Pilot</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm mb-6 text-sm">
              Autonomous AI intelligence for film greenlighting, talent discovery, and pre-production planning.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Platform</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#interface" className="hover:text-white transition-colors">
                  Interface
                </Link>
              </li>
              <li>
                <Link href="#workflow" className="hover:text-white transition-colors">
                  Workflow
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Developer Docs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Contact Us</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-indigo-400" /> support@scenepilot.ai
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-indigo-400" /> +1 (555) 019-PILOT
              </li>
              <li className="flex items-start gap-3 text-left">
                <MapPin size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" /> 
                <span>100 Studio Plaza, <br />Hollywood, CA 90028</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Legal</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 text-center text-slate-500 text-xs">
          © {new Date().getFullYear()} ScenePilot AI. All rights reserved. Powered by Gemini, Parallel, &amp; Google Cloud.
        </div>
      </footer>
    </div>
  );
}