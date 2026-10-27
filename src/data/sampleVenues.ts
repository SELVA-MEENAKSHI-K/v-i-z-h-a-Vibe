// Sample venues shown when no Google Places key is configured.
// Every entry is explicitly flagged as sample data and MUST be labeled
// "Sample data — not live venue information." in the UI. These are illustrative
// placeholders — names, ratings, and details are fictional and NOT real venues.

export type SampleVenue = {
  providerId: string; // synthetic id, prefixed "sample:"
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  website: string;
  phone: string;
  openingHours: string[];
  venueTypes: string[];
  // Illustrative capacity — clearly an estimate, never presented as confirmed.
  approxCapacity: number;
};

export const SAMPLE_VENUES: SampleVenue[] = [
  // ---- Madurai ----
  {
    providerId: "sample:mdu-1",
    name: "Thamizh Mandapam (Sample)",
    address: "Near Meenakshi Temple area, Madurai, Tamil Nadu",
    city: "Madurai",
    lat: 9.9195,
    lng: 78.1193,
    rating: 4.5,
    reviewCount: 320,
    website: "https://example.com/thamizh-mandapam",
    phone: "+91 90000 00001",
    openingHours: ["Mon–Sun: 8:00 AM – 10:00 PM"],
    venueTypes: ["banquet_hall", "wedding_venue"],
    approxCapacity: 600,
  },
  {
    providerId: "sample:mdu-2",
    name: "Vaigai Garden Pavilion (Sample)",
    address: "Vaigai Riverside, Madurai, Tamil Nadu",
    city: "Madurai",
    lat: 9.9256,
    lng: 78.119,
    rating: 4.2,
    reviewCount: 142,
    website: "https://example.com/vaigai-garden",
    phone: "+91 90000 00002",
    openingHours: ["Mon–Sun: 9:00 AM – 11:00 PM"],
    venueTypes: ["garden", "event_venue"],
    approxCapacity: 350,
  },
  {
    providerId: "sample:mdu-3",
    name: "Madurai Convention Center (Sample)",
    address: "Ring Road, Madurai, Tamil Nadu",
    city: "Madurai",
    lat: 9.939,
    lng: 78.121,
    rating: 4.0,
    reviewCount: 88,
    website: "https://example.com/mdu-convention",
    phone: "+91 90000 00003",
    openingHours: ["Mon–Sun: 7:00 AM – 11:00 PM"],
    venueTypes: ["convention_center"],
    approxCapacity: 1200,
  },
  // ---- Chennai ----
  {
    providerId: "sample:maa-1",
    name: "Marina Grand Banquet (Sample)",
    address: "Near Marina, Chennai, Tamil Nadu",
    city: "Chennai",
    lat: 13.0604,
    lng: 80.2824,
    rating: 4.6,
    reviewCount: 540,
    website: "https://example.com/marina-grand",
    phone: "+91 90000 00011",
    openingHours: ["Mon–Sun: 8:00 AM – 11:00 PM"],
    venueTypes: ["banquet_hall", "hotel"],
    approxCapacity: 900,
  },
  {
    providerId: "sample:maa-2",
    name: "ECR Beach Resort Lawn (Sample)",
    address: "East Coast Road, Chennai, Tamil Nadu",
    city: "Chennai",
    lat: 12.8,
    lng: 80.24,
    rating: 4.4,
    reviewCount: 210,
    website: "https://example.com/ecr-resort",
    phone: "+91 90000 00012",
    openingHours: ["Mon–Sun: 9:00 AM – 12:00 AM"],
    venueTypes: ["resort", "garden"],
    approxCapacity: 500,
  },
  {
    providerId: "sample:maa-3",
    name: "T. Nagar Community Hall (Sample)",
    address: "T. Nagar, Chennai, Tamil Nadu",
    city: "Chennai",
    lat: 13.0418,
    lng: 80.2341,
    rating: 3.9,
    reviewCount: 64,
    website: "https://example.com/tnagar-hall",
    phone: "+91 90000 00013",
    openingHours: ["Mon–Sun: 6:00 AM – 10:00 PM"],
    venueTypes: ["community_center"],
    approxCapacity: 250,
  },
  // ---- Bangalore ----
  {
    providerId: "sample:blr-1",
    name: "Cubbon Greens Convention (Sample)",
    address: "Central Bangalore, Karnataka",
    city: "Bangalore",
    lat: 12.9763,
    lng: 77.5929,
    rating: 4.5,
    reviewCount: 410,
    website: "https://example.com/cubbon-greens",
    phone: "+91 90000 00021",
    openingHours: ["Mon–Sun: 8:00 AM – 11:00 PM"],
    venueTypes: ["convention_center", "banquet_hall"],
    approxCapacity: 1000,
  },
  {
    providerId: "sample:blr-2",
    name: "Whitefield Garden Villa (Sample)",
    address: "Whitefield, Bangalore, Karnataka",
    city: "Bangalore",
    lat: 12.9698,
    lng: 77.7499,
    rating: 4.3,
    reviewCount: 176,
    website: "https://example.com/whitefield-villa",
    phone: "+91 90000 00022",
    openingHours: ["Mon–Sun: 9:00 AM – 11:00 PM"],
    venueTypes: ["garden", "event_venue"],
    approxCapacity: 400,
  },
  {
    providerId: "sample:blr-3",
    name: "Indiranagar Rooftop Lounge (Sample)",
    address: "Indiranagar, Bangalore, Karnataka",
    city: "Bangalore",
    lat: 12.9719,
    lng: 77.6412,
    rating: 4.1,
    reviewCount: 98,
    website: "https://example.com/indiranagar-rooftop",
    phone: "+91 90000 00023",
    openingHours: ["Mon–Sun: 11:00 AM – 1:00 AM"],
    venueTypes: ["event_venue", "bar"],
    approxCapacity: 180,
  },
];

export function sampleVenuesForCity(city?: string): SampleVenue[] {
  if (!city) return SAMPLE_VENUES;
  const c = city.trim().toLowerCase();
  return SAMPLE_VENUES.filter((v) => v.city.toLowerCase() === c);
}
