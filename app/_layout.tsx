import "../global.css";

import { useEffect } from "react";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "@expo-google-fonts/hanken-grotesk";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from "@expo-google-fonts/hanken-grotesk";
import { JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { useAppStore } from "@/store/useAppStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    JetBrainsMono_700Bold,
  });
  const authLoading = useAppStore((s) => s.authLoading);
  const session = useAppStore((s) => s.session);

  useEffect(() => {
    const unsubscribe = useAppStore.getState().initAuth();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authLoading]);

  // app/index.tsx only picks the initial route once, when it mounts — once
  // the user has navigated into (tabs)/(onboarding), it's unmounted, so a
  // logout deep inside the app needs its own redirect back to login here.
  useEffect(() => {
    if (fontsLoaded && !authLoading && !session) {
      router.replace("/(auth)/login");
    }
  }, [fontsLoaded, authLoading, session]);

  if (!fontsLoaded || authLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#131313" } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="partida/[matchId]/index" />
        <Stack.Screen name="partida/[matchId]/juiz" />
        <Stack.Screen name="partida/novo" />
        <Stack.Screen name="grupo/elenco" />
        <Stack.Screen name="grupo/configuracoes" />
        <Stack.Screen name="grupo/convidar" />
        <Stack.Screen name="perfil/editar" />
        <Stack.Screen name="join/[code]" />
      </Stack>
    </>
  );
}
