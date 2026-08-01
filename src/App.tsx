import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import ClientLayout from "@/layouts/ClientLayout";
import LoginPage from "@/pages/auth/LoginPage";
import HomePage from "@/pages/client/HomePage";
import ShopPage from "@/pages/client/ShopPage";
import ProductPage from "@/pages/client/ProductPage";
import CartPage from "@/pages/client/CartPage";
import CheckoutPage from "@/pages/client/CheckoutPage";
import OrderConfirmationPage from "@/pages/client/OrderConfirmationPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<ClientLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/loja" element={<ShopPage />} />
                <Route path="/loja/:id" element={<ProductPage />} />
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/pedido/:id" element={<OrderConfirmationPage />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
