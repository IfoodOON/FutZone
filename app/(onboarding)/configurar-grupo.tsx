import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { GroupForm, type GroupFormValues } from "@/components/GroupForm";

export default function ConfigurarGrupoScreen() {
  const createGroup = useAppStore((s) => s.createGroup);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave(values: GroupFormValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await createGroup(values);
      router.replace("/grupo/convidar");
    } catch (error) {
      console.error("createGroup failed:", error);
      Alert.alert("Erro", "Não foi possível criar o grupo. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container">
        <View className="flex-row items-center gap-sm flex-1">
          <MaterialIcons name="sports-soccer" size={20} color={colors.primary} />
          <Text className="font-headline-lg-mobile text-title-md text-primary" numberOfLines={1}>
            Configurar Novo Grupo
          </Text>
        </View>
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
          initialValues={{ name: "", location: "", weekdays: ["Domingo"], time: "20:00", maxPlayers: 14, monthlyFee: "" }}
          submitLabel="Salvar e Convidar Amigos"
          footerHint="Convide seus amigos logo após salvar."
          onSubmit={handleSave}
          submitting={submitting}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
