import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Missing email or passsword");
        }

        try {
          const user = await prisma.admin.findFirst({
            where: {
              OR: [
                { email: credentials.identifier },
                { username: credentials.identifier },
              ],
            },
          });
          console.log("DB Query params:", {
            identifier: credentials.identifier,
          });
          console.log("User found:", user);
          if (!user) {
            throw new Error("No user found with this email or username");
          }
          if (!user.password) {
            throw new Error("Password is missing");
          }
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordCorrect) {
            throw new Error("Incorrect password");
          }
          // Transform the Prisma User into NextAuth User
          return {
            id: user.id,
            email: user.email || undefined,
            username: user.username || undefined,
            fullName: user.fullName || undefined,
          };
        } catch (err: unknown) {
          const error =
            err instanceof Error ? err.message : "An error occurred";
          console.error("Authorize Error:", error);
          throw new Error(error);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Use the ID from the JWT token
        session.user.id = token.id as string;

        // Retrieve other user details from the database
        const user = await prisma.admin.findUnique({
          where: { id: token.id as string },
          select: {
            username: true,
          },
        });

        if (user) {
          session.user.username = user.username ?? undefined;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
