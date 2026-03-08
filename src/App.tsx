import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import TrackOrder from "./pages/TrackOrder";
import Auth from "./pages/Auth";
import OrderHistory from "./pages/OrderHistory";
import Admin from "./pages/Admin";
import ReturnExchange from "./pages/ReturnExchange";
import FAQ from "./pages/FAQ";
import SizeGuide from "./pages/SizeGuide";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ShippingPolicy from "./pages/ShippingPolicy";
import AboutUs from "./pages/AboutUs";
import Referral from "./pages/Referral";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import WhatsAppButton from "./components/WhatsAppButton";
import VisitorTracker from "./components/VisitorTracker";

const WhatsAppButtonWrapper = () => {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin') ? null : <WhatsAppButton />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <VisitorTracker />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/return-exchange" element={<ReturnExchange />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/size-guide" element={<SizeGuide />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/referral" element={<Referral />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <WhatsAppButtonWrapper />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
