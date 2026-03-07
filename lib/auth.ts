import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      name?: string;
      teacherId?: number;
      studentId?: number;
    };
  }
  interface User {
    teacherId?: number;
    studentId?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    teacherId?: number;
    studentId?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        if (!user || !user.active) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        // Look up teacher or student by userId or mobile/email
        let teacherId: number | undefined;
        let studentId: number | undefined;

        if (user.role === "TEACHER") {
          const teacher = await prisma.teacher.findFirst({
            where: { 
              OR: [
                { userId: user.id },
                { mobile: credentials.username as string }
              ]
            },
            select: { id: true }
          });
          teacherId = teacher?.id;
        } else if (user.role === "STUDENT") {
          const student = await prisma.student.findFirst({
            where: { 
              OR: [
                { userId: user.id },
                { mobile: credentials.username as string },
                { email: credentials.username as string }
              ]
            },
            select: { id: true }
          });
          studentId = student?.id;
        }

        return {
          id: user.id.toString(),
          username: user.username,
          role: user.role,
          name: user.name,
          teacherId,
          studentId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
        token.username = (user as { username: string }).username;
        token.name = (user as { name?: string }).name || "";
        token.teacherId = (user as { teacherId?: number }).teacherId;
        token.studentId = (user as { studentId?: number }).studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.name = token.name as string;
        session.user.teacherId = token.teacherId;
        session.user.studentId = token.studentId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler };
