import axios, { AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("pos_token");
      window.localStorage.removeItem("pos_user");
    }

    return Promise.reject(error);
  }
);

export function setApiToken(token: string | null) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const serverMessage =
    (error.response?.data as { message?: string } | undefined)?.message ?? "";

  return serverMessage || fallbackMessage;
}
