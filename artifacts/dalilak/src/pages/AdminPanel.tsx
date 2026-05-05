import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, Users, MapPin, MessageSquare, BarChart2,
  CheckCircle, X, ShieldCheck, Trash2, UserPlus, Eye, EyeOff,
  Loader2, Phone, Mail, Lock, Copy
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  useListComplaints, useGetStats, useListPlaces, useDeletePlace,
  getListPlacesQueryKey, getListComplaintsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ExpertStatus = "approved" | "rejected" | "pending";
interface Expert { id: number; name: string; email: string; status: ExpertStatus; phone?: string | null; createdAt: string; }

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { authUser, authToken } = useApp();
  const [tab, setTab] = useState<"stats" | "experts" | "places" | "complaints">("stats");
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
    { key: "stats" as const,      label: "إحصائيات", Icon: BarChart2 },
    { key: "experts" as const,    label: "خبراء", Icon: Users, badge: experts.filter(e => e.status === "pending").length },
    { key: "places" as const,     label: "أماكن", Icon: MapPin },
    { key: "complaints" as const, label: "شكاوى", Icon: MessageSquare, badge: complaints.filter(c => c.status === "open").length },
  ];

  return (
    <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
      <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col">

        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center gap-3 px-4 pt-5 pb-3">
            <button onClick={() => navigate("/")} className="w-9 h-9 bg-card rounded-full flex items-center justify-center text-muted-foreground border border-border">
              <ArrowRight size={18} />
            </button>
            <div className="flex-1">
              <h1 className="font-black text-primary text-base leading-none">لوحة المدير</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">دليلك — {authUser.name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldCheck size={18} className="text-red-400" />
            </div>
          </div>

          <div className="flex border-t border-border/40">
            {navTabs.map(({ key, label, Icon, badge }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${tab === key ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}>
                <div className="relative">
                  <Icon size={18} className={tab === key ? "stroke-[2.5]" : "stroke-[1.8]"} />
                  {!!badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold px-0.5">{badge}</span>
                  )}
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">

          {/* ── Stats ── */}
          {tab === "stats" && (
            <StatsTab stats={stats} experts={experts} complaints={complaints} onGotoExperts={() => setTab("experts")} />
          )}

          {/* ── Experts ── */}
          {tab === "experts" && (
            <ExpertsTab authToken={authToken!} experts={experts} onRefresh={refetchExperts} />
          )}

          {/* ── Places ── */}
          {tab === "places" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">{places.length} مكان مسجل</p>
              {places.map((p) => (
                <div key={p.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                      {p.isVerified && <CheckCircle size={12} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.governorateName}</p>
                  </div>
                  <button
                    onClick={() => { if (confirm(`حذف "${p.name}" نهائياً؟`)) deletePlace.mutate({ id: p.id } as any); }}
                    disabled={deletePlace.isPending}
                    className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {deletePlace.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Complaints ── */}
          {tab === "complaints" && (
            <ComplaintsTab authToken={authToken!} complaints={complaints} onRefresh={refetchComplaints} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Stats Tab ───── */
function StatsTab({ stats, experts, complaints, onGotoExperts }: any) {
  const pending = experts.filter((e: Expert) => e.status === "pending").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "الأماكن",    value: stats?.totalPlaces ?? "—",      icon: "📍" },
          { label: "الخبراء",    value: stats?.totalExperts ?? "—",     icon: "👥" },
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
      {pending > 0 && (
        <button onClick={onGotoExperts} className="w-full bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 text-right">
          <p className="text-sm font-bold text-amber-400">⏳ {pending} طلب خبير في الانتظار</p>
          <p className="text-xs text-amber-400/70 mt-0.5">اضغط للمراجعة</p>
        </button>
      )}
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
                {p.isVerified ? <CheckCircle size={16} className="text-primary shrink-0" /> : <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">غير موثق</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Experts Tab ───── */
function ExpertsTab({ authToken, experts, onRefresh }: { authToken: string; experts: Expert[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ name: string; email: string; password: string } | null>(null);
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const createExpert = async () => {
    setFormError("");
    if (!form.name || !form.email) return setFormError("الاسم والبريد مطلوبان");
    setCreating(true);
    try {
      const data = await apiFetch("/experts", {
        method: "POST",
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone || undefined }),
      }, authToken);
      setCreatedCreds({ name: data.name, email: data.email, password: data.generatedPassword });
      setForm({ name: "", email: "", phone: "" });
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      setFormError(e.message || "حدث خطأ");
    } finally {
      setCreating(false);
    }
  };

  const doAction = async (id: number, action: "block" | "unblock" | "delete") => {
    if (action === "delete" && !confirm("حذف هذا الخبير نهائياً؟")) return;
    setActionLoading(id);
    try {
      if (action === "delete") {
        await apiFetch(`/experts/${id}`, { method: "DELETE" }, authToken);
      } else {
        await apiFetch(`/experts/${id}/${action}`, { method: "POST" }, authToken);
      }
      onRefresh();
    } catch (e: any) {
      alert(e.message || "حدث خطأ");
    } finally {
      setActionLoading(null);
    }
  };

  const approved = experts.filter(e => e.status === "approved");
  const blocked  = experts.filter(e => e.status === "rejected");
  const pending  = experts.filter(e => e.status === "pending");

  return (
    <div className="space-y-5">

      {/* Created credentials banner */}
      {createdCreds && (
        <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-black text-green-400">✅ تم إنشاء حساب الخبير — احفظ بيانات الدخول</p>
          <div className="space-y-2">
            {[
              { label: "الاسم", value: createdCreds.name },
              { label: "البريد", value: createdCreds.email },
              { label: "الرقم السري", value: createdCreds.password, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between bg-background/60 rounded-xl px-3 py-2">
                <button onClick={() => navigator.clipboard?.writeText(value)} className="text-green-400">
                  <Copy size={14} />
                </button>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className={`text-sm font-bold ${mono ? "font-mono tracking-widest text-primary" : ""}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-400 bg-amber-400/10 rounded-xl p-2 text-center">
            ⚠️ احفظ الرقم السري الآن — لن يظهر مرة أخرى
          </p>
          <button onClick={() => setCreatedCreds(null)} className="w-full py-2 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm">
            فهمت، تم الحفظ
          </button>
        </div>
      )}

      {/* Create expert button */}
      <button
        onClick={() => { setShowForm(!showForm); setFormError(""); }}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-black rounded-2xl text-sm active:scale-[0.98] transition-transform"
      >
        <UserPlus size={16} />
        {showForm ? "إلغاء" : "إنشاء حساب خبير جديد"}
      </button>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-3">
          <h3 className="font-black text-sm text-primary">بيانات الخبير الجديد</h3>
          <input value={form.name} onChange={set("name")} placeholder="الاسم الكامل *"
            className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <input value={form.email} onChange={set("email")} placeholder="البريد الإلكتروني *" dir="ltr"
            className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <input value={form.phone} onChange={set("phone")} placeholder="رقم الهاتف (اختياري)" dir="ltr"
            className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          {formError && <p className="text-xs text-red-400 text-center">{formError}</p>}
          <button onClick={createExpert} disabled={creating}
            className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60">
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            توليد رقم سري وإنشاء الحساب
          </button>
          <p className="text-[10px] text-muted-foreground text-center">سيتم توليد رقم سري تلقائياً — أعطِه للخبير</p>
        </div>
      )}

      {/* Pending experts */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-bold text-sm mb-3 text-amber-400">⏳ طلبات قديمة ({pending.length})</h2>
          {pending.map(e => (
            <ExpertCard key={e.id} expert={e} loading={actionLoading === e.id}
              onBlock={() => doAction(e.id, "block")}
              onUnblock={() => doAction(e.id, "unblock")}
              onDelete={() => doAction(e.id, "delete")} />
          ))}
        </div>
      )}

      {/* Active experts */}
      {approved.length > 0 && (
        <div>
          <h2 className="font-bold text-sm mb-3 text-green-400">✅ خبراء نشطون ({approved.length})</h2>
          {approved.map(e => (
            <ExpertCard key={e.id} expert={e} loading={actionLoading === e.id}
              onBlock={() => doAction(e.id, "block")}
              onUnblock={() => doAction(e.id, "unblock")}
              onDelete={() => doAction(e.id, "delete")} />
          ))}
        </div>
      )}

      {/* Blocked experts */}
      {blocked.length > 0 && (
        <div>
          <h2 className="font-bold text-sm mb-3 text-red-400">🚫 خبراء موقوفون ({blocked.length})</h2>
          {blocked.map(e => (
            <ExpertCard key={e.id} expert={e} loading={actionLoading === e.id}
              onBlock={() => doAction(e.id, "block")}
              onUnblock={() => doAction(e.id, "unblock")}
              onDelete={() => doAction(e.id, "delete")} />
          ))}
        </div>
      )}

      {experts.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا يوجد خبراء بعد</p>
          <p className="text-xs mt-1">استخدم الزر أعلاه لإنشاء أول خبير</p>
        </div>
      )}
    </div>
  );
}

function ExpertCard({ expert, loading, onBlock, onUnblock, onDelete }: {
  expert: Expert; loading: boolean;
  onBlock: () => void; onUnblock: () => void; onDelete: () => void;
}) {
  const isActive = expert.status === "approved";
  return (
    <div className={`bg-card border rounded-xl p-4 mb-2 ${isActive ? "border-border/50" : "border-red-500/20 opacity-80"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{expert.name}</p>
          <p className="text-xs text-muted-foreground truncate" dir="ltr">{expert.email}</p>
          {expert.phone && (
            <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{expert.phone}</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
          isActive ? "bg-green-500/10 text-green-400" :
          expert.status === "pending" ? "bg-amber-400/10 text-amber-400" :
          "bg-red-500/10 text-red-400"
        }`}>
          {isActive ? "نشط" : expert.status === "pending" ? "معلق" : "موقوف"}
        </span>
      </div>
      <div className="flex gap-2">
        {isActive ? (
          <button onClick={onBlock} disabled={loading}
            className="flex-1 py-2 bg-amber-400/10 text-amber-400 font-bold rounded-xl text-xs active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1">
            {loading ? <Loader2 size={12} className="animate-spin" /> : "🚫"} إيقاف
          </button>
        ) : (
          <button onClick={onUnblock} disabled={loading}
            className="flex-1 py-2 bg-green-500/10 text-green-400 font-bold rounded-xl text-xs active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1">
            {loading ? <Loader2 size={12} className="animate-spin" /> : "✅"} تفعيل
          </button>
        )}
        <button onClick={onDelete} disabled={loading}
          className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0 active:scale-95 transition-transform disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

/* ───── Complaints Tab ───── */
function ComplaintsTab({ authToken, complaints, onRefresh }: { authToken: string; complaints: any[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState<number | null>(null);

  const doAction = async (id: number, action: "resolve" | "delete") => {
    if (action === "delete" && !confirm("حذف هذه الشكوى نهائياً؟")) return;
    setLoading(id);
    try {
      if (action === "delete") {
        await apiFetch(`/complaints/${id}`, { method: "DELETE" }, authToken);
      } else {
        await apiFetch(`/complaints/${id}/resolve`, { method: "PUT" }, authToken);
      }
      onRefresh();
    } catch (e: any) {
      alert(e.message || "حدث خطأ");
    } finally {
      setLoading(null);
    }
  };

  if (complaints.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
        <p>لا توجد شكاوى</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complaints.map((c) => (
        <div key={c.id} className={`bg-card border rounded-2xl p-4 ${c.status === "open" ? "border-amber-400/30" : "border-border/40 opacity-70"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ar-LB")}</span>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${c.status === "open" ? "bg-amber-400/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}>
              {c.status === "open" ? "مفتوحة" : "تم الحل"}
            </span>
          </div>
          {c.placeName && <p className="text-xs text-primary mb-1.5">📍 {c.placeName}</p>}
          <p className="text-sm mb-3 leading-relaxed">{c.message}</p>

          <div className="bg-background/50 rounded-xl p-3 mb-3 space-y-1">
            <p className="text-xs font-bold">{c.senderName}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{c.senderEmail}</p>
            {c.senderPhone && (
              <a href={`tel:${c.senderPhone}`} className="text-xs text-primary flex items-center gap-1" dir="ltr">
                📞 {c.senderPhone}
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <a href={`mailto:${c.senderEmail}?subject=رد على شكواك في دليلك`}
              className="flex-1 text-center text-xs text-primary font-bold bg-primary/10 px-3 py-2 rounded-xl active:scale-95 transition-transform">
              ردّ بالبريد
            </a>
            {c.status === "open" && (
              <button onClick={() => doAction(c.id, "resolve")} disabled={loading === c.id}
                className="flex-1 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50">
                {loading === c.id ? <Loader2 size={12} className="animate-spin mx-auto" /> : "✅ تم الحل"}
              </button>
            )}
            <button onClick={() => doAction(c.id, "delete")} disabled={loading === c.id}
              className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0 active:scale-95 transition-transform disabled:opacity-50">
              {loading === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
