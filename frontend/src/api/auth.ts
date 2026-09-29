import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://127.0.0.1:8000/api/v1";

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  display_name: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const TOKEN_KEY = "lifegraph_access_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function registerUser(
  payload: RegisterPayload,
) {
  const response = await axios.post<AuthResponse>(
    `${API_URL}/auth/register`,
    payload,
  );

  return response.data;
}

export async function loginUser(
  payload: LoginPayload,
) {
  const response = await axios.post<AuthResponse>(
    `${API_URL}/auth/login`,
    payload,
  );

  return response.data;
}

export async function getCurrentUser(
  token: string,
) {
  const response = await axios.get<AuthUser>(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}
