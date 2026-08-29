/**
 * photoHelper.ts
 * Utility functions for resolving donation photo URLs.
 *
 * Donation photos are stored on the backend filesystem and served via:
 *   GET /api/donations/photo/{filename}
 *
 * A donation's photoUrls array contains strings in one of these forms:
 *   1. Full absolute URL: "https://..."  → use as-is (legacy/cloud)
 *   2. Relative API path: "/api/donations/photo/uuid.jpg"  → prefix with backend base URL
 *   3. Data URI: "data:image/..."  → use as-is (legacy inline base64)
 */

const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')
  : '';

/**
 * Resolve a photo URL for display.
 * Handles relative API paths, absolute URLs, and data URIs.
 */
export const getPhotoUrl = (url: string): string => {
  if (!url) return '';

  // Already absolute (https:// or http://) or data URI
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }

  // Relative path starting with /api/donations/photo/ → prefix with backend base
  if (url.startsWith('/api/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }

  // Fallback: just return as-is
  return url;
};

/**
 * Get the first photo from a donation's photoUrls array, with a fallback placeholder.
 */
export const getPrimaryPhotoUrl = (photoUrls: string[] | null | undefined, fallback = '/placeholder-donation.svg'): string => {
  if (!photoUrls || photoUrls.length === 0) return fallback;
  const firstUrl = getPhotoUrl(photoUrls[0]);
  return firstUrl || fallback;
};
