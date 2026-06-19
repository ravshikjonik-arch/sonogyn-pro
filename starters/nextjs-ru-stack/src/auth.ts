import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { normalizePhoneRu, verifyOtpHash } from "@/lib/sms/otp";
import { notifyTelegram } from "@/lib/telegram/notify";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    Credentials({
      id: "email-password",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    Credentials({
      id: "phone-sms",
      name: "SMS",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const phone = normalizePhoneRu(String(credentials?.phone ?? ""));
        const code = String(credentials?.code ?? "").trim();
        if (!phone || !code) return null;

        const row = await prisma.sMSVerification.findFirst({
          where: { phone, verifiedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!row || !verifyOtpHash(code, phone, row.codeHash)) {
          if (row) {
            await prisma.sMSVerification.update({
              where: { id: row.id },
              data: { attempts: { increment: 1 } },
            });
          }
          return null;
        }

        await prisma.sMSVerification.update({
          where: { id: row.id },
          data: { verifiedAt: new Date() },
        });

        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: { phone, phoneVerified: new Date(), name: phone },
          });
        } else if (!user.phoneVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { phoneVerified: new Date() },
          });
        }

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  events: {
    async signIn({ user, account, isNewUser }) {
      if (!isNewUser) return;
      await notifyTelegram({
        event: "user.sign_in_new",
        userId: user.id,
        payload: {
          provider: account?.provider ?? "unknown",
          email: user.email ?? "",
        },
      });
    },
  },
});
