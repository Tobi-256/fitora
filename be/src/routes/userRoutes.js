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
} from '../controllers/userController.js';
import { sendOTP, verifyOTPCode } from '../controllers/otpController.js';
import { verifyFirebaseToken, isAdmin } from '../middlewares/auth.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../utils/upload.js';

const router = express.Router();

router.post('/users/check-email', checkEmail);
router.post('/users/check-phone', checkPhone);
router.post('/users/cleanup-firebase', cleanupFirebaseUser);
router.post('/users/reset-password', resetPasswordAfterOTP);
router.post('/otp/send', sendOTP);
router.post('/otp/verify', verifyOTPCode);
router.post('/users/sync', syncUser);

router.get('/users/me', verifyFirebaseToken, getProfile);
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

router.get('/users', verifyFirebaseToken, isAdmin, getAllUsers);
router.put('/users/:id', verifyFirebaseToken, isAdmin, updateUser);
router.delete('/users/:id', verifyFirebaseToken, isAdmin, deleteUser);

export default router;

