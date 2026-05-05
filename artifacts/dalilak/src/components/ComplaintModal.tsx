import { useState } from "react";
import { X, Loader2, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  onClose: () => void;
  placeId?: number;
  placeName?: string;
}

export function ComplaintModal({ onClose, placeId, placeName }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    if (!form.name || !form.email || !form.phone || !form.message)
      return setError("جميع الحقول مطلوبة بما فيها رقم الهاتف");
    setLoading(true);
    try {
      await apiFetch("/complaints", {
        method: "POST",
        body: JSON.stringify({
          senderName: form.name,
          senderEmail: form.email,
          senderPhone: form.phone,
          message: form.message,
          placeId,
        }),
      });
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
          <h2 className="text-lg font-black">📢 تقديم شكوى أو اقتراح</h2>
        </div>

        {placeName && (
          <p className="text-sm text-muted-foreground bg-card rounded-xl p-3">
            متعلق بـ: <span className="text-foreground font-bold">{placeName}</span>
          </p>
        )}

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold text-green-400">تم إرسال شكواك بنجاح!</p>
            <p className="text-sm text-muted-foreground mt-1">سيتواصل معك المدير قريباً</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm">إغلاق</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <input
                placeholder="اسمك الكامل *"
                value={form.name}
                onChange={set("name")}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <input
                type="email"
                placeholder="بريدك الإلكتروني *"
                value={form.email}
                onChange={set("email")}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                dir="ltr"
              />
              <div className="relative">
                <input
                  type="tel"
                  placeholder="رقم هاتفك *"
                  value={form.phone}
                  onChange={set("phone")}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  dir="ltr"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-red-400 font-bold">مطلوب</span>
              </div>
              <textarea
                placeholder="اكتب شكواك أو اقتراحك هنا..."
                value={form.message}
                onChange={set("message")}
                rows={4}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>
            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              إرسال
            </button>
          </>
        )}
      </div>
    </div>
  );
}
