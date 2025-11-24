import { describe, it, expect } from 'vitest';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  parsePaginationParams,
} from '@/lib/api-response';

describe('API Response Utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create success response with data', async () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data, 'Success message');
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
      expect(json.message).toBe('Success message');
    });

    it('should create success response with custom status code', async () => {
      const response = createSuccessResponse({ id: 1 }, 'Created', 201);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
    });

    it('should handle null data', async () => {
      const response = createSuccessResponse(null, 'Deleted');
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });

    it('should handle array data', async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = createSuccessResponse(data);
      const json = await response.json();

      expect(json.data).toEqual(data);
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with message', async () => {
      const response = createErrorResponse('Error occurred', 400);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe('Error occurred');
    });

    it('should handle error string parameter', async () => {
      const response = createErrorResponse('Validation failed', 400, 'VALIDATION_ERROR');
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error).toBe('VALIDATION_ERROR');
    });

    it('should default to 500 status code', async () => {
      const response = createErrorResponse('Server error');
      expect(response.status).toBe(500);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create paginated response with metadata', async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = createPaginatedResponse(data, {
        page: 1,
        limit: 10,
        total: 25,
      });
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should calculate pagination correctly for last page', async () => {
      const response = createPaginatedResponse([], {
        page: 3,
        limit: 10,
        total: 25,
      });
      const json = await response.json();

      expect(json.pagination.hasNextPage).toBe(false);
      expect(json.pagination.hasPreviousPage).toBe(true);
      expect(json.pagination.totalPages).toBe(3);
    });

    it('should handle single page results', async () => {
      const response = createPaginatedResponse([{ id: 1 }], {
        page: 1,
        limit: 10,
        total: 5,
      });
      const json = await response.json();

      expect(json.pagination.totalPages).toBe(1);
      expect(json.pagination.hasNextPage).toBe(false);
      expect(json.pagination.hasPreviousPage).toBe(false);
    });

    it('should handle empty results', async () => {
      const response = createPaginatedResponse([], {
        page: 1,
        limit: 10,
        total: 0,
      });
      const json = await response.json();

      expect(json.data).toEqual([]);
      expect(json.pagination.total).toBe(0);
      expect(json.pagination.totalPages).toBe(0);
    });

    it('should include custom message', async () => {
      const response = createPaginatedResponse(
        [],
        { page: 1, limit: 10, total: 0 },
        'No results found'
      );
      const json = await response.json();

      expect(json.message).toBe('No results found');
    });
  });

  describe('parsePaginationParams', () => {
    it('should parse valid pagination parameters', () => {
      const params = new URLSearchParams('page=2&limit=20');
      const result = parsePaginationParams(params);

      expect(result).toEqual({
        page: 2,
        limit: 20,
        skip: 20, // (page - 1) * limit
      });
    });

    it('should use default values for missing parameters', () => {
      const params = new URLSearchParams();
      const result = parsePaginationParams(params);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        skip: 0,
      });
    });

    it('should enforce maximum limit', () => {
      const params = new URLSearchParams('limit=200');
      const result = parsePaginationParams(params);

      expect(result.limit).toBe(100); // Max limit
    });

    it('should enforce minimum page number', () => {
      const params = new URLSearchParams('page=0');
      const result = parsePaginationParams(params);

      expect(result.page).toBe(1);
    });

    it('should handle invalid page numbers', () => {
      const params = new URLSearchParams('page=abc');
      const result = parsePaginationParams(params);

      expect(result.page).toBe(1);
    });

    it('should handle invalid limit values', () => {
      const params = new URLSearchParams('limit=xyz');
      const result = parsePaginationParams(params);

      expect(result.limit).toBe(10);
    });

    it('should calculate skip correctly', () => {
      const params1 = new URLSearchParams('page=1&limit=10');
      expect(parsePaginationParams(params1).skip).toBe(0);

      const params2 = new URLSearchParams('page=3&limit=25');
      expect(parsePaginationParams(params2).skip).toBe(50);

      const params3 = new URLSearchParams('page=5&limit=20');
      expect(parsePaginationParams(params3).skip).toBe(80);
    });
  });
});
