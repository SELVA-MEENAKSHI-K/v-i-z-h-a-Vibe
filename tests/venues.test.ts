import { describe, it, expect } from "vitest";
import { normalizeGeoapify, normalizeSample, normalizeCatalog } from "@/lib/venues";
import { SAMPLE_VENUES, sampleVenuesForCity } from "@/data/sampleVenues";

describe("strict event-venue classification", () => {
  const geo = (name: string, categories: string[]) =>
    normalizeGeoapify({ properties: { name, categories, place_id: name, lat: 9.9, lon: 78.1 } }, "Madurai");

  it("classifies a provider events_venue as a verified event venue", () => {
    const v = geo("Sri Meenakshi Mahal", ["events_venue"]);
    expect(v.eventClass).toBe("event-venue");
    expect(v.eventVerified).toBe(true);
  });

  it("classifies a plain hotel as hotel-possible (facilities unverified)", () => {
    const v = geo("Hotel Heritage Madurai", ["accommodation.hotel"]);
    expect(v.eventClass).toBe("hotel-possible");
    expect(v.eventVerified).toBe(false);
  });

  it("excludes restaurants, cafés and shops", () => {
    expect(geo("Saravana Bhavan", ["catering.restaurant"]).eventClass).toBe("other");
    expect(geo("Cafe Coffee Day", ["catering.cafe"]).eventClass).toBe("other");
    expect(geo("Reliance Fresh", ["commercial.supermarket"]).eventClass).toBe("other");
  });

  it("does NOT promote to verified from name alone", () => {
    // 'mahal' in the name + no venue category => possible, not verified.
    const v = geo("Grand Mahal", ["commercial"]);
    expect(v.eventVerified).toBe(false);
    expect(v.eventClass).not.toBe("event-venue");
  });

  it("excludes an obvious tea/coffee shop even if named like a hall", () => {
    const v = geo("Tea Hall", ["catering.cafe"]);
    expect(v.eventClass).toBe("other");
  });

  it("hard-excludes restaurants/bhavans by name regardless of category", () => {
    expect(geo("Adyar Ananda Bhavan A2B Veg Restaurant", ["accommodation.hotel"]).eventClass).toBe("other");
    expect(geo("Saravana Bakery", ["building.commercial"]).eventClass).toBe("other");
  });
});

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

  it("normalizes a Geoapify place, leaving missing fields null (no fabrication)", () => {
    const n = normalizeGeoapify(
      {
        type: "Feature",
        properties: {
          name: "Real Hall",
          formatted: "1 Main St, Chennai",
          lat: 13,
          lon: 80,
          categories: ["catering.restaurant"],
          place_id: "abc123",
          // website, phone omitted on purpose
        },
        geometry: { type: "Point", coordinates: [80, 13] },
      },
      "Chennai",
    );
    expect(n.source).toBe("geoapify");
    expect(n.isSample).toBe(false);
    expect(n.name).toBe("Real Hall");
    expect(n.website).toBeNull();
    expect(n.phone).toBeNull();
    expect(n.openingHours).toEqual([]);
    // Geoapify Places does not provide ratings.
    expect(n.rating).toBeNull();
    expect(n.reviewCount).toBeNull();
    // We never invent capacity/price for live venues.
    expect(n.capacityMin).toBeNull();
    expect(n.capacityMax).toBeNull();
    expect(n.priceMin).toBeNull();
    expect(n.attribution).toMatch(/Geoapify/i);
    expect(n.providerId).toBe("geoapify:abc123");
  });

  it("keeps sample, catalog, and live data clearly distinguishable", () => {
    const sample = normalizeSample(SAMPLE_VENUES[0]);
    const live = normalizeGeoapify({ properties: { name: "Y", place_id: "x", lat: 9.9, lon: 78.1 } }, "Madurai");
    expect(sample.source).toBe("sample");
    expect(live.source).toBe("geoapify");
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
