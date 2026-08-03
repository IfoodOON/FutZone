import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export default function ElencoScreen() {
  const isAdmin = useRequireAdmin();
  const players = useAppStore((s) => s.players);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const updatePlayer = useAppStore((s) => s.updatePlayer);
  const removePlayer = useAppStore((s) => s.removePlayer);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");

  if (!isAdmin) return null;

  function startEdit(id: string, name: string, position?: string) {
    setEditingId(id);
    setEditName(name);
    setEditPosition(position ?? "");
  }

  function saveEdit() {
    if (!editingId) return;
    updatePlayer(editingId, { name: editName, position: editPosition });
    setEditingId(null);
  }

  function confirmRemove(id: string, name: string) {
    Alert.alert("Remover jogador", `Remover ${name} do grupo?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => removePlayer(id) },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container">
        <Text className="font-title-md text-title-md text-on-surface">Gestão de Elenco</Text>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full">
          <MaterialIcons name="close" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-surface-container p-lg rounded-xl gap-md">
          <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Adicionar Jogador</Text>
          <View className="flex-row gap-sm">
            <TextInput
              className="flex-1 bg-surface-container-high border-b-2 border-outline-variant py-2 px-2 font-body-md text-on-surface"
              placeholder="Nome do jogador"
              placeholderTextColor={colors.outline}
              value={newName}
              onChangeText={setNewName}
            />
            <Pressable
              onPress={() => {
                if (!newName.trim()) return;
                addPlayer(newName.trim());
                setNewName("");
              }}
              className="w-12 h-12 bg-primary-container rounded-full items-center justify-center"
            >
              <MaterialIcons name="add" size={22} color={colors.onPrimaryContainer} />
            </Pressable>
          </View>
        </View>

        <View className="gap-2">
          {players.map((player) => (
            <View key={player.id} className="bg-surface-container-low rounded-xl p-4 gap-2">
              {editingId === player.id ? (
                <View className="gap-2">
                  <TextInput
                    className="bg-surface-container-high border-b-2 border-outline-variant py-2 px-2 font-body-md text-on-surface"
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Nome"
                    placeholderTextColor={colors.outline}
                  />
                  <TextInput
                    className="bg-surface-container-high border-b-2 border-outline-variant py-2 px-2 font-body-md text-on-surface"
                    value={editPosition}
                    onChangeText={setEditPosition}
                    placeholder="Posição"
                    placeholderTextColor={colors.outline}
                  />
                  <View className="flex-row gap-sm">
                    <Pressable onPress={saveEdit} className="flex-1 bg-primary-container py-2 rounded-full items-center">
                      <Text className="font-label-sm text-on-primary-container">Salvar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setEditingId(null)}
                      className="flex-1 bg-surface-container-high py-2 rounded-full items-center"
                    >
                      <Text className="font-label-sm text-on-surface-variant">Cancelar</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-center gap-3">
                  <PlayerAvatar uri={player.avatarUrl} size={40} />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-title-md text-title-md text-on-surface">{player.name}</Text>
                      {player.role === "admin" && (
                        <View className="bg-primary-container px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-bold text-on-primary-container">ADM</Text>
                        </View>
                      )}
                    </View>
                    {player.position && (
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">{player.position}</Text>
                    )}
                  </View>
                  <Pressable onPress={() => startEdit(player.id, player.name, player.position)} className="p-2">
                    <MaterialIcons name="edit" size={18} color={colors.onSurfaceVariant} />
                  </Pressable>
                  {player.id !== currentUserId && (
                    <Pressable onPress={() => confirmRemove(player.id, player.name)} className="p-2">
                      <MaterialIcons name="delete" size={18} color={colors.error} />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
