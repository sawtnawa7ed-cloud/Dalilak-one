import { useState, useRef } from "react";
import { X, Loader2, Camera, ImageIcon, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlaceQueryKey } from "@workspace/api-client-react";

interface Props {
  onClose: () => void;
  placeId: number;
  placeName: string;
}

function compressImage(file: File, maxWidth = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas not supported"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("فشل تحميل الصورة"));
      img.src = e.target!.result as string;
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

export function AddPhotoModal({ onClose, placeId, placeName }: Props) {
  const { authToken } = useApp();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [fileSize, setFileSize] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const kb = (file.size / 1024).toFixed(0);
      setFileSize(`${kb} KB`);
      const compressed = await compressImage(file);
      setPreview(compressed);
    } catch {
      setError("تعذّر تحميل الصورة");
    }
  };

  const submit = async () => {
    if (!preview) return setError("التقط صورة أولاً");
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/places/${placeId}/photos`, {
        method: "POST",
        body: JSON.stringify({ url: preview, caption: caption || undefined }),
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl overflow-hidden" dir="rtl" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <h2 className="text-base font-black">📷 إضافة صورة توثيقية</h2>
        </div>

        {done ? (
          <div className="text-center py-10 px-5">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold text-green-400">تم رفع الصورة بنجاح!</p>
            <p className="text-xs text-muted-foreground mt-1">شكراً على توثيقك الميداني</p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm">إغلاق</button>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            {/* Proof notice */}
            <div className="flex gap-2.5 bg-amber-400/10 border border-amber-400/30 rounded-xl p-3">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-400 mb-0.5">الصورة إثبات حضور ميداني</p>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  يجب التقاط الصورة من كاميرا هاتفك أثناء وجودك في <span className="font-bold">{placeName}</span>. الصور المزوّرة أو المنقولة من الإنترنت ستُحذف وقد يُعلَّق حسابك.
                </p>
              </div>
            </div>

            {/* Camera capture */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />

            {!preview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-video bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera size={26} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">افتح الكاميرا</p>
                  <p className="text-xs text-muted-foreground mt-0.5">أو اختر صورة من المعرض</p>
                </div>
              </button>
            ) : (
              <div className="relative">
                <div className="aspect-video rounded-xl overflow-hidden bg-card border border-border">
                  <img src={preview} alt="معاينة" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => { setPreview(""); setCaption(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 left-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X size={13} />
                </button>
                <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-0.5">
                  <p className="text-xs text-white/80">{fileSize}</p>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 rounded-lg px-2 py-1 text-white hover:bg-black/80"
                >
                  <Camera size={11} />
                  <span className="text-xs">تغيير</span>
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">وصف الصورة (اختياري)</label>
              <input
                placeholder="مثال: المدخل الرئيسي — لا يوجد درج"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={loading || !preview}
              className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              رفع الصورة التوثيقية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
