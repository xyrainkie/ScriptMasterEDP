
export type Role = 'DEVELOPER' | 'ARTIST' | 'UPLOADER';

export enum AssetType {
  IMAGE = '图片 (Image)',
  AUDIO = '音频 (Audio)',
  VIDEO = '视频 (Video)',
  ANIMATION = '动画 (Animation)',
  COMPONENT = 'React组件 (Component)',
  DEFAULT = '默认 (Default)',
}

export interface Asset {
  id: string;
  name: string;
  title?: string;
  extrasTitle?: string;
  type: AssetType;
  description: string; // Context: In Config mode = Default Desc; In Script mode = Specific Content
  dimensions?: string; 
  format?: string;     
  formats?: string[];  
  uploadInstructions: string; 
  fileSize?: string;
  extras?: Array<{ key?: string; value?: string; title?: string; content?: string; type?: AssetType; formats?: string[]; dimensions?: string; fileSize?: string; collapsed?: boolean; customFields?: Record<string, string> }>;
  customFields?: Record<string, string>;
  enabled?: boolean;
  sectionId?: string;
  status: 'PENDING' | 'READY' | 'UPLOADED';
}

// A blueprint for a type of page (e.g., "Interactive Scene")
export interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  presets: Asset[];
  customColumns?: string[];
}

// A definition for a single step in a Course Type
export interface CoursePresetStep {
    id: string;
    title: string; // e.g. "Warm-up"
    templateId: string; // The template to use for this step
    note?: string;
}

// A defined Course Type (e.g., "Phonics Lesson Flow")
export interface CoursePreset {
    id: string;
    name: string;
    steps: CoursePresetStep[];
}

// A specific instance of a teaching segment in the course
export interface Segment {
  id: string;
  title: string; // e.g., "Warm-up", "Page 1"
  templateId: string;
  templateName: string; // Snapshot of name in case template is deleted
  assets: Asset[]; // The actual filled-in assets
  note?: string;
}

// The top-level document
export interface CourseProject {
  id: string;
  title: string; // e.g., "Unit 1: Hello World"
  templates: Template[]; // The Library of Templates
  coursePresets: CoursePreset[]; // The Library of Course Flows
  segments: Segment[];   // The Timeline of Segments
}
