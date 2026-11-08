/**
 * API Configuration for Standalone Render Backend Server & Cloudflare Deployment
 */

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * Returns full URL for API endpoints.
 * - In local development: defaults to relative '/api/...' (handled by Vite proxy).
 * - In production: uses VITE_API_BASE_URL (Render backend) or relative path if proxied by Cloudflare.
 */
export function getApiEndpoint(endpointPath: string): string {
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

