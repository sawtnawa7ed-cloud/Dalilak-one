import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, Users, MapPin, MessageSquare, BarChart2,
  CheckCircle, X, Loader2, ShieldCheck, Trash2, RefreshCw
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  useListExperts, useApproveExpert, useRejectExpert,
  useListComplaints, useGetStats, useListPlaces, useDeletePlace,
  getListExpertsQueryKey, getListComplaintsQueryKey, getGetStatsQueryKey, getListPlacesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { authUser, authToken } = useApp();
  const [tab, setTab] = useState<"stats" | "experts" | "places" | "complaints">("stats");
  const qc = useQueryClient();

  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir="rtl">
        <ShieldCheck size={48} className="text-red-400" />
        <p className="font-bold text-red-400">غير مصرح لك بالدخول</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
          العودة
        </button>
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

  const tabs = [
    { key: "stats", label: "إحصائيات", icon: BarChart2 },
    { key: "experts", label: `خبراء (${pendingExperts.length})`, icon: Users },
    { key: "places", label: "أماكن", icon: MapPin },
    { key: "complaints", label: `شكاوى (${complaints.filter(c => c.status === "open").length})`, icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/")} className="w-9 h-9 bg-card rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground border border-border">
            <ArrowRight size={18} />
          </button>
          <div>
            <h1 className="font-black text-primary text-lg leading-none">لوحة المدير</h1>
            <p className="text-xs text-muted-foreground">دليلك</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${tab === key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-4 pb-10">
        {/* Stats */}
        {tab === "stats" && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "الأماكن", value: stats.totalPlaces, icon: "📍" },
                { label: "الخبراء", value: stats.totalExperts, icon: "👥" },
                { label: "التقييمات", value: stats.totalEvaluations, icon: "⭐" },
                { label: "المحافظات", value: stats.totalGovernorates, icon: "🗺️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-card border border-border/50 rounded-2xl p-4">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-2xl font-black text-primary">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {pendingExperts.length > 0 && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-400">
                  ⏳ {pendingExperts.length} طلب خبير في انتظار الموافقة
                </p>
                <button onClick={() => setTab("experts")} className="text-xs text-amber-400 underline mt-1">
                  مراجعة الطلبات
                </button>
              </div>
            )}

            {stats.recentPlaces && stats.recentPlaces.length > 0 && (
              <div>
                <h2 className="font-bold text-sm mb-3">آخر الأماكن المضافة</h2>
                <div className="space-y-2">
                  {stats.recentPlaces.map((p) => (
                    <div key={p.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category} · {p.governorateName}</p>
                      </div>
                      {p.isVerified ? (
                        <CheckCircle size={16} className="text-primary" />
                      ) : (
                        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">غير موثق</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Experts */}
        {tab === "experts" && (
          <div className="space-y-4">
            {pendingExperts.length > 0 && (
              <div>
                <h2 className="font-bold text-sm mb-3 text-amber-400">⏳ طلبات معلقة ({pendingExperts.length})</h2>
                <div className="space-y-2">
                  {pendingExperts.map((e) => (
                    <div key={e.id} className="bg-card border border-amber-400/30 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-bold">{e.name}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{e.email}</p>
                          {e.phone && <p className="text-xs text-muted-foreground">{e.phone}</p>}
                        </div>
                        <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-1 rounded-full">معلق</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveExpert.mutate({ id: e.id } as any)}
                          disabled={approveExpert.isPending}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm hover:bg-green-500/30 transition-colors"
                        >
                          <CheckCircle size={14} />
                          قبول
                        </button>
                        <button
                          onClick={() => rejectExpert.mutate({ id: e.id } as any)}
                          disabled={rejectExpert.isPending}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/20 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/30 transition-colors"
                        >
                          <X size={14} />
                          رفض
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
                    <div key={e.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{e.name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{e.email}</p>
                      </div>
                      <button
                        onClick={() => rejectExpert.mutate({ id: e.id } as any)}
                        className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full hover:bg-red-400/20 transition-colors"
                      >
                        إلغاء الصلاحية
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingExperts.length === 0 && allExperts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users size={40} className="mx-auto mb-3 opacity-40" />
                <p>لا يوجد خبراء بعد</p>
              </div>
            )}
          </div>
        )}

        {/* Places */}
        {tab === "places" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{places.length} مكان مسجل</p>
            {places.map((p) => (
              <div key={p.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                    {p.isVerified && <CheckCircle size={12} className="text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.governorateName}</p>
                </div>
                <button
                  onClick={() => { if (confirm("حذف هذا المكان؟")) deletePlace.mutate({ id: p.id } as any); }}
                  disabled={deletePlace.isPending}
                  className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Complaints */}
        {tab === "complaints" && (
          <div className="space-y-3">
            {complaints.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
                <p>لا توجد شكاوى</p>
              </div>
            )}
            {complaints.map((c) => (
              <div key={c.id} className={`bg-card border rounded-xl p-4 ${c.status === "open" ? "border-amber-400/30" : "border-border/50 opacity-60"}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "open" ? "bg-amber-400/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}>
                    {c.status === "open" ? "مفتوحة" : "تم الحل"}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ar-LB")}</span>
                </div>
                {c.placeName && <p className="text-xs text-primary mb-1">📍 {c.placeName}</p>}
                <p className="text-sm mb-2">{c.message}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold">{c.senderName}</span>
                    <span className="mr-2" dir="ltr">{c.senderEmail}</span>
                  </div>
                  <a
                    href={`mailto:${c.senderEmail}?subject=رد على شكواك في دليلك`}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    ردّ بالبريد
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
