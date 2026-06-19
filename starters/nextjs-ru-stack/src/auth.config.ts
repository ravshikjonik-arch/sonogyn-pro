import type { NextAuthConfig } from "next-auth";

/** Edge-safe конфиг (middleware). Providers — только в auth.ts (Node.js). */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.phoneVerified = Boolean(token.phoneVerified);
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
} satisfies NextAuthConfig;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phoneVerified?: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    phoneVerified?: boolean;
  }
}
