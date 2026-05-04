import { useState } from "react";
import { X, Loader2, ImageIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlaceQueryKey } from "@workspace/api-client-react";

interface Props {
  onClose: () => void;
  placeId: number;
}

export function AddPhotoModal({ onClose, placeId }: Props) {
  const { authToken } = useApp();
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!url) return setError("أدخل رابط الصورة");
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/places/${placeId}/photos`, {
        method: "POST",
        body: JSON.stringify({ url, caption: caption || undefined }),
      }, authToken);
      await qc.invalidateQueries({ queryKey: getGetPlaceQueryKey(placeId) });
      setDone(true);
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-6 space-y-4" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <h2 className="text-lg font-black">📷 إضافة صورة</h2>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold text-green-400">تم إضافة الصورة!</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm">إغلاق</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-bold mb-1 block">رابط الصورة (URL)</label>
                <input
                  placeholder="https://example.com/photo.jpg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  dir="ltr"
                />
              </div>
              {url && (
                <div className="aspect-video bg-card border border-border rounded-xl overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <div>
                <label className="text-sm font-bold mb-1 block">وصف الصورة (اختياري)</label>
                <input
                  placeholder="مثال: المدخل الرئيسي للمبنى"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              إضافة الصورة
            </button>
          </>
        )}
      </div>
    </div>
  );
}
