// Download real, licensed theme/inspiration photos from Wikimedia Commons into
// public/images/themes/ (served locally — no hotlink blocking / broken links).
// Resolves each slug via a curated list of candidate Commons file titles, then
// verifies the download is a real image. Writes scripts/theme-local-paths.json.
// Run: node scripts/download-theme-images.mjs

import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/images/themes";
mkdirSync(OUT, { recursive: true });

// Candidate Commons file titles per theme (first that resolves + downloads wins).
// Chosen for topical relevance (Indian weddings, mandaps, florals, events).
const THEMES = {
  "tamil-traditional-wedding": ["Tamil Hindu Wedding.jpg", "Tamil wedding.jpg", "Hindu Wedding Ceremony.jpg"],
  "kerala-heritage-wedding": ["Kerala Hindu wedding.jpg", "Hindu Wedding Kerala.jpg", "Nair wedding.jpg"],
  "telugu-wedding": ["Telugu wedding.jpg", "South Indian wedding.jpg", "Hindu wedding ritual.jpg"],
  "kannada-wedding": ["Kannada wedding.jpg", "Indian wedding couple.jpg", "Hindu wedding.jpg"],
  "north-indian-royal-wedding": ["Indian wedding stage.jpg", "Wedding Mandap.jpg", "Indian Wedding decoration.jpg"],
  "rajasthani-wedding": ["Rajasthani wedding.jpg", "Rajasthan wedding.jpg", "Palace wedding India.jpg"],
  "south-indian-grand-wedding": ["South Indian wedding hall.jpg", "Indian wedding reception.jpg", "Kalyana Mandapam.jpg"],
  "modern-luxury-wedding": ["Luxury wedding stage.jpg", "Wedding reception stage.jpg", "Wedding decoration.jpg"],
  "minimalist-wedding": ["Simple wedding decoration.jpg", "Wedding arch.jpg", "Wedding ceremony arch.jpg"],
  "destination-wedding": ["Beach wedding.jpg", "Destination wedding.jpg", "Wedding on beach.jpg"],
  "floral-decoration": ["Floral decoration wedding.jpg", "Flower decoration.jpg", "Wedding flowers decoration.jpg"],
  "jasmine-marigold-decoration": ["Marigold decoration.jpg", "Jasmine flowers garland.jpg", "Marigold garland.jpg"],
  "royal-gold-decoration": ["Golden wedding decoration.jpg", "Wedding stage decoration.jpg", "Luxury event decoration.jpg"],
  "pastel-decoration": ["Pastel wedding decoration.jpg", "Wedding table decoration.jpg", "Event decoration pastel.jpg"],
  "brass-lamp-decoration": ["Nilavilakku.jpg", "Brass lamp India.jpg", "Kuthuvilakku.jpg"],
  "mandap-decoration": ["Wedding Mandap.jpg", "Mandap decoration.jpg", "Hindu wedding mandap.jpg"],
  "garden-decoration": ["Garden wedding.jpg", "Outdoor wedding decoration.jpg", "Garden party decoration.jpg"],
  "beach-decoration": ["Beach wedding setup.jpg", "Beach wedding arch.jpg", "Beach event.jpg"],
  "crystal-led-decoration": ["Wedding stage lighting.jpg", "Event LED decoration.jpg", "Stage lighting event.jpg"],
  "rustic-decoration": ["Rustic wedding decoration.jpg", "Rustic wedding.jpg", "Barn wedding decoration.jpg"],
  "birthday-party": ["Birthday party decoration.jpg", "Birthday balloons.jpg", "Birthday party.jpg"],
  "kids-birthday": ["Children birthday party.jpg", "Kids party.jpg", "Birthday party children.jpg"],
  engagement: ["Engagement ceremony India.jpg", "Ring ceremony.jpg", "Engagement rings.jpg"],
  reception: ["Wedding reception.jpg", "Indian wedding reception.jpg", "Reception stage.jpg"],
  mehendi: ["Mehndi ceremony.jpg", "Mehendi function.jpg", "Henna ceremony.jpg"],
  sangeet: ["Sangeet ceremony.jpg", "Indian wedding dance.jpg", "Wedding music night.jpg"],
  "baby-shower": ["Baby shower decoration.jpg", "Baby shower.jpg", "Baby shower party.jpg"],
  anniversary: ["Anniversary celebration.jpg", "Wedding anniversary.jpg", "Celebration cake.jpg"],
  "corporate-event": ["Corporate event stage.jpg", "Conference stage.jpg", "Business conference.jpg"],
  "cultural-festival": ["Cultural festival stage.jpg", "Cultural program India.jpg", "Indian festival celebration.jpg"],
  "college-function": ["College cultural event.jpg", "College festival.jpg", "Annual day function.jpg"],
  "community-celebration": ["Community celebration India.jpg", "Community gathering.jpg", "Public celebration India.jpg"],
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Referer: "https://commons.wikimedia.org/",
  Accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveThumb(title) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    `&titles=${encodeURIComponent("File:" + title)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900`;
  let r;
  for (let a = 0; a < 5; a++) {
    r = await fetch(api, { headers: HEADERS });
    if (r.status !== 429) break;
    await sleep(2500 * (a + 1));
  }
  if (!r.ok) throw new Error(`api ${r.status}`);
  const page = Object.values((await r.json())?.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  const info = page.imageinfo?.[0];
  if (!info?.thumburl) return null;
  const meta = info.extmetadata || {};
  const artist = (meta.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
  const license = (meta.LicenseShortName?.value || "").trim();
  return { url: info.thumburl.split("?")[0], credit: `Wikimedia Commons${artist ? ` · ${artist}` : ""}${license ? ` (${license})` : ""}` };
}

async function download(url, dest) {
  let r;
  for (let a = 0; a < 5; a++) {
    r = await fetch(url, { headers: HEADERS });
    if (r.status !== 429) break;
    await sleep(2500 * (a + 1));
  }
  if (!r.ok) throw new Error(`img ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2500) throw new Error("too small");
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  if (!isJpg && !isPng) throw new Error("not image");
  writeFileSync(dest, buf);
  return buf.length;
}

const report = {};
for (const [slug, titles] of Object.entries(THEMES)) {
  let done = false;
  for (const title of titles) {
    try {
      const res = await resolveThumb(title);
      await sleep(350);
      if (!res) continue;
      const ext = /\.png$/i.test(res.url) ? "png" : "jpg";
      const dest = `${OUT}/${slug}.${ext}`;
      const bytes = await download(res.url, dest);
      report[slug] = { image: `/images/themes/${slug}.${ext}`, imageSource: res.credit };
      console.log(`OK   ${slug} <- ${title} (${bytes}b)`);
      done = true;
      await sleep(400);
      break;
    } catch (e) {
      // try next candidate
    }
  }
  if (!done) {
    report[slug] = null;
    console.log(`MISS ${slug}`);
  }
}

writeFileSync("scripts/theme-local-paths.json", JSON.stringify(report, null, 2));
const ok = Object.values(report).filter(Boolean).length;
console.log(`\nDownloaded ${ok}/${Object.keys(THEMES).length} theme images.`);
