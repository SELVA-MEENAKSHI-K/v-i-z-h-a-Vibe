"use client";

// SmartImage — the single, reusable image component enforcing VizhaVibe's
// "zero empty images" policy. Every image area ALWAYS shows one of:
//   1. the real/primary photo,
//   2. a provided fallback,
//   3. a local category fallback asset (public/images/fallbacks/*.svg),
//   4. a designed CSS placeholder (final guarantee — cannot 404).
//
// It keeps the container dimensions stable while loading/failing, shows a
// skeleton, avoids infinite fallback loops, and labels fallbacks "Illustrative
// preview" so a fallback is never mistaken for a real venue/shop photo.

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

export type ImageCategory = "food" | "venue" | "shop" | "decoration" | "event" | "three-d" | "generic";

const CATEGORY_FALLBACK: Record<ImageCategory, string> = {
  food: "/images/fallbacks/food-fallback.svg",
  venue: "/images/fallbacks/venue-fallback.svg",
  shop: "/images/fallbacks/shop-fallback.svg",
  decoration: "/images/fallbacks/decoration-fallback.svg",
  event: "/images/fallbacks/event-fallback.svg",
  "three-d": "/images/fallbacks/three-d-preview-fallback.svg",
  generic: "/images/fallbacks/generic-fallback.svg",
};

// Module-level cache of URLs that have already failed, so we never re-request a
// known-broken URL within a session.
const brokenUrls = new Set<string>();

type Stage = "primary" | "fallback" | "category" | "placeholder";

export type SmartImageProps = {
  src?: string | null;
  alt: string;
  category?: ImageCategory;
  /** Optional caller-provided fallback tried before the category fallback. */
  fallbackSrc?: string | null;
  /** Rendered with `fill`; parent must be `relative` and sized. Default true. */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** Show the small "Illustrative preview" tag when a fallback is in use. */
  labelFallback?: boolean;
  /** Attribution/credit line shown subtly at the bottom (real images only). */
  credit?: string | null;
  /**
   * When true, do NOT fall back to the illustrative category SVG. If the real
   * image fails, go straight to a clear "Real photo unavailable" placeholder.
   * Used by the food menu, which must never show a cartoon dish.
   */
  noIllustrativeFallback?: boolean;
  /** Custom text for the final placeholder (e.g. "Real photo unavailable"). */
  placeholderText?: string;
};

export function SmartImage({
  src,
  alt,
  category = "generic",
  fallbackSrc,
  fill = true,
  width,
  height,
  sizes = "(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw",
  className = "",
  priority = false,
  labelFallback = true,
  credit,
  noIllustrativeFallback = false,
  placeholderText,
}: SmartImageProps) {
  // Decide the initial stage: skip straight past any already-broken/empty src.
  const initialStage: Stage = useMemo(() => {
    if (src && !brokenUrls.has(src)) return "primary";
    if (fallbackSrc && !brokenUrls.has(fallbackSrc)) return "fallback";
    return noIllustrativeFallback ? "placeholder" : "category";
  }, [src, fallbackSrc, noIllustrativeFallback]);

  const [stage, setStage] = useState<Stage>(initialStage);
  const [loaded, setLoaded] = useState(false);
  // Guard against repeated error handling for the same stage.
  const handledRef = useRef<string>("");

  const currentSrc =
    stage === "primary" ? src! : stage === "fallback" ? fallbackSrc! : stage === "category" ? CATEGORY_FALLBACK[category] : null;

  const isFallback = stage !== "primary";
  // Local SVG fallbacks are not run through the optimizer (keeps them b/ always work).
  const unoptimized = stage === "category" || (!!currentSrc && currentSrc.endsWith(".svg"));

  function handleError() {
    if (currentSrc) {
      brokenUrls.add(currentSrc);
      if (handledRef.current === currentSrc) return; // already handled this src
      handledRef.current = currentSrc;
    }
    setLoaded(false);
    // Advance to the next stage, never looping back.
    setStage((s) => {
      if (s === "primary") {
        if (fallbackSrc && !brokenUrls.has(fallbackSrc)) return "fallback";
        return noIllustrativeFallback ? "placeholder" : "category";
      }
      if (s === "fallback") return noIllustrativeFallback ? "placeholder" : "category";
      return "placeholder"; // category fallback failed (shouldn't happen for local SVG)
    });
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* Loading skeleton — keeps the area filled while the image loads. */}
      {!loaded && stage !== "placeholder" && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-ink-800 to-[#1c1033]" aria-hidden />
      )}

      {stage === "placeholder" || !currentSrc ? (
        // Final designed placeholder — pure CSS, cannot 404.
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-ink-800 to-[#1c1033] text-white/50">
          <span className="text-2xl" aria-hidden>
            🖼️
          </span>
          <span className="px-3 text-center text-[11px]">{placeholderText || "Illustrative preview"}</span>
        </div>
      ) : fill ? (
        <Image
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          loading={priority ? undefined : "lazy"}
          className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      ) : (
        <Image
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          width={width ?? 640}
          height={height ?? 480}
          priority={priority}
          unoptimized={unoptimized}
          loading={priority ? undefined : "lazy"}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      )}

      {/* Distinguish fallbacks from real photos. */}
      {isFallback && labelFallback && stage !== "placeholder" && (
        <span className="absolute bottom-1 left-1 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white/75 backdrop-blur-sm">
          Illustrative preview
        </span>
      )}
      {/* Credit only for the real primary image. */}
      {!isFallback && credit && loaded && (
        <span className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 text-[9px] text-white/60">
          {credit}
        </span>
      )}
    </div>
  );
}
