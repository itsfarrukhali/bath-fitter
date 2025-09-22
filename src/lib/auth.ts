import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token || !token.id) {
    return null;
  }

  // Get additional user data from database
  const user = await prisma.admin.findUnique({
    where: { id: token.id as string },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
  };
}

export function createUnauthorizedResponse() {
  return Response.json(
    {
      success: false,
      message: "Unauthorized. Please sign in to access this resource.",
    },
    { status: 401 }
  );
}
