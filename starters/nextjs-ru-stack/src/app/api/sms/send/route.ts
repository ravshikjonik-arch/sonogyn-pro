import { NextResponse } from "next/server";

/** @deprecated Используйте POST /api/auth/sms/send */
export async function POST(req: Request) {
  const url = new URL("/api/auth/sms/send", req.url);
  const body = await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: req.headers,
    body,
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: res.headers });
}
