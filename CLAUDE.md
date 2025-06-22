# 🚨 CLAUDE DEVELOPMENT GUIDELINES

## 🤖 MULTI-AGENT COORDINATION SYSTEM

### **Agent Architecture Overview**
**CRITICAL**: This project operates with specialized agents, each managing specific domains and maintaining persistent context even after terminal crashes.

### **Agent Startup Protocol**
When `get context of project` is requested, **AUTOMATICALLY START ALL AGENTS**:

```bash
# Agent startup commands (run in parallel)
claude --agent USER_PROFILE_AGENT --context-file AGENT_CONTEXTS/USER_PROFILE_AGENT.md
claude --agent TRANSPORT_AGENT --context-file AGENT_CONTEXTS/TRANSPORT_AGENT.md  
claude --agent MAP_AGENT --context-file AGENT_CONTEXTS/MAP_AGENT.md
claude --agent EMERGENCY_AGENT --context-file AGENT_CONTEXTS/EMERGENCY_AGENT.md
claude --agent COMMUNITY_AGENT --context-file AGENT_CONTEXTS/COMMUNITY_AGENT.md
```

### **Agent Specializations**

#### **👤 USER_PROFILE_AGENT** - `AGENT_CONTEXTS/USER_PROFILE_AGENT.md`
- **Responsibilities**: User management, profiles, authentication, community trust
- **Components**: Profile.jsx, Login.jsx, HumanityLeaderboard.jsx, OptimizationPreferences.jsx
- **Services**: socialScoreService.js, user APIs, community features
- **Database**: users, user_social_scores, community_verifications

#### **🚌 TRANSPORT_AGENT** - `AGENT_CONTEXTS/TRANSPORT_AGENT.md`
- **Responsibilities**: Multi-modal transport, routing, real-time tracking
- **Components**: TransportModeSelector.jsx, PublicTransitMap.jsx, RouteMap.jsx, JourneyPlanner.jsx
- **Services**: transportService.js, routingService.js, transport APIs
- **Database**: transport_types, transport_routes, live_tracking

#### **🗺️ MAP_AGENT** - `AGENT_CONTEXTS/MAP_AGENT.md`
- **Responsibilities**: Map interface, location services, spatial interactions
- **Components**: LiveCityMap.jsx, MapView.jsx, LocationSearch.jsx, MapPinContextMenu.jsx
- **Services**: Nominatim integration, coordinateUtils.js
- **Focus**: Location privacy, geographic intelligence

#### **🚨 EMERGENCY_AGENT** - `AGENT_CONTEXTS/EMERGENCY_AGENT.md`
- **Responsibilities**: Emergency transport, urgent scenarios, crisis response
- **Components**: EmergencyTransportModal.jsx, emergency FAB integration
- **UX**: Research-driven hero layouts, cognitive load reduction
- **Focus**: Stress reduction, progressive trust, fast response

#### **🤝 COMMUNITY_AGENT** - `AGENT_CONTEXTS/COMMUNITY_AGENT.md`
- **Responsibilities**: Community features, crowdsourced data, social coordination
- **Components**: CommunityHelpModal.jsx, BusReportingInterface.jsx, BusStopHelper.jsx
- **Services**: Community verification, social scoring
- **Focus**: Mutual aid, transport data collection, trust building

### **Context Synchronization Protocol**

#### **Every Prompt-Response Cycle MUST:**
1. **Read agent context file** before responding
2. **Update agent context file** after responding
3. **Coordinate with other agents** when needed
4. **Maintain persistent state** across terminal sessions

#### **🚨 CRITICAL ENFORCEMENT: Context Updates are MANDATORY**
- **EVERY agent MUST update their context after EVERY interaction**
- **NO EXCEPTIONS** - This is required for multi-agent persistence
- **Protocol**: Read Context → Process Request → Update Context → Respond
- **Failure to update context breaks the entire multi-agent system**

#### **Context Update Format:**
```markdown
## 🔄 Last Interaction Update
**Date**: 2025-01-21  
**Action**: [What was done]  
**Files Modified**: [List of changed files]  
**Coordination**: [Other agents involved]  
**Next Priority**: [What to do next]  
**User Feedback**: [Any user input received]  
```

### **Agent Communication Channels**
- **Shared State**: User session, transport preferences, location data
- **Cross-Agent Events**: Emergency triggers, transport updates, community data
- **Coordination Points**: Profile preferences → Transport options → Map display

### **Terminal Crash Recovery**
**When terminal crashes:**
1. Agent reads its context file immediately
2. Understands current project state
3. Continues where left off
4. Coordinates with other agents as needed

### **Agent Activation Examples**

**User Profile Request**: 
→ USER_PROFILE_AGENT activates
→ Reads USER_PROFILE_AGENT.md context
→ Handles user management tasks
→ Updates context file with actions taken

**Transport Planning**: 
→ TRANSPORT_AGENT + MAP_AGENT coordinate
→ Both read their context files
→ Share route and location data
→ Update contexts with coordination results

**Emergency Scenario**:
→ EMERGENCY_AGENT prioritized
→ Coordinates with TRANSPORT_AGENT for fast options
→ Uses MAP_AGENT for location services
→ All agents update contexts with emergency response

---

# 🚨 CLAUDE DEVELOPMENT GUIDELINES

## ⚠️ CRITICAL RULES - NEVER VIOLATE

### **RULE #0: ALWAYS CONSULT HUMAN_UX_PRINCIPLES.md FIRST**
**🧠 MANDATORY: Before implementing ANY UI component or interaction, ALWAYS read and follow HUMAN_UX_PRINCIPLES.md**

**Key Human Principles to NEVER forget:**
- ✅ **ESC key MUST close all modals/overlays - NO EXCEPTIONS**
- ✅ **Users MUST always have a clear path back to home**
- ✅ **Position elements where humans expect them (near click, not center screen)**
- ✅ **Keep everything within visible viewport bounds**
- ✅ **Design for the human holding the device, not the computer running the code**

**Recent Example Fix:**
- ❌ `position: absolute` for zoom controls (relative to container)
- ✅ `position: fixed` for zoom controls (relative to viewport for human visibility)

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
# 🚨 STANDARD SERVER PORTS - NEVER CHANGE THESE:
# Frontend: http://localhost:5173 (Vite dev server)
# Backend: http://localhost:3001 (Node.js/Express server)

# Check component usage
grep -r "ComponentName" frontend/src/

# Verify no regressions
npm run build
```

### **DEVELOPMENT ENVIRONMENT:**
- **🚨 STANDARD SERVER PORTS - NEVER CHANGE:**
  - **Frontend**: http://localhost:5173 (Vite dev server) 
  - **Backend**: http://localhost:3001 (Node.js/Express server)
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

---

## 🚌 COMMUNITY TRANSPORT SYSTEM - SUSTAINABLE MOBILITY

### **Pin-Based Community Transport (Mission-Aligned)**
**✅ IMPLEMENTED - Community-driven sustainable transport system**

**Mission Alignment:**
- Focus on **human needs rather than modifying user behavior**
- Prioritize **public transport and community ridesharing** over commercial options
- Emphasize **existing vehicle utilization** and **sustainable mobility**
- Support **community-driven features** with social scoring

**Research Insights from Google Maps:**
- Multi-modal transport integration concept (adapted for sustainability)
- Real-time options comparison (adapted for community focus)
- Seamless booking experience (adapted for public/shared transport)

**✅ SOLUTION - Community-focused transport system:**

#### **Pin Context Menu Enhancement:**
```jsx
// Community-focused transport options
<button className="pin-action-btn find-transport featured">
  <span className="action-icon">🚌</span>
  <span className="action-text">Find Transport</span>
  <span className="action-description">Bus, Train, Rideshare</span>
</button>
```

#### **CommunityTransportModal.jsx - Sustainable Transport Interface:**

**🚌 Public Transport Options:**
- **Bus Routes**: Real route numbers, timings, crowding levels
- **Metro/Train**: Direct routes with carbon footprint data
- **Local Transit**: Community-verified transport options

**🤝 Community Ridesharing:**
- **Shared Auto-rickshaw**: Fill empty seats (2/3 seats filled)
- **Car Pools**: Community members offering rides
- **Rider Profiles**: Names and ratings for trust building

**🚶 Active Transport:**
- **Walking**: Free, health benefits (+50 cal), zero emissions
- **Bike Share**: Community bike sharing with availability info

#### **Key Features (Mission-Aligned):**
- ✅ **Sustainability Focus** - Carbon footprint for each option
- ✅ **Community Integration** - Real rider names and shared rides
- ✅ **Public Transport Priority** - Buses/trains shown first
- ✅ **Health Benefits** - Calorie burn info for active transport
- ✅ **Cost Transparency** - Affordable options (₹5-₹30 range)
- ✅ **Crowding Info** - Real-time occupancy levels

#### **User Flow:**
1. **Map Pin Click** → Context menu with "Find Transport" button
2. **Modal Opens** → Loading "sustainable transport options"
3. **Category Selection** → Public Transport, Community Rides, Active Transport
4. **Option Selection** → Pick based on time, cost, sustainability
5. **Join/Select** → "Join Ride" for rideshares, "Select Transport" for public

#### **Sustainability Indicators:**
- **Carbon Footprint**: 🌱 0.1kg-0.4kg CO₂ (Walking: 0kg)
- **Health Impact**: 💪 +30-50 calories for active transport
- **Community Trust**: 👥 Crowding levels, rider ratings
- **Cost Efficiency**: ₹5-₹30 vs commercial ride ₹200+

#### **Integration Points:**
- `MapPinContextMenu.jsx` - "Find Transport" button (blue theme)
- `CommunityTransportModal.jsx` - Sustainable transport interface
- `LiveCityMap.jsx` - Community transport state management
- `MapWithPinning.jsx` - Community-focused event handling

**Mission Benefits:**
- ✅ **Maximize Vehicle Utilization** - Fill existing transport capacity
- ✅ **Support Public Transit** - Promote buses, trains, metro
- ✅ **Community Building** - Connect neighbors for shared rides
- ✅ **Environmental Impact** - Reduce carbon emissions through sharing
- ✅ **Human-Centered** - Focus on user needs, not behavior modification

**Testing Requirements:**
- [ ] Test community transport flow from pin to selection
- [ ] Verify sustainability indicators display correctly
- [ ] Check public transport options prioritization
- [ ] Ensure community rideshare trust features work
- [ ] Validate carbon footprint calculations

---

## 🔍 QUICK TRAVEL SYSTEM - PIN-BASED NAVIGATION

### **Search & Travel Modal for Map Navigation**
**✅ IMPLEMENTED - Quick location search and instant travel functionality**

**Problem Solved:** Long-distance map navigation through panning is tedious and time-consuming.

**✅ SOLUTION - Pin-based search and travel system:**

#### **Pin Context Menu Enhancement:**
```jsx
// Primary "Search & Travel" button in pin menu
<button className="pin-action-btn edit-location primary">
  <span className="action-icon">🔍</span>
  <span className="action-text">Search & Travel</span>
  <span className="action-description">Quick location search</span>
</button>
```

#### **QuickTravelModal.jsx - Location Search Interface:**
- **LocationSearch Integration**: Reuses existing high-quality search component
- **Current Pin Display**: Shows coordinates where user clicked
- **Live Preview**: Selected destination preview before traveling
- **Instant Travel**: Updates map center and zoom automatically

#### **Key Features:**
- ✅ **Global Search** - Search any city, landmark, or address worldwide
- ✅ **Auto-complete** - Real-time suggestions with Nominatim API
- ✅ **Smart Zoom** - Automatically zooms to level 14 for new locations
- ✅ **City Detection** - Updates "Exploring [City]" status for new location
- ✅ **Smooth Transitions** - Animated map movement to destination

#### **User Flow:**
1. **Click Anywhere on Map** → Pin appears with context menu
2. **Click "Search & Travel"** → Modal opens with search box
3. **Type Destination** → Auto-complete suggestions appear
4. **Select Location** → Preview shows selected destination
5. **Click "Travel Here"** → Map smoothly moves to new location
6. **Status Updates** → Shows "Exploring [New City Name]"

#### **Integration with City Detection:**
- **Dynamic City Updates**: Uses existing `detectViewportCity()` function
- **Status Integration**: Updates location status card automatically
- **Viewport Tracking**: Separates travel destinations from user interactions

#### **CSS Features:**
- **Modal Animations**: Smooth fade-in and scale effects
- **Search Integration**: Seamless LocationSearch component styling
- **Mobile Responsive**: Perfect experience on all screen sizes
- **Preview Cards**: Beautiful destination preview with smooth animations

#### **Technical Implementation:**
```jsx
// Travel functionality in LiveCityMap.jsx
const handleTravelTo = (location) => {
  setMapCenter([location.lat, location.lng]);
  setMapZoom(14); // Smart zoom level
  detectViewportCity(location.lat, location.lng); // Update city
};
```

**Benefits:**
- ✅ **Speed** - Much faster than panning for long distances
- ✅ **Accuracy** - Search specific addresses and landmarks
- ✅ **City Hopping** - Jump between cities instantly
- ✅ **User Experience** - Familiar search interface with map integration

**Perfect for:**
- Long-distance exploration (San Francisco → New York)
- Specific address lookup (restaurants, hotels, landmarks)
- Quick city discovery and navigation
- Research and trip planning workflows