import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLockGate from "@/components/AppLockGate";
// TwoFactorGate is intentionally not wrapped here — 2FA is opt-in via Settings.
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Cookies from "./pages/legal/Cookies";
import AcceptableUse from "./pages/legal/AcceptableUse";
import Security from "./pages/legal/Security";
import DMCA from "./pages/legal/DMCA";
import Contact from "./pages/legal/Contact";
import Features from "./pages/marketing/Features";
import Business from "./pages/marketing/Business";
import Apps from "./pages/marketing/Apps";
import Help from "./pages/marketing/Help";
import Blog from "./pages/marketing/Blog";
import About from "./pages/marketing/About";
import Careers from "./pages/marketing/Careers";
import Brand from "./pages/marketing/Brand";
import Sitemap from "./pages/marketing/Sitemap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/acceptable-use" element={<AcceptableUse />} />
            <Route path="/security" element={<Security />} />
            <Route path="/dmca" element={<DMCA />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/features" element={<Features />} />
            <Route path="/business" element={<Business />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/help" element={<Help />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/brand" element={<Brand />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route
              path="/app"
              element={
                <AppLockGate>
                  {/* 2-step verification is optional at sign-up. It is enforced
                      only inside sensitive flows (e.g. ChangeNumberScreen). */}
                  <Index />
                </AppLockGate>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
