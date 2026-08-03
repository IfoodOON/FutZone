import { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { AssistZone, FinishType, PassType, Player, ShotZone } from "@/store/types";

const SHOT_ZONES: { value: ShotZone; label: string }[] = [
  { value: "meio_campo", label: "Meio de campo" },
  { value: "dentro_area", label: "Dentro da área" },
  { value: "grande_area", label: "Grande área" },
];

const FINISH_TYPES: { value: FinishType; label: string }[] = [
  { value: "perna_direita", label: "Perna direita" },
  { value: "perna_esquerda", label: "Perna esquerda" },
  { value: "cabeca", label: "Cabeça" },
  { value: "bicicleta", label: "Bicicleta" },
];

const ASSIST_ZONES: { value: AssistZone; label: string }[] = [
  { value: "escanteio", label: "Escanteio" },
  { value: "lateral", label: "Lateral" },
  { value: "linha_fundo", label: "Linha de fundo" },
];

const PASS_TYPES: { value: PassType; label: string }[] = [
  { value: "cruzamento_area", label: "Cruzamento na área" },
  { value: "passe_rasteiro", label: "Passe rasteiro" },
  { value: "lancamento", label: "Lançamento" },
];

export type GoalSubmitPayload = {
  scorerId: string;
  shotZone: ShotZone;
  finishType: FinishType;
  assistPlayerId?: string;
  assistZone?: AssistZone;
  passType?: PassType;
};

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-sm">
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className={`px-md py-2 rounded-full border ${
            value === opt.value ? "bg-primary-container border-primary-container" : "bg-surface-container-high border-outline-variant"
          }`}
        >
          <Text
            className={`font-label-sm text-label-sm ${value === opt.value ? "text-on-primary-container" : "text-on-surface-variant"}`}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function GoalModal({
  visible,
  players,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  players: Player[];
  onClose: () => void;
  onSubmit: (payload: GoalSubmitPayload) => void;
}) {
  const [scorerId, setScorerId] = useState<string | null>(null);
  const [shotZone, setShotZone] = useState<ShotZone | null>(null);
  const [finishType, setFinishType] = useState<FinishType | null>(null);
  const [hasAssist, setHasAssist] = useState<boolean | null>(null);
  const [assistPlayerId, setAssistPlayerId] = useState<string | null>(null);
  const [assistZone, setAssistZone] = useState<AssistZone | null>(null);
  const [passType, setPassType] = useState<PassType | null>(null);

  function reset() {
    setScorerId(null);
    setShotZone(null);
    setFinishType(null);
    setHasAssist(null);
    setAssistPlayerId(null);
    setAssistZone(null);
    setPassType(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    if (!scorerId || !shotZone || !finishType) return;
    if (hasAssist && (!assistPlayerId || !assistZone || !passType)) return;

    onSubmit({
      scorerId,
      shotZone,
      finishType,
      ...(hasAssist
        ? { assistPlayerId: assistPlayerId!, assistZone: assistZone!, passType: passType! }
        : {}),
    });
    reset();
  }

  const canConfirm =
    !!scorerId && !!shotZone && !!finishType && (hasAssist === false || (!!assistPlayerId && !!assistZone && !!passType));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-background/95 justify-end">
        <View className="bg-surface-container-low rounded-t-2xl max-h-[85%]">
          <View className="flex-row items-center justify-between px-margin-mobile h-16 border-b border-outline-variant/20">
            <Text className="font-title-md text-title-md text-on-surface">Registrar Gol</Text>
            <Pressable onPress={handleClose} className="p-2">
              <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
            <View className="gap-3">
              <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Quem marcou?</Text>
              <View className="gap-2">
                {players.map((player) => (
                  <Pressable
                    key={player.id}
                    onPress={() => setScorerId(player.id)}
                    className={`flex-row items-center gap-3 p-3 rounded-xl ${
                      scorerId === player.id ? "bg-primary/20 border border-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <PlayerAvatar uri={player.avatarUrl} size={32} />
                    <Text className="flex-1 font-body-md text-body-md text-on-surface">{player.name}</Text>
                    {scorerId === player.id && <MaterialIcons name="check-circle" size={18} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            </View>

            {scorerId && (
              <View className="gap-3">
                <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Zona do Chute</Text>
                <ChipGroup options={SHOT_ZONES} value={shotZone} onChange={setShotZone} />
              </View>
            )}

            {scorerId && shotZone && (
              <View className="gap-3">
                <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Tipo de Finalização</Text>
                <ChipGroup options={FINISH_TYPES} value={finishType} onChange={setFinishType} />
              </View>
            )}

            {scorerId && shotZone && finishType && (
              <View className="gap-3">
                <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Teve assistência?</Text>
                <View className="flex-row gap-sm">
                  <Pressable
                    onPress={() => setHasAssist(true)}
                    className={`flex-1 py-2 items-center rounded-full border ${
                      hasAssist === true ? "bg-primary-container border-primary-container" : "bg-surface-container-high border-outline-variant"
                    }`}
                  >
                    <Text className={`font-label-sm ${hasAssist === true ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                      Sim
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setHasAssist(false);
                      setAssistPlayerId(null);
                      setAssistZone(null);
                      setPassType(null);
                    }}
                    className={`flex-1 py-2 items-center rounded-full border ${
                      hasAssist === false ? "bg-primary-container border-primary-container" : "bg-surface-container-high border-outline-variant"
                    }`}
                  >
                    <Text className={`font-label-sm ${hasAssist === false ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                      Não
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {hasAssist && (
              <View className="gap-3">
                <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Quem deu a assistência?</Text>
                <View className="gap-2">
                  {players
                    .filter((p) => p.id !== scorerId)
                    .map((player) => (
                      <Pressable
                        key={player.id}
                        onPress={() => setAssistPlayerId(player.id)}
                        className={`flex-row items-center gap-3 p-3 rounded-xl ${
                          assistPlayerId === player.id ? "bg-primary/20 border border-primary" : "bg-surface-container-high"
                        }`}
                      >
                        <PlayerAvatar uri={player.avatarUrl} size={32} />
                        <Text className="flex-1 font-body-md text-body-md text-on-surface">{player.name}</Text>
                        {assistPlayerId === player.id && (
                          <MaterialIcons name="check-circle" size={18} color={colors.primary} />
                        )}
                      </Pressable>
                    ))}
                </View>
              </View>
            )}

            {hasAssist && assistPlayerId && (
              <View className="gap-3">
                <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Zona da Assistência</Text>
                <ChipGroup options={ASSIST_ZONES} value={assistZone} onChange={setAssistZone} />
              </View>
            )}

            {hasAssist && assistPlayerId && assistZone && (
              <View className="gap-3">
                <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Tipo de Passe</Text>
                <ChipGroup options={PASS_TYPES} value={passType} onChange={setPassType} />
              </View>
            )}

            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              className={`py-4 rounded-full items-center mt-2 ${canConfirm ? "bg-primary-container" : "bg-surface-container-high"}`}
            >
              <Text
                className={`font-title-md text-title-md ${canConfirm ? "text-on-primary-container" : "text-on-surface-variant"}`}
              >
                Confirmar Gol
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
