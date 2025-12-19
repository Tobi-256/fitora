import { auth } from '../config/firebase.js';

/**
 * Middleware to verify Firebase ID Token
 * Token is sent in header: Authorization: Bearer <token>
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

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

    // Verify token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    
    // Attach user info to request
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
    };

    next();
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    
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

/**
 * Middleware to check admin permissions
 * Must be placed after verifyFirebaseToken
 */
export const isAdmin = async (req, res, next) => {
  try {
    // Get user from database to check role
    const User = (await import('../models/user.js')).default;
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found in system!' 
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only admins can perform this action!' 
      });
    }

    // Attach user from DB to request for use in controller
    req.dbUser = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ 
      message: 'Server error while checking permissions!' 
    });
  }
};
