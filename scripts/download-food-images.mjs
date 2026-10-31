// Download real, licensed dish photos from Wikimedia Commons into
// public/images/food/ so they are served locally (no hotlink blocking, no
// rate limits, no broken remote links). Verifies each file is a real image.
// Run: node scripts/download-food-images.mjs

import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";

const OUT = "public/images/food";
mkdirSync(OUT, { recursive: true });

// slug -> Commons "original file" page title. We resolve the real download URL
// via the API (iiprop=url) then fetch the full-size original with a proper UA.
const DISHES = {
  panakam: "Panagam picture.JPG",
  "rose-milk": "Rose milk.jpg",
  "medu-vada": "Medu Vada - Calcutta 16 2026-07-11.jpg",
  "paneer-tikka": "Paneer Tikka Masala (2026) 01.jpg",
  "chicken-65": "Chicken 65 (Dish).jpg",
  sambar: "Sambar-Popular south-Indian food.jpg",
  avial: "Aviyal,Kerala cuisine.jpg",
  "paneer-butter-masala": "Paneer butter masala 2.jpg",
  pongal: "Ven pongal.jpg",
  "chicken-biryani": "Hyderabadi Chicken Biryani.jpg",
  chapati: "Chapati.jpg",
  "dosa-counter": "Masala Dosa 02.jpg",
  "chaat-counter": "Pani puri.jpg",
  payasam: "Semiya Payasam.jpg",
  "gulab-jamun": "Gulab Jamun 3.jpg",
  "mysore-pak": "Ghee Mysore Pak.jpg",
  "filter-coffee": "South Indian Filter Coffee.jpg",
  buttermilk: "Buttermilk.jpg",
};

// Realistic browser UA + referer so Wikimedia serves the file (it 400s on bare
// requests). This is a normal download, then we store locally.
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Referer: "https://commons.wikimedia.org/",
  Accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveThumbUrl(title) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    `&titles=${encodeURIComponent("File:" + title)}` +
    "&prop=imageinfo&iiprop=url&iiurlwidth=800";
  let r;
  for (let a = 0; a < 5; a++) {
    r = await fetch(api, { headers: HEADERS });
    if (r.status !== 429) break;
    await sleep(2500 * (a + 1));
  }
  if (!r.ok) throw new Error(`api HTTP ${r.status}`);
  const page = Object.values((await r.json())?.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  const info = page.imageinfo?.[0];
  // Prefer the 800px thumbnail (smaller, consistent) but fall back to original.
  return info?.thumburl?.split("?")[0] || info?.url || null;
}

async function download(url, dest) {
  let r;
  for (let a = 0; a < 5; a++) {
    r = await fetch(url, { headers: HEADERS });
    if (r.status !== 429) break;
    await sleep(2500 * (a + 1));
  }
  if (!r.ok) throw new Error(`img HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2000) throw new Error(`too small (${buf.length}b)`);
  // Basic magic-byte sanity: JPEG/PNG.
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  if (!isJpg && !isPng) throw new Error("not a jpg/png");
  writeFileSync(dest, buf);
  return { bytes: buf.length, ext: isPng ? "png" : "jpg" };
}

const report = {};
for (const [slug, title] of Object.entries(DISHES)) {
  try {
    const url = await resolveThumbUrl(title);
    await sleep(400);
    if (!url) {
      console.log(`MISS ${slug} (no url)`);
      report[slug] = null;
      continue;
    }
    // Determine extension from URL.
    const ext = /\.png$/i.test(url) ? "png" : "jpg";
    const dest = `${OUT}/${slug}.${ext}`;
    const res = await download(url, dest);
    console.log(`OK   ${slug} -> ${dest} (${res.bytes} bytes)`);
    report[slug] = `/images/food/${slug}.${res.ext}`;
    await sleep(500);
  } catch (e) {
    console.log(`FAIL ${slug}: ${e.message}`);
    report[slug] = null;
  }
}

writeFileSync("scripts/food-local-paths.json", JSON.stringify(report, null, 2));
const ok = Object.values(report).filter(Boolean).length;
console.log(`\nDownloaded ${ok}/${Object.keys(DISHES).length} images to ${OUT}/`);
