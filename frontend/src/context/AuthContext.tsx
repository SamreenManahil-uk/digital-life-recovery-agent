import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearToken,
  getCurrentUser,
  getStoredToken,
  loginUser,
  registerUser,
  storeToken,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "../api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (
    payload: LoginPayload,
  ) => Promise<void>;
  register: (
    payload: RegisterPayload,
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [token, setToken] =
    useState<string | null>(
      getStoredToken(),
    );

  const [loading, setLoading] =
    useState(true);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedToken =
        getStoredToken();

      if (!storedToken) {
        if (active) {
          setLoading(false);
        }

        return;
      }

      try {
        const currentUser =
          await getCurrentUser(
            storedToken,
          );

        if (!active) {
          return;
        }

        setToken(storedToken);
        setUser(currentUser);
      } catch {
        if (active) {
          clearToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result =
        await loginUser(payload);

      storeToken(
        result.access_token,
      );

      setToken(
        result.access_token,
      );

      setUser(result.user);
    },
    [],
  );

  const register = useCallback(
    async (
      payload: RegisterPayload,
    ) => {
      const result =
        await registerUser(payload);

      storeToken(
        result.access_token,
      );

      setToken(
        result.access_token,
      );

      setUser(result.user);
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      loading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}
