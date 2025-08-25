# SmartPin TPO v1.0.0

A professional roof inspection and project management application built with Next.js and Supabase.

## 🚀 Features

- **Pin-based Inspection System** - Mark and track defects with interactive pins
- **Real-time Collaboration** - Live updates and team chat
- **Photo Management** - Upload, organize, and analyze inspection photos  
- **Project Analytics** - Quality trends and performance metrics
- **Mobile Responsive** - Works seamlessly on all devices
- **Offline Support** - Continue working without internet connection
- **Export Capabilities** - Generate reports in multiple formats

## 📋 Prerequisites

- Node.js 18+ 
- Supabase Account
- Vercel Account (for deployment)

## 🛠️ Production Setup

### 1. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env.local
```

Update `.env.local` with your production values:
```env
# Replace with your actual Supabase project details
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Update with your production domain
NEXT_PUBLIC_API_BASE_URL=https://your-domain.vercel.app
```

### 2. Supabase Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations:
   ```bash
   npx supabase db push --linked
   ```
3. Set up Row Level Security (RLS) policies
4. Configure storage buckets for file uploads

### 3. Install Dependencies

```bash
npm install
```

### 4. Build & Test Locally

```bash
# Run production build
npm run build

# Test production build locally
npm start
```

### 5. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`

3. Deploy automatically on push to main branch

## 🔧 Development

### Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build Script

Use the enhanced build script for production deployments:

```bash
node scripts/build-production.js
```

This script includes:
- TypeScript type checking
- ESLint validation  
- Database migrations
- Optimized production build
- Bundle analysis

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                 # Utilities and configurations
│   ├── supabase/       # Database client setup
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Helper functions
├── styles/             # Global styles
└── types/              # TypeScript definitions
```

## 🚀 Production Features

- **Real-time Updates** - Live collaboration enabled
- **Analytics** - User behavior and performance tracking
- **Error Monitoring** - Comprehensive error tracking
- **Performance Optimization** - Caching and bundle optimization
- **Security** - RLS policies and authentication

## 📊 Monitoring & Analytics

The application includes built-in monitoring for:
- User engagement metrics
- Performance monitoring
- Error tracking and reporting
- Quality trend analysis

## 🔐 Security

- Row Level Security (RLS) enabled on all database tables
- Secure file upload with validation
- Authentication via Supabase Auth
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build validation
5. Submit a pull request

## 📝 License

Private - All rights reserved

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review the troubleshooting guide
- Contact the development team

---

**SmartPin TPO v1.0.0** - Professional roof inspection made simple.
