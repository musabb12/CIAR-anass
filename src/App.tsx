import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { I18nProvider } from "@/hooks/useI18n";
import { CartProvider } from "@/hooks/useCart";
import { CurrencyProvider } from "@/hooks/useCurrency";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import StoreDetail from "./pages/StoreDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Wallet from "./pages/Wallet";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Jobs from "./pages/Jobs";
import Deals from "./pages/Deals";
import NewArrivals from "./pages/NewArrivals";
import Bestsellers from "./pages/Bestsellers";
import Categories from "./pages/Categories";
import CategoryPage from "./pages/CategoryPage";
import Nearby from "./pages/Nearby";
import Services from "./pages/Services";
import Brands from "./pages/Brands";
import Gifts from "./pages/Gifts";
import Tracking from "./pages/Tracking";
import Search from "./pages/Search";
import About from "./pages/About";
import Support from "./pages/Support";
import Treasures from "./pages/Treasures";
import AdminContact from "./pages/AdminContact";
import SupportCall from "./pages/SupportCall";
import CustomerDashboard from "./pages/dashboard/Customer";
import SellerDashboard from "./pages/dashboard/Seller";
import FactoryDashboard from "./pages/dashboard/Factory";
import PilotDashboard from "./pages/dashboard/Pilot";
import JobseekerDashboard from "./pages/dashboard/Jobseeker";
import AdminDashboard from "./pages/dashboard/Admin";
import SellerUpgrade from "./pages/seller/Upgrade";
import SellerPromote from "./pages/seller/Promote";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <CurrencyProvider>
    <I18nProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/store/:id" element={<StoreDetail />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/bestsellers" element={<Bestsellers />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/nearby" element={<Nearby />} />
              <Route path="/services" element={<Services />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/gifts" element={<Gifts />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/search" element={<Search />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              <Route path="/treasures" element={<Treasures />} />
              <Route path="/admin-contact" element={<ProtectedRoute><AdminContact /></ProtectedRoute>} />
              <Route path="/support-call/:channelId" element={<ProtectedRoute><SupportCall /></ProtectedRoute>} />
              <Route path="/dashboard/customer"  element={<ProtectedRoute requireRole="customer"><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/seller"    element={<ProtectedRoute requireRole="seller"><SellerDashboard /></ProtectedRoute>} />
              <Route path="/seller/upgrade"      element={<ProtectedRoute requireRole="seller"><SellerUpgrade /></ProtectedRoute>} />
              <Route path="/seller/promote"      element={<ProtectedRoute requireRole="seller"><SellerPromote /></ProtectedRoute>} />
              <Route path="/dashboard/factory"   element={<ProtectedRoute requireRole="factory"><FactoryDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/pilot"     element={<ProtectedRoute requireRole="pilot"><PilotDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/jobseeker" element={<ProtectedRoute requireRole="jobseeker"><JobseekerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin"     element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AppShell>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </I18nProvider>
    </CurrencyProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
