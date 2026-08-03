import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";

export default function BemVindoScreen() {
  const joinGroupByCode = useAppStore((s) => s.joinGroupByCode);
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (codeParam) setCode(codeParam);
  }, [codeParam]);

  async function handleJoin() {
    if (code.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error } = await joinGroupByCode(code);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="px-margin-mobile pt-xl pb-lg items-center">
        <View className="w-20 h-20 bg-surface-container-high rounded-full items-center justify-center mb-md border-2 border-primary/20">
          <MaterialIcons name="sports-soccer" size={40} color={colors.primary} />
        </View>
        <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-background text-center">
          Bem-vindo ao Campo!
        </Text>
        <Text className="font-body-md text-body-md text-on-surface-variant text-center mt-xs max-w-[280px]">
          Organize suas partidas, convoque o time e domine o placar do FutZone.
        </Text>
      </View>

      <View className="px-margin-mobile flex-1 justify-center gap-xl max-w-md w-full mx-auto">
        <View className="bg-surface-container-low rounded-xl p-lg gap-md border-l-4 border-l-outline">
          <View className="flex-row items-center gap-md">
            <View className="w-12 h-12 bg-surface-container rounded-lg items-center justify-center">
              <MaterialIcons name="group-add" size={22} color={colors.onSurface} />
            </View>
            <Text className="font-title-md text-title-md text-on-surface flex-1">
              Entrar em um Grupo Existente
            </Text>
          </View>
          <View className="flex-row items-center bg-surface-container-low rounded-lg border-b-2 border-transparent">
            <TextInput
              className="flex-1 text-on-surface font-body-md py-md px-md"
              placeholder="Código ou Link do Grupo"
              placeholderTextColor="rgba(229,226,225,0.4)"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />
            <Pressable className="w-12 h-12 items-center justify-center" onPress={handleJoin} disabled={submitting}>
              <MaterialIcons name="arrow-forward" size={22} color={code.length > 0 ? colors.primary : colors.onSurfaceVariant} />
            </Pressable>
          </View>
          <Text className={`font-label-sm text-label-sm px-xs ${error ? "text-error" : "text-on-surface-variant"}`}>
            {error ?? (submitting ? "Entrando no grupo..." : "Peça o código ao administrador do seu grupo.")}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(onboarding)/configurar-grupo")}
          className="bg-surface-container-low rounded-xl p-lg items-center gap-md border-l-4 border-l-primary active:opacity-80"
        >
          <View className="w-20 h-20 bg-primary-container rounded-full items-center justify-center">
            <MaterialIcons name="add" size={40} color={colors.onPrimaryContainer} />
          </View>
          <View className="items-center gap-xs">
            <Text className="font-title-md text-title-md text-primary">Criar um Novo Grupo</Text>
            <Text className="font-body-md text-body-md text-on-surface-variant text-center">
              Seja o capitão e comece a organizar seus jogos hoje.
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="items-center py-lg gap-xs">
        <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-[3px]">
          Powered by FutZone
        </Text>
      </View>
    </ScrollView>
  );
}
