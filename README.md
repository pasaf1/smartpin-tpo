# SmartPin TPO - Advanced Roof Inspection Management System

![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Production-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-blue)
![React Query](https://img.shields.io/badge/React%20Query-5.0-red)

A comprehensive roof inspection management system with advanced chat capabilities, real-time collaboration, and AI-powered analytics.

## 🚀 Features

### 🏠 Roof Management
- **Interactive Roof Plans**: Visual roof inspection with pin placement
- **Pin Management**: Create, edit, and track defects with GPS coordinates
- **Child Pins**: Hierarchical defect tracking with parent-child relationships
- **Status Management**: Automated status transitions (Open → Ready for Inspection → Closed)
- **Photo Documentation**: Upload and manage inspection photos with metadata

### 💬 ChatPro System (New!)
- **Advanced Messaging**: Real-time chat with infinite scroll and message history
- **Reactions & Emojis**: React to messages with emoji reactions
- **File Attachments**: Upload and share images, documents, and files
- **Threaded Conversations**: Reply to specific messages for organized discussions
- **Typing Indicators**: See who's currently typing in real-time
- **Search Functionality**: Find messages across conversation history
- **Read Status**: Track unread messages and mark as read
- **Optimistic Updates**: Instant UI updates for better user experience

### 📊 Analytics & Reporting
- **Risk Quality Matrix**: Visual risk assessment with severity tracking
- **Quality Trends**: Historical analysis of inspection quality
- **Category Analysis**: Defect categorization and trending
- **Performance Metrics**: KPI tracking and dashboard analytics
- **Real-time Updates**: Live data with Supabase subscriptions

### 🔧 Technical Features
- **Type-Safe Database**: Full TypeScript integration with Supabase
- **Real-time Subscriptions**: Live updates across all components
- **Optimized Performance**: React Query caching and infinite queries
- **Responsive Design**: Mobile-first responsive interface
- **PWA Support**: Progressive Web App capabilities
- **Authentication**: Secure user management with Supabase Auth

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.0** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **React Query (TanStack Query)** - Data fetching and caching
- **React Hook Form** - Form management
- **date-fns** - Date manipulation utilities

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Supabase Storage** - File and image storage
- **Supabase Realtime** - Live subscriptions
- **Row Level Security (RLS)** - Database security

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **pnpm** - Package manager
- **Git** - Version control

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── roofs/            # Roof management pages
│   ├── admin/            # Admin interface
│   └── api/              # API routes
├── components/           # React components
│   ├── chat/            # ChatPro system components
│   ├── dashboard/       # Dashboard components
│   ├── pins/           # Pin management components
│   ├── canvas/         # Interactive canvas components
│   ├── ui/             # shadcn/ui components
│   └── layout/         # Layout components
├── lib/                # Utilities and configuration
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── supabase/       # Supabase configuration
│   └── storage/        # File storage utilities
└── styles/             # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pasaf1/smartpin-tpo.git
   cd smartpin-tpo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   Run the migration files in `supabase/migrations/`:
   - `20240826_initial_schema.sql`
   - `20240827_functions_views.sql` 
   - `20240828_rls_policies.sql`
   - `20240829_chats_delete_policy.sql`

5. **Storage Setup**
   Create the following Supabase Storage buckets:
   - `roof-photos` (public)
   - `chat-attachments` (public)

6. **Run the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

### Core Tables
- `roofs` - Roof projects and metadata
- `pins` - Inspection points and defects
- `pin_children` - Child pins for detailed defect tracking
- `chats` - Chat messages and communication
- `photos` - Photo documentation and metadata

### ChatPro Tables (Optional)
- `chat_reactions` - Message reactions and emojis
- `chat_attachments` - File attachments metadata
- `chat_reads` - Read status tracking

## 🎯 Usage Examples

### Basic Chat Implementation
```tsx
import { useChatPro } from '@/lib/hooks/useChatPro'
import ChatProUI from '@/components/chat/ChatProUI'

function RoofChat({ roofId }: { roofId: string }) {
  return (
    <ChatProUI
      scope="roof"
      scopeId={roofId}
      title="Roof Inspection Chat"
      options={{
        reactions: true,
        attachments: true,
        typing: true,
        presence: true
      }}
    />
  )
}
```

### Pin Management
```tsx
import { usePins } from '@/lib/hooks/usePins'
import { PinDetailsCard } from '@/components/pins/PinDetailsCard'

function RoofInspection({ roofId }: { roofId: string }) {
  const { data: pins } = usePins(roofId)
  
  return (
    <div>
      {pins?.map(pin => (
        <PinDetailsCard key={pin.id} pin={pin} />
      ))}
    </div>
  )
}
```

### Analytics Dashboard
```tsx
import { useRiskQualityMatrix } from '@/lib/hooks/useAnalytics'
import { RiskQualityHeatmap } from '@/components/analytics/RiskQualityHeatmap'

function AnalyticsDashboard({ roofId }: { roofId: string }) {
  const { data: matrix } = useRiskQualityMatrix(roofId)
  
  return <RiskQualityHeatmap data={matrix} />
}
```

## 🔒 Security

- **Row Level Security (RLS)** - Database-level security policies
- **Authentication** - Supabase Auth integration
- **API Protection** - Secure API routes with authentication
- **File Upload Security** - Validated file uploads with size limits
- **Type Safety** - Full TypeScript coverage for runtime safety

## 🚀 Performance Optimizations

- **React Query Caching** - Intelligent data caching and synchronization
- **Infinite Queries** - Efficient pagination for large datasets
- **Optimistic Updates** - Instant UI feedback for better UX
- **Image Optimization** - Next.js automatic image optimization
- **Bundle Splitting** - Code splitting for faster load times
- **Realtime Subscriptions** - Efficient WebSocket connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add JSDoc comments for complex functions

### Database Changes
- Create migration files for schema changes
- Update TypeScript types in `database.types.ts`
- Test RLS policies thoroughly
- Document breaking changes

### Component Development
- Use shadcn/ui components when possible
- Follow React Query patterns for data fetching
- Implement proper error boundaries
- Add loading and error states

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in `/docs` folder

---

Built with ❤️ using Next.js, TypeScript, and Supabase
