// Download real, openly-licensed category photos for the vendor module into
// public/images/vendors/<category>.jpg. Mirrors download-theme-images.mjs.
// Sources are Wikimedia Commons files (CC-licensed). If a download fails the
// app still works: SmartImage falls back to a designed placeholder (never a
// toy illustration), so missing files are non-fatal.

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images", "vendors");

// category -> a real Wikimedia Commons image (Special:FilePath redirects to the
// current file URL). These are representative, licensed photographs.
const SOURCES = {
  photography: "https://commons.wikimedia.org/wiki/Special:FilePath/Wedding%20photographer%20at%20work.jpg",
  catering: "https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20wedding%20buffet.jpg",
  decoration: "https://commons.wikimedia.org/wiki/Special:FilePath/Wedding%20stage%20decoration.jpg",
  makeup: "https://commons.wikimedia.org/wiki/Special:FilePath/Bridal%20makeup.jpg",
  music: "https://commons.wikimedia.org/wiki/Special:FilePath/Live%20band%20performance.jpg",
  invitations: "https://commons.wikimedia.org/wiki/Special:FilePath/Wedding%20invitation%20card.jpg",
  transportation: "https://commons.wikimedia.org/wiki/Special:FilePath/Decorated%20wedding%20car.jpg",
  equipment: "https://commons.wikimedia.org/wiki/Special:FilePath/Banquet%20hall%20seating.jpg",
};

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "VizhaVibe/1.0 (vendor images)" }, redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let ok = 0;
  let fail = 0;
  for (const [cat, url] of Object.entries(SOURCES)) {
    const dest = path.join(OUT, `${cat}.jpg`);
    try {
      await download(url, dest);
      console.log(`[ok]   ${cat}.jpg`);
      ok++;
    } catch (e) {
      console.warn(`[miss] ${cat}.jpg — ${e.message} (SmartImage will use a placeholder)`);
      fail++;
    }
  }
  console.log(`\nDone. ${ok} downloaded, ${fail} missing (placeholders used).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(0); // non-fatal: never block the build on image fetches
});
