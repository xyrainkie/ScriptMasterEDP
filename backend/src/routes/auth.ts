import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '@/services/authService';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { ApiResponse, LoginRequest, RegisterRequest } from '@/types';

const router = Router();
const authService = new AuthService();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Register new user
router.post('/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('full_name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
      .optional()
      .isIn(['DEVELOPER', 'ARTIST', 'UPLOADER'])
      .withMessage('Invalid role specified'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: any, res: any) => {
    const userData: RegisterRequest = req.body;

    try {
      const result = await authService.register(userData);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'User registered successfully',
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      res.status(400).json(response);
    }
  })
);

// Login user
router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: any, res: any) => {
    const credentials: LoginRequest = req.body;

    try {
      const result = await authService.login(credentials);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Login successful',
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      res.status(401).json(response);
    }
  })
);

// Get current user profile
router.get('/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const response: ApiResponse = {
      success: true,
      data: req.user,
      message: 'Profile retrieved successfully',
    };

    res.status(200).json(response);
  })
);

// Update user profile
router.put('/me',
  authenticate,
  [
    body('full_name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('avatar_url')
      .optional()
      .isURL()
      .withMessage('Avatar URL must be a valid URL'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const updates = req.body;

    try {
      const updatedUser = await authService.updateUser(req.user!.id, updates);

      const response: ApiResponse = {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      res.status(400).json(response);
    }
  })
);

// Change password
router.put('/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { currentPassword, newPassword } = req.body;

    try {
      await authService.changePassword(req.user!.id, currentPassword, newPassword);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      res.status(400).json(response);
    }
  })
);

// Logout (client-side token removal)
router.post('/logout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: any) => {
    // In a stateless JWT implementation, logout is handled client-side
    // However, we could implement a blacklist if needed

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.status(200).json(response);
  })
);

// Verify token (for frontend token validation)
router.get('/verify',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const response: ApiResponse = {
      success: true,
      data: {
        valid: true,
        user: req.user,
      },
      message: 'Token is valid',
    };

    res.status(200).json(response);
  })
);

export default router;