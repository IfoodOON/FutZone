import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { POSITIONS } from "@/utils/positions";

export default function CadastroScreen() {
  const signUp = useAppStore((s) => s.signUp);
  const uploadAvatar = useAppStore((s) => s.uploadAvatar);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Precisamos da câmera para tirar a foto do seu perfil.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const displayName = nickname.trim() || fullName.trim() || "Jogador";
    const { error, needsEmailConfirmation } = await signUp(
      email.trim(),
      password,
      displayName,
      position ?? undefined
    );
    if (error) {
      setSubmitting(false);
      setError(error);
      return;
    }
    if (needsEmailConfirmation) {
      setSubmitting(false);
      Alert.alert("Confirme seu e-mail", "Enviamos um link de confirmação para o seu e-mail. Confirme e depois faça login.");
      router.replace("/(auth)/login");
      return;
    }
    if (photoUri) {
      await uploadAvatar(photoUri);
    }
    setSubmitting(false);
    router.replace("/(onboarding)/bem-vindo");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16">
        <View className="flex-row items-center gap-sm">
          <MaterialIcons name="sports-soccer" size={22} color={colors.primary} />
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-primary">FutZone</Text>
        </View>
        <Pressable onPress={() => router.back()} className="p-2 rounded-full">
          <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View className="px-margin-mobile max-w-md w-full mx-auto">
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface text-center mb-xl mt-lg">
            Crie seu Perfil de Jogador
          </Text>

          <View className="items-center mb-lg">
            <Pressable
              onPress={handlePickPhoto}
              className="w-32 h-32 rounded-full items-center justify-center border-4 border-surface-container-high"
            >
              <PlayerAvatar uri={photoUri ?? undefined} size={124} />
              <View className="absolute bottom-0 right-0 bg-primary-container w-10 h-10 rounded-full items-center justify-center border-4 border-background">
                <MaterialIcons name={photoUri ? "edit" : "add"} size={20} color={colors.onPrimaryContainer} />
              </View>
            </Pressable>
            <Text className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
              {photoUri ? "Toque para trocar a foto" : "Toque para tirar sua foto"}
            </Text>
          </View>

          <View className="space-y-md">
            <View>
              <Text className="font-label-sm text-label-sm text-on-surface-variant mb-base ml-1">
                Nome Completo
              </Text>
              <TextInput
                className="w-full bg-surface-container-high border-b-2 border-outline-variant px-md py-lg text-on-surface font-body-md text-body-md rounded-t-lg"
                placeholder="Ex: Gabriel Jesus"
                placeholderTextColor={colors.onSurfaceVariant}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View>
              <Text className="font-label-sm text-label-sm text-on-surface-variant mb-base ml-1">
                Apelido no Grupo
              </Text>
              <TextInput
                className="w-full bg-surface-container-high border-b-2 border-outline-variant px-md py-lg text-on-surface font-body-md text-body-md rounded-t-lg"
                placeholder="Como te chamam no campo?"
                placeholderTextColor={colors.onSurfaceVariant}
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            <View>
              <Text className="font-label-sm text-label-sm text-on-surface-variant mb-base ml-1">
                Posição Preferida
              </Text>
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

            <View>
              <Text className="font-label-sm text-label-sm text-on-surface-variant mb-base ml-1">E-mail</Text>
              <TextInput
                className="w-full bg-surface-container-high border-b-2 border-outline-variant px-md py-lg text-on-surface font-body-md text-body-md rounded-t-lg"
                placeholder="seu@email.com"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="font-label-sm text-label-sm text-on-surface-variant mb-base ml-1">Senha</Text>
              <View className="flex-row items-center bg-surface-container-high border-b-2 border-outline-variant rounded-t-lg">
                <TextInput
                  className="flex-1 px-md py-lg text-on-surface font-body-md text-body-md"
                  placeholder="••••••••"
                  placeholderTextColor={colors.onSurfaceVariant}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} className="pr-4">
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
              </View>
            </View>

            {error && (
              <Text className="font-label-sm text-label-sm text-error text-center">{error}</Text>
            )}

            <View className="pt-xl">
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                className={`w-full py-lg rounded-full flex-row items-center justify-center gap-sm ${
                  submitting ? "bg-surface-container-high" : "bg-primary-container active:opacity-80"
                }`}
              >
                <Text className="font-headline-lg-mobile text-title-md text-on-primary-container">
                  {submitting ? "Criando conta..." : "Criar Conta e Jogar"}
                </Text>
                {!submitting && <MaterialIcons name="sports-score" size={20} color={colors.onPrimaryContainer} />}
              </Pressable>
            </View>

            <Pressable onPress={() => router.replace("/(auth)/login")} className="items-center pt-md">
              <Text className="font-label-sm text-label-sm text-on-surface-variant">
                Já tem conta? <Text className="text-primary font-bold">Faça login</Text>
              </Text>
            </Pressable>
          </View>

          <Text className="font-label-sm text-label-sm text-on-surface-variant opacity-70 text-center mt-xl px-lg">
            Ao criar sua conta, você concorda com nossos Termos de Uso e Política de Privacidade.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
