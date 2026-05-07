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
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Cookies from "./pages/legal/Cookies";
import AcceptableUse from "./pages/legal/AcceptableUse";
import Security from "./pages/legal/Security";
import DMCA from "./pages/legal/DMCA";
import Contact from "./pages/legal/Contact";

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
            <Route
              path="/app"
              element={
                <AppLockGate>
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
