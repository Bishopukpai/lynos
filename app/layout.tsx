import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import Providers from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://studioos.ai"
  ),

  title: {
    default: "StudioOS — Autonomous AI Film Studio Operating System",
    template: "%s | StudioOS",
  },

  description:
    "Orchestrate Gemini Director agents and Parallel real-time research to go from script concept to greenlight in minutes.",

  keywords: [
    "AI Film Studio",
    "Agentic Cinema",
    "Gemini Director Agent",
    "Parallel Research API",
    "Film Greenlight Software",
  ],

  authors: [
    {
      name: "StudioOS Team",
    },
  ],

  creator: "StudioOS",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://studioos.ai",

    title:
      "StudioOS — AI-Powered Film Greenlighting & Production OS",

    description:
      "Autonomous intelligence for film greenlighting, real-time industry research, and pre-production planning.",

    siteName: "StudioOS",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudioOS Platform Interface Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "StudioOS — AI Film Studio OS",

    description:
      "Transform script analysis and greenlight workflow with Gemini and Parallel.",

    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StudioOS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",

    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },

    description:
      "Autonomous AI Operating System for film greenlighting and production management powered by Gemini and Parallel.",
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full"
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}