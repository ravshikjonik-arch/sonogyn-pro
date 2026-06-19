import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { notifyCourseStudents } from "@/lib/courses/notify-students";
import { NotifyStudentsSchema } from "@/lib/courses/schemas";

type Params = { params: Promise<{ courseId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async () => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = NotifyStudentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const channels = {
      email: parsed.data.channels.email ?? false,
      sms: parsed.data.channels.sms ?? false,
      telegram: parsed.data.channels.telegram ?? false,
    };

    if (!channels.email && !channels.sms && !channels.telegram) {
      return NextResponse.json({ error: "Выберите хотя бы один канал." }, { status: 400 });
    }

    const result = await notifyCourseStudents({
      courseId,
      subject: parsed.data.subject,
      message: parsed.data.message,
      channels,
    });

    return NextResponse.json({ ok: true, result });
  });
}
