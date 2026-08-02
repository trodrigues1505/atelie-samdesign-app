import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import ClientLayout from "@/layouts/ClientLayout";
import AdminLayout from "@/layouts/AdminLayout";
import LoginPage from "@/pages/auth/LoginPage";
import HomePage from "@/pages/client/HomePage";
import ShopPage from "@/pages/client/ShopPage";
import ProductPage from "@/pages/client/ProductPage";
import CartPage from "@/pages/client/CartPage";
import CheckoutPage from "@/pages/client/CheckoutPage";
import OrdersListPage from "@/pages/client/OrdersListPage";
import OrderDetailPage from "@/pages/client/OrderDetailPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminProductFormPage from "@/pages/admin/AdminProductFormPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "@/pages/admin/AdminOrderDetailPage";
import AdminClientsPage from "@/pages/admin/AdminClientsPage";
import AdminIntegrationsPage from "@/pages/admin/AdminIntegrationsPage";
import MelhorEnvioCallbackPage from "@/pages/admin/MelhorEnvioCallbackPage";

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
                <Route path="/pedidos" element={<OrdersListPage />} />
                <Route path="/pedido/:id" element={<OrderDetailPage />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/produtos" element={<AdminProductsPage />} />
                <Route path="/admin/produtos/novo" element={<AdminProductFormPage />} />
                <Route path="/admin/produtos/:id" element={<AdminProductFormPage />} />
                <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
                <Route path="/admin/pedidos/:id" element={<AdminOrderDetailPage />} />
                <Route path="/admin/clientes" element={<AdminClientsPage />} />
                <Route path="/admin/integracoes" element={<AdminIntegrationsPage />} />
                <Route path="/admin/integracoes/melhor-envio/callback" element={<MelhorEnvioCallbackPage />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
