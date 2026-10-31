export type PlanObject = {
  id: string;
  kind: string;
  label: string | null;
  posX: number;
  posY: number;
  posZ: number;
  rotY: number;
  scale: number;
  seats: number;
  style: string | null;
};

export type PlanLayout = {
  id: string;
  roomWidth: number;
  roomDepth: number;
  illustrative: boolean;
  objects: PlanObject[];
};

export type PlanVenue = {
  id: string;
  providerId: string | null;
  source: string;
  isSample: boolean;
  verified?: boolean;
  name: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  phone: string | null;
  openingHours: string[];
  photos: string[];
  venueTypes: string[];
  mapsUrl: string | null;
  capacityMin?: number | null;
  capacityMax?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  amenities?: string[];
  sourceName?: string | null;
  sourceUrl?: string | null;
  attribution: string | null;
  lastCheckedAt: string | null;
  distanceKm?: number | null;
  eventClass?: "event-venue" | "hotel-possible" | "other";
  eventVerified?: boolean;
};

export type PlanBudgetItem = {
  id: string;
  category: string;
  label: string;
  quantity: number;
  unitCostMin: number;
  unitCostMax: number;
  estimated: boolean;
  assumption: string | null;
};

export type PlanMenu = {
  id: string;
  style: string;
  dietary: string;
  courses: { course: string; items: string[] }[];
  notes: string | null;
  estimated: boolean;
};

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in-progress" | "completed" | "overdue";

export type PlanTask = {
  id: string;
  title: string;
  detail: string | null;
  offsetDays: number;
  startDate: string | null;
  dueDate: string | null;
  done: boolean;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string | null;
  vendorId: string | null;
  dependsOnId: string | null;
};

export type VendorPackage = {
  name: string;
  priceMin: number;
  priceMax: number;
  unit: string;
  includes: string[];
};

export type PlanVendorInfo = {
  id: string;
  source: string;
  isSample: boolean;
  verified: boolean;
  name: string;
  category: string;
  city: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  photos: string[];
  rating: number | null;
  reviewCount: number | null;
  packages: VendorPackage[];
  sourceName: string | null;
  sourceUrl: string | null;
};

export type VendorStatus = "ENQUIRED" | "NEGOTIATING" | "CONFIRMED" | "CANCELLED";

export type PlanSavedVendor = {
  id: string;
  vendorId: string;
  status: VendorStatus;
  favourite: boolean;
  note: string | null;
  packageName: string | null;
  agreedCost: number | null;
  enquiry: string | null;
  vendor: PlanVendorInfo | null;
};

export type Plan = {
  id: string;
  shareToken: string;
  title: string;
  city: string;
  eventType: { slug: string; name: string; categoryName: string; defaultStyles: string[] };
  startDate: string | null;
  endDate: string | null;
  guestCount: number;
  budget: number;
  styles: string[];
  preferences: Record<string, unknown>;
  notes: string | null;
  selectedVenue: PlanVenue | null;
  savedVenues: { id: string; note: string | null; venue: PlanVenue }[];
  layout: PlanLayout | null;
  budgetItems: PlanBudgetItem[];
  menus: PlanMenu[];
  tasks: PlanTask[];
  savedVendors: PlanSavedVendor[];
  recommendations: { id: string; kind: string; provider: string; payload: unknown; isGenerated: boolean; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
};

export const OBJECT_KINDS = [
  { kind: "round-table", label: "Round table", seats: 8 },
  { kind: "rect-table", label: "Rect table", seats: 10 },
  { kind: "chair", label: "Chair", seats: 1 },
  { kind: "stage", label: "Stage", seats: 0 },
  { kind: "dance-floor", label: "Dance floor", seats: 0 },
  { kind: "buffet", label: "Buffet", seats: 0 },
  { kind: "entrance", label: "Entrance", seats: 0 },
  { kind: "decor-arch", label: "Decor arch", seats: 0 },
  { kind: "pillar", label: "Pillar", seats: 0 },
  { kind: "service", label: "Service", seats: 0 },
] as const;
