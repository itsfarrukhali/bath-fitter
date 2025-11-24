import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { createErrorResponse, createValidationErrorResponse } from "./api-response";
import { formatZodErrors } from "./validation";

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  message: string;
  status: number;
} {
  switch (error.code) {
    case "P2002": {
      // Unique constraint violation
      const target = (error.meta?.target as string[]) || [];
      const field = target[0] || "field";
      return {
        message: `A record with this ${field} already exists`,
        status: 409,
      };
    }
    case "P2003": {
      // Foreign key constraint violation
      return {
        message: "Related record not found",
        status: 400,
      };
    }
    case "P2025": {
      // Record not found
      return {
        message: "Record not found",
        status: 404,
      };
    }
    case "P2014": {
      // Required relation violation
      return {
        message: "Invalid relation data provided",
        status: 400,
      };
    }
    default: {
      console.error("Unhandled Prisma error:", error);
      return {
        message: "Database operation failed",
        status: 500,
      };
    }
  }
}

/**
 * Global error handler for API routes
 */
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse {
  // Log error for debugging
  console.error(`API Error${context ? ` in ${context}` : ""}:`, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = formatZodErrors(error);
    return createValidationErrorResponse(
      "Validation failed",
      formattedErrors
    );
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    return createErrorResponse(error.message, error.statusCode);
  }

  // Handle Prisma errors (both real instances and mock objects with code property)
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    (typeof error === "object" && error !== null && "code" in error && typeof (error as any).code === "string" && (error as any).code.startsWith("P"))
  ) {
    const { message, status } = handlePrismaError(error as Prisma.PrismaClientKnownRequestError);
    return createErrorResponse(message, status);
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return createErrorResponse("Invalid data provided", 400);
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred";

    return createErrorResponse(message, 500);
  }

  // Fallback for unknown errors
  return createErrorResponse("An unexpected error occurred", 500);
}

/**
 * Async error wrapper for API route handlers
 */
export function asyncHandler<T>(
  handler: (...args: T[]) => Promise<NextResponse>
) {
  return async (...args: T[]): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : "";

  if (error instanceof Error) {
    console.error(
      `[${timestamp}]${contextStr} ${error.name}: ${error.message}`
    );
    if (process.env.NODE_ENV === "development" && error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(`[${timestamp}]${contextStr} Unknown error:`, error);
  }
}
