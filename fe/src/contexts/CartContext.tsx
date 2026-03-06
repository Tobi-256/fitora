import React, { createContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/api';

interface CartContextType {
  cartItems: any[];
  totalPrice: number;
  totalItems: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  //const auth = useAuth() as any;
  //const user = auth?.user;

  // Lấy ID để theo dõi, dùng || để chấp nhận cả 2 trường hợp tên biến
  //const currentUserId = user?.firebaseUid || user?.uid;

  const refreshCart = useCallback(async () => {
  try {
    setLoading(true);
    // Gọi hàm getCart mới (hàm này tự lấy token bên trong)
    const res = await cartService.getCart(); 
    
    console.log("Data từ database:", res.data);
    setCartItems(res.data || []);
  } catch (err) {
    console.error("Lỗi lấy giỏ hàng:", err);
    setCartItems([]);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const totalPrice = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, totalPrice, totalItems, refreshCart, loading }}>
      {children}
    </CartContext.Provider>
  );
};