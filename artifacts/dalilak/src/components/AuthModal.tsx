import { useState } from "react";
import { X, Eye, EyeOff, Loader2, ShieldCheck, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";

interface Props {
  onClose: () => void;
  defaultMode?: "admin" | "expert";
}

export function AuthModal({ onClose, defaultMode = "admin" }: Props) {
  const { login } = useApp();
  const [mode, setMode] = useState<"admin" | "expert">(defaultMode);
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [expertForm, setExpertForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setA = (k: keyof typeof adminForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAdminForm(f => ({ ...f, [k]: e.target.value }));
  const setE = (k: keyof typeof expertForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setExpertForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "admin") {
        if (!adminForm.email || !adminForm.password) throw new Error("أدخل البريد وكلمة المرور");
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: adminForm.email, password: adminForm.password }),
        });
        login(data.token, data.user);
        onClose();
      } else {
        if (!expertForm.username || !expertForm.password) throw new Error("أدخل اسم المستخدم وكلمة المرور");
        const data = await apiFetch("/auth/expert-login", {
          method: "POST",
          body: JSON.stringify({ username: expertForm.username.toUpperCase().trim(), password: expertForm.password }),
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl overflow-hidden"
        dir="rtl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={15} />
          </button>
          <div className="text-center">
            <h2 className="font-black text-primary text-base leading-none">دليلك ♿</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">تسجيل الدخول</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-border/40">
          <button
            onClick={() => { setMode("admin"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-colors ${mode === "admin" ? "border-red-400 text-red-400" : "border-transparent text-muted-foreground"}`}>
            <ShieldCheck size={15} /> دخول المدير
          </button>
          <button
            onClick={() => { setMode("expert"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-colors ${mode === "expert" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
            <Users size={15} /> دخول الخبراء والجمعيات
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3">
          {mode === "admin" ? (
            <>
              <div className="text-center mb-1">
                <span className="text-[11px] text-muted-foreground">يدخل المدير بالبريد الإلكتروني وكلمة المرور</span>
              </div>
              <input
                type="email" placeholder="البريد الإلكتروني" value={adminForm.email}
                onChange={setA("email")} dir="ltr"
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-red-400/60"
              />
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} placeholder="كلمة المرور"
                  value={adminForm.password} onChange={setA("password")}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-red-400/60 pl-11"
                />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-1">
                <span className="text-[11px] text-muted-foreground">أدخل اسم المستخدم وكلمة المرور التي أعطاك إياها المدير</span>
              </div>
              <input
                placeholder="اسم المستخدم  (مثال: EXP-AB3X7Y)"
                value={expertForm.username} onChange={setE("username")}
                autoComplete="off" spellCheck={false}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-center tracking-widest font-mono placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 uppercase"
              />
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} placeholder="كلمة المرور"
                  value={expertForm.password} onChange={setE("password")}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 pl-11"
                />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-center">{error}</p>
          )}

          <button onClick={submit} disabled={loading}
            className={`w-full py-3.5 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 ${mode === "admin" ? "bg-red-500 text-white hover:bg-red-600" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
            {loading && <Loader2 size={15} className="animate-spin" />}
            دخول
          </button>

          <p className="text-center text-[10px] text-muted-foreground pt-1">
            الزائر لا يحتاج لتسجيل دخول — يمكنه التصفح وتقديم الشكاوى مباشرة
          </p>
        </div>
      </div>
    </div>
  );
}
