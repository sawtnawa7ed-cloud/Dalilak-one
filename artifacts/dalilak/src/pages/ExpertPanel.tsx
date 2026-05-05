import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Plus, MapPin, CheckCircle, Loader2, Accessibility, List, Navigation } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useListPlaces, useListGovernorates, useListCities } from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api";

const CATEGORIES = ["مستشفى", "مركز تسوق", "مطعم", "جامعة", "فندق", "متحف", "موقع سياحي", "مطار", "بنك", "مركز صحي", "ملعب رياضي", "حديقة عامة", "مسجد", "كنيسة", "أخرى"];

/* ── Leaflet map picker ── */
function MapPicker({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    import("leaflet").then(L => {
      // Fix default icon path issue with bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initLat = lat ? parseFloat(lat) : 33.8938;
      const initLng = lng ? parseFloat(lng) : 35.5018;

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([initLat, initLng], lat ? 15 : 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      if (lat && lng) {
        markerRef.current = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
      }

      map.on("click", (e: any) => {
        const { lat: la, lng: ln } = e.latlng;
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([la, ln]).addTo(map);
        onChange(la.toFixed(6), ln.toFixed(6));
      });

      leafletMap.current = map;
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update marker if lat/lng change externally (e.g. GPS)
  useEffect(() => {
    if (!leafletMap.current || !lat || !lng) return;
    import("leaflet").then(L => {
      const la = parseFloat(lat); const ln = parseFloat(lng);
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([la, ln]).addTo(leafletMap.current);
      leafletMap.current.setView([la, ln], 15);
    });
  }, [lat, lng]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-primary/30" style={{ height: 240 }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      {!lat && (
        <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none z-[500]">
          <span className="bg-black/70 text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
            📍 اضغط على الخريطة لتحديد موقع المكان
          </span>
        </div>
      )}
    </div>
  );
}

export default function ExpertPanel() {
  const [, navigate] = useLocation();
  const { authUser, authToken } = useApp();
  const [tab, setTab] = useState<"places" | "add">("places");

  const [form, setForm] = useState({
    name: "", category: "مستشفى", customCategory: "", address: "", lat: "", lng: "",
    phone: "", description: "", governorateId: "", cityId: "", areaId: "",
  });
  const [locLoading, setLocLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: places = [], refetch: refetchPlaces } = useListPlaces({});
  const { data: governorates = [] } = useListGovernorates();
  const { data: cities = [] } = useListCities({ governorateId: form.governorateId ? Number(form.governorateId) : undefined });

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLocLoading(false);
      },
      () => { setLocLoading(false); setError("تعذّر الحصول على الموقع"); }
    );
  };

  const submit = async () => {
    setError(""); setSuccess("");
    if (!form.name.trim()) return setError("اسم المكان مطلوب");
    if (!form.address.trim()) return setError("العنوان مطلوب");
    if (!form.lat || !form.lng) return setError("يرجى تحديد موقع المكان على الخريطة");
    if (!form.governorateId) return setError("اختر المحافظة");
    if (!form.cityId) return setError("اختر المدينة / القضاء");
    const finalCategory = form.category === "أخرى" ? form.customCategory.trim() : form.category;
    if (!finalCategory) return setError("أدخل اسم الفئة المخصصة");
    setSaving(true);
    try {
      await apiFetch("/places", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          category: finalCategory,
          address: form.address.trim(),
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          phone: form.phone || undefined,
          description: form.description || undefined,
          governorateId: parseInt(form.governorateId),
          cityId: parseInt(form.cityId),
          areaId: form.areaId ? parseInt(form.areaId) : undefined,
        }),
      }, authToken);
      await refetchPlaces();
      setSuccess("✅ تم إضافة المكان بنجاح! يمكنك الآن إضافة تقييم وصور من صفحة المكان.");
      setForm({ name: "", category: "مستشفى", customCategory: "", address: "", lat: "", lng: "", phone: "", description: "", governorateId: "", cityId: "", areaId: "" });
      setTab("places");
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (!authUser || authUser.role === "visitor") {
    return (
      <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
        <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col items-center justify-center gap-4">
          <Accessibility size={48} className="text-muted-foreground" />
          <p className="font-bold text-muted-foreground">هذه الصفحة للخبراء فقط</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold">العودة</button>
        </div>
      </div>
    );
  }

  if (authUser.status === "rejected") {
    return (
      <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
        <div className="w-full max-w-[430px] bg-background min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-6xl">🚫</div>
          <p className="font-bold text-red-400 text-lg">حسابك موقوف</p>
          <p className="text-sm text-muted-foreground">تواصل مع مدير التطبيق لإعادة التفعيل</p>
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
            <button onClick={() => navigate("/")}
              className="w-9 h-9 bg-card rounded-full flex items-center justify-center text-muted-foreground border border-border">
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

        {/* ── Places list ── */}
        {tab === "places" && (
          <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-3">
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
                <p className="text-sm text-green-400 font-bold">{success}</p>
                <button onClick={() => setSuccess("")} className="text-xs text-muted-foreground mt-2 underline">إغلاق</button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{places.length} مكان مسجل في المنصة</p>
            {places.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold">لا توجد أماكن بعد</p>
                <p className="text-xs mt-1">اضغط على "إضافة مكان" لإضافة أول مكان</p>
              </div>
            )}
            {places.map(p => (
              <div key={p.id} className="bg-card border border-border/50 rounded-xl p-3 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigate(`/place/${p.id}`)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
                      {p.isVerified && <CheckCircle size={12} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.category} · {p.governorateName}{p.cityName ? ` · ${p.cityName}` : ""}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ${p.isVerified ? "bg-primary/10 text-primary" : "bg-amber-400/10 text-amber-400"}`}>
                    {p.isVerified ? "موثق" : "غير موثق"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Add place form ── */}
        {tab === "add" && (
          <div className="flex-1 overflow-y-auto p-4 pb-10 space-y-4">

            {/* Name */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">اسم المكان *</label>
              <input value={form.name} onChange={setF("name")} placeholder="مثال: مستشفى الأمريكية الجامعية"
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الفئة *</label>
              <select value={form.category} onChange={setF("category")}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.category === "أخرى" && (
                <input
                  value={form.customCategory}
                  onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))}
                  placeholder="اكتب اسم الفئة، مثال: مسجد، كنيسة، دار رعاية..."
                  className="mt-2 w-full bg-card border border-primary/40 rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              )}
            </div>

            {/* Governorate */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">المحافظة *</label>
              <select value={form.governorateId}
                onChange={e => setForm(f => ({ ...f, governorateId: e.target.value, cityId: "", areaId: "" }))}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                <option value="">اختر المحافظة</option>
                {governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* City */}
            {form.governorateId && (
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">المدينة / القضاء *</label>
                <select value={form.cityId} onChange={setF("cityId")}
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground">
                  <option value="">اختر المدينة</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">العنوان التفصيلي *</label>
              <input value={form.address} onChange={setF("address")} placeholder="الشارع والحي"
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>

            {/* Map */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button onClick={getLocation} disabled={locLoading}
                  className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl disabled:opacity-60">
                  {locLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  {locLoading ? "جاري التحديد..." : "موقعي الحالي"}
                </button>
                <label className="text-xs font-bold text-muted-foreground">
                  الموقع على الخريطة *
                  {form.lat && form.lng && (
                    <span className="text-primary mr-1 font-mono text-[10px]">{parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}</span>
                  )}
                </label>
              </div>
              <MapPicker
                lat={form.lat} lng={form.lng}
                onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
              />
              {form.lat && form.lng && (
                <p className="text-[10px] text-green-400 mt-1 text-center">✅ تم تحديد الموقع — يمكنك الضغط مجدداً لتغييره</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">رقم الهاتف (اختياري)</label>
              <input value={form.phone} onChange={setF("phone")} placeholder="01-000000" dir="ltr"
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">وصف المكان (اختياري)</label>
              <textarea value={form.description} onChange={setF("description")} rows={3}
                placeholder="وصف مختصر عن المكان ومستوى إمكانية الوصول..."
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">{error}</p>
            )}

            <button onClick={submit} disabled={saving}
              className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? "جاري الحفظ..." : "إضافة المكان"}
            </button>

            <p className="text-xs text-muted-foreground text-center pb-4">
              بعد الإضافة، أضف تقييماً وصوراً من صفحة المكان
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
