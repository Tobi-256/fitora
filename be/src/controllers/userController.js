import User from '../models/user.js';
import { auth } from '../config/firebase.js';
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

      console.log(`✅ Password reset successfully for user: ${email}`);

      return res.json({
        success: true,
        message: 'Password has been reset successfully!',
      });
    } catch (firebaseError) {
      console.error('Firebase password reset error:', firebaseError);
      
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
    console.error('Reset password error:', error);
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
      console.error('Check email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking email. Please try again later.',
      });
    }
  } catch (error) {
    console.error('Check email error:', error);
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
    const { phone, excludeUserId } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required!',
      });
    }

    // If phone is empty string, it's available
    if (phone.trim() === '') {
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

    // Check if phone exists in MongoDB
    const query = { phone: phone.trim() };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.findOne(query);

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
    console.error('Check phone error:', error);
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

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });

    if (user) {
      // Update information if there are changes
      user.email = email;
      if (name) user.name = name;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();

      return res.json({
        message: 'User information synced successfully!',
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isPremium: user.isPremium,
        },
      });
    }

    // Create new user
    user = new User({
      firebaseUid,
      email,
      name: name || '',
      avatarUrl: avatarUrl || '',
      role: 'user',
      isPremium: false,
    });

    await user.save();

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Sync user error:', error);

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
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found in system!' 
      });
    }

    res.json({
      id: user._id,
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
    console.error('Get profile error:', error);
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
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded!',
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: 'User not found in system!',
      });
    }

    // Delete old avatar if exists
    if (user.avatarUrl && (user.avatarUrl.includes('/uploads/avatars/') || user.avatarUrl.includes('/api/uploads/avatars/'))) {
      // Remove /api prefix if exists for file system path
      const filePath = user.avatarUrl.replace('/api', '');
      const oldAvatarPath = path.join(__dirname, '../../public', filePath);
      
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          console.log('✅ Deleted old avatar:', oldAvatarPath);
        }
      } catch (err) {
        console.warn('⚠️ Failed to delete old avatar:', err);
      }
    }

    // Update avatar URL (without /api prefix, will be added in frontend)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();
    
    console.log('✅ Avatar uploaded:', avatarUrl);
    console.log('📁 File saved to:', path.join(__dirname, '../../public', avatarUrl));
    console.log('👤 User updated:', user.email, 'avatarUrl:', user.avatarUrl);

    res.json({
      message: 'Avatar uploaded successfully!',
      avatarUrl: avatarUrl,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      message: 'Server error while uploading avatar!',
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

    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found in system!' 
      });
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (phone !== undefined) {
      // If phone is being updated and not empty, check if it's already in use by another user
      if (phone.trim() !== '' && phone.trim() !== user.phone) {
        const existingUser = await User.findOne({ 
          phone: phone.trim(),
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          return res.status(400).json({ 
            message: 'This phone number is already in use by another account!' 
          });
        }
      }
      user.phone = phone.trim();
    }
    if (address !== undefined) user.address = address;
    if (gender !== undefined) {
      // Validate gender value
      if (gender === '' || ['male', 'female', 'other'].includes(gender)) {
        user.gender = gender;
      } else {
        return res.status(400).json({ 
          message: 'Invalid gender value! Must be "male", "female", "other", or empty string.' 
        });
      }
    }
    if (dateOfBirth !== undefined) {
      // If dateOfBirth is empty string or null, set to null
      if (dateOfBirth === '' || dateOfBirth === null) {
        user.dateOfBirth = null;
      } else {
        // Parse date string to Date object
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ 
            message: 'Invalid date format! Please use YYYY-MM-DD format.' 
          });
        }
        user.dateOfBirth = date;
      }
    }

    await user.save();

    res.json({
      message: 'Information updated successfully!',
      user: {
        id: user._id,
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
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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
    console.error('Logout error:', error);
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
    const users = await User.find({}, '-__v').sort({ createdAt: -1 });

    res.json(
      users.map((user) => ({
        id: user._id,
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
    console.error('Get all users error:', error);
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

    const user = await User.findById(id);

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

    await user.save();

    res.json({
      message: 'User updated successfully!',
      user: {
        id: user._id,
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
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
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

    // Don't allow deleting yourself
    const currentUser = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (currentUser._id.toString() === id) {
      return res.status(400).json({ 
        message: 'You cannot delete yourself!' 
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found!' 
      });
    }

    // Delete user from Firebase Auth
    try {
      await auth.deleteUser(user.firebaseUid);
      console.log(`✅ Deleted Firebase user: ${user.firebaseUid}`);
    } catch (firebaseError) {
      console.warn('⚠️ Failed to delete Firebase user:', firebaseError.message);
      // Continue even if Firebase deletion fails
    }

    res.json({ 
      message: 'User deleted successfully!' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
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

      // Check if user exists in MongoDB
      const mongoUser = await User.findOne({ firebaseUid });

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
      console.log(`✅ Cleaned up Firebase user: ${email} (${firebaseUid})`);

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

      console.error('Cleanup Firebase user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error cleaning up user in Firebase.',
      });
    }
  } catch (error) {
    console.error('Cleanup Firebase user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning up user!',
    });
  }
};

