import { PaymentCreateBodySchema } from "@/lib/security/api-body-schemas";
import { mapExternalApiError } from "@/lib/http/external-api-errors";
import { TelegramService } from "@/services/telegram";
import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { createPaymentViaSdk, loadPaymentViaSdk } from "@/lib/payment/yookassa-sdk-client";
import { isYooKassaConfigured, readDefaultProPriceRub } from "@/lib/payment/config";
import { fulfillSucceededPayment } from "@/lib/payment/fulfill-payment";
import { PAYMENT_MESSAGES, paymentError, paymentJson } from "@/lib/payment/responses";
import { guardYooKassaWebhook } from "@/lib/payment/webhook-middleware";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { logError } from "@/services/logger";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export async function handlePaymentCreate(req: Request) {
  if (!isYooKassaConfigured()) {
    return paymentError(PAYMENT_MESSAGES.notConfigured, 503);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return paymentError(PAYMENT_MESSAGES.invalidInput, 400);
  }

  const parsed = PaymentCreateBodySchema.safeParse(json);
  if (!parsed.success) {
    return paymentError(PAYMENT_MESSAGES.invalidInput, 400);
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `payment-create:${auth.userId}`,
    RL.paymentCreate.limit,
    RL.paymentCreate.windowMs,
  );
  if (!rl.ok) {
    return paymentError(PAYMENT_MESSAGES.tooManyRequests, 429);
  }

  const appOrigin = resolveAppOrigin(req);
  const amountRub = parsed.data.amountRub ?? readDefaultProPriceRub();
  const description = parsed.data.description ?? "SonoGyn Pro — подписка на 30 дней";
  const returnUrl = parsed.data.returnUrl ?? `${appOrigin}/profile?checkout=success`;

  try {
    const payment = await createPaymentViaSdk({
      userId: auth.userId,
      amountRub,
      description,
      returnUrl,
    });

    const confirmationUrl =
      payment.confirmation && "confirmation_url" in payment.confirmation
        ? payment.confirmation.confirmation_url ?? null
        : null;

    const admin = createServiceRoleClient();
    const { data: row, error: insertErr } = await admin
      .from("payments")
      .insert({
        user_id: auth.userId,
        yookassa_id: payment.id,
        amount: amountRub,
        status: payment.status,
        description,
        confirmation_url: confirmationUrl,
        metadata: payment.metadata ?? { userId: auth.userId },
      })
      .select("id")
      .single();

    if (insertErr || !row) {
      logError("payment/create: запись в БД не удалась", insertErr?.message, {
        channel: "payment",
        critical: true,
        context: { userId: auth.userId, yookassaId: payment.id, stage: "db-insert" },
      });
      return paymentError(PAYMENT_MESSAGES.recordFailed, 500);
    }

    return paymentJson({
      ok: true,
      paymentId: row.id,
      yookassaId: payment.id,
      confirmationUrl,
      amountRub,
      description,
    });
  } catch (err) {
    logError("payment/create: исключение при создании платежа", err, {
      channel: "payment",
      critical: true,
      context: { userId: auth.userId, stage: "create" },
    });
    return paymentError(mapExternalApiError("yookassa", err), 502);
  }
}

export async function handlePaymentWebhook(req: Request, rawBody: string) {
  if (!rawBody.trim()) {
    return paymentError("Пустое тело webhook.", 400);
  }

  if (!isYooKassaConfigured()) {
    return paymentError(PAYMENT_MESSAGES.notConfigured, 503);
  }

  const guard = guardYooKassaWebhook(req, rawBody);
  if (!guard.ok) {
    return paymentError(guard.message, guard.status);
  }

  const { event } = guard;
  const yookassaId = event.object.id;

  try {
    const remote = await loadPaymentViaSdk(yookassaId);
    const admin = createServiceRoleClient();

    const { data: row, error: findErr } = await admin
      .from("payments")
      .select("id, user_id, status, amount, description, metadata")
      .eq("yookassa_id", yookassaId)
      .maybeSingle();

    if (findErr) {
      logError("payment/webhook: ошибка поиска платежа", findErr.message, {
        channel: "payment",
        critical: true,
        context: { yookassaId, stage: "lookup" },
      });
      return paymentError("Ошибка базы данных.", 500);
    }

    if (!row) {
      return paymentJson({ ok: true, message: "Платёж не найден в системе — пропуск." });
    }

    const metadataUserId = remote.metadata?.userId;
    if (metadataUserId && metadataUserId !== row.user_id) {
      console.error("[payment/webhook] userId mismatch", { metadataUserId, rowUserId: row.user_id });
      return paymentError("Несовпадение metadata платежа.", 403);
    }

    const remoteAmount = Number.parseFloat(remote.amount?.value ?? "0");
    const rowAmount = Number(row.amount);
    if (Number.isFinite(remoteAmount) && Math.abs(remoteAmount - rowAmount) > 0.01) {
      console.error("[payment/webhook] amount mismatch", { remoteAmount, rowAmount });
      return paymentError("Сумма платежа не совпадает с заказом.", 403);
    }

    await admin
      .from("payments")
      .update({
        status: remote.status,
        metadata: remote.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (event.event === "payment.succeeded" && remote.status === "succeeded") {
      const rowMeta = (row.metadata ?? remote.metadata ?? {}) as Record<string, string>;
      const { data: authUser } = await admin.auth.admin.getUserById(row.user_id as string);

      await fulfillSucceededPayment(admin, {
        paymentRowId: row.id as string,
        userId: row.user_id as string,
        yookassaId,
        amountRub: rowAmount,
        description: row.description as string | null,
        previousStatus: row.status as string,
        metadata: rowMeta,
        userEmail: authUser.user?.email ?? null,
      });
    } else if (
      event.event === "payment.canceled" ||
      remote.status === "canceled"
    ) {
      TelegramService.notifyAdminsSafe("payment.error", {
        stage: "webhook",
        yookassaId,
        userId: row.user_id,
        status: remote.status,
        event: event.event,
      });
    }

    return paymentJson({ ok: true, message: "Уведомление обработано." });
  } catch (err) {
    logError("payment/webhook: исключение при обработке webhook", err, {
      channel: "payment",
      critical: true,
      context: { yookassaId, stage: "webhook" },
    });
    return paymentError(PAYMENT_MESSAGES.webhookFailed, 500);
  }
}
