import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type TabItem = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export const TABS: TabItem[] = [
  { label: "Início", icon: "dashboard" },
  { label: "Partida", icon: "scoreboard" },
  { label: "Gols", icon: "leaderboard" },
  { label: "Presença", icon: "event-available" },
  { label: "Perfil", icon: "person" },
];

export function BottomNav({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View className="flex-row justify-around items-center px-4 py-2 bg-surface-container rounded-t-xl">
      {TABS.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={tab.label}
            onPress={() => onSelect(index)}
            className={`flex-col items-center justify-center px-4 py-1 rounded-full ${
              active ? "bg-primary-container" : ""
            }`}
          >
            <MaterialIcons name={tab.icon} size={22} color={active ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
            <Text
              className={`font-label-sm text-[11px] mt-0.5 ${
                active ? "text-on-primary-container" : "text-on-surface-variant"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
