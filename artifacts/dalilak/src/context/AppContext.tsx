import React, { createContext, useContext, useState, useEffect } from "react";

type Lang = "ar" | "en" | "fr";
type Screen = "splash" | "lang" | "who" | "disability" | "main";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "visitor" | "expert" | "admin";
  status: string;
}

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  userType: string | null;
  setUserType: (t: string | null) => void;
  disabilities: string[];
  toggleDisability: (d: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  authUser: AuthUser | null;
  authToken: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  filters: {
    governorateId?: number;
    cityId?: number;
    areaId?: number;
  };
  setFilters: (f: { governorateId?: number; cityId?: number; areaId?: number }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const [userType, setUserType] = useState<string | null>(null);
  const [disabilities, setDisabilities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("dalilak_favs") || "[]"); } catch { return []; }
  });
  const [screen, setScreen] = useState<Screen>("splash");
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("dalilak_user") || "null"); } catch { return null; }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("dalilak_token"));
  const [filters, setFilters] = useState<{ governorateId?: number; cityId?: number; areaId?: number }>({});

  const toggleDisability = (d: string) =>
    setDisabilities((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("dalilak_favs", JSON.stringify(next));
      return next;
    });
  };

  const login = (token: string, user: AuthUser) => {
    setAuthToken(token);
    setAuthUser(user);
    localStorage.setItem("dalilak_token", token);
    localStorage.setItem("dalilak_user", JSON.stringify(user));
  };

  const logout = () => {
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem("dalilak_token");
    localStorage.removeItem("dalilak_user");
  };

  return (
    <AppContext.Provider value={{
      lang, setLang, userType, setUserType, disabilities, toggleDisability,
      searchQuery, setSearchQuery, activeCategory, setActiveCategory,
      favorites, toggleFavorite, screen, setScreen,
      authUser, authToken, login, logout, filters, setFilters,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
