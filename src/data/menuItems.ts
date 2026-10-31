// Menu item catalog — the single source of truth for the visual food menu.
//
// Data honesty: prices here are clearly-labelled SAMPLE/DEMO per-plate ranges
// (indicative, in INR), never presented as confirmed caterer quotes. Images are
// illustrative SVG art (see DishArt), not photos claimed to depict a specific
// dish from a specific vendor. A real provider image URL can be attached later
// via `imageUrl` + `imageSource` when a licensed source supplies it.

export type MenuCourse =
  | "welcome-drinks"
  | "starters"
  | "main-course"
  | "rice-breads"
  | "live-counters"
  | "desserts"
  | "beverages";

export type Diet = "veg" | "non-veg" | "vegan";

export type CuisineStyle = "tamil" | "kerala" | "telugu" | "kannada" | "north-indian" | "mixed";

export type MenuItemDef = {
  slug: string;
  name: string;
  description: string;
  course: MenuCourse;
  cuisine: CuisineStyle;
  diet: Diet;
  // Indicative per-serving price range in INR (SAMPLE data).
  priceMin: number;
  priceMax: number;
  serving: string; // portion description
  // Allergens known for the typical recipe (advisory). Empty => none notable.
  allergens: string[];
  // Art key for the illustrative dish graphic (see DishArt.tsx).
  art: string;
  // Optional: genuine provider image + attribution (null until a source added).
  imageUrl?: string | null;
  imageSource?: string | null;
};

export const COURSES: { slug: MenuCourse; name: string; icon: string }[] = [
  { slug: "welcome-drinks", name: "Welcome Drinks", icon: "🥤" },
  { slug: "starters", name: "Starters", icon: "🍢" },
  { slug: "main-course", name: "Main Course", icon: "🍛" },
  { slug: "rice-breads", name: "Rice & Breads", icon: "🍚" },
  { slug: "live-counters", name: "Live Counters", icon: "👨‍🍳" },
  { slug: "desserts", name: "Desserts", icon: "🍮" },
  { slug: "beverages", name: "Beverages", icon: "☕" },
];

export const CUISINES: { slug: CuisineStyle; name: string }[] = [
  { slug: "tamil", name: "Tamil" },
  { slug: "kerala", name: "Kerala" },
  { slug: "telugu", name: "Telugu" },
  { slug: "kannada", name: "Kannada" },
  { slug: "north-indian", name: "North Indian" },
  { slug: "mixed", name: "Mixed" },
];

export const MENU_ITEMS: MenuItemDef[] = [
  // ---- Welcome drinks ----
  {
    slug: "panakam",
    name: "Panakam",
    description: "Jaggery, ginger and cardamom cooler — a traditional Tamil welcome drink.",
    course: "welcome-drinks",
    cuisine: "tamil",
    diet: "vegan",
    priceMin: 25,
    priceMax: 45,
    serving: "200 ml glass",
    allergens: [],
    art: "drink",
    imageUrl: "/images/food/panakam.jpg",
    imageSource: "Wikimedia Commons · Nithyasrm (CC BY-SA 4.0)",
  },
  {
    slug: "rose-milk",
    name: "Rose Milk",
    description: "Chilled rose-flavoured milk, a crowd favourite at celebrations.",
    course: "welcome-drinks",
    cuisine: "mixed",
    diet: "veg",
    priceMin: 30,
    priceMax: 60,
    serving: "200 ml glass",
    allergens: ["milk"],
    art: "drink-pink",
    imageUrl: "/images/food/rose-milk.jpg",
    imageSource: "Wikimedia Commons · REVATHY (CC BY-SA 4.0)",
  },
  // ---- Starters ----
  {
    slug: "medu-vada",
    name: "Medu Vada",
    description: "Crisp, fluffy urad-dal fritters served with chutney and sambar.",
    course: "starters",
    cuisine: "tamil",
    diet: "veg",
    priceMin: 30,
    priceMax: 55,
    serving: "2 pieces",
    allergens: [],
    art: "vada",
    imageUrl: "/images/food/medu-vada.jpg",
    imageSource: "Wikimedia Commons · Andy Li (CC0)",
  },
  {
    slug: "paneer-tikka",
    name: "Paneer Tikka",
    description: "Char-grilled spiced cottage cheese with peppers and onion.",
    course: "starters",
    cuisine: "north-indian",
    diet: "veg",
    priceMin: 90,
    priceMax: 160,
    serving: "4–5 pieces",
    allergens: ["milk"],
    art: "tikka",
    imageUrl: "/images/food/paneer-tikka.jpg",
    imageSource: "Wikimedia Commons · Gpkp (CC BY-SA 4.0)",
  },
  {
    slug: "chicken-65",
    name: "Chicken 65",
    description: "Spicy deep-fried chicken, a Chennai hotel classic.",
    course: "starters",
    cuisine: "tamil",
    diet: "non-veg",
    priceMin: 110,
    priceMax: 190,
    serving: "150 g",
    allergens: [],
    art: "fry",
    imageUrl: "/images/food/chicken-65.jpg",
    imageSource: "Wikimedia Commons · Amiyashrivastava (CC BY-SA 3.0)",
  },
  // ---- Main course ----
  {
    slug: "sambar",
    name: "Sambar",
    description: "Lentil and vegetable stew tempered with tamarind and spices.",
    course: "main-course",
    cuisine: "tamil",
    diet: "vegan",
    priceMin: 35,
    priceMax: 60,
    serving: "1 ladle",
    allergens: [],
    art: "curry",
    imageUrl: "/images/food/sambar.jpg",
    imageSource: "Wikimedia Commons · KARANK21 (CC BY-SA 4.0)",
  },
  {
    slug: "avial",
    name: "Avial",
    description: "Mixed vegetables in a coconut–curd gravy, a Kerala sadya staple.",
    course: "main-course",
    cuisine: "kerala",
    diet: "veg",
    priceMin: 45,
    priceMax: 80,
    serving: "1 ladle",
    allergens: ["milk"],
    art: "curry-green",
    imageUrl: "/images/food/avial.jpg",
    imageSource: "Wikimedia Commons · Samphotography (CC BY-SA 4.0)",
  },
  {
    slug: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    description: "Cottage cheese in a rich buttery tomato gravy.",
    course: "main-course",
    cuisine: "north-indian",
    diet: "veg",
    priceMin: 120,
    priceMax: 220,
    serving: "1 bowl",
    allergens: ["milk", "nuts"],
    art: "curry-orange",
    imageUrl: "/images/food/paneer-butter-masala.jpg",
    imageSource: "Wikimedia Commons · Gannu03 (CC BY-SA 4.0)",
  },
  // ---- Rice & breads ----
  {
    slug: "pongal",
    name: "Ven Pongal",
    description: "Comforting rice-and-moong-dal dish tempered with pepper and ghee.",
    course: "rice-breads",
    cuisine: "tamil",
    diet: "veg",
    priceMin: 40,
    priceMax: 70,
    serving: "1 cup",
    allergens: ["milk"],
    art: "rice",
    imageUrl: "/images/food/pongal.jpg",
    imageSource: "Wikimedia Commons · Raksanand (CC BY-SA 4.0)",
  },
  {
    slug: "chicken-biryani",
    name: "Chicken Biryani",
    description: "Fragrant layered rice with marinated chicken and whole spices.",
    course: "rice-breads",
    cuisine: "north-indian",
    diet: "non-veg",
    priceMin: 150,
    priceMax: 300,
    serving: "1 plate",
    allergens: [],
    art: "biryani",
    imageUrl: "/images/food/chicken-biryani.jpg",
    imageSource: "Wikimedia Commons · Garrett Ziegler (CC BY 2.0)",
  },
  {
    slug: "chapati",
    name: "Chapati",
    description: "Soft whole-wheat flatbread, served with curries.",
    course: "rice-breads",
    cuisine: "north-indian",
    diet: "vegan",
    priceMin: 15,
    priceMax: 30,
    serving: "2 pieces",
    allergens: ["gluten"],
    art: "bread",
    imageUrl: "/images/food/chapati.jpg",
    imageSource: "Wikimedia Commons · Christian Köhler (CC BY-SA 3.0)",
  },
  // ---- Live counters ----
  {
    slug: "dosa-counter",
    name: "Live Dosa Counter",
    description: "Freshly-made crisp dosas with chutney and sambar, cooked to order.",
    course: "live-counters",
    cuisine: "tamil",
    diet: "veg",
    priceMin: 60,
    priceMax: 120,
    serving: "per guest",
    allergens: [],
    art: "dosa",
    imageUrl: "/images/food/dosa-counter.jpg",
    imageSource: "Wikimedia Commons · Saisumanth532 (CC BY-SA 4.0)",
  },
  {
    slug: "chaat-counter",
    name: "Live Chaat Counter",
    description: "Pani puri, bhel and sev puri assembled fresh at the station.",
    course: "live-counters",
    cuisine: "north-indian",
    diet: "veg",
    priceMin: 70,
    priceMax: 140,
    serving: "per guest",
    allergens: ["gluten"],
    art: "chaat",
    imageUrl: "/images/food/chaat-counter.jpg",
    imageSource: "Wikimedia Commons · Alexjj0110 (CC BY-SA 4.0)",
  },
  // ---- Desserts ----
  {
    slug: "payasam",
    name: "Payasam",
    description: "Classic South Indian kheer with milk, jaggery and cardamom.",
    course: "desserts",
    cuisine: "tamil",
    diet: "veg",
    priceMin: 35,
    priceMax: 70,
    serving: "1 cup",
    allergens: ["milk", "nuts"],
    art: "payasam",
    imageUrl: "/images/food/payasam.jpg",
    imageSource: "Wikimedia Commons · DEVDevarajan (CC BY-SA 4.0)",
  },
  {
    slug: "gulab-jamun",
    name: "Gulab Jamun",
    description: "Warm milk-solid dumplings soaked in rose-cardamom syrup.",
    course: "desserts",
    cuisine: "north-indian",
    diet: "veg",
    priceMin: 30,
    priceMax: 60,
    serving: "2 pieces",
    allergens: ["milk", "gluten"],
    art: "jamun",
    imageUrl: "/images/food/gulab-jamun.jpg",
    imageSource: "Wikimedia Commons · Gaurav Dhwaj Khadka (CC BY-SA 4.0)",
  },
  {
    slug: "mysore-pak",
    name: "Mysore Pak",
    description: "Ghee-rich gram-flour sweet, a Karnataka speciality.",
    course: "desserts",
    cuisine: "kannada",
    diet: "veg",
    priceMin: 40,
    priceMax: 80,
    serving: "2 pieces",
    allergens: ["milk"],
    art: "sweet-square",
    imageUrl: "/images/food/mysore-pak.jpg",
    imageSource: "Wikimedia Commons · Vaidehi Pujary (CC BY-SA 4.0)",
  },
  // ---- Beverages ----
  {
    slug: "filter-coffee",
    name: "Filter Coffee",
    description: "South Indian decoction coffee served frothy in a tumbler.",
    course: "beverages",
    cuisine: "tamil",
    diet: "veg",
    priceMin: 20,
    priceMax: 40,
    serving: "150 ml",
    allergens: ["milk"],
    art: "coffee",
    imageUrl: "/images/food/filter-coffee.jpg",
    imageSource: "Wikimedia Commons · Celestial Pari (CC BY-SA 4.0)",
  },
  {
    slug: "buttermilk",
    name: "Spiced Buttermilk",
    description: "Cooling curd drink with curry leaves, ginger and asafoetida.",
    course: "beverages",
    cuisine: "mixed",
    diet: "veg",
    priceMin: 15,
    priceMax: 35,
    serving: "200 ml",
    allergens: ["milk"],
    art: "drink",
    imageUrl: "/images/food/buttermilk.jpg",
    imageSource: "Wikimedia Commons · Darshandkt (CC BY-SA 4.0)",
  },
];

export function menuItemBySlug(slug: string): MenuItemDef | undefined {
  return MENU_ITEMS.find((m) => m.slug === slug);
}

export function filterMenuItems(opts: { course?: MenuCourse | "all"; cuisine?: CuisineStyle | "all"; diet?: Diet | "all" }): MenuItemDef[] {
  return MENU_ITEMS.filter((m) => {
    if (opts.course && opts.course !== "all" && m.course !== opts.course) return false;
    if (opts.cuisine && opts.cuisine !== "all" && m.cuisine !== opts.cuisine && m.cuisine !== "mixed") return false;
    if (opts.diet && opts.diet !== "all" && m.diet !== opts.diet) return false;
    return true;
  });
}
