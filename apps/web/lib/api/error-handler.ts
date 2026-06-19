import { NextResponse } from "next/server";

import {
  INTERNAL_ERROR_MESSAGE,
  logError,
  publicErrorMessage,
  type LogChannel,
  type LogContext,
} from "@/services/logger";

export type ApiErrorContext = {
  /** Имя маршрута для логов, напр. "POST /api/payment/create". */
  route: string;
  /** Канал критичности — payment/sms триггерят мгновенный Telegram-алерт. */
  channel?: LogChannel;
  /** Считать ошибку критической (instant Telegram). */
  critical?: boolean;
  /** Идентификатор пользователя (НЕ PII — это uuid). */
  userId?: string;
  /** Доп. контекст (очистится от PII/секретов в логгере). */
  context?: LogContext;
};

/**
 * Единая обработка ошибки в API-роуте:
 *  - пишет ошибку и стектрейс в Vercel Logs;
 *  - при critical/payment/sms — мгновенно уведомляет админов в Telegram;
 *  - наружу отдаёт безопасное сообщение (в production — «Внутренняя ошибка сервера»).
 */
export function handleApiError(error: unknown, status: number, ctx: ApiErrorContext): NextResponse {
  logError(`API error: ${ctx.route}`, error, {
    channel: ctx.channel,
    critical: ctx.critical,
    context: {
      route: ctx.route,
      ...(ctx.userId ? { userId: ctx.userId } : {}),
      ...(ctx.context ?? {}),
    },
  });

  return NextResponse.json(
    { error: publicErrorMessage(error, INTERNAL_ERROR_MESSAGE) },
    { status },
  );
}

type RouteHandler<Ctx> = (request: Request, routeCtx: Ctx) => Promise<Response> | Response;

/**
 * Обёртка для Route Handler: ловит исключения и прогоняет через handleApiError.
 *
 * @example
 * export const POST = withApiErrorLogging(
 *   { route: "POST /api/payment/create", channel: "payment" },
 *   async (req) => { ... },
 * );
 */
export function withApiErrorLogging<Ctx = unknown>(
  meta: Omit<ApiErrorContext, "userId" | "context"> & { context?: LogContext },
  handler: RouteHandler<Ctx>,
): RouteHandler<Ctx> {
  return async (request: Request, routeCtx: Ctx) => {
    try {
      return await handler(request, routeCtx);
    } catch (error) {
      return handleApiError(error, 500, {
        route: meta.route,
        channel: meta.channel,
        critical: meta.critical,
        context: meta.context,
      });
    }
  };
}
