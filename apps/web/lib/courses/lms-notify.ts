import { TelegramService } from "@/services/telegram";

export function notifyCourseEnrollmentSafe(params: {
  userId: string;
  courseId: string;
  courseTitle: string;
  authorId?: string;
  amountRub?: number;
}): void {
  TelegramService.notifyAdminsSafe("course.enrollment", {
    userId: params.userId,
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    authorId: params.authorId,
    amountRub: params.amountRub ?? 0,
  });
}

export function notifyOfflineRegistrationSafe(params: {
  userId: string;
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  startsAt?: string | null;
}): void {
  TelegramService.notifyAdminsSafe("course.offline_registration", {
    userId: params.userId,
    lessonId: params.lessonId,
    courseId: params.courseId,
    lessonTitle: params.lessonTitle,
    startsAt: params.startsAt,
  });
}
