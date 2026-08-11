import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Navigation, Store as StoreIcon, AlertCircle, RefreshCw, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useIntegration } from "@/hooks/useIntegration";

// مدن يمنية شائعة كبديل عند رفض الـ GPS
const YEMEN_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "ب€ن", lat: 15.3694, lng: 44.191 },
  { name: "ميونخ", lat: 12.7855, lng: 45.0187 },
  { name: "هامبورغ", lat: 13.5795, lng: 44.0209 },
  { name: "شتوتغارت", lat: 14.7978, lng: 42.9545 },
  { name: "كولونيا", lat: 13.9667, lng: 44.1833 },
  { name: "ذمار", lat: 14.5428, lng: 44.4053 },
  { name: "فرانكفورت", lat: 14.5424, lng: 49.1242 },
  { name: "حضرموت", lat: 15.9333, lng: 48.5833 },
  { name: "صعدة", lat: 16.9402, lng: 43.7635 },
  { name: "عمران", lat: 15.6594, lng: 43.9436 },
];

const STORAGE_KEY = "mared_user_location";

interface NearbyStore {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  rating: number | null;
  category_id: string | null;
  lat: number;
  lng: number;
  address: string | null;
  distance_km: number;
}

interface Props {
  /** نصف قطر البحث بالكيلومتر */
  radiusKm?: number;
  /** الحد الأقصى للمتاجر المعروضة */
  limit?: number;
  /** ارتفاع الخريطة */
  height?: number;
  /** معرف فئة لتصفية النتائج */
  categoryId?: string | null;
  /** عرض شريط البحث/التصفية */
  compact?: boolean;
}

// أيقونة المستخدم
const userIcon = new L.DivIcon({
  html: `<div style="position:relative;">
    <div style="background:hsl(45 95% 55%); width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 0 3px hsl(45 95% 55% / 0.4), 0 0 20px hsl(45 95% 55% / 0.8);"></div>
    <div style="position:absolute; inset:-6px; border-radius:50%; border:2px solid hsl(45 95% 55%); animation: ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
  </div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const storeIcon = (color = "270 60% 45%") => new L.DivIcon({
  html: `<div style="background:hsl(${color}); width:38px; height:38px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 14px hsl(${color} / 0.5);">
    <span style="transform:rotate(45deg); font-size:18px;">🏪</span>
  </div>`,
  className: "",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// صيغة Haversine لحساب المسافة
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RecenterOnUser = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
};

const NearbyStoresMap = ({
  radiusKm = 25,
  limit = 50,
  height = 420,
  categoryId = null,
  compact = false,
}: Props) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied" | "unsupported" | "manual">("idle");
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const requestedRef = useRef(false);
  const { publicKey: gmapsKey } = useIntegration("google_maps");

  // طلب موقع GPS الحقيقي
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      return;
    }
    setPermission("idle");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission("granted");
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...c, source: "gps" })); } catch {}
      },
      () => {
        setPermission("denied");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  // اختيار مدينة يدوياً
  const selectCity = (cityName: string) => {
    const city = YEMEN_CITIES.find((c) => c.name === cityName);
    if (!city) return;
    setPermission("manual");
    const c = { lat: city.lat, lng: city.lng };
    setCoords(c);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...c, source: "manual", city: cityName })); } catch {}
  };

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    // استرجاع الموقع المحفوظ أولاً
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lng) {
          setCoords({ lat: Number(parsed.lat), lng: Number(parsed.lng) });
          setPermission(parsed.source === "manual" ? "manual" : "granted");
          return;
        }
      }
    } catch {}
    requestLocation();
  }, []);

  // جلب المتاجر التي تملك إحداثيات
  useEffect(() => {
    if (!coords) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("stores")
        .select(`
          id, name, slug, logo_url, cover_url, city, rating, category_id,
          store_settings ( location_lat, location_lng, location_address )
        `)
        .eq("approval_status", "approved")
        .eq("suspended", false);
      if (categoryId) q = q.eq("category_id", categoryId);

      const { data } = await q.limit(500);
      if (cancel) return;

      const enriched: NearbyStore[] = (data ?? [])
        .map((s: any) => {
          const settings = Array.isArray(s.store_settings) ? s.store_settings[0] : s.store_settings;
          const lat = settings?.location_lat ? Number(settings.location_lat) : null;
          const lng = settings?.location_lng ? Number(settings.location_lng) : null;
          if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;
          const d = distanceKm(coords.lat, coords.lng, lat, lng);
          return {
            id: s.id,
            name: s.name,
            slug: s.slug,
            logo_url: s.logo_url,
            cover_url: s.cover_url,
            city: s.city,
            rating: s.rating,
            category_id: s.category_id,
            lat,
            lng,
            address: settings?.location_address ?? null,
            distance_km: d,
          } as NearbyStore;
        })
        .filter((s): s is NearbyStore => !!s && s.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, limit);

      setStores(enriched);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [coords, radiusKm, limit, categoryId]);

  const center: [number, number] = coords ? [coords.lat, coords.lng] : [15.3694, 44.191];

  return (
    <div className="space-y-3">
      {/* شريط الحالة + إجراءات الموقع */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {permission === "granted" && coords && (
              <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full">
                <Navigation className="h-3.5 w-3.5 text-accent" />
                موقعك مفعّل — {stores.length} متجر قريب
              </span>
            )}
            {permission === "manual" && coords && (
              <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                مدينة محددة يدوياً — {stores.length} متجر
              </span>
            )}
            {permission === "idle" && !coords && (
              <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جاري تحديد موقعك...
              </span>
            )}
            {(permission === "denied" || permission === "unsupported") && !coords && (
              <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                اختر مدينتك أو فعّل GPS للحصول على نتائج دقيقة
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={selectCity} value={undefined}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="اختر مدينتك" />
              </SelectTrigger>
              <SelectContent>
                {YEMEN_CITIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={requestLocation} className="gap-2">
              <LocateFixed className="h-3.5 w-3.5" />
              {permission === "denied" ? "السماح بالموقع" : "موقعي الحالي"}
            </Button>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-mystic"
        style={{ height }}
      >
        {loading && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          {gmapsKey ? (
            <TileLayer
              attribution='&copy; Google Maps'
              url={`https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${gmapsKey}`}
              maxZoom={20}
            />
          ) : (
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          {coords && (
            <>
              <Marker position={[coords.lat, coords.lng]} icon={userIcon}>
                <Popup>📍 موقعك الحالي</Popup>
              </Marker>
              <Circle
                center={[coords.lat, coords.lng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "hsl(270 60% 50%)",
                  fillColor: "hsl(270 60% 50%)",
                  fillOpacity: 0.06,
                  weight: 1.5,
                  dashArray: "6 6",
                }}
              />
              <RecenterOnUser lat={coords.lat} lng={coords.lng} />
            </>
          )}

          {stores.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={storeIcon()}>
              <Popup>
                <div className="min-w-[200px] space-y-1.5" dir="rtl">
                  {s.cover_url && (
                    <img src={s.cover_url} alt={s.name} className="w-full h-20 object-cover rounded" />
                  )}
                  <div className="font-bold text-base">{s.name}</div>
                  {s.city && <div className="text-xs text-muted-foreground">{s.city}</div>}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-primary">
                      {s.distance_km < 1
                        ? `${Math.round(s.distance_km * 1000)} م`
                        : `${s.distance_km.toFixed(1)} كم`}
                    </span>
                    {s.rating != null && Number(s.rating) > 0 && (
                      <span>⭐ {Number(s.rating).toFixed(1)}</span>
                    )}
                  </div>
                  <Link
                    to={`/store/${s.id}`}
                    className="block w-full text-center bg-primary text-primary-foreground rounded py-1.5 text-xs font-bold mt-2"
                  >
                    زيارة المتجر
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* قائمة المتاجر القريبة */}
      {!compact && stores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stores.slice(0, 6).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/store/${s.id}`}
                className="flex items-center gap-3 glass rounded-xl p-3 hover:border-primary/50 border border-border/40 transition"
              >
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <StoreIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{s.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {s.distance_km < 1
                      ? `${Math.round(s.distance_km * 1000)} م`
                      : `${s.distance_km.toFixed(1)} كم`}
                    {s.city && <span>· {s.city}</span>}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!compact && !loading && stores.length === 0 && coords && (
        <div className="text-center text-sm text-muted-foreground py-6 glass rounded-xl">
          لا توجد متاجر ضمن نصف قطر {radiusKm} كم من موقعك حالياً
        </div>
      )}
    </div>
  );
};

export default NearbyStoresMap;
