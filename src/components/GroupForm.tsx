import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { colors } from "@/theme/colors";
import { WEEKDAY_NAMES } from "@/utils/date";

export type GroupFormValues = {
  name: string;
  location: string;
  weekdays: string[];
  time: string;
  maxPlayers: number;
  monthlyFee: string;
};

export function GroupForm({
  initialValues,
  submitLabel,
  onSubmit,
  footerHint,
  submitting = false,
}: {
  initialValues: GroupFormValues;
  submitLabel: string;
  onSubmit: (values: GroupFormValues) => void;
  footerHint?: string;
  submitting?: boolean;
}) {
  const [name, setName] = useState(initialValues.name);
  const [location, setLocation] = useState(initialValues.location);
  const [weekdays, setWeekdays] = useState<string[]>(initialValues.weekdays);
  const [time, setTime] = useState(initialValues.time);
  const [maxPlayers, setMaxPlayers] = useState(initialValues.maxPlayers);
  const [price, setPrice] = useState(initialValues.monthlyFee);

  function toggleWeekday(day: string) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  return (
    <View style={{ gap: 12 }}>
      <View className="bg-surface-container p-lg rounded-xl gap-md border-l-4 border-primary">
        <Text className="font-label-sm text-label-sm text-on-surface-variant mb-xs">NOME DO GRUPO</Text>
        <TextInput
          className="w-full bg-surface-container-high border-b-2 border-outline-variant py-3 font-title-md text-title-md text-on-surface"
          placeholder="Ex: Amigos da Bola"
          placeholderTextColor={colors.outline}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View className="bg-surface-container p-lg rounded-xl gap-md border-l-4 border-outline">
        <Text className="font-label-sm text-label-sm text-on-surface-variant mb-xs">LOCAL / ARENA</Text>
        <View className="flex-row items-center gap-xs">
          <MaterialIcons name="location-on" size={20} color={colors.primary} />
          <TextInput
            className="flex-1 bg-surface-container-high border-b-2 border-outline-variant py-3 font-title-md text-title-md text-on-surface"
            placeholder="Buscar arena ou endereço..."
            placeholderTextColor={colors.outline}
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </View>

      <View className="bg-surface-container p-lg rounded-xl gap-md">
        <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Dias Fixos</Text>
        <Text className="font-label-sm text-[10px] text-on-surface-variant mb-xs">
          Toque para marcar um ou mais dias
        </Text>
        <View className="flex-row flex-wrap gap-xs">
          {WEEKDAY_NAMES.map((day) => {
            const selected = weekdays.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleWeekday(day)}
                className={`px-sm py-1 rounded-full ${selected ? "bg-primary-container" : "bg-surface-container-high"}`}
              >
                <Text
                  className={`font-label-sm text-[11px] ${selected ? "text-on-primary-container" : "text-on-surface-variant"}`}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="bg-surface-container p-lg rounded-xl gap-md">
        <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Horário</Text>
        <TextInput
          className="w-full bg-transparent border-b-2 border-outline-variant py-2 font-title-md text-title-md text-on-surface"
          placeholder="20:00"
          placeholderTextColor={colors.outline}
          value={time}
          onChangeText={setTime}
        />
      </View>

      <View className="bg-surface-container p-lg rounded-xl gap-md">
        <View className="flex-row justify-between items-center mb-xs">
          <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Limite de Jogadores</Text>
          <Text className="font-stat-value text-stat-value text-primary">{maxPlayers}</Text>
        </View>
        <Slider
          minimumValue={6}
          maximumValue={30}
          step={2}
          value={maxPlayers}
          onValueChange={setMaxPlayers}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.surfaceContainerHigh}
          thumbTintColor={colors.primary}
        />
        <View className="flex-row justify-between">
          <Text className="text-[10px] text-outline font-label-sm">6 JOG.</Text>
          <Text className="text-[10px] text-outline font-label-sm">30 JOG.</Text>
        </View>
      </View>

      <View className="bg-surface-container p-lg rounded-xl gap-md">
        <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Valor da Mensalidade</Text>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-on-surface-variant font-title-md">R$</Text>
          <TextInput
            className="flex-1 bg-transparent border-b-2 border-outline-variant py-2 font-title-md text-title-md text-on-surface"
            placeholder="20,00"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>
      </View>

      {footerHint && (
        <View className="rounded-xl overflow-hidden bg-surface-container-high p-lg items-center">
          <MaterialIcons name="stadium" size={32} color={colors.onSurfaceVariant} />
          <Text className="font-body-md text-on-surface-variant text-sm text-center mt-sm">{footerHint}</Text>
        </View>
      )}

      <Pressable
        onPress={() =>
          !submitting &&
          onSubmit({
            name: name || "Meu Grupo",
            location: location || "A definir",
            weekdays,
            time,
            maxPlayers,
            monthlyFee: price,
          })
        }
        disabled={submitting}
        className={`w-full h-14 rounded-full flex-row items-center justify-center gap-2 mt-2 ${
          submitting ? "bg-surface-container-high" : "bg-primary-container active:opacity-80"
        }`}
      >
        <Text className="font-title-md text-title-md text-on-primary-container">
          {submitting ? "Salvando..." : submitLabel}
        </Text>
        {!submitting && <MaterialIcons name="check" size={18} color={colors.onPrimaryContainer} />}
      </Pressable>
    </View>
  );
}
