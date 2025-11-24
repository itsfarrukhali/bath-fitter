# 🛁 Bath Fitter - Shower Customization Platform

A comprehensive, production-ready web application for customizing bathroom shower designs with real-time visualization, template management, and e-commerce capabilities.

## 🌟 Features

### Core Functionality
- **🎨 Visual Shower Designer**: Interactive design tool with real-time preview
- **📦 Product Management**: Complete CRUD for products, categories, and variants
- **🎯 Template System**: Reusable design templates for quick customization
- **👥 User Management**: Customer accounts and design saving
- **🔧 Plumbing Configuration**: Support for LEFT, RIGHT, and BOTH configurations
- **📊 Admin Dashboard**: Comprehensive management interface
- **🔍 Advanced Search**: Search across all entities
- **📄 Pagination**: Efficient data loading with metadata
- **🎨 Z-Index Management**: Layer ordering for design elements

### Technical Features
- **✅ Full Type Safety**: TypeScript + Zod validation
- **🛡️ Comprehensive Error Handling**: User-friendly error messages
- **⚡ Performance Optimized**: Caching, efficient queries
- **📱 Responsive Design**: Works on all devices
- **🔐 Secure Authentication**: NextAuth with JWT
- **📸 Image Management**: Cloudinary integration
- **🗄️ PostgreSQL Database**: Robust data storage with Prisma ORM

## 🚀 Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible components
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API
- **Prisma 6.17.1** - ORM
- **PostgreSQL** - Database
- **NextAuth 4.24.11** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Image hosting

### Development
- **Turbopack** - Fast bundler
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📋 Prerequisites

- Node.js 20+ (LTS recommended)
- PostgreSQL 14+
- npm or yarn
- Cloudinary account (for image uploads)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/bath-fitter.git
cd bath-fitter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bath_fitter"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/bath_fitter_shadow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Set up the database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed the database (optional)
npm run seed
```

### 5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📚 Project Structure

```
bath-fitter/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Database seeding
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── project-types/
│   │   │   ├── shower-types/
│   │   │   ├── categories/
│   │   │   ├── products/
│   │   │   ├── variants/
│   │   │   ├── template-*/   # Template APIs
│   │   │   └── auth/         # Authentication
│   │   ├── (pages)/          # App pages
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── ...              # Feature components
│   ├── lib/                 # Utility libraries
│   │   ├── api-response.ts  # API response helpers
│   │   ├── validation.ts    # Validation utilities
│   │   ├── error-handler.ts # Error handling
│   │   ├── auth.ts          # Auth utilities
│   │   ├── prisma.ts        # Prisma client
│   │   └── cloudinary.ts    # Image upload
│   ├── schemas/             # Zod schemas
│   │   └── api-schemas.ts   # API validation schemas
│   ├── types/               # TypeScript types
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React context
│   └── utils/               # Utility functions
├── public/                  # Static files
├── API_DOCUMENTATION.md     # API documentation
├── PROGRESS.md             # Development progress
└── README.md               # This file
```

## 🔑 Key Concepts

### Plumbing Configuration
Products and variants can be configured for different plumbing setups:
- **LEFT**: Left-side plumbing
- **RIGHT**: Right-side plumbing
- **BOTH**: Compatible with both sides

### Z-Index System
Controls the layering of design elements:
- Range: 0-100
- Higher values appear on top
- Inherits from parent if not specified
- Used for proper visual stacking

### Template System
Reusable design templates that can be instantiated:
1. **Template Categories**: Top-level template groups
2. **Template Subcategories**: Template subdivisions
3. **Template Products**: Template product definitions
4. **Template Variants**: Color/style variations

Templates can be instantiated into actual categories/products for specific shower types.

## 📖 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Quick API Examples

#### Fetch Categories
```javascript
const response = await fetch(
  '/api/categories?showerTypeId=1&includeProducts=true'
);
const data = await response.json();
```

#### Create Product
```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Acrylic Panel',
    slug: 'acrylic-panel',
    categoryId: 1,
    z_index: 50
  })
});
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
# Build image
docker build -t bath-fitter .

# Run container
docker run -p 3000:3000 bath-fitter
```

### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Run migrations: `npx prisma migrate deploy`
4. Start server: `npm start`

## 🔒 Security

- **Authentication**: JWT-based with NextAuth
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection**: Protected by Prisma ORM
- **XSS Protection**: React's built-in escaping
- **CSRF Protection**: NextAuth CSRF tokens

## 🎨 Customization

### Adding a New Product Category
1. Create category via API or admin panel
2. Add products to the category
3. Create product variants with images
4. Set appropriate z-index values
5. Configure plumbing compatibility

### Creating a Template
1. Create template category
2. Add template products
3. Create template variants
4. Instantiate template for specific shower types

## 📊 Performance

- **Caching**: Public APIs cached for 1 hour
- **Pagination**: All list endpoints paginated
- **Image Optimization**: Cloudinary CDN
- **Database**: Indexed queries
- **Bundle Size**: Optimized with Turbopack

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
npx prisma migrate reset
```

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Type Errors
```bash
# Regenerate Prisma types
npx prisma generate
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Development**: Your Team
- **Design**: Your Designers
- **Product**: Your Product Managers

## 📞 Support

- **Email**: support@bathfitter.com
- **Documentation**: [API Docs](./API_DOCUMENTATION.md)
- **Issues**: GitHub Issues

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Core API infrastructure
- [x] Product management
- [x] Template system
- [x] Basic authentication

### Phase 2 (In Progress)
- [ ] User design saving
- [ ] Shopping cart
- [ ] Order management
- [ ] Payment integration

### Phase 3 (Planned)
- [ ] 3D visualization
- [ ] AR preview
- [ ] Mobile app
- [ ] Analytics dashboard

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Vercel for hosting platform
- All open-source contributors

---

**Built with ❤️ using Next.js, TypeScript, and Prisma**
