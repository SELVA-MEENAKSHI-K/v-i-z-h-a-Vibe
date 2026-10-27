import { z } from "zod";

// Shared request/response validation schemas used by API route handlers and
// (where helpful) the client. Keeping them here gives one source of truth.

export const citySchema = z.string().trim().min(1).max(60);

export const preferencesSchema = z
  .object({
    dietary: z.array(z.string()).optional(),
    accessibility: z.array(z.string()).optional(),
    notes: z.string().max(2000).optional(),
  })
  .partial();

export const createPlanSchema = z.object({
  title: z.string().trim().min(1).max(120),
  city: citySchema,
  eventTypeSlug: z.string().trim().min(1).max(80),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  guestCount: z.number().int().min(1).max(100000).default(50),
  budget: z.number().int().min(0).max(1_000_000_000).default(0),
  styles: z.array(z.string()).max(8).optional(),
  preferences: preferencesSchema.optional(),
  notes: z.string().max(4000).optional(),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  selectedVenueId: z.string().optional().nullable(),
});

export const placedObjectSchema = z.object({
  id: z.string().optional(),
  kind: z.string().min(1).max(40),
  label: z.string().max(80).optional().nullable(),
  posX: z.number(),
  posY: z.number(),
  posZ: z.number(),
  rotY: z.number().default(0),
  scale: z.number().min(0.1).max(10).default(1),
  seats: z.number().int().min(0).max(5000).default(0),
  style: z.string().max(40).optional().nullable(),
});

export const layoutSchema = z.object({
  roomWidth: z.number().min(4).max(200).default(24),
  roomDepth: z.number().min(4).max(200).default(18),
  objects: z.array(placedObjectSchema).max(2000),
});

export const budgetItemSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  quantity: z.number().int().min(0).max(100000).default(1),
  unitCostMin: z.number().int().min(0).max(100_000_000).default(0),
  unitCostMax: z.number().int().min(0).max(100_000_000).default(0),
  estimated: z.boolean().default(true),
  assumption: z.string().max(400).optional().nullable(),
});

export const budgetSchema = z.object({
  items: z.array(budgetItemSchema).max(500),
});

export const venueSearchSchema = z.object({
  city: citySchema.optional(),
  query: z.string().trim().max(120).optional(),
});

// Admin-managed authorized catalog venue. Source + verification required so we
// never store guessed data without provenance.
export const catalogVenueSchema = z.object({
  name: z.string().trim().min(1).max(160),
  venueType: z.string().trim().min(1).max(40),
  address: z.string().max(300).optional().nullable(),
  city: citySchema,
  area: z.string().max(120).optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().max(160).optional().nullable(),
  website: z.string().url().max(300).optional().nullable(),
  capacityMin: z.number().int().min(0).max(100000).optional().nullable(),
  capacityMax: z.number().int().min(0).max(100000).optional().nullable(),
  priceMin: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  priceMax: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  amenities: z.array(z.string().max(60)).max(40).optional(),
  placeId: z.string().max(200).optional().nullable(),
  mapsUrl: z.string().url().max(400).optional().nullable(),
  // Provenance is required — this is the whole point of the catalog.
  sourceName: z.string().trim().min(1).max(120),
  sourceUrl: z.string().url().max(400).optional().nullable(),
  verification: z.enum(["verified", "unverified", "pending"]).default("unverified"),
  lastVerifiedAt: z.string().datetime().optional().nullable(),
  published: z.boolean().default(true),
});

export type CatalogVenueInput = z.infer<typeof catalogVenueSchema>;

export const aiRecommendationSchema = z.object({
  kind: z.enum(["theme", "decor", "menu", "budget", "timeline"]),
  planId: z.string().optional(),
  // Inline context when no saved plan exists yet.
  context: z
    .object({
      eventTypeSlug: z.string().optional(),
      city: z.string().optional(),
      guestCount: z.number().int().min(1).max(100000).optional(),
      budget: z.number().int().min(0).optional(),
      styles: z.array(z.string()).optional(),
      dietary: z.string().optional(),
      startDate: z.string().optional(),
    })
    .optional(),
});

export const aiChatSchema = z.object({
  planId: z.string().optional(),
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type LayoutInput = z.infer<typeof layoutSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type AiRecommendationInput = z.infer<typeof aiRecommendationSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
