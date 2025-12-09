import { Router } from 'express';
import { authenticate, AuthRequest, authorize } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import { AuthService } from '@/services/authService';

const router = Router();
const authService = new AuthService();

// Get all users (admin only)
router.get('/',
  authenticate,
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { page = 1, limit = 10, search, role } = req.query;

    try {
      const result = await authService.getAllUsers(
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        role as any
      );

      const response: ApiResponse = {
        success: true,
        data: result.users,
        message: 'Users retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      res.status(500).json(response);
    }
  })
);

export default router;