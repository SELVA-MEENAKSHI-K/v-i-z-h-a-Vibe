// Resolve REAL Wikimedia Commons photos for each dish by EXACT file title.
// Exact titles (not fuzzy search) give an accurate, dish-specific photo or a
// clean miss (-> UI fallback). Each title below is a known Commons file; the
// API confirms it exists and returns the real thumbnail URL + license.
// Run: node scripts/resolve-food-images.mjs

import { writeFileSync } from "node:fs";

// Candidate exact file titles per dish (first that resolves wins).
const DISHES = [
  { slug: "panakam", titles: ["Panagam picture.JPG", "Panakam.jpg"] },
  { slug: "rose-milk", titles: ["Rose milk.jpg", "Rose Milk.jpg", "Rose milk drink.jpg"] },
  { slug: "medu-vada", titles: ["Medu Vada - Calcutta 16 2026-07-11.jpg", "Medu vada.jpg", "Vada sambar.jpg"] },
  { slug: "paneer-tikka", titles: ["Paneer Tikka Masala (2026) 01.jpg", "Paneer tikka.jpg", "Panir Tikka.jpg"] },
  { slug: "chicken-65", titles: ["Chicken 65 (Dish).jpg", "Chicken 65.jpg"] },
  { slug: "sambar", titles: ["Sambar-Popular south-Indian food.jpg", "Sambar.JPG", "Sambar (dish).jpg"] },
  { slug: "avial", titles: ["Aviyal,Kerala cuisine.jpg", "Aviyal.JPG", "Avial.jpg"] },
  { slug: "paneer-butter-masala", titles: ["Paneer butter masala 2.jpg", "Paneer Butter Masala.jpg", "Paneer makhani.jpg"] },
  { slug: "pongal", titles: ["Ven pongal.jpg", "Khara Pongal.jpg", "Ven Pongal.JPG"] },
  { slug: "chicken-biryani", titles: ["Chicken biryani.jpg", "Chicken Biryani.JPG", "Hyderabadi Chicken Biryani.jpg"] },
  { slug: "chapati", titles: ["Chapati.jpg", "Chapatti.JPG", "Roti (Chapati).jpg"] },
  { slug: "dosa-counter", titles: ["Masala Dosa 02.jpg", "Masala dosa.jpg", "Dosa.jpg"] },
  { slug: "chaat-counter", titles: ["Pani Puri or Golgappa.jpg", "Panipuri.JPG", "Pani puri.jpg"] },
  { slug: "payasam", titles: ["Payasam.JPG", "Semiya Payasam.jpg", "Rice Payasam.jpg"] },
  { slug: "gulab-jamun", titles: ["Gulab Jamun 3.jpg", "Gulab jamun.jpg", "Gulab Jamun.JPG"] },
  { slug: "mysore-pak", titles: ["Ghee Mysore Pak.jpg", "Mysore pak.JPG", "Mysorepak.jpg"] },
  { slug: "filter-coffee", titles: ["Indian filter coffee.jpg", "Madras filter coffee.jpg", "Filter coffee.JPG"] },
  { slug: "buttermilk", titles: ["Masala Chaas.jpg", "Chaas (buttermilk).jpg", "Spiced buttermilk.jpg"] },
];

const UA = "VizhaVibe/1.0 (educational project)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveTitle(title) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    `&titles=${encodeURIComponent("File:" + title)}` +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800";
  let r;
  for (let attempt = 0; attempt < 5; attempt++) {
    r = await fetch(api, { headers: { "User-Agent": UA } });
    if (r.status !== 429) break;
    await sleep(2000 * (attempt + 1));
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (page.missing !== undefined) return null;
  const info = page.imageinfo?.[0];
  if (!info?.thumburl) return null;
  const meta = info.extmetadata || {};
  const artist = (meta.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
  const license = (meta.LicenseShortName?.value || "").trim();
  return {
    imageUrl: info.thumburl.split("?")[0],
    imageSource: `Wikimedia Commons${artist ? ` · ${artist}` : ""}${license ? ` (${license})` : ""}`,
    title: page.title,
  };
}

const results = {};
for (const dish of DISHES) {
  let found = null;
  for (const t of dish.titles) {
    try {
      found = await resolveTitle(t);
      await sleep(500);
      if (found) break;
    } catch (e) {
      console.log(`   err ${dish.slug} "${t}": ${e.message}`);
      await sleep(1000);
    }
  }
  if (found) {
    results[dish.slug] = found;
    console.log(`OK   ${dish.slug} -> ${found.title}`);
  } else {
    console.log(`MISS ${dish.slug}`);
  }
}

writeFileSync("scripts/food-images.json", JSON.stringify(results, null, 2));
console.log(`\nWrote ${Object.keys(results).length}/${DISHES.length} images.`);
