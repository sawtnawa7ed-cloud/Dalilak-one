import React, { createContext, useContext, useState } from "react";
import { PLACES } from "@/data/places";
import type { Place } from "@/data/places";

type Lang = "ar" | "en" | "fr";
type UserType = "visitor" | "resident" | null;

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  userType: UserType;
  setUserType: (t: UserType) => void;
  disabilities: string[];
  toggleDisability: (d: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  places: Place[];
  filteredPlaces: Place[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  screen: "splash" | "lang" | "who" | "disability" | "main";
  setScreen: (s: "splash" | "lang" | "who" | "disability" | "main") => void;
}

const AppContext = createContext<AppContextType | null>(null);

const T: Record<Lang, Record<string, string>> = {
  ar: {},
  en: {},
  fr: {},
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const [userType, setUserType] = useState<UserType>(null);
  const [disabilities, setDisabilities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [screen, setScreen] = useState<"splash" | "lang" | "who" | "disability" | "main">("splash");

  const toggleDisability = (d: string) => {
    setDisabilities((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredPlaces = PLACES.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.area?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "الكل" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        userType,
        setUserType,
        disabilities,
        toggleDisability,
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        places: PLACES,
        filteredPlaces,
        favorites,
        toggleFavorite,
        screen,
        setScreen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
