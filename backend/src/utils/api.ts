// ❌ Change whatever address is currently set here (like /api or localhost:3000)
// ✅ Set it to point directly to your Express service port 5000:
export const BASE_URL = "http://localhost:5000";

interface ApiConfig extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiRequest(endpoint: string, config: ApiConfig = {}) {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";
  
  // Clean up endpoints passed with leading slashes to prevent url stacking gaps
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const headers = {
    ...config.headers,
    "Authorization": `Bearer ${token}`,
  };

  const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
    ...config,
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}