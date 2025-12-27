import { auth } from '../config/firebase.js';

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

    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
    };

    next();
  } catch (error) {
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

export const isAdmin = async (req, res, next) => {
  try {
    const { findUserByFirebaseUid } = await import('../services/userService.js');
    const user = await findUserByFirebaseUid(req.user.firebaseUid);

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

    req.dbUser = user;
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'Server error while checking permissions!' 
    });
  }
};
