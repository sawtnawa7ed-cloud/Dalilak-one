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

export function EvaluationModal({ onClose, placeId, placeName }: Props) {
  const { authToken } = useApp();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [checks, setChecks] = useState({
    hasRamp: false, hasElevator: false,
    hasAccessibleBathroom: false, hasAccessibleParking: false,
    hasSignLanguage: false, hasBraille: false,
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const toggle = (k: keyof typeof checks) =>
    setChecks((p) => ({ ...p, [k]: !p[k] }));

  const submit = async () => {
    if (rating === 0) return setError("اختر تقييماً من 1 إلى 5");
    setLoading(true);
    setError("");
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

  const checkItems: { key: keyof typeof checks; label: string }[] = [
    { key: "hasRamp", label: "منحدر للكراسي المتحركة" },
    { key: "hasElevator", label: "مصعد مناسب" },
    { key: "hasAccessibleBathroom", label: "حمام لذوي الإعاقة" },
    { key: "hasAccessibleParking", label: "موقف سيارات مخصص" },
    { key: "hasSignLanguage", label: "خدمة لغة الإشارة" },
    { key: "hasBraille", label: "لافتات بطريقة برايل" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <h2 className="text-lg font-black">تقييم ميداني</h2>
        </div>

        <p className="text-sm text-muted-foreground bg-card rounded-xl p-3">{placeName}</p>

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold text-green-400">تم حفظ التقييم!</p>
            <p className="text-sm text-muted-foreground mt-1">شكراً على مساهمتك</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm">
              إغلاق
            </button>
          </div>
        ) : (
          <>
            {/* Rating stars */}
            <div>
              <p className="text-sm font-bold mb-2">التقييم العام</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={(hoverRating || rating) >= s ? "fill-primary text-primary" : "text-muted-foreground"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <p className="text-sm font-bold mb-2">مرافق موجودة في المكان</p>
              <div className="space-y-2">
                {checkItems.map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl px-3 py-2.5 cursor-pointer hover:border-primary/40 transition-colors">
                    <span className="text-sm">{label}</span>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${checks[key] ? "bg-primary border-primary" : "border-border"}`}
                      onClick={() => toggle(key)}
                    >
                      {checks[key] && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm font-bold mb-2">ملاحظات إضافية (اختياري)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="اكتب ملاحظاتك هنا..."
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              حفظ التقييم
            </button>
          </>
        )}
      </div>
    </div>
  );
}
