import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { SplashScreen } from "@/components/SplashScreen";
import { LangScreen } from "@/components/LangScreen";
import { WhoScreen } from "@/components/WhoScreen";
import { DisabilityScreen } from "@/components/DisabilityScreen";
import { MainApp } from "@/components/MainApp";

export default function Home() {
  const { screen, setScreen } = useApp();

  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("lang"), 2500);
      return () => clearTimeout(t);
    }
  }, [screen, setScreen]);

  if (screen === "splash") return <SplashScreen />;
  if (screen === "lang") return <LangScreen />;
  if (screen === "who") return <WhoScreen />;
  if (screen === "disability") return <DisabilityScreen />;
  return <MainApp />;
}
