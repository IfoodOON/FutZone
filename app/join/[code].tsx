import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";

export default function JoinRedirectScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    router.replace({ pathname: "/(onboarding)/bem-vindo", params: { code } });
  }, [code]);

  return null;
}
