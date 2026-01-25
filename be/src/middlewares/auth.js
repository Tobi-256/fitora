// middlewares/auth.js
import { auth } from '../config/firebase.js';

// --- MIDDLEWARE 1: XÁC THỰC TOKEN (VERIFY TOKEN) ---
// Chức năng: Đảm bảo người dùng đã đăng nhập và Token còn hạn
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Kiểm tra header có tồn tại và đúng định dạng "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Not logged in! Please provide authentication token.'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Invalid token!'
      });
    }

    // Xác thực token với Firebase
    const decodedToken = await auth.verifyIdToken(token);
    
    // Lưu thông tin cơ bản từ Firebase vào req.user
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
    };

    next(); // Token hợp lệ -> đi tiếp
  } catch (error) {
    // Xử lý các lỗi cụ thể của Firebase
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        message: 'Token has expired! Please login again.'
      });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        message: 'Invalid token!'
      });
    }
    return res.status(403).json({
      message: 'Invalid or unverifiable token!'
    });
  }
};

// --- MIDDLEWARE 2: KIỂM TRA QUYỀN ADMIN (CHECK ADMIN ROLE) ---
// Chức năng: Đảm bảo user có role="admin" trong database
export const isAdmin = async (req, res, next) => {
  try {
    // Dùng dynamic import để tránh lỗi vòng lặp (Circular Dependency) nếu có
    const { findUserByFirebaseUid } = await import('../services/userService.js');
    
    // Lấy thông tin chi tiết user từ Database (Firestore)
    const user = await findUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      return res.status(404).json({
        message: 'User not found in system!'
      });
    }

    // Kiểm tra Role
    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can perform this action!'
      });
    }

    // Lưu full thông tin user từ DB vào req để dùng cho các controller phía sau
    req.dbUser = user;
    
    next(); // Là Admin -> đi tiếp
  } catch (error) {
    console.error("Check Admin Error:", error);
    return res.status(500).json({ 
      message: 'Server error while checking permissions!' 
    });
  }
};