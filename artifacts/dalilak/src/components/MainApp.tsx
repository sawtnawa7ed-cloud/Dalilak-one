import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Heart, MapPin, Star, CheckCircle, Filter, X, Menu } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CATEGORIES } from "@/data/places";
import type { Place } from "@/data/places";

export function MainApp() {
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredPlaces,
    favorites,
    toggleFavorite,
    disabilities,
  } = useApp();

  const [, navigate] = useLocation();
  const [showFavs, setShowFavs] = useState(false);

  const displayPlaces = showFavs
    ? filteredPlaces.filter((p) => favorites.includes(p.id))
    : filteredPlaces;

  const featured = filteredPlaces.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavs(!showFavs)}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                showFavs ? "bg-red-500/20 text-red-400" : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart size={18} className={showFavs ? "fill-red-400" : ""} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-black text-primary leading-none">دليلك</h1>
            <p className="text-[10px] text-muted-foreground">إمكانية الوصول في لبنان</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl">♿</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
            <input
              type="text"
              placeholder="ابحث عن مكان، منطقة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2.5 pr-9 pl-8 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground scale-105"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="pb-10">
        {/* Disabilities banner */}
        {disabilities.length > 0 && (
          <div className="mx-4 mt-4 p-3 bg-primary/10 border border-primary/30 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-primary shrink-0" />
              <p className="text-xs text-primary font-medium">
                نتائج مخصصة لاحتياجاتك ({disabilities.length} فئة)
              </p>
            </div>
          </div>
        )}

        {/* Favorites mode */}
        {showFavs && (
          <div className="mx-4 mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{displayPlaces.length} مكان محفوظ</span>
            <h2 className="text-base font-black text-red-400 flex items-center gap-1">
              <Heart size={14} className="fill-red-400" />
              المفضلة
            </h2>
          </div>
        )}

        {/* Featured */}
        {!showFavs && !searchQuery && activeCategory === "الكل" && featured.length > 0 && (
          <section className="mt-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <span className="text-xs text-muted-foreground">{featured.length} أماكن</span>
              <h2 className="text-base font-black flex items-center gap-1">
                <Star size={14} className="fill-primary text-primary" />
                أماكن مميزة
              </h2>
            </div>

            <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
              {featured.map((place) => (
                <FeaturedCard
                  key={place.id}
                  place={place}
                  isFav={favorites.includes(place.id)}
                  onFav={() => toggleFavorite(place.id)}
                  onClick={() => navigate(`/place/${place.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All places */}
        <section className="mt-5 px-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">{displayPlaces.length} نتيجة</span>
            <h2 className="text-base font-black">
              {showFavs ? "المحفوظة" : searchQuery ? "نتائج البحث" : activeCategory === "الكل" ? "جميع الأماكن" : activeCategory}
            </h2>
          </div>

          {displayPlaces.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-bold">لا توجد نتائج</p>
              <p className="text-sm mt-1">جرب البحث بكلمة أخرى</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {displayPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isFav={favorites.includes(place.id)}
                onFav={() => toggleFavorite(place.id)}
                onClick={() => navigate(`/place/${place.id}`)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function FeaturedCard({
  place,
  isFav,
  onFav,
  onClick,
}: {
  place: Place;
  isFav: boolean;
  onFav: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="shrink-0 w-56 bg-card border border-border/50 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-200 hover:scale-[1.01]"
      onClick={onClick}
    >
      <div className="relative h-32">
        <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className="absolute top-2 left-2 w-7 h-7 bg-background/70 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : "text-white"} />
        </button>
        <span className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
          {place.category}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-bold text-sm leading-tight line-clamp-1">{place.name}</h3>
          {place.isVerified && <CheckCircle size={12} className="text-primary shrink-0 mt-0.5" />}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Star size={10} className="fill-primary text-primary" />
          <span className="text-xs font-bold">{place.rating}</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <MapPin size={10} className="text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground line-clamp-1">{place.area}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {place.features.slice(0, 2).map((f) => (
            <span key={f} className="bg-primary/10 text-primary text-[9px] font-medium px-1.5 py-0.5 rounded-full">
              {f}
            </span>
          ))}
          {place.features.length > 2 && (
            <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-full">
              +{place.features.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceCard({
  place,
  isFav,
  onFav,
  onClick,
}: {
  place: Place;
  isFav: boolean;
  onFav: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-card border border-border/50 rounded-2xl overflow-hidden flex cursor-pointer hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
      onClick={onClick}
    >
      <div className="relative w-28 shrink-0">
        <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-card/20 to-transparent" />
        {place.isFeatured && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <Star size={10} className="fill-primary-foreground text-primary-foreground" />
          </div>
        )}
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
              <span className="text-[11px] text-muted-foreground line-clamp-1">{place.area}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onFav(); }}
            className="shrink-0 w-7 h-7 rounded-full bg-background/50 flex items-center justify-center"
          >
            <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star size={11} className="fill-primary text-primary" />
            <span className="text-xs font-bold">{place.rating}</span>
            <span className="text-[10px] text-muted-foreground">({place.reviewCount})</span>
          </div>
          <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
            {place.category}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {place.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="bg-background text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-full border border-border/50"
            >
              {f}
            </span>
          ))}
          {place.features.length > 3 && (
            <span className="text-[9px] text-muted-foreground px-1 py-0.5">
              +{place.features.length - 3}
            </span>
          )}
        </div>

        {place.openHours && (
          <div className="flex items-center gap-1 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">{place.openHours}</span>
          </div>
        )}
      </div>
    </div>
  );
}
