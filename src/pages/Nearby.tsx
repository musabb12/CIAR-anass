import { useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import NearbyStoresMap from "@/components/maps/NearbyStoresMap";

const Nearby = () => {
  useEffect(() => {
    document.title = "المتاجر القريبة منك — مارد التفوق";
    const meta = document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    (meta as HTMLMetaElement).content = "اكتشف المتاجر والخدمات القريبة من موقعك على خريطة حية ودقيقة.";
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="LIVE MAP"
        title="المتاجر القريبة منك"
        subtitle="خريطة حية تعرض جميع المتاجر والخدمات حولك بدقة عالية"
      />
      <div className="container max-w-6xl py-6 space-y-6">
        <NearbyStoresMap radiusKm={50} limit={100} height={520} />
      </div>
    </div>
  );
};

export default Nearby;
