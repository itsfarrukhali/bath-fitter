// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      email?: string;
      fullName?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username?: string;
    email?: string;
    fullName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }
}
