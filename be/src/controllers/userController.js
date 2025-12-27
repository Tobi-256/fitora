import { auth } from '../config/firebase.js';
import {
  findUserByFirebaseUid,
  findUserByEmail,
  findUserByPhone,
  createOrUpdateUser,
  updateUserByFirebaseUid,
  listUsers,
  deleteUserByFirebaseUid,
} from '../services/userService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/users/reset-password
 * Reset password after OTP verification
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

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long!',
      });
    }

    // Verify OTP first (don't remove yet, will remove after password reset)
    const { verifyOTP, getOTP, removeOTP } = await import('../services/otpService.js');
    const verifyResult = verifyOTP(email, otp, false);

    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message || 'Invalid or expired OTP!',
      });
    }

    // Check if OTP was verified (for password reset flow)
    const otpData = getOTP(email);
    if (!otpData || !otpData.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be verified first. Please verify OTP before resetting password.',
      });
    }

    // OTP verified, now reset password in Firebase
    try {
      // Get user by email from Firebase
      const userRecord = await auth.getUserByEmail(email);
      
      // Update password in Firebase
      await auth.updateUser(userRecord.uid, {
        password: newPassword,
      });

      // Password reset successful, now remove OTP
      removeOTP(email);

      // ...existing code...

      return res.json({
        success: true,
        message: 'Password has been reset successfully!',
      });
    } catch (firebaseError) {
      // ...existing code...
      
      if (firebaseError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'User not found in the system!',
        });
      }
      
      if (firebaseError.code === 'auth/weak-password') {
        return res.status(400).json({
          success: false,
          message: 'Password is too weak. Please use a stronger password!',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to reset password. Please try again later.',
      });
    }
  } catch (error) {
    // ...existing code...
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password!',
    });
  }
};

/**
 * POST /api/users/check-email
 * Check if email is already in use (in Firebase Authentication)
 */
export const checkEmail = async (req, res) => {
  try {
    // ...existing code...

    // Accept email from body or query and trim
    const rawEmail = (req.body && req.body.email) || req.query.email || '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';

    if (!email) {
      // ...existing code...
      return res.status(400).json({
        success: false,
        message: 'Email is required!',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      // ...existing code...
      return res.status(400).json({
        success: false,
        message: 'Invalid email format!',
      });
    }

    try {
      // Check if email exists in Firebase Authentication
      const userRecord = await auth.getUserByEmail(email);
      
      // Email exists
      return res.json({
        success: true,
        exists: true,
        message: 'This email is already in use.',
      });
    } catch (error) {
      // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
      if (error.code === 'auth/user-not-found') {
        // Email doesn't exist in Firebase
        return res.json({
          success: true,
          exists: false,
          message: 'Email is available.',
        });
      }
      
      // Other Firebase errors
      // ...existing code...
      return res.status(500).json({
        success: false,
        message: 'Error checking email. Please try again later.',
      });
    }
  } catch (error) {
    // ...existing code...
    res.status(500).json({
      success: false,
      message: 'Server error while checking email!',
    });
  }
};

/**
 * POST /api/users/check-phone
 * Check if phone number is already in use
 */
export const checkPhone = async (req, res) => {
  try {
    // ...existing code...

    const rawPhone = (req.body && req.body.phone) || req.query.phone || '';
    const phone = typeof rawPhone === 'string' ? rawPhone.trim() : '';
    const excludeUserId = (req.body && req.body.excludeUserId) || req.query.excludeUserId || undefined;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required!',
      });
    }

    // If phone is empty string, it's available
    if (phone === '') {
      return res.json({
        success: true,
        exists: false,
        message: 'Phone number is available.',
      });
    }

    // Validate phone format
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format!',
      });
    }

    // Check if phone exists in Firestore
    const existingUser = await findUserByPhone(phone.trim(), excludeUserId);

    if (existingUser) {
      return res.json({
        success: true,
        exists: true,
        message: 'This phone number is already in use.',
      });
    }

    return res.json({
      success: true,
      exists: false,
      message: 'Phone number is available.',
    });
  } catch (error) {
    // ...existing code...
    res.status(500).json({
      success: false,
      message: 'Server error while checking phone number!',
    });
  }
};

/**
 * POST /api/users/sync
 * Sync user from Firebase to MongoDB
 * Called after user successfully registers/logs in on frontend
 */
export const syncUser = async (req, res) => {
  try {
    const { firebaseUid, email, name, avatarUrl } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ 
        message: 'firebaseUid and email are required!' 
      });
    }

    // Create or update user in Firestore (doc id = firebaseUid)
    const user = await createOrUpdateUser({
      firebaseUid,
      email,
      name: name || '',
      avatarUrl: avatarUrl || '',
      role: 'user',
      isPremium: false,
    });

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
    // ...existing code...

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists in the system!` 
      });
    }

    res.status(500).json({ 
      message: 'Server error while syncing user!' 
    });
  }
};

/**
 * GET /api/users/me
 * Get current user information
 * Requires: verifyFirebaseToken middleware
 */
export const getProfile = async (req, res) => {
  try {
    const user = await findUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      return res.status(404).json({
        message: 'User not found in system!',
      });
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
      role: user.role,
      isPremium: user.isPremium,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    // ...existing code...
    res.status(500).json({ 
      message: 'Server error while getting user information!' 
    });
  }
};

/**
 * POST /api/users/me/avatar
 * Upload avatar image
 * Requires: verifyFirebaseToken middleware
 */
export const uploadAvatar = async (req, res) => {
  try {
    // ...existing code...
    
    if (!req.file) {
      // ...existing code...
      return res.status(400).json({
        message: 'No file uploaded!',
      });
    }

    // ...existing code...
    let user = await findUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      // ...existing code...
      try {
        const existingUserByEmail = await findUserByEmail(req.user.email);
        if (existingUserByEmail) {
          // Link existing user record to this firebaseUid
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
            phone: '',
            address: '',
            gender: '',
            dateOfBirth: null,
            role: 'user',
            isPremium: false,
          });
        }
      } catch (createError) {
        // ...existing code...
        return res.status(500).json({
          message: 'Failed to sync user. Please try again.',
          error: process.env.NODE_ENV === 'development' ? (createError instanceof Error ? createError.message : String(createError)) : undefined,
        });
      }
    }

    // ...existing code...
    if (user && user.avatarUrl && (user.avatarUrl.includes('/uploads/avatars/') || user.avatarUrl.includes('/api/uploads/avatars/'))) {
      const filePath = user.avatarUrl.replace('/api', '');
      const oldAvatarPath = path.join(__dirname, '../../public', filePath);
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          // ...existing code...
        }
      } catch (err) {
        // ...existing code...
      }
    }

    // ...existing code...
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await updateUserByFirebaseUid(req.user.firebaseUid, { avatarUrl });
    user = await findUserByFirebaseUid(req.user.firebaseUid);

    // ...existing code...

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
    // ...existing code...
    
    // Handle MongoDB duplicate key error (code 11000)
    if (error && error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        message: `${duplicateField} already exists in the system!`,
      });
    }
    
    // Handle validation errors
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error: ' + (error.message || 'Invalid data'),
      });
    }
    
    res.status(500).json({
      message: 'Server error while uploading avatar!',
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error))
        : undefined,
    });
  }
};

/**
 * PUT /api/users/me
 * Update current user information
 * Requires: verifyFirebaseToken middleware
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl, phone, address, gender, dateOfBirth } = req.body;
    // Load user from Firestore
    const user = await findUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      return res.status(404).json({
        message: 'User not found in system!',
      });
    }

    // Prepare updates object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (phone !== undefined) {
      const trimmed = phone.trim();
      if (trimmed !== '') {
        const existingUser = await findUserByPhone(trimmed, user.id);
        if (existingUser) {
          return res.status(400).json({
            message: 'This phone number is already in use by another account!',
          });
        }
      }
      updates.phone = trimmed;
    }
    if (address !== undefined) updates.address = address;
    if (gender !== undefined) {
      if (gender === '' || ['male', 'female', 'other'].includes(gender)) {
        updates.gender = gender;
      } else {
        return res.status(400).json({
          message: 'Invalid gender value! Must be "male", "female", "other", or empty string.',
        });
      }
    }
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) {
        updates.dateOfBirth = null;
      } else {
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            message: 'Invalid date format! Please use YYYY-MM-DD format.',
          });
        }
        updates.dateOfBirth = date;
      }
    }

    // Apply updates to Firestore
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
        role: updated.role,
        isPremium: updated.isPremium,
      },
    });
  } catch (error) {
    // ...existing code...
    
    // Handle duplicate phone number error
    if (error.code === 11000 && error.keyPattern?.phone) {
      return res.status(400).json({ 
        message: 'This phone number is already in use by another account!' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error while updating information!' 
    });
  }
};

/**
 * POST /api/users/logout
 * Logout (mainly for logging, token is deleted on frontend)
 * Requires: verifyFirebaseToken middleware
 */
export const logout = async (req, res) => {
  try {
    // Firebase token is stateless, no need to revoke on server
    // Frontend will delete token from localStorage
    // Can add logging here if needed

    res.json({ 
      message: 'Logged out successfully!' 
    });
  } catch (error) {
    // ...existing code...
    res.status(500).json({ 
      message: 'Server error!' 
    });
  }
};

/**
 * GET /api/users
 * Get all users list (admin only)
 * Requires: verifyFirebaseToken, isAdmin middleware
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await listUsers(1000);

    res.json(
      users.map((user) => ({
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone || '',
        address: user.address || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || null,
        role: user.role,
        isPremium: user.isPremium,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }))
    );
  } catch (error) {
    // ...existing code...
    res.status(500).json({ 
      message: 'Server error while getting users list!' 
    });
  }
};

/**
 * PUT /api/users/:id
 * Update user (admin only)
 * Requires: verifyFirebaseToken, isAdmin middleware
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, phone, address, gender, dateOfBirth, role, isPremium } = req.body;

    // `id` is treated as firebaseUid in Firestore
    const user = await findUserByFirebaseUid(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found!'
      });
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (gender !== undefined) {
      if (gender === '' || ['male', 'female', 'other'].includes(gender)) {
        user.gender = gender;
      } else {
        return res.status(400).json({ 
          message: 'Invalid gender value! Must be "male", "female", "other", or empty string.' 
        });
      }
    }
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) {
        user.dateOfBirth = null;
      } else {
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ 
            message: 'Invalid date format! Please use YYYY-MM-DD format.' 
          });
        }
        user.dateOfBirth = date;
      }
    }
    if (role !== undefined) {
      if (['user', 'admin'].includes(role)) {
        user.role = role;
      } else {
        return res.status(400).json({ 
          message: 'Invalid role! Must be "user" or "admin".' 
        });
      }
    }
    if (isPremium !== undefined) user.isPremium = isPremium;

    const updated = await updateUserByFirebaseUid(id, {
      name: name !== undefined ? name : user.name,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
      phone: phone !== undefined ? phone : user.phone,
      address: address !== undefined ? address : user.address,
      gender: gender !== undefined ? gender : user.gender,
      dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : user.dateOfBirth,
      role: role !== undefined ? role : user.role,
      isPremium: isPremium !== undefined ? isPremium : user.isPremium,
    });

    res.json({
      message: 'User updated successfully!',
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
        role: updated.role,
        isPremium: updated.isPremium,
      },
    });
  } catch (error) {
    // ...existing code...
    res.status(500).json({ 
      message: 'Server error while updating user!' 
    });
  }
};

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 * Requires: verifyFirebaseToken, isAdmin middleware
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Treat `id` as firebaseUid
    // Don't allow deleting yourself
    const currentUser = await findUserByFirebaseUid(req.user.firebaseUid);
    if (currentUser && currentUser.id === id) {
      return res.status(400).json({
        message: 'You cannot delete yourself!'
      });
    }

    const user = await findUserByFirebaseUid(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found!'
      });
    }

    // Delete user from Firestore
    await deleteUserByFirebaseUid(id);

    // Delete user from Firebase Auth (best-effort)
    try {
      await auth.deleteUser(user.firebaseUid);
      // ...existing code...
    } catch (firebaseError) {
      // ...existing code...
    }

    res.json({
      message: 'User deleted successfully!'
    });
  } catch (error) {
    // ...existing code...
    res.status(500).json({ 
      message: 'Server error while deleting user!' 
    });
  }
};

/**
 * POST /api/users/cleanup-firebase
 * Cleanup user in Firebase Authentication if not exists in MongoDB
 * Public endpoint to fix case where user was deleted in MongoDB but still exists in Firebase
 */
export const cleanupFirebaseUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required!',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format!',
      });
    }

    try {
      // Check if user exists in Firebase
      const userRecord = await auth.getUserByEmail(email);
      const firebaseUid = userRecord.uid;

      // Check if user exists in Firestore
      const mongoUser = await findUserByFirebaseUid(firebaseUid);

      if (mongoUser) {
        // User exists in both, no cleanup needed
        return res.json({
          success: true,
          message: 'User exists in both Firebase and MongoDB. No cleanup needed.',
          cleanup: false,
        });
      }

      // User exists in Firebase but not in MongoDB - delete from Firebase
      await auth.deleteUser(firebaseUid);
      // ...existing code...

      return res.json({
        success: true,
        message: 'User deleted from Firebase Authentication successfully!',
        cleanup: true,
      });
    } catch (error) {
      // Firebase error codes
      if (error.code === 'auth/user-not-found') {
        return res.json({
          success: true,
          message: 'User does not exist in Firebase. No cleanup needed.',
          cleanup: false,
        });
      }

      // ...existing code...
      return res.status(500).json({
        success: false,
        message: 'Error cleaning up user in Firebase.',
      });
    }
  } catch (error) {
    // ...existing code...
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning up user!',
    });
  }
};

