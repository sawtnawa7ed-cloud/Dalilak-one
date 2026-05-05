import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, Users, MapPin, MessageSquare, BarChart2,
  CheckCircle, X, ShieldCheck, Trash2
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  useListExperts, useApproveExpert, useRejectExpert,
  useListComplaints, useGetStats, useListPlaces, useDeletePlace,
  getListExpertsQueryKey, getListPlacesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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

  const { data: stats } = useGetStats();
  const { data: pendingExperts = [] } = useListExperts({ status: "pending" }, { request: { headers: { Authorization: `Bearer ${authToken}` } } });
  const { data: allExperts = [] } = useListExperts({ status: "approved" }, { request: { headers: { Authorization: `Bearer ${authToken}` } } });
  const { data: complaints = [] } = useListComplaints({ request: { headers: { Authorization: `Bearer ${authToken}` } } });
  const { data: places = [] } = useListPlaces({});

  const approveExpert = useApproveExpert({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListExpertsQueryKey() }) } });
  const rejectExpert = useRejectExpert({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListExpertsQueryKey() }) } });
  const deletePlace = useDeletePlace({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListPlacesQueryKey() }) } });

  const navTabs = [
    { key: "stats" as const,      label: "إحصائيات", Icon: BarChart2 },
    { key: "experts" as const,    label: `خبراء`, Icon: Users, badge: pendingExperts.length },
    { key: "places" as const,     label: "أماكن", Icon: MapPin },
    { key: "complaints" as const, label: "شكاوى", Icon: MessageSquare, badge: complaints.filter(c => c.status === "open").length },
  ];

  return (
    <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
      <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col">

        {/* Header */}
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

          {/* Bottom nav tabs */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">

          {/* Stats */}
          {tab === "stats" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "الأماكن", value: stats?.totalPlaces ?? "—", icon: "📍" },
                  { label: "الخبراء", value: stats?.totalExperts ?? "—", icon: "👥" },
                  { label: "التقييمات", value: stats?.totalEvaluations ?? "—", icon: "⭐" },
                  { label: "المحافظات", value: stats?.totalGovernorates ?? "—", icon: "🗺️" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-card border border-border/50 rounded-2xl p-4">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-2xl font-black text-primary">{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {pendingExperts.length > 0 && (
                <button onClick={() => setTab("experts")} className="w-full bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 text-right">
                  <p className="text-sm font-bold text-amber-400">⏳ {pendingExperts.length} طلب خبير في الانتظار</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">اضغط للمراجعة</p>
                </button>
              )}

              {stats?.recentPlaces && stats.recentPlaces.length > 0 && (
                <div>
                  <h2 className="font-bold text-sm mb-3 text-muted-foreground">آخر الأماكن المضافة</h2>
                  <div className="space-y-2">
                    {stats.recentPlaces.map((p) => (
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
          )}

          {/* Experts */}
          {tab === "experts" && (
            <div className="space-y-5">
              {pendingExperts.length > 0 && (
                <div>
                  <h2 className="font-bold text-sm mb-3 text-amber-400">⏳ طلبات معلقة ({pendingExperts.length})</h2>
                  <div className="space-y-3">
                    {pendingExperts.map((e) => (
                      <div key={e.id} className="bg-card border border-amber-400/30 rounded-2xl p-4">
                        <div className="mb-3">
                          <p className="font-bold">{e.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{e.email}</p>
                          {e.phone && <p className="text-xs text-muted-foreground">{e.phone}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveExpert.mutate({ id: e.id } as any)} disabled={approveExpert.isPending}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm active:scale-95 transition-transform">
                            <CheckCircle size={15} /> قبول
                          </button>
                          <button onClick={() => rejectExpert.mutate({ id: e.id } as any)} disabled={rejectExpert.isPending}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/20 text-red-400 font-bold rounded-xl text-sm active:scale-95 transition-transform">
                            <X size={15} /> رفض
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {allExperts.length > 0 && (
                <div>
                  <h2 className="font-bold text-sm mb-3 text-green-400">✅ خبراء نشطون ({allExperts.length})</h2>
                  <div className="space-y-2">
                    {allExperts.map((e) => (
                      <div key={e.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{e.name}</p>
                          <p className="text-xs text-muted-foreground truncate" dir="ltr">{e.email}</p>
                        </div>
                        <button onClick={() => rejectExpert.mutate({ id: e.id } as any)}
                          className="text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition-transform">
                          إلغاء
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pendingExperts.length === 0 && allExperts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Users size={48} className="mx-auto mb-3 opacity-30" />
                  <p>لا يوجد خبراء بعد</p>
                </div>
              )}
            </div>
          )}

          {/* Places */}
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
                  <button onClick={() => { if (confirm("حذف هذا المكان نهائياً؟")) deletePlace.mutate({ id: p.id } as any); }}
                    disabled={deletePlace.isPending}
                    className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0 active:scale-95 transition-transform">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Complaints */}
          {tab === "complaints" && (
            <div className="space-y-3">
              {complaints.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                  <p>لا توجد شكاوى</p>
                </div>
              ) : complaints.map((c) => (
                <div key={c.id} className={`bg-card border rounded-2xl p-4 ${c.status === "open" ? "border-amber-400/30" : "border-border/40 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ar-LB")}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${c.status === "open" ? "bg-amber-400/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}>
                      {c.status === "open" ? "مفتوحة" : "تم الحل"}
                    </span>
                  </div>
                  {c.placeName && <p className="text-xs text-primary mb-1.5">📍 {c.placeName}</p>}
                  <p className="text-sm mb-3 leading-relaxed">{c.message}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="text-xs text-muted-foreground">
                      <p className="font-bold">{c.senderName}</p>
                      <p dir="ltr" className="text-[10px]">{c.senderEmail}</p>
                    </div>
                    <a href={`mailto:${c.senderEmail}?subject=رد على شكواك في دليلك`}
                      className="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-xl">
                      ردّ بالبريد
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
