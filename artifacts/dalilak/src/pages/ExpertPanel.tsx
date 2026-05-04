import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Plus, MapPin, CheckCircle, Loader2, Accessibility } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useListPlaces, useListGovernorates, useListCities, useCreatePlace, getListPlacesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ExpertPanel() {
  const [, navigate] = useLocation();
  const { authUser, authToken } = useApp();
  const [tab, setTab] = useState<"places" | "add">("places");
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "", category: "مستشفى", address: "", lat: "", lng: "",
    phone: "", description: "", governorateId: "", cityId: "", areaId: "",
  });
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: places = [] } = useListPlaces({});
  const { data: governorates = [] } = useListGovernorates();
  const { data: cities = [] } = useListCities({ governorateId: form.governorateId ? Number(form.governorateId) : undefined });
  const createPlace = useCreatePlace({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPlacesQueryKey() }); } } });

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
        setError("تعذّر الحصول على الموقع");
      }
    );
  };

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!form.name || !form.address || !form.lat || !form.lng || !form.governorateId || !form.cityId) {
      return setError("يرجى ملء جميع الحقول المطلوبة");
    }
    try {
      await createPlace.mutateAsync({
        data: {
          name: form.name,
          category: form.category,
          address: form.address,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          phone: form.phone || undefined,
          description: form.description || undefined,
          governorateId: parseInt(form.governorateId),
          cityId: parseInt(form.cityId),
          areaId: form.areaId ? parseInt(form.areaId) : undefined,
        },
      } as any);
      setSuccess("تم إضافة المكان بنجاح!");
      setForm({ name: "", category: "مستشفى", address: "", lat: "", lng: "", phone: "", description: "", governorateId: "", cityId: "", areaId: "" });
      setTab("places");
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    }
  };

  if (!authUser || authUser.role === "visitor") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir="rtl">
        <Accessibility size={48} className="text-muted-foreground" />
        <p className="font-bold text-muted-foreground">صفحة الخبراء فقط</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">العودة</button>
      </div>
    );
  }

  if (authUser.role === "expert" && authUser.status !== "approved") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
        <div className="text-5xl">⏳</div>
        <p className="font-bold text-amber-400">حسابك قيد المراجعة</p>
        <p className="text-sm text-muted-foreground">في انتظار موافقة المدير على طلبك</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">العودة</button>
      </div>
    );
  }

  const CATEGORIES = ["مستشفى", "مركز تسوق", "مطعم", "جامعة", "فندق", "متحف", "موقع سياحي", "مطار", "بنك", "مركز صحي", "ملعب رياضي", "حديقة عامة"];

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/")} className="w-9 h-9 bg-card rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground border border-border">
            <ArrowRight size={18} />
          </button>
          <div>
            <h1 className="font-black text-primary text-lg leading-none">لوحة الخبير</h1>
            <p className="text-xs text-muted-foreground">{authUser.name}</p>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-3">
          {[["places", "الأماكن"], ["add", "إضافة مكان"]] .map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key as any); setError(""); setSuccess(""); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}
            >
              {key === "add" && <Plus size={13} className="inline ml-1" />}
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 pb-10">
        {/* Places list */}
        {tab === "places" && (
          <div className="space-y-3">
            {success && <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/30 rounded-xl p-3 text-center">{success}</p>}
            <p className="text-xs text-muted-foreground">{places.length} مكان مسجل في المنصة</p>
            {places.map((p) => (
              <div
                key={p.id}
                className="bg-card border border-border/50 rounded-xl p-3 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/place/${p.id}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
                      {p.isVerified && <CheckCircle size={12} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.category} · {p.governorateName}{p.cityName ? ` · ${p.cityName}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${p.isVerified ? "bg-primary/10 text-primary" : "bg-amber-400/10 text-amber-400"}`}>
                    {p.isVerified ? "موثق" : "غير موثق"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add place */}
        {tab === "add" && (
          <div className="space-y-4 max-w-lg mx-auto">
            <h2 className="font-black text-base">إضافة مكان جديد</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">اسم المكان *</label>
                <input value={form.name} onChange={set("name")} placeholder="مثال: مستشفى الأمريكية الجامعية"
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">الفئة *</label>
                <select value={form.category} onChange={set("category")}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">المحافظة *</label>
                <select value={form.governorateId} onChange={(e) => { setForm(f => ({ ...f, governorateId: e.target.value, cityId: "" })); }}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                  <option value="">اختر المحافظة</option>
                  {governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              {form.governorateId && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">المدينة / القضاء *</label>
                  <select value={form.cityId} onChange={set("cityId")}
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                    <option value="">اختر المدينة</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">العنوان *</label>
                <input value={form.address} onChange={set("address")} placeholder="الشارع والحي"
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">الإحداثيات (خط العرض، خط الطول) *</label>
                <div className="flex gap-2">
                  <input value={form.lat} onChange={set("lat")} placeholder="خط العرض (Latitude)"
                    className="flex-1 bg-card border border-border rounded-xl py-3 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" dir="ltr" />
                  <input value={form.lng} onChange={set("lng")} placeholder="خط الطول (Longitude)"
                    className="flex-1 bg-card border border-border rounded-xl py-3 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" dir="ltr" />
                </div>
                <button onClick={getLocation} disabled={locLoading}
                  className="mt-2 flex items-center gap-1 text-xs text-primary font-bold hover:opacity-80 transition-opacity disabled:opacity-60">
                  {locLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                  استخدم موقعي الحالي
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">رقم الهاتف (اختياري)</label>
                <input value={form.phone} onChange={set("phone")} placeholder="01-000000"
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" dir="ltr" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">وصف المكان (اختياري)</label>
                <textarea value={form.description} onChange={set("description")} rows={3}
                  placeholder="وصف مختصر عن المكان ومستوى إمكانية الوصول..."
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>}

            <button
              onClick={submit}
              disabled={createPlace.isPending}
              className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createPlace.isPending && <Loader2 size={16} className="animate-spin" />}
              إضافة المكان
            </button>

            <p className="text-xs text-muted-foreground text-center">
              بعد إضافة المكان، يمكنك إضافة تقييم ميداني وصور من صفحة المكان
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
