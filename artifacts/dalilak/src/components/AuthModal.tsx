import { useState } from "react";
import { X, Eye, EyeOff, Loader2, KeyRound, Mail, UserPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";

interface Props {
  onClose: () => void;
}

type Mode = "login" | "code" | "register";

export function AuthModal({ onClose }: Props) {
  const { login } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", code: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.email || !form.password) throw new Error("أدخل البريد وكلمة المرور");
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        login(data.token, data.user);
        onClose();
      } else if (mode === "code") {
        if (!form.code) throw new Error("أدخل الكود");
        const data = await apiFetch("/auth/code-login", {
          method: "POST",
          body: JSON.stringify({ code: form.code.toUpperCase().trim() }),
        });
        login(data.token, data.user);
        onClose();
      } else {
        if (!form.name || !form.email || !form.password) throw new Error("جميع الحقول مطلوبة");
        const data = await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
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

  const tabs: { key: Mode; label: string; icon: React.ReactNode }[] = [
    { key: "login",    label: "دخول",         icon: <Mail size={13} /> },
    { key: "code",     label: "دخول بالكود",  icon: <KeyRound size={13} /> },
    { key: "register", label: "حساب جديد",    icon: <UserPlus size={13} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-5 space-y-4" dir="rtl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <h2 className="text-base font-black text-primary">دليلك ♿</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-card rounded-xl">
          {tabs.map(({ key, label, icon }) => (
            <button key={key} onClick={() => { setMode(key); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${mode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Mode description */}
        {mode === "login" && (
          <p className="text-[11px] text-muted-foreground text-center bg-card rounded-xl px-3 py-2">
            للمدير والزوار المسجلين
          </p>
        )}
        {mode === "code" && (
          <p className="text-[11px] text-primary/80 text-center bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
            للجمعيات والخبراء — أدخل الكود الذي أعطاك إياه المدير
          </p>
        )}
        {mode === "register" && (
          <p className="text-[11px] text-muted-foreground text-center bg-card rounded-xl px-3 py-2">
            إنشاء حساب زائر — للاطلاع على الأماكن وتقديم الشكاوى
          </p>
        )}

        {/* Fields */}
        <div className="space-y-3">
          {mode === "code" ? (
            <div className="relative">
              <input
                value={form.code}
                onChange={set("code")}
                placeholder="الكود — مثال: DAL-AB3X7Y"
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-center tracking-widest font-mono placeholder:text-muted-foreground placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-primary/50 uppercase"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          ) : (
            <>
              {mode === "register" && (
                <input placeholder="الاسم الكامل *" value={form.name} onChange={set("name")}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              )}
              <input type="email" placeholder="البريد الإلكتروني *" value={form.email} onChange={set("email")}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                dir="ltr" />
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="كلمة المرور *"
                  value={form.password} onChange={set("password")}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 pl-11" />
                <button onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>}

        <button onClick={submit} disabled={loading}
          className="w-full py-3.5 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {mode === "login" ? "دخول" : mode === "code" ? "دخول بالكود" : "إنشاء الحساب"}
        </button>

        {/* Quick test login */}
        <div className="text-center text-[10px] text-muted-foreground">
          تجريبي:
          <button onClick={() => { setMode("login"); setForm(f => ({ ...f, email: "majdi@dalilak.lb", password: "dalilak2o26" })); }} className="text-red-400 font-bold mr-1 hover:underline">مدير</button>
        </div>
      </div>
    </div>
  );
}
