
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import WorkflowEditor from "./pages/WorkflowEditor";
import Marketplace from "./pages/Marketplace";
import MyWorkflows from "./pages/MyWorkflows";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";
import RootLayout from "./pages/RootLayout";
import {AuthProvider} from "./context/AuthUserContext";
import { WorkflowProvider } from "./context/WorkflowContext";
import Profile from "./pages/Profile";
import PaymentCheckout from "./pages/PaymentCheckout";
import Success from "./pages/Success";

const queryClient = new QueryClient();

const App = () => {
  // Add smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (
        anchor &&
        anchor.hash &&
        anchor.hash.startsWith("#") &&
        anchor.origin + anchor.pathname ===
          window.location.origin + window.location.pathname
      ) {
        e.preventDefault();

        const targetElement = document.querySelector(anchor.hash);
        if (targetElement) {
          window.scrollTo({
            top:
              targetElement.getBoundingClientRect().top + window.scrollY - 100,
            behavior: "smooth",
          });

          // Update URL but don't scroll again
          window.history.pushState(null, "", anchor.hash);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkflowProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<RootLayout />}>
                  <Route index element={<Index />} />
                  <Route path="/workflow-editor" element={<WorkflowEditor />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/my-workflows" element={<MyWorkflows />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/cart" element={<PaymentCheckout/>}/>
                  <Route path="/success" element={<Success/>}/> 
                  <Route path="/cancel" element={<Success/>}/>
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WorkflowProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
