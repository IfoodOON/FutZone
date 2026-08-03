import { View, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

export function PlayerAvatar({ uri, size = 40 }: { uri?: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-surface-container-highest items-center justify-center overflow-hidden"
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <MaterialIcons name="person" size={Math.round(size * 0.55)} color={colors.onSurfaceVariant} />
      )}
    </View>
  );
}
