import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, Users, MapPin, MessageSquare, BarChart2,
  CheckCircle, Trash2, UserPlus, Loader2, Copy,
  RefreshCw, ShieldCheck, Eye, EyeOff, KeyRound,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  useListComplaints, useGetStats, useListPlaces, useDeletePlace,
  getListPlacesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface Expert {
  id: number; name: string; status: string;
  phone?: string | null; accessCode?: string | null; createdAt: string;
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { authUser, authToken, updateUser } = useApp();
  const [tab, setTab] = useState<"stats" | "experts" | "places" | "complaints" | "settings">("experts");
  const qc = useQueryClient();

  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
        <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col items-center justify-center gap-4">
          <ShieldCheck size={48} className="text-red-400" />
          <p className="font-bold text-red-400">غير مصرح لك بالدخول</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold">العودة</button>
        </div>
      </div>
    );
  }

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  const { data: stats } = useGetStats();
  const { data: complaints = [], refetch: refetchComplaints } = useListComplaints({ request: { headers: authHeaders } });
  const { data: places = [] } = useListPlaces({});
  const { data: experts = [], refetch: refetchExperts } = useQuery<Expert[]>({
    queryKey: ["experts-all"],
    queryFn: () => apiFetch("/experts", {}, authToken),
  });

  const deletePlace = useDeletePlace({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListPlacesQueryKey() }) },
    request: { headers: authHeaders },
  });

  const navTabs = [
    { key: "experts" as const,    label: "الخبراء",    Icon: Users },
    { key: "stats" as const,      label: "إحصائيات",  Icon: BarChart2 },
    { key: "places" as const,     label: "الأماكن",    Icon: MapPin },
    { key: "complaints" as const, label: "الشكاوى",   Icon: MessageSquare, badge: complaints.filter((c: any) => c.status === "open").length },
    { key: "settings" as const,   label: "الحساب",    Icon: ShieldCheck },
  ];

  return (
    <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
      <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center gap-3 px-4 pt-5 pb-3">
            <button onClick={() => navigate("/")}
              className="w-9 h-9 bg-card rounded-full flex items-center justify-center text-muted-foreground border border-border">
              <ArrowRight size={18} />
            </button>
            <div className="flex-1">
              <h1 className="font-black text-primary text-base leading-none">لوحة المدير</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">{authUser.name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldCheck size={18} className="text-red-400" />
            </div>
          </div>

          <div className="flex border-t border-border/40 overflow-x-auto scrollbar-hide">
            {navTabs.map(({ key, label, Icon, badge }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`relative shrink-0 flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold transition-colors min-w-[60px] ${tab === key ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}>
                <div className="relative">
                  <Icon size={17} />
                  {!!badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold px-0.5">{badge}</span>
                  )}
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">

          {tab === "experts" && (
            <ExpertsTab authToken={authToken!} experts={experts} onRefresh={refetchExperts} />
          )}

          {tab === "stats" && (
            <StatsTab stats={stats} experts={experts} complaints={complaints} />
          )}

          {tab === "places" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">{places.length} مكان مسجل</p>
              {places.map(p => (
                <div key={p.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                      {p.isVerified && <CheckCircle size={12} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.governorateName}</p>
                  </div>
                  <button
                    onClick={() => { if (confirm(`حذف "${p.name}" نهائياً؟`)) deletePlace.mutate({ id: p.id }); }}
                    disabled={deletePlace.isPending}
                    className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0 active:scale-95 transition-transform disabled:opacity-50">
                    {deletePlace.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "complaints" && (
            <ComplaintsTab authToken={authToken!} complaints={complaints} onRefresh={refetchComplaints} />
          )}

          {tab === "settings" && (
            <SettingsTab authToken={authToken!} authUser={authUser} updateUser={updateUser} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Stats ─── */
function StatsTab({ stats, experts, complaints }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "الأماكن",    value: stats?.totalPlaces ?? "—",      icon: "📍" },
          { label: "الخبراء",    value: stats?.totalExperts ?? "—",     icon: "🏢" },
          { label: "التقييمات", value: stats?.totalEvaluations ?? "—", icon: "⭐" },
          { label: "المحافظات", value: stats?.totalGovernorates ?? "—",icon: "🗺️" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-black text-primary">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      {stats?.recentPlaces?.length > 0 && (
        <div>
          <h2 className="font-bold text-sm mb-3 text-muted-foreground">آخر الأماكن المضافة</h2>
          <div className="space-y-2">
            {stats.recentPlaces.map((p: any) => (
              <div key={p.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.governorateName}</p>
                </div>
                {p.isVerified
                  ? <CheckCircle size={16} className="text-primary shrink-0" />
                  : <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">غير موثق</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Experts Tab ─── */
function ExpertsTab({ authToken, experts, onRefresh }: { authToken: string; experts: Expert[]; onRefresh: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [generatedUser, setGeneratedUser] = useState("");
  const [generatedPass, setGeneratedPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [lastCreated, setLastCreated] = useState<{ name: string; username: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function rand(n: number) { let s = ""; for (let i = 0; i < n; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]; return s; }

  function generateCredentials() {
    setGeneratedUser(`EXP-${rand(6)}`);
    setGeneratedPass(`${rand(4)}-${rand(4)}`);
    setFormError("");
  }

  function copyField(val: string, key: string) {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  }

  async function createExpert() {
    setFormError("");
    if (!name.trim()) return setFormError("أدخل اسم الجمعية أو الخبير");
    if (!generatedUser || !generatedPass) return setFormError("اضغط أولاً على زر توليد كلمة السر");
    setCreating(true);
    try {
      const data = await apiFetch("/experts", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), phone: phone || undefined, username: generatedUser, password: generatedPass }),
      }, authToken);
      setLastCreated({ name: data.name, username: data.accessCode, password: generatedPass });
      setName(""); setPhone(""); setGeneratedUser(""); setGeneratedPass("");
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      setFormError(e.message || "حدث خطأ");
    } finally {
      setCreating(false);
    }
  }

  async function doAction(id: number, action: "block" | "unblock" | "delete") {
    if (action === "delete" && !confirm("حذف هذا الحساب نهائياً؟")) return;
    setActionLoading(id);
    try {
      if (action === "delete") await apiFetch(`/experts/${id}`, { method: "DELETE" }, authToken);
      else await apiFetch(`/experts/${id}/${action}`, { method: "POST" }, authToken);
      onRefresh();
    } catch (e: any) { alert(e.message || "حدث خطأ"); }
    finally { setActionLoading(null); }
  }

  const active  = experts.filter(e => e.status === "approved");
  const blocked = experts.filter(e => e.status !== "approved");

  return (
    <div className="space-y-4">

      {/* Success banner */}
      {lastCreated && (
        <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-4 space-y-3">
          <p className="font-black text-sm text-green-400 text-center">✅ تم إنشاء الحساب — احفظ بيانات الدخول</p>
          <div className="bg-background/60 rounded-xl divide-y divide-border/40">
            {[
              { label: "الاسم", value: lastCreated.name, mono: false },
              { label: "اسم المستخدم", value: lastCreated.username, mono: true, key: "user" },
              { label: "كلمة المرور", value: lastCreated.password, mono: true, key: "pass" },
            ].map(({ label, value, mono, key }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <button onClick={() => key && copyField(value, key)}
                  className={`shrink-0 ${key ? "text-green-400 hover:text-green-300" : "opacity-0 pointer-events-none"}`}>
                  <Copy size={14} />
                </button>
                <div className="text-right flex-1 mr-2">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className={`font-bold text-sm ${mono ? "font-mono tracking-widest text-primary" : ""}`}>{value}</p>
                </div>
                {key && copiedField === key && <span className="text-[9px] text-green-400 mr-2">نُسخ!</span>}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-amber-400 bg-amber-400/10 rounded-xl p-2 text-center">
            ⚠️ احفظ اسم المستخدم وكلمة المرور الآن — لن يظهرا مجدداً
          </p>
          <button onClick={() => setLastCreated(null)}
            className="w-full py-2.5 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm">
            فهمت، تم الحفظ ✓
          </button>
        </div>
      )}

      {/* Toggle form */}
      <button onClick={() => { setShowForm(!showForm); setFormError(""); if (showForm) { setGeneratedUser(""); setGeneratedPass(""); } }}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-2xl text-sm active:scale-[0.98] transition-transform">
        <UserPlus size={17} />
        {showForm ? "إلغاء" : "تسجيل جمعية أو خبير جديد"}
      </button>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden">
          <div className="bg-primary/10 px-4 py-3 border-b border-primary/20">
            <h3 className="font-black text-sm text-primary text-center">بيانات الجمعية / الخبير الجديد</h3>
          </div>
          <div className="p-4 space-y-3">
            {/* Name */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">الاسم *</p>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="اسم الجمعية أو الخبير"
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>

            {/* Phone */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">رقم الهاتف (اختياري)</p>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+961 XX XXX XXX" dir="ltr"
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>

            {/* Generated credentials */}
            {generatedUser && generatedPass ? (
              <div className="bg-background border border-primary/30 rounded-xl p-4 space-y-3">
                <p className="text-[11px] text-center text-muted-foreground font-bold">بيانات الدخول المولّدة</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-card rounded-xl px-3 py-2.5">
                    <button onClick={() => copyField(generatedUser, "gu")} className="text-primary">
                      {copiedField === "gu" ? <span className="text-[10px] text-green-400">نُسخ!</span> : <Copy size={13} />}
                    </button>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">اسم المستخدم</p>
                      <p className="font-mono font-black tracking-widest text-primary">{generatedUser}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-card rounded-xl px-3 py-2.5">
                    <button onClick={() => copyField(generatedPass, "gp")} className="text-primary">
                      {copiedField === "gp" ? <span className="text-[10px] text-green-400">نُسخ!</span> : <Copy size={13} />}
                    </button>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">كلمة المرور</p>
                      <p className="font-mono font-black tracking-widest text-primary">{generatedPass}</p>
                    </div>
                  </div>
                </div>
                <button onClick={generateCredentials}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground bg-card rounded-xl hover:text-foreground transition-colors">
                  <RefreshCw size={12} /> توليد جديد
                </button>
              </div>
            ) : (
              <div className="bg-background border border-dashed border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-3">اضغط الزر أدناه لتوليد بيانات الدخول</p>
              </div>
            )}

            {/* Generate button */}
            <button onClick={generateCredentials}
              className={`w-full py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border transition-all active:scale-95 ${generatedUser ? "bg-primary/10 text-primary border-primary/30" : "bg-primary text-primary-foreground border-transparent"}`}>
              <KeyRound size={15} />
              {generatedUser ? "إعادة توليد كلمة السر" : "توليد كلمة السر"}
            </button>

            {formError && <p className="text-xs text-red-400 text-center bg-red-400/10 rounded-xl py-2">{formError}</p>}

            {/* Create button */}
            <button onClick={createExpert} disabled={creating || !generatedUser}
              className="w-full py-4 bg-green-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50">
              {creating ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              إنشاء الحساب
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              بعد الإنشاء ستظهر بيانات الدخول — احفظها وأعطها للخبير/الجمعية
            </p>
          </div>
        </div>
      )}

      {/* Expert lists */}
      {active.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-bold text-sm text-green-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            نشطون ({active.length})
          </h2>
          {active.map(e => (
            <ExpertCard key={e.id} expert={e} loading={actionLoading === e.id}
              onBlock={() => doAction(e.id, "block")}
              onUnblock={() => doAction(e.id, "unblock")}
              onDelete={() => doAction(e.id, "delete")} />
          ))}
        </div>
      )}

      {blocked.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-bold text-sm text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full inline-block" />
            موقوفون ({blocked.length})
          </h2>
          {blocked.map(e => (
            <ExpertCard key={e.id} expert={e} loading={actionLoading === e.id}
              onBlock={() => doAction(e.id, "block")}
              onUnblock={() => doAction(e.id, "unblock")}
              onDelete={() => doAction(e.id, "delete")} />
          ))}
        </div>
      )}

      {experts.length === 0 && !showForm && !lastCreated && (
        <div className="text-center py-20 text-muted-foreground">
          <Users size={56} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold text-base">لا يوجد خبراء أو جمعيات بعد</p>
          <p className="text-xs mt-1">اضغط الزر أعلاه لتسجيل أول جمعية</p>
        </div>
      )}
    </div>
  );
}

function ExpertCard({ expert, loading, onBlock, onUnblock, onDelete }: {
  expert: Expert; loading: boolean;
  onBlock: () => void; onUnblock: () => void; onDelete: () => void;
}) {
  const [showCode, setShowCode] = useState(false);
  const isActive = expert.status === "approved";
  return (
    <div className={`bg-card border rounded-2xl p-4 ${isActive ? "border-border/50" : "border-red-500/20"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{expert.name}</p>
          {expert.phone && <p className="text-xs text-muted-foreground" dir="ltr">{expert.phone}</p>}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {isActive ? "نشط" : "موقوف"}
        </span>
      </div>

      {expert.accessCode && (
        <div className="flex items-center justify-between bg-background/60 rounded-xl px-3 py-2 mb-3 gap-2">
          <button onClick={() => navigator.clipboard?.writeText(expert.accessCode!)} className="text-muted-foreground hover:text-primary shrink-0">
            <Copy size={12} />
          </button>
          <p className={`font-mono text-sm font-bold tracking-widest flex-1 text-center transition-colors ${showCode ? "text-primary" : "text-muted-foreground"}`}>
            {showCode ? expert.accessCode : "EXP-••••••"}
          </p>
          <button onClick={() => setShowCode(!showCode)} className="text-muted-foreground hover:text-primary shrink-0">
            {showCode ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {isActive
          ? <button onClick={onBlock} disabled={loading}
              className="flex-1 py-2.5 bg-amber-400/10 text-amber-400 font-bold rounded-xl text-xs active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1">
              {loading ? <Loader2 size={12} className="animate-spin" /> : "🚫"} إيقاف
            </button>
          : <button onClick={onUnblock} disabled={loading}
              className="flex-1 py-2.5 bg-green-500/10 text-green-400 font-bold rounded-xl text-xs active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1">
              {loading ? <Loader2 size={12} className="animate-spin" /> : "✅"} تفعيل
            </button>
        }
        <button onClick={onDelete} disabled={loading}
          className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0 active:scale-95 transition-transform disabled:opacity-50">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Complaints ─── */
function ComplaintsTab({ authToken, complaints, onRefresh }: { authToken: string; complaints: any[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState<number | null>(null);

  async function doAction(id: number, action: "resolve" | "delete") {
    if (action === "delete" && !confirm("حذف هذه الشكوى نهائياً؟")) return;
    setLoading(id);
    try {
      if (action === "delete") await apiFetch(`/complaints/${id}`, { method: "DELETE" }, authToken);
      else await apiFetch(`/complaints/${id}/resolve`, { method: "PUT" }, authToken);
      onRefresh();
    } catch (e: any) { alert(e.message || "حدث خطأ"); }
    finally { setLoading(null); }
  }

  if (complaints.length === 0) return (
    <div className="text-center py-20 text-muted-foreground">
      <MessageSquare size={56} className="mx-auto mb-4 opacity-20" />
      <p className="font-bold">لا توجد شكاوى</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {complaints.map((c: any) => (
        <div key={c.id} className={`bg-card border rounded-2xl p-4 ${c.status === "open" ? "border-amber-400/30" : "border-border/40 opacity-70"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ar-LB")}</span>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${c.status === "open" ? "bg-amber-400/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}>
              {c.status === "open" ? "مفتوحة" : "تم الحل"}
            </span>
          </div>
          {c.placeName && <p className="text-xs text-primary mb-2">📍 {c.placeName}</p>}
          <p className="text-sm mb-3 leading-relaxed">{c.message}</p>
          <div className="bg-background/50 rounded-xl p-3 mb-3 space-y-1">
            <p className="text-xs font-bold">{c.senderName}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{c.senderEmail}</p>
            {c.senderPhone && <a href={`tel:${c.senderPhone}`} className="text-xs text-primary" dir="ltr">📞 {c.senderPhone}</a>}
          </div>
          <div className="flex gap-2">
            <a href={`mailto:${c.senderEmail}?subject=رد على شكواك في دليلك`}
              className="flex-1 text-center text-xs text-primary font-bold bg-primary/10 px-3 py-2.5 rounded-xl">
              ردّ بالبريد
            </a>
            {c.status === "open" && (
              <button onClick={() => doAction(c.id, "resolve")} disabled={loading === c.id}
                className="flex-1 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-2.5 rounded-xl disabled:opacity-50">
                {loading === c.id ? <Loader2 size={12} className="animate-spin mx-auto" /> : "✅ تم الحل"}
              </button>
            )}
            <button onClick={() => doAction(c.id, "delete")} disabled={loading === c.id}
              className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0 disabled:opacity-50">
              {loading === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={15} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Settings ─── */
function SettingsTab({ authToken, authUser, updateUser }: { authToken: string; authUser: any; updateUser: (u: any) => void }) {
  const [nameVal, setNameVal] = useState(authUser.name);
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [passErr, setPassErr] = useState("");

  async function saveName() {
    setNameErr(""); setNameMsg("");
    if (!nameVal.trim()) return setNameErr("أدخل الاسم");
    setSavingName(true);
    try {
      const updated = await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify({ name: nameVal.trim() }) }, authToken);
      updateUser(updated);
      setNameMsg("✅ تم تحديث الاسم");
    } catch (e: any) { setNameErr(e.message); }
    finally { setSavingName(false); }
  }

  async function savePass() {
    setPassErr(""); setPassMsg("");
    if (!pass.current || !pass.next || !pass.confirm) return setPassErr("أكمل جميع الحقول");
    if (pass.next !== pass.confirm) return setPassErr("كلمتا المرور غير متطابقتين");
    if (pass.next.length < 6) return setPassErr("كلمة المرور 6 أحرف على الأقل");
    setSavingPass(true);
    try {
      await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify({ currentPassword: pass.current, newPassword: pass.next }) }, authToken);
      setPassMsg("✅ تم تحديث كلمة المرور");
      setPass({ current: "", next: "", confirm: "" });
    } catch (e: any) { setPassErr(e.message); }
    finally { setSavingPass(false); }
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <ShieldCheck size={24} className="text-red-400" />
        </div>
        <div>
          <p className="font-black">{authUser.name}</p>
          <p className="text-xs text-muted-foreground">{authUser.email}</p>
          <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">مدير النظام</span>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-sm">تغيير الاسم</h3>
        <input value={nameVal} onChange={e => setNameVal(e.target.value)} placeholder="الاسم الكامل"
          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50" />
        {nameErr && <p className="text-xs text-red-400">{nameErr}</p>}
        {nameMsg && <p className="text-xs text-green-400">{nameMsg}</p>}
        <button onClick={saveName} disabled={savingName}
          className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {savingName && <Loader2 size={13} className="animate-spin" />} حفظ الاسم
        </button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-sm">تغيير كلمة المرور</h3>
        {[
          { ph: "كلمة المرور الحالية *", k: "current" as const },
          { ph: "كلمة المرور الجديدة *", k: "next" as const },
          { ph: "تأكيد كلمة المرور الجديدة *", k: "confirm" as const },
        ].map(({ ph, k }) => (
          <div key={k} className="relative">
            <input type={showPass ? "text" : "password"} placeholder={ph}
              value={pass[k]} onChange={e => setPass(f => ({ ...f, [k]: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 pl-11" />
            {k === "current" && (
              <button onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        ))}
        {passErr && <p className="text-xs text-red-400">{passErr}</p>}
        {passMsg && <p className="text-xs text-green-400">{passMsg}</p>}
        <button onClick={savePass} disabled={savingPass}
          className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {savingPass && <Loader2 size={13} className="animate-spin" />} تغيير كلمة المرور
        </button>
      </div>
    </div>
  );
}
