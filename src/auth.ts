import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (secret) {
  (authConfig as NextAuthOptions & { secret: string }).secret = secret;
}

export const authOptions: NextAuthOptions = authConfig;

export const getServerAuthSession = () => getServerSession(authOptions);
