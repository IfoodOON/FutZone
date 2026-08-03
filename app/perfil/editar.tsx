import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { POSITIONS } from "@/utils/positions";

export default function EditarPerfilScreen() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const players = useAppStore((s) => s.players);
  const updatePlayer = useAppStore((s) => s.updatePlayer);
  const uploadAvatar = useAppStore((s) => s.uploadAvatar);

  const me = players.find((p) => p.id === currentUserId);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState(me?.name ?? "");
  const [position, setPosition] = useState<string | null>(me?.position ?? null);
  const [secondaryPositions, setSecondaryPositions] = useState<string[]>(me?.secondaryPositions ?? []);
  const [submitting, setSubmitting] = useState(false);

  if (!me) return null;

  async function handlePickPhoto() {
    Alert.alert("Foto de perfil", "Como você quer definir a foto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Câmera",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) return;
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      {
        text: "Galeria",
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
    ]);
  }

  function toggleSecondary(value: string) {
    setSecondaryPositions((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  }

  async function handleSave() {
    if (submitting) return;
    setSubmitting(true);
    try {
      let avatarUrl = me!.avatarUrl;
      if (photoUri) {
        const uploaded = await uploadAvatar(photoUri);
        if (uploaded) avatarUrl = uploaded;
      }
      await updatePlayer(currentUserId, {
        name: name.trim() || me!.name,
        position: position ?? undefined,
        secondaryPositions,
        avatarUrl,
      });
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container">
        <Text className="font-title-md text-title-md text-on-surface">Editar Perfil</Text>
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
        <View className="items-center gap-2">
          <Pressable onPress={handlePickPhoto}>
            <PlayerAvatar uri={photoUri ?? me.avatarUrl} size={112} />
            <View className="absolute bottom-0 right-0 bg-primary-container w-9 h-9 rounded-full items-center justify-center border-4 border-background">
              <MaterialIcons name="edit" size={16} color={colors.onPrimaryContainer} />
            </View>
          </Pressable>
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Toque para trocar a foto</Text>
        </View>

        <View className="bg-surface-container p-lg rounded-xl gap-md">
          <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Apelido</Text>
          <TextInput
            className="w-full bg-surface-container-high border-b-2 border-outline-variant py-3 font-title-md text-title-md text-on-surface"
            placeholderTextColor={colors.outline}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="bg-surface-container p-lg rounded-xl gap-md">
          <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Posição Principal</Text>
          <View className="flex-row flex-wrap gap-sm">
            {POSITIONS.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPosition(p.value)}
                className={`px-md py-sm rounded-full border ${
                  position === p.value
                    ? "bg-primary-container border-primary-container"
                    : "bg-surface-container-high border-outline-variant"
                }`}
              >
                <Text
                  className={`font-label-sm text-label-sm ${
                    position === p.value ? "text-on-primary-container" : "text-on-surface-variant"
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="bg-surface-container p-lg rounded-xl gap-md">
          <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Posições Secundárias</Text>
          <Text className="font-label-sm text-[10px] text-on-surface-variant">
            Outras posições em que você também costuma jogar
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {POSITIONS.filter((p) => p.value !== position).map((p) => {
              const selected = secondaryPositions.includes(p.value);
              return (
                <Pressable
                  key={p.value}
                  onPress={() => toggleSecondary(p.value)}
                  className={`px-md py-sm rounded-full border ${
                    selected ? "bg-secondary-container border-secondary-container" : "bg-surface-container-high border-outline-variant"
                  }`}
                >
                  <Text
                    className={`font-label-sm text-label-sm ${
                      selected ? "text-on-secondary-container" : "text-on-surface-variant"
                    }`}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
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
            {submitting ? "Salvando..." : "Salvar Alterações"}
          </Text>
          {!submitting && <MaterialIcons name="check" size={18} color={colors.onPrimaryContainer} />}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
