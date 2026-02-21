import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

function isAdmin(email: string): boolean {
  const list = process.env.ADMIN_EMAILS ?? "";
  return list
    .split(",")
    .some((e) => e.trim().toLowerCase() === email.toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // required for Vercel and other serverless hosts
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email?.trim()) return null;
        const user = await prisma.user.upsert({
          where: { email: email.trim().toLowerCase() },
          create: {
            email: email.trim().toLowerCase(),
            name: email.split("@")[0],
            balance: 10000, // 100.00 in cents for new users (starter balance)
            role: isAdmin(email) ? "admin" : "user",
          },
          update: {},
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = (token.email as string) ?? session.user.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
