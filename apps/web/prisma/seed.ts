/**
 * Seed: создание администратора.
 *
 * Запуск: `npx prisma db seed` (после `prisma generate` и применения схемы).
 * Требует ADMIN_EMAIL в окружении. Пароль здесь не задаётся — аутентификация
 * по-прежнему через Supabase Auth; это запись роли в Prisma-таблице prisma_users.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  if (!email) {
    throw new Error("Укажите ADMIN_EMAIL в .env для seed-скрипта.");
  }

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "admin" },
    create: {
      email,
      name: process.env.ADMIN_NAME?.trim() || "Администратор",
      role: "admin",
      phoneVerified: true,
    },
  });

  console.log(`Админ готов: ${admin.email} (id=${admin.id}, role=${admin.role})`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
