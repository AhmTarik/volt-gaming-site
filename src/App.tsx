import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import UltraRooms from "./pages/UltraRooms";
import VoltRooms from "./pages/VoltRooms";
import SimulatorRooms from "./pages/SimulatorRooms";
import NotFound from "./pages/NotFound";
import Experience from "./pages/Experience";
import { LangSync } from "./i18n/LangSync";

const Lounge = lazy(() => import("./lounge/Lounge"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LangSync />
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Arabic versions (see src/i18n). */}
          <Route path="/ar" element={<Index />} />
          <Route path="/ar/experience" element={<Experience />} />
          <Route path="/ultra-rooms" element={<UltraRooms />} />
          <Route path="/volt-rooms" element={<VoltRooms />} />
          <Route path="/simulator" element={<SimulatorRooms />} />
          <Route path="/experience" element={<Experience />} />
          <Route
            path="/lounge"
            element={
              <Suspense fallback={<div className="fixed inset-0 bg-[#0d0f17]" />}>
                <Lounge />
              </Suspense>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
