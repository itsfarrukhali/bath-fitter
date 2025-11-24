import { PlumbingConfig } from '@prisma/client';

/**
 * Mock data for testing
 */

export const mockProjectType = {
  name: 'Bathroom Remodel',
  slug: 'bathroom-remodel',
};

export const mockShowerType = {
  name: 'Walk-In Shower',
  slug: 'walk-in-shower',
};

export const mockCategory = {
  name: 'Wall Panels',
  slug: 'wall-panels',
  hasSubcategories: false,
  z_index: 50,
  plumbingConfig: PlumbingConfig.LEFT,
};

export const mockSubcategory = {
  name: 'Acrylic Panels',
  slug: 'acrylic-panels',
  z_index: 55,
  plumbingConfig: PlumbingConfig.LEFT,
};

export const mockProduct = {
  name: 'Classic Panel',
  slug: 'classic-panel',
  description: 'A classic wall panel',
  z_index: 60,
  plumbingConfig: PlumbingConfig.LEFT,
};

export const mockVariant = {
  colorName: 'Arctic White',
  colorCode: '#FFFFFF',
  imageUrl: 'https://example.com/image.jpg',
  publicId: 'test-public-id',
  plumbing_config: PlumbingConfig.LEFT,
};

export const mockTemplateCategory = {
  name: 'Standard Templates',
  slug: 'standard-templates',
  description: 'Standard template collection',
  isActive: true,
};

export const mockTemplateSubcategory = {
  name: 'Wall Templates',
  slug: 'wall-templates',
  description: 'Wall panel templates',
};

export const mockTemplateProduct = {
  name: 'Template Panel',
  slug: 'template-panel',
  description: 'A template panel',
};

export const mockTemplateVariant = {
  colorName: 'Template White',
  colorCode: '#FFFFFF',
  imageUrl: 'https://example.com/template.jpg',
  publicId: 'template-public-id',
  plumbingConfig: PlumbingConfig.LEFT,
};

export const mockUserDesign = {
  userEmail: 'user@example.com',
  userFullName: 'John Doe',
  userPhone: '+1234567890',
  userPostalCode: '12345',
  designData: {
    selections: {
      wall: 'white-panel',
      floor: 'grey-tile',
    },
  },
};

export const mockAdmin = {
  username: 'admin',
  email: 'admin@bathfitter.com',
  password: 'Admin@123',
  fullName: 'Admin User',
};

/**
 * Helper to create complete test data hierarchy
 */
export function createCompleteTestData(overrides: {
  projectType?: Partial<typeof mockProjectType>;
  showerType?: Partial<typeof mockShowerType>;
  category?: Partial<typeof mockCategory>;
  product?: Partial<typeof mockProduct>;
  variant?: Partial<typeof mockVariant>;
} = {}) {
  return {
    projectType: { ...mockProjectType, ...overrides.projectType },
    showerType: { ...mockShowerType, ...overrides.showerType },
    category: { ...mockCategory, ...overrides.category },
    product: { ...mockProduct, ...overrides.product },
    variant: { ...mockVariant, ...overrides.variant },
  };
}

/**
 * Helper to generate unique slugs for testing
 */
export function generateUniqueSlug(base: string): string {
  return `${base}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Helper to create invalid data for testing validation
 */
export const invalidData = {
  emptyString: '',
  invalidSlug: 'Invalid Slug!@#',
  negativeNumber: -1,
  zeroNumber: 0,
  tooLargeNumber: 101,
  invalidEmail: 'not-an-email',
  invalidUrl: 'not-a-url',
  invalidPlumbingConfig: 'INVALID' as any,
};
