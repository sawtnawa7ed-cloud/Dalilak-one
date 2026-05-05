import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Plus, MapPin, CheckCircle, Loader2, Accessibility, List } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useListPlaces, useListGovernorates, useListCities, useCreatePlace, getListPlacesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["مستشفى", "مركز تسوق", "مطعم", "جامعة", "فندق", "متحف", "موقع سياحي", "مطار", "بنك", "مركز صحي", "ملعب رياضي", "حديقة عامة"];

export default function ExpertPanel() {
  const [, navigate] = useLocation();
  const { authUser } = useApp();
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
  const createPlace = useCreatePlace({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListPlacesQueryKey() }) } });

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })); setLocLoading(false); },
      () => { setLocLoading(false); setError("تعذّر الحصول على الموقع"); }
    );
  };

  const submit = async () => {
    setError(""); setSuccess("");
    if (!form.name || !form.address || !form.lat || !form.lng || !form.governorateId || !form.cityId)
      return setError("يرجى ملء جميع الحقول المطلوبة");
    try {
      await createPlace.mutateAsync({ data: {
        name: form.name, category: form.category, address: form.address,
        lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        phone: form.phone || undefined, description: form.description || undefined,
        governorateId: parseInt(form.governorateId), cityId: parseInt(form.cityId),
        areaId: form.areaId ? parseInt(form.areaId) : undefined,
      } } as any);
      setSuccess("تم إضافة المكان بنجاح!");
      setForm({ name: "", category: "مستشفى", address: "", lat: "", lng: "", phone: "", description: "", governorateId: "", cityId: "", areaId: "" });
      setTab("places");
    } catch (e: any) { setError(e.message || "حدث خطأ"); }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!authUser || authUser.role === "visitor") {
    return (
      <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
        <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col items-center justify-center gap-4">
          <Accessibility size={48} className="text-muted-foreground" />
          <p className="font-bold text-muted-foreground">صفحة الخبراء فقط</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold">العودة</button>
        </div>
      </div>
    );
  }

  if (authUser.role === "expert" && authUser.status !== "approved") {
    return (
      <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
        <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-6xl">⏳</div>
          <p className="font-bold text-amber-400 text-lg">حسابك قيد المراجعة</p>
          <p className="text-sm text-muted-foreground">في انتظار موافقة المدير على طلبك</p>
          <button onClick={() => navigate("/")} className="mt-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold">العودة</button>
        </div>
      </div>
    );
  }

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
              <h1 className="font-black text-primary text-base leading-none">لوحة الخبير</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">{authUser.name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Accessibility size={18} className="text-primary" />
            </div>
          </div>

          <div className="flex border-t border-border/40">
            {([["places", "الأماكن", List], ["add", "إضافة مكان", Plus]] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => { setTab(key); setError(""); setSuccess(""); }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${tab === key ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}>
                <Icon size={18} className={tab === key ? "stroke-[2.5]" : "stroke-[1.8]"} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Places list */}
        {tab === "places" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {success && <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/30 rounded-xl p-3 text-center">{success}</p>}
            <p className="text-xs text-muted-foreground">{places.length} مكان مسجل في المنصة</p>
            {places.map((p) => (
              <div key={p.id} className="bg-card border border-border/50 rounded-xl p-3 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigate(`/place/${p.id}`)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
                      {p.isVerified && <CheckCircle size={12} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.governorateName}{p.cityName ? ` · ${p.cityName}` : ""}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ${p.isVerified ? "bg-primary/10 text-primary" : "bg-amber-400/10 text-amber-400"}`}>
                    {p.isVerified ? "موثق" : "غير موثق"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add place form */}
        {tab === "add" && (
          <div className="flex-1 overflow-y-auto p-4 pb-8">
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">اسم المكان *</label>
                  <input value={form.name} onChange={set("name")} placeholder="مثال: مستشفى الأمريكية الجامعية"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الفئة *</label>
                  <select value={form.category} onChange={set("category")}
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">المحافظة *</label>
                  <select value={form.governorateId} onChange={(e) => setForm(f => ({ ...f, governorateId: e.target.value, cityId: "" }))}
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                    <option value="">اختر المحافظة</option>
                    {governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                {form.governorateId && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block">المدينة / القضاء *</label>
                    <select value={form.cityId} onChange={set("cityId")}
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                      <option value="">اختر المدينة</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">العنوان *</label>
                  <input value={form.address} onChange={set("address")} placeholder="الشارع والحي"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الموقع الجغرافي *</label>
                  <div className="flex gap-2 mb-2">
                    <input value={form.lat} onChange={set("lat")} placeholder="خط العرض"
                      className="flex-1 bg-card border border-border rounded-xl py-3 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" dir="ltr" />
                    <input value={form.lng} onChange={set("lng")} placeholder="خط الطول"
                      className="flex-1 bg-card border border-border rounded-xl py-3 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" dir="ltr" />
                  </div>
                  <button onClick={getLocation} disabled={locLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary font-bold rounded-xl text-sm border border-primary/20 active:scale-[0.98] transition-transform disabled:opacity-60">
                    {locLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                    {locLoading ? "جاري تحديد موقعك..." : "استخدم موقعي الحالي"}
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">رقم الهاتف (اختياري)</label>
                  <input value={form.phone} onChange={set("phone")} placeholder="01-000000"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" dir="ltr" />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">وصف المكان (اختياري)</label>
                  <textarea value={form.description} onChange={set("description")} rows={3}
                    placeholder="وصف مختصر عن المكان ومستوى إمكانية الوصول..."
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
                </div>
              </div>

              {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>}

              <button onClick={submit} disabled={createPlace.isPending}
                className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60">
                {createPlace.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                إضافة المكان
              </button>
              <p className="text-xs text-muted-foreground text-center">بعد الإضافة، أضف تقييماً وصوراً من صفحة المكان</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
