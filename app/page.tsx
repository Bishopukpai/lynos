// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StudioOS — AI-Powered Film Greenlighting & Production OS",
  description:
    "Accelerate film production with autonomous Gemini Director agents, live market research via Parallel, and automated budget planning.",
  keywords: [
    "AI Film Studio",
    "Agentic Cinema",
    "Gemini Director Agent",
    "Parallel Research API",
    "Film Greenlight Software",
  ],
  alternates: {
    canonical: "https://studioos.ai",
  },
  openGraph: {
    title: "StudioOS — AI-Powered Film Greenlighting",
    description:
      "Autonomous intelligence for film greenlighting and pre-production planning.",
    url: "https://studioos.ai",
    siteName: "StudioOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudioOS Platform Interface Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudioOS — AI Film Studio OS",
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
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-600/40 group-hover:scale-105 transition-transform">
              🎬
            </span>
            Studio<span className="text-indigo-400">OS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link
              href="#architecture"
              className="hover:text-slate-100 transition-colors"
            >
              Agent Architecture
            </Link>
            <Link
              href="#parallel"
              className="hover:text-slate-100 transition-colors"
            >
              Parallel Integration
            </Link>
            <Link
              href="#features"
              className="hover:text-slate-100 transition-colors"
            >
              Features
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
              Sign Up →
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content" className="relative z-10">
        {/* Hero Section */}
        <section
          className="pt-24 pb-20 px-6 max-w-7xl mx-auto text-center"
          aria-labelledby="hero-heading"
        >
          {/* Hackathon Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Built for Google Cloud Agentic Cinema Hackathon
          </div>

          <h1
            id="hero-heading"
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05]"
          >
            Autonomous Intelligence for <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              The Next Era of Cinema
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-normal">
            Orchestrate autonomous{" "}
            <strong className="text-slate-200 font-semibold">
              Gemini Director agents
            </strong>
            , execute live industry research via{" "}
            <strong className="text-slate-200 font-semibold">Parallel</strong>,
            and go from pitch to greenlight in minutes.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-white shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
            </Link>
            <Link
              href="#architecture"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-semibold text-slate-300 transition-all"
            >
              View System Flow
            </Link>
          </div>

          {/* Interactive Agent Terminal Preview */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl overflow-hidden text-left">
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-500">
                  studio-os // live-execution-trace
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ● Execution Active
              </span>
            </div>

            <div className="p-6 md:p-8 font-mono text-xs md:text-sm space-y-4 text-slate-300 bg-slate-950/60">
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold">EXEC&gt;</span>
                <p className="text-slate-200">
                  &quot;Evaluate project &apos;Neon Lagos&apos; ($8.7M budget, Cyberpunk Thriller set in West Africa). Should we greenlight?&quot;
                </p>
              </div>
              <div className="pl-6 border-l-2 border-indigo-500/40 space-y-2 text-slate-400">
                <p className="text-indigo-300">
                  [Gemini Director] Formulating research strategy across Market &amp; Talent agents...
                </p>
                <p className="text-purple-300">
                  [Parallel MCP] Fetching live audience sentiment &amp; regional box-office comps...
                </p>
                <p className="text-emerald-400">
                  ✓ Research synthesized. 14 box office comps analyzed.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-slate-500">GREENLIGHT SCORE:</span>{" "}
                  <strong className="text-emerald-400 font-bold text-base">
                    87% (HIGH)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">RECOMMENDATION:</span>{" "}
                  <strong className="text-indigo-300 font-bold">
                    APPROVED FOR PRE-PRODUCTION
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proof / Tech Stack Section */}
        <section className="py-12 border-y border-slate-800/60 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
              Powered by Enterprise Infrastructure
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-75 font-semibold text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Gemini Enterprise
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Parallel Research MCP
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Google Cloud Agent Builder
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                MongoDB Atlas
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
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
              Engineered for Enterprise Studio Orchestration
            </h2>
            <p className="text-slate-400 text-lg">
              StudioOS replaces fragmented spreadsheets and subjective decks with automated, evidence-backed decision systems.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                🧠
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                Gemini Director Agent
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Acts as the executive reasoning core. Translates studio goals into specific research tasks, coordinates sub-agents, and synthesizes evidence.
              </p>
            </article>

            {/* Card 2 */}
            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                🌐
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                Parallel Web Research
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our primary partner integration. Crawls live web data for market trends, box-office comps, actor availability, and talent sentiment.
              </p>
            </article>

            {/* Card 3 */}
            <article className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                Human-in-the-Loop OS
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Retain complete executive authority. Review, edit, or reject AI recommendations before automatically spinning up pre-production tasks.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="border-t border-slate-800/80 py-12 text-slate-500 text-sm bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">StudioOS</span>
            <span>— Built for Agentic Cinema Hackathon</span>
          </div>
          <p>© {new Date().getFullYear()} StudioOS. Powered by Gemini, Parallel, &amp; Google Cloud.</p>
        </div>
      </footer>
    </div>
  );
}