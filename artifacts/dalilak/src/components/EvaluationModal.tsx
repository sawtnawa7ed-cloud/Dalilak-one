import { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlaceQueryKey } from "@workspace/api-client-react";

interface Props {
  onClose: () => void;
  placeId: number;
  placeName: string;
}

const CRITERIA = [
  { key: "hasRamp",             emoji: "♿", label: "منحدر للكراسي المتحركة",   hint: "وجود منحدر مناسب عند المدخل وداخل المكان" },
  { key: "hasElevator",         emoji: "🛗", label: "مصعد مناسب",               hint: "مصعد بأبعاد كافية ولوحة برايل أو صوتية" },
  { key: "hasAccessibleBathroom",emoji: "🚽", label: "حمام لذوي الإعاقة",        hint: "حمام مجهز بمساحة كافية ومقابض" },
  { key: "hasWideSpace",        emoji: "📐", label: "مساحة كافية للحركة",       hint: "ممرات واسعة تسمح بمرور الكرسي المتحرك" },
  { key: "hasGoodStaff",        emoji: "🤝", label: "تعامل الموظفين",           hint: "الموظفون متعاونون ومدربون على دعم ذوي الإعاقة" },
  { key: "hasIndoorSigns",      emoji: "🪧", label: "إرشادات واضحة داخل المكان", hint: "لافتات وإرشادات بارزة وسهلة القراءة" },
] as const;

type CheckKey = typeof CRITERIA[number]["key"];

export function EvaluationModal({ onClose, placeId, placeName }: Props) {
  const { authToken } = useApp();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    hasRamp: false, hasElevator: false, hasAccessibleBathroom: false,
    hasWideSpace: false, hasGoodStaff: false, hasIndoorSigns: false,
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const toggle = (k: CheckKey) => setChecks(p => ({ ...p, [k]: !p[k] }));

  const submit = async () => {
    if (rating === 0) return setError("اختر تقييماً من 1 إلى 5 نجوم");
    setLoading(true); setError("");
    try {
      await apiFetch(`/places/${placeId}/evaluation`, {
        method: "POST",
        body: JSON.stringify({ ...checks, rating, notes: notes || undefined }),
      }, authToken);
      await qc.invalidateQueries({ queryKey: getGetPlaceQueryKey(placeId) });
      setDone(true);
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const score = Object.values(checks).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-border rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        dir="rtl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40 shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground">
            <X size={15} />
          </button>
          <div className="text-center">
            <h2 className="font-black text-base leading-none">تقييم ميداني</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">إمكانية الوصول الشامل</p>
          </div>
          <div className="w-8" />
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* Place name */}
            <p className="text-sm text-muted-foreground bg-card border border-border/50 rounded-xl px-4 py-3 text-center font-bold">
              📍 {placeName}
            </p>

            {done ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="font-black text-green-400 text-lg">تم حفظ التقييم!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {score} من 6 معايير إمكانية الوصول متوفرة
                </p>
                <button onClick={onClose}
                  className="mt-5 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-sm">
                  إغلاق
                </button>
              </div>
            ) : (
              <>
                {/* Star rating */}
                <div>
                  <p className="text-sm font-black mb-3 text-center">التقييم العام لإمكانية الوصول</p>
                  <div className="flex gap-3 justify-center mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="transition-transform hover:scale-110 active:scale-95">
                        <Star size={32}
                          className={(hoverRating || rating) >= s ? "fill-primary text-primary" : "text-muted-foreground"} />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-center text-xs text-primary font-bold">
                      {["", "ضعيف جداً", "ضعيف", "متوسط", "جيد", "ممتاز"][rating]}
                    </p>
                  )}
                </div>

                {/* Criteria checklist */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-muted-foreground bg-card border border-border/50 px-2 py-1 rounded-full">
                      {score}/6 متوفر
                    </span>
                    <p className="text-sm font-black">معايير إمكانية الوصول</p>
                  </div>
                  <div className="space-y-2">
                    {CRITERIA.map(({ key, emoji, label, hint }) => (
                      <button key={key} onClick={() => toggle(key)}
                        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all text-right active:scale-[0.98] ${
                          checks[key]
                            ? "bg-primary/10 border-primary/40"
                            : "bg-card border-border/50 hover:border-border"
                        }`}>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all ${
                          checks[key] ? "bg-primary border-primary" : "border-border bg-background"
                        }`}>
                          {checks[key] && <span className="text-primary-foreground text-xs font-black">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{emoji}</span>
                            <span className={`text-sm font-bold ${checks[key] ? "text-primary" : ""}`}>{label}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{hint}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-bold mb-2">ملاحظات إضافية <span className="text-muted-foreground font-normal text-xs">(اختياري)</span></p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="اكتب ملاحظاتك الميدانية هنا..."
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>
                )}

                <button onClick={submit} disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  حفظ التقييم الميداني
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
