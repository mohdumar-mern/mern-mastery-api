import expressAsyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import logger from '../utils/logger.js';
import { generateToken } from '../utils/generateToken.js';

// Register
export const register = expressAsyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] }).lean();
  if (existingUser) {
    logger.warn(`Registration attempt with existing email/username: ${email}/${username}`);
    return res.status(400).json({ message: 'User with this email or username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds
  const newUser = await User.create({ username, email, password: hashedPassword, role });

  const token = generateToken(newUser._id, newUser.role);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // CSRF protection
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
  });

  logger.info(`User registered: ${email}`);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
  });
});

// Login
export const login = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn(`Invalid password attempt for email: ${email}`);
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user._id, user.role);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  logger.info(`User logged in: ${email}`);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

// Logout
export const logout = expressAsyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  logger.info('User logged out');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});