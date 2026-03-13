import express from 'express';
import multer from 'multer';
import {
  checkEmail,
  checkPhone,
  cleanupFirebaseUser,
  syncUser,
  getProfile,
  uploadAvatar,
  updateProfile,
  logout,
  getAllUsers,
  updateUser,
  deleteUser,
  resetPasswordAfterOTP,
  getAdminStats, // <--- 1. THÊM IMPORT NÀY
} from '../controllers/userController.js';
import { sendOTP, verifyOTPCode } from '../controllers/otpController.js';
import { verifyFirebaseToken, isAdmin } from '../middlewares/auth.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../utils/upload.js';
import { getProductDetail, redirectPartner, getAllProducts,seedProducts} from '../controllers/productController.js';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { addToCart, getCart, updateCartItem, removeFromCart } from '../controllers/cartController.js';
import { createOrder, getMyOrders, getOrderDetail, updateOrderStatus } from '../controllers/orderController.js';
import { getAllOrders } from '../controllers/orderController.js';

const router = express.Router();

// --- PUBLIC USER ROUTES ---
router.post('/users/check-email', checkEmail);
router.post('/users/check-phone', checkPhone);
router.post('/users/cleanup-firebase', cleanupFirebaseUser);
router.post('/users/reset-password', resetPasswordAfterOTP);
router.post('/otp/send', sendOTP);
router.post('/otp/verify', verifyOTPCode);
router.post('/users/sync', syncUser);

// --- PROTECTED USER ROUTES (PROFILE) ---
router.get('/users/me', verifyFirebaseToken, getProfile);

// Avatar Upload with Multer Error Handling
router.post('/users/me/avatar', verifyFirebaseToken, (req, res, next) => {
  uploadAvatarMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'File too large! Maximum size is 5MB.',
          });
        }
        return res.status(400).json({
          message: err.message || 'File upload error',
        });
      }
      if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({
          message: err.message,
        });
      }
      return res.status(400).json({
        message: err.message || 'File upload error',
      });
    }
    next();
  });
}, uploadAvatar);

router.put('/users/me', verifyFirebaseToken, updateProfile);
router.post('/users/logout', verifyFirebaseToken, logout);

// --- ADMIN ROUTES (QUAN TRỌNG) ---

// 1. Thống kê Dashboard (Phải đặt TRƯỚC route /users/:id để không bị nhầm lẫn)
router.get('/users/stats', verifyFirebaseToken, isAdmin, getAdminStats);
router.get('/orders/all', verifyFirebaseToken, isAdmin, getAllOrders);

// 2. Quản lý danh sách User
router.get('/users', verifyFirebaseToken, isAdmin, getAllUsers);
router.put('/users/:id', verifyFirebaseToken, isAdmin, updateUser);
router.delete('/users/:id', verifyFirebaseToken, isAdmin, deleteUser);

// --- PRODUCT ROUTES ---
router.get('/products/seed', seedProducts);
router.get('/products', getAllProducts);               // Xem list products
router.get('/products/:id', getProductDetail);         // Xem chi tiết
router.post('/products/redirect', redirectPartner);    // Redirect Partner  

// --- WISHLIST ROUTES ---
router.post('/wishlist/add', addToWishlist);
router.get('/wishlist/:userId', getWishlist);
router.delete('/wishlist/:wishlistId', removeFromWishlist);

// --- CART ROUTES ---
// Lưu ý: Nên dùng verifyFirebaseToken để bảo mật giỏ hàng theo đúng User
router.get('/cart', verifyFirebaseToken, getCart); 
router.post('/cart/add', verifyFirebaseToken, addToCart);
router.put('/cart/update', verifyFirebaseToken, updateCartItem); // Cập nhật số lượng trong giỏ
router.delete('/cart/remove', verifyFirebaseToken, removeFromCart); // Xóa món khỏi giỏ

// --- ORDER ROUTES ---
router.post('/orders', verifyFirebaseToken, createOrder);        // Đặt hàng
router.get('/orders/my-orders', verifyFirebaseToken, getMyOrders);     // Xem lịch sử đơn hàng của tôi
router.get('/:id', verifyFirebaseToken, getOrderDetail);
router.put('/orders/:id/status', verifyFirebaseToken, isAdmin, updateOrderStatus); // Xem chi tiết 1 đơn hàng
export default router;