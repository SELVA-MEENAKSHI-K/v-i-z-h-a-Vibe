import { describe, it, expect } from "vitest";
import { normalizeGoogle, normalizeSample, normalizeCatalog } from "@/lib/venues";
import { SAMPLE_VENUES, sampleVenuesForCity } from "@/data/sampleVenues";

describe("venue normalization", () => {
  it("labels sample venues as not-live and never claims verified capacity", () => {
    const n = normalizeSample(SAMPLE_VENUES[0]);
    expect(n.isSample).toBe(true);
    expect(n.source).toBe("sample");
    expect(n.attribution).toMatch(/Sample data/i);
    expect(n.unverified).toContain("capacity");
    expect(n.unverified).toContain("pricing");
  });

  it("filters sample venues by city case-insensitively", () => {
    const madurai = sampleVenuesForCity("madurai");
    expect(madurai.length).toBeGreaterThan(0);
    expect(madurai.every((v) => v.city === "Madurai")).toBe(true);
  });

  it("normalizes a Google place, leaving missing fields null (no fabrication)", () => {
    const n = normalizeGoogle(
      {
        id: "abc123",
        displayName: { text: "Real Hall" },
        formattedAddress: "1 Main St",
        location: { latitude: 13, longitude: 80 },
        rating: 4.4,
        userRatingCount: 50,
        // website, phone, hours omitted on purpose
        types: ["banquet_hall"],
      },
      "Chennai",
    );
    expect(n.source).toBe("google");
    expect(n.isSample).toBe(false);
    expect(n.name).toBe("Real Hall");
    expect(n.website).toBeNull();
    expect(n.phone).toBeNull();
    expect(n.openingHours).toEqual([]);
    // We never invent capacity/price for live venues.
    expect(n.capacityMin).toBeNull();
    expect(n.capacityMax).toBeNull();
    expect(n.priceMin).toBeNull();
    expect(n.attribution).toMatch(/Google/i);
    // Live Google place IDs power an "open in Google Maps" link.
    expect(n.providerId).toBe("google:abc123");
  });

  it("keeps sample, catalog, and live data clearly distinguishable", () => {
    const sample = normalizeSample(SAMPLE_VENUES[0]);
    const live = normalizeGoogle({ id: "x", displayName: { text: "Y" } }, "Madurai");
    expect(sample.source).toBe("sample");
    expect(live.source).toBe("google");
    expect(sample.isSample).toBe(true);
    expect(live.isSample).toBe(false);
  });

  it("hides capacity/price for unverified catalog records", () => {
    const n = normalizeCatalog({
      id: "c1",
      name: "Pending Mahal",
      venueType: "mahal",
      address: null,
      city: "Madurai",
      area: null,
      lat: null,
      lng: null,
      phone: null,
      website: null,
      capacityMin: 100,
      capacityMax: 500,
      priceMin: 50000,
      priceMax: 200000,
      amenities: JSON.stringify(["parking"]),
      placeId: null,
      mapsUrl: null,
      sourceName: "Template",
      sourceUrl: null,
      verification: "unverified",
      lastVerifiedAt: null,
    });
    // Unverified => capacity/price/amenities are suppressed.
    expect(n.verified).toBe(false);
    expect(n.capacityMin).toBeNull();
    expect(n.priceMin).toBeNull();
    expect(n.amenities).toEqual([]);
    expect(n.attribution).toMatch(/Not verified/i);
  });

  it("exposes capacity/price only when a catalog record is verified", () => {
    const n = normalizeCatalog({
      id: "c2",
      name: "Verified Hall",
      venueType: "banquet_hall",
      address: "Madurai",
      city: "Madurai",
      area: null,
      lat: null,
      lng: null,
      phone: null,
      website: null,
      capacityMin: 200,
      capacityMax: 800,
      priceMin: 80000,
      priceMax: 300000,
      amenities: JSON.stringify(["parking", "AC"]),
      placeId: null,
      mapsUrl: null,
      sourceName: "Venue-submitted",
      sourceUrl: "https://example.com",
      verification: "verified",
      lastVerifiedAt: new Date(),
    });
    expect(n.verified).toBe(true);
    expect(n.capacityMin).toBe(200);
    expect(n.priceMax).toBe(300000);
    expect(n.amenities).toContain("parking");
  });
});
