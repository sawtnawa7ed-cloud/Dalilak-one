import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  Search, Heart, MapPin, Star, CheckCircle, X,
  ChevronDown, SlidersHorizontal, Navigation, LogIn,
  UserCircle, LogOut, ShieldCheck, Accessibility
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useListPlaces, useListGovernorates, useListCities } from "@workspace/api-client-react";
import type { Place as ApiPlace } from "@workspace/api-client-react";
import { AuthModal } from "./AuthModal";
import { ComplaintModal } from "./ComplaintModal";

const CATEGORIES = ["الكل", "مستشفى", "مركز تسوق", "مطعم", "جامعة", "فندق", "متحف", "موقع سياحي", "مطار", "بنك", "مركز صحي", "ملعب رياضي", "حديقة عامة"];

function featuresList(p: ApiPlace): string[] {
  const f: string[] = [];
  if (p.hasRamp) f.push("منحدر للكراسي");
  if (p.hasElevator) f.push("مصعد");
  if (p.hasAccessibleBathroom) f.push("حمام مناسب");
  if (p.hasAccessibleParking) f.push("موقف مناسب");
  return f;
}

export function MainApp() {
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, favorites, toggleFavorite, authUser, logout, filters, setFilters } = useApp();
  const [, navigate] = useLocation();
  const [showFavs, setShowFavs] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: governorates = [] } = useListGovernorates();
  const { data: cities = [] } = useListCities({ governorateId: filters.governorateId });

  const queryParams = {
    ...(filters.governorateId ? { governorateId: filters.governorateId } : {}),
    ...(filters.cityId ? { cityId: filters.cityId } : {}),
    ...(activeCategory !== "الكل" ? { category: activeCategory } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  };

  const { data: places = [], isLoading } = useListPlaces(queryParams);

  const displayPlaces = showFavs ? places.filter((p) => favorites.includes(p.id)) : places;
  const featured = places.filter((p) => p.isVerified && (p.avgRating ?? 0) >= 4).slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavs(!showFavs)}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showFavs ? "bg-red-500/20 text-red-400" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <Heart size={18} className={showFavs ? "fill-red-400" : ""} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{favorites.length}</span>
              )}
            </button>
            <button
              onClick={() => setShowComplaintModal(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-card text-muted-foreground hover:text-foreground transition-colors"
              title="تقديم شكوى"
            >
              <span className="text-base">📢</span>
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-black text-primary leading-none">دليلك</h1>
            <p className="text-[10px] text-muted-foreground">إمكانية الوصول في لبنان</p>
          </div>

          <div className="flex items-center gap-2">
            {authUser ? (
              <div className="flex items-center gap-1">
                {authUser.role === "admin" && (
                  <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-colors" title="لوحة المدير">
                    <ShieldCheck size={18} />
                  </button>
                )}
                {authUser.role === "expert" && (
                  <button onClick={() => navigate("/expert")} className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-colors" title="لوحة الخبير">
                    <Accessibility size={18} />
                  </button>
                )}
                <button onClick={logout} className="w-9 h-9 rounded-xl flex items-center justify-center bg-card text-muted-foreground hover:text-foreground transition-colors" title="تسجيل الخروج">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                <LogIn size={14} />
                دخول
              </button>
            )}
          </div>
        </div>

        {authUser && (
          <div className="px-4 pb-1">
            <p className="text-xs text-muted-foreground">
              مرحباً، <span className="text-primary font-bold">{authUser.name}</span>
              {authUser.role === "admin" && " (مدير)"}
              {authUser.role === "expert" && " (خبير)"}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-2 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
            <input
              type="text"
              placeholder="ابحث عن مكان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2.5 pr-9 pl-8 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${showFilters || filters.governorateId ? "bg-primary/20 border-primary/40 text-primary" : "bg-card border-border text-muted-foreground"}`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Location filter */}
        {showFilters && (
          <div className="px-4 pb-3 flex gap-2">
            <select
              value={filters.governorateId ?? ""}
              onChange={(e) => setFilters({ governorateId: e.target.value ? Number(e.target.value) : undefined })}
              className="flex-1 bg-card border border-border rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground"
            >
              <option value="">كل المحافظات</option>
              {governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {filters.governorateId && (
              <select
                value={filters.cityId ?? ""}
                onChange={(e) => setFilters({ ...filters, cityId: e.target.value ? Number(e.target.value) : undefined })}
                className="flex-1 bg-card border border-border rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-primary/50 text-foreground"
              >
                <option value="">كل المدن</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="pb-10">
        {/* Featured */}
        {!showFavs && !searchQuery && activeCategory === "الكل" && !filters.governorateId && featured.length > 0 && (
          <section className="mt-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <span className="text-xs text-muted-foreground">{featured.length} أماكن</span>
              <h2 className="text-base font-black flex items-center gap-1">
                <Star size={14} className="fill-primary text-primary" />
                أماكن موثقة ومميزة
              </h2>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
              {featured.map((place) => (
                <FeaturedCard key={place.id} place={place} isFav={favorites.includes(place.id)} onFav={() => toggleFavorite(place.id)} onClick={() => navigate(`/place/${place.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Favorites header */}
        {showFavs && (
          <div className="mx-4 mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{displayPlaces.length} مكان</span>
            <h2 className="text-base font-black text-red-400 flex items-center gap-1">
              <Heart size={14} className="fill-red-400" />
              المفضلة
            </h2>
          </div>
        )}

        {/* All places */}
        <section className="mt-5 px-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">{isLoading ? "..." : `${displayPlaces.length} نتيجة`}</span>
            <h2 className="text-base font-black">
              {showFavs ? "المحفوظة" : searchQuery ? "نتائج البحث" : activeCategory === "الكل" ? "جميع الأماكن" : activeCategory}
            </h2>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-card animate-pulse rounded-2xl border border-border/50" />
              ))}
            </div>
          )}

          {!isLoading && displayPlaces.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-bold">{showFavs ? "لا توجد أماكن محفوظة" : "لا توجد نتائج"}</p>
              <p className="text-sm mt-1">جرب البحث بكلمة أخرى أو غير الفلاتر</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {displayPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} isFav={favorites.includes(place.id)} onFav={() => toggleFavorite(place.id)} onClick={() => navigate(`/place/${place.id}`)} />
            ))}
          </div>
        </section>
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showComplaintModal && <ComplaintModal onClose={() => setShowComplaintModal(false)} />}
    </div>
  );
}

function FeaturedCard({ place, isFav, onFav, onClick }: { place: ApiPlace; isFav: boolean; onFav: () => void; onClick: () => void }) {
  const features = featuresList(place);
  return (
    <div className="shrink-0 w-56 bg-card border border-border/50 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-200 hover:scale-[1.01]" onClick={onClick}>
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-4xl">{categoryEmoji(place.category)}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="absolute top-2 left-2 w-7 h-7 bg-background/70 backdrop-blur-sm rounded-full flex items-center justify-center">
          <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : "text-white"} />
        </button>
        <span className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{place.category}</span>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-bold text-sm leading-tight line-clamp-1">{place.name}</h3>
          {place.isVerified && <CheckCircle size={12} className="text-primary shrink-0 mt-0.5" />}
        </div>
        {(place.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} className="fill-primary text-primary" />
            <span className="text-xs font-bold">{place.avgRating?.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 mt-1.5">
          <MapPin size={10} className="text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground line-clamp-1">{place.governorateName ?? ""} {place.cityName ? `· ${place.cityName}` : ""}</span>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {features.slice(0, 2).map((f) => (
              <span key={f} className="bg-primary/10 text-primary text-[9px] font-medium px-1.5 py-0.5 rounded-full">{f}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({ place, isFav, onFav, onClick }: { place: ApiPlace; isFav: boolean; onFav: () => void; onClick: () => void }) {
  const features = featuresList(place);
  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden flex cursor-pointer hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]" onClick={onClick}>
      <div className="relative w-24 shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-3xl">{categoryEmoji(place.category)}</span>
      </div>
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-sm leading-tight line-clamp-1">{place.name}</h3>
              {place.isVerified && <CheckCircle size={11} className="text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground line-clamp-1">{place.governorateName}{place.cityName ? ` · ${place.cityName}` : ""}</span>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="shrink-0 w-7 h-7 rounded-full bg-background/50 flex items-center justify-center">
            <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
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

        {features.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {features.slice(0, 3).map((f) => (
              <span key={f} className="bg-background text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-full border border-border/50">{f}</span>
            ))}
          </div>
        )}

        {/* Quick directions */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, "_blank");
          }}
          className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold hover:opacity-80 transition-opacity"
        >
          <Navigation size={10} />
          خذني إلى هناك
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
