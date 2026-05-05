import { Home, Search, Heart, User } from "lucide-react";

type Tab = "home" | "search" | "favorites" | "profile";

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
  favCount: number;
}

const tabs: { key: Tab; label: string; Icon: React.FC<{ size: number; className?: string }> }[] = [
  { key: "home",      label: "الرئيسية", Icon: Home },
  { key: "search",    label: "البحث",    Icon: Search },
  { key: "favorites", label: "المفضلة",  Icon: Heart },
  { key: "profile",   label: "حسابي",    Icon: User },
];

export function BottomNav({ active, onChange, favCount }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] pointer-events-auto">
        <div className="mx-3 mb-3 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl flex items-center shadow-2xl shadow-black/40">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors rounded-2xl ${active === key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {active === key && (
                <span className="absolute top-1.5 w-1 h-1 bg-primary rounded-full" />
              )}
              <div className="relative">
                <Icon size={22} className={active === key ? "stroke-[2.5]" : "stroke-[1.8]"} />
                {key === "favorites" && favCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold px-0.5">
                    {favCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold leading-none ${active === key ? "text-primary" : ""}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
