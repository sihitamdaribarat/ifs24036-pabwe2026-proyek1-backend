import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
} from './controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { authRateLimiter } from '../../middlewares/rateLimit.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from './schema.js';

const router = Router();

// Public auth routes
router.post('/auth/register', authRateLimiter, validate(registerSchema), register);
router.post('/auth/login', authRateLimiter, validate(loginSchema), login);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', authenticate, logout);

// User profile routes
router.get('/users/me', authenticate, getMe);
router.patch('/users/me', authenticate, validate(updateProfileSchema), updateMe);

export default router;
