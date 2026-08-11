import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bike, Store as StoreIcon, MapPin, Loader2 } from "lucide-react";

// إصلاح أيقونات leaflet الافتراضية
const pilotIcon = new L.DivIcon({
  html: `<div style="background:hsl(45 90% 55%); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px hsl(45 90% 55% / 0.6); border:3px solid white;">🏍️</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
const customerIcon = new L.DivIcon({
  html: `<div style="background:hsl(270 60% 35%); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px hsl(270 60% 35% / 0.6); border:3px solid white;">📍</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});
const sellerIcon = new L.DivIcon({
  html: `<div style="background:hsl(160 60% 40%); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px hsl(160 60% 40% / 0.6); border:3px solid white;">🏪</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface LiveLoc {
  user_id: string;
  role: string;
  lat: number;
  lng: number;
  updated_at: string;
}

interface Props {
  orderId: string;
  customerLat?: number | null;
  customerLng?: number | null;
  /** إذا كان المستخدم الحالي هو السائق المُعيَّن، يبثّ موقعه تلقائياً */
  asPilot?: boolean;
}

const FlyTo = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};

const LiveTracking = ({ orderId, customerLat, customerLng, asPilot = false }: Props) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LiveLoc[]>([]);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");
  const watchIdRef = useRef<number | null>(null);

  // تحميل المواقع الحالية + الاشتراك في realtime
  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      const { data } = await supabase
        .from("live_locations")
        .select("user_id,role,lat,lng,updated_at")
        .eq("order_id", orderId)
        .order("updated_at", { ascending: false });
      // اختر آخر تحديث لكل دور
      const latest = new Map<string, LiveLoc>();
      (data ?? []).forEach((l: any) => {
        if (!latest.has(l.role)) latest.set(l.role, l);
      });
      setLocations(Array.from(latest.values()));
    };
    load();

    const ch = supabase
      .channel(`loc-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_locations", filter: `order_id=eq.${orderId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId]);

  // بث موقع السائق
  useEffect(() => {
    if (!asPilot || !user || !navigator.geolocation) return;
    setPermission("idle");
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        setPermission("granted");
        const { latitude, longitude, heading, speed } = pos.coords;
        await supabase.from("live_locations").insert({
          user_id: user.id,
          order_id: orderId,
          role: "pilot",
          lat: latitude,
          lng: longitude,
          heading: heading ?? null,
          speed: speed ?? null,
        });
      },
      () => setPermission("denied"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    watchIdRef.current = id;
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [asPilot, user, orderId]);

  const pilotLoc = locations.find((l) => l.role === "pilot");
  const sellerLoc = locations.find((l) => l.role === "seller");
  const center: [number, number] =
    pilotLoc ? [pilotLoc.lat, pilotLoc.lng] :
    customerLat && customerLng ? [Number(customerLat), Number(customerLng)] :
    [15.3694, 44.1910]; // ب€ن افتراضياً

  return (
    <div className="relative">
      <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-mystic" style={{ height: 360 }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pilotLoc && (
            <>
              <Marker position={[pilotLoc.lat, pilotLoc.lng]} icon={pilotIcon}>
                <Popup>السائق الآن</Popup>
              </Marker>
              <FlyTo lat={pilotLoc.lat} lng={pilotLoc.lng} />
            </>
          )}
          {customerLat && customerLng && (
            <Marker position={[Number(customerLat), Number(customerLng)]} icon={customerIcon}>
              <Popup>عنوان التسليم</Popup>
            </Marker>
          )}
          {sellerLoc && (
            <Marker position={[sellerLoc.lat, sellerLoc.lng]} icon={sellerIcon}>
              <Popup>المتجر</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
          <Bike className="h-3.5 w-3.5 text-accent" />
          <span>السائق: {pilotLoc ? "مباشر 🟢" : "غير متاح"}</span>
        </div>
        {customerLat && customerLng && (
          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>وجهة التسليم مثبّتة</span>
          </div>
        )}
        {asPilot && (
          <div className="flex items-center gap-2 glass-gold px-3 py-1.5 rounded-full">
            {permission === "granted" ? "📡 جاري بث موقعك" :
             permission === "denied" ? "❌ صلاحية الموقع مرفوضة" :
             <><Loader2 className="h-3 w-3 animate-spin" /> طلب صلاحية GPS...</>}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
