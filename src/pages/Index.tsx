import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PcsSection from "@/components/PcsSection";
import SimulatorSection from "@/components/SimulatorSection";
import OffersSection from "@/components/OffersSection";
import BookingSection from "@/components/BookingSection";
import ContactSection from "@/components/ContactSection";
import SuggestionsSection from "@/components/SuggestionsSection";
import Footer from "@/components/Footer";
import WelcomeOffer from "@/components/WelcomeOffer";
import { FLAGS } from "@/config/flags";

// Only downloaded when the flag is on.
const HomeRooms = lazy(() => import("@/experience/HomeRooms"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        {FLAGS.homeExperience ? (
          <Suspense fallback={<div id="pcs" className="h-screen bg-black" />}>
            <HomeRooms />
          </Suspense>
        ) : (
          <>
            <PcsSection />
            <SimulatorSection />
          </>
        )}
        {/* Old home only: the new one books from each room's form and the navbar. */}
        {!FLAGS.homeExperience && <HowItWorksSection />}
        {/* <OffersSection /> */}
        <WelcomeOffer />
        {!FLAGS.homeExperience && <BookingSection />}
        <ContactSection />
        <SuggestionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
