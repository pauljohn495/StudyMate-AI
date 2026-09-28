export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  course: string | null;
  year_level: string | null;
  school: string | null;
  profile_image_url: string | null;
  created_at: Date;
}

export interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
  lesson_count?: number;
}

export interface LessonRow {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  processing_status: 'empty' | 'uploading' | 'processing' | 'ready' | 'failed';
  created_at: Date;
  updated_at: Date;
}
