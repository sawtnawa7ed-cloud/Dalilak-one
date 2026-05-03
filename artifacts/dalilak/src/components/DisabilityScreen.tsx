import { useApp } from "@/context/AppContext";
import { DISABILITY_TYPES } from "@/data/places";

export function DisabilityScreen() {
  const { disabilities, toggleDisability, setScreen } = useApp();

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="p-6 pt-12">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">♿</div>
          <h1 className="text-xl font-black text-primary">ما احتياجاتك؟</h1>
          <p className="text-xs text-muted-foreground mt-1">
            اختر ما ينطبق عليك لتخصيص نتائجك (يمكنك تخطي هذه الخطوة)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {DISABILITY_TYPES.map((d) => (
            <button
              key={d.id}
              onClick={() => toggleDisability(d.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                disabilities.includes(d.id)
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-3xl">{d.icon}</span>
              <span className="text-xs font-bold text-center leading-tight">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6 pt-0 flex flex-col gap-3">
        <button
          onClick={() => setScreen("main")}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base hover:bg-primary/90 transition-colors active:scale-95"
        >
          {disabilities.length > 0 ? `ابدأ (${disabilities.length} مختار)` : "ابدأ"}
        </button>
        <button
          onClick={() => setScreen("main")}
          className="w-full py-3 rounded-2xl border border-border text-muted-foreground text-sm hover:bg-card transition-colors"
        >
          تخطي
        </button>
      </div>
    </div>
  );
}
