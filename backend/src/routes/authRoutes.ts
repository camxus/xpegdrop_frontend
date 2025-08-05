import express from 'express';
import {
  signup,
  login,
  refreshToken,
  forgotPassword,
  confirmPassword,
  setNewPassword,
} from '../controllers/authController';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/confirm-password', confirmPassword);
router.post('/set-new-password', setNewPassword);

export default router;