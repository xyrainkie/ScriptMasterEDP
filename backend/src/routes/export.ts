import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { ExcelExportService } from '@/services/excelExportService';
import { authenticate, AuthRequest, authorize } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { UserRole, ExportRequest, ApiResponse } from '@/types';
import path from 'path';

const router = Router();
const exportService = new ExcelExportService();

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

// Export project to Excel
router.post('/excel',
  authenticate,
  [
    body('project_id')
      .notEmpty()
      .withMessage('Project ID is required')
      .isUUID()
      .withMessage('Invalid Project ID format'),
    body('export_type')
      .isIn(['DEVELOPER', 'ARTIST', 'UPLOADER'])
      .withMessage('Export type must be DEVELOPER, ARTIST, or UPLOADER'),
    body('include_comments')
      .optional()
      .isBoolean()
      .withMessage('include_comments must be a boolean'),
    body('include_assets')
      .optional()
      .isBoolean()
      .withMessage('include_assets must be a boolean'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const exportRequest: ExportRequest = req.body;
    const exportedBy = req.user!.id;

    try {
      const result = await exportService.exportProject(exportRequest, exportedBy);

      // Send file for download
      const fileName = path.basename(result.fileName);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', result.fileSize);

      // Stream the file
      res.sendFile(result.fileName, { root: process.env.EXCEL_EXPORT_PATH || './exports' }, (err: any) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Error downloading file',
            } as ApiResponse);
          }
        }
      });

    } catch (error: any) {
      console.error('Export error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Export failed',
      };
      res.status(500).json(response);
    }
  })
);

// Get export history for a project
router.get('/history/:projectId',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { projectId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      // TODO: Implement getExportHistory method in database service
      const response: ApiResponse = {
        success: true,
        data: {
          exports: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
            has_next: false,
            has_prev: false,
          },
        },
        message: 'Export history retrieved successfully',
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

// Download previous export
router.get('/download/:exportId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { exportId } = req.params;

    try {
      // TODO: Implement export history lookup and file validation
      const response: ApiResponse = {
        success: false,
        error: 'Export download not implemented yet',
      };
      res.status(501).json(response);

    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      res.status(500).json(response);
    }
  })
);

// Get export statistics (admin only)
router.get('/stats',
  authenticate,
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthRequest, res: any) => {
    try {
      // TODO: Implement export statistics
      const response: ApiResponse = {
        success: true,
        data: {
          totalExports: 0,
          developerExports: 0,
          artistExports: 0,
          uploaderExports: 0,
          recentExports: [],
        },
        message: 'Export statistics retrieved successfully',
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
