import { useApp } from "@/context/AppContext";

export function WhoScreen() {
  const { setUserType, setScreen } = useApp();

  function handleSelect(type: "visitor" | "resident") {
    setUserType(type);
    setTimeout(() => setScreen("disability"), 150);
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="text-2xl font-black text-primary">أنت...</h1>
        <p className="text-sm text-muted-foreground mt-2">حدد وضعك للحصول على أفضل تجربة</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => handleSelect("visitor")}
          className="flex items-center gap-4 p-6 rounded-2xl border-2 border-[#00C853]/30 bg-card hover:border-[#00C853] hover:bg-[#00C853]/5 transition-all duration-200 active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#00C853]/10 flex items-center justify-center text-3xl shrink-0">
            ✈️
          </div>
          <div className="text-right">
            <h3 className="text-lg font-black">زائر / سائح</h3>
            <p className="text-xs text-muted-foreground mt-1">أزور لبنان لأول مرة أو بشكل متكرر</p>
          </div>
        </button>

        <button
          onClick={() => handleSelect("resident")}
          className="flex items-center gap-4 p-6 rounded-2xl border-2 border-primary/30 bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
            🏠
          </div>
          <div className="text-right">
            <h3 className="text-lg font-black">مقيم</h3>
            <p className="text-xs text-muted-foreground mt-1">أعيش في لبنان وأبحث عن خدمات محلية</p>
          </div>
        </button>
      </div>
    </div>
  );
}
