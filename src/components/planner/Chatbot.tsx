"use client";

import { useState, useRef, useEffect } from "react";
import type { Plan } from "./types";

type Msg = { role: "user" | "assistant"; content: string };

export function Chatbot({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi! I can help plan your ${plan.eventType.name} in ${plan.city}. Ask about themes, menus, budgets, or timelines.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.shareToken, message: text, history: messages.slice(-10) }),
      });
      const json = await res.json();
      const reply = json?.data?.reply || json?.error?.message || "Sorry, I couldn't respond.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Network error — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-plum-600 text-2xl shadow-glow hover:bg-plum-500"
        aria-label={open ? "Close assistant" : "Open planning assistant"}
      >
        {open ? "✕" : "✦"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 vv-glass shadow-panel">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold">Planning assistant</div>
            <div className="text-[11px] text-white/50">Suggestions only — not confirmed facts.</div>
          </div>
          <div className="vv-scroll flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-saffron-500 text-ink-900" : "bg-white/8 text-white/90"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-white/40">Assistant is typing…</div>}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your plan…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <button onClick={send} disabled={loading} className="rounded-lg bg-plum-600 px-4 text-sm font-medium text-white hover:bg-plum-500 disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
