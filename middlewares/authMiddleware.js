import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
  if (!token) {
    logger.warn('No token provided in request');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    
    next();
  } catch (err) {
    logger.error(`Invalid token: ${err.message}`);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    logger.warn(`Unauthorized access attempt by user: ${req.user.id}`);
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
};