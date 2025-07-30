import express from 'express';

import { handleValidationErrors, validateLogin, validateUser } from '../middlewares/validateMiddleware.js';
import { login, logout, refreshToken, register } from '../controllers/authController.js';
import { authLimiter } from '../utils/rateLimiter.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';


const router = express.Router();


router.post('/register', authLimiter, validateUser, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', authLimiter, refreshToken);

export default router;