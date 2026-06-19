export type CourseStatus = "draft" | "published" | "archived";
export type LessonType = "video" | "offline";
export type OfflineRegistrationStatus = "registered" | "cancelled" | "attended";

export type CourseRow = {
  id: string;
  author_id: string;
  title: string;
  description_html: string;
  cover_storage_path: string | null;
  status: CourseStatus;
  price_rub: number;
  created_at: string;
  updated_at: string;
};

export type CourseModuleRow = {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  created_at: string;
};

export type CourseLessonRow = {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  body_html: string;
  lesson_type: LessonType;
  video_url: string | null;
  video_storage_path: string | null;
  video_file_key: string | null;
  video_file_url: string | null;
  hls_playlist_key: string | null;
  video_processing_status: "none" | "uploading" | "processing" | "ready" | "failed";
  video_mime_type: string | null;
  video_size_bytes: number | null;
  video_upload_error: string | null;
  description: string | null;
  video_provider: "youtube" | "vimeo" | "upload" | null;
  duration_minutes: number | null;
  offline_starts_at: string | null;
  offline_address: string | null;
  offline_stream_url: string | null;
  max_seats: number | null;
  is_free_preview: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CourseEnrollmentRow = {
  id: string;
  course_id: string;
  user_id: string;
  progress_percent: number;
  payment_id: string | null;
  enrolled_at: string;
  last_activity_at: string;
};

export type AuthorProfileRow = {
  id: string;
  user_id: string;
  bio: string | null;
  avatar_url: string | null;
  telegram: string | null;
  website: string | null;
  revenue_percent: number;
  created_at: string;
  updated_at: string;
};

export type LessonProgressRow = {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OfflineRegistrationRow = {
  id: string;
  lesson_id: string;
  course_id: string;
  user_id: string;
  registered_at: string;
  status: OfflineRegistrationStatus;
  lesson_title?: string;
  user_name?: string;
  user_email?: string;
};

export type CourseSaleRow = {
  id: string;
  course_id: string;
  author_id: string;
  buyer_id: string | null;
  amount_rub: number;
  sold_at: string;
  payment_ref: string | null;
};

export type AuthorDashboardStats = {
  studentCount: number;
  revenueRub: number;
  totalRevenueRub: number;
  courseCount: number;
  salesLast30Days: { date: string; amountRub: number; count: number }[];
  recentOfflineRegistrations: OfflineRegistrationRow[];
};

export type CourseWithTree = CourseRow & {
  modules: (CourseModuleRow & { lessons: CourseLessonRow[] })[];
};

export type StudentRow = {
  userId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  progressPercent: number;
  enrolledAt: string;
  lastActivityAt: string;
};
