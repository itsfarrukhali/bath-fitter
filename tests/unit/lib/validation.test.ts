import { describe, it, expect } from 'vitest';
import {
  validateData,
  validateIdParam,
  sanitizeSearchQuery,
  formatZodErrors,
} from '@/lib/validation';
import { z } from 'zod';

describe('Validation Utilities', () => {
  describe('validateData', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().int().positive(),
    });

    it('should validate correct data successfully', () => {
      const result = validateData(testSchema, {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.age).toBe(30);
      }
    });

    it('should fail validation for invalid data', () => {
      const result = validateData(testSchema, {
        name: '',
        email: 'invalid-email',
        age: -5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });

    it('should fail validation for missing required fields', () => {
      const result = validateData(testSchema, {
        name: 'John',
      });

      expect(result.success).toBe(false);
    });

    it('should handle type coercion', () => {
      const result = validateData(testSchema, {
        name: 'John',
        email: 'john@example.com',
        age: '30', // String instead of number
      });

      // Should fail because age is a string
      expect(result.success).toBe(false);
    });
  });

  describe('validateIdParam', () => {
    it('should validate positive integer IDs', () => {
      expect(validateIdParam('1')).toBe(1);
      expect(validateIdParam('123')).toBe(123);
      expect(validateIdParam('999999')).toBe(999999);
    });

    it('should return null for invalid IDs', () => {
      expect(validateIdParam('abc')).toBeNull();
      expect(validateIdParam('12.5')).toBeNull();
      expect(validateIdParam('12a')).toBeNull();
      expect(validateIdParam('')).toBeNull();
    });

    it('should return null for negative IDs', () => {
      expect(validateIdParam('-1')).toBeNull();
      expect(validateIdParam('-999')).toBeNull();
    });

    it('should return null for zero', () => {
      expect(validateIdParam('0')).toBeNull();
    });

    it('should handle whitespace', () => {
      expect(validateIdParam(' 123 ')).toBe(123);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove dangerous HTML characters', () => {
      const result = sanitizeSearchQuery('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toBe('scriptalert("xss")/script');
    });

    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  hello world  ')).toBe('hello world');
    });

    it('should return undefined for null input', () => {
      expect(sanitizeSearchQuery(null)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(sanitizeSearchQuery('')).toBeUndefined();
    });

    it('should handle special characters', () => {
      const result = sanitizeSearchQuery('test@#$%^&*()');
      expect(result).toBeDefined();
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should preserve valid search terms', () => {
      expect(sanitizeSearchQuery('bathroom remodel')).toBe('bathroom remodel');
      expect(sanitizeSearchQuery('walk-in shower')).toBe('walk-in shower');
    });
  });

  describe('formatZodErrors', () => {
    it('should format Zod errors correctly', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
      });

      const result = schema.safeParse({
        name: '',
        email: 'invalid',
      });

      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(formatted).toHaveProperty('name');
        expect(formatted).toHaveProperty('email');
        expect(Array.isArray(formatted.name)).toBe(true);
        expect(Array.isArray(formatted.email)).toBe(true);
      }
    });

    it('should handle nested errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      });

      const result = schema.safeParse({
        user: {
          name: '',
          email: 'invalid',
        },
      });

      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(formatted).toBeDefined();
      }
    });
  });
});
