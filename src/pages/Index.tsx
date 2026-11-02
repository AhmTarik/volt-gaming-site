import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PcsSection from "@/components/PcsSection";
import SimulatorSection from "@/components/SimulatorSection";
import OffersSection from "@/components/OffersSection";
import BookingSection from "@/components/BookingSection";
import ContactSection from "@/components/ContactSection";
import SuggestionsSection from "@/components/SuggestionsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PcsSection />
        <SimulatorSection />
        {/* <OffersSection /> */}
        <BookingSection />
        <ContactSection />
        <SuggestionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
