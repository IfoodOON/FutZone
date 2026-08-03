import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";

const LAST_EMAIL_KEY = "futzone:last-login-email";

export default function LoginScreen() {
  const signIn = useAppStore((s) => s.signIn);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LAST_EMAIL_KEY).then((saved) => {
      if (saved) setLogin(saved);
    });
  }, []);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const trimmedLogin = login.trim();
    const { error } = await signIn(trimmedLogin, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    AsyncStorage.setItem(LAST_EMAIL_KEY, trimmedLogin).catch(() => {});
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-margin-mobile py-xl">
          <View className="items-center mb-xl">
            <View className="w-20 h-20 bg-surface-container rounded-full items-center justify-center mb-md border border-outline-variant/30">
              <MaterialIcons name="sports-soccer" size={48} color={colors.primary} />
            </View>
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Fut<Text className="text-primary">Zone</Text>
            </Text>
            <Text className="font-body-md text-body-md text-on-surface-variant mt-xs">
              A gestão do seu grupo em outro nível.
            </Text>
          </View>

          <View className="w-full max-w-sm">
            <View className="space-y-lg">
              <View>
                <Text className="font-label-sm text-label-sm text-on-surface-variant ml-xs mb-xs">
                  E-MAIL OU TELEFONE
                </Text>
                <View className="flex-row items-center bg-surface-container-low border-b-2 border-outline-variant">
                  <MaterialIcons name="person" size={20} color={colors.onSurfaceVariant} style={{ marginLeft: 16 }} />
                  <TextInput
                    className="flex-1 py-4 pl-3 pr-4 text-on-surface font-body-md text-body-md"
                    placeholder="seuemail@exemplo.com"
                    placeholderTextColor="rgba(229,226,225,0.35)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={login}
                    onChangeText={setLogin}
                  />
                </View>
              </View>

              <View>
                <Text className="font-label-sm text-label-sm text-on-surface-variant ml-xs mb-xs">
                  SENHA
                </Text>
                <View className="flex-row items-center bg-surface-container-low border-b-2 border-outline-variant">
                  <MaterialIcons name="lock" size={20} color={colors.onSurfaceVariant} style={{ marginLeft: 16 }} />
                  <TextInput
                    className="flex-1 py-4 pl-3 pr-4 text-on-surface font-body-md text-body-md"
                    placeholder="••••••••"
                    placeholderTextColor="rgba(229,226,225,0.35)"
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

              <Pressable className="items-end">
                <Text className="font-label-sm text-label-sm text-primary/80">Esqueci minha senha</Text>
              </Pressable>

              {error && (
                <Text className="font-label-sm text-label-sm text-error text-center">{error}</Text>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                className={`w-full py-4 rounded-full flex-row items-center justify-center gap-sm ${
                  submitting ? "bg-surface-container-high" : "bg-primary-container active:opacity-80"
                }`}
              >
                <Text className="font-title-md text-title-md text-on-primary-container">
                  {submitting ? "Entrando..." : "Entrar"}
                </Text>
                {!submitting && <MaterialIcons name="login" size={20} color={colors.onPrimaryContainer} />}
              </Pressable>
            </View>

            <View className="flex-row items-center my-xl gap-md">
              <View className="flex-1 h-[1px] bg-outline-variant/30" />
              <Text className="font-label-sm text-label-sm text-on-surface-variant/50 uppercase tracking-widest">
                ou
              </Text>
              <View className="flex-1 h-[1px] bg-outline-variant/30" />
            </View>

            <Pressable className="w-full bg-surface-container-high border border-outline-variant/20 py-4 rounded-full flex-row items-center justify-center gap-md active:opacity-80">
              <Text className="font-body-md text-body-md text-on-surface">Entrar com Google</Text>
            </Pressable>
          </View>

          <View className="mt-xl items-center">
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Ainda não tem conta?{" "}
              <Link href="/(auth)/cadastro" className="text-primary font-title-md">
                Cadastre-se
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
