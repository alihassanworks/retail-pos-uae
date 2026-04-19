"use client";

import { useEffect } from "react";
import { hydrateSession } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { loadAuthSession } from "@/lib/auth-storage";
import { setApiToken } from "@/lib/api";

export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const { token, user } = loadAuthSession();
    setApiToken(token);
    dispatch(hydrateSession({ token, user }));
  }, [dispatch]);

  return null;
}
