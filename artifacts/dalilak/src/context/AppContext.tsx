import React, { createContext, useContext, useState } from "react";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "visitor" | "expert" | "admin";
  status: string;
}

interface AppContextType {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  authUser: AuthUser | null;
  authToken: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  filters: { governorateId?: number; cityId?: number; areaId?: number };
  setFilters: (f: { governorateId?: number; cityId?: number; areaId?: number }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("dalilak_favs") || "[]"); } catch { return []; }
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("dalilak_user") || "null"); } catch { return null; }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("dalilak_token"));
  const [filters, setFilters] = useState<{ governorateId?: number; cityId?: number; areaId?: number }>({});

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

  const updateUser = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem("dalilak_user", JSON.stringify(user));
  };

  return (
    <AppContext.Provider value={{
      searchQuery, setSearchQuery, activeCategory, setActiveCategory,
      favorites, toggleFavorite,
      authUser, authToken, login, logout, updateUser,
      filters, setFilters,
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
