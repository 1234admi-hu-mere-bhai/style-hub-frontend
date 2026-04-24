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
import ResetPassword from "./pages/ResetPassword";
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
import Settings from "./pages/Settings";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import PayUCallback from "./pages/PayUCallback";
import Coupons from "./pages/Coupons";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
import StaffInvite from "./pages/StaffInvite";
import VisitorTracker from "./components/VisitorTracker";
import BottomNav from "./components/BottomNav";
import LiveSupportChat from "./components/LiveSupportChat";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import InAppNotificationListener from "./components/InAppNotificationListener";

const queryClient = new QueryClient();

// Secret admin path — replaces /admin to hide the management panel from the public
const ADMIN_PATH = '/muffigout-control-panel';

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith(ADMIN_PATH);

  return (
    <div className="min-h-screen bg-background">
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/orders" element={<OrderHistory />} />
        {/* Secret admin path — /admin is intentionally NOT routed and shows 404 */}
        <Route path={ADMIN_PATH} element={<Admin />} />
        <Route path={`${ADMIN_PATH}/*`} element={<Admin />} />
        <Route path="/return-exchange" element={<ReturnExchange />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/size-guide" element={<SizeGuide />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/payu-callback" element={<PayUCallback />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/staff-invite/:token" element={<StaffInvite />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdmin && <BottomNav />}
      {!isAdmin && <LiveSupportChat />}
      {!isAdmin && <PushNotificationPrompt />}
      {!isAdmin && <InAppNotificationListener />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
