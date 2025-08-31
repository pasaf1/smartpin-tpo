SmartPin TPO - Professional Roof Inspection Platform
🚀 Overview
SmartPin TPO is a comprehensive mobile-first inspection and project management platform designed specifically for roof construction quality control. Built with Next.js 15, Supabase, and React-Konva, it provides real-time collaboration, advanced pin-based issue tracking, and multi-layer inspection management.
🎯 Key Features
Core Inspection System

Hierarchical Pin System: Parent pins (1, 2, 3...) with child pins (1.1, 1.2, 1.3...)
Three-State Workflow: Open → Ready To Inspect → Closed (with In Dispute option)
Dual Photo Documentation: Opening and closing photos for each pin
Automatic Status Transitions: Upload closing photo → automatic Ready To Inspect status
MTTR Tracking: Automatic calculation of Mean Time To Repair for each issue

Layer Management (Bluebeam-Style)

Multiple Inspection Layers: Issues, Notes, and custom layers
Layer Controls: Visibility toggle, opacity adjustment, locking, z-index ordering
Smart Filtering: Show/hide layers with single click
Tool Gating: Location-based tool permissions using PostGIS

Real-Time Collaboration

Live Updates: All changes reflected instantly across all users
Activity Log in Chat: Automatic documentation of all actions in chat

"Closing photo uploaded for pin 1.2 on [date] by [user]"
"Status changed to Ready To Inspect for pin 1.1 by [user]"
"Child pin 1.3 added by [user]"


Stakeholder Notifications: Push notifications for mentioned users
Presence Tracking: See who's currently viewing the project

Mobile-First Design

PWA Architecture: Works offline, installable on devices
Touch Optimized: Pinch-to-zoom, pan, tap controls
Responsive UI: Seamless experience across phone, tablet, desktop
Bottom Sheet Modals: Mobile-friendly interaction patterns

📊 Project Dashboard
Projects Hub (Main Screen)

Top Section: Settings, About, "Projects Hub" title, Company logo
KPI Cards: Clickable metrics that open detailed tables

Open Issues
Ready for Inspection
Closed Issues
MTTR Average


Project Gallery: 4 projects per row with horizontal scroll
Project Creation: Admin-only with fields:

Project name
Start date / Actual start date
End date / Actual end date
Contractor
Project plan image (becomes the interactive map)


Issues Table: Filterable list showing Open issues by default

Roof Dashboard (Project View)

Project-Specific KPIs: Filtered for selected project
Interactive Canvas: Main inspection area with Konva.js

Project plan image as background
Color-coded pins by status (Red: Open, Yellow: RTI, Green: Closed, Orange: Disputed)
Hover shows opening photo thumbnail
Click to open pin details card


Pin Creation Flow:

Parent pins only created on main dashboard
Child pins created within parent pin card
Automatic sequential numbering


Project Chat: Real-time discussion with mentions (@user)

📌 Pin Details Card
Auto-Populated Fields (Gray/Read-only)

Roof name
Contractor
Opening date
Issue ID
Quantity (auto-calculated from parent + children)

User Input Fields

Issue Type: INC (Internal Nonconformity), COR (Construction Observation Report), TradeDamage
Defect Type: Extensive list (60+ options)
Defect Layer: DENSDECK, INSULATION, SURFACE PREP, TPO, VB
Status: Open, Ready To Inspect, Closed, In Dispute
Severity: 1-4 scale

Photo Management

Container per pin: Opening photo, Closing photo, Status
Auto status change: Closing photo upload → Ready To Inspect
Photo annotation: Draw/write on photos before saving
Expandable gallery: Up to 30 photos per parent pin

Interactive Mini-Map

Shows only the current parent pin and its children
Numbered markers for each child pin
"Add more Issues" button for creating child pins

Activity & Chat

Pin-specific chat thread
Automatic activity logging
File attachments (images, videos)
User mentions with notifications

🔧 Technical Architecture
Frontend Stack

Framework: Next.js 15 (App Router)
UI Library: React 18 + TypeScript
Canvas: React-Konva for interactive maps
Styling: Tailwind CSS + shadcn/ui
State Management: TanStack Query + Zustand
Real-time: Supabase Realtime subscriptions

Backend Infrastructure

Database: PostgreSQL with PostGIS extension
Authentication: Supabase Auth (Email + Google OAuth)
Storage: Supabase Storage for images
Real-time: WebSockets via Supabase
Functions: Edge Functions for complex operations

Key Database Tables

projects: Project management
roofs: Roof configurations
pins: Parent pins
pin_children: Child pins
photos: Image storage references
users: User profiles and roles
chat_messages: Scoped messaging
activity_logs: Audit trail

👥 User Roles

Admin: Full system access, project creation, all operations
QA_Manager: Project creation, quality control operations
Inspector: Create/edit pins, upload photos
Contractor: Upload closing photos, view projects
PM, CEO, OM, CM, Site Manager: View-only with notification capabilities

📱 Mobile Features

Offline Support: PWA with service worker
Camera Integration: Direct photo capture
Touch Gestures: Natural pinch/zoom/pan
Push Notifications: Real-time alerts
Quick Actions: Upload closing photo from table view

📤 Export Capabilities
PDF Export

Pin Card PDF:

Page 1: Company logo, Issue ID, interactive map with numbered pins
Following pages: Opening/Closing photo pairs



CSV Export

Full table data (without images)
Available from both Projects Hub and Roof Dashboard

🚀 Getting Started
Prerequisites

Node.js 18+
Supabase account
PostgreSQL with PostGIS

Installation
bash# Clone repository
git clone [repository-url]
cd smartpin-tpo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
Environment Variables
envNEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
🔐 Security Features

Row Level Security (RLS) on all tables
Role-based access control
Secure file uploads with validation
JWT-based authentication
HTTPS enforced in production

📈 Performance Optimizations

Image thumbnail generation
Lazy loading for off-screen content
Optimistic UI updates
Database indexing on frequent queries
CDN for static assets

🛠️ Development
bash# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Generate TypeScript types from Supabase
npm run generate-types
📝 License
Private - All rights reserved

עכשיו אכתוב את ה-MARKDOWN המקיף למפתחים:
SmartPin TPO - Developer Documentation
System Architecture Overview
Core Concepts
1. Pin Hierarchy System
Parent Pin (Issue)
├── Pin #1 (seq: 1)
│   ├── Child 1.1
│   ├── Child 1.2
│   └── Child 1.3 (up to 50 children)
├── Pin #2 (seq: 2)
│   └── Child 2.1

Parent Pins: Created only on main roof dashboard
Child Pins: Created only within parent pin card
Numbering: Automatic sequential (1, 2, 3... for parents, 1.1, 1.2... for children)
Quantity Calculation: Parent + all children = total issues count

2. Status Workflow
Open (Red) → Ready To Inspect (Yellow) → Closed (Green)
                    ↓
              In Dispute (Orange)
Automation Rules:

Closing photo upload → Status changes to RTI automatically
Admin can manually override any status
Parent row stays yellow until ALL children are closed

3. Layer System (Bluebeam-Style)
javascriptlayers: [
  { name: "Issues", type: "pins", visible: true, z_index: 2 },
  { name: "Notes", type: "annotations", visible: true, z_index: 1 },
  { name: "Custom", type: "custom", visible: false, z_index: 3 }
]
Data Flow Architecture
Real-time Sync Strategy
User Action → Optimistic Update → Supabase Mutation → Broadcast
                                          ↓
                                   Activity Log Entry
                                          ↓
                                    Chat Notification
Conflict Resolution

Strategy: Last Write Wins
No locking mechanism
Immediate sync across all clients

Component Structure
src/
├── components/
│   ├── dashboard/
│   │   ├── ProjectsHub.tsx         # Main projects gallery
│   │   ├── KPICards.tsx           # Clickable KPI metrics
│   │   └── IssuesTable.tsx        # Filterable issues list
│   ├── roof/
│   │   ├── RoofCanvas.tsx         # Konva interactive map
│   │   ├── LayerPanel.tsx         # Layer management UI
│   │   └── ToolChest.tsx          # Tool selection
│   ├── pins/
│   │   ├── PinDetailsCard.tsx     # Parent/child pin modal
│   │   ├── PinHoverTooltip.tsx    # Thumbnail preview
│   │   └── PhotoContainer.tsx     # Opening/closing photos
│   └── chat/
│       ├── ActivityLog.tsx        # Automatic event logging
│       └── ChatThread.tsx         # Pin-specific discussion
Database Schema
Core Tables
sql-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE,
  actual_start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  contractor_id UUID,
  roof_plan_url TEXT NOT NULL,
  stakeholders UUID[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent Pins (Issues)
CREATE TABLE pins (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  seq_number INTEGER NOT NULL,
  x_position DECIMAL(6,4),  -- 0-1 normalized
  y_position DECIMAL(6,4),  -- 0-1 normalized
  issue_type TEXT,  -- INC, COR, TradeDamage
  defect_type TEXT,
  defect_layer TEXT,
  status TEXT DEFAULT 'Open',
  severity INTEGER,
  opening_photo_url TEXT,
  closing_photo_url TEXT,
  created_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  mttr_hours INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (closed_at - created_at))/3600
  ) STORED
);

-- Child Pins
CREATE TABLE pin_children (
  id UUID PRIMARY KEY,
  parent_pin_id UUID NOT NULL,
  child_seq TEXT NOT NULL,  -- "1.1", "1.2", etc
  x_position DECIMAL(6,4),
  y_position DECIMAL(6,4),
  status TEXT DEFAULT 'Open',
  opening_photo_url TEXT,
  closing_photo_url TEXT
);

-- Activity Logs (for chat)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  pin_id UUID,
  action TEXT,  -- 'status_changed', 'photo_uploaded', 'child_added'
  details JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
Konva Canvas Implementation
Coordinate System
javascript// Normalized coordinates (0-1) for device independence
const normalizedX = clickX / canvasWidth;
const normalizedY = clickY / canvasHeight;

// Convert back for display
const displayX = normalizedX * currentCanvasWidth;
const displayY = normalizedY * currentCanvasHeight;
Pin Rendering
javascriptconst PinMarker = ({ pin, scale }) => {
  const statusColors = {
    Open: '#ef4444',
    ReadyToInspect: '#f59e0b',
    Closed: '#10b981',
    InDispute: '#fb923c'
  };

  return (
    <Group
      x={pin.x_position * stageWidth}
      y={pin.y_position * stageHeight}
      onMouseEnter={showThumbnail}
      onClick={openPinCard}
    >
      <Circle
        radius={15 / scale}
        fill={statusColors[pin.status]}
        stroke="#fff"
        strokeWidth={2}
      />
      <Text
        text={String(pin.seq_number)}
        fontSize={12 / scale}
        fill="white"
      />
    </Group>
  );
};
Real-time Features
Activity Log Integration
javascript// Automatic logging on any pin action
const logActivity = async (action, details) => {
  await supabase.from('activity_logs').insert({
    pin_id: currentPin.id,
    action,
    details,
    user_id: currentUser.id
  });
  
  // Broadcast to chat
  broadcastToChat({
    type: 'activity',
    message: formatActivityMessage(action, details)
  });
};

// Usage
onPhotoUpload: (photo) => {
  logActivity('photo_uploaded', {
    photo_type: 'closing',
    pin_seq: '1.2',
    timestamp: new Date()
  });
  // Output: "Closing photo uploaded for pin 1.2 on [date] by [user]"
}
Notification System
javascript// Stakeholder notifications
const notifyStakeholders = async (projectId, event) => {
  const { data: project } = await supabase
    .from('projects')
    .select('stakeholders')
    .eq('id', projectId)
    .single();
    
  project.stakeholders.forEach(userId => {
    sendPushNotification(userId, {
      title: `Issue ${event.pin_seq} Updated`,
      body: event.message,
      data: { pinId: event.pin_id }
    });
  });
};
Mobile Optimizations
Touch Gesture Handling
javascript// Konva touch configuration
const stage = new Konva.Stage({
  container: 'canvas',
  draggable: true,
  dragBoundFunc: (pos) => {
    // Prevent dragging outside bounds
    return {
      x: Math.min(0, Math.max(pos.x, -maxX)),
      y: Math.min(0, Math.max(pos.y, -maxY))
    };
  }
});

// Pinch to zoom
let lastDist = 0;
stage.on('touchmove', (e) => {
  const touch1 = e.evt.touches[0];
  const touch2 = e.evt.touches[1];
  
  if (touch1 && touch2) {
    const dist = getDistance(touch1, touch2);
    if (lastDist > 0) {
      const scale = stage.scaleX() * (dist / lastDist);
      stage.scale({ x: scale, y: scale });
    }
    lastDist = dist;
  }
});
Quick Actions
javascript// Direct closing photo upload from table
const QuickUploadButton = ({ pin }) => (
  <button
    onClick={() => openCamera('closing', pin.id)}
    className="quick-upload-btn"
  >
    📷 Upload Closing
  </button>
);
Performance Considerations
Image Optimization
javascript// Thumbnail generation
const generateThumbnail = async (imageUrl) => {
  const img = new Image();
  img.src = imageUrl;
  
  const canvas = document.createElement('canvas');
  canvas.width = 150;  // Small thumbnail
  canvas.height = 150;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 150, 150);
  
  return canvas.toDataURL('image/jpeg', 0.7);
};
Pagination Strategy
javascript// Minimal lazy loading with "Back to Top" button
const IssuesTable = () => {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  return (
    <>
      <table>
        {/* Table rows */}
      </table>
      
      {/* Mobile-friendly navigation */}
      <div className="table-nav">
        <button onClick={() => setPage(page - 1)}>Previous</button>
        <button onClick={() => window.scrollTo(0, 0)}>↑ Top</button>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </>
  );
};
Export Functionality
PDF Generation
javascriptconst generatePinPDF = async (pin) => {
  const doc = new jsPDF();
  
  // Page 1: Header and map
  doc.addImage(companyLogo, 'PNG', 10, 10, 50, 20);
  doc.text(`Issue ID: ${pin.id}`, 10, 40);
  doc.addImage(pinMapSnapshot, 'PNG', 10, 50, 190, 100);
  
  // Following pages: Photos
  pin.children.forEach((child, index) => {
    if (index > 0) doc.addPage();
    
    // Opening photo (left)
    if (child.opening_photo_url) {
      doc.addImage(child.opening_photo_url, 'JPEG', 10, 20, 85, 85);
    }
    
    // Closing photo (right)
    if (child.closing_photo_url) {
      doc.addImage(child.closing_photo_url, 'JPEG', 105, 20, 85, 85);
    }
    
    doc.text(`Pin ${child.seq}`, 10, 110);
  });
  
  doc.save(`Issue_${pin.seq_number}.pdf`);
};