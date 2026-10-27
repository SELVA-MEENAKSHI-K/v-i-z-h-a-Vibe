import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VizhaVibe — Immersive event planning for Madurai, Chennai & Bangalore",
  description:
    "Plan weddings, celebrations, and events in a 3D venue explorer. Arrange seating, get AI-assisted themes, menus, budgets, and timelines.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-marigold-500 focus:px-4 focus:py-2 focus:text-ink-900"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
