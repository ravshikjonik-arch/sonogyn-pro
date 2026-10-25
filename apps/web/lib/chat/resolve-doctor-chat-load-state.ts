export type DoctorChatLoadStateKind =
  | "auth_required"
  | "community_access"
  | "migration"
  | "network"
  | "unknown";

export type DoctorChatLoadState = {
  kind: DoctorChatLoadStateKind;
  title: string;
  detail: string;
  showMigrationHint: boolean;
  showLoginCta: boolean;
};

const MIGRATION_MARKERS = ["doctor_chat", "relation", "does not exist", "PGRST"];

function looksLikeMigrationError(message: string): boolean {
  const lower = message.toLowerCase();
  return MIGRATION_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

/**
 * Maps HTTP + API error text to user-facing panel (no misleading "DB not connected" for guests).
 */
export function resolveDoctorChatLoadState(params: {
  hasUser: boolean;
  httpStatus: number | null;
  errorMessage: string | null;
}): DoctorChatLoadState | null {
  if (!params.hasUser) {
    return null;
  }

  if (params.httpStatus === 401) {
    return {
      kind: "auth_required",
      title: "Сессия истекла",
      detail: "Войдите снова, чтобы продолжить переписку.",
      showMigrationHint: false,
      showLoginCta: true,
    };
  }

  if (params.httpStatus === 403) {
    return {
      kind: "community_access",
      title: "Нет доступа к врачебному чату",
      detail:
        "Чат коллег открывается для ординаторов, врачей и подтверждённых специалистов. Заполните профиль и дождитесь проверки или обратитесь к администратору.",
      showMigrationHint: false,
      showLoginCta: false,
    };
  }

  const message = (params.errorMessage ?? "").trim();
  if (!message && params.httpStatus && params.httpStatus >= 500) {
    return {
      kind: "network",
      title: "Не удалось загрузить сообщения",
      detail: "Проверьте сеть и обновите страницу.",
      showMigrationHint: false,
      showLoginCta: false,
    };
  }

  if (message && looksLikeMigrationError(message)) {
    return {
      kind: "migration",
      title: "Чат не подключён к базе данных",
      detail: message,
      showMigrationHint: true,
      showLoginCta: false,
    };
  }

  if (params.httpStatus && !params.httpStatus.toString().startsWith("2")) {
    return {
      kind: "unknown",
      title: "Не удалось загрузить чат",
      detail: message || `Ошибка сервера (${params.httpStatus}).`,
      showMigrationHint: false,
      showLoginCta: false,
    };
  }

  return null;
}
