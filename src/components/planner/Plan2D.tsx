"use client";

import type { PlanObject } from "./types";

type Props = {
  roomWidth: number;
  roomDepth: number;
  objects: PlanObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const FILL: Record<string, string> = {
  "round-table": "#f7c948",
  "rect-table": "#f5a623",
  chair: "#c9a227",
  stage: "#e23e57",
  "dance-floor": "#2dd4bf",
  buffet: "#7c3aed",
  entrance: "#38bdf8",
  "decor-arch": "#ff9e2c",
  pillar: "#94a3b8",
  service: "#64748b",
};

// Accessible top-down SVG plan. Mirrors the 3D scene for users who can't or
// prefer not to use 3D. Objects are keyboard-focusable and selectable.
export function Plan2D({ roomWidth, roomDepth, objects, selectedId, onSelect }: Props) {
  const pad = 2;
  const w = roomWidth + pad * 2;
  const d = roomDepth + pad * 2;

  function toSvg(x: number, z: number) {
    return { cx: x + roomWidth / 2 + pad, cy: z + roomDepth / 2 + pad };
  }

  return (
    <div className="h-full w-full overflow-auto p-4">
      <svg viewBox={`0 0 ${w} ${d}`} className="mx-auto h-auto w-full max-w-3xl" role="img" aria-label="Top-down venue plan">
        <rect x={pad} y={pad} width={roomWidth} height={roomDepth} fill="#1a1726" stroke="#4a4668" strokeWidth={0.1} />
        {/* grid */}
        {Array.from({ length: Math.floor(roomWidth) + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={pad + i} y1={pad} x2={pad + i} y2={pad + roomDepth} stroke="#2a2740" strokeWidth={0.03} />
        ))}
        {Array.from({ length: Math.floor(roomDepth) + 1 }).map((_, i) => (
          <line key={`h${i}`} x1={pad} y1={pad + i} x2={pad + roomWidth} y2={pad + i} stroke="#2a2740" strokeWidth={0.03} />
        ))}

        {objects.map((o) => {
          const { cx, cy } = toSvg(o.posX, o.posZ);
          const fill = FILL[o.kind] ?? "#cbd5e1";
          const isSel = o.id === selectedId;
          const stroke = isSel ? "#ffffff" : "none";
          const label = `${o.label || o.kind}${o.seats ? `, ${o.seats} seats` : ""}`;
          if (o.kind === "round-table" || o.kind === "chair") {
            return (
              <circle
                key={o.id}
                cx={cx}
                cy={cy}
                r={o.kind === "chair" ? 0.3 : 0.9 * o.scale}
                fill={fill}
                stroke={stroke}
                strokeWidth={0.12}
                tabIndex={0}
                role="button"
                aria-label={label}
                onClick={() => onSelect(o.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(o.id)}
                style={{ cursor: "pointer" }}
              >
                <title>{label}</title>
              </circle>
            );
          }
          const bw = o.kind === "stage" ? 8 : o.kind === "buffet" ? 4 : o.kind === "dance-floor" ? 6 : 2.2;
          const bh = o.kind === "dance-floor" ? 6 : 1;
          return (
            <rect
              key={o.id}
              x={cx - bw / 2}
              y={cy - bh / 2}
              width={bw}
              height={bh}
              rx={0.2}
              fill={fill}
              fillOpacity={o.kind === "dance-floor" ? 0.5 : 1}
              stroke={stroke}
              strokeWidth={0.12}
              tabIndex={0}
              role="button"
              aria-label={label}
              onClick={() => onSelect(o.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(o.id)}
              style={{ cursor: "pointer" }}
            >
              <title>{label}</title>
            </rect>
          );
        })}
      </svg>
      <p className="mt-3 text-center text-xs text-white/50">
        2D plan view · click or focus an object to select it, then edit it in the panel.
      </p>
    </div>
  );
}
