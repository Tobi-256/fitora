import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute.tsx'; // Import AdminRoute
import AdminLogin from './pages/AdminLogin';
// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { ForgotPassword } from './pages/ForgotPassword';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard.tsx'; // Import Dashboard
import TryOn from './pages/TryOn';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import { CartProvider } from './contexts/CartContext.tsx';
import './App.css';
import Checkout from './pages/Checkout.tsx';
import OrderHistory from './pages/OrderHistory.tsx';
import OrderDetail from './pages/OrderDetail.tsx';
import AdminOrders from './pages/AdminOrders';

// Layout cho các trang người dùng thường (Có Header + Main Content)
const MainLayout = () => {
  return (
    <>
      <Header />
      <main className="main-content">
        <Outlet /> {/* Nơi nội dung các trang con (Home, Product...) hiển thị */}
      </main>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#000',
            borderRadius: 8,
          },
        }}
      >
        <AntApp>
          <AuthProvider>
            <CartProvider>
            <Router>
              <div className="app">
                <Routes>
                  <Route path="/admin/login" element={<AdminLogin />} />
                  {/* --- KHU VỰC ADMIN (KHÔNG CÓ HEADER WEBSITE) --- */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin/dashboard" element={<Dashboard />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                  </Route>

                  {/* --- KHU VỰC NGƯỜI DÙNG (CÓ HEADER WEBSITE) --- */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/product" element={<ProductList />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route
                      path="/try-on"
                      element={
                        <ProtectedRoute>
                          <TryOn />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

                    <Route path="/my-orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />

                    <Route path="/order-detail/:id" element={<OrderDetail />} />
                  </Route>
                  
                      

                </Routes>
              </div>
            </Router>
            </CartProvider>
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;