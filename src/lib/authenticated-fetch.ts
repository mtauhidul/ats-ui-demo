/**
 * Fetch API wrapper with authentication
 * Automatically attaches JWT token to requests and handles token refresh
 */

import { API_BASE_URL } from "@/config/api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./auth-utils";
import { navigateTo } from "./navigation";

export interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipRetry?: boolean; // Internal flag to prevent infinite retry loops
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const startTime = performance.now();
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
      const fetchTime = performance.now() - startTime;
      if (!response.ok) {
        clearTokens();
        navigateTo("/login");
        return null;
      }

      const data = await response.json();
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        data.data;

      setAccessToken(newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      return newAccessToken;
    } catch (error) {
      clearTokens();
      navigateTo("/login");
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch wrapper that automatically includes JWT authentication token
 * @param url - URL to fetch (can be relative or absolute)
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const startTime = performance.now();
  
  // Convert relative URLs to absolute URLs using API_BASE_URL
  const absoluteUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const {
    skipAuth = false,
    skipRetry = false,
    headers = {},
    body,
    ...restOptions
  } = options;

  const requestHeaders: HeadersInit = { ...headers };

  // Only set Content-Type if not FormData (browser will set it with boundary)
  if (!(body instanceof FormData)) {
    (requestHeaders as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  // Add authentication token if not skipped
  if (!skipAuth) {
    try {
      const token = getAccessToken();
      if (token) {
        (requestHeaders as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
        } else {
        }
    } catch (error) {
      }
  }

  // Make the request with timeout
  const fetchStart = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(absoluteUrl, {
      ...restOptions,
      body,
      headers: requestHeaders,
      credentials: "include", // Important for cookies (refresh token)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const fetchTime = performance.now() - fetchStart;
    // Handle 401 Unauthorized - attempt token refresh and retry
    if (response.status === 401 && !skipAuth && !skipRetry) {
    const refreshStart = performance.now();
    const newToken = await refreshAccessToken();
    const refreshTime = performance.now() - refreshStart;
    if (newToken) {
      // Retry the request with the new token
      (requestHeaders as Record<string, string>)[
        "Authorization"
      ] = `Bearer ${newToken}`;

      const retryStart = performance.now();
      const retryResponse = await fetch(url, {
        ...restOptions,
        body,
        headers: requestHeaders,
        credentials: "include",
      });
      const retryTime = performance.now() - retryStart;
      const totalTime = performance.now() - startTime;
      return retryResponse;
    }
    }

    const totalTime = performance.now() - startTime;
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is too slow');
    }
    throw error;
  }
}
