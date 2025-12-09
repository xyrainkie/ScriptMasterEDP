import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import db from '@/config/database';

const router = Router();

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

// Get all templates
router.get('/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: any) => {
    try {
      const templates = await db('templates')
        .where('is_active', true)
        .orderBy('name', 'asc');

      const response: ApiResponse = {
        success: true,
        data: templates,
        message: 'Templates retrieved successfully',
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

// Get template by ID with assets
router.get('/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: any) => {
    try {
      const template = await db('templates')
        .where('id', req.params.id)
        .first();

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
        } as ApiResponse);
      }

      // Get template assets
      const assets = await db('assets')
        .where('template_id', template.id)
        .orderBy('name', 'asc');

      const templateWithAssets = {
        ...template,
        assets,
      };

      const response: ApiResponse = {
        success: true,
        data: templateWithAssets,
        message: 'Template retrieved successfully',
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