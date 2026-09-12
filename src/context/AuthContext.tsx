import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phoneNumber?: string | null;
  departmentId?: string | null;
  facultyId?: string | null;
  status: string;
}

export interface StudentProfile {
  id: string;
  matricNumber: string;
  jambRegNumber: string;
  programmeType: string;
  level: string;
  academicSession: string;
  cgpa: number;
  isClearanceEligible: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  roles: string[];
  permissions: string[];
  student: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoAccount: (email: string) => Promise<boolean>;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'futminna_fedpoffa_auth_token';
const USER_CACHE_KEY = 'futminna_fedpoffa_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Setup Axios interceptor to automatically attach Authorization header
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && config.headers) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401 && error.response.data?.code === 'TOKEN_INVALID') {
          // Token expired or invalid
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Validate existing token on boot
  useEffect(() => {
    async function validateSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        setUser(response.data.user);
        setRoles(response.data.roles || []);
        setPermissions(response.data.permissions || []);
        setStudent(response.data.student || null);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
        setToken(null);
        setRoles([]);
        setPermissions([]);
        setStudent(null);
      } finally {
        setIsLoading(false);
      }
    }

    validateSession();
  }, []);

  const login = async (identifier: string, password = 'Password@2026!'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { identifier, password });
      const { token: receivedToken, user: receivedUser, roles: receivedRoles, permissions: receivedPerms, student: receivedStudent } = response.data;

      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      setRoles(receivedRoles || []);
      setPermissions(receivedPerms || []);
      setStudent(receivedStudent || null);

      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Please check credentials.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoAccount = async (email: string): Promise<boolean> => {
    const res = await login(email, 'Password@2026!');
    return res.success;
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await axios.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      setToken(null);
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setStudent(null);
    }
  };

  const hasRole = (targetRole: string | string[]): boolean => {
    if (roles.includes('SUPER_ADMIN')) return true;
    if (Array.isArray(targetRole)) {
      return targetRole.some((r) => roles.includes(r));
    }
    return roles.includes(targetRole);
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (roles.includes('SUPER_ADMIN')) return true;
    return permissions.includes(permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roles,
        permissions,
        student,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        switchDemoAccount,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
