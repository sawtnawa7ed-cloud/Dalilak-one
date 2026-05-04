import { useParams, useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import { useGetPlace } from "@workspace/api-client-react";
import {
  ChevronLeft, Phone, MapPin, Star, Heart, CheckCircle,
  Navigation, AlertCircle, Loader2, X
} from "lucide-react";
import { useState } from "react";
import { ComplaintModal } from "@/components/ComplaintModal";
import { EvaluationModal } from "@/components/EvaluationModal";
import { AddPhotoModal } from "@/components/AddPhotoModal";

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { favorites, toggleFavorite, authUser } = useApp();
  const [showComplaint, setShowComplaint] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [imgIdx, setImgIdx] = useState<number | null>(null);

  const { data: place, isLoading, error } = useGetPlace(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground" dir="rtl">
        <AlertCircle size={40} className="text-red-400" />
        <p className="font-bold">المكان غير موجود</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const isFav = favorites.includes(place.id);

  const features: { label: string; ok: boolean }[] = [
    { label: "منحدر للكراسي المتحركة", ok: !!place.hasRamp },
    { label: "مصعد", ok: !!place.hasElevator },
    { label: "حمام مناسب لذوي الإعاقة", ok: !!place.hasAccessibleBathroom },
    { label: "موقف سيارات مخصص", ok: !!place.hasAccessibleParking },
  ];

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-7xl">{categoryEmoji(place.category)}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
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

      <div className="p-5 space-y-5 max-w-xl mx-auto">
        {/* Title */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold leading-tight">{place.name}</h1>
                {place.isVerified && <CheckCircle size={18} className="text-primary shrink-0" />}
              </div>
              <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{place.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {(place.avgRating ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-primary text-primary" />
                <span className="text-sm font-bold">{place.avgRating?.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({place.reviewCount} تقييم)</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <span className="text-sm">{place.governorateName}{place.cityName ? ` · ${place.cityName}` : ""}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            <Navigation size={16} />
            خذني إلى هناك
          </a>
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border font-bold rounded-xl text-sm hover:border-primary/50 transition-colors"
          >
            <MapPin size={16} className="text-primary" />
            على الخريطة
          </a>
        </div>

        {/* Info card */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
          {place.phone && (
            <a href={`tel:${place.phone}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone size={14} className="text-primary" />
              </div>
              <span dir="ltr">{place.phone}</span>
            </a>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-primary" />
            </div>
            <span>{place.address}</span>
          </div>
        </div>

        {/* Description */}
        {place.description && (
          <div>
            <h2 className="font-bold text-base mb-2">وصف المكان</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{place.description}</p>
          </div>
        )}

        {/* Accessibility features */}
        <div>
          <h2 className="font-bold text-base mb-3">مرافق إمكانية الوصول</h2>
          {place.isVerified ? (
            <div className="grid grid-cols-2 gap-2">
              {features.map((f) => (
                <div
                  key={f.label}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${f.ok ? "bg-primary/10 border-primary/30" : "bg-card border-border/50 opacity-50"}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${f.ok ? "bg-primary/20" : "bg-muted"}`}>
                    {f.ok ? <CheckCircle size={11} className="text-primary" /> : <X size={11} className="text-muted-foreground" />}
                  </div>
                  <span className="text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-400 font-bold">لم يتم توثيق هذا المكان بعد</p>
              <p className="text-xs text-muted-foreground mt-1">يمكن للخبراء الميدانيين إضافة تقييم</p>
            </div>
          )}
        </div>

        {/* Expert evaluations */}
        {place.evaluations && place.evaluations.length > 0 && (
          <div>
            <h2 className="font-bold text-base mb-3">تقييمات الخبراء ({place.evaluations.length})</h2>
            <div className="space-y-3">
              {place.evaluations.map((ev) => (
                <div key={ev.id} className="bg-card border border-border/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: ev.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground font-bold">{ev.expertName}</span>
                  </div>
                  {ev.notes && <p className="text-xs text-muted-foreground">{ev.notes}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(ev.createdAt).toLocaleDateString("ar-LB")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {place.photos && place.photos.length > 0 && (
          <div>
            <h2 className="font-bold text-base mb-3">صور المكان ({place.photos.length})</h2>
            <div className="grid grid-cols-3 gap-2">
              {place.photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-card border border-border/50 rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setImgIdx(i)}
                >
                  <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expert actions */}
        {authUser && (authUser.role === "expert" || authUser.role === "admin") && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowEvaluation(true)}
              className="flex-1 py-3 bg-primary/20 text-primary font-bold rounded-xl text-sm hover:bg-primary/30 transition-colors"
            >
              ✏️ إضافة تقييم
            </button>
            <button
              onClick={() => setShowPhoto(true)}
              className="flex-1 py-3 bg-primary/20 text-primary font-bold rounded-xl text-sm hover:bg-primary/30 transition-colors"
            >
              📷 إضافة صورة
            </button>
          </div>
        )}

        {/* Complaint */}
        <button
          onClick={() => setShowComplaint(true)}
          className="w-full py-3 bg-card border border-border font-bold rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <AlertCircle size={14} />
          إبلاغ عن مشكلة أو اقتراح
        </button>
      </div>

      {/* Lightbox */}
      {imgIdx !== null && place.photos && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setImgIdx(null)}>
          <img src={place.photos[imgIdx].url} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button onClick={() => setImgIdx(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
            <X size={20} className="text-white" />
          </button>
        </div>
      )}

      {showComplaint && <ComplaintModal onClose={() => setShowComplaint(false)} placeId={place.id} placeName={place.name} />}
      {showEvaluation && <EvaluationModal onClose={() => setShowEvaluation(false)} placeId={place.id} placeName={place.name} />}
      {showPhoto && <AddPhotoModal onClose={() => setShowPhoto(false)} placeId={place.id} placeName={place.name} />}
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
