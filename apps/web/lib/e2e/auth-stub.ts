import testData from "@/lib/e2e/fixtures/test-data.json";

export const E2E_AUTH_COOKIE = "sonogyn-e2e-auth";

export type E2eAuthRole = "doctor" | "admin";

export function e2eStubValidateSignIn(
  email: string,
  password: string,
): { ok: true; role: E2eAuthRole } | { ok: false; error: string } {
  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail === testData.doctor.email.toLowerCase() &&
    password === testData.doctor.password
  ) {
    return { ok: true, role: "doctor" };
  }

  if (
    normalizedEmail === testData.admin.email.toLowerCase() &&
    password === testData.admin.password
  ) {
    return { ok: true, role: "admin" };
  }

  return { ok: false, error: "Неверный email или пароль." };
}

export function e2eStubUserPayload(role: E2eAuthRole): Record<string, unknown> {
  const source = role === "admin" ? testData.admin : testData.doctor;

  return {
    id: role === "admin" ? "e2e-admin-id" : "e2e-user-id",
    email: source.email,
    user_metadata: { full_name: source.fullName },
    app_metadata: { role: role === "admin" ? "admin" : "doctor" },
  };
}

export function e2eStubRoleFromCookie(cookieValue: string | undefined): E2eAuthRole | null {
  if (cookieValue === "doctor" || cookieValue === "admin") return cookieValue;
  return null;
}

export function e2eStubUserFromRequest(request: Request): Record<string, unknown> | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${E2E_AUTH_COOKIE}=([^;]+)`));
  const role = e2eStubRoleFromCookie(match?.[1]);
  if (!role) return null;
  return e2eStubUserPayload(role);
}

export function e2eStubAuthCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
