// Full-page animated festival backdrop shown behind every page: warm plum and
// maroon night sky, drifting lantern glow, rising diya sparks, falling marigold
// petals, twinkling stars and slowly turning rangoli mandalas. Pure CSS/SVG
// (no JavaScript at runtime), fixed behind the content, and static when the
// visitor prefers reduced motion. Positions are seeded so server and client agree.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function Mandala({ size, className }: { size: number; className: string }) {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const petals2 = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
  return (
    <svg className={className} width={size} height={size} viewBox="-100 -100 200 200" aria-hidden="true">
      <g fill="none" stroke="#ffd98a" strokeWidth="0.55">
        <circle r="96" strokeDasharray="1.2 3" />
        <circle r="88" />
        <circle r="30" />
        <circle r="12" />
        {petals.map((a) => (
          <ellipse key={a} cx="0" cy="-62" rx="9" ry="24" transform={`rotate(${a})`} />
        ))}
        {petals2.map((a) => (
          <path key={a} d="M0 -34 q7 -14 0 -26 q-7 12 0 26z" transform={`rotate(${a})`} />
        ))}
        {petals.map((a) => (
          <circle key={`d${a}`} cx="0" cy="-92" r="1.6" fill="#ffd98a" stroke="none" transform={`rotate(${a})`} />
        ))}
      </g>
    </svg>
  );
}

export function FestivalBackdrop() {
  const r = rng(20241030);
  const sparks = Array.from({ length: 22 }, (_, i) => {
    const dur = 9 + r() * 10;
    return {
      key: `s${i}`,
      left: r() * 100,
      size: 2 + r() * 3.5,
      dur,
      delay: -r() * dur,
      dx: (r() - 0.5) * 90,
      hue: i % 3 === 0 ? "#ffd24c" : i % 3 === 1 ? "#ff9e2c" : "#ff6a3d",
    };
  });
  const petals = Array.from({ length: 14 }, (_, i) => {
    const dur = 16 + r() * 14;
    return {
      key: `p${i}`,
      left: r() * 100,
      size: 7 + r() * 7,
      dur,
      delay: -r() * dur,
      dx: (r() - 0.5) * 160,
      hue: i % 3 === 0 ? "#ffb21f" : i % 3 === 1 ? "#ff7a45" : "#ff5f9a",
    };
  });
  const stars = Array.from({ length: 22 }, (_, i) => ({
    key: `t${i}`,
    left: r() * 100,
    top: r() * 70,
    size: 2 + r() * 3,
    dur: 3 + r() * 4,
    delay: -r() * 6,
  }));

  return (
    <div className="vv-fest" aria-hidden="true">
      <div className="vv-fest-glow vv-fest-glow-a" />
      <div className="vv-fest-glow vv-fest-glow-b" />
      <div className="vv-fest-glow vv-fest-glow-c" />
      <div className="vv-fest-floor" />

      <Mandala size={760} className="vv-fest-mandala vv-fest-mandala-a" />
      <Mandala size={520} className="vv-fest-mandala vv-fest-mandala-b" />

      {stars.map((s) => (
        <span
          key={s.key}
          className="vv-fest-star"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
        />
      ))}
      {petals.map((p) => (
        <span
          key={p.key}
          className="vv-fest-petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.62,
            background: p.hue,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            ["--dx" as string]: `${p.dx}px`,
          }}
        />
      ))}
      {sparks.map((s) => (
        <span
          key={s.key}
          className="vv-fest-spark"
          style={{
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            background: s.hue,
            boxShadow: `0 0 ${s.size * 3}px ${s.size}px ${s.hue}66`,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            ["--dx" as string]: `${s.dx}px`,
          }}
        />
      ))}
      <div className="vv-fest-veil" />
    </div>
  );
}
