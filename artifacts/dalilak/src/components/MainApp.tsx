import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search, Heart, MapPin, Star, CheckCircle, X,
  Navigation, LogIn, LogOut, ShieldCheck, Accessibility,
  SlidersHorizontal, ChevronDown, UserCircle, Bell
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useListPlaces, useListGovernorates, useListCities } from "@workspace/api-client-react";
import type { Place as ApiPlace } from "@workspace/api-client-react";
import { AuthModal } from "./AuthModal";
import { ComplaintModal } from "./ComplaintModal";
import { BottomNav } from "./BottomNav";

type Tab = "home" | "search" | "favorites" | "profile";

const BASE_CATEGORIES = ["مستشفى", "مركز تسوق", "مطعم", "جامعة", "فندق", "متحف", "موقع سياحي", "مطار", "بنك", "مركز صحي", "ملعب رياضي", "حديقة عامة", "مسجد", "كنيسة"];

function featuresList(p: ApiPlace): string[] {
  const f: string[] = [];
  if (p.hasRamp) f.push("♿ منحدر");
  if (p.hasElevator) f.push("🛗 مصعد");
  if (p.hasAccessibleBathroom) f.push("🚽 حمام");
  if (p.hasWideSpace) f.push("📐 مساحة");
  if (p.hasGoodStaff) f.push("🤝 موظفون");
  if (p.hasIndoorSigns) f.push("🪧 إرشادات");
  return f;
}

export function MainApp() {
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, favorites, toggleFavorite, authUser, logout, filters, setFilters } = useApp();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const { data: governorates = [] } = useListGovernorates();
  const { data: cities = [] } = useListCities({ governorateId: filters.governorateId });

  const queryParams = {
    ...(filters.governorateId ? { governorateId: filters.governorateId } : {}),
    ...(filters.cityId ? { cityId: filters.cityId } : {}),
    ...(activeCategory !== "الكل" ? { category: activeCategory } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  };

  const { data: places = [], isLoading } = useListPlaces(queryParams);
  const { data: allPlaces = [] } = useListPlaces({});

  const featured = allPlaces.filter((p) => p.isVerified && (p.avgRating ?? 0) >= 4).slice(0, 6);
  const favPlaces = allPlaces.filter((p) => favorites.includes(p.id));
  const displayPlaces = places;

  // Build dynamic categories: base list + any custom ones found in places
  const dynamicCategories = ["الكل", ...Array.from(new Set([
    ...BASE_CATEGORIES,
    ...allPlaces.map(p => p.category).filter(Boolean),
  ]))];

  return (
    <div className="flex justify-center bg-[#060606] min-h-screen" dir="rtl">
      <div className="w-full max-w-[430px] relative bg-background min-h-screen flex flex-col">

        {/* ─── HOME TAB ─── */}
        {tab === "home" && (
          <div className="flex-1 overflow-y-auto pb-28">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 pt-5 pb-3">
              <div className="flex items-center justify-between mb-1">
                <button onClick={() => setShowComplaintModal(true)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Bell size={17} />
                </button>
                <div className="text-center">
                  <h1 className="text-lg font-black text-primary leading-none tracking-wide">دليلك ♿</h1>
                  <p className="text-[9px] text-muted-foreground mt-0.5">إمكانية الوصول في لبنان</p>
                </div>
                <button onClick={() => setTab("search")} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Search size={17} />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 px-4 pt-4 pb-1 overflow-x-auto scrollbar-hide">
              {dynamicCategories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border/60 text-muted-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Featured */}
            {activeCategory === "الكل" && featured.length > 0 && (
              <section className="mt-5">
                <div className="flex items-center justify-between px-4 mb-3">
                  <span className="text-xs text-muted-foreground">{featured.length} مكان</span>
                  <h2 className="text-sm font-black flex items-center gap-1">
                    <Star size={13} className="fill-primary text-primary" /> موثقة ومميزة
                  </h2>
                </div>
                <div className="flex gap-3 px-4 overflow-x-auto pb-1 scrollbar-hide">
                  {featured.map((place) => (
                    <FeaturedCard key={place.id} place={place} isFav={favorites.includes(place.id)}
                      onFav={() => toggleFavorite(place.id)} onClick={() => navigate(`/place/${place.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* All places */}
            <section className="mt-5 px-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{isLoading ? "..." : `${displayPlaces.length} نتيجة`}</span>
                <h2 className="text-sm font-black">
                  {activeCategory === "الكل" ? "جميع الأماكن" : activeCategory}
                </h2>
              </div>
              {isLoading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-2xl" />)}</div>}
              {!isLoading && displayPlaces.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="font-bold">لا توجد نتائج</p>
                </div>
              )}
              <div className="space-y-3">
                {displayPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} isFav={favorites.includes(place.id)}
                    onFav={() => toggleFavorite(place.id)} onClick={() => navigate(`/place/${place.id}`)} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ─── SEARCH TAB ─── */}
        {tab === "search" && (
          <div className="flex-1 flex flex-col pb-28">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 pt-5 pb-3 space-y-3">
              <h2 className="text-base font-black text-center">البحث عن مكان</h2>

              {/* Search input */}
              <div className="relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {localSearch && (
                  <button onClick={() => { setLocalSearch(""); setSearchQuery(""); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <X size={14} />
                  </button>
                )}
                <input
                  type="text"
                  placeholder="ابحث عن مكان..."
                  value={localSearch}
                  onChange={(e) => { setLocalSearch(e.target.value); setSearchQuery(e.target.value); }}
                  className="w-full bg-card border border-border rounded-2xl py-3 pr-9 pl-8 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select value={filters.governorateId ?? ""} onChange={(e) => setFilters({ governorateId: e.target.value ? Number(e.target.value) : undefined })}
                  className="flex-1 bg-card border border-border rounded-xl py-2 px-3 text-xs text-right focus:outline-none text-foreground">
                  <option value="">كل المحافظات</option>
                  {governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                {filters.governorateId && (
                  <select value={filters.cityId ?? ""} onChange={(e) => setFilters({ ...filters, cityId: e.target.value ? Number(e.target.value) : undefined })}
                    className="flex-1 bg-card border border-border rounded-xl py-2 px-3 text-xs text-right focus:outline-none text-foreground">
                    <option value="">كل المدن</option>
                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                {dynamicCategories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border/60 text-muted-foreground"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3">
              {isLoading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-2xl" />)}</div>}
              {!isLoading && displayPlaces.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="font-bold">{localSearch ? "لا توجد نتائج" : "ابدأ بالبحث أعلاه"}</p>
                </div>
              )}
              {displayPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} isFav={favorites.includes(place.id)}
                  onFav={() => toggleFavorite(place.id)} onClick={() => navigate(`/place/${place.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ─── FAVORITES TAB ─── */}
        {tab === "favorites" && (
          <div className="flex-1 overflow-y-auto pb-28">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 pt-5 pb-3">
              <h2 className="text-base font-black text-center flex items-center justify-center gap-2">
                <Heart size={16} className="fill-red-400 text-red-400" /> المفضلة
              </h2>
            </div>
            <div className="px-4 pt-4 space-y-3">
              {favPlaces.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-4">🤍</div>
                  <p className="font-bold">لا توجد أماكن محفوظة</p>
                  <p className="text-sm mt-1">اضغط على ❤️ لحفظ مكان</p>
                </div>
              ) : (
                favPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} isFav={true}
                    onFav={() => toggleFavorite(place.id)} onClick={() => navigate(`/place/${place.id}`)} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── PROFILE TAB ─── */}
        {tab === "profile" && (
          <div className="flex-1 overflow-y-auto pb-28">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 pt-5 pb-3">
              <h2 className="text-base font-black text-center">حسابي</h2>
            </div>
            <div className="px-4 pt-6 space-y-3">
              {authUser ? (
                <>
                  {/* User card */}
                  <div className={`border rounded-2xl p-5 flex items-center gap-4 ${authUser.role === "admin" ? "bg-red-500/5 border-red-500/20" : authUser.role === "expert" ? "bg-primary/5 border-primary/20" : "bg-card border-border/50"}`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${authUser.role === "admin" ? "bg-red-500/10" : "bg-primary/10"}`}>
                      {authUser.role === "admin"
                        ? <ShieldCheck size={28} className="text-red-400" />
                        : authUser.role === "expert"
                        ? <Accessibility size={28} className="text-primary" />
                        : <UserCircle size={28} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-base truncate">{authUser.name}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        authUser.role === "admin" ? "bg-red-500/20 text-red-400" :
                        authUser.role === "expert" ? "bg-primary/20 text-primary" :
                        "bg-card border border-border text-muted-foreground"}`}>
                        {authUser.role === "admin" ? "🔐 مدير النظام" : authUser.role === "expert" ? "🏢 خبير / جمعية" : "زائر"}
                      </span>
                    </div>
                  </div>

                  {/* Admin panel */}
                  {authUser.role === "admin" && (
                    <button onClick={() => navigate("/admin")}
                      className="w-full flex items-center gap-3 bg-card border border-border/50 rounded-2xl px-4 py-4 hover:border-red-400/40 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} className="text-red-400" />
                      </div>
                      <div className="text-right flex-1">
                        <p className="font-bold text-sm">لوحة المدير</p>
                        <p className="text-xs text-muted-foreground">إدارة الخبراء والأماكن والشكاوى</p>
                      </div>
                    </button>
                  )}

                  {/* Expert panel */}
                  {authUser.role === "expert" && (
                    <button onClick={() => navigate("/expert")}
                      className="w-full flex items-center gap-3 bg-card border border-border/50 rounded-2xl px-4 py-4 hover:border-primary/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Accessibility size={20} className="text-primary" />
                      </div>
                      <div className="text-right flex-1">
                        <p className="font-bold text-sm">لوحة الخبير</p>
                        <p className="text-xs text-muted-foreground">إضافة الأماكن وتقييمها</p>
                      </div>
                    </button>
                  )}

                  {/* Complaint */}
                  <button onClick={() => setShowComplaintModal(true)}
                    className="w-full flex items-center gap-3 bg-card border border-border/50 rounded-2xl px-4 py-4 hover:border-amber-400/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <span className="text-xl">📢</span>
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-bold text-sm">تقديم شكوى أو اقتراح</p>
                      <p className="text-xs text-muted-foreground">أبلغنا عن مشكلة في مكان ما</p>
                    </div>
                  </button>

                  {/* Logout */}
                  <button onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-2xl text-sm hover:bg-red-500/20 transition-colors">
                    <LogOut size={16} /> تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  {/* Not logged in — visitor can still use the app */}
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-card border border-border mx-auto flex items-center justify-center mb-4">
                      <UserCircle size={40} className="text-muted-foreground" />
                    </div>
                    <p className="font-black text-base">أهلاً بك في دليلك ♿</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      يمكنك التصفح وتقديم الشكاوى بدون حساب
                    </p>
                  </div>

                  {/* Complaint — always accessible */}
                  <button onClick={() => setShowComplaintModal(true)}
                    className="w-full flex items-center gap-3 bg-card border border-amber-400/30 rounded-2xl px-4 py-4 hover:border-amber-400/60 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <span className="text-xl">📢</span>
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-bold text-sm">تقديم شكوى أو اقتراح</p>
                      <p className="text-xs text-muted-foreground">لا تحتاج حساباً لتقديم شكوى</p>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-border/40" />
                    <p className="text-[11px] text-muted-foreground">للمدير والخبراء فقط</p>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>

                  {/* Admin login */}
                  <button onClick={() => setShowAuthModal(true)}
                    className="w-full flex items-center gap-3 bg-card border border-border/50 rounded-2xl px-4 py-4 hover:border-red-400/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} className="text-red-400" />
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-bold text-sm">دخول المدير</p>
                      <p className="text-xs text-muted-foreground">إدارة التطبيق والخبراء</p>
                    </div>
                    <LogIn size={16} className="text-muted-foreground shrink-0" />
                  </button>

                  {/* Expert login */}
                  <button onClick={() => setShowAuthModal(true)}
                    className="w-full flex items-center gap-3 bg-card border border-border/50 rounded-2xl px-4 py-4 hover:border-primary/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Accessibility size={20} className="text-primary" />
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-bold text-sm">دخول الخبراء والجمعيات</p>
                      <p className="text-xs text-muted-foreground">أدخل اسم المستخدم وكلمة المرور</p>
                    </div>
                    <LogIn size={16} className="text-muted-foreground shrink-0" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <BottomNav active={tab} onChange={setTab} favCount={favorites.length} />

        {/* Modals */}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        {showComplaintModal && <ComplaintModal onClose={() => setShowComplaintModal(false)} />}
      </div>
    </div>
  );
}

function FeaturedCard({ place, isFav, onFav, onClick }: { place: ApiPlace; isFav: boolean; onFav: () => void; onClick: () => void }) {
  return (
    <div className="shrink-0 w-48 bg-card border border-border/50 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className="relative h-28 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-4xl">{categoryEmoji(place.category)}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="absolute top-2 left-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
          <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : "text-white"} />
        </button>
        <span className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">{place.category}</span>
      </div>
      <div className="p-3">
        <div className="flex items-start gap-1">
          <h3 className="font-bold text-xs leading-tight line-clamp-1 flex-1">{place.name}</h3>
          {place.isVerified && <CheckCircle size={11} className="text-primary shrink-0 mt-0.5" />}
        </div>
        {(place.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} className="fill-primary text-primary" />
            <span className="text-[11px] font-bold">{place.avgRating?.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={9} className="text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground line-clamp-1">{place.governorateName ?? ""}{place.cityName ? ` · ${place.cityName}` : ""}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {featuresList(place).slice(0, 2).map((f) => (
            <span key={f} className="bg-primary/10 text-primary text-[9px] font-medium px-1.5 py-0.5 rounded-full">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceCard({ place, isFav, onFav, onClick }: { place: ApiPlace; isFav: boolean; onFav: () => void; onClick: () => void }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden flex cursor-pointer active:scale-[0.99] transition-transform hover:border-primary/40" onClick={onClick}>
      <div className="w-20 shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-3xl">{categoryEmoji(place.category)}</span>
      </div>
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-sm line-clamp-1">{place.name}</h3>
              {place.isVerified && <CheckCircle size={11} className="text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={9} className="text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground line-clamp-1">{place.governorateName}{place.cityName ? ` · ${place.cityName}` : ""}</span>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
            <Heart size={14} className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {(place.avgRating ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Star size={11} className="fill-primary text-primary" />
              <span className="text-xs font-bold">{place.avgRating?.toFixed(1)}</span>
              {(place.reviewCount ?? 0) > 0 && <span className="text-[10px] text-muted-foreground">({place.reviewCount})</span>}
            </div>
          )}
          <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{place.category}</span>
        </div>
        {featuresList(place).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {featuresList(place).slice(0, 3).map((f) => (
              <span key={f} className="bg-background text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-full border border-border/50">{f}</span>
            ))}
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, "_blank"); }}
          className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-bold">
          <Navigation size={10} /> خذني إلى هناك
        </button>
      </div>
    </div>
  );
}

function categoryEmoji(cat: string | undefined): string {
  const map: Record<string, string> = {
    "مستشفى": "🏥", "مطار": "✈️", "مركز تسوق": "🛍️", "جامعة": "🎓", "مطعم": "🍽️",
    "فندق": "🏨", "متحف": "🏛️", "موقع سياحي": "🗺️", "بنك": "🏦", "مركز صحي": "💊",
    "ملعب رياضي": "⚽", "حديقة عامة": "🌳",
  };
  return map[cat ?? ""] ?? "📍";
}
