import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CoPilotPreview from "@/components/CoPilotPreview";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
import { LanguageSelector } from "@/components/LanguageSelector";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>
      <Hero />
      <Features />
      <CoPilotPreview />
      <Waitlist />
      <Footer />
    </div>
  );
};

export default Index;
