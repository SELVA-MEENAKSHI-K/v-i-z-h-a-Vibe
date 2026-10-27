// Single source of truth for event categories, event types, cities, and
// cultural styles. The seed script and the UI both import from here so the
// catalog is data-driven, not hard-coded across components.

export type EventTypeDef = {
  slug: string;
  name: string;
  description: string;
  defaultStyles?: string[];
};

export type EventCategoryDef = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  eventTypes: EventTypeDef[];
};

export const CITIES = ["Madurai", "Chennai", "Bangalore"] as const;
export type City = (typeof CITIES)[number];

export const CULTURAL_STYLES = [
  { slug: "tamil", name: "Tamil" },
  { slug: "kerala", name: "Kerala" },
  { slug: "telugu", name: "Telugu" },
  { slug: "kannada", name: "Kannada" },
  { slug: "north-indian", name: "North Indian" },
] as const;
export type StyleSlug = (typeof CULTURAL_STYLES)[number]["slug"];

export const DIETARY_OPTIONS = [
  { slug: "veg", name: "Vegetarian" },
  { slug: "non-veg", name: "Non-vegetarian" },
  { slug: "both", name: "Both" },
  { slug: "jain", name: "Jain" },
  { slug: "vegan", name: "Vegan" },
] as const;

// 8 categories, 40 event types (exceeds the 30+ requirement).
export const CATALOG: EventCategoryDef[] = [
  {
    slug: "weddings",
    name: "Weddings",
    description: "Ceremonies and celebrations around marriage.",
    icon: "💍",
    eventTypes: [
      { slug: "tamil-wedding", name: "Tamil Wedding", description: "Traditional Tamil marriage ceremony.", defaultStyles: ["tamil"] },
      { slug: "kerala-wedding", name: "Kerala Wedding", description: "Kerala-style wedding rituals.", defaultStyles: ["kerala"] },
      { slug: "telugu-wedding", name: "Telugu Wedding", description: "Telugu marriage traditions.", defaultStyles: ["telugu"] },
      { slug: "kannada-wedding", name: "Kannada Wedding", description: "Kannada wedding customs.", defaultStyles: ["kannada"] },
      { slug: "north-indian-wedding", name: "North Indian Wedding", description: "North Indian wedding festivities.", defaultStyles: ["north-indian"] },
      { slug: "reception", name: "Reception", description: "Post-wedding reception celebration." },
      { slug: "engagement", name: "Engagement", description: "Engagement / nichayathartham ceremony." },
      { slug: "mehndi", name: "Mehndi", description: "Henna celebration before the wedding.", defaultStyles: ["north-indian"] },
      { slug: "sangeet", name: "Sangeet", description: "Music and dance night.", defaultStyles: ["north-indian"] },
    ],
  },
  {
    slug: "family-celebrations",
    name: "Family Celebrations",
    description: "Milestones shared with family and friends.",
    icon: "🎂",
    eventTypes: [
      { slug: "birthday", name: "Birthday", description: "Birthday party for any age." },
      { slug: "anniversary", name: "Anniversary", description: "Wedding or milestone anniversary." },
      { slug: "baby-shower", name: "Baby Shower", description: "Celebration before a baby's arrival." },
      { slug: "naming-ceremony", name: "Naming Ceremony", description: "Naming / cradle ceremony." },
      { slug: "housewarming", name: "Housewarming", description: "Gruhapravesam / new-home celebration." },
      { slug: "retirement", name: "Retirement Celebration", description: "Honouring a career milestone." },
    ],
  },
  {
    slug: "cultural-religious",
    name: "Cultural & Religious",
    description: "Festivals, functions, and traditional ceremonies.",
    icon: "🪔",
    eventTypes: [
      { slug: "festival-celebration", name: "Festival Celebration", description: "Community or family festival event." },
      { slug: "temple-function", name: "Temple Function", description: "Function held at or for a temple." },
      { slug: "pooja", name: "Pooja", description: "Ritual worship gathering." },
      { slug: "cultural-program", name: "Cultural Program", description: "Performances and cultural showcase." },
      { slug: "traditional-ceremony", name: "Traditional Ceremony", description: "Other traditional ceremonies." },
    ],
  },
  {
    slug: "corporate",
    name: "Corporate",
    description: "Professional and business events.",
    icon: "💼",
    eventTypes: [
      { slug: "conference", name: "Conference", description: "Multi-session professional conference." },
      { slug: "seminar", name: "Seminar", description: "Focused talk or workshop." },
      { slug: "product-launch", name: "Product Launch", description: "Launch event for a product." },
      { slug: "team-outing", name: "Team Outing", description: "Team-building outing." },
      { slug: "annual-day", name: "Annual Day", description: "Company annual-day celebration." },
      { slug: "award-ceremony", name: "Award Ceremony", description: "Recognition and awards event." },
    ],
  },
  {
    slug: "education",
    name: "Education",
    description: "School, college, and alumni events.",
    icon: "🎓",
    eventTypes: [
      { slug: "school-annual-day", name: "School Annual Day", description: "School annual-day function." },
      { slug: "college-fest", name: "College Fest", description: "Cultural / technical college festival." },
      { slug: "graduation", name: "Graduation", description: "Graduation / convocation ceremony." },
      { slug: "alumni-reunion", name: "Alumni Reunion", description: "Reunion of former students." },
    ],
  },
  {
    slug: "social-community",
    name: "Social & Community",
    description: "Gatherings that bring people together.",
    icon: "🤝",
    eventTypes: [
      { slug: "reunion", name: "Reunion", description: "Family or group reunion." },
      { slug: "fundraiser", name: "Fundraiser", description: "Fundraising event for a cause." },
      { slug: "community-gathering", name: "Community Gathering", description: "Neighbourhood or community meet." },
      { slug: "charity-event", name: "Charity Event", description: "Charity drive or benefit." },
    ],
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    description: "Shows, performances, and parties.",
    icon: "🎉",
    eventTypes: [
      { slug: "concert", name: "Concert", description: "Live music concert." },
      { slug: "live-performance", name: "Live Performance", description: "Theatre or live act." },
      { slug: "dance-music-show", name: "Dance / Music Show", description: "Dance or music showcase." },
      { slug: "private-party", name: "Private Party", description: "Private celebration or party." },
    ],
  },
  {
    slug: "food-hospitality",
    name: "Food & Hospitality",
    description: "Catering, banquets, and food-forward events.",
    icon: "🍽️",
    eventTypes: [
      { slug: "catering-event", name: "Catering Event", description: "Catering-led event." },
      { slug: "banquet", name: "Banquet", description: "Formal seated banquet." },
      { slug: "tasting-event", name: "Tasting Event", description: "Food or beverage tasting." },
      { slug: "food-festival", name: "Food Festival", description: "Multi-stall food festival." },
    ],
  },
];

export function totalEventTypeCount(): number {
  return CATALOG.reduce((n, c) => n + c.eventTypes.length, 0);
}

export function findEventType(slug: string): { category: EventCategoryDef; type: EventTypeDef } | null {
  for (const category of CATALOG) {
    const type = category.eventTypes.find((t) => t.slug === slug);
    if (type) return { category, type };
  }
  return null;
}
