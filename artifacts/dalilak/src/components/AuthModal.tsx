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
  const [expertForm, setExpertForm] = useState({ code1: "", code2: "" });
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
        if (!expertForm.code1 || !expertForm.code2) throw new Error("أدخل الرمزين كاملَين");
        const data = await apiFetch("/auth/expert-login", {
          method: "POST",
          body: JSON.stringify({
            username: expertForm.code1.toUpperCase().trim(),
            password: expertForm.code2.trim(),
          }),
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
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] bg-background border border-border rounded-t-3xl flex flex-col"
        style={{ maxHeight: "90dvh" }}
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-border/40 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground"
          >
            <X size={15} />
          </button>
          <div className="text-center">
            <h2 className="font-black text-primary text-base leading-none">دليلك ♿</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">تسجيل الدخول</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-border/40 shrink-0">
          <button
            onClick={() => { setMode("admin"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-colors ${mode === "admin" ? "border-red-400 text-red-400" : "border-transparent text-muted-foreground"}`}
          >
            <ShieldCheck size={15} /> دخول المدير
          </button>
          <button
            onClick={() => { setMode("expert"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-colors ${mode === "expert" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <Users size={15} /> دخول الخبراء والجمعيات
          </button>
        </div>

        {/* Scrollable form area */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">

          {mode === "admin" ? (
            <>
              <p className="text-center text-[11px] text-muted-foreground">
                يدخل المدير بالبريد الإلكتروني وكلمة المرور
              </p>
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
              {/* Instruction banner */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 text-center">
                <p className="text-xs font-bold text-primary mb-0.5">أدخل الرمزَين اللذَين أعطاك إياهما المدير</p>
                <p className="text-[10px] text-muted-foreground">كلٌّ في خانته الخاصة</p>
              </div>

              {/* Code 1 */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5 text-right">
                  الرمز الأول <span className="text-primary">(مثال: EXP-AB3X7Y)</span>
                </p>
                <input
                  placeholder="EXP-XXXXXX"
                  value={expertForm.code1}
                  onChange={setE("code1")}
                  autoComplete="off"
                  spellCheck={false}
                  dir="ltr"
                  className="w-full bg-card border-2 border-primary/30 rounded-xl py-3.5 px-4 text-base text-center tracking-[0.25em] font-mono placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:border-primary uppercase"
                />
              </div>

              {/* Code 2 */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5 text-right">
                  الرمز الثاني <span className="text-primary">(مثال: ABCD-EFGH)</span>
                </p>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="XXXX-XXXX"
                    value={expertForm.code2}
                    onChange={setE("code2")}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    autoComplete="off"
                    dir="ltr"
                    className="w-full bg-card border-2 border-primary/30 rounded-xl py-3.5 px-4 text-base text-center tracking-[0.25em] font-mono placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:border-primary pl-11"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-center">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className={`w-full py-4 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 ${mode === "admin" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"}`}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            دخول
          </button>

          <p className="text-center text-[10px] text-muted-foreground pb-2">
            الزائر لا يحتاج لتسجيل دخول — يمكنه التصفح وتقديم الشكاوى مباشرة
          </p>
        </div>
      </div>
    </div>
  );
}
