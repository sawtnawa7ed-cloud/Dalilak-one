import { useParams, useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import { ArrowRight, Phone, MapPin, Clock, Star, Heart, CheckCircle, ChevronLeft } from "lucide-react";

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { places, favorites, toggleFavorite } = useApp();
  const place = places.find((p) => p.id === id);

  if (!place) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        المكان غير موجود
      </div>
    );
  }

  const isFav = favorites.includes(place.id);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="relative h-72 overflow-hidden">
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-border/50 hover:bg-background transition-colors"
        >
          <ChevronLeft size={20} className="text-foreground rotate-180" />
        </button>
        <button
          onClick={() => toggleFavorite(place.id)}
          className="absolute top-4 left-4 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-border/50 hover:bg-background transition-colors"
        >
          <Heart size={18} className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{place.name}</h1>
                {place.isVerified && (
                  <CheckCircle size={18} className="text-primary shrink-0" />
                )}
              </div>
              {place.nameEn && (
                <p className="text-sm text-muted-foreground">{place.nameEn}</p>
              )}
            </div>
            <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full shrink-0">
              {place.category}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-primary text-primary" />
              <span className="text-sm font-bold">{place.rating}</span>
              <span className="text-xs text-muted-foreground">({place.reviewCount} تقييم)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <span className="text-sm">{place.area}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone size={14} className="text-primary" />
              </div>
              <span>{place.phone}</span>
            </a>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-primary" />
            </div>
            <span>{place.address}</span>
          </div>
          {place.openHours && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock size={14} className="text-primary" />
              </div>
              <span>{place.openHours}</span>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-bold text-base mb-3">وصف المكان</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{place.description}</p>
        </div>

        <div>
          <h2 className="font-bold text-base mb-3">خدمات إمكانية الوصول</h2>
          <div className="grid grid-cols-2 gap-2">
            {place.features.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 bg-card border border-primary/20 rounded-xl px-3 py-2"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <CheckCircle size={11} className="text-primary" />
                </div>
                <span className="text-xs font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {place.isFeatured && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="fill-primary text-primary" />
              <span className="text-sm font-bold text-primary">مكان مميز</span>
            </div>
            <p className="text-xs text-muted-foreground">هذا المكان حاصل على تقييم عالٍ من ذوي الاحتياجات الخاصة</p>
          </div>
        )}
      </div>
    </div>
  );
}
