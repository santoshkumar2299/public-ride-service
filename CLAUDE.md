# 🚨 CLAUDE DEVELOPMENT GUIDELINES

## ⚠️ CRITICAL RULES - NEVER VIOLATE

### **RULE #1: ALWAYS CHECK EXISTING COMPONENTS FIRST**
**Before implementing ANY new component, MANDATORY steps:**

1. **Search existing components:**
   ```bash
   find frontend/src/components -name "*.jsx" | xargs grep -l "keyword"
   ls frontend/src/components/ | grep -i "relevant_term"
   ```

2. **Check for similar functionality:**
   - Search components
   - Input components  
   - Modal components
   - Any related UI patterns

3. **READ EXISTING CODE before writing new code**

4. **REUSE > ENHANCE > CREATE (in that order)**

### **RECENT MISTAKES TO NEVER REPEAT:**

#### ❌ **LocationSearch Regression (Jan 2025)**
- **Mistake**: Created fake text input instead of using existing LocationSearch component
- **Existing**: Full-featured LocationSearch with Nominatim API, autocomplete, geocoding
- **Created**: Broken text box that just creates fake destinations
- **Impact**: Major functionality regression, user experience downgrade
- **Lesson**: ALWAYS grep for existing components before implementing

### **MANDATORY CHECKLIST:**
Before any component implementation:
- [ ] Searched for existing similar components
- [ ] Read existing component code
- [ ] Verified no functionality regression
- [ ] Confirmed this enhances rather than replaces existing quality

### **PROJECT ARCHITECTURE:**

#### **Existing High-Quality Components:**

**🔍 Location & Search Components:**
- `LocationSearch.jsx` - Full address search with Nominatim API ⭐ HIGH QUALITY
- `LocationInput.jsx` - Basic location input
- `LocationPicker.jsx` - Location picker interface
- `LocationModal.jsx` - Modal for location selection
- `CompactLocationBar.jsx` - Compact location display
- `MapLocationSelector.jsx` - Map-based location selection
- `CoordinateInput.jsx` - Direct coordinate input

**🗺️ Map Components:**
- `MapView.jsx` - Leaflet integration ⭐ HIGH QUALITY
- `MapFirstView.jsx` - Map-first interface

**⚙️ System Components:**
- `OptimizationPreferences.jsx` - User preferences
- `BookingFeedbackModal.jsx` - Post-booking learning ⭐ NEW
- `TransportModeSelector.jsx` - Transport mode selection
- `Header.jsx` - App header
- `Portal.jsx` - Portal for modals
- `Icons.jsx` - Icon library
- `LoadingSkeleton.jsx` - Loading states

**🚗 Transport Components:**
- `ActiveRides.jsx` - Active ride management
- `RideHistory.jsx` - Ride history
- `RiderFlow.jsx` - Rider workflow
- `PassengerFlow.jsx` - Passenger workflow
- `BusStopHelper.jsx` - Bus stop assistance

#### **Tech Stack:**
- **Frontend**: React + Vite + Leaflet + react-leaflet
- **Backend**: Node.js + Express + SQLite
- **Geocoding**: Nominatim (OpenStreetMap) - FREE, no API key needed
- **Maps**: Leaflet with OpenStreetMap tiles

#### **API Integrations:**
- Nominatim for geocoding (already integrated in LocationSearch)
- No external paid APIs required

### **DEVELOPMENT PRIORITIES:**
1. **User Experience First** - Never degrade existing functionality
2. **Reuse Quality Components** - Don't reinvent poorly
3. **Enhance, Don't Replace** - Build on existing quality
4. **Test Integration** - Ensure components work together

### **TESTING COMMANDS:**
```bash
# Development servers (typically already running)
# Frontend: http://localhost:5173 or 5174
# Backend: http://localhost:3001

# Check component usage
grep -r "ComponentName" frontend/src/

# Verify no regressions
npm run build
```

### **DEVELOPMENT ENVIRONMENT:**
- **Servers are typically running** - Frontend (Vite) and Backend (Node.js) are usually active during development
- **No need to start servers** unless explicitly requested by user
- **Hot reload enabled** - Changes reflect immediately in browser

---

### **🔍 COMPONENT SEARCH COMMANDS:**
```bash
# Find location-related components
find frontend/src/components -name "*Location*" -o -name "*Search*" -o -name "*Input*"

# Search for specific functionality
grep -r "geocod\|nominatim\|search" frontend/src/components/

# List all components
ls frontend/src/components/*.jsx

# Check component imports
grep -r "import.*LocationSearch" frontend/src/
```

---

**🎯 Remember: If it exists and works well, USE IT. If it needs enhancement, ENHANCE IT. Only create new when truly needed.**

**🚨 NEVER AGAIN: Recreate LocationSearch functionality - it's already perfect!**

---

## 🔧 TECHNICAL FIXES & DEBUGGING

### **ContextualFAB Action Button Click Issue**
**⚠️ CRITICAL BUG PATTERN - Action buttons visible but not clickable**

**Problem:** ContextualFAB action buttons appear when FAB expands, but clicking them doesn't trigger handlers.

**Root Cause:** CSS classes `fab-action-buttons` and `fab-action-btn` can interfere with click events through:
- `pointer-events: none`
- Incorrect z-index layering  
- Event propagation blocking
- Backdrop overlays intercepting clicks

**✅ SOLUTION - Force clickable styling:**
```jsx
// Action buttons container - bypass CSS classes
<div style={{
  position: 'fixed',
  bottom: '100px',
  right: '20px', 
  display: isExpanded ? 'flex' : 'none',
  flexDirection: 'column',
  gap: '10px',
  zIndex: 10001,
  pointerEvents: 'auto'
}}>

// Action buttons - remove className, force styling
<button
  key={action.id}
  // className="fab-action-btn" // REMOVE THIS
  onClick={() => handleActionClick(action)}
  style={{
    position: 'relative',
    zIndex: 10000,
    pointerEvents: 'auto',
    cursor: 'pointer',
    background: action.color,
    color: 'white',
    // ... other forced styles
  }}
>
```

**Debugging Steps:**
1. Add click handler logging: `console.log('Button click detected for:', action.id)`
2. If no logs appear, CSS is blocking clicks
3. Remove all CSS classes and force inline styles
4. Use high z-index (10000+) and `pointerEvents: 'auto'`

**Prevention:** Always test action button clicks immediately after implementing FAB components.

---

## 🎨 RESPONSIVE DESIGN & BROWSER ZOOM

### **Map Viewport & Browser Zoom Best Practices**
**✅ IMPLEMENTED - Fully responsive design system**

**Problem Solved:** Maps overflowing viewport during browser zoom, static pixel measurements not scaling properly.

**✅ SOLUTION - Dynamic viewport units & responsive variables:**

```css
:root {
  /* Responsive Header Heights */
  --header-height: 3.5rem; /* 56px on desktop */
  --header-height-mobile: 3rem; /* 48px on mobile */
  
  /* Responsive Avatar Sizes */
  --avatar-size: 2.25rem; /* 36px */
  --avatar-size-large: 2.5rem; /* 40px */
}

/* Map with responsive header compensation */
.interactive-city-map {
  height: calc(100vh - var(--header-height-mobile));
}

@media (min-width: 768px) {
  .interactive-city-map {
    height: calc(100vh - var(--header-height));
  }
}

/* Dynamic viewport height for browser zoom */
@supports (height: 100dvh) {
  .interactive-city-map {
    height: calc(100dvh - var(--header-height-mobile));
  }
  
  @media (min-width: 768px) {
    .interactive-city-map {
      height: calc(100dvh - var(--header-height));
    }
  }
}
```

**Key Features:**
- ✅ **100dvh support** - Auto-adjusts for browser zoom
- ✅ **CSS variables** - No static pixel measurements
- ✅ **Media queries** - Mobile (48px header) vs Desktop (56px header)
- ✅ **Accessibility** - WCAG 2.1 compliant (400% zoom support)
- ✅ **rem units** - Typography scales with browser settings

**Header Design:**
- **Simplified navigation** - Logo (left) + User avatar (right) only
- **Fixed positioning** - Stays at top, doesn't interfere with map
- **All navigation** moved to user dropdown menu

**Testing Checklist:**
- [ ] Test at 100%, 200%, 300%, 400% browser zoom
- [ ] Verify map fills available space on mobile/tablet/desktop
- [ ] Check header remains accessible at all zoom levels
- [ ] Ensure no horizontal scrolling occurs