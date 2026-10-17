import { GEMMA_MODEL_CONFIG, DownloadProgress } from "@/types/gemma";

/**
 * Checks if the Gemma 4 E2B model is already stored in the browser Cache Storage.
 */
export async function isModelCached(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false;
  }

  try {
    const cache = await caches.open(GEMMA_MODEL_CONFIG.cacheName);
    const match = await cache.match(GEMMA_MODEL_CONFIG.cacheUrl);
    return !!match;
  } catch (err) {
    console.warn("Error inspecting Cache Storage for Gemma model:", err);
    return false;
  }
}

/**
 * Retrieves the cached Gemma model blob from Cache Storage, if available.
 */
export async function getCachedModelBlob(): Promise<Blob | null> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return null;
  }

  try {
    const cache = await caches.open(GEMMA_MODEL_CONFIG.cacheName);
    const response = await cache.match(GEMMA_MODEL_CONFIG.cacheUrl);
    if (!response) return null;
    return await response.blob();
  } catch (err) {
    console.warn("Failed to retrieve cached model blob:", err);
    return null;
  }
}

/**
 * Downloads the Gemma 4 E2B model artifact from Hugging Face with progress callbacks,
 * and caches it in browser Cache Storage for instant offline/subsequent reloads.
 */
export async function downloadAndCacheGemmaModel(
  onProgress?: (progress: DownloadProgress) => void
): Promise<Blob> {
  // 1. Check if already cached
  const existing = await getCachedModelBlob();
  if (existing) {
    if (onProgress) {
      onProgress({
        receivedBytes: existing.size,
        totalBytes: existing.size,
        percentage: 100,
      });
    }
    return existing;
  }

  // 2. Fetch binary with streaming reader for accurate progress calculation
  const response = await fetch(GEMMA_MODEL_CONFIG.huggingFaceUrl, {
    method: "GET",
    headers: {
      Accept: "application/octet-stream",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download Gemma 4 E2B model artifact (HTTP ${response.status}: ${response.statusText}).`
    );
  }

  const contentLengthHeader = response.headers.get("Content-Length");
  // Default to ~1.3GB if header omitted by CDN
  const totalBytes = contentLengthHeader
    ? parseInt(contentLengthHeader, 10)
    : 1350 * 1024 * 1024;

  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    await saveModelToCache(blob);
    return blob;
  }

  let receivedBytes = 0;
  const chunks: BlobPart[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      chunks.push(value);
      receivedBytes += value.length;

      if (onProgress) {
        const percentage = Math.min(
          99,
          Math.round((receivedBytes / totalBytes) * 100)
        );
        onProgress({
          receivedBytes,
          totalBytes,
          percentage,
        });
      }
    }
  }

  const completeBlob = new Blob(chunks, { type: "application/octet-stream" });

  if (onProgress) {
    onProgress({
      receivedBytes: completeBlob.size,
      totalBytes: completeBlob.size,
      percentage: 100,
    });
  }

  // Cache in browser Cache Storage
  await saveModelToCache(completeBlob);

  return completeBlob;
}

/**
 * Persists model binary to Cache Storage.
 */
async function saveModelToCache(blob: Blob): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  try {
    const cache = await caches.open(GEMMA_MODEL_CONFIG.cacheName);
    const response = new Response(blob, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": blob.size.toString(),
      },
    });
    await cache.put(GEMMA_MODEL_CONFIG.cacheUrl, response);
  } catch (err) {
    console.warn("Unable to cache model in Cache Storage:", err);
  }
}

/**
 * Purges the cached model artifact to free browser storage.
 */
export async function clearGemmaModelCache(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false;
  }

  try {
    return await caches.delete(GEMMA_MODEL_CONFIG.cacheName);
  } catch (err) {
    console.warn("Error clearing Gemma model cache:", err);
    return false;
  }
}
