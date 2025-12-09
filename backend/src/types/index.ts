export type UserRole = 'DEVELOPER' | 'ARTIST' | 'UPLOADER' | 'ADMIN';

export enum AssetType {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  ANIMATION = 'ANIMATION',
  COMPONENT = 'COMPONENT',
}

export enum AssetStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  UPLOADED = 'UPLOADED',
  APPROVED = 'APPROVED',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
}

// Database entity interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  dimensions?: string;
  format?: string;
  upload_instructions: string;
  status: AssetStatus;
  file_path?: string;
  file_size?: number;
  template_id?: string;
  segment_id?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CoursePreset {
  id: string;
  name: string;
  description?: string;
  steps: CoursePresetStep[];
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CoursePresetStep {
  id: string;
  title: string;
  template_id: string;
  template?: Template;
  order_index: number;
  preset_id: string;
}

export interface Segment {
  id: string;
  title: string;
  template_id: string;
  template?: Template;
  project_id: string;
  order_index: number;
  content?: string;
  notes?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  created_by: string;
  creator?: User;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  author?: User;
  target_type: 'PROJECT' | 'SEGMENT' | 'ASSET';
  target_id: string;
  parent_id?: string;
  replies?: Comment[];
  created_at: Date;
  updated_at: Date;
}

export interface ExportHistory {
  id: string;
  project_id: string;
  export_type: 'DEVELOPER' | 'ARTIST' | 'UPLOADER';
  file_path: string;
  file_name: string;
  file_size: number;
  exported_by: string;
  created_at: Date;
}

// API Request/Response types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  course_preset_id?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: Date;
  end_date?: Date;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  assets: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'created_by'>[];
}

export interface ExportRequest {
  project_id: string;
  export_type: 'DEVELOPER' | 'ARTIST' | 'UPLOADER';
  include_comments?: boolean;
  include_assets?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}