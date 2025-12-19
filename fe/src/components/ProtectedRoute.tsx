import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

