import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { formatDateInputBR, parseDateInputBR } from "@/utils/date";
import type { MatchKind } from "@/store/types";

export default function NovoJogoScreen() {
  const isAdmin = useRequireAdmin();
  const group = useAppStore((s) => s.group);
  const addMatch = useAppStore((s) => s.addMatch);

  const [kind, setKind] = useState<MatchKind>("amistoso");
  const [opponent, setOpponent] = useState("");
  const [address, setAddress] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [time, setTime] = useState(group?.time ?? "20:00");
  const [submitting, setSubmitting] = useState(false);

  if (!isAdmin || !group) return null;

  async function handleSave() {
    const isoDate = parseDateInputBR(dateInput);
    if (!isoDate || submitting || !group) return;
    setSubmitting(true);
    try {
      const scheduledAt = `${isoDate}T${time}:00`;
      const trimmedOpponent = opponent.trim();
      const id = await addMatch({
        kind,
        teamA: group.name,
        teamB: kind === "amistoso" ? trimmedOpponent || "Adversário" : trimmedOpponent || group.name,
        opponent: trimmedOpponent || undefined,
        location: kind === "sede" ? group.location : address || "A definir",
        address: kind === "sede" ? group.location : address,
        scheduledAt,
        status: "agendada",
      });
      router.replace(`/partida/${id}`);
    } catch {
      Alert.alert("Erro", "Não foi possível criar a partida.");
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container">
        <Text className="font-title-md text-title-md text-on-surface">Novo Jogo</Text>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full">
          <MaterialIcons name="close" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setKind("sede")}
            className={`flex-1 p-4 rounded-xl border-2 ${
              kind === "sede" ? "border-primary bg-primary/10" : "border-outline-variant bg-surface-container"
            }`}
          >
            <MaterialIcons name="stadium" size={24} color={kind === "sede" ? colors.primary : colors.onSurfaceVariant} />
            <Text className="font-title-md text-title-md text-on-surface mt-2">Jogo na Sede</Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">Quadra fixa do grupo</Text>
          </Pressable>
          <Pressable
            onPress={() => setKind("amistoso")}
            className={`flex-1 p-4 rounded-xl border-2 ${
              kind === "amistoso" ? "border-primary bg-primary/10" : "border-outline-variant bg-surface-container"
            }`}
          >
            <MaterialIcons name="flight-takeoff" size={24} color={kind === "amistoso" ? colors.primary : colors.onSurfaceVariant} />
            <Text className="font-title-md text-title-md text-on-surface mt-2">Amistoso / Fora</Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">Jogo avulso, outra quadra</Text>
          </Pressable>
        </View>

        {kind === "amistoso" && (
          <>
            <View className="bg-surface-container p-lg rounded-xl gap-md">
              <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Adversário</Text>
              <TextInput
                className="w-full bg-surface-container-high border-b-2 border-outline-variant py-3 font-title-md text-title-md text-on-surface"
                placeholder="Ex: Falcões FC"
                placeholderTextColor={colors.outline}
                value={opponent}
                onChangeText={setOpponent}
              />
            </View>
            <View className="bg-surface-container p-lg rounded-xl gap-md">
              <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Endereço da Quadra</Text>
              <TextInput
                className="w-full bg-surface-container-high border-b-2 border-outline-variant py-3 font-title-md text-title-md text-on-surface"
                placeholder="Endereço completo"
                placeholderTextColor={colors.outline}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </>
        )}

        {kind === "sede" && (
          <>
            <View className="bg-surface-container p-lg rounded-xl gap-md">
              <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Adversário (opcional)
              </Text>
              <TextInput
                className="w-full bg-surface-container-high border-b-2 border-outline-variant py-3 font-title-md text-title-md text-on-surface"
                placeholder="Deixe em branco para racha interno"
                placeholderTextColor={colors.outline}
                value={opponent}
                onChangeText={setOpponent}
              />
            </View>
            <View className="bg-surface-container p-lg rounded-xl gap-md border-l-4 border-primary">
              <MaterialIcons name="info-outline" size={18} color={colors.onSurfaceVariant} />
              <Text className="font-body-md text-body-md text-on-surface-variant">
                Local: {group.location}. Só escolha a data — o local e horário padrão vêm da configuração do grupo.
              </Text>
            </View>
          </>
        )}

        <View className="flex-row gap-gutter">
          <View className="bg-surface-container p-lg rounded-xl gap-md flex-1">
            <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Data</Text>
            <TextInput
              className="w-full bg-transparent border-b-2 border-outline-variant py-2 font-title-md text-title-md text-on-surface"
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
              maxLength={10}
              value={dateInput}
              onChangeText={(text) => setDateInput(formatDateInputBR(text))}
            />
          </View>
          <View className="bg-surface-container p-lg rounded-xl gap-md flex-1">
            <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Horário</Text>
            <TextInput
              className="w-full bg-transparent border-b-2 border-outline-variant py-2 font-title-md text-title-md text-on-surface"
              placeholder="20:00"
              placeholderTextColor={colors.outline}
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={submitting}
          className={`w-full h-14 rounded-full flex-row items-center justify-center gap-2 mt-2 ${
            submitting ? "bg-surface-container-high" : "bg-primary-container active:opacity-80"
          }`}
        >
          <Text className="font-title-md text-title-md text-on-primary-container">
            {submitting ? "Criando..." : "Criar Jogo"}
          </Text>
          {!submitting && <MaterialIcons name="check" size={18} color={colors.onPrimaryContainer} />}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
