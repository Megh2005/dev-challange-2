import { MedicineBuyingOption, PrescribedMedicine } from "@/types/prescription";

export interface UserGeoLocation {
  latitude?: number;
  longitude?: number;
  countryCode?: string;
  locationName?: string;
}

interface SerpShoppingItem {
  position?: number;
  title?: string;
  link?: string;
  product_link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  serpapi_thumbnail?: string;
  delivery?: string;
  extensions?: string[];
}

interface SerpShoppingResponse {
  shopping_results?: SerpShoppingItem[];
  error?: string;
}

// In-memory cache for reverse geocoded coordinates to prevent redundant network lookups
const geoCache = new Map<string, { gl: string; location?: string }>();

/**
 * Resolves user coordinates (latitude, longitude) into country code (gl) and canonical city/state string.
 * Defaults to India (gl: "in", location: "India") if no coordinates or lookup fails, avoiding US defaults.
 */
async function resolveUserLocation(geo?: UserGeoLocation): Promise<{
  lat?: number;
  lon?: number;
  gl: string;
  location?: string;
}> {
  if (geo && typeof geo.latitude === "number" && typeof geo.longitude === "number") {
    const cacheKey = `${geo.latitude.toFixed(3)},${geo.longitude.toFixed(3)}`;
    if (geoCache.has(cacheKey)) {
      const cached = geoCache.get(cacheKey)!;
      return {
        lat: geo.latitude,
        lon: geo.longitude,
        gl: cached.gl,
        location: cached.location
      };
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${geo.latitude}&lon=${geo.longitude}&format=json`,
        {
          headers: { "User-Agent": "PrescriptionDecipherApp/1.0" }
        }
      );

      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const countryCode = (address.country_code || "in").toLowerCase();
        const city =
          address.city ||
          address.town ||
          address.suburb ||
          address.village ||
          address.state_district ||
          address.state;
        const state = address.state;
        const country = address.country;
        const locationName = [city, state, country].filter(Boolean).join(", ");

        const resolved = {
          gl: countryCode,
          location: locationName || country || "India"
        };
        geoCache.set(cacheKey, resolved);

        return {
          lat: geo.latitude,
          lon: geo.longitude,
          gl: resolved.gl,
          location: resolved.location
        };
      }
    } catch (e) {
      console.warn("Reverse geocode lookup failed, applying fallback coordinates:", e);
    }

    return {
      lat: geo.latitude,
      lon: geo.longitude,
      gl: geo.countryCode || "in",
      location: geo.locationName || "India"
    };
  }

  // Fallback when location permission not granted: default to India rather than US
  return {
    gl: "in",
    location: "India"
  };
}

/**
 * Query SerpApi Google Shopping API for a specific medicine name localized to user's latitude and longitude
 */
export async function fetchMedicineBuyingOptions(
  medicineName: string,
  genericName?: string,
  geo?: UserGeoLocation
): Promise<MedicineBuyingOption[]> {
  const apiKey = process.env.SERP_API_KEY || process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    console.warn("SerpApi API key not found in environment (SERP_API_KEY). Skipping shopping search.");
    return [];
  }

  const primaryQuery = medicineName.trim();
  if (!primaryQuery) return [];

  const locationInfo = await resolveUserLocation(geo);

  const executeSearch = async (query: string): Promise<MedicineBuyingOption[]> => {
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google_shopping");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("num", "6");
      url.searchParams.set("hl", "en");

      // Strictly apply localized geographic parameters
      url.searchParams.set("gl", locationInfo.gl);
      if (locationInfo.location) {
        url.searchParams.set("location", locationInfo.location);
      }
      if (locationInfo.lat && locationInfo.lon) {
        url.searchParams.set("lat", locationInfo.lat.toString());
        url.searchParams.set("lon", locationInfo.lon.toString());
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        console.error(`SerpApi responded with HTTP ${response.status} for query "${query}"`);
        return [];
      }

      const data: SerpShoppingResponse = await response.json();

      if (data.error) {
        console.error(`SerpApi error for query "${query}":`, data.error);
        return [];
      }

      if (!data.shopping_results || !Array.isArray(data.shopping_results)) {
        return [];
      }

      const options: MedicineBuyingOption[] = [];

      for (const item of data.shopping_results) {
        const directLink = item.link || item.product_link;
        if (!directLink) continue;

        let displayPrice = item.price;
        if (!displayPrice && typeof item.extracted_price === "number") {
          displayPrice = `$${item.extracted_price.toFixed(2)}`;
        }

        let deliveryInfo = item.delivery;
        if (!deliveryInfo && item.extensions && item.extensions.length > 0) {
          deliveryInfo = item.extensions[0];
        }

        options.push({
          title: item.title || query,
          source: item.source || "Online Pharmacy",
          price: displayPrice,
          link: directLink,
          thumbnail: item.thumbnail || item.serpapi_thumbnail,
          rating: typeof item.rating === "number" ? item.rating : undefined,
          delivery: deliveryInfo
        });

        if (options.length >= 3) break;
      }

      return options;
    } catch (err) {
      console.error(`Failed to fetch localized shopping results from SerpApi for "${query}":`, err);
      return [];
    }
  };

  // 1. Try search with exact medicine name with user location
  let results = await executeSearch(primaryQuery);

  // 2. Fallback to generic name if primary query returned 0 results
  if (results.length === 0 && genericName && genericName.trim() && genericName !== primaryQuery) {
    results = await executeSearch(genericName.trim());
  }

  return results;
}

/**
 * Enriches a list of prescribed medicines with top 3 localized buying options in parallel
 */
export async function enrichMedicinesWithBuyingOptions(
  medicines: PrescribedMedicine[],
  geo?: UserGeoLocation
): Promise<PrescribedMedicine[]> {
  if (!medicines || medicines.length === 0) return [];

  const promises = medicines.map(async (med) => {
    try {
      const options = await fetchMedicineBuyingOptions(med.name, med.genericName, geo);
      return {
        ...med,
        buyingOptions: options
      };
    } catch {
      return {
        ...med,
        buyingOptions: []
      };
    }
  });

  const settled = await Promise.allSettled(promises);

  return settled.map((res, idx) => {
    if (res.status === "fulfilled") {
      return res.value;
    }
    return {
      ...medicines[idx],
      buyingOptions: []
    };
  });
}
