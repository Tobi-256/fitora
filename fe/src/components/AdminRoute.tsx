import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../config/firebase'; // Đảm bảo đường dẫn này đúng
import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';

// URL Backend (Sửa lại nếu port khác)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // FIX LỖI Ở ĐÂY: Kiểm tra nếu auth bị null thì không làm gì cả
    if (!auth) {
      console.error("Firebase Auth chưa được khởi tạo!");
      setIsAdmin(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();

          // Gọi API lấy thông tin role chuẩn từ DB
          const res = await axios.get(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Lỗi check admin:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false); // Chưa đăng nhập
      }
    });

    return () => unsubscribe();
  }, []);

  // Loading state
  if (isAdmin === null) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Đang kiểm tra quyền Admin...</div>;
  }

  // Render
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;