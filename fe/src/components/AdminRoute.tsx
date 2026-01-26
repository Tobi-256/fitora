import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../config/firebase';
import api from '../services/api';
import { onAuthStateChanged } from 'firebase/auth';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth chưa được khởi tạo!");
      setIsAdmin(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem('firebaseToken', token);

          const res = await api.get('/users/me');

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
        setIsAdmin(false);
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