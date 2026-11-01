import type { Metadata } from "next";
import "./globals.css";
import "./vibe.css";
import { FestivalBackdrop } from "@/components/ui/FestivalBackdrop";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { AnimationToggle, MotionPreferenceScript } from "@/components/ui/AnimationToggle";

export const metadata: Metadata = {
  title: "VizhaVibe — Immersive event planning for Madurai, Chennai & Bangalore",
  description:
    "Plan weddings, celebrations, and events in a 3D venue explorer. Arrange seating, get AI-assisted themes, menus, budgets, and timelines.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Apply the saved "Pause animations" preference before first paint. */}
        <MotionPreferenceScript />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-marigold-500 focus:px-4 focus:py-2 focus:text-ink-900"
        >
          Skip to content
        </a>
        <FestivalBackdrop />
        <CursorGlow />
        {children}
        {/* Visible, keyboard-reachable control to pause/resume all background
            motion (WCAG 2.2). Fixed bottom-left so it never blocks primary CTAs. */}
        <div className="fixed bottom-3 left-3 z-50 print:hidden">
          <AnimationToggle className="vv-glass shadow-lg" />
        </div>
      </body>
    </html>
  );
}
