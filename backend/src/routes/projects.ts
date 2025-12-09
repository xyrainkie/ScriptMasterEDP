import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest, authorize, authorizeSelfOrAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { UserRole, CreateProjectRequest, UpdateProjectRequest, ProjectStatus, ApiResponse, PaginatedResponse } from '@/types';
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

// Create new project
router.post('/',
  authenticate,
  authorize(['DEVELOPER', 'ADMIN']),
  [
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('course_preset_id')
      .optional()
      .isUUID()
      .withMessage('Invalid course preset ID format'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const projectData: CreateProjectRequest = req.body;
    const createdBy = req.user!.id;

    try {
      const project = {
        id: uuidv4(),
        title: projectData.title,
        description: projectData.description,
        status: ProjectStatus.DRAFT,
        created_by: createdBy,
        start_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db('projects').insert(project);

      // Fetch project with creator info
      const createdProject = await db('projects')
        .select('projects.*', 'users.full_name as creator_name', 'users.email as creator_email')
        .leftJoin('users', 'projects.created_by', 'users.id')
        .where('projects.id', project.id)
        .first();

      const response: ApiResponse = {
        success: true,
        data: createdProject,
        message: 'Project created successfully',
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Create project error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to create project',
      };
      res.status(500).json(response);
    }
  })
);

// Get all projects (with pagination and filtering)
router.get('/',
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
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('status')
      .optional()
      .isIn(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
      .withMessage('Invalid status'),
    query('created_by')
      .optional()
      .isUUID()
      .withMessage('Invalid creator ID format'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      created_by,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    try {
      let query = db('projects')
        .select('projects.*', 'users.full_name as creator_name', 'users.email as creator_email')
        .leftJoin('users', 'projects.created_by', 'users.id');

      // Apply filters
      if (search) {
        query = query.where((builder) => {
          builder
            .where('projects.title', 'like', `%${search}%`)
            .orWhere('projects.description', 'like', `%${search}%`);
        });
      }

      if (status) {
        query = query.where('projects.status', status);
      }

      if (created_by) {
        query = query.where('projects.created_by', created_by);
      }

      // Non-admin users can only see their own projects
      if (req.user!.role !== 'ADMIN') {
        query = query.where('projects.created_by', req.user!.id);
      }

      // Get total count
      const totalQuery = query.clone().clearSelect().clearOrder().count('* as count');
      const [{ count }] = await totalQuery;
      const total = parseInt(count as string);

      // Apply sorting and pagination
      const validSortFields = ['title', 'status', 'created_at', 'updated_at'];
      const sortField = validSortFields.includes(sort_by as string) ? sort_by as string : 'created_at';
      const sortDirection = (sort_order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const projects = await query
        .orderBy(`projects.${sortField}`, sortDirection)
        .limit(parseInt(limit as string))
        .offset((parseInt(page as string) - 1) * parseInt(limit as string));

      const response: PaginatedResponse<any> = {
        success: true,
        data: projects,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
          has_next: (parseInt(page as string)) < Math.ceil(total / parseInt(limit as string)),
          has_prev: (parseInt(page as string)) > 1,
        },
        message: 'Projects retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Get projects error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to retrieve projects',
      };
      res.status(500).json(response);
    }
  })
);

// Get single project by ID
router.get('/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { id } = req.params;

    try {
      let project = await db('projects')
        .select('projects.*', 'users.full_name as creator_name', 'users.email as creator_email', 'users.role as creator_role')
        .leftJoin('users', 'projects.created_by', 'users.id')
        .where('projects.id', id)
        .first();

      if (!project) {
        const response: ApiResponse = {
          success: false,
          error: 'Project not found',
        };
        return res.status(404).json(response);
      }

      // Check permissions (admin can see all, others can only see their own)
      if (req.user!.role !== 'ADMIN' && project.created_by !== req.user!.id) {
        const response: ApiResponse = {
          success: false,
          error: 'Access denied',
        };
        return res.status(403).json(response);
      }

      // Fetch related segments and assets
      const segments = await db('segments')
        .select('segments.*', 'templates.name as template_name', 'templates.category as template_category')
        .leftJoin('templates', 'segments.template_id', 'templates.id')
        .where('segments.project_id', id)
        .orderBy('segments.order_index', 'asc');

      const assets = await db('assets')
        .where('project_id', id)
        .orWhereIn('segment_id', segments.map(s => s.id));

      const projectWithDetails = {
        ...project,
        creator: {
          id: project.created_by,
          full_name: project.creator_name,
          email: project.creator_email,
          role: project.creator_role,
        },
        segments,
        assets,
      };

      const response: ApiResponse = {
        success: true,
        data: projectWithDetails,
        message: 'Project retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Get project error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to retrieve project',
      };
      res.status(500).json(response);
    }
  })
);

// Update project
router.put('/:id',
  authenticate,
  [
    body('title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('status')
      .optional()
      .isIn(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
      .withMessage('Invalid status'),
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { id } = req.params;
    const updates: UpdateProjectRequest = req.body;

    try {
      // Check if project exists and user has permission
      const existingProject = await db('projects')
        .where('id', id)
        .first();

      if (!existingProject) {
        const response: ApiResponse = {
          success: false,
          error: 'Project not found',
        };
        return res.status(404).json(response);
      }

      if (req.user!.role !== 'ADMIN' && existingProject.created_by !== req.user!.id) {
        const response: ApiResponse = {
          success: false,
          error: 'Access denied',
        };
        return res.status(403).json(response);
      }

      const updateData = {
        ...updates,
        updated_at: new Date(),
      };

      await db('projects')
        .where('id', id)
        .update(updateData);

      // Fetch updated project
      const updatedProject = await db('projects')
        .select('projects.*', 'users.full_name as creator_name', 'users.email as creator_email')
        .leftJoin('users', 'projects.created_by', 'users.id')
        .where('projects.id', id)
        .first();

      const response: ApiResponse = {
        success: true,
        data: updatedProject,
        message: 'Project updated successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Update project error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to update project',
      };
      res.status(500).json(response);
    }
  })
);

// Delete project (soft delete by marking as inactive or hard delete)
router.delete('/:id',
  authenticate,
  authorize(['DEVELOPER', 'ADMIN']),
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { id } = req.params;

    try {
      // Check if project exists and user has permission
      const existingProject = await db('projects')
        .where('id', id)
        .first();

      if (!existingProject) {
        const response: ApiResponse = {
          success: false,
          error: 'Project not found',
        };
        return res.status(404).json(response);
      }

      if (req.user!.role !== 'ADMIN' && existingProject.created_by !== req.user!.id) {
        const response: ApiResponse = {
          success: false,
          error: 'Access denied',
        };
        return res.status(403).json(response);
      }

      // Hard delete (cascade delete should handle related records)
      await db('projects').where('id', id).del();

      const response: ApiResponse = {
        success: true,
        message: 'Project deleted successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Delete project error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to delete project',
      };
      res.status(500).json(response);
    }
  })
);

// Duplicate project
router.post('/:id/duplicate',
  authenticate,
  authorize(['DEVELOPER', 'ADMIN']),
  [
    body('new_title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('New title must be between 1 and 200 characters'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { id } = req.params;
    const { new_title } = req.body;

    try {
      // Get original project
      const originalProject = await db('projects')
        .where('id', id)
        .first();

      if (!originalProject) {
        const response: ApiResponse = {
          success: false,
          error: 'Project not found',
        };
        return res.status(404).json(response);
      }

      if (req.user!.role !== 'ADMIN' && originalProject.created_by !== req.user!.id) {
        const response: ApiResponse = {
          success: false,
          error: 'Access denied',
        };
        return res.status(403).json(response);
      }

      // Create new project
      const duplicatedProject = {
        id: uuidv4(),
        title: new_title || `${originalProject.title} (Copy)`,
        description: originalProject.description,
        status: ProjectStatus.DRAFT,
        created_by: req.user!.id,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db('projects').insert(duplicatedProject);

      // TODO: Duplicate segments and assets as well
      // This would involve copying related records with new IDs

      const response: ApiResponse = {
        success: true,
        data: duplicatedProject,
        message: 'Project duplicated successfully',
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Duplicate project error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to duplicate project',
      };
      res.status(500).json(response);
    }
  })
);

export default router;
