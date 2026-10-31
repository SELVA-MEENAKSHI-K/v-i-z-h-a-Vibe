"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EventEnvironment } from "@/lib/eventEnvironment";
import type { SeatingStats, ShowcaseArrangement } from "@/lib/showcaseSeating";
import { buildNarration, type NarrationLang, type NarrationScript } from "@/lib/seatingNarration";

type Props = {
  eventName: string;
  env: EventEnvironment;
  stats: SeatingStats;
  arrangement: ShowcaseArrangement;
  dims: { width: number; depth: number; isSample: boolean };
};

type SpeechState = "idle" | "loading" | "speaking" | "paused" | "error";

// BCP-47 tags for the two supported languages.
const LANG_TAG: Record<NarrationLang, string> = { en: "en-IN", ta: "ta-IN" };

export function AISeatingVoiceAssistant({ eventName, env, stats, arrangement, dims }: Props) {
  const [lang, setLang] = useState<NarrationLang>("en");
  const [state, setState] = useState<SpeechState>("idle");
  const [activeLine, setActiveLine] = useState(-1); // index into script.paragraphs (-1 = title)
  const [open, setOpen] = useState(true);
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);

  // Keep a stable ref to the queued utterances so Stop can cancel cleanly.
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Rebuild the script whenever the live data or language changes — all numbers
  // come from the actual stats/arrangement/dims (never hardcoded).
  const script: NarrationScript = useMemo(
    () => buildNarration({ lang, eventName, env, stats, arrangement, dims }),
    [lang, eventName, env, stats, arrangement, dims],
  );

  // Feature-detect SpeechSynthesis + load voices + reduced-motion.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq) {
      setReduced(mq.matches);
      const onC = () => setReduced(mq.matches);
      mq.addEventListener?.("change", onC);
      return () => {
        mq.removeEventListener?.("change", onC);
        window.speechSynthesis.removeEventListener?.("voiceschanged", load);
        window.speechSynthesis.cancel();
      };
    }
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Pick the best available voice for the language, falling back to any voice
  // whose code starts with the base language ("ta" / "en"), else the default.
  const pickVoice = useCallback((tag: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
    const base = tag.split("-")[0];
    return (
      voices.find((v) => v.lang.toLowerCase() === tag.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(base)) ||
      null
    );
  }, []);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    utterancesRef.current = [];
    setState("idle");
    setActiveLine(-1);
  }, [supported]);

  // Speak the whole script line by line, syncing captions to the active line.
  const speak = useCallback(() => {
    setErrorMsg(null);
    if (!supported) {
      // No speech engine: show the text (captions remain visible) and flag it.
      setState("error");
      setErrorMsg("Voice playback isn't available on this device — showing the explanation as text.");
      setActiveLine(0);
      return;
    }
    window.speechSynthesis.cancel();
    setState("loading");

    const tag = LANG_TAG[lang];
    const voice = pickVoice(tag);
    const lines = [script.title, ...script.paragraphs];
    const utterances: SpeechSynthesisUtterance[] = [];

    lines.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = tag;
      if (voice) u.voice = voice;
      u.rate = 0.98;
      u.pitch = 1.0;
      u.onstart = () => {
        setState("speaking");
        setActiveLine(i - 1); // title is -1, first paragraph is 0
      };
      if (i === lines.length - 1) {
        u.onend = () => {
          // Only finish if we weren't cancelled/paused.
          if (utterancesRef.current.length) {
            setState("idle");
            setActiveLine(-1);
          }
        };
      }
      u.onerror = (e) => {
        // "interrupted"/"canceled" are expected on Stop — don't surface those.
        if (e.error === "interrupted" || e.error === "canceled") return;
        setState("error");
        setErrorMsg("Voice playback failed — the full explanation is shown below as text.");
        setActiveLine(0);
      };
      utterances.push(u);
    });

    utterancesRef.current = utterances;
    utterances.forEach((u) => window.speechSynthesis.speak(u));
  }, [supported, lang, pickVoice, script]);

  const pause = useCallback(() => {
    if (supported && state === "speaking") {
      window.speechSynthesis.pause();
      setState("paused");
    }
  }, [supported, state]);

  const resume = useCallback(() => {
    if (supported && state === "paused") {
      window.speechSynthesis.resume();
      setState("speaking");
    }
  }, [supported, state]);

  const replay = useCallback(() => {
    stop();
    // Let the cancel settle before re-queuing (Chrome quirk).
    setTimeout(speak, 60);
  }, [stop, speak]);

  // Stop speech when the language changes mid-playback (the script changed).
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const speaking = state === "speaking";
  const captionLines = [script.title, ...script.paragraphs];

  return (
    <section
      className="rounded-2xl border border-white/10 vv-glass p-4"
      aria-label="AI voice guide for the seating arrangement"
    >
      {/* Header: avatar + title + collapse */}
      <div className="flex items-center gap-3">
        <Avatar speaking={speaking && !reduced} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-semibold leading-tight text-white">AI Voice Guide</h3>
          <p className="truncate text-[11px] text-white/55">
            {state === "speaking"
              ? "Explaining your seating…"
              : state === "paused"
                ? "Paused"
                : state === "loading"
                  ? "Preparing…"
                  : state === "error"
                    ? "Text mode"
                    : "Event-aware seating explanation"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md px-2 py-1 text-xs text-white/60 hover:bg-white/5"
          aria-expanded={open}
          aria-controls="vv-voice-body"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <div id="vv-voice-body" className="mt-3">
          {/* Language toggle */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[11px] text-white/50">Language</span>
            <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs" role="group" aria-label="Narration language">
              <button
                type="button"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                className={`px-3 py-1.5 ${lang === "en" ? "bg-saffron-500 text-ink-900" : "text-white/80 hover:bg-white/5"}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("ta")}
                aria-pressed={lang === "ta"}
                className={`px-3 py-1.5 ${lang === "ta" ? "bg-saffron-500 text-ink-900" : "text-white/80 hover:bg-white/5"}`}
                lang="ta"
              >
                தமிழ்
              </button>
            </div>
          </div>

          {/* Sound-wave visualization */}
          <SoundWave active={speaking && !reduced} />

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {state !== "speaking" && state !== "paused" ? (
              <button
                type="button"
                onClick={speak}
                className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-3 py-2 text-sm font-semibold text-ink-900 transition hover:bg-saffron-400"
              >
                🔊 Listen to AI Explanation
              </button>
            ) : (
              <>
                {state === "speaking" ? (
                  <button type="button" onClick={pause} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 hover:bg-white/5">
                    ⏸ Pause
                  </button>
                ) : (
                  <button type="button" onClick={resume} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 hover:bg-white/5">
                    ▶ Resume
                  </button>
                )}
                <button type="button" onClick={stop} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 hover:bg-white/5">
                  ⏹ Stop
                </button>
              </>
            )}
            <button
              type="button"
              onClick={replay}
              disabled={state === "loading"}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 hover:bg-white/5 disabled:opacity-50"
            >
              ↻ Replay
            </button>
          </div>

          {/* Error / fallback banner */}
          {errorMsg && (
            <p role="alert" className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
              {errorMsg}
            </p>
          )}

          {/* Live captions (also the text fallback) */}
          <div className="vv-scroll mt-3 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-3" aria-live="polite">
            <p className={`font-display text-sm font-semibold ${activeLine === -1 && speaking ? "text-saffron-400" : "text-white"}`}>{script.title}</p>
            <div className="mt-2 space-y-1.5">
              {script.paragraphs.map((line, i) => (
                <p
                  key={i}
                  className={`text-xs leading-relaxed transition-colors ${
                    activeLine === i ? "text-saffron-300" : "text-white/70"
                  }`}
                  lang={lang === "ta" ? "ta" : undefined}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Honesty note mirrors the sufficiency verdict (never over-claims) */}
          <p className="mt-2 text-[10px] text-white/40">
            {script.sufficient
              ? "Spoken figures are computed live from this arrangement."
              : `Computed live: this layout is short by ${script.seatsNeeded} seat${script.seatsNeeded === 1 ? "" : "s"} for the guest count.`}
          </p>
        </div>
      )}
    </section>
  );
}

// Compact AI avatar with a gentle speaking pulse (static under reduced motion).
function Avatar({ speaking }: { speaking: boolean }) {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron-500 to-plum-600 text-lg">
      <span aria-hidden="true">🪔</span>
      {speaking && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-saffron-500/40" />
          <span className="absolute -inset-1 rounded-full ring-2 ring-saffron-400/30" />
        </>
      )}
    </span>
  );
}

// Animated sound-wave bars. Freeze flat when not speaking / reduced motion.
function SoundWave({ active }: { active: boolean }) {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex h-12 items-center justify-center gap-[3px] rounded-xl border border-white/10 bg-black/20 px-3" aria-hidden="true">
      {bars.map((_, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-saffron-500 to-marigold-400"
          style={
            active
              ? { height: "100%", animation: `vv-wave 0.9s ease-in-out ${(i % 7) * 0.08}s infinite alternate` }
              : { height: "14%" }
          }
        />
      ))}
      <style jsx>{`
        @keyframes vv-wave {
          0% {
            transform: scaleY(0.2);
          }
          100% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}
