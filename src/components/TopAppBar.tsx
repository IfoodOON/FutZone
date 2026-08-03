import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Props = {
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightPress?: () => void;
};

export function TopAppBar({ rightIcon = "notifications", onRightPress }: Props) {
  return (
    <View className="flex-row justify-between items-center px-margin-mobile h-16 bg-background">
      <View className="flex-row items-center gap-2">
        <MaterialIcons name="sports-soccer" size={26} color={colors.primary} />
        <Text className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-primary">
          FutZone
        </Text>
      </View>
      <Pressable onPress={onRightPress}>
        <MaterialIcons name={rightIcon} size={22} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}
