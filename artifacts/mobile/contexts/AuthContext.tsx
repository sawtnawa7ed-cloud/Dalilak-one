import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState } from "react";

const AUTH_KEY = "sawtna_admin_password_v1";
const DEFAULT_PASSWORD = "sawtna2024";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  async function login(password: string): Promise<boolean> {
    try {
      const stored = (await AsyncStorage.getItem(AUTH_KEY)) ?? DEFAULT_PASSWORD;
      if (password === stored) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return password === DEFAULT_PASSWORD;
    }
  }

  function logout() {
    setIsAuthenticated(false);
  }

  async function changePassword(
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    if (newPass.length < 6) {
      return { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
    }
    try {
      const stored = (await AsyncStorage.getItem(AUTH_KEY)) ?? DEFAULT_PASSWORD;
      if (oldPass !== stored) {
        return { success: false, error: "كلمة المرور الحالية غير صحيحة" };
      }
      await AsyncStorage.setItem(AUTH_KEY, newPass);
      return { success: true };
    } catch {
      return { success: false, error: "حدث خطأ، حاول مجدداً" };
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
