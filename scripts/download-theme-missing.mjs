// Fill in theme images for slugs that don't yet have a local file, using
// Commons SEARCH (more forgiving than exact titles). Topical queries chosen to
// return relevant, real photos. Verifies each download is a real image.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const OUT = "public/images/themes";
mkdirSync(OUT, { recursive: true });

const QUERIES = {
  "kerala-heritage-wedding": "Kerala wedding ceremony",
  "north-indian-royal-wedding": "Indian wedding mandap decoration",
  "rajasthani-wedding": "Rajasthan wedding",
  "modern-luxury-wedding": "wedding reception stage decoration",
  "minimalist-wedding": "wedding ceremony arch flowers",
  "jasmine-marigold-decoration": "marigold flower garland decoration",
  "pastel-decoration": "wedding table flower decoration",
  "mandap-decoration": "wedding mandap",
  "garden-decoration": "outdoor garden wedding",
  "beach-decoration": "beach wedding ceremony",
  "crystal-led-decoration": "concert stage lighting",
  "rustic-decoration": "rustic wedding decoration",
  "kids-birthday": "children birthday party",
  sangeet: "Indian wedding dance sangeet",
  "baby-shower": "baby shower decoration",
  anniversary: "anniversary celebration cake",
  "corporate-event": "conference stage audience",
  "cultural-festival": "Indian cultural festival stage",
  "college-function": "college cultural festival stage",
  "community-celebration": "festival crowd celebration India",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Referer: "https://commons.wikimedia.org/",
  Accept: "image/jpeg,image/png,*/*",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search" +
    `&gsrsearch=${encodeURIComponent("filetype:bitmap " + query)}` +
    "&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900";
  let r;
  for (let a = 0; a < 5; a++) {
    r = await fetch(api, { headers: HEADERS });
    if (r.status !== 429) break;
    await sleep(2500 * (a + 1));
  }
  if (!r.ok) throw new Error(`api ${r.status}`);
  const pages = (await r.json())?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.thumburl) return null;
      const title = p.title || "";
      // Skip odd non-ascii titles.
      if (title.replace(/[^\x00-\x7F]/g, "").length < title.length * 0.6) return null;
      const meta = info.extmetadata || {};
      const artist = (meta.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
      const license = (meta.LicenseShortName?.value || "").trim();
      return { url: info.thumburl.split("?")[0], credit: `Wikimedia Commons${artist ? ` · ${artist}` : ""}${license ? ` (${license})` : ""}` };
    })
    .filter(Boolean);
}

async function download(url, dest) {
  let r;
  for (let a = 0; a < 4; a++) {
    r = await fetch(url, { headers: HEADERS });
    if (r.status !== 429) break;
    await sleep(2500 * (a + 1));
  }
  if (!r.ok) throw new Error(`img ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2500) throw new Error("small");
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  if (!isJpg && !isPng) throw new Error("not image");
  writeFileSync(dest, buf);
  return buf.length;
}

const report = {};
for (const [slug, query] of Object.entries(QUERIES)) {
  if (existsSync(`${OUT}/${slug}.jpg`) || existsSync(`${OUT}/${slug}.png`)) {
    console.log(`SKIP ${slug} (exists)`);
    continue;
  }
  try {
    const hits = await search(query);
    await sleep(300);
    let done = false;
    for (const h of hits) {
      try {
        const ext = /\.png$/i.test(h.url) ? "png" : "jpg";
        const bytes = await download(h.url, `${OUT}/${slug}.${ext}`);
        report[slug] = { image: `/images/themes/${slug}.${ext}`, imageSource: h.credit };
        console.log(`OK   ${slug} (${bytes}b)`);
        done = true;
        await sleep(300);
        break;
      } catch {
        /* next hit */
      }
    }
    if (!done) console.log(`MISS ${slug}`);
  } catch (e) {
    console.log(`ERR ${slug}: ${e.message}`);
  }
}

writeFileSync("scripts/theme-missing-paths.json", JSON.stringify(report, null, 2));
console.log(`\nFilled ${Object.keys(report).length} missing images.`);
