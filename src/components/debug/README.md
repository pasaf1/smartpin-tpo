# SmartPin TPO - Style Debugging System

A comprehensive suite of debugging tools designed specifically for the SmartPin TPO construction management application. This system helps developers identify, analyze, and resolve CSS styling issues, performance bottlenecks, and responsive design problems.

## 🚀 Quick Start

### Basic Usage

Add the MasterDebugger component to your app layout:

```tsx
import { MasterDebugger } from '@/components/debug'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <MasterDebugger />
      </body>
    </html>
  )
}
```

### Keyboard Shortcuts

- **Cmd/Ctrl + Shift + D**: Toggle debug tools on/off
- **Click debug elements**: Activate specific debugging features

## 🛠️ Available Tools

### 1. Style Inspector (`StyleDebugger`)

**Purpose**: Real-time CSS inspection and manipulation

**Features**:
- Element inspection mode (click to select elements)
- Live CSS class visualization
- Box model highlighting
- Typography grid overlay
- Responsive breakpoint indicators

**Usage**:
```tsx
<StyleDebugger 
  enabled={true}
  position="top-right"
/>
```

**Best For**:
- Debugging layout issues
- Understanding component styling
- Identifying CSS conflicts
- Learning Tailwind class applications

### 2. Responsive Tester (`ResponsiveDebugger`)

**Purpose**: Test and debug responsive design across different viewports

**Features**:
- Live breakpoint indicators
- Viewport dimension display
- Quick device simulation
- Tailwind breakpoint visualization
- Media query testing

**Usage**:
```tsx
<ResponsiveDebugger 
  enabled={true}
  showBreakpoints={true}
  showViewportInfo={true}
/>
```

**Breakpoints Supported**:
- Mobile: 0-767px
- Tablet: 768-1023px  
- Desktop: 1024-1279px
- Large: 1280-1535px
- XL: 1536px+

### 3. Performance Profiler (`PerformanceProfiler`)

**Purpose**: Monitor and optimize CSS/animation performance

**Features**:
- Real-time FPS monitoring
- Style recalculation timing
- Memory usage tracking
- CSS rule count analysis
- Performance issue detection

**Usage**:
```tsx
<PerformanceProfiler 
  enabled={true}
  showRealTime={false}
  autoProfile={true}
/>
```

**Performance Metrics**:
- Render time
- Paint timing
- Layout duration
- Animation frame rates
- Memory consumption

### 4. Conflict Detector (`ConflictDetector`)

**Purpose**: Automatically detect and resolve style conflicts

**Features**:
- Tailwind class conflict detection
- CSS specificity analysis
- Performance anti-pattern identification
- Auto-fix suggestions
- Conflict severity scoring

**Usage**:
```tsx
<ConflictDetector 
  enabled={true}
  autoScan={true}
/>
```

**Detects**:
- Conflicting Tailwind classes
- CSS specificity issues
- Unused/redundant styles
- Performance bottlenecks

### 5. Canvas Debug Panel (`DebugPanel`)

**Purpose**: Debug canvas-specific functionality (existing component)

**Features**:
- Pin count monitoring
- Layer management
- Viewport tracking
- Feature flag toggles

## 📋 Common Debugging Workflows

### 1. Layout Issues

1. Enable **Style Inspector**
2. Click "Inspect" mode
3. Select problematic element
4. Review Tailwind classes and computed styles
5. Check for conflicting classes in **Conflict Detector**

### 2. Responsive Problems

1. Enable **Responsive Debugger**
2. Test different viewport sizes
3. Check breakpoint-specific classes
4. Use quick device simulation
5. Verify media query application

### 3. Performance Issues

1. Enable **Performance Profiler**
2. Run performance analysis
3. Review FPS and timing metrics
4. Check for heavy CSS rules
5. Implement suggested optimizations

### 4. Class Conflicts

1. Enable **Conflict Detector**
2. Run automatic scan
3. Review detected conflicts
4. Apply auto-fix suggestions
5. Re-scan to verify fixes

## 🎯 Project-Specific Guidelines

### SmartPin TPO Styling Architecture

The project uses:
- **Tailwind CSS 4.x** for utility-first styling
- **Custom design tokens** for luxury theme
- **Framer Motion** for animations
- **Radix UI** for component primitives
- **Glass morphism effects** with backdrop-blur

### Key Components to Debug

1. **InteractiveRoofPlan** (`/components/dashboard/InteractiveRoofPlan.tsx`)
   - Complex animations with Framer Motion
   - Transform-heavy pin interactions
   - Responsive canvas scaling

2. **KPICards** (`/components/dashboard/KPICards.tsx`)
   - Gradient backgrounds
   - Hover animations
   - Grid layout responsiveness

3. **Layout Components** (`/components/layout/`)
   - Backdrop blur effects
   - Navigation responsive behavior
   - Modal/dialog positioning

### Common Issues & Solutions

#### Issue: Animation Performance
- **Symptoms**: Low FPS, janky animations
- **Debug**: Use Performance Profiler
- **Solution**: Add `will-change` property, use `transform` instead of position changes

#### Issue: Responsive Breakpoints
- **Symptoms**: Layout breaks at certain widths
- **Debug**: Use Responsive Debugger
- **Solution**: Check Tailwind breakpoint classes, test edge cases

#### Issue: Glass Morphism Not Working
- **Symptoms**: Backdrop blur not visible
- **Debug**: Use Style Inspector
- **Solution**: Check browser support, ensure proper backdrop filter syntax

#### Issue: Z-index Conflicts
- **Symptoms**: Elements appearing behind others
- **Debug**: Use Conflict Detector
- **Solution**: Review z-index hierarchy, use Tailwind z-index classes

## ⚡ Performance Optimization

### CSS Best Practices

1. **Avoid Complex Selectors**
   ```css
   /* Bad */
   .container > .item:nth-child(odd) > .content
   
   /* Good */
   .content-odd
   ```

2. **Use Transform for Animations**
   ```css
   /* Bad */
   .animate { left: 100px; top: 50px; }
   
   /* Good */
   .animate { transform: translate(100px, 50px); }
   ```

3. **Minimize Reflows/Repaints**
   - Use `will-change` for animated elements
   - Prefer `opacity` and `transform`
   - Avoid animating layout properties

### Tailwind Optimization

1. **Purge Unused Classes**
   ```javascript
   // tailwind.config.js
   module.exports = {
     content: ['./src/**/*.{js,ts,jsx,tsx}'],
     // This automatically purges unused classes
   }
   ```

2. **Use JIT Mode**
   - Tailwind 4.x uses JIT by default
   - Generates only used utilities
   - Faster build times

3. **Group Related Classes**
   ```tsx
   // Good organization
   const cardStyles = "bg-white shadow-lg rounded-xl p-6"
   const buttonStyles = "px-4 py-2 bg-blue-500 hover:bg-blue-600"
   ```

## 🔧 Configuration Options

### MasterDebugger Props

```tsx
interface MasterDebuggerProps {
  defaultEnabled?: boolean      // Default: true
  persistSettings?: boolean     // Default: true (saves to localStorage)
  className?: string           // Additional CSS classes
}
```

### Environment Variables

```bash
# .env.local
NODE_ENV=development          # Required for debug tools to appear
DEBUG_PERFORMANCE=true        # Enable performance monitoring
DEBUG_VERBOSE=false          # Show verbose logging
```

### localStorage Settings

Debug settings are automatically saved:
```javascript
// Stored as: 'smartpin-debug-settings'
{
  "isEnabled": true,
  "features": {
    "style-debugger": true,
    "responsive-debugger": true,
    "performance-profiler": false,
    "conflict-detector": true
  }
}
```

## 🚨 Troubleshooting

### Debug Tools Not Appearing

1. Ensure `NODE_ENV === 'development'`
2. Check browser console for errors
3. Verify component import paths
4. Try refreshing the page

### Performance Issues with Debug Tools

1. Disable real-time monitoring
2. Reduce scan frequency
3. Use selective feature enabling
4. Clear localStorage debug settings

### Style Conflicts Not Detected

1. Run manual scan in Conflict Detector
2. Check for dynamic class names
3. Verify CSS-in-JS styles
3. Look for inline styles

### False Positive Conflicts

1. Review conflict rules in source code
2. Add exceptions for known good patterns
3. Adjust severity thresholds
4. Use manual override

## 🔗 Integration Examples

### With Next.js App Router

```tsx
// app/layout.tsx
import { MasterDebugger } from '@/components/debug'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {/* Only in development */}
        {process.env.NODE_ENV === 'development' && <MasterDebugger />}
      </body>
    </html>
  )
}
```

### With Individual Components

```tsx
// For specific component debugging
import { StyleDebugger, ConflictDetector } from '@/components/debug'

export function ComplexComponent() {
  return (
    <div>
      {/* Component content */}
      
      {/* Debug specific issues */}
      <StyleDebugger enabled={process.env.NODE_ENV === 'development'} />
      <ConflictDetector enabled={process.env.NODE_ENV === 'development'} />
    </div>
  )
}
```

### With Custom Debug Hooks

```tsx
// hooks/useDebugMode.ts
import { useState, useEffect } from 'react'

export function useDebugMode() {
  const [debugEnabled, setDebugEnabled] = useState(false)
  
  useEffect(() => {
    const saved = localStorage.getItem('debug-mode')
    setDebugEnabled(saved === 'true')
  }, [])
  
  const toggleDebug = () => {
    const newValue = !debugEnabled
    setDebugEnabled(newValue)
    localStorage.setItem('debug-mode', String(newValue))
  }
  
  return { debugEnabled, toggleDebug }
}
```

## 📚 Advanced Usage

### Custom Debug Extensions

Create custom debug components by extending the base patterns:

```tsx
// components/debug/CustomDebugger.tsx
export function CustomDebugger({ enabled = false }) {
  if (process.env.NODE_ENV !== 'development' || !enabled) {
    return null
  }
  
  // Your custom debugging logic
  return (
    <div className="fixed bottom-4 left-4 bg-purple-600 text-white p-2 rounded">
      Custom Debug Info
    </div>
  )
}
```

### Debug Data Exports

Export debug data for external analysis:

```tsx
const exportDebugData = () => {
  const debugData = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    // ... other debug info
  }
  
  const blob = new Blob([JSON.stringify(debugData, null, 2)], {
    type: 'application/json'
  })
  // Download logic
}
```

### Performance Monitoring Integration

```tsx
// Integrate with performance monitoring services
useEffect(() => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      // Send to monitoring service
      console.log('Performance metrics:', list.getEntries())
    })
    
    observer.observe({ entryTypes: ['measure', 'navigation'] })
  }
}, [])
```

## 🤝 Contributing

When adding new debug features:

1. Follow the existing component patterns
2. Ensure development-only rendering
3. Add proper TypeScript types
4. Include usage documentation
5. Test across different viewport sizes
6. Consider performance impact

### Component Structure

```tsx
interface DebugComponentProps {
  enabled?: boolean
  // ... specific props
}

export function DebugComponent({ enabled = false, ...props }) {
  // Development check
  if (process.env.NODE_ENV !== 'development' || !enabled) {
    return null
  }
  
  // Component logic
  return (
    // Debug UI
  )
}
```

This debugging system provides comprehensive tools for developing and maintaining the SmartPin TPO application's complex styling requirements while ensuring optimal performance and user experience.