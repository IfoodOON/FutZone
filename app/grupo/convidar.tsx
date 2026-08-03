import { View, Text, Pressable, Share } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function ConvidarScreen() {
  const isAdmin = useRequireAdmin();
  const group = useAppStore((s) => s.group);

  if (!isAdmin || !group) return null;

  const inviteLink = Linking.createURL(`join/${group.inviteCode}`);

  async function handleShare() {
    if (!group) return;
    try {
      await Share.share({
        message: `Entra no grupo "${group.name}" no FutZone! Código: ${group.inviteCode}\n${inviteLink}`,
      });
    } catch {
      // usuário cancelou o compartilhamento — nada a fazer
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container">
        <Text className="font-title-md text-title-md text-on-surface">Convidar Jogadores</Text>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <MaterialIcons name="close" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-margin-mobile gap-xl">
        <View className="w-24 h-24 rounded-full bg-primary-container items-center justify-center">
          <MaterialIcons name="group-add" size={40} color={colors.onPrimaryContainer} />
        </View>

        <View className="items-center gap-xs">
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface text-center">
            {group.name}
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant text-center max-w-[280px]">
            Compartilhe o código ou o link abaixo. Quem já tem o FutZone instalado entra direto no grupo.
          </Text>
        </View>

        <View className="bg-surface-container-low rounded-xl px-lg py-md items-center w-full max-w-xs">
          <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Código do Grupo</Text>
          <Text className="font-stat-value text-headline-lg text-primary tracking-widest mt-1">
            {group.inviteCode}
          </Text>
        </View>

        <Pressable
          onPress={handleShare}
          className="w-full max-w-xs bg-primary-container py-4 rounded-full flex-row items-center justify-center gap-2 active:opacity-80"
        >
          <MaterialIcons name="share" size={20} color={colors.onPrimaryContainer} />
          <Text className="font-title-md text-title-md text-on-primary-container">Compartilhar Convite</Text>
        </Pressable>
      </View>
    </View>
  );
}
