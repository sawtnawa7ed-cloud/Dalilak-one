import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Post {
  id: string;
  title: string;
  content: string;
  imageBase64: string | null;
  date: string;
  category: string;
}

export interface Profile {
  about: string;
  phone: string;
  email: string;
  logoBase64: string | null;
}

interface AppContextType {
  posts: Post[];
  profile: Profile;
  addPost: (post: Omit<Post, "id" | "date">) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  updateProfile: (profile: Profile) => Promise<void>;
  isLoading: boolean;
}

const POSTS_KEY = "sawtna_posts_v1";
const PROFILE_KEY = "sawtna_profile_v1";

const defaultProfile: Profile = {
  about:
    "منصة إعلامية مستقلة تسعى إلى نقل الحقيقة بصدق وأمانة، وتعمل على تعزيز الوعي الإعلامي في لبنان والعالم العربي.",
  phone: "",
  email: "",
  logoBase64: null,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [postsRaw, profileRaw] = await Promise.all([
        AsyncStorage.getItem(POSTS_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
      ]);
      if (postsRaw) setPosts(JSON.parse(postsRaw));
      if (profileRaw) setProfile(JSON.parse(profileRaw));
    } catch (_e) {
    } finally {
      setIsLoading(false);
    }
  }

  async function addPost(postData: Omit<Post, "id" | "date">) {
    const newPost: Post = {
      ...postData,
      id:
        Date.now().toString() + Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString("ar-LB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
  }

  async function deletePost(id: string) {
    const updatedPosts = posts.filter((p) => p.id !== id);
    setPosts(updatedPosts);
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
  }

  async function updateProfile(newProfile: Profile) {
    setProfile(newProfile);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  }

  return (
    <AppContext.Provider
      value={{ posts, profile, addPost, deletePost, updateProfile, isLoading }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
