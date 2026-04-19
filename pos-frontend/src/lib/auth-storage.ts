import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "pos_token";
const USER_KEY = "pos_user";

export function saveAuthSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function loadAuthSession(): { token: string | null; user: AuthUser | null } {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return { token, user: null };
  }

  try {
    return { token, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    return { token: null, user: null };
  }
}
