import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Roles from "@/components/landing/Roles";
import Features from "@/components/landing/Features";
import PricingEngine from "@/components/landing/PricingEngine";
import JobBoard from "@/components/landing/JobBoard";
import B2BHub from "@/components/landing/B2BHub";
import NearbySection from "@/components/landing/NearbySection";
import Footer from "@/components/landing/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "CiAR — بوابتك إلى عالم التسوق";
    const meta = document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    (meta as HTMLMetaElement).content = "CiAR — منصة تجارة عالمية متكاملة: متاجر، توصيل ذكي، محفظة موحّدة، ووظائف وB2B.";
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <NearbySection />
      <Roles />
      <Features />
      <PricingEngine />
      <JobBoard />
      <B2BHub />
      <Footer />
    </div>
  );
};

export default Index;
