import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useHeroMedia, HeroMediaItem } from "@/hooks/useHeroMedia";

const HERO_SLIDE_INTERVAL_MS = 3000;

const FALLBACK_SLIDES: HeroMediaItem[] = [
  {
    id: "fallback-commerce", media_type: "image", url: "/ciar-hero-commerce.jpg", poster_url: null,
    title: "CiAR", subtitle: "منصة تجارية متكاملة للتسوق، المتاجر، التوصيل، والمدفوعات بتجربة حديثة وسلسة.",
    badge_text: "تجارة حديثة", cta_text: null, cta_url: null,
    text_align: "center", text_color: "#FFFFFF",
    sort_order: 0, is_active: true, overlay_opacity: 0.58, duration_ms: HERO_SLIDE_INTERVAL_MS, effect: "kenburns",
  },
  {
    id: "fallback-delivery", media_type: "image", url: "/ciar-hero-delivery.jpg", poster_url: null,
    title: "توصيل أسرع", subtitle: "شبكة توصيل ذكية تربط الطلبات والمتاجر والعملاء في تجربة واحدة مباشرة.",
    badge_text: "شبكة ذكية", cta_text: null, cta_url: null,
    text_align: "center", text_color: "#FFFFFF",
    sort_order: 1, is_active: true, overlay_opacity: 0.62, duration_ms: HERO_SLIDE_INTERVAL_MS, effect: "zoom",
  },
  {
    id: "fallback-marketplace", media_type: "image", url: "/ciar-hero-marketplace.jpg", poster_url: null,
    title: "متاجر ومنتجات", subtitle: "واجهة تسوق راقية تعرض المنتجات والخدمات بطريقة تجارية واضحة واحترافية.",
    badge_text: "سوق شامل", cta_text: null, cta_url: null,
    text_align: "center", text_color: "#FFFFFF",
    sort_order: 2, is_active: true, overlay_opacity: 0.5, duration_ms: HERO_SLIDE_INTERVAL_MS, effect: "kenburns",
  },
  {
    id: "fallback-global", media_type: "image", url: "/ciar-hero-global.jpg", poster_url: null,
    title: "تجارة عالمية", subtitle: "حلول B2B وربط تجاري عالمي بمنظومة رقمية واحدة قابلة للتوسع.",
    badge_text: "B2B عالمي", cta_text: null, cta_url: null,
    text_align: "center", text_color: "#FFFFFF",
    sort_order: 3, is_active: true, overlay_opacity: 0.64, duration_ms: HERO_SLIDE_INTERVAL_MS, effect: "kenburns",
  },
];

const Hero = () => {
  const navigate = useNavigate();
  const { items } = useHeroMedia();
  const [idx, setIdx] = useState(0);

  const slides = useMemo(() => (items.length > 0 ? items : FALLBACK_SLIDES), [items]);
  const current = slides[idx % slides.length];

  // Lazy-preload only current + next image
  useEffect(() => {
    const next = slides[(idx + 1) % slides.length];
    if (next?.media_type === "image") {
      const img = new Image();
      img.decoding = "async";
      img.src = next.url;
    }
  }, [idx, slides]);

  useEffect(() => {
    setIdx((i) => (slides.length ? i % slides.length : 0));
  }, [slides.length]);

  // Smooth auto-cycle using each slide's admin-configured duration, with 3s as the safe minimum
  useEffect(() => {
    if (slides.length < 2) return;
    if (current.media_type === "video") return;
    const slideDuration = Math.max(current.duration_ms || HERO_SLIDE_INTERVAL_MS, HERO_SLIDE_INTERVAL_MS);
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % slides.length), slideDuration);
    return () => clearTimeout(t);
  }, [idx, slides.length, current.media_type, current.duration_ms]);

  const effectClass = (e: string) =>
    e === "zoom" ? "animate-hero-zoom" : e === "fade" ? "" : "animate-hero-kenburns";

  const alignClass =
    current.text_align === "start" ? "items-start text-start"
    : current.text_align === "end" ? "items-end text-end"
    : "items-center text-center";

  return (
    <section className="relative min-h-screen pt-16 overflow-hidden bg-foreground">
      {/* Cross-fade slideshow — every layer rendered, opacity drives transition */}
      <div className="absolute inset-0">
        {slides.map((s, i) => {
          const active = i === idx;
          const isNext = i === (idx + 1) % slides.length;
          const shouldRender = active || isNext || i === (idx - 1 + slides.length) % slides.length;
          if (!shouldRender) return null;
          return (
            <div
              key={s.id}
              className="absolute inset-0 transition-opacity duration-[1600ms] ease-out"
              style={{ opacity: active ? 1 : 0, zIndex: active ? 2 : 1 }}
              aria-hidden={!active}
            >
              {s.media_type === "video" ? (
                <video
                  src={s.url}
                  poster={s.poster_url || undefined}
                  className="h-full w-full object-cover"
                  autoPlay muted loop={slides.length === 1} playsInline preload={active ? "auto" : "metadata"}
                  onEnded={() => slides.length > 1 && setIdx((k) => (k + 1) % slides.length)}
                />
              ) : (
                <img
                  src={s.url}
                  alt={s.title || "CiAR"}
                  loading={active ? "eager" : "lazy"}
                  decoding="async"
                  className={`h-full w-full object-cover object-center ${active ? effectClass(s.effect) : ""}`}
                />
              )}
            </div>
          );
        })}

        {/* Cinematic gradient overlay — readable text without washing out the image */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{
            background:
              `linear-gradient(180deg, hsl(222 47% 6% / ${0.15 + (current.overlay_opacity ?? 0.45) * 0.35}) 0%, hsl(222 47% 6% / ${0.35 + (current.overlay_opacity ?? 0.45) * 0.45}) 60%, hsl(222 47% 6% / 0.85) 100%)`,
          }}
        />

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                aria-label={`خلفية ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-700 ${i === idx ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Foreground content */}
      <div className="container relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-end pb-24 md:pb-32 pt-20 text-white">
        <div className={`flex flex-col gap-5 max-w-3xl ${alignClass}`} style={{ color: current.text_color || "#FFFFFF" }}>
          {current.badge_text && (
            <span className="inline-flex self-start items-center gap-2 rounded-full glass-on-image px-4 py-1.5 text-xs font-semibold tracking-wide">
              {current.badge_text}
            </span>
          )}

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Tajawal', sans-serif" }}
          >
            {current.title || "تسوّق العالم من مكانك"}
          </h1>

          <p className="text-base md:text-lg lg:text-xl max-w-2xl opacity-95 leading-relaxed drop-shadow-md">
            {current.subtitle || "منصة CiAR التجارية المتكاملة — متاجر، توصيل ذكي، محفظة موحّدة، و B2B عالمي. تجربة أنيقة بمستوى عالمي."}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {current.cta_text && current.cta_url ? (
              <a
                href={current.cta_url}
                className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-7 py-3.5 font-bold text-sm hover:scale-[1.03] transition shadow-gold"
              >
                {current.cta_text} <ArrowLeft className="h-4 w-4" />
              </a>
            ) : (
              <>
                <Button
                  size="lg"
                  className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-7 h-12 font-bold shadow-gold"
                  onClick={() => navigate("/shop")}
                >
                  ابدأ التسوّق
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 h-12 font-semibold bg-white/10 text-white border-white/40 hover:bg-white/20 hover:text-white backdrop-blur"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  ادخل المنظومة
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
