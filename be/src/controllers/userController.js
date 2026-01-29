import { auth } from '../config/firebase.js';
import {
  findUserByFirebaseUid,
  findUserByEmail,
  findUserByPhone,
  createOrUpdateUser,
  updateUserByFirebaseUid,
  listUsers,
  deleteUserByFirebaseUid,
  getUserStats, // <--- QUAN TRỌNG: Đã thêm import này
} from '../services/userService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CÁC CHỨC NĂNG ADMIN DASHBOARD (MỚI) ---

/**
 * GET /api/users/stats
 * Lấy số liệu thống kê tổng quan (Dashboard)
 */
export const getAdminStats = async (req, res) => {
  try {
    const stats = await getUserStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error getting dashboard stats' });
  }
};

/**
 * GET /api/users
 * Lấy danh sách users (Có hỗ trợ phân trang & tìm kiếm)
 */
export const getAllUsers = async (req, res) => {
  try {
    // Lấy tham số từ URL (ví dụ: ?limit=10&search=abc)
    const limit = parseInt(req.query.limit) || 10;
    const lastId = req.query.lastId || null;
    const search = req.query.search || '';

    // Gọi service
    const result = await listUsers(limit, lastId, search);

    // Kiểm tra cấu trúc trả về từ service (để tương thích cả cũ và mới)
    if (result.users) {
      // Cấu trúc mới: { users: [], lastId: ... }
      res.json({
        success: true,
        data: result.users,
        pagination: {
          lastId: result.lastId,
          limit: limit
        }
      });
    } else {
      // Cấu trúc cũ: [user1, user2...]
      res.json({
        success: true,
        data: result,
        pagination: { lastId: null }
      });
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Server error while getting users list!'
    });
  }
};

// --- CÁC CHỨC NĂNG CŨ (GIỮ NGUYÊN) ---

/**
 * POST /api/users/reset-password
 */
export const resetPasswordAfterOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required!',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long!',
      });
    }

    const { verifyOTP, getOTP, removeOTP } = await import('../services/otpService.js');
    const verifyResult = verifyOTP(email, otp, false);

    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message || 'Invalid or expired OTP!',
      });
    }

    const otpData = getOTP(email);
    if (!otpData || !otpData.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be verified first. Please verify OTP before resetting password.',
      });
    }

    try {
      const userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, { password: newPassword });
      removeOTP(email);

      return res.json({
        success: true,
        message: 'Password has been reset successfully!',
      });
    } catch (firebaseError) {
      if (firebaseError.code === 'auth/user-not-found') {
        return res.status(404).json({ success: false, message: 'User not found!' });
      }
      if (firebaseError.code === 'auth/weak-password') {
        return res.status(400).json({ success: false, message: 'Password is too weak!' });
      }
      return res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while resetting password!' });
  }
};

/**
 * POST /api/users/check-email
 */
export const checkEmail = async (req, res) => {
  try {
    const rawEmail = (req.body && req.body.email) || req.query.email || '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';

    if (!email) return res.status(400).json({ success: false, message: 'Email is required!' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format!' });

    try {
      await auth.getUserByEmail(email);
      return res.json({ success: true, exists: true, message: 'This email is already in use.' });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.json({ success: true, exists: false, message: 'Email is available.' });
      }
      return res.status(500).json({ success: false, message: 'Error checking email.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while checking email!' });
  }
};

/**
 * POST /api/users/check-phone
 */
export const checkPhone = async (req, res) => {
  try {
    const rawPhone = (req.body && req.body.phone) || req.query.phone || '';
    const phone = typeof rawPhone === 'string' ? rawPhone.trim() : '';
    const excludeUserId = (req.body && req.body.excludeUserId) || req.query.excludeUserId || undefined;

    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required!' });
    if (phone === '') return res.json({ success: true, exists: false, message: 'Phone number is available.' });

    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) return res.status(400).json({ success: false, message: 'Invalid phone number format!' });

    const existingUser = await findUserByPhone(phone.trim(), excludeUserId);
    if (existingUser) {
      return res.json({ success: true, exists: true, message: 'This phone number is already in use.' });
    }

    return res.json({ success: true, exists: false, message: 'Phone number is available.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while checking phone number!' });
  }
};

/**
 * POST /api/users/sync
 */
export const syncUser = async (req, res) => {
  try {
    const { firebaseUid, email, name, avatarUrl, providerId } = req.body;
    console.log('[syncUser] Body:', req.body);

    if (!firebaseUid || !email) {
      return res.status(400).json({ message: 'firebaseUid and email are required!' });
    }

    let finalAvatarUrl = avatarUrl;
    if ((!avatarUrl || avatarUrl === '') && providerId === 'facebook.com') {
      finalAvatarUrl = `https://graph.facebook.com/${firebaseUid}/picture?type=large`;
    }

    let user = await findUserByEmail(email);
    if (user && user.firebaseUid !== firebaseUid) {
      await updateUserByFirebaseUid(user.firebaseUid, { firebaseUid });
      user = await createOrUpdateUser({
        firebaseUid,
        email,
        name: name || user.name || '',
        avatarUrl: finalAvatarUrl || user.avatarUrl || '',
        role: user.role || 'user',
        isPremium: user.isPremium || false,
      });
    } else {
      user = await createOrUpdateUser({
        firebaseUid,
        email,
        name: name || '',
        avatarUrl: finalAvatarUrl || '',
        role: 'user',
        isPremium: false,
      });
    }

    res.status(user ? 200 : 201).json({
      message: 'Account synced successfully!',
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('[syncUser] Error:', error);
    res.status(500).json({ message: 'Failed to sync user', error: error.message });
  }
};

/**
 * GET /api/users/me
 */
export const getProfile = async (req, res) => {
  try {
    const user = await findUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      return res.status(404).json({ message: 'User not found in system!' });
    }

    res.json({
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone || '',
      address: user.address || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || null,
      height: user.height || null,
      weight: user.weight || null,
      shoulder: user.shoulder || null,
      chest: user.chest || null,
      waist: user.waist || null,
      hip: user.hip || null,
      role: user.role,
      isPremium: user.isPremium,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while getting user information!' });
  }
};

/**
 * POST /api/users/me/avatar
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded!' });

    let user = await findUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      try {
        const existingUserByEmail = await findUserByEmail(req.user.email);
        if (existingUserByEmail) {
          await updateUserByFirebaseUid(req.user.firebaseUid, {
            firebaseUid: req.user.firebaseUid,
            email: existingUserByEmail.email,
            name: req.user.name || existingUserByEmail.name,
            avatarUrl: req.user.picture || existingUserByEmail.avatarUrl,
          });
          user = await findUserByFirebaseUid(req.user.firebaseUid);
        } else {
          user = await createOrUpdateUser({
            firebaseUid: req.user.firebaseUid,
            email: req.user.email || '',
            name: req.user.name || '',
            avatarUrl: req.user.picture || '',
            role: 'user',
            isPremium: false,
          });
        }
      } catch (createError) {
        return res.status(500).json({ message: 'Failed to sync user for avatar upload.' });
      }
    }

    if (user && user.avatarUrl && (user.avatarUrl.includes('/uploads/avatars/') || user.avatarUrl.includes('/api/uploads/avatars/'))) {
      const filePath = user.avatarUrl.replace('/api', '');
      const oldAvatarPath = path.join(__dirname, '../../public', filePath);
      try {
        if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
      } catch (err) { }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await updateUserByFirebaseUid(req.user.firebaseUid, { avatarUrl });
    user = await findUserByFirebaseUid(req.user.firebaseUid);

    return res.json({
      message: 'Avatar uploaded successfully!',
      avatarUrl,
      user: {
        id: user?.id,
        firebaseUid: user?.firebaseUid,
        email: user?.email,
        name: user?.name,
        avatarUrl: user?.avatarUrl,
        role: user?.role,
        isPremium: user?.isPremium,
      },
    });
  } catch (error) {
    if (error && error.code === 11000) return res.status(400).json({ message: 'Duplicate key error' });
    if (error && error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Server error while uploading avatar!' });
  }
};

/**
 * PUT /api/users/me
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl, phone, address, gender, dateOfBirth, height, weight, shoulder, chest, waist, hip } = req.body;
    const user = await findUserByFirebaseUid(req.user.firebaseUid);

    if (!user) return res.status(404).json({ message: 'User not found in system!' });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (phone !== undefined) {
      const trimmed = phone.trim();
      if (trimmed !== '') {
        const existingUser = await findUserByPhone(trimmed, user.id);
        if (existingUser) return res.status(400).json({ message: 'This phone number is already in use by another account!' });
      }
      updates.phone = trimmed;
    }
    if (address !== undefined) updates.address = address;
    if (gender !== undefined) {
      if (gender === '' || ['male', 'female', 'other'].includes(gender)) {
        updates.gender = gender;
      } else {
        return res.status(400).json({ message: 'Invalid gender value!' });
      }
    }
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) {
        updates.dateOfBirth = null;
      } else {
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) return res.status(400).json({ message: 'Invalid date format!' });
        updates.dateOfBirth = date;
      }
    }
    if (height !== undefined) updates.height = Number(height);
    if (weight !== undefined) updates.weight = Number(weight);
    if (shoulder !== undefined) updates.shoulder = Number(shoulder);
    if (chest !== undefined) updates.chest = Number(chest);
    if (waist !== undefined) updates.waist = Number(waist);
    if (hip !== undefined) updates.hip = Number(hip);

    const updated = await updateUserByFirebaseUid(req.user.firebaseUid, updates);

    res.json({
      message: 'Information updated successfully!',
      user: {
        id: updated.id,
        firebaseUid: updated.firebaseUid,
        email: updated.email,
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        phone: updated.phone || '',
        address: updated.address || '',
        gender: updated.gender || '',
        dateOfBirth: updated.dateOfBirth || null,
        height: updated.height || null,
        weight: updated.weight || null,
        shoulder: updated.shoulder || null,
        chest: updated.chest || null,
        waist: updated.waist || null,
        hip: updated.hip || null,
        role: updated.role,
        isPremium: updated.isPremium,
      },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Duplicate data error!' });
    res.status(500).json({ message: 'Server error while updating information!' });
  }
};

/**
 * POST /api/users/logout
 */
export const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
};

/**
 * PUT /api/users/:id
 * Admin update user
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, phone, address, gender, dateOfBirth, role, isPremium } = req.body;

    const user = await findUserByFirebaseUid(id);

    if (!user) return res.status(404).json({ message: 'User not found!' });

    // Update allowed fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (gender !== undefined) {
      if (gender === '' || ['male', 'female', 'other'].includes(gender)) updates.gender = gender;
      else return res.status(400).json({ message: 'Invalid gender value!' });
    }
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) updates.dateOfBirth = null;
      else {
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) return res.status(400).json({ message: 'Invalid date format!' });
        updates.dateOfBirth = date;
      }
    }
    if (role !== undefined) {
      if (['user', 'admin'].includes(role)) updates.role = role;
      else return res.status(400).json({ message: 'Invalid role!' });
    }
    if (isPremium !== undefined) updates.isPremium = isPremium;

    const updated = await updateUserByFirebaseUid(id, updates);

    res.json({
      message: 'User updated successfully!',
      user: {
        id: updated.id,
        firebaseUid: updated.firebaseUid,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        isPremium: updated.isPremium,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating user!' });
  }
};

/**
 * DELETE /api/users/:id
 * Admin delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await findUserByFirebaseUid(req.user.firebaseUid);
    if (currentUser && currentUser.id === id) {
      return res.status(400).json({ message: 'You cannot delete yourself!' });
    }

    const user = await findUserByFirebaseUid(id);
    if (!user) return res.status(404).json({ message: 'User not found!' });

    await deleteUserByFirebaseUid(id);

    try {
      await auth.deleteUser(user.firebaseUid);
    } catch (firebaseError) { }

    res.json({ message: 'User deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting user!' });
  }
};

/**
 * POST /api/users/cleanup-firebase
 */
export const cleanupFirebaseUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required!' });

    try {
      const userRecord = await auth.getUserByEmail(email);
      const mongoUser = await findUserByFirebaseUid(userRecord.uid);

      if (mongoUser) return res.json({ success: true, message: 'User exists in both.', cleanup: false });

      await auth.deleteUser(userRecord.uid);
      return res.json({ success: true, message: 'User deleted from Firebase.', cleanup: true });
    } catch (error) {
      if (error.code === 'auth/user-not-found') return res.json({ success: true, message: 'User not in Firebase.', cleanup: false });
      return res.status(500).json({ success: false, message: 'Error cleaning up.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error!' });
  }
};