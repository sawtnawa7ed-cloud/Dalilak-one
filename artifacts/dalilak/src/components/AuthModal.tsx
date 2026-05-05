import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";

interface Props {
  onClose: () => void;
}

export function AuthModal({ onClose }: Props) {
  const { login } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    if (!form.email || !form.password) return setError("أدخل البريد وكلمة المرور");
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        login(data.token, data.user);
        onClose();
      } else {
        if (!form.name) return setError("أدخل الاسم");
        const data = await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: "visitor" }),
        });
        login(data.token, data.user);
        onClose();
      }
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
          <h2 className="text-lg font-black text-primary">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب زائر"}
          </h2>
        </div>

        <div className="flex gap-2 p-1 bg-card rounded-xl">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {m === "login" ? "دخول" : "حساب زائر جديد"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
            <p className="text-xs text-primary">
              حسابات الخبراء يُنشئها المدير فقط. إذا كنت خبيراً، تواصل مع المدير للحصول على بيانات الدخول.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {mode === "register" && (
            <input
              placeholder="الاسم الكامل *"
              value={form.name}
              onChange={set("name")}
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          )}
          <input
            type="email"
            placeholder="البريد الإلكتروني *"
            value={form.email}
            onChange={set("email")}
            className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            dir="ltr"
          />
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="كلمة المرور *"
              value={form.password}
              onChange={set("password")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 pl-12"
            />
            <button onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>

        <div className="text-center text-xs text-muted-foreground pt-1">
          <span>حسابات تجريبية: </span>
          <button onClick={() => { setForm({ name: "", email: "admin@dalilak.lb", password: "admin123" }); setMode("login"); }} className="text-primary hover:underline">مدير</button>
          {" | "}
          <button onClick={() => { setForm({ name: "", email: "ahmad@dalilak.lb", password: "expert123" }); setMode("login"); }} className="text-primary hover:underline">خبير</button>
        </div>
      </div>
    </div>
  );
}
