"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0b0a14", color: "#f4f1ea", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16 }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: 12, opacity: 0.7 }}>A critical error occurred. Please try again.</p>
          <button
            onClick={reset}
            style={{ marginTop: 24, borderRadius: 8, background: "#ff9e2c", color: "#0b0a14", padding: "8px 24px", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
