import { useApp } from "@/context/AppContext";

const LANGS = [
  { code: "ar" as const, flag: "🇱🇧", label: "عربي" },
  { code: "en" as const, flag: "🇬🇧", label: "English" },
  { code: "fr" as const, flag: "🇫🇷", label: "Français" },
];

export function LangScreen() {
  const { lang, setLang, setScreen } = useApp();

  function handleSelect(code: "ar" | "en" | "fr") {
    setLang(code);
    setTimeout(() => setScreen("who"), 150);
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-4">🌍</div>
        <h1 className="text-2xl font-black text-primary">اختر لغتك</h1>
        <p className="text-sm text-muted-foreground mt-2">Choose your language</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
              lang === l.code
                ? "border-primary bg-primary/10 scale-105"
                : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <span className="text-3xl">{l.flag}</span>
            <span className="text-sm font-bold">{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
