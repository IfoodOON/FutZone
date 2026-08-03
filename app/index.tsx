import { Redirect } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const session = useAppStore((s) => s.session);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const group = useAppStore((s) => s.group);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!currentUserId || !group) return <Redirect href="/(onboarding)/bem-vindo" />;
  return <Redirect href="/(tabs)" />;
}
