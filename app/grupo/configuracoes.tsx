import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { GroupForm, type GroupFormValues } from "@/components/GroupForm";

export default function ConfiguracoesGrupoScreen() {
  const isAdmin = useRequireAdmin();
  const group = useAppStore((s) => s.group);
  const updateGroup = useAppStore((s) => s.updateGroup);
  const ensureUpcomingSedeMatches = useAppStore((s) => s.ensureUpcomingSedeMatches);
  const [submitting, setSubmitting] = useState(false);

  if (!isAdmin || !group) return null;

  async function handleSave(values: GroupFormValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateGroup(values);
      await ensureUpcomingSedeMatches();
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container">
        <Text className="font-title-md text-title-md text-on-surface">Configurações do Grupo</Text>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full">
          <MaterialIcons name="close" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <GroupForm
          initialValues={{
            name: group.name,
            location: group.location,
            weekdays: group.weekdays,
            time: group.time,
            maxPlayers: group.maxPlayers,
            monthlyFee: group.monthlyFee,
          }}
          submitLabel="Salvar Alterações"
          onSubmit={handleSave}
          submitting={submitting}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
