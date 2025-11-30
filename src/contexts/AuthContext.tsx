/**
 * Auth Context for JWT Authentication
 * Replaces Clerk authentication with custom JWT-based auth
 */

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser, refreshAccessToken } from '@/services/auth.service';
import type { LoginCredentials } from '@/services/auth.service';
import * as authUtils from '@/lib/auth-utils';
import { useFirestoreDocument } from '@/hooks/useFirestore';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  phone?: string;
  title?: string;
  department?: string;
  avatar?: string;
  permissions?: {
    canManageClients?: boolean;
    canManageJobs?: boolean;
    canReviewApplications?: boolean;
    canManageCandidates?: boolean;
    canSendEmails?: boolean;
    canManageTeam?: boolean;
    canAccessAnalytics?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export context for use in hooks
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 🔥 REALTIME: Subscribe to current user's Firestore document
  const { data: firestoreUser } = useFirestoreDocument<User>({
    documentPath: userId ? `users/${userId}` : '',
    enabled: !!userId,
  });

  // Update user state when Firestore data changes (real-time sync)
  useEffect(() => {
    if (firestoreUser && userId) {
      setUser(firestoreUser);
    }
  }, [firestoreUser, userId]);

  // Logout function
  const handleLogout = useCallback(async () => {
    try {
      if (accessToken) {
        await apiLogout(accessToken);
      }
    } catch (error) {
      } finally {
      // Clear all auth data regardless of API result
      authUtils.clearTokens();
      setUser(null);
      setAccessToken(null);
      setUserId(null);
    }
  }, [accessToken]);

  // Handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    const storedRefreshToken = authUtils.getRefreshToken();
    
    if (!storedRefreshToken) {
      // No refresh token, clear auth state
      await handleLogout();
      return;
    }

    try {
      const response = await refreshAccessToken(storedRefreshToken);
      const newAccessToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken;

      if (newAccessToken) {
        authUtils.setAccessToken(newAccessToken);
        setAccessToken(newAccessToken);
      }

      if (newRefreshToken) {
        authUtils.setRefreshToken(newRefreshToken);
      }

      setUser(response.data.user);
      setUserId(response.data.user.id);
    } catch (error) {
      await handleLogout();
    }
  }, [handleLogout]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authUtils.getAccessToken();
      
      if (storedToken) {
        try {
          // Verify token and get user
          const response = await getCurrentUser(storedToken);
          
          // Backend returns { success: true, data: user }
          // The response from our API wrapper is the full JSON
          const userData = response.data as Record<string, unknown>;
          
          if (userData && (userData.email || (userData.user as Record<string, unknown>)?.email)) {
            // Handle both direct user and nested user formats
            const user = (userData.user || userData) as User;
            setUser(user);
            setAccessToken(storedToken);
            // Set userId to enable Firestore subscription
            setUserId(user.id);
            } else {
            // Invalid response, clear auth
            authUtils.clearTokens();
          }
        } catch (error) {
          // Clear invalid tokens
          authUtils.clearTokens();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const response = await apiLogin(credentials);
      const { user: userData, accessToken: token, refreshToken: refToken } = response.data;

      if (token) {
        authUtils.setAccessToken(token);
        setAccessToken(token);
      }

      if (refToken) {
        authUtils.setRefreshToken(refToken);
      }

      setUser(userData);
      setUserId(userData.id);
      } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    accessToken,
    login: handleLogin,
    logout: handleLogout,
    refreshToken: handleTokenRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
