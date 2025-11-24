import { describe, it, expect } from 'vitest';
import {
  handleApiError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '@/lib/error-handler';
import { ZodError, z } from 'zod';

describe('Error Handler Utilities', () => {
  describe('Custom Error Classes', () => {
    describe('NotFoundError', () => {
      it('should create NotFoundError with resource name', () => {
        const error = new NotFoundError('User');
        expect(error.message).toBe('User not found');
        expect(error.name).toBe('NotFoundError');
        expect(error.statusCode).toBe(404);
        expect(error instanceof Error).toBe(true);
      });
    });

    describe('ConflictError', () => {
      it('should create ConflictError with message', () => {
        const error = new ConflictError('Email already exists');
        expect(error.message).toBe('Email already exists');
        expect(error.name).toBe('ConflictError');
        expect(error.statusCode).toBe(409);
      });
    });

    describe('ValidationError', () => {
      it('should create ValidationError with message', () => {
        const error = new ValidationError('Invalid input data');
        expect(error.message).toBe('Invalid input data');
        expect(error.name).toBe('ValidationError');
        expect(error.statusCode).toBe(400);
      });
    });
  });

  describe('handleApiError', () => {
    it('should handle NotFoundError', async () => {
      const error = new NotFoundError('Product');
      const response = handleApiError(error, 'GET /api/products/123');
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.message).toBe('Product not found');
    });

    it('should handle ConflictError', async () => {
      const error = new ConflictError('Category with this slug already exists');
      const response = handleApiError(error, 'POST /api/categories');
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.message).toContain('already exists');
    });

    it('should handle ValidationError', async () => {
      const error = new ValidationError('Validation failed');
      const response = handleApiError(error, 'POST /api/products');
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe('Validation failed');
    });

    it('should handle ZodError', async () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
      });

      const result = schema.safeParse({
        name: '',
        email: 'invalid',
      });

      if (!result.success) {
        const response = handleApiError(result.error, 'POST /api/users');
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.errors).toBeDefined();
      }
    });

    it('should handle Prisma unique constraint error', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['slug'] },
        message: 'Unique constraint failed',
        clientVersion: '5.0.0',
        name: 'PrismaClientKnownRequestError',
      };

      const response = handleApiError(prismaError, 'POST /api/categories');
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.message).toContain('already exists');
    });

    it('should handle Prisma foreign key error', async () => {
      const prismaError = {
        code: 'P2003',
        meta: { field_name: 'categoryId' },
        message: 'Foreign key constraint failed',
        clientVersion: '5.0.0',
        name: 'PrismaClientKnownRequestError',
      };

      const response = handleApiError(prismaError, 'POST /api/products');
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain('Related record not found');
    });

    it('should handle Prisma record not found error', async () => {
      const prismaError = {
        code: 'P2025',
        message: 'Record not found',
        clientVersion: '5.0.0',
        name: 'PrismaClientKnownRequestError',
      };

      const response = handleApiError(prismaError, 'GET /api/products/999');
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);
    });

    it('should handle generic Error', async () => {
      const error = new Error('Something went wrong');
      const response = handleApiError(error, 'GET /api/test');
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      // In development, it shows the actual message
      expect(json.message).toBeDefined();
    });

    it('should handle unknown error types', async () => {
      const error = 'String error';
      const response = handleApiError(error, 'GET /api/test');
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.message).toBe('An unexpected error occurred');
    });
  });
});
