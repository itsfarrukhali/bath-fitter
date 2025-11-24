import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Create a separate Prisma instance for testing
export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

/**
 * Setup test database
 * Call this in beforeAll
 */
export async function setupTestDatabase() {
  await testPrisma.$connect();
}

/**
 * Cleanup test database
 * Call this in afterAll
 */
export async function cleanupTestDatabase() {
  await testPrisma.$disconnect();
}

/**
 * Clear all data from test database
 * Call this in beforeEach to ensure clean state
 */
export async function clearTestData() {
  // Delete in correct order to respect foreign key constraints
  await testPrisma.productVariant.deleteMany();
  await testPrisma.product.deleteMany();
  await testPrisma.subcategory.deleteMany();
  await testPrisma.category.deleteMany();
  await testPrisma.showerType.deleteMany();
  await testPrisma.projectType.deleteMany();
  await testPrisma.templateVariant.deleteMany();
  await testPrisma.templateProduct.deleteMany();
  await testPrisma.templateSubcategory.deleteMany();
  await testPrisma.templateCategory.deleteMany();
  await testPrisma.userDesign.deleteMany();
  await testPrisma.admin.deleteMany();
}

/**
 * Create test fixtures
 */
export async function createTestFixtures() {
  // Create a test project type
  const projectType = await testPrisma.projectType.create({
    data: {
      name: 'Test Bathroom',
      slug: 'test-bathroom',
    },
  });

  // Create a test shower type
  const showerType = await testPrisma.showerType.create({
    data: {
      name: 'Test Walk-In Shower',
      slug: 'test-walk-in-shower',
      projectTypeId: projectType.id,
    },
  });

  // Create a test template category
  const templateCategory = await testPrisma.templateCategory.create({
    data: {
      name: 'Test Template Category',
      slug: 'test-template-category',
      isActive: true,
    },
  });

  // Create a test category
  const category = await testPrisma.category.create({
    data: {
      name: 'Test Category',
      slug: 'test-category',
      showerTypeId: showerType.id,
      hasSubcategories: false,
    },
  });

  // Create a test admin user
  const admin = await testPrisma.admin.create({
    data: {
      username: 'testadmin',
      email: 'test@admin.com',
      password: '$2a$10$YourHashedPasswordHere', // bcrypt hash of "password"
      fullName: 'Test Admin',
    },
  });

  return {
    projectType,
    showerType,
    templateCategory,
    category,
    admin,
  };
}

/**
 * Helper to create authenticated request headers
 */
export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Mock authentication for tests
 */
export function mockAuthentication() {
  // This would typically generate a valid JWT token
  // For now, we'll use a mock token
  return 'mock-jwt-token-for-testing';
}
