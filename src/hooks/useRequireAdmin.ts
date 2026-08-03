import { useEffect } from "react";
import { router } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export function useIsAdmin() {
  return useAppStore((state) => {
    const me = state.players.find((p) => p.id === state.currentUserId);
    return me?.role === "admin";
  });
}

export function useRequireAdmin() {
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/(tabs)");
    }
  }, [isAdmin]);

  return isAdmin;
}
