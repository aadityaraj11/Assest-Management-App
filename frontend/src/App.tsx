import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { AssetsPage } from "@/pages/AssetsPage";
import { AssignmentsPage } from "@/pages/AssignmentsPage";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { VendorsPage } from "@/pages/VendorsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { UsersPage } from "@/pages/UsersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { AssetFormPage } from '@/pages/AssetFormPage'; // You'll create this


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthGuard>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/vendors" element={<VendorsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/assets/new" element={<AssetFormPage />} />
                <Route path="/assets/edit/:id" element={<AssetFormPage />} />
              </Routes>
            </Layout>
          </AuthGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
