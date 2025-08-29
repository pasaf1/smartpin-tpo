# SmartPin TPO - Advanced Roof Inspection Management System

![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Production-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-blue)
![React Query](https://img.shields.io/badge/React%20Query-5.0-red)

A comprehensive roof inspection management system with real-time collaboration, dynamic photo containers, and role-based access control for construction quality management.

## 🎯 Application Overview

**SmartPin TPO** is a quality control system for roof inspections where inspectors place "pins" on roof plans to mark defects. Each pin represents a specific issue with photo documentation, status tracking, and automated workflows.

### Core Concept
- **Projects** contain **Roofs** which contain **Pins** 
- **Pins** can have **Child Pins** for detailed sub-defects
- Each pin has **Opening Photo** (admin) + **Closure Photo** (all users)
- Status flows: `Open` → `ReadyForInspection` → `Closed`

## 📱 Page Structure & Navigation

### 🏠 **Homepage (`/`)** - Project Dashboard
**Purpose**: Central hub for project management and overview

**Key Elements**:
- **KPI Cards**: Live counters for Total Projects, Issues Open, Ready for Inspection, Closed
- **Project Status Filters**: Click cards to filter by Open/InProgress/Completed
- **New Project Button**: Large green button (center) - creates project + auto-generates roof
- **Projects Table**: 
  - Desktop: Full table with Open/Edit/Delete buttons
  - Mobile: Card layout with same actions
- **Global Chat**: Team communication across all projects

**Button Actions**:
- `New Project` → Opens modal with name/location/roof plan upload → Creates project + default roof
- `Open` → Navigates to roof dashboard (`/roofs/[id]`)
- `Edit` → Opens modal to modify project name
- `Delete` (Admin only) → Double confirmation → Cascading deletion from database

**Technical**: Uses `useProjects()`, `useCreateProject()`, `useDeleteProject()` hooks with real-time Supabase subscriptions.

---

### 🏗️ **Roof Dashboard (`/roofs/[id]`)** - Main Inspection Interface
**Purpose**: Interactive roof inspection with pin placement and management

**Layout Structure**:
```
[Header with breadcrumbs + export + settings]
[4 KPI Cards - Open/Ready/Closed/Total issues]
[3-Column Layout]
├── Left: Filters & Controls
├── Center: Interactive Roof Plan Canvas  
└── Bottom: Defects Table + Team Chat
```

**Interactive Canvas**:
- **Background**: Uploaded roof plan image
- **Pin Placement**: Click to add new pins at coordinates
- **Pin Markers**: Visual indicators showing pin numbers
- **Pin Selection**: Click pin → Opens INCR Details Card modal

**Action Buttons**:
- `+ Add Pin` → Creates new pin at clicked location
- `Settings` → Navigate to roof settings
- `Export Report` → Generate PDF/Excel reports
- Pin click → Opens detailed INCR card

**Technical**: Uses `EnhancedPinCanvas` with coordinate mapping, `useRealTimeRoof()` for live updates, `useCreatePin()` for pin creation.

---

### 🎯 **INCR Details Card (Modal)** - Pin Management Interface
**Purpose**: Detailed view and management of individual pins with photo containers

**Structure**:
```
[INCR Header - ID, status, completion progress]
[Collapsible Sections]:
├── Basic Details (dates, coordinates, inspector info)
├── Roof Plan (shows ONLY selected pin, not all pins)
├── Primary Pin Container:
│   ├── Opening Photo Container (orange, admin-only)
│   └── Closure Photo Container (color by status)
└── Child Pins Section (if any):
    └── Each child gets own opening + closure containers
```

**Photo Containers** (Core Feature):
- **Opening Photo**: Orange container, admin upload only, for documenting initial defect
- **Closure Photo**: Color-coded by status:
  - Red (Open): Photo required to proceed
  - Yellow (ReadyForInspection): Photo uploaded, awaiting review  
  - Green (Closed): Defect resolved and approved

**Container Actions**:
- `Upload Photo` → File picker → Auto-status change (closure photo → ReadyForInspection)
- `Replace Photo` → Update existing photo
- `View Photo` → Full-screen photo viewer
- `Close Pin` → Admin action to mark as resolved

**Child Pin Workflow**:
- `Add Child Pin` → Creates sub-defect with own photo containers
- Each child pin gets independent opening/closure photo containers
- Separate status tracking for each child

**Technical**: Uses `PhotoContainer` component with dynamic styling, `handleClosurePhotoUpload()` with auto-status updates, role-based upload permissions.

---

### ⚙️ **Settings Pages**

#### **Roof Settings (`/roofs/[id]/settings`)**
- Update roof plan image
- Modify roof metadata
- Configure inspection parameters

#### **Global Settings (`/settings`)** - Admin Only
- User management (CRUD operations)
- Status/defect type configuration  
- Theme switching (light/dark)
- System-wide settings

#### **Admin Users (`/admin/users`)** - Super Admin
- User role management
- Permissions configuration
- Account administration

**Technical**: Protected routes with `withAuth()` HOC, role-based access control via `useAuth()` hook.

---

## 🔄 Application Workflows

### **Pin Lifecycle Workflow**
1. **Inspector places pin** on roof plan → Pin created with "Open" status
2. **Admin uploads opening photo** → Documents initial defect state
3. **Contractor/Inspector uploads closure photo** → Status auto-changes to "ReadyForInspection" 
4. **QA Manager reviews** → Manually changes status to "Closed" or back to "Open"
5. **Analytics updated** → Global counters and statistics refresh

### **Project Creation Workflow**
1. **User clicks "New Project"** → Modal opens
2. **Fills project details** + uploads roof plan image
3. **Submits form** → Creates project in database
4. **Auto-generates default roof** with uploaded image as background
5. **Redirects to roof dashboard** → Ready for pin placement

### **Child Pin Creation Workflow**
1. **From INCR Details Card** → Click "Add Child Pin"
2. **System creates sub-pin** near parent coordinates
3. **Auto-opens child pins section** with photo containers
4. **Each child gets independent** opening + closure photo containers
5. **Separate status tracking** for granular defect management

---

## 🎨 UI/UX Features

### **Dynamic Visual Feedback**
- **Status-based color coding**: Red (Open) → Yellow (Ready) → Green (Closed)
- **Glow effects**: Animated borders around active photo containers
- **Pulse animations**: For urgent actions and status changes
- **Hover interactions**: Photo preview, button highlights, transform effects

### **Responsive Design**
- **Mobile-first**: All interfaces optimized for mobile devices
- **Adaptive layouts**: Desktop tables become mobile cards
- **Touch-friendly**: Large buttons, swipe gestures, touch interactions

### **Real-time Updates**
- **Live counters**: KPI cards update instantly across all users
- **Status synchronization**: Pin status changes reflect immediately
- **Presence indicators**: See who's online and working

---

## 🔐 Role-Based Access Control

### **Admin**
- Create/edit/delete projects
- Upload opening photos
- Manage user accounts
- Access all settings
- Close pins (final approval)

### **QA Manager/Supervisor** 
- Create projects
- Upload closure photos
- Review pin status
- Generate reports

### **Inspector**
- Upload closure photos
- Create pins
- View project data
- Basic reporting

### **Contractor**
- Upload closure photos
- View assigned pins
- Limited project access

**Technical**: Implemented via Supabase RLS policies, `useAuth()` hook checks, role-based component rendering.

---

## � Technical Architecture

### **Frontend Stack**
- **Next.js 15.5.0**: App Router, Server Components, API routes
- **TypeScript**: Full type safety with database schema generation
- **TailwindCSS + shadcn/ui**: Consistent design system
- **React Query**: Data caching, real-time sync, optimistic updates

### **Backend Integration**
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Storage**: File uploads for photos and roof plans
- **Authentication**: Role-based access with JWT tokens
- **RLS Policies**: Database-level security enforcement

### **Key Hooks & Components**
- `useProjects()` - Project listing with real-time updates
- `useRealTimeRoof()` - Live roof data with pin synchronization  
- `useCreatePin()` - Pin creation with coordinate mapping
- `PhotoContainer` - Dynamic photo upload component
- `EnhancedPinCanvas` - Interactive roof plan with pin placement
- `IncrDetailsCard` - Comprehensive pin management interface

### **Database Schema**
```
projects (id, name, status, contractor, created_at)
├── roofs (id, project_id, plan_image_url, coordinates)
    ├── pins (id, roof_id, x_position, y_position, status, severity)
        ├── pin_children (id, pin_id, status, photos)
        └── photos (id, pin_id, type, url, metadata)
```

---

## 🚀 Getting Started

### **Environment Setup**
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### **Database Setup**
1. Run migrations: `supabase/migrations/*.sql`
2. Create storage buckets: `roof-photos`, `chat-attachments`
3. Configure RLS policies for role-based access

### **Development**
```bash
pnpm install
pnpm dev
```

---

**This README provides a complete understanding of SmartPin TPO's functionality, user flows, and technical implementation for any AI agent or developer working with the system.**

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage - Project dashboard
│   ├── roofs/[id]/        # Roof inspection interface  
│   ├── settings/          # Global settings page
│   ├── admin/users/       # User management (admin)
│   └── api/               # API routes
├── components/           
│   ├── pins/
│   │   └── IncrDetailsCard.tsx    # Main pin modal with photo containers
│   ├── canvas/
│   │   └── PinCanvas.tsx          # Interactive roof plan
│   ├── dashboard/
│   │   ├── KPICards.tsx           # Live counters
│   │   └── RoofCard.tsx           # Project cards
│   ├── chat/              # Team communication system
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── hooks/
│   │   ├── useProjects.ts         # Project CRUD operations
│   │   ├── usePins.ts             # Pin management
│   │   └── useDeleteProject.ts    # Cascading deletion
│   ├── supabase/          # Database configuration
│   └── auth/              # Authentication logic
└── supabase/
    └── migrations/        # Database schema & policies
```

---

## 🤝 Contributing & Development

### **Development Setup**
```bash
git clone https://github.com/pasaf1/smartpin-tpo.git
cd smartpin-tpo
pnpm install
pnpm dev
```

### **Code Standards**
- Full TypeScript coverage
- ESLint + Prettier formatting
- Role-based security checks in all components
- Real-time updates via Supabase subscriptions

### **Database Changes**
- Create migration files for schema updates
- Update `database.types.ts` accordingly  
- Test RLS policies thoroughly
- Document breaking changes

---

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**

**This comprehensive guide ensures any AI agent can understand SmartPin TPO's complete functionality, user interfaces, workflows, and technical implementation.**
