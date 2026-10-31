// Illustrated, animated hero scenes for the VizhaVibe home page.
//
// Every scene is a layered SVG string (background / characters / foreground)
// built from one small "character rig": head, neck, torso, two-bone arms and
// legs with real joints. Poses are described by hand targets, and a tiny
// two-bone IK solver turns them into the shoulder/elbow rotations that the CSS
// keyframes (see globals.css, `.vv-stage`) swing between.
//
// Output is deterministic (seeded pseudo-random, no Math.random) so server and
// client render the same markup.

type Pair = [number, number];
type Pref = "down" | "up" | "out" | "in";
type Arm = { a: Pair; b?: Pair; pref?: Pref };
type Pose = {
  t?: number;
  d?: number;
  b?: number;
  tw?: Pair;
  hd?: Pair;
  hpL?: Pair;
  hpR?: Pair;
  knL?: Pair;
  knR?: Pair;
  armL?: Arm;
  armR?: Arm;
  tj?: Record<string, number>;
};
type Outfit = "saree" | "dress" | "veshti" | "kurta" | "suit";
type Hair = "braid" | "long" | "bun" | "pig" | "short";
type Person = {
  x: number;
  g?: number;
  gl?: number;
  s?: number;
  f?: boolean;
  kid?: boolean;
  skin?: string;
  hair?: string;
  hs?: Hair;
  mus?: boolean;
  tilak?: boolean;
  out?: Outfit;
  hem?: number;
  c1?: string;
  c2?: string;
  c3?: string;
  shoe?: string;
  bangles?: boolean;
  open?: boolean;
  blow?: boolean;
  jewel?: boolean;
  bd?: number;
  mid?: string;
  propL?: string;
  propR?: string;
  pose?: Pose;
};

/* ---------- helpers ---------- */

const R = (n: number): number => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const f = (n: number): number => +n.toFixed(1);
const cyc = <T,>(a: T[], i: number): T => a[i % a.length];
const bez = (t: number, a: number, b: number, c: number): number =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + k))));
  return "#" + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
}

const layer = (n: number, s: string): string => `<g class="l${n}">${s}</g>`;

/** Two-bone arm solver: returns [shoulder, elbow] rotations (degrees). */
function ik(S: Pair, H: Pair, side: "L" | "R", pref: Pref): Pair {
  const L1 = 30;
  const L2 = 33;
  const dx = H[0] - S[0];
  const dy = H[1] - S[1];
  const d0 = Math.hypot(dx, dy) || 1e-6;
  const d = Math.min(Math.max(d0, 14), L1 + L2 - 0.6);
  const ux = dx / d0;
  const uy = dy / d0;
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  const px = S[0] + a * ux;
  const py = S[1] + a * uy;
  const vx = -uy;
  const vy = ux;
  const e1: Pair = [px + h * vx, py + h * vy];
  const e2: Pair = [px - h * vx, py - h * vy];
  let E: Pair;
  if (pref === "up") E = e1[1] < e2[1] ? e1 : e2;
  else if (pref === "out") E = Math.abs(e1[0]) > Math.abs(e2[0]) ? e1 : e2;
  else if (pref === "in") E = Math.abs(e1[0]) < Math.abs(e2[0]) ? e1 : e2;
  else E = e1[1] > e2[1] ? e1 : e2;
  const Hh: Pair = [S[0] + ux * d, S[1] + uy * d];
  const ex = E[0] - S[0];
  const ey = E[1] - S[1];
  const fx = Hh[0] - E[0];
  const fy = Hh[1] - E[1];
  const A1 = (Math.atan2(-ex, ey) * 180) / Math.PI;
  const A2 = (Math.atan2(-fx, fy) * 180) / Math.PI;
  let Ae = A2 - A1;
  while (Ae > 180) Ae -= 360;
  while (Ae < -180) Ae += 360;
  return side === "L" ? [A1, -Ae] : [-A1, Ae];
}

/* ---------- character rig ---------- */

const TF = "M-19 45C-10 41 10 41 19 45L16.5 62C15.5 70 14 76 13.5 80L13.7 84H-13.7L-13.5 80C-14 76 -15.5 70 -16.5 62Z";
const TM =
  "M-24 45C-12 41 12 41 24 45L21.5 66C20 74 19 80 18.5 84C18 92 17.5 96 17.5 101H-17.5C-17.5 96 -18 92 -18.5 84C-19 80 -20 74 -21.5 66Z";

function skirtPath(hem: number): string {
  const h = hem - 80;
  const W = 14 + h * 0.36;
  return (
    `M-14 0H14C${f(14 + (W - 14) * 0.25)} ${f(h * 0.3)} ${f(14 + (W - 14) * 0.75)} ${f(h * 0.7)} ${f(W)} ${f(h)}` +
    `H${f(-W)}C${f(-(14 + (W - 14) * 0.75))} ${f(h * 0.7)} ${f(-(14 + (W - 14) * 0.25))} ${f(h * 0.3)} -14 0Z`
  );
}

function legSvg(side: -1 | 1, trouser: boolean): string {
  const cls = side < 0 ? "L" : "R";
  const col = trouser ? "k2" : "skn";
  return (
    `<g transform="translate(${side * 9} 100)"><g class="joint hp${cls}"><path class="${col}" d="M-8.5 0H8.5L7 44H-7Z"/>` +
    `<g transform="translate(0 44)"><g class="joint kn${cls}"><path class="${col}" d="M-7 -1H7L5.2 44H-5.2Z"/>` +
    `<g transform="translate(0 44)"><path class="shoe" d="M-5.6 -3H5.6L7.8 5C7.8 9.6 -7.8 9.6 -7.8 5Z"/></g></g></g></g></g>`
  );
}

function lowerSvg(o: Person, out: Outfit): string {
  if (out === "saree") {
    return (
      `<g transform="translate(0 80)"><g class="skirt" style="--ska:-2.5deg;--scx:1"><path class="k2" d="M-14 0H14C18.5 40 25 78 27.5 111H-27.5C-25 78 -18.5 40 -14 0Z"/>` +
      `<path d="M-5 4L-9 111M0 4V111M5 4L9 111M-10 8L-18 111M10 8L18 111" stroke="#000" stroke-opacity=".16" stroke-width="1.2" fill="none"/>` +
      `<path class="k3" d="M-26.6 99H26.6L27.6 111H-27.6Z"/><path class="k3s nf" stroke-width="1" d="M-26 94H26"/></g></g>`
    );
  }
  if (out === "dress") {
    const hem = o.hem || 142;
    const h = hem - 80;
    const W = 14 + h * 0.36;
    return (
      `<g transform="translate(0 80)"><g class="skirt" style="--ska:-4deg;--scx:1"><path class="k2" d="${skirtPath(hem)}"/>` +
      `<path d="M-6 6L${f(-W * 0.4)} ${h}M0 6V${h}M6 6L${f(W * 0.4)} ${h}" stroke="#000" stroke-opacity=".13" stroke-width="1.2" fill="none"/>` +
      `<path class="k3" d="M${f(-W)} ${h - 7}H${f(W)}L${f(W)} ${h}H${f(-W)}Z"/></g></g>`
    );
  }
  if (out === "veshti") {
    return (
      `<path style="fill:var(--c2)" d="M-17.5 98H17.5C21 130 23.5 160 24.5 190H-24.5C-23.5 160 -21 130 -17.5 98Z"/>` +
      `<path d="M-7 110L-10 190M2 108L3 190M10 112L16 190" stroke="#000" stroke-opacity=".1" stroke-width="1.4" fill="none"/>` +
      `<path class="k3" d="M-24.6 179H24.6L24.9 190H-24.9Z"/><path class="k3s nf" stroke-width="2.4" d="M-3 118L-3.6 179"/>`
    );
  }
  return "";
}

function upperSvg(out: Outfit): string {
  let s = "";
  if (out === "saree") {
    s += '<path class="k1" d="M-19 45C-10 41 10 41 19 45L16.5 62C15.8 68 14.8 72 14.2 76H-14.2C-14.8 72 -15.8 68 -16.5 62Z"/>';
    s += '<path class="skn" d="M-7.6 42.4C-5 53.5 5 53.5 7.6 42.4Z"/><path class="k3s nf" stroke-width="1.2" d="M-7.6 42.4C-5 53.5 5 53.5 7.6 42.4"/>';
    s += '<path class="k3s nf" stroke-width="1.6" stroke-linecap="round" d="M-8.4 41.6C-6 57 6 57 8.4 41.6"/>';
    s += '<path class="k2" style="stroke:var(--c3);stroke-width:1.6" d="M-21 43L-10 41.6C0 55 10 70 16.5 86L17.5 118L6.5 118C6.5 100 -5 74 -21 55Z"/>';
    s += '<path d="M-3 62L3 70M2 80L8 90M-10 52L-6 58" stroke="#fff" stroke-opacity=".22" stroke-width="1.2" fill="none"/>';
    s += '<path class="k3s nf" stroke-width="3" d="M-13.6 80H13.6"/>';
  } else if (out === "dress") {
    s += '<path class="k1" d="M-15.5 57C-11 54.4 -6 57 0 59C6 57 11 54.4 15.5 57L14.2 80H-14.2Z"/>';
    s += '<path class="k1s nf" stroke-width="2.2" stroke-linecap="round" d="M-9.5 56L-8.4 43.6M9.5 56L8.4 43.6"/>';
    s += '<path class="k3s nf" stroke-width="3" d="M-14.2 80.5H14.2"/>';
    s += '<path class="k3s nf" stroke-width="1.2" d="M-6 46C-3 52 3 52 6 46"/>';
  } else if (out === "veshti" || out === "kurta") {
    s += '<path class="k1" d="M-24 45C-12 41 12 41 24 45L22.4 70C21.4 90 22.4 110 23.4 126H-23.4C-22.4 110 -21.4 90 -22.4 70Z"/>';
    s += '<path d="M-22.4 70C-21.4 90 -22.4 110 -23.4 126H-17C-17 108 -18 90 -18.5 70Z" fill="#000" fill-opacity=".08"/>';
    s += '<path class="k3s nf" stroke-width=".8" d="M0 46V126"/><circle class="k3" cx="0" cy="58" r="1.1"/><circle class="k3" cx="0" cy="74" r="1.1"/><circle class="k3" cx="0" cy="90" r="1.1"/>';
    s += '<path class="k3s nf" stroke-width="1.6" d="M-6 41.5L-3.6 47H3.6L6 41.5"/>';
    s += '<path class="k3" d="M-23.4 122H23.4L23.6 126H-23.6Z"/>';
    if (out === "veshti") {
      s += '<path class="k3" fill-opacity=".95" d="M10 43L22 48C15 70 -3 98 -19 114L-24 106C-8 90 3 66 10 43Z"/>';
      s += '<path d="M10 43L22 48" stroke="#7c0f1f" stroke-opacity=".5" stroke-width="1.4" fill="none"/>';
    }
  } else if (out === "suit") {
    s += '<path class="k1" d="M-25 45C-12 41 12 41 25 45L23.4 72C22.4 92 23.4 106 24.4 116H-24.4C-23.4 106 -22.4 92 -23.4 72Z"/>';
    s += '<path d="M-7 41.4L0 84L7 41.4Z" fill="#f6f3ee"/>';
    s += '<path d="M-7 41.4L-15 47L-5 82L-1.5 62Z" fill="#000" fill-opacity=".2"/><path d="M7 41.4L15 47L5 82L1.5 62Z" fill="#000" fill-opacity=".2"/>';
    s += '<path class="k3" d="M0 46L-2.6 52L0 82L2.6 52Z"/><path d="M13 64L19 63.4L18.6 67H13.4Z" fill="#fff"/>';
    s += '<circle cx="0" cy="96" r="1.2" fill="#000" fill-opacity=".4"/>';
  }
  return s;
}

function armSvg(side: -1 | 1, o: Person, sx: number, out: Outfit): string {
  const cls = side < 0 ? "L" : "R";
  const X = side * sx;
  const sl = out === "veshti" || out === "kurta" || out === "suit" ? "long" : out === "saree" ? "short" : "none";
  const us =
    sl === "none"
      ? ""
      : `<path class="k1" d="M-7 -2C-3 -4.5 3 -4.5 7 -2L${sl === "long" ? "6.2 31H-6.2" : "6.4 12H-6.4"}Z"/>`;
  const fs = sl === "long" ? '<path class="k1" d="M-6.2 -1H6.2L5.2 25H-5.2Z"/>' : "";
  const prop = side < 0 ? o.propL || "" : o.propR || "";
  const bang = o.bangles ? '<path class="k3s nf" stroke-width="1.8" d="M-3.9 28H3.9M-3.9 30.6H3.9"/>' : "";
  return (
    `<g transform="translate(${X} 46)"><g class="joint sh${cls}"><path class="skn" d="M-5.4 -1H5.4C5.6 10 5 20 4.4 31H-4.4C-5 20 -5.6 10 -5.4 -1Z"/>${us}` +
    `<g transform="translate(0 30)"><g class="joint el${cls}"><path class="skn" d="M-4.5 -1H4.5C4.6 10 4 22 3.2 33H-3.2C-4 22 -4.6 10 -4.5 -1Z"/>${fs}${bang}` +
    `<g transform="translate(0 33)"><path class="skn" d="M-3.4 -1C-4.8 4 -4 8 0 9.8C4 8 4.8 4 3.4 -1Z"/><path class="skn" d="M3 1C5.4 2.4 6 4.6 5 6.4"/>${prop}</g></g></g></g></g>`
  );
}

function headSvg(o: Person): string {
  const fm = !!o.f;
  const hs: Hair = o.hs || (fm ? "braid" : "short");
  let s = "";
  const longish = hs === "braid" || hs === "long" || hs === "bun" || hs === "pig";
  if (longish)
    s += '<path class="hr" d="M-14.4 14C-15 0 -7 -3.4 0 -3.4C7 -3.4 15 0 14.4 14C14.6 24 11 31 7 33H-7C-11 31 -14.6 24 -14.4 14Z"/>';
  if (hs === "bun") s += '<circle class="hr" cx="0" cy="-6" r="7.5"/>';
  if (hs === "pig") s += '<circle class="hr" cx="-17" cy="9" r="6.4"/><circle class="hr" cx="17" cy="9" r="6.4"/>';
  s += '<ellipse class="skn2" cx="-13.2" cy="18" rx="2.4" ry="3.8"/><ellipse class="skn2" cx="13.2" cy="18" rx="2.4" ry="3.8"/>';
  s += '<path class="skn" d="M-13 14C-13 2 -7 0 0 0C7 0 13 2 13 14C13 24 7 33.5 0 34.6C-7 33.5 -13 24 -13 14Z"/>';
  s += '<path class="skn2" fill-opacity=".35" d="M-13 15C-13 24 -7 33.5 0 34.6C-5 31 -10 24 -10.5 15Z"/>';
  s += `<ellipse cx="-8" cy="23" rx="3.4" ry="2.1" fill="#e0556b" fill-opacity="${fm ? 0.24 : 0.14}"/><ellipse cx="8" cy="23" rx="3.4" ry="2.1" fill="#e0556b" fill-opacity="${fm ? 0.24 : 0.14}"/>`;
  [-5.4, 5.4].forEach((x) => {
    s += `<g class="blink" style="--bd:${o.bd || 0}s"><ellipse cx="${x}" cy="15.6" rx="2.9" ry="2.1" fill="#fff"/><circle cx="${x}" cy="15.7" r="1.6" fill="#2a1710"/><circle cx="${x + 0.5}" cy="15.1" r=".55" fill="#fff"/></g>`;
    s += `<path d="M${x - 3.5} 14.4Q${x} 12.6 ${x + 3.5} 14.4" fill="none" stroke="#1a100c" stroke-width="${fm ? 1.3 : 1}" stroke-linecap="round"/>`;
    s += `<path class="hs nf" stroke-linecap="round" stroke-width="${fm ? 1.2 : 1.9}" d="M${x - 3.6} 11.4Q${x} ${fm ? 9.4 : 9.8} ${x + 3.8} 11"/>`;
  });
  s += '<path class="s2s nf" stroke-width="1.1" stroke-linecap="round" d="M0 17.6Q2.2 21.6 -.4 22.8"/>';
  if (o.open) {
    s += '<path d="M-3.8 26.2Q0 34 3.8 26.2Q0 25 -3.8 26.2Z" fill="#4a1018"/><path d="M-2.6 26.6Q0 27.6 2.6 26.6" stroke="#fff" stroke-width="1" fill="none"/>';
  } else if (o.blow) {
    s += '<ellipse cx="0" cy="27.2" rx="2.1" ry="2.6" fill="#7a2a2a"/>';
  } else if (fm) {
    s += '<path d="M-3.8 27Q-1.9 25.6 0 26.3Q1.9 25.6 3.8 27Q0 30.6 -3.8 27Z" fill="#c0394f"/>';
  } else {
    s += '<path d="M-3.8 27Q0 30.6 3.8 27" fill="none" stroke="#6b2222" stroke-width="1.3" stroke-linecap="round"/>';
  }
  if (o.mus)
    s += '<path class="hr" d="M-5.4 25.2Q-2.6 23.2 0 24.6Q2.6 23.2 5.4 25.2Q2.6 26 0 25.2Q-2.6 26 -5.4 25.2Z"/>';
  if (fm) s += '<circle cx="0" cy="8" r="1.4" fill="#c4143a"/>';
  if (o.tilak)
    s += '<path d="M-4 5.4H4M-4.6 7H4.6M-4 8.6H4" stroke="#fff" stroke-opacity=".85" stroke-width="1" fill="none"/><circle cx="0" cy="7" r="1.1" fill="#c4143a"/>';
  if (fm && o.jewel !== false) s += '<circle cx="-13.2" cy="22.6" r="1.9" class="k3"/><circle cx="13.2" cy="22.6" r="1.9" class="k3"/>';
  if (longish)
    s +=
      '<path class="hr" d="M-13.8 15C-14.6 1 -6.8 -2.8 0 -2.8C6.8 -2.8 14.6 1 13.8 15C12.6 8.4 8 4.4 0 3.6C-8 4.4 -12.6 8.4 -13.8 15Z"/><path class="s2s nf" stroke-width=".7" d="M0 -2.6V3.4"/>';
  if (hs === "short")
    s +=
      '<path class="hr" d="M-14 13C-15 -1 -6 -4 0 -4C8 -4 15 -1 14 13C13 8 11 6 9 5C4 3 -4 3.5 -8 5C-11 6.5 -13 9 -14 13Z"/><path class="hr" d="M-8.4 -2C-5 -9.4 7 -9.6 10.4 -1C5 -4.4 -3 -4.4 -8.4 -2Z"/>';
  if (hs === "braid") {
    for (let i = 0; i < 9; i++)
      s += `<circle cx="${f(-11 + i * 2.75)}" cy="${f(3.6 - Math.sin((i / 8) * Math.PI) * 1.2 + (i % 2 ? 0.6 : 0))}" r="1.6" fill="#fffdf2"/>`;
  }
  if (hs === "bun") {
    for (let i = 0; i < 6; i++)
      s += `<circle cx="${f(Math.cos(i * 1.05) * 8.2)}" cy="${f(-6 + Math.sin(i * 1.05) * 8.2)}" r="1.7" fill="#fffdf2"/>`;
  }
  if (hs === "pig") s += '<circle cx="-14.6" cy="3" r="2.6" class="k3"/><circle cx="14.6" cy="3" r="2.6" class="k3"/>';
  return s;
}

function braidSvg(): string {
  let s =
    '<path class="hr" d="M8 34C14 40 17 52 15.4 66C14.4 80 14.4 92 14 104L12 104C12.4 90 11.4 78 11.6 66C11.8 54 9 44 5 36Z"/>';
  for (let k = 0; k < 8; k++)
    s += `<ellipse class="hr" cx="${f(13.2 + (k % 2 ? 0.9 : -0.9))}" cy="${46 + k * 7.4}" rx="3.6" ry="4.6" stroke="#000" stroke-opacity=".28" stroke-width=".6"/>`;
  for (let k = 0; k < 4; k++) s += `<circle cx="${f(13.4 + (k % 2 ? 1 : -1))}" cy="${52 + k * 13}" r="1.7" fill="#fffdf2"/>`;
  s += '<path d="M12.6 104L13.4 112L14.4 104Z" fill="#c4143a"/>';
  return s;
}

function human(o: Person): string {
  const s = o.s || 1;
  const fm = !!o.f;
  const sx = fm ? 19 : 24;
  const p: Pose = o.pose || {};
  const out: Outfit = o.out || "kurta";
  const skin = o.skin || "#c68a5e";
  const st =
    `--skin:${skin};--skin2:${shade(skin, -0.17)};--hair:${o.hair || "#1a1210"};--c1:${o.c1 || "#888888"};` +
    `--c2:${o.c2 || "#555555"};--c3:${o.c3 || "#d4a73a"};--shoe:${o.shoe || "#2a1a16"}`;
  const trouser = out === "suit" || out === "kurta";
  const gl = o.gl || 198;
  const ty = (o.g || 404) - gl * s;
  const v: string[] = [`--t:${p.t || 1}s`, `--d:${p.d || 0}s`, `--b:${p.b || 0}px`];
  (["tw", "hd", "hpL", "hpR", "knL", "knR"] as const).forEach((k) => {
    const val = p[k];
    if (val) v.push(`--${k}a:${val[0]}deg`, `--${k}b:${val[1]}deg`);
  });
  (["L", "R"] as const).forEach((side) => {
    const a = side === "L" ? p.armL : p.armR;
    if (!a) return;
    const S: Pair = [side === "L" ? -sx : sx, 46];
    const A = a.a;
    const B = a.b || a.a;
    const pf = a.pref || "down";
    const ra = ik(S, A, side, pf);
    const rb = ik(S, B, side, pf);
    v.push(
      `--sh${side}a:${f(ra[0])}deg`,
      `--sh${side}b:${f(rb[0])}deg`,
      `--el${side}a:${f(ra[1])}deg`,
      `--el${side}b:${f(rb[1])}deg`,
    );
  });
  if (p.tj) Object.keys(p.tj).forEach((k) => v.push(`--t${k}:${p.tj![k]}s`));
  const legs = legSvg(-1, trouser) + legSvg(1, trouser);
  const up =
    (o.hs === "long"
      ? '<path class="hr" d="M-15 12C-20 36 -20 58 -14 72C-6 76 6 76 14 72C20 58 20 36 15 12Z"/>'
      : "") +
    `<path class="skn" d="${fm ? TF : TM}"/>` +
    '<path class="skn" d="M-5.4 30H5.4L6.2 45H-6.2Z"/><path class="skn2" fill-opacity=".5" d="M-5.4 33C-2 38.5 2 38.5 5.4 33V30H-5.4Z"/>' +
    upperSvg(out) +
    (o.hs === "braid" ? braidSvg() : "") +
    (o.mid || "") +
    armSvg(-1, o, sx, out) +
    armSvg(1, o, sx, out) +
    `<g transform="translate(0 40)"><g class="joint hd"><g transform="scale(${o.kid ? 1.2 : 1}) translate(0 -40)">${headSvg(o)}</g></g></g>`;
  return (
    `<g transform="translate(${f(o.x)} ${f(ty)}) scale(${s})" style="${st}">` +
    `<ellipse cx="0" cy="${gl}" rx="${fm ? 32 : 36}" ry="5" fill="#000" fill-opacity=".28"/>` +
    `<g class="bob" style="${v.join(";")}">${legs}${lowerSvg(o, out)}` +
    `<g transform="translate(0 100)"><g class="joint tw"><g transform="translate(0 -100)">${up}</g></g></g></g></g>`
  );
}

/* ---------- shared scenery ---------- */

function falling(n: number, seed: number, piece: (i: number) => string, tMin = 4): string {
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = R(i + seed) * 360;
    const t = tMin + R(i + seed + 30) * 3;
    const d = -R(i + seed + 60) * t;
    const dx = (R(i + seed + 90) - 0.5) * 70;
    const rot = (R(i + seed + 120) - 0.5) * 720;
    out += `<g transform="translate(${f(x)} 0)"><g class="fall" style="--t:${t.toFixed(2)}s;--d:${d.toFixed(2)}s;--dx:${f(dx)}px;--rot:${f(rot)}deg">${piece(i)}</g></g>`;
  }
  return out;
}

function crowd(n: number, seed: number, base: number, headY: number, k: number, arms: boolean, phones: boolean): string {
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = -6 + i * (372 / (n - 1)) + (R(i + seed) - 0.5) * 14;
    const h = headY + (R(i + seed + 5) - 0.5) * 14;
    const t = (0.5 + R(i + seed + 9) * 0.4).toFixed(2);
    const d = (-R(i + seed + 2)).toFixed(2);
    out +=
      `<g transform="translate(${f(x)} 0)"><g class="bob" style="--t:${t}s;--d:${d}s;--b:${f(5 * k)}px"><g class="sil">` +
      `<circle cy="${f(h)}" r="${f(10 * k)}"/>` +
      `<path d="M${f(-22 * k)} ${base}C${f(-22 * k)} ${f(h + 20 * k)} ${f(-12 * k)} ${f(h + 14 * k)} 0 ${f(h + 14 * k)}C${f(12 * k)} ${f(h + 14 * k)} ${f(22 * k)} ${f(h + 20 * k)} ${f(22 * k)} ${base}Z"/>`;
    if (arms && R(i + seed + 11) > 0.25) {
      [-1, 1].forEach((sd, j) => {
        if (R(i + seed + 20 + j) < 0.35) return;
        out +=
          `<g transform="translate(${f(sd * 16 * k)} ${f(h + 22 * k)})"><g class="wave" style="--t:${(0.5 + R(i + j) * 0.5).toFixed(2)}s;--d:${(-R(i + j + 4)).toFixed(2)}s">` +
          `<path class="nf" d="M0 0L${f(sd * 8 * k)} ${f(-44 * k)}" stroke-width="${f(7 * k)}" stroke-linecap="round"/></g></g>`;
      });
    }
    out += "</g>";
    if (phones && R(i + seed + 30) > 0.45)
      out += `<rect x="${f(14 * k)}" y="${f(h - 30 * k)}" width="${f(8 * k)}" height="${f(13 * k)}" rx="1.6" fill="#fffbe0" class="tw2" style="--t:${(1 + R(i)).toFixed(1)}s;--d:${(-R(i + 3)).toFixed(1)}s"/>`;
    out += "</g></g>";
  }
  return out;
}

/* ---------- scene 1: dance ---------- */

function dance(): string {
  let bg = "";
  bg +=
    '<defs><radialGradient id="vvD1" cx="50%" cy="20%" r="80%"><stop offset="0" style="stop-color:var(--accent2);stop-opacity:.55"/><stop offset=".55" style="stop-color:var(--bg);stop-opacity:.15"/><stop offset="1" style="stop-color:var(--deep);stop-opacity:0"/></radialGradient>' +
    '<linearGradient id="vvD2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.25"/><stop offset="1" style="stop-color:#000;stop-opacity:.45"/></linearGradient></defs>';
  bg += '<rect x="-20" y="-20" width="400" height="500" fill="url(#vvD1)"/>';
  bg += '<rect x="-20" y="0" width="400" height="12" class="fd"/><rect x="-20" y="12" width="400" height="3" class="fi" fill-opacity=".35"/>';
  for (let i = 0; i < 7; i++)
    bg += `<circle cx="${20 + i * 53}" cy="21" r="5" class="tw2 ${i % 2 ? "fa" : "fb"}" style="--t:${(0.5 + R(i) * 0.8).toFixed(2)}s;--d:${(-R(i + 3)).toFixed(2)}s"/>`;
  const bm: [string, number, number, number][] = [
    ["fb", -40, 10, 2.6],
    ["fa", 40, -10, 3.1],
    ["fi", -15, 30, 2.2],
    ["fb", 20, -35, 2.9],
  ];
  let beams = '<g transform="translate(180 70)">';
  bm.forEach((b) => {
    beams += `<path class="beam ${b[0]}" d="M0 0L-40 360L40 360Z" style="--r1:${b[1]}deg;--r2:${b[2]}deg;--t:${b[3]}s"/>`;
  });
  beams += "</g>";
  const ball =
    '<g transform="translate(180 70)"><path d="M0 -70V-24" class="si nf" stroke-width="2"/><circle r="24" class="fb"/>' +
    '<ellipse rx="24" ry="24" class="facet sd" style="--d:0s"/><ellipse rx="24" ry="24" class="facet sd" style="--d:-.55s"/><ellipse rx="24" ry="24" class="facet sd" style="--d:-1.1s"/>' +
    '<path d="M-21 -12H21M-24 0H24M-21 12H21" class="sd nf" stroke-width="1.5"/></g>';
  bg += beams + ball + crowd(10, 3, 430, 352, 1.05, true, false);
  bg += '<rect x="-20" y="404" width="400" height="70" fill="url(#vvD2)"/>';
  for (let i = 0; i < 8; i++)
    bg += `<rect x="${i * 45}" y="410" width="45" height="52" class="tile ${i % 2 ? "fb" : "fa"}" style="--d:${(-i * 0.17).toFixed(2)}s"/>`;
  const woman = human({
    x: 120, g: 404, s: 1.04, f: true, skin: "#c98f63", hair: "#150d0b", hs: "long", out: "dress", hem: 140,
    c1: "#ffd23f", c2: "#12c9bb", c3: "#fff4fa", shoe: "#ffd23f", bangles: true,
    pose: {
      t: 0.6, b: 7, tw: [-7, 7], hd: [-6, 6], hpL: [3, 12], hpR: [12, 3], knL: [0, 8], knR: [8, 0],
      armL: { a: [-52, 0], b: [-40, -38], pref: "down" }, armR: { a: [42, -36], b: [58, 8], pref: "down" },
    },
  });
  const man = human({
    x: 248, g: 404, s: 1.04, f: false, skin: "#a8693f", hair: "#120c0a", hs: "short", mus: true, out: "kurta",
    c1: "#fff4fa", c2: "#2a0a1c", c3: "#ffd23f", shoe: "#fff4fa",
    pose: {
      t: 0.6, d: -0.3, b: 11, tw: [8, -8], hd: [5, -5], hpL: [4, 14], hpR: [14, 4], knL: [0, 10], knR: [10, 0],
      armL: { a: [-50, -34], b: [-62, 6], pref: "down" }, armR: { a: [60, -8], b: [48, -40], pref: "down" },
    },
  });
  let fg = "";
  for (let i = 0; i < 12; i++)
    fg += `<circle cx="${f(R(i + 40) * 360)}" cy="${f(R(i + 60) * 400)}" r="${(1 + R(i + 80) * 2).toFixed(1)}" class="fi tw2" style="--t:${(0.6 + R(i)).toFixed(1)}s;--d:${(-R(i + 7)).toFixed(1)}s"/>`;
  return layer(0, bg) + layer(1, woman + man) + layer(2, fg);
}

/* ---------- scene 2: live music ---------- */

function music(): string {
  let bg = "";
  bg +=
    '<defs><linearGradient id="vvM1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent2);stop-opacity:.35"/><stop offset=".7" style="stop-color:var(--bg);stop-opacity:.1"/><stop offset="1" style="stop-color:#000;stop-opacity:.4"/></linearGradient></defs>';
  bg += '<rect x="-20" y="-20" width="400" height="500" fill="url(#vvM1)"/>';
  bg += '<rect x="28" y="100" width="304" height="190" rx="10" class="fg" stroke-width="3" style="stroke:var(--accent);fill-opacity:.8"/>';
  for (let i = 0; i < 22; i++)
    bg += `<rect x="${f(40 + i * 12.9)}" y="110" width="8" height="172" rx="4" class="eq ${i % 3 ? "fb" : "fa"}" fill-opacity=".6" style="--t:${(0.45 + R(i) * 0.7).toFixed(2)}s;--d:${(-R(i + 9)).toFixed(2)}s"/>`;
  bg += '<rect x="-20" y="0" width="400" height="14" class="fd"/>';
  const lamps: [number, string, number, number, number][] = [
    [40, "fb", -24, 18, 2.8],
    [110, "fa", 10, -20, 3.3],
    [180, "fi", -14, 14, 2.5],
    [250, "fa", -10, 22, 3.1],
    [320, "fb", 22, -16, 2.7],
  ];
  lamps.forEach((l) => {
    bg += `<g transform="translate(${l[0]} 14)"><circle r="7" class="${l[1]}"/><path class="beam spot ${l[1]}" d="M0 0L-34 330L34 330Z" style="--r1:${l[2]}deg;--r2:${l[3]}deg;--t:${l[4]}s"/></g>`;
  });
  const spk = (x: number) =>
    `<g transform="translate(${x} 262)"><rect width="52" height="142" rx="8" class="fg" stroke-width="3" style="stroke:var(--accent)"/>` +
    '<circle cx="26" cy="30" r="8" class="nf sa pulse" stroke-width="3"/>' +
    '<circle cx="26" cy="92" r="21" class="fa pulse" fill-opacity=".25" stroke-width="3" style="stroke:var(--accent)"/><circle cx="26" cy="92" r="7" class="fa"/></g>';
  bg += spk(4) + spk(304);
  bg += '<rect x="-20" y="404" width="400" height="70" fill="#000" fill-opacity=".45"/><ellipse cx="180" cy="414" rx="170" ry="12" class="fa" fill-opacity=".18"/>';
  const singer = human({
    x: 132, g: 408, s: 1.04, f: true, skin: "#b9784c", hair: "#0f0a0a", hs: "long", out: "dress", hem: 150,
    c1: "#101028", c2: "#7dffb2", c3: "#ff5fa2", shoe: "#ff5fa2", bangles: true, open: true, bd: 0.6,
    propR:
      '<rect x="-2.4" y="-2" width="4.8" height="13" rx="2.4" fill="#2d2d38"/><circle cy="12" r="4.8" fill="#c3c6d2"/><path d="M-3.4 12H3.4M-3 9.6H3" stroke="#6b6e7a" stroke-width=".8"/>',
    pose: {
      t: 1.2, b: 3, tw: [-3, 3], hd: [-4, 5], hpL: [3, 6], hpR: [6, 3],
      armR: { a: [5, 44], pref: "down" }, armL: { a: [-54, -22], b: [-46, 6], pref: "down" },
    },
  });
  const gtr =
    '<path d="M20 90L76 70L79 76L22 98Z" fill="#5a3216"/><rect x="74" y="66" width="12" height="9" rx="2" fill="#3a200d" transform="rotate(-19 80 70)"/>' +
    '<ellipse cx="-4" cy="99" rx="21" ry="16" fill="#c47a35" stroke="#5a3216" stroke-width="1.4"/><ellipse cx="14" cy="91" rx="14" ry="12" fill="#c47a35" stroke="#5a3216" stroke-width="1.4"/>' +
    '<circle cx="6" cy="95" r="5.4" fill="#2a160a"/><path d="M12 96L74 72M12 94L74 71M12 92L74 70" stroke="#e8e8f5" stroke-width=".5"/>';
  const guitarist = human({
    x: 252, g: 408, s: 1.04, f: false, skin: "#9a603a", hair: "#0d0807", hs: "short", out: "kurta",
    c1: "#f1eeff", c2: "#1a1440", c3: "#7dffb2", shoe: "#7dffb2", mid: gtr, mus: true,
    pose: {
      t: 0.8, b: 3, tw: [-3, 3], hd: [-4, 6], hpL: [9, 10], hpR: [10, 9], tj: { elL: 0.22, shL: 0.22 },
      armL: { a: [-4, 92], b: [-6, 102], pref: "out" }, armR: { a: [60, 76], pref: "down" },
    },
  });
  let notes = "";
  const nx = [90, 150, 215, 285, 180];
  for (let i = 0; i < 5; i++)
    notes +=
      `<g transform="translate(${nx[i]} 250)"><g class="note" style="--t:${(3.6 + R(i) * 1.6).toFixed(1)}s;--d:${(-R(i + 3) * 4).toFixed(1)}s;--dx:${f((R(i + 7) - 0.5) * 50)}px">` +
      '<ellipse rx="8" ry="6" transform="rotate(-20)" class="fi"/><path d="M7 -2V-28q10 4 11 14" class="si nf" stroke-width="3" stroke-linecap="round"/></g></g>';
  return layer(0, bg) + layer(1, singer + guitarist + notes) + layer(2, crowd(7, 30, 500, 440, 1.55, true, true));
}

/* ---------- scene 3: wedding ---------- */

function wedding(): string {
  let bg = "";
  bg +=
    '<defs><radialGradient id="vvW1" cx="50%" cy="46%" r="62%"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.5"/><stop offset=".55" style="stop-color:var(--accent2);stop-opacity:.12"/><stop offset="1" style="stop-color:var(--deep);stop-opacity:0"/></radialGradient></defs>';
  bg += '<rect x="-20" y="-20" width="400" height="500" fill="url(#vvW1)"/>';
  bg +=
    '<g transform="translate(180 215)"><g class="slow"><circle r="130" class="nf sa" stroke-width="2" stroke-dasharray="2 14" stroke-linecap="round"/><circle r="108" class="nf sb" stroke-width="2" stroke-dasharray="10 10"/>';
  for (let i = 0; i < 12; i++) bg += `<ellipse cx="0" cy="-90" rx="9" ry="22" transform="rotate(${i * 30})" class="fb" fill-opacity=".28"/>`;
  bg += "</g></g>";
  let scal = "M10 112";
  for (let i = 0; i < 12; i++) scal += "a14.17 18 0 0 0 28.33 0";
  bg += '<rect x="20" y="108" width="14" height="300" rx="4" class="fa"/><rect x="326" y="108" width="14" height="300" rx="4" class="fa"/>';
  bg +=
    '<rect x="20" y="170" width="14" height="10" class="fd" fill-opacity=".5"/><rect x="326" y="170" width="14" height="10" class="fd" fill-opacity=".5"/><rect x="20" y="250" width="14" height="10" class="fd" fill-opacity=".5"/><rect x="326" y="250" width="14" height="10" class="fd" fill-opacity=".5"/>';
  bg += `<path d="${scal}" class="fb sa" fill-opacity=".4" stroke-width="3"/>`;
  for (let i = 0; i < 12; i++) {
    const n = 2 + Math.floor(R(i + 3) * 3);
    bg += `<g transform="translate(${f(24.17 + i * 28.33)} 130)"><g class="sway" style="--t:${(1.6 + R(i) * 1.2).toFixed(1)}s;--d:${(-R(i + 5) * 2).toFixed(1)}s">`;
    for (let k = 0; k < n; k++) bg += `<circle cy="${8 + k * 13}" r="5.5" class="${(i + k) % 2 ? "fa" : "fb"}"/>`;
    bg += "</g></g>";
  }
  bg += '<rect x="-20" y="404" width="400" height="70" class="fd" fill-opacity=".65"/>';
  bg +=
    '<ellipse cx="180" cy="428" rx="140" ry="16" class="nf si" stroke-width="3" stroke-dasharray="1 8" stroke-linecap="round" stroke-opacity=".8"/><ellipse cx="180" cy="428" rx="100" ry="11" class="nf sa" stroke-width="2" stroke-opacity=".7"/>';
  ([[420, 9], [430, 7], [440, 5]] as Pair[]).forEach((r) => {
    for (let j = 0; j < r[1]; j++) bg += `<circle cx="${f(180 + (j - (r[1] - 1) / 2) * 16)}" cy="${r[0]}" r="1.8" class="fi" fill-opacity=".85"/>`;
  });
  const lamp = (x: number) => {
    let fl = "";
    ([[-10, -66], [0, -72], [10, -66]] as Pair[]).forEach((p) => {
      fl += `<g transform="translate(${p[0]} ${p[1]})"><path class="flame fb" d="M0 0C-6 -8 0 -14 0 -20C0 -14 6 -8 0 0Z"/></g>`;
    });
    return `<g transform="translate(${x} 404)"><circle cy="-76" r="24" class="fb glow"/><ellipse rx="18" ry="5" class="fa"/><path d="M-6 0L-3 -60H3L6 0Z" class="fa"/><ellipse cy="-60" rx="15" ry="4" class="fa"/><path d="M-15 -60Q0 -50 15 -60" class="nf sd" stroke-width="1.5"/>${fl}</g>`;
  };
  bg += lamp(64) + lamp(296);
  const bride = human({
    x: 146, g: 404, s: 1.08, f: true, skin: "#c68a5e", hair: "#120b0a", hs: "braid", out: "saree",
    c1: "#c2185b", c2: "#0f8f6b", c3: "#ffc23d", shoe: "#ffc23d", bangles: true,
    pose: {
      t: 2.6, b: 2, tw: [-1.5, 2], hd: [0, 3], hpL: [3, 3], hpR: [3, 3],
      armR: { a: [39, 11], b: [39, 66], pref: "down" }, armL: { a: [27, 20], b: [29, 58], pref: "down" },
    },
  });
  const groom = human({
    x: 214, g: 404, s: 1.08, f: false, skin: "#a8693f", hair: "#120c0a", hs: "short", mus: true, tilak: true, out: "veshti",
    c1: "#fff1dd", c2: "#fffaf0", c3: "#ffc23d", shoe: "#7a3b12",
    pose: {
      t: 2.6, b: 2, tw: [0, 3], hd: [0, -9], tj: { hd: 2.6 }, hpL: [2, 2], hpR: [2, 2],
      armL: { a: [5, 64], pref: "out" }, armR: { a: [-5, 64], pref: "out" },
    },
  });
  const garland =
    '<g transform="translate(214 262)"><g class="put"><ellipse rx="27" ry="38" class="nf sb" stroke-width="10" stroke-dasharray="1 12" stroke-linecap="round"/><ellipse rx="27" ry="38" class="nf sa" stroke-width="3"/><ellipse rx="21" ry="32" class="nf sa" stroke-width="7" stroke-dasharray="1 10" stroke-linecap="round"/></g></g>';
  const herGarland =
    '<g transform="translate(146 266)"><ellipse rx="15" ry="22" class="nf sb" stroke-width="7" stroke-dasharray="1 9" stroke-linecap="round"/><ellipse rx="15" ry="22" class="nf sa" stroke-width="2"/></g>';
  const pcols = ["var(--accent)", "var(--accent2)", "#fff1dd", "#ff9ab0"];
  const petals = falling(18, 40, (j) => `<ellipse rx="4" ry="7" style="fill:${cyc(pcols, j)}"/>`);
  return layer(0, bg) + layer(1, bride + herGarland + groom + garland) + layer(2, petals);
}

/* ---------- scene 4: proposal ---------- */

function gopuram(x: number, base: number, w: number, h: number): string {
  let s = `<g transform="translate(${x} ${base})" class="sil2">`;
  let y = 0;
  const th = h / 9;
  for (let k = 0; k < 8; k++) {
    const ww = w * (1 - k * 0.105);
    y -= th;
    s += `<path d="M${f(-ww / 2)} ${f(y + th)}L${f(-ww / 2 + 1.5)} ${f(y)}H${f(ww / 2 - 1.5)}L${f(ww / 2)} ${f(y + th)}Z"/>`;
    if (k < 7)
      s += `<rect x="-2.2" y="${f(y + th * 0.3)}" width="4.4" height="${f(th * 0.4)}" rx="1" class="fb tw2" style="--t:${(1 + R(k + x) * 2).toFixed(1)}s;--d:${(-R(k + 3) * 2).toFixed(1)}s"/>`;
  }
  s += `<path d="M${f(-w * 0.2)} ${f(y)}Q0 ${f(y - th * 2)} ${f(w * 0.2)} ${f(y)}Z"/><rect x="-1" y="${f(y - th * 2.4)}" width="2" height="${f(th * 0.7)}"/></g>`;
  return s;
}

function burst(x: number, y: number, col: string, d: number): string {
  let s = `<g transform="translate(${x} ${y})"><g class="burst" style="--d:${d}s">`;
  for (let k = 0; k < 14; k++) {
    const a = (k * Math.PI * 2) / 14;
    s += `<path d="M${f(Math.cos(a) * 10)} ${f(Math.sin(a) * 10)}L${f(Math.cos(a) * 34)} ${f(Math.sin(a) * 34)}" class="nf ${col}" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  return s + "</g></g>";
}

function proposal(): string {
  let bg = "";
  bg +=
    '<defs><linearGradient id="vvP1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:#050e16;stop-opacity:.9"/><stop offset=".7" style="stop-color:var(--bg);stop-opacity:.2"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:.22"/></linearGradient></defs>';
  bg += '<rect x="-20" y="-20" width="400" height="500" fill="url(#vvP1)"/>';
  for (let i = 0; i < 26; i++)
    bg += `<circle cx="${f(R(i) * 360)}" cy="${f(R(i + 50) * 200)}" r="${(0.8 + R(i + 90) * 1.5).toFixed(1)}" class="fi tw2" style="--t:${(1 + R(i + 20) * 2).toFixed(1)}s;--d:${(-R(i + 70) * 3).toFixed(1)}s"/>`;
  bg += '<circle cx="296" cy="84" r="46" class="fb glow"/><circle cx="296" cy="84" r="24" class="fb"/>';
  bg += burst(86, 96, "sa", 0) + burst(236, 60, "sb", -1.2) + burst(180, 130, "si", -2.4);
  bg += gopuram(64, 404, 120, 230) + gopuram(300, 404, 84, 150);
  bg += '<path d="M-20 404V352H40V330H70V352H120V340H150V352H230V338H260V352H380V404Z" class="sil2"/>';
  for (let i = 0; i < 16; i++)
    bg += `<rect x="${f(R(i + 7) * 340)}" y="${f(356 + R(i + 1) * 38)}" width="4" height="5" class="fb tw2" style="--t:${(1 + R(i) * 2).toFixed(1)}s;--d:${(-R(i + 2) * 3).toFixed(1)}s"/>`;
  bg += '<path d="M-10 40Q180 130 370 40" class="nf si" stroke-width="1.5" stroke-opacity=".5"/>';
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    bg += `<circle cx="${f(bez(t, -10, 180, 370))}" cy="${f(bez(t, 40, 130, 40) + 7)}" r="6" class="tw2 ${i % 2 ? "fa" : "fb"}" style="--t:${(1.2 + R(i) * 1.2).toFixed(1)}s;--d:${(-R(i + 4) * 2).toFixed(1)}s"/>`;
  }
  bg += '<rect x="-20" y="404" width="400" height="70" fill="#050e16" fill-opacity=".7"/>';
  for (let i = 0; i < 18; i++) {
    const tt = (i / 18) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(tt), 3);
    const hy = 13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt);
    const cx = 180 + hx * 8.6;
    const cy = 428 - hy * 2.7;
    bg +=
      `<g transform="translate(${f(cx)} ${f(cy)})"><rect x="-2" y="-5" width="4" height="7" rx="1" fill="#fff4e0"/><g transform="translate(0 -5)"><path class="flame fb" d="M0 0C-3 -4 0 -7 0 -10C0 -7 3 -4 0 0Z" style="animation-delay:${(-R(i) * 0.4).toFixed(2)}s"/></g>` +
      `<circle cy="-9" r="9" class="fb glow" style="animation-delay:${(-R(i + 4) * 2).toFixed(1)}s"/></g>`;
  }
  const ring =
    '<g transform="translate(12 24)"><rect x="-8" y="-1" width="16" height="11" rx="2.5" fill="#7a1230"/><path d="M-8 3H8" stroke="#ffd98a" stroke-width="1"/><circle cy="-6" r="5" class="nf sb" stroke-width="2.4"/><path d="M0 -10L3.4 -14L0 -18L-3.4 -14Z" class="fb"/>' +
    '<g transform="translate(0 -17)"><g class="sp"><path d="M0 -10L2.6 -2.6L10 0L2.6 2.6L0 10L-2.6 2.6L-10 0L-2.6 -2.6Z" class="fi"/></g></g></g>';
  const man = human({
    x: 118, g: 408, gl: 152, s: 1.04, f: false, skin: "#b0764a", hair: "#0e0a09", hs: "short", mus: true, out: "suit",
    c1: "#eee7da", c2: "#1a1f2e", c3: "#ff7f96", shoe: "#111", propR: ring,
    pose: {
      t: 1.6, b: 2, tw: [3, 6], hd: [-4, -8], hpL: [8, 8], hpR: [88, 88], knL: [-82, -82], knR: [88, 88],
      armR: { a: [88, 26], b: [90, 22], pref: "down" }, armL: { a: [-20, 100], pref: "down" },
    },
  });
  const woman = human({
    x: 268, g: 404, s: 1.04, f: true, skin: "#c98f63", hair: "#140c0b", hs: "long", out: "dress", hem: 184,
    c1: "#ff7f96", c2: "#ffb3c1", c3: "#ffd98a", shoe: "#ffd98a", bangles: true,
    pose: {
      t: 0.7, b: 7, tw: [-2, 2], hd: [-5, 5], hpL: [2, 5], hpR: [5, 2],
      armL: { a: [5, 33], b: [4, 31], pref: "out" }, armR: { a: [-5, 34], b: [-4, 32], pref: "out" },
    },
  });
  let hearts = "";
  for (let i = 0; i < 8; i++)
    hearts +=
      `<g transform="translate(${f(200 + R(i) * 120)} 260)"><g class="rise" style="--t:${(3.6 + R(i + 1) * 2).toFixed(1)}s;--d:${(-R(i + 2) * 5).toFixed(1)}s;--dx:${f((R(i + 4) - 0.5) * 50)}px">` +
      `<path d="M0 10C-18 -4 -8 -18 0 -7C8 -18 18 -4 0 10Z" transform="scale(${(0.7 + R(i + 6) * 0.7).toFixed(2)})" class="${cyc(["fi", "fa", "fb"], i)}"/></g></g>`;
  return layer(0, bg) + layer(1, man + woman) + layer(2, hearts);
}

/* ---------- scene 5: birthday ---------- */

function birthday(): string {
  let bg = "";
  const cols = ["var(--ink)", "var(--accent)", "#ffd23f", "#fff4e8"];
  bg +=
    '<defs><radialGradient id="vvB1" cx="50%" cy="38%" r="70%"><stop offset="0" style="stop-color:#fff4e8;stop-opacity:.5"/><stop offset="1" style="stop-color:var(--deep);stop-opacity:0"/></radialGradient></defs>';
  bg += '<rect x="-20" y="-20" width="400" height="500" fill="url(#vvB1)"/>';
  bg += '<rect x="-20" y="404" width="400" height="70" class="fi" fill-opacity=".2"/>';
  bg += '<path d="M-10 26Q180 84 370 26" class="nf si" stroke-width="2"/>';
  const word = "HAPPY.BIRTHDAY";
  for (let i = 0; i < 14; i++) {
    const t = (i + 0.5) / 14;
    const x = bez(t, -10, 180, 370);
    const y = bez(t, 26, 84, 26);
    const ang = (Math.atan2(2 * (1 - t) * 58 + 2 * t * -58, 380) * 180) / Math.PI;
    const ch = word.charAt(i);
    bg += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><g class="sway" style="--t:${(1.8 + R(i)).toFixed(1)}s;--d:${(-R(i + 4) * 2).toFixed(1)}s">`;
    if (ch === ".") bg += '<circle cy="9" r="7" style="fill:#ffd23f"/>';
    else
      bg += `<path d="M-11 0H11L0 30Z" style="fill:${cyc(cols, i)}"/><text x="0" y="14" text-anchor="middle" style="font-family:Impact,'Arial Black',sans-serif;font-size:11px;fill:${i % 4 === 0 ? "#fff4e8" : "#1a1033"}">${ch}</text>`;
    bg += "</g></g>";
  }
  const balloon = (x: number, rot: number, len: number, fill: string, t: number) =>
    `<g transform="translate(${x} 270) rotate(${rot})"><g class="floatB" style="--t:${t}s"><path d="M0 0C10 -40 -10 -80 0 -${len}" class="nf si" stroke-width="1.5"/>` +
    `<g transform="translate(0 -${len + 27})"><ellipse rx="22" ry="27" style="fill:${fill}"/><ellipse cx="-8" cy="-9" rx="5" ry="8" fill="#fff" fill-opacity=".4"/><path d="M-5 27L0 34L5 27Z" style="fill:${fill}"/></g></g></g>`;
  bg +=
    balloon(36, -9, 170, "var(--ink)", 2.4) +
    balloon(46, 10, 210, "var(--accent)", 2.9) +
    balloon(324, -10, 176, "#ffd23f", 2.6) +
    balloon(316, 9, 214, "#fff4e8", 3.1);
  const kid = human({
    x: 180, g: 392, s: 0.62, f: true, kid: true, skin: "#d49a6e", hair: "#120b0a", hs: "pig", out: "dress", hem: 140,
    c1: "#ff3d7f", c2: "#ffd23f", c3: "#fff4e8", shoe: "#fff4e8", blow: true, jewel: false,
    pose: {
      t: 0.6, b: 2, tw: [-2, 2], hd: [2, 10], hpL: [2, 2], hpR: [2, 2],
      armL: { a: [6, 66], b: [10, 74], pref: "out" }, armR: { a: [-6, 66], b: [-10, 74], pref: "out" },
    },
  });
  const clap = (d: number): Pose => ({
    t: 0.45, d, b: 3, tw: [-3, 3], hd: [-5, 5], hpL: [3, 3], hpR: [3, 3],
    armL: { a: [4, 56], b: [-13, 62], pref: "out" }, armR: { a: [-4, 56], b: [13, 62], pref: "out" },
  });
  const mom = human({
    x: 62, g: 404, s: 1, f: true, skin: "#c68a5e", hair: "#120b0a", hs: "braid", out: "saree",
    c1: "#ffd23f", c2: "#0a8f86", c3: "#fff4e8", shoe: "#fff4e8", bangles: true, pose: clap(0),
  });
  const dad = human({
    x: 298, g: 404, s: 1, f: false, skin: "#a8693f", hair: "#120c0a", hs: "short", mus: true, out: "kurta",
    c1: "#fff4e8", c2: "#1a1033", c3: "#0fd5c0", shoe: "#1a1033", pose: clap(-0.2),
  });
  const tbl =
    '<path d="M96 352H264L276 404H84Z" style="fill:#fff4e8"/><path d="M96 352H264L266 366H94Z" class="fa"/><path d="M110 366Q120 380 130 366Q140 380 150 366Q160 380 170 366Q180 380 190 366Q200 380 210 366Q220 380 230 366Q240 380 250 366" class="nf fa" stroke-width="3"/>' +
    '<rect x="84" y="346" width="192" height="8" rx="3" style="fill:#fff4e8"/>';
  let cake =
    '<ellipse cx="180" cy="348" rx="54" ry="5" class="fi" fill-opacity=".5"/>' +
    '<rect x="140" y="322" width="80" height="26" rx="6" class="fi"/><path d="M140 322' + "a8 9 0 0 0 16 0".repeat(5) + 'z" style="fill:#fff4e8"/>' +
    '<rect x="154" y="302" width="52" height="22" rx="6" class="fa"/><path d="M154 302' + "a6.5 8 0 0 0 13 0".repeat(4) + 'z" style="fill:#fff4e8"/>';
  [-14, 0, 14].forEach((dx, k) => {
    cake +=
      `<circle cx="${180 + dx}" cy="288" r="12" class="fb glow" style="animation-delay:${-k * 0.6}s"/><rect x="${177.5 + dx}" y="292" width="5" height="12" rx="1.5" style="fill:#ff3d7f"/>` +
      `<g transform="translate(${180 + dx} 292)"><path class="flame blow fb" d="M0 0C-4 -5 0 -9 0 -13C0 -9 4 -5 0 0Z" style="animation-delay:${-k * 0.12}s"/></g>`;
  });
  const gift = (x: number, c1: string, c2: string, w: number, h: number) =>
    `<g transform="translate(${x} 404)"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="3" style="fill:${c1}"/><rect x="-3" y="${-h}" width="6" height="${h}" style="fill:${c2}"/><rect x="${-w / 2}" y="${-h / 2 - 3}" width="${w}" height="6" style="fill:${c2}"/>` +
    `<path d="M0 ${-h}C-14 ${-h - 14} -16 ${-h - 2} 0 ${-h}C16 ${-h - 2} 14 ${-h - 14} 0 ${-h}Z" style="fill:${c2}"/></g>`;
  const gifts = gift(124, "var(--accent)", "#fff4e8", 34, 30) + gift(246, "#ffd23f", "var(--ink)", 28, 24);
  const ccols = ["var(--ink)", "var(--accent)", "#ffd23f", "#fff4e8", "#ff3d7f"];
  const conf = falling(28, 200, (j) => `<rect x="-4" y="-6" width="8" height="12" rx="2" style="fill:${cyc(ccols, j)}"/>`);
  return layer(0, bg) + layer(1, mom + dad + kid + tbl + cake + gifts) + layer(2, conf);
}

/* ---------- public API ---------- */

export type HeroScene = {
  /** Tamil name shown large. */
  tamil: string;
  eng: string;
  short: string;
  blurb: string;
  /** Catalog category the "Plan this" link opens. */
  category: string;
  build: () => string;
};

export const HERO_SCENES: HeroScene[] = [
  {
    tamil: "ஆட்டம்",
    eng: "Dance Night",
    short: "Dance",
    blurb: "Sangeet nights, DJ floors and dance battles that keep every uncle and cousin off their chair.",
    category: "entertainment",
    build: dance,
  },
  {
    tamil: "இசை",
    eng: "Live Music",
    short: "Music",
    blurb: "Live bands, nadaswaram to guitars. Plan the stage, sound and lights so the music lands.",
    category: "entertainment",
    build: music,
  },
  {
    tamil: "கல்யாணம்",
    eng: "Wedding",
    short: "Wedding",
    blurb: "Muhurtham to reception. Mandap, flowers, food and every relative looked after.",
    category: "weddings",
    build: wedding,
  },
  {
    tamil: "காதல்",
    eng: "Proposal",
    short: "Proposal",
    blurb: "Rooftops, fairy lights and a ring at exactly the right moment. You say the line, we set the scene.",
    category: "weddings",
    build: proposal,
  },
  {
    tamil: "பிறந்தநாள்",
    eng: "Birthday",
    short: "Birthday",
    blurb: "Balloons, cake and surprises, from the first birthday to the fiftieth.",
    category: "family-celebrations",
    build: birthday,
  },
];
