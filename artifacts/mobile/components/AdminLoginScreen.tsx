import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export function AdminLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleLogin() {
    if (!password.trim()) {
      setError("يرجى إدخال كلمة المرور");
      return;
    }
    setIsLoading(true);
    setError("");
    const success = await login(password.trim());
    setIsLoading(false);
    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (newAttempts >= 3) {
        setError("كلمة المرور غير صحيحة. تلميح: الكلمة الافتراضية هي sawtna2024");
      } else {
        setError("كلمة المرور غير صحيحة");
      }
      setPassword("");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            backgroundColor: "#000",
            borderBottomColor: colors.gold,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.gold }]}>
          لوحة الإدارة
        </Text>
        <View
          style={[
            styles.lockBadge,
            {
              backgroundColor: colors.gold + "22",
              borderColor: colors.gold,
            },
          ]}
        >
          <Feather name="lock" size={12} color={colors.gold} />
          <Text style={[styles.lockBadgeText, { color: colors.gold }]}>
            محمية
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.card,
                borderColor: colors.gold,
              },
            ]}
          >
            <Feather name="shield" size={40} color={colors.gold} />
          </View>
          <View
            style={[
              styles.iconRing,
              { borderColor: colors.gold + "33" },
            ]}
          />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          تسجيل دخول المحرر
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          هذا القسم مخصص لفريق التحرير فقط
        </Text>

        <View
          style={[
            styles.formBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
            كلمة المرور
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.input,
                borderColor: error ? colors.destructive : colors.border,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="أدخل كلمة المرور..."
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError("");
              }}
              secureTextEntry={!showPassword}
              textAlign="right"
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </View>

          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: colors.destructive + "18",
                  borderColor: colors.destructive + "44",
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.loginBtn,
              {
                backgroundColor: password.trim()
                  ? colors.primary
                  : colors.muted,
                borderRadius: colors.radius - 4,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={isLoading || !password.trim()}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Feather
                  name="log-in"
                  size={18}
                  color={password.trim() ? "#000" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.loginBtnText,
                    {
                      color: password.trim()
                        ? "#000"
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  دخول
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            القراء يمكنهم مشاهدة التقارير دون تسجيل دخول
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  iconWrap: {
    position: "relative",
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: -12,
  },
  formBox: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  eyeBtn: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    width: "100%",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
});
