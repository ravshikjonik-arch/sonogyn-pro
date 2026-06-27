export type WebinarSessionStatus = "scheduled" | "live" | "ended" | "cancelled";

export type WebinarSessionRow = {
  id: string;
  lesson_id: string;
  course_id: string;
  room_name: string;
  status: WebinarSessionStatus;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  livekit_room_sid: string | null;
  recording_storage_key: string | null;
  created_at: string;
  updated_at: string;
};

export type WebinarChatMessageRow = {
  id: string;
  session_id: string;
  lesson_id: string;
  author_id: string;
  author_display_name: string | null;
  body: string;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
};

export type WebinarListItem = {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  priceRub: number;
  scheduledAt: string;
  status: WebinarSessionStatus;
  durationMinutes: number | null;
  authorName: string | null;
  hasAccess: boolean;
  isHost: boolean;
};
