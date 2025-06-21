# Detailed Task Breakdown & Implementation Guide
# Public Transit Tracker Extension

## Task Priority Framework

### Priority Levels
- **🔴 CRITICAL**: Blocking other tasks, core infrastructure
- **🟠 HIGH**: Core features, user-facing functionality  
- **🟡 MEDIUM**: Enhancement features, optimization
- **🟢 LOW**: Nice-to-have, future expansion

### Dependencies Notation
- **Depends On**: Must complete before starting
- **Blocks**: Other tasks waiting for this completion
- **Parallel**: Can work simultaneously

---

## PHASE 1: FOUNDATION (Months 1-2)
*Goal: Extend existing architecture for multi-transport support*

### 🔴 CRITICAL-001: Database Schema Migration
**Priority**: CRITICAL  
**Estimate**: 5 days  
**Owner**: Backend Developer  
**Dependencies**: None  
**Blocks**: All other tasks

#### Detailed Subtasks
1. **Schema Design & Planning** (1 day)
   ```sql
   -- Design new table structures
   -- Plan migration strategy 
   -- Review existing schema constraints
   ```

2. **Create Migration Scripts** (1.5 days)
   ```javascript
   // migrations/001_add_transport_infrastructure.js
   exports.up = function(knex) {
     return knex.schema
       .createTable('transport_types', table => {
         table.increments('id');
         table.string('name').notNullable();
         table.string('icon').notNullable();
         table.text('description');
         table.json('tracking_config');
         table.json('prediction_model');
         table.timestamps(true, true);
       })
       .createTable('transport_routes', table => {
         table.increments('id');
         table.integer('transport_type_id').references('transport_types.id');
         table.string('route_number').notNullable();
         table.string('route_name').notNullable();
         table.string('start_point').notNullable();
         table.string('end_point').notNullable();
         table.json('schedule_data');
         table.boolean('is_active').defaultTo(true);
         table.timestamps(true, true);
       });
   };
   ```

3. **Geographic Indexing Setup** (1 day)
   ```sql
   -- Add spatial indexes for performance
   CREATE INDEX idx_transport_stops_location ON transport_stops 
   USING GIST(ST_Point(longitude, latitude));
   
   CREATE INDEX idx_live_tracking_location ON live_tracking 
   USING GIST(ST_Point(current_lng, current_lat));
   ```

4. **Seed Data Creation** (1 day)
   ```javascript
   // seeds/transport_seed_data.js
   const hyderabadBusRoutes = [
     {
       route_number: "185G",
       route_name: "Jubilee Hills - HITEC City",
       start_point: "Jubilee Hills Check Post",
       end_point: "HITEC City",
       stops: [/* stop data */]
     }
   ];
   ```

5. **Migration Testing** (0.5 days)
   - Test on development environment
   - Verify data integrity
   - Performance benchmarking

**Acceptance Criteria**:
- ✅ All new tables created successfully
- ✅ Existing data preserved during migration  
- ✅ Geographic queries perform under 100ms
- ✅ Foreign key constraints properly enforced
- ✅ Rollback procedure tested and documented

---

### 🔴 CRITICAL-002: Transport Abstraction Layer
**Priority**: CRITICAL  
**Estimate**: 8 days  
**Owner**: Full-stack Developer  
**Dependencies**: CRITICAL-001  
**Blocks**: All transport-specific features

#### Detailed Subtasks

1. **Design TransportProvider Interface** (1.5 days)
   ```javascript
   // services/transport/TransportProvider.js
   class TransportProvider {
     constructor(config) {
       this.type = config.type;
       this.trackingConfig = config.trackingConfig;
       this.predictionModel = config.predictionModel;
     }
     
     // Abstract methods to be implemented by subclasses
     async startTracking(userId, routeId) {
       throw new Error('Must implement startTracking');
     }
     
     async updateLocation(trackingId, location) {
       throw new Error('Must implement updateLocation');
     }
     
     async predictArrival(routeId, stopId) {
       throw new Error('Must implement predictArrival');
     }
     
     async validateRoute(location, routeId) {
       throw new Error('Must implement validateRoute');
     }
   }
   ```

2. **Implement Base Transport Service** (2 days)
   ```javascript
   // services/transport/BaseTransportService.js
   class BaseTransportService {
     constructor() {
       this.providers = new Map();
     }
     
     registerProvider(type, provider) {
       this.providers.set(type, provider);
     }
     
     getProvider(type) {
       const provider = this.providers.get(type);
       if (!provider) {
         throw new Error(`No provider registered for transport type: ${type}`);
       }
       return provider;
     }
     
     async startTracking(transportType, userId, routeId) {
       const provider = this.getProvider(transportType);
       return await provider.startTracking(userId, routeId);
     }
   }
   ```

3. **Create Bus-Specific Implementation** (2.5 days)
   ```javascript
   // services/transport/BusTransportProvider.js
   class BusTransportProvider extends TransportProvider {
     constructor(config) {
       super(config);
       this.type = 'bus';
     }
     
     async startTracking(userId, routeId) {
       // Validate user is on correct bus route
       // Initialize GPS tracking session
       // Set up prediction baseline
       
       const trackingSession = await db('live_tracking').insert({
         user_id: userId,
         route_id: routeId,
         tracking_start_time: new Date(),
         is_active: true
       });
       
       return trackingSession;
     }
     
     async updateLocation(trackingId, location) {
       // Validate location accuracy
       // Check route adherence
       // Update prediction models
       
       await db('live_tracking')
         .where('id', trackingId)
         .update({
           current_lat: location.lat,
           current_lng: location.lng,
           speed: location.speed,
           direction: location.heading,
           last_update: new Date()
         });
     }
     
     async predictArrival(routeId, stopId) {
       // Get current bus positions on route
       // Calculate average speed
       // Apply historical delay factors
       // Return prediction with confidence
       
       const activeBuses = await this.getActiveBusesOnRoute(routeId);
       const predictions = await Promise.all(
         activeBuses.map(bus => this.calculateArrivalTime(bus, stopId))
       );
       
       return this.selectBestPrediction(predictions);
     }
   }
   ```

4. **Update API Endpoints for Multi-Transport** (1.5 days)
   ```javascript
   // routes/transport.js
   router.post('/start-tracking', async (req, res) => {
     const { transportType, routeId } = req.body;
     const userId = req.user.id;
     
     try {
       const transportService = new BaseTransportService();
       const trackingSession = await transportService.startTracking(
         transportType, 
         userId, 
         routeId
       );
       
       res.json({ success: true, trackingSession });
     } catch (error) {
       res.status(400).json({ error: error.message });
     }
   });
   
   router.put('/update-location/:trackingId', async (req, res) => {
     const { trackingId } = req.params;
     const { location } = req.body;
     
     // Implementation with validation and error handling
   });
   ```

5. **Write Comprehensive Unit Tests** (0.5 days)
   ```javascript
   // tests/transport/TransportProvider.test.js
   describe('TransportProvider', () => {
     describe('BusTransportProvider', () => {
       it('should start tracking successfully', async () => {
         const provider = new BusTransportProvider(config);
         const result = await provider.startTracking(userId, routeId);
         expect(result).toBeDefined();
         expect(result.tracking_id).toBeNumber();
       });
       
       it('should validate route adherence', async () => {
         // Test route validation logic
       });
       
       it('should predict arrival times accurately', async () => {
         // Test prediction algorithm
       });
     });
   });
   ```

**Acceptance Criteria**:
- ✅ Transport interface supports extensibility for new transport types
- ✅ Bus transport provider fully functional
- ✅ Existing ride-sharing functionality unaffected
- ✅ 90%+ test coverage for new code
- ✅ API endpoints handle errors gracefully
- ✅ Performance benchmarks meet requirements

---

### 🔴 CRITICAL-003: Frontend Transport Context
**Priority**: CRITICAL  
**Estimate**: 6 days  
**Owner**: Frontend Developer  
**Dependencies**: CRITICAL-002  
**Blocks**: All frontend transport features

#### Detailed Subtasks

1. **Create TransportContext with React Context API** (1.5 days)
   ```javascript
   // contexts/TransportContext.js
   import { createContext, useContext, useReducer, useEffect } from 'react';
   
   const TransportContext = createContext();
   
   const transportReducer = (state, action) => {
     switch (action.type) {
       case 'SET_TRANSPORT_TYPE':
         return { ...state, currentType: action.payload };
       case 'SET_AVAILABLE_ROUTES':
         return { ...state, availableRoutes: action.payload };
       case 'SET_SELECTED_ROUTE':
         return { ...state, selectedRoute: action.payload };
       case 'SET_TRACKING_SESSION':
         return { ...state, trackingSession: action.payload };
       case 'UPDATE_LIVE_LOCATION':
         return { 
           ...state, 
           liveTracking: { ...state.liveTracking, ...action.payload }
         };
       default:
         return state;
     }
   };
   
   export const TransportProvider = ({ children }) => {
     const [state, dispatch] = useReducer(transportReducer, {
       currentType: null,
       availableRoutes: [],
       selectedRoute: null,
       trackingSession: null,
       liveTracking: { isActive: false, location: null }
     });
     
     const setTransportType = (type) => {
       dispatch({ type: 'SET_TRANSPORT_TYPE', payload: type });
     };
     
     const startTracking = async (routeId) => {
       try {
         const response = await fetch('/api/transport/start-tracking', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             transportType: state.currentType, 
             routeId 
           })
         });
         const session = await response.json();
         dispatch({ type: 'SET_TRACKING_SESSION', payload: session });
       } catch (error) {
         console.error('Failed to start tracking:', error);
       }
     };
     
     return (
       <TransportContext.Provider value={{
         ...state,
         setTransportType,
         startTracking,
         dispatch
       }}>
         {children}
       </TransportContext.Provider>
     );
   };
   
   export const useTransport = () => {
     const context = useContext(TransportContext);
     if (!context) {
       throw new Error('useTransport must be used within TransportProvider');
     }
     return context;
   };
   ```

2. **Update App.jsx for Transport Mode Selection** (1 day)
   ```javascript
   // App.jsx modifications
   import { TransportProvider } from './contexts/TransportContext';
   
   function App() {
     return (
       <div className="app">
         <TransportProvider>
           <Header 
             user={user}
             currentView={currentView}
             onNavigate={setCurrentView}
             onLogout={handleLogout}
           />
           
           {/* Existing render logic enhanced */}
           {renderCurrentView()}
         </TransportProvider>
       </div>
     );
   }
   
   const renderCurrentView = () => {
     // Enhanced view rendering with transport context
     switch (currentView) {
       case 'transport-dashboard':
         return <TransportDashboard />;
       case 'bus-tracker':
         return <BusTracker />;
       default:
         return renderExistingViews();
     }
   };
   ```

3. **Extend Header.jsx with Transport Switcher** (1.5 days)
   ```javascript
   // components/Header.jsx modifications
   import { useTransport } from '../contexts/TransportContext';
   
   function Header({ user, currentView, onNavigate, onLogout }) {
     const { currentType, setTransportType } = useTransport();
     const [showTransportMenu, setShowTransportMenu] = useState(false);
     
     const transportTypes = [
       { id: 'rideshare', name: 'Ride Share', icon: '🚗' },
       { id: 'bus', name: 'Bus', icon: '🚌' },
       { id: 'train', name: 'Train', icon: '🚊' },
       { id: 'auto', name: 'Auto', icon: '🛺' }
     ];
     
     return (
       <header className="header">
         <div className="header-container">
           {/* Existing brand section */}
           <div className="app-brand">
             <CarIcon size={28} color="#e91e63" />
             <span className="app-name">TransitTracker</span>
           </div>
           
           {/* New transport mode selector */}
           <div className="transport-selector">
             <button 
               className="transport-toggle"
               onClick={() => setShowTransportMenu(!showTransportMenu)}
             >
               <span className="transport-icon">
                 {transportTypes.find(t => t.id === currentType)?.icon || '🚗'}
               </span>
               <span className="transport-name">
                 {transportTypes.find(t => t.id === currentType)?.name || 'Select'}
               </span>
             </button>
             
             {showTransportMenu && (
               <div className="transport-dropdown">
                 {transportTypes.map(type => (
                   <button
                     key={type.id}
                     className={`transport-option ${currentType === type.id ? 'active' : ''}`}
                     onClick={() => {
                       setTransportType(type.id);
                       setShowTransportMenu(false);
                     }}
                   >
                     <span className="option-icon">{type.icon}</span>
                     <span className="option-name">{type.name}</span>
                   </button>
                 ))}
               </div>
             )}
           </div>
           
           {/* Existing user menu */}
           <div className="user-menu">
             {/* Existing user menu implementation */}
           </div>
         </div>
       </header>
     );
   }
   ```

4. **Update Existing Components for Multi-Transport** (1.5 days)
   ```javascript
   // components/ActiveRides.jsx modifications
   import { useTransport } from '../contexts/TransportContext';
   
   function ActiveRides({ user }) {
     const { currentType } = useTransport();
     const [activeItems, setActiveItems] = useState([]);
     
     // Modified fetch function for multi-transport
     const fetchActiveData = async () => {
       const endpoint = currentType === 'rideshare' 
         ? `/api/users/${user.id}/history`
         : `/api/transport/${currentType}/active/${user.id}`;
         
       const response = await fetch(endpoint);
       const data = await response.json();
       setActiveItems(data);
     };
     
     // Enhanced rendering for different transport types
     const renderTransportItem = (item) => {
       switch (currentType) {
         case 'bus':
           return <BusActiveItem item={item} />;
         case 'rideshare':
           return <RideActiveItem item={item} />;
         default:
           return <GenericTransportItem item={item} />;
       }
     };
     
     return (
       <div className="active-rides">
         {/* Enhanced UI with transport-specific rendering */}
       </div>
     );
   }
   ```

5. **Add Transport-Specific Routing** (0.5 days)
   ```javascript
   // utils/routing.js
   export const getRoutesForTransportType = (transportType) => {
     const routeMap = {
       rideshare: [
         { path: '/rideshare/offer', component: 'RiderFlow' },
         { path: '/rideshare/request', component: 'PassengerFlow' }
       ],
       bus: [
         { path: '/bus/track', component: 'BusTracker' },
         { path: '/bus/routes', component: 'RouteSelector' }
       ],
       train: [
         { path: '/train/track', component: 'TrainTracker' }
       ]
     };
     
     return routeMap[transportType] || [];
   };
   ```

**Acceptance Criteria**:
- ✅ Seamless switching between transport types
- ✅ Existing ride-sharing functionality preserved
- ✅ Mobile-responsive design maintained  
- ✅ Context updates trigger proper re-renders
- ✅ Transport state persisted across page refreshes
- ✅ Error handling for transport switching

---

## PHASE 2: BUS TRACKING MVP (Months 2-4)

### 🟠 HIGH-001: Bus Route Database Setup
**Priority**: HIGH  
**Estimate**: 10 days  
**Owner**: Data Engineer + Backend Developer  
**Dependencies**: CRITICAL-001  
**Blocks**: HIGH-002, HIGH-003

#### Detailed Subtasks

1. **Research Hyderabad Bus Routes (TSRTC)** (2 days)
   ```javascript
   // Research methodology and data collection
   const routeResearchPlan = {
     sources: [
       'TSRTC official website',
       'Google Maps public transport data',
       'Crowdsourced route information',
       'Mobile apps like Chalo, RedBus'
     ],
     targetRoutes: [
       'Major IT corridor routes (HITEC City, Gachibowli)',
       'Airport connectivity routes',
       'Metro feeder routes',
       'University routes (Hyderabad University, BITS)'
     ],
     dataPoints: [
       'Route number and name',
       'Start and end terminals',
       'All intermediate stops with GPS coordinates',
       'Operating hours and frequency',
       'Route path (sequence of roads)'
     ]
   };
   ```

2. **Create Route Data Entry/Import System** (3 days)
   ```javascript
   // admin/RouteDataManager.js
   class RouteDataManager {
     async importFromGoogleMaps(routeNumber) {
       // Use Google Maps API to get route data
       const transitData = await googleMapsClient.getTransitRoute({
         route: routeNumber,
         region: 'Hyderabad'
       });
       
       return this.processGoogleMapsData(transitData);
     }
     
     async importFromCSV(csvData) {
       // CSV format: route_number,stop_name,latitude,longitude,stop_order
       const routes = {};
       
       csvData.forEach(row => {
         if (!routes[row.route_number]) {
           routes[row.route_number] = {
             route_number: row.route_number,
             stops: []
           };
         }
         
         routes[row.route_number].stops.push({
           name: row.stop_name,
           latitude: parseFloat(row.latitude),
           longitude: parseFloat(row.longitude),
           order: parseInt(row.stop_order)
         });
       });
       
       return routes;
     }
     
     async validateRouteData(routeData) {
       // Validate GPS coordinates
       // Check stop sequence makes geographic sense
       // Verify route connectivity
       
       const validationResults = {
         isValid: true,
         errors: [],
         warnings: []
       };
       
       // GPS coordinate validation
       routeData.stops.forEach(stop => {
         if (!this.isValidCoordinate(stop.latitude, stop.longitude)) {
           validationResults.errors.push(`Invalid coordinates for stop: ${stop.name}`);
           validationResults.isValid = false;
         }
       });
       
       // Route sequence validation
       const distances = this.calculateStopDistances(routeData.stops);
       if (distances.some(d => d > 5000)) { // 5km max between stops
         validationResults.warnings.push('Large gaps between some stops detected');
       }
       
       return validationResults;
     }
   }
   ```

3. **Map Bus Stops with GPS Coordinates** (3 days)
   ```javascript
   // services/geocoding/StopGeocoder.js
   class StopGeocoder {
     async geocodeStopName(stopName, routeContext) {
       const searches = [
         `${stopName} bus stop Hyderabad`,
         `${stopName} ${routeContext.nearbyLandmark} Hyderabad`,
         `${stopName} stop`
       ];
       
       for (const search of searches) {
         const result = await this.searchLocation(search);
         if (result.confidence > 0.8) {
           return result;
         }
       }
       
       // Fallback to manual coordinate entry
       return await this.requestManualGeocode(stopName);
     }
     
     async verifyStopLocation(stop, route) {
       // Check if stop is on or near the route path
       const routePath = await this.getRoutePath(route);
       const distanceFromRoute = this.calculateDistanceFromPath(
         stop.coordinates, 
         routePath
       );
       
       return {
         isValid: distanceFromRoute < 200, // 200m tolerance
         distanceFromRoute,
         suggestedCorrection: distanceFromRoute > 200 
           ? this.findNearestPointOnRoute(stop.coordinates, routePath)
           : null
       };
     }
   }
   ```

4. **Create Route Search and Filtering** (1.5 days)
   ```javascript
   // API endpoints for route search
   router.get('/api/routes/search', async (req, res) => {
     const { query, lat, lng, radius } = req.query;
     
     let searchResults = [];
     
     if (query) {
       // Text-based search
       searchResults = await db('transport_routes')
         .where('route_name', 'like', `%${query}%`)
         .orWhere('route_number', 'like', `%${query}%`)
         .orWhereExists(function() {
           this.select('*')
             .from('transport_stops')
             .where('transport_stops.route_id', 'transport_routes.id')
             .where('stop_name', 'like', `%${query}%`);
         });
     }
     
     if (lat && lng && radius) {
       // Location-based search
       const nearbyRoutes = await db.raw(`
         SELECT DISTINCT tr.* FROM transport_routes tr
         JOIN transport_stops ts ON ts.route_id = tr.id
         WHERE ST_DWithin(
           ST_Point(ts.longitude, ts.latitude),
           ST_Point(?, ?),
           ?
         )
       `, [lng, lat, radius]);
       
       searchResults = [...searchResults, ...nearbyRoutes.rows];
     }
     
     res.json(searchResults);
   });
   ```

5. **Build Admin Interface for Route Management** (0.5 days)
   ```javascript
   // admin/components/RouteManager.jsx
   function RouteManager() {
     const [routes, setRoutes] = useState([]);
     const [editingRoute, setEditingRoute] = useState(null);
     
     return (
       <div className="route-manager">
         <div className="route-controls">
           <button onClick={() => setEditingRoute({})}>
             Add New Route
           </button>
           <input 
             type="file" 
             accept=".csv"
             onChange={handleCSVImport}
             placeholder="Import from CSV"
           />
         </div>
         
         <div className="route-list">
           {routes.map(route => (
             <RouteCard 
               key={route.id}
               route={route}
               onEdit={setEditingRoute}
               onDelete={handleDeleteRoute}
             />
           ))}
         </div>
         
         {editingRoute && (
           <RouteEditor 
             route={editingRoute}
             onSave={handleSaveRoute}
             onCancel={() => setEditingRoute(null)}
           />
         )}
       </div>
     );
   }
   ```

**Acceptance Criteria**:
- ✅ 50+ major Hyderabad bus routes accurately mapped
- ✅ All routes have proper stop sequences with GPS coordinates
- ✅ Route search functionality works efficiently (<500ms response)
- ✅ Admin interface allows easy route management
- ✅ Data validation ensures route quality
- ✅ CSV import/export functionality working

---

### 🟠 HIGH-002: Live GPS Tracking System
**Priority**: HIGH  
**Estimate**: 12 days  
**Owner**: Full-stack Developer  
**Dependencies**: CRITICAL-002, HIGH-001  
**Blocks**: HIGH-003, MEDIUM-001

#### Detailed Subtasks

1. **Extend Existing GPS Tracking for Bus Mode** (3 days)
   ```javascript
   // services/tracking/BusGPSTracker.js
   class BusGPSTracker extends BaseGPSTracker {
     constructor(config) {
       super(config);
       this.updateInterval = 10000; // 10 seconds for buses
       this.accuracyThreshold = 50; // 50 meters
       this.routeDeviationLimit = 200; // 200 meters from route
     }
     
     async startTracking(userId, routeId, busNumber) {
       // Validate user permissions for this route
       const hasPermission = await this.validateTrackingPermission(userId, routeId);
       if (!hasPermission) {
         throw new Error('User not authorized to track this route');
       }
       
       // Initialize tracking session
       const trackingSession = await db('live_tracking').insert({
         user_id: userId,
         route_id: routeId,
         bus_number: busNumber,
         tracking_start_time: new Date(),
         is_active: true,
         tracking_method: 'gps'
       });
       
       // Start GPS monitoring
       this.startGPSMonitoring(trackingSession.id);
       
       return trackingSession;
     }
     
     async processLocationUpdate(trackingId, location) {
       const session = await this.getTrackingSession(trackingId);
       
       // Validate location accuracy
       if (location.accuracy > this.accuracyThreshold) {
         console.warn(`Low GPS accuracy: ${location.accuracy}m`);
         return false;
       }
       
       // Check route adherence
       const routeAdherence = await this.validateRouteAdherence(
         location, 
         session.route_id
       );
       
       if (!routeAdherence.isValid) {
         // Handle route deviation
         await this.handleRouteDeviation(trackingId, location, routeAdherence);
       }
       
       // Update location in database
       await this.updateTrackingLocation(trackingId, location, routeAdherence);
       
       // Trigger prediction updates
       await this.updateArrivalPredictions(session.route_id, location);
       
       return true;
     }
     
     async validateRouteAdherence(location, routeId) {
       const route = await this.getRouteGeometry(routeId);
       const distanceFromRoute = this.calculateDistanceFromRoute(location, route);
       
       return {
         isValid: distanceFromRoute <= this.routeDeviationLimit,
         distanceFromRoute,
         nearestPointOnRoute: this.findNearestPointOnRoute(location, route)
       };
     }
   }
   ```

2. **Implement Background Location Updates** (2.5 days)
   ```javascript
   // frontend/services/BackgroundLocationService.js
   class BackgroundLocationService {
     constructor() {
       this.watchId = null;
       this.isTracking = false;
       this.updateQueue = [];
       this.offlineSupport = true;
     }
     
     async startBackgroundTracking(trackingSessionId) {
       if (!navigator.geolocation) {
         throw new Error('Geolocation not supported');
       }
       
       const options = {
         enableHighAccuracy: true,
         timeout: 10000,
         maximumAge: 5000
       };
       
       this.watchId = navigator.geolocation.watchPosition(
         (position) => this.handleLocationUpdate(trackingSessionId, position),
         (error) => this.handleLocationError(error),
         options
       );
       
       this.isTracking = true;
       
       // Set up periodic sync with server
       this.syncInterval = setInterval(() => {
         this.syncWithServer(trackingSessionId);
       }, 30000); // Sync every 30 seconds
     }
     
     async handleLocationUpdate(trackingSessionId, position) {
       const locationData = {
         latitude: position.coords.latitude,
         longitude: position.coords.longitude,
         accuracy: position.coords.accuracy,
         speed: position.coords.speed,
         heading: position.coords.heading,
         timestamp: new Date(position.timestamp)
       };
       
       // Add to update queue
       this.updateQueue.push({
         trackingSessionId,
         location: locationData,
         timestamp: Date.now()
       });
       
       // Try immediate sync if online
       if (navigator.onLine) {
         await this.syncWithServer(trackingSessionId);
       } else {
         // Store for offline sync
         this.storeOfflineUpdate(trackingSessionId, locationData);
       }
     }
     
     async syncWithServer(trackingSessionId) {
       if (this.updateQueue.length === 0) return;
       
       const updates = [...this.updateQueue];
       this.updateQueue = [];
       
       try {
         await fetch(`/api/tracking/batch-update/${trackingSessionId}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ updates })
         });
       } catch (error) {
         // Re-queue failed updates
         this.updateQueue.unshift(...updates);
         console.error('Failed to sync location updates:', error);
       }
     }
     
     stopBackgroundTracking() {
       if (this.watchId) {
         navigator.geolocation.clearWatch(this.watchId);
         this.watchId = null;
       }
       
       if (this.syncInterval) {
         clearInterval(this.syncInterval);
         this.syncInterval = null;
       }
       
       this.isTracking = false;
     }
   }
   ```

3. **Add Route Validation Logic** (2 days)
   ```javascript
   // services/validation/RouteValidator.js
   class RouteValidator {
     async validateUserOnRoute(userId, routeId, currentLocation) {
       // Get the route geometry
       const route = await this.getRouteWithStops(routeId);
       
       // Check if user is near any stop on the route
       const nearestStop = this.findNearestStop(currentLocation, route.stops);
       
       if (nearestStop.distance > 500) { // 500m threshold
         return {
           isValid: false,
           reason: 'Too far from any route stops',
           suggestedAction: 'Move closer to a bus stop on this route'
         };
       }
       
       // Check if user is moving in the right direction
       const userHistory = await this.getUserLocationHistory(userId, 10); // Last 10 locations
       if (userHistory.length >= 3) {
         const movementDirection = this.calculateMovementDirection(userHistory);
         const routeDirection = this.getRouteDirection(route, nearestStop.stop);
         
         const directionDifference = this.calculateDirectionDifference(
           movementDirection, 
           routeDirection
         );
         
         if (directionDifference > 90) { // More than 90 degrees off
           return {
             isValid: false,
             reason: 'Moving in wrong direction for this route',
             suggestedAction: 'Ensure you are on the correct bus'
           };
         }
       }
       
       return {
         isValid: true,
         nearestStop: nearestStop.stop,
         confidence: this.calculateConfidence(nearestStop.distance, directionDifference)
       };
     }
   }
   ```

4. **Create Live Tracking Visualization** (2.5 days)
   ```javascript
   // components/LiveTrackingMap.jsx
   import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
   
   function LiveTrackingMap({ routeId, userLocation, otherTrackers }) {
     const [route, setRoute] = useState(null);
     const [predictions, setPredictions] = useState([]);
     
     useEffect(() => {
       // Load route data and stops
       loadRouteData(routeId);
       
       // Set up real-time updates for other trackers
       const eventSource = new EventSource(`/api/tracking/live-stream/${routeId}`);
       eventSource.onmessage = (event) => {
         const update = JSON.parse(event.data);
         updateTrackerLocation(update.trackerId, update.location);
       };
       
       return () => eventSource.close();
     }, [routeId]);
     
     const renderRouteStops = () => {
       if (!route?.stops) return null;
       
       return route.stops.map(stop => (
         <Marker 
           key={stop.id}
           position={[stop.latitude, stop.longitude]}
           icon={getBusStopIcon()}
         >
           <Popup>
             <div className="stop-popup">
               <h4>{stop.name}</h4>
               <div className="predictions">
                 {getPredictionsForStop(stop.id).map(prediction => (
                   <div key={prediction.id} className="prediction">
                     <span className="bus-number">{prediction.busNumber}</span>
                     <span className="arrival-time">{prediction.eta} min</span>
                     <span className="confidence">±{prediction.confidence}min</span>
                   </div>
                 ))}
               </div>
             </div>
           </Popup>
         </Marker>
       ));
     };
     
     const renderActiveTrackers = () => {
       return otherTrackers.map(tracker => (
         <Marker
           key={tracker.id}
           position={[tracker.latitude, tracker.longitude]}
           icon={getBusIcon(tracker.busNumber)}
         >
           <Popup>
             <div className="tracker-popup">
               <h4>Bus {tracker.busNumber}</h4>
               <p>Speed: {tracker.speed} km/h</p>
               <p>Last update: {tracker.lastUpdate}</p>
               <p>Tracker: {tracker.username} (Score: {tracker.socialScore})</p>
             </div>
           </Popup>
         </Marker>
       ));
     };
     
     return (
       <MapContainer 
         center={[17.3850, 78.4867]} // Hyderabad center
         zoom={13}
         className="live-tracking-map"
       >
         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
         
         {/* Route path */}
         {route?.path && (
           <Polyline 
             positions={route.path}
             color="#2196F3"
             weight={4}
             opacity={0.7}
           />
         )}
         
         {/* Bus stops */}
         {renderRouteStops()}
         
         {/* Active trackers (buses) */}
         {renderActiveTrackers()}
         
         {/* User location */}
         {userLocation && (
           <Marker
             position={[userLocation.latitude, userLocation.longitude]}
             icon={getUserLocationIcon()}
           >
             <Popup>You are here</Popup>
           </Marker>
         )}
       </MapContainer>
     );
   }
   ```

5. **Implement Tracking Session Management** (1.5 days)
   ```javascript
   // services/TrackingSessionManager.js
   class TrackingSessionManager {
     async createSession(userId, routeId, busNumber) {
       // Check for existing active sessions
       const existingSession = await db('live_tracking')
         .where({ user_id: userId, is_active: true })
         .first();
         
       if (existingSession) {
         throw new Error('User already has an active tracking session');
       }
       
       // Validate route exists and is active
       const route = await db('transport_routes')
         .where({ id: routeId, is_active: true })
         .first();
         
       if (!route) {
         throw new Error('Invalid or inactive route');
       }
       
       // Create new session
       const session = await db('live_tracking').insert({
         user_id: userId,
         route_id: routeId,
         bus_number: busNumber,
         tracking_start_time: new Date(),
         is_active: true,
         session_token: generateSessionToken()
       });
       
       // Log session start for analytics
       await this.logTrackingEvent('session_started', {
         sessionId: session.id,
         userId,
         routeId,
         busNumber
       });
       
       return session;
     }
     
     async endSession(sessionId, reason = 'user_stopped') {
       const session = await db('live_tracking')
         .where({ id: sessionId })
         .first();
         
       if (!session) {
         throw new Error('Session not found');
       }
       
       // Calculate session statistics
       const stats = await this.calculateSessionStats(sessionId);
       
       // Update session record
       await db('live_tracking')
         .where({ id: sessionId })
         .update({
           is_active: false,
           tracking_end_time: new Date(),
           end_reason: reason,
           total_distance: stats.distance,
           total_duration: stats.duration,
           accuracy_score: stats.accuracy
         });
       
       // Update user's contribution statistics
       await this.updateUserContributionStats(session.user_id, stats);
       
       // Log session end
       await this.logTrackingEvent('session_ended', {
         sessionId,
         reason,
         stats
       });
       
       return stats;
     }
   }
   ```

6. **Add Offline Tracking Support** (0.5 days)
   ```javascript
   // utils/OfflineTrackingStorage.js
   class OfflineTrackingStorage {
     constructor() {
       this.dbName = 'TransitTrackerOffline';
       this.version = 1;
       this.db = null;
     }
     
     async init() {
       return new Promise((resolve, reject) => {
         const request = indexedDB.open(this.dbName, this.version);
         
         request.onerror = () => reject(request.error);
         request.onsuccess = () => {
           this.db = request.result;
           resolve();
         };
         
         request.onupgradeneeded = (event) => {
           const db = event.target.result;
           
           // Create offline tracking store
           const trackingStore = db.createObjectStore('offline_tracking', {
             keyPath: 'id',
             autoIncrement: true
           });
           
           trackingStore.createIndex('sessionId', 'sessionId', { unique: false });
           trackingStore.createIndex('timestamp', 'timestamp', { unique: false });
         };
       });
     }
     
     async storeLocationUpdate(sessionId, location) {
       const transaction = this.db.transaction(['offline_tracking'], 'readwrite');
       const store = transaction.objectStore('offline_tracking');
       
       await store.add({
         sessionId,
         location,
         timestamp: Date.now(),
         synced: false
       });
     }
     
     async getUnsyncedUpdates() {
       const transaction = this.db.transaction(['offline_tracking'], 'readonly');
       const store = transaction.objectStore('offline_tracking');
       const index = store.index('synced');
       
       return new Promise((resolve, reject) => {
         const request = index.getAll(false);
         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
       });
     }
   }
   ```

**Acceptance Criteria**:
- ✅ GPS updates every 10 seconds during active tracking
- ✅ Battery usage optimized (<5% per hour)
- ✅ Route validation works accurately
- ✅ Offline tracking with sync functionality
- ✅ Real-time visualization of multiple trackers
- ✅ Session management handles edge cases properly

---

### 🟠 HIGH-003: Basic Arrival Prediction
**Priority**: HIGH  
**Estimate**: 8 days  
**Owner**: Backend Developer + Data Scientist  
**Dependencies**: HIGH-002  
**Blocks**: MEDIUM-002

#### Detailed Subtasks

1. **Implement Distance-Based ETA Calculation** (2 days)
   ```javascript
   // services/prediction/BasicPredictor.js
   class BasicArrivalPredictor {
     constructor() {
       this.defaultSpeed = 25; // km/h average bus speed in Hyderabad
       this.trafficFactors = {
         peak_morning: 0.6,    // 60% of normal speed
         peak_evening: 0.65,   // 65% of normal speed
         off_peak: 0.85,       // 85% of normal speed
         night: 1.0            // 100% of normal speed
       };
     }
     
     async calculateBasicETA(routeId, stopId, currentTrackers) {
       const route = await this.getRouteData(routeId);
       const targetStop = route.stops.find(s => s.id === stopId);
       const currentTime = new Date();
       
       const predictions = [];
       
       for (const tracker of currentTrackers) {
         const prediction = await this.calculateTrackerETA(
           tracker, 
           targetStop, 
           route, 
           currentTime
         );
         
         if (prediction.isValid) {
           predictions.push(prediction);
         }
       }
       
       // Return the most reliable prediction
       return this.selectBestPrediction(predictions);
     }
     
     async calculateTrackerETA(tracker, targetStop, route, currentTime) {
       // Calculate distance from current position to target stop
       const distance = this.calculateRouteDistance(
         tracker.location,
         targetStop.location,
         route.path
       );
       
       // Apply traffic factor based on time of day
       const trafficFactor = this.getTrafficFactor(currentTime);
       const adjustedSpeed = this.defaultSpeed * trafficFactor;
       
       // Calculate base travel time
       const baseTravelTime = (distance / 1000) / adjustedSpeed; // hours
       const baseTravelTimeMinutes = baseTravelTime * 60;
       
       // Apply stop delay factor (average 1 minute per stop)
       const stopsRemaining = this.countStopsRemaining(
         tracker.location,
         targetStop,
         route
       );
       const stopDelay = stopsRemaining * 1; // 1 minute per stop
       
       // Calculate final ETA
       const totalTravelTime = baseTravelTimeMinutes + stopDelay;
       const arrivalTime = new Date(currentTime.getTime() + totalTravelTime * 60000);
       
       return {
         isValid: distance > 0 && distance < 50000, // 50km max
         arrivalTime,
         confidence: this.calculateConfidence(distance, tracker.socialScore),
         tracker: tracker.id,
         distance,
         stopsRemaining,
         travelTimeMinutes: Math.round(totalTravelTime)
       };
     }
     
     calculateRouteDistance(startLocation, endLocation, routePath) {
       // Find position on route path for start location
       const startPoint = this.findNearestPointOnRoute(startLocation, routePath);
       const endPoint = this.findNearestPointOnRoute(endLocation, routePath);
       
       // Calculate distance along the route
       return this.calculatePathDistance(startPoint, endPoint, routePath);
     }
     
     getTrafficFactor(currentTime) {
       const hour = currentTime.getHours();
       
       if (hour >= 7 && hour <= 10) return this.trafficFactors.peak_morning;
       if (hour >= 17 && hour <= 20) return this.trafficFactors.peak_evening;
       if (hour >= 22 || hour <= 6) return this.trafficFactors.night;
       
       return this.trafficFactors.off_peak;
     }
     
     calculateConfidence(distance, socialScore) {
       // Base confidence decreases with distance
       let confidence = Math.max(0.3, 1 - (distance / 10000)); // 10km = 30% confidence
       
       // Adjust for tracker social score
       const socialScoreFactor = socialScore / 100; // Normalize to 0-1
       confidence = confidence * (0.5 + 0.5 * socialScoreFactor);
       
       return Math.round(confidence * 100);
     }
   }
   ```

2. **Add Historical Speed Data Analysis** (2.5 days)
   ```javascript
   // services/analytics/HistoricalSpeedAnalyzer.js
   class HistoricalSpeedAnalyzer {
     async analyzeRouteSegmentSpeeds(routeId, timeWindow = 30) {
       // Get historical tracking data for the last 30 days
       const historicalData = await db('live_tracking')
         .join('users', 'live_tracking.user_id', 'users.id')
         .where('live_tracking.route_id', routeId)
         .where('live_tracking.created_at', '>=', 
           new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000))
         .where('users.social_score', '>=', 60) // Only use reliable trackers
         .select([
           'live_tracking.*',
           'users.social_score'
         ]);
       
       // Group by route segments
       const segments = await this.segmentizeRoute(routeId);
       const segmentSpeeds = {};
       
       for (const segment of segments) {
         segmentSpeeds[segment.id] = await this.analyzeSegmentSpeed(
           segment,
           historicalData
         );
       }
       
       return segmentSpeeds;
     }
     
     async analyzeSegmentSpeed(segment, historicalData) {
       const segmentData = historicalData.filter(point => 
         this.isPointInSegment(point, segment)
       );
       
       if (segmentData.length < 10) {
         // Not enough data, use default
         return this.getDefaultSegmentSpeed(segment);
       }
       
       // Calculate speeds by time of day
       const speedsByHour = {};
       
       for (let hour = 0; hour < 24; hour++) {
         const hourData = segmentData.filter(point => 
           new Date(point.timestamp).getHours() === hour
         );
         
         if (hourData.length > 0) {
           const speeds = hourData.map(point => point.speed || this.calculateSpeed(point));
           speedsByHour[hour] = {
             average: this.calculateAverage(speeds),
             median: this.calculateMedian(speeds),
             percentile85: this.calculatePercentile(speeds, 85),
             sampleSize: speeds.length
           };
         }
       }
       
       return {
         segmentId: segment.id,
         speedsByHour,
         overallAverage: this.calculateOverallAverage(speedsByHour),
         reliability: this.calculateReliability(segmentData)
       };
     }
     
     async getSpeedForSegmentAndTime(segmentId, currentTime) {
       const hour = currentTime.getHours();
       const segmentSpeeds = await this.getSegmentSpeeds(segmentId);
       
       if (segmentSpeeds.speedsByHour[hour]) {
         return segmentSpeeds.speedsByHour[hour].median;
       }
       
       // Fallback to overall average
       return segmentSpeeds.overallAverage || 25; // 25 km/h default
     }
   }
   ```

3. **Create Prediction Confidence Scoring** (1.5 days)
   ```javascript
   // services/prediction/ConfidenceCalculator.js
   class PredictionConfidenceCalculator {
     calculatePredictionConfidence(prediction, contextData) {
       const factors = {
         trackerReliability: this.assessTrackerReliability(prediction.tracker),
         dataFreshness: this.assessDataFreshness(prediction.lastUpdate),
         distanceReliability: this.assessDistanceReliability(prediction.distance),
         historicalAccuracy: this.assessHistoricalAccuracy(prediction.routeId),
         trafficConditions: this.assessTrafficConditions(contextData.traffic),
         weatherConditions: this.assessWeatherConditions(contextData.weather)
       };
       
       // Weighted combination of factors
       const weights = {
         trackerReliability: 0.25,
         dataFreshness: 0.20,
         distanceReliability: 0.20,
         historicalAccuracy: 0.15,
         trafficConditions: 0.10,
         weatherConditions: 0.10
       };
       
       let totalConfidence = 0;
       for (const [factor, score] of Object.entries(factors)) {
         totalConfidence += score * weights[factor];
       }
       
       return {
         overall: Math.round(totalConfidence * 100),
         breakdown: factors,
         recommendation: this.getConfidenceRecommendation(totalConfidence)
       };
     }
     
     assessTrackerReliability(tracker) {
       const socialScore = tracker.socialScore || 50;
       const recentAccuracy = tracker.recentAccuracy || 0.7;
       const contributionCount = tracker.contributionCount || 0;
       
       // Combine multiple reliability factors
       const socialScoreFactor = socialScore / 100;
       const accuracyFactor = recentAccuracy;
       const experienceFactor = Math.min(1, contributionCount / 100);
       
       return (socialScoreFactor * 0.4) + 
              (accuracyFactor * 0.4) + 
              (experienceFactor * 0.2);
     }
     
     assessDataFreshness(lastUpdate) {
       const minutesSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60);
       
       if (minutesSinceUpdate <= 2) return 1.0;      // Perfect
       if (minutesSinceUpdate <= 5) return 0.8;      // Good
       if (minutesSinceUpdate <= 10) return 0.6;     // Fair
       if (minutesSinceUpdate <= 20) return 0.4;     // Poor
       return 0.2; // Very poor
     }
     
     getConfidenceRecommendation(confidence) {
       if (confidence >= 0.8) return 'High confidence - reliable prediction';
       if (confidence >= 0.6) return 'Medium confidence - good estimate';
       if (confidence >= 0.4) return 'Low confidence - approximate only';
       return 'Very low confidence - use with caution';
     }
   }
   ```

4. **Build Prediction Caching System** (1.5 days)
   ```javascript
   // services/caching/PredictionCache.js
   class PredictionCache {
     constructor() {
       this.cache = new Map();
       this.cacheTimeout = 60000; // 1 minute cache
     }
     
     generateCacheKey(routeId, stopId) {
       return `prediction_${routeId}_${stopId}`;
     }
     
     async getCachedPrediction(routeId, stopId) {
       const key = this.generateCacheKey(routeId, stopId);
       const cached = this.cache.get(key);
       
       if (!cached) return null;
       
       const age = Date.now() - cached.timestamp;
       if (age > this.cacheTimeout) {
         this.cache.delete(key);
         return null;
       }
       
       // Adjust prediction for time passed
       const adjustedPrediction = this.adjustPredictionForTime(cached.prediction, age);
       return adjustedPrediction;
     }
     
     cachePrediction(routeId, stopId, prediction) {
       const key = this.generateCacheKey(routeId, stopId);
       this.cache.set(key, {
         prediction,
         timestamp: Date.now()
       });
       
       // Clean up old cache entries periodically
       this.cleanupOldEntries();
     }
     
     adjustPredictionForTime(prediction, timePassed) {
       const adjustedPrediction = { ...prediction };
       const minutesPassed = timePassed / (1000 * 60);
       
       // Reduce ETA by time passed
       adjustedPrediction.eta = Math.max(0, prediction.eta - minutesPassed);
       
       // Slightly reduce confidence as prediction ages
       const confidenceDecay = Math.min(0.2, minutesPassed * 0.02);
       adjustedPrediction.confidence = Math.max(20, prediction.confidence - confidenceDecay * 100);
       
       return adjustedPrediction;
     }
   }
   ```

5. **Add Prediction API Endpoints** (0.5 days)
   ```javascript
   // routes/predictions.js
   router.get('/api/predictions/route/:routeId/stop/:stopId', async (req, res) => {
     const { routeId, stopId } = req.params;
     
     try {
       // Check cache first
       const cached = await predictionCache.getCachedPrediction(routeId, stopId);
       if (cached) {
         return res.json({
           ...cached,
           source: 'cached'
         });
       }
       
       // Get active trackers on route
       const activeTrackers = await trackingService.getActiveTrackersOnRoute(routeId);
       
       if (activeTrackers.length === 0) {
         return res.json({
           error: 'No active trackers on this route',
           eta: null,
           confidence: 0
         });
       }
       
       // Generate prediction
       const prediction = await basicPredictor.calculateBasicETA(
         routeId, 
         stopId, 
         activeTrackers
       );
       
       // Calculate confidence
       const confidence = await confidenceCalculator.calculatePredictionConfidence(
         prediction,
         { traffic: 'normal', weather: 'clear' } // TODO: Get real data
       );
       
       const result = {
         eta: prediction.travelTimeMinutes,
         arrivalTime: prediction.arrivalTime,
         confidence: confidence.overall,
         trackerCount: activeTrackers.length,
         source: 'realtime'
       };
       
       // Cache the result
       predictionCache.cachePrediction(routeId, stopId, result);
       
       res.json(result);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

**Acceptance Criteria**:
- ✅ Predictions within 5 minutes accuracy (baseline goal)
- ✅ Predictions update in real-time as trackers move
- ✅ Confidence scores properly calculated and meaningful
- ✅ Prediction caching improves response times
- ✅ API handles edge cases (no trackers, invalid routes)
- ✅ Historical data used to improve accuracy over time

---

---

## PHASE 3: SOCIAL CREDIBILITY SYSTEM (Months 3-5)
*Goal: Implement community trust and verification*

### 🟠 HIGH-004: Social Score Algorithm Implementation
**Priority**: HIGH  
**Estimate**: 7 days  
**Owner**: Backend Developer + Data Scientist  
**Dependencies**: HIGH-003  
**Blocks**: HIGH-005, HIGH-006

#### Detailed Subtasks

1. **Design Social Scoring Algorithm** (2 days)
   ```javascript
   // services/social/SocialScoreCalculator.js
   class SocialScoreCalculator {
     constructor() {
       this.weights = {
         accuracy: 0.4,      // 40% - How accurate are their predictions
         consistency: 0.2,   // 20% - Regular contributions
         community: 0.3,     // 30% - Peer validations
         experience: 0.1     // 10% - Time and contributions
       };
       
       this.decayFactor = 0.95; // Weekly decay for inactive users
       this.maxScore = 100;
       this.minScore = 0;
     }
     
     async calculateUserScore(userId) {
       const metrics = await this.gatherUserMetrics(userId);
       
       const accuracyScore = await this.calculateAccuracyScore(userId, metrics);
       const consistencyScore = await this.calculateConsistencyScore(userId, metrics);
       const communityScore = await this.calculateCommunityScore(userId, metrics);
       const experienceScore = await this.calculateExperienceScore(userId, metrics);
       
       const rawScore = (
         accuracyScore * this.weights.accuracy +
         consistencyScore * this.weights.consistency +
         communityScore * this.weights.community +
         experienceScore * this.weights.experience
       );
       
       // Apply decay for inactivity
       const finalScore = this.applyInactivityDecay(rawScore, metrics.lastActivity);
       
       return {
         total: Math.round(Math.max(this.minScore, Math.min(this.maxScore, finalScore))),
         breakdown: {
           accuracy: Math.round(accuracyScore),
           consistency: Math.round(consistencyScore),
           community: Math.round(communityScore),
           experience: Math.round(experienceScore)
         },
         level: this.getScoreLevel(finalScore),
         nextLevelProgress: this.calculateLevelProgress(finalScore)
       };
     }
     
     async calculateAccuracyScore(userId, metrics) {
       if (metrics.totalPredictions === 0) return 50; // Neutral start
       
       // Recent accuracy weighted more heavily
       const recentAccuracy = await this.getRecentAccuracy(userId, 30); // Last 30 days
       const overallAccuracy = metrics.correctPredictions / metrics.totalPredictions;
       
       // Weight recent performance more (70% recent, 30% overall)
       const weightedAccuracy = (recentAccuracy * 0.7) + (overallAccuracy * 0.3);
       
       // Convert to 0-100 scale with bonus for high accuracy
       let score = weightedAccuracy * 100;
       
       // Bonus for consistently high accuracy
       if (weightedAccuracy > 0.9 && metrics.totalPredictions > 50) {
         score += 10; // Bonus points
       }
       
       return Math.min(100, score);
     }
     
     async calculateConsistencyScore(userId, metrics) {
       const daysActive = metrics.activeDays || 0;
       const streakDays = await this.getCurrentStreak(userId);
       const avgContributionsPerDay = metrics.totalContributions / Math.max(1, daysActive);
       
       // Base score from activity frequency
       let score = Math.min(50, daysActive * 2); // Up to 50 points for 25+ active days
       
       // Streak bonus (up to 30 points)
       score += Math.min(30, streakDays * 2);
       
       // Daily contribution consistency (up to 20 points)
       score += Math.min(20, avgContributionsPerDay * 10);
       
       return Math.min(100, score);
     }
     
     async calculateCommunityScore(userId, metrics) {
       const positiveVerifications = metrics.positiveVerifications || 0;
       const negativeVerifications = metrics.negativeVerifications || 0;
       const totalVerifications = positiveVerifications + negativeVerifications;
       
       if (totalVerifications === 0) return 50; // Neutral start
       
       const verificationRatio = positiveVerifications / totalVerifications;
       let score = verificationRatio * 100;
       
       // Penalty for having many negative verifications
       if (negativeVerifications > 10) {
         score -= Math.min(20, negativeVerifications - 10);
       }
       
       // Bonus for helping verify others' contributions
       const verificationsGiven = await this.getVerificationsGiven(userId);
       score += Math.min(15, verificationsGiven * 0.5);
       
       return Math.max(0, Math.min(100, score));
     }
     
     getScoreLevel(score) {
       if (score >= 85) return { name: 'Diamond', icon: '💎', color: '#b9f2ff' };
       if (score >= 65) return { name: 'Gold', icon: '🥇', color: '#ffd700' };
       if (score >= 35) return { name: 'Silver', icon: '🥈', color: '#c0c0c0' };
       return { name: 'Bronze', icon: '🥉', color: '#cd7f32' };
     }
   }
   ```

2. **Implement Accuracy Calculation System** (2 days)
   ```javascript
   // services/social/AccuracyTracker.js
   class AccuracyTracker {
     async recordPredictionAccuracy(predictionId, actualArrivalTime) {
       const prediction = await db('arrival_predictions')
         .where('id', predictionId)
         .first();
         
       if (!prediction) {
         throw new Error('Prediction not found');
       }
       
       const predictedTime = new Date(prediction.predicted_arrival_time);
       const actualTime = new Date(actualArrivalTime);
       const accuracyMinutes = Math.abs(predictedTime - actualTime) / (1000 * 60);
       
       // Calculate accuracy percentage
       let accuracyPercentage;
       if (accuracyMinutes <= 1) accuracyPercentage = 100;
       else if (accuracyMinutes <= 2) accuracyPercentage = 90;
       else if (accuracyMinutes <= 3) accuracyPercentage = 80;
       else if (accuracyMinutes <= 5) accuracyPercentage = 70;
       else if (accuracyMinutes <= 10) accuracyPercentage = 50;
       else accuracyPercentage = Math.max(0, 50 - (accuracyMinutes - 10) * 2);
       
       // Update prediction record
       await db('arrival_predictions')
         .where('id', predictionId)
         .update({
           actual_arrival_time: actualTime,
           accuracy_percentage: accuracyPercentage,
           accuracy_minutes: accuracyMinutes,
           verified_at: new Date()
         });
       
       // Update user's accuracy statistics
       await this.updateUserAccuracyStats(prediction.tracker_user_id, accuracyPercentage);
       
       return {
         accuracyPercentage,
         accuracyMinutes,
         category: this.getAccuracyCategory(accuracyMinutes)
       };
     }
     
     async updateUserAccuracyStats(userId, newAccuracy) {
       const stats = await db('user_social_scores')
         .where('user_id', userId)
         .first();
         
       if (!stats) {
         // Create initial stats
         await db('user_social_scores').insert({
           user_id: userId,
           accuracy_score: newAccuracy,
           contribution_count: 1,
           total_accuracy_points: newAccuracy,
           last_updated: new Date()
         });
       } else {
         // Update rolling average
         const totalPoints = stats.total_accuracy_points + newAccuracy;
         const count = stats.contribution_count + 1;
         const newAverageAccuracy = totalPoints / count;
         
         await db('user_social_scores')
           .where('user_id', userId)
           .update({
             accuracy_score: newAverageAccuracy,
             contribution_count: count,
             total_accuracy_points: totalPoints,
             last_updated: new Date()
           });
       }
     }
     
     getAccuracyCategory(minutes) {
       if (minutes <= 1) return 'Excellent';
       if (minutes <= 2) return 'Very Good';
       if (minutes <= 3) return 'Good';
       if (minutes <= 5) return 'Fair';
       return 'Poor';
     }
   }
   ```

3. **Create Consistency and Reliability Metrics** (1.5 days)
   ```javascript
   // services/social/ConsistencyTracker.js
   class ConsistencyTracker {
     async calculateUserConsistency(userId, days = 30) {
       const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
       
       // Get user's tracking sessions in the period
       const sessions = await db('live_tracking')
         .where('user_id', userId)
         .where('tracking_start_time', '>=', cutoffDate)
         .orderBy('tracking_start_time');
       
       if (sessions.length === 0) {
         return {
           score: 0,
           activeDays: 0,
           currentStreak: 0,
           avgSessionsPerDay: 0
         };
       }
       
       // Calculate active days
       const activeDays = new Set(
         sessions.map(s => s.tracking_start_time.toDateString())
       ).size;
       
       // Calculate current streak
       const currentStreak = await this.calculateCurrentStreak(userId);
       
       // Calculate average sessions per active day
       const avgSessionsPerDay = sessions.length / activeDays;
       
       // Calculate consistency score
       const dayConsistencyScore = Math.min(100, (activeDays / days) * 100);
       const streakBonus = Math.min(20, currentStreak * 2);
       const frequencyScore = Math.min(30, avgSessionsPerDay * 15);
       
       const totalScore = dayConsistencyScore + streakBonus + frequencyScore;
       
       return {
         score: Math.min(100, totalScore),
         activeDays,
         currentStreak,
         avgSessionsPerDay: Math.round(avgSessionsPerDay * 10) / 10,
         breakdown: {
           dayConsistency: dayConsistencyScore,
           streakBonus,
           frequencyScore
         }
       };
     }
     
     async calculateCurrentStreak(userId) {
       const today = new Date();
       let streakDays = 0;
       let currentDate = new Date(today);
       
       // Go backwards day by day
       while (streakDays < 365) { // Max 365 day streak
         const dayStart = new Date(currentDate);
         dayStart.setHours(0, 0, 0, 0);
         
         const dayEnd = new Date(currentDate);
         dayEnd.setHours(23, 59, 59, 999);
         
         const hasActivity = await db('live_tracking')
           .where('user_id', userId)
           .where('tracking_start_time', '>=', dayStart)
           .where('tracking_start_time', '<=', dayEnd)
           .first();
         
         if (!hasActivity) {
           break; // Streak broken
         }
         
         streakDays++;
         currentDate.setDate(currentDate.getDate() - 1);
       }
       
       return streakDays;
     }
   }
   ```

4. **Build Community Trust Calculations** (1 day)
   ```javascript
   // services/social/CommunityTrustCalculator.js
   class CommunityTrustCalculator {
     async calculateCommunityTrust(userId) {
       // Get verifications received from other users
       const verificationsReceived = await db('community_verifications')
         .join('users', 'community_verifications.verifier_user_id', 'users.id')
         .where('community_verifications.tracker_user_id', userId)
         .select([
           'community_verifications.*',
           'users.social_score as verifier_score'
         ]);
       
       if (verificationsReceived.length === 0) {
         return {
           score: 50, // Neutral score for new users
           verificationCount: 0,
           weightedRating: 0
         };
       }
       
       // Calculate weighted average based on verifier's social score
       let totalWeightedRating = 0;
       let totalWeight = 0;
       
       verificationsReceived.forEach(verification => {
         const verifierWeight = (verification.verifier_score || 50) / 100;
         const rating = verification.accuracy_rating; // 1-5 scale
         
         totalWeightedRating += rating * verifierWeight;
         totalWeight += verifierWeight;
       });
       
       const weightedRating = totalWeight > 0 ? totalWeightedRating / totalWeight : 2.5;
       
       // Convert 1-5 rating to 0-100 score
       const score = ((weightedRating - 1) / 4) * 100;
       
       // Get verifications given (helping the community)
       const verificationsGiven = await db('community_verifications')
         .where('verifier_user_id', userId)
         .count('* as count')
         .first();
       
       // Bonus for actively helping verify others
       const helpingBonus = Math.min(15, verificationsGiven.count * 0.5);
       
       return {
         score: Math.min(100, score + helpingBonus),
         verificationCount: verificationsReceived.length,
         weightedRating: Math.round(weightedRating * 10) / 10,
         verificationsGiven: verificationsGiven.count,
         helpingBonus
       };
     }
   }
   ```

5. **Add Score Update Triggers** (0.5 days)
   ```javascript
   // services/social/ScoreUpdateTriggers.js
   class ScoreUpdateTriggers {
     async setupTriggers() {
       // Listen for prediction accuracy updates
       eventEmitter.on('prediction_verified', async (data) => {
         await this.updateUserScoreFromPrediction(data.userId, data.accuracy);
       });
       
       // Listen for new tracking sessions
       eventEmitter.on('tracking_session_completed', async (data) => {
         await this.updateUserScoreFromSession(data.userId, data.sessionData);
       });
       
       // Listen for community verifications
       eventEmitter.on('community_verification_added', async (data) => {
         await this.updateUserScoreFromVerification(data.trackerUserId, data.verification);
       });
       
       // Daily batch updates for consistency scores
       cron.schedule('0 2 * * *', async () => { // 2 AM daily
         await this.batchUpdateConsistencyScores();
       });
     }
     
     async updateUserScoreFromPrediction(userId, accuracy) {
       const socialScoreCalculator = new SocialScoreCalculator();
       const newScore = await socialScoreCalculator.calculateUserScore(userId);
       
       await db('user_social_scores')
         .where('user_id', userId)
         .update({
           accuracy_score: newScore.breakdown.accuracy,
           total_score: newScore.total,
           score_level: newScore.level.name,
           last_updated: new Date()
         });
       
       // Emit event for real-time UI updates
       eventEmitter.emit('user_score_updated', {
         userId,
         newScore: newScore.total,
         level: newScore.level
       });
     }
   }
   ```

**Acceptance Criteria**:
- ✅ Scores update in real-time based on contributions
- ✅ Algorithm weighs different factors appropriately (accuracy 40%, community 30%, consistency 20%, experience 10%)
- ✅ Score history properly maintained with audit trail
- ✅ Performance optimized for scale (scores cached, batch updates)
- ✅ Edge cases handled (new users, inactive users, exceptional performance)

---

### 🟠 HIGH-005: Community Verification Interface
**Priority**: HIGH  
**Estimate**: 10 days  
**Owner**: Full-stack Developer  
**Dependencies**: HIGH-004  
**Blocks**: HIGH-006

#### Detailed Subtasks

1. **Design Verification UI Components** (3 days)
   ```javascript
   // components/verification/BusArrivalVerification.jsx
   import { useState, useEffect } from 'react';
   
   function BusArrivalVerification({ busArrival, onVerify, onSkip }) {
     const [verificationData, setVerificationData] = useState({
       actualArrivalTime: null,
       accuracyRating: null,
       busNumber: busArrival.busNumber,
       comments: ''
     });
     
     const [timeOptions, setTimeOptions] = useState([]);
     
     useEffect(() => {
       // Generate time options around predicted time
       const predicted = new Date(busArrival.predictedTime);
       const options = [];
       
       for (let i = -10; i <= 10; i++) {
         const time = new Date(predicted.getTime() + i * 60000); // Add/subtract minutes
         options.push({
           value: time.toISOString(),
           label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
           difference: i
         });
       }
       
       setTimeOptions(options);
     }, [busArrival.predictedTime]);
     
     const handleSubmitVerification = async () => {
       if (!verificationData.actualArrivalTime || !verificationData.accuracyRating) {
         alert('Please select arrival time and accuracy rating');
         return;
       }
       
       try {
         const verification = {
           predictionId: busArrival.predictionId,
           trackerUserId: busArrival.trackerUserId,
           actualArrivalTime: verificationData.actualArrivalTime,
           accuracyRating: verificationData.accuracyRating,
           comments: verificationData.comments,
           verificationLocation: await getCurrentLocation()
         };
         
         await onVerify(verification);
       } catch (error) {
         console.error('Verification failed:', error);
         alert('Failed to submit verification. Please try again.');
       }
     };
     
     return (
       <div className="verification-card">
         <div className="verification-header">
           <h3>🚌 Verify Bus Arrival</h3>
           <div className="bus-info">
             <span className="bus-number">{busArrival.busNumber}</span>
             <span className="route-name">{busArrival.routeName}</span>
           </div>
         </div>
         
         <div className="verification-body">
           <div className="predicted-info">
             <div className="info-row">
               <span className="label">Predicted Time:</span>
               <span className="value">{new Date(busArrival.predictedTime).toLocaleTimeString()}</span>
             </div>
             <div className="info-row">
               <span className="label">Predictor:</span>
               <span className="value">
                 {busArrival.predictorName} 
                 <span className="social-score">({busArrival.predictorScore}⭐)</span>
               </span>
             </div>
           </div>
           
           <div className="verification-form">
             <div className="form-group">
               <label>When did the bus actually arrive?</label>
               <select 
                 value={verificationData.actualArrivalTime || ''}
                 onChange={(e) => setVerificationData(prev => ({
                   ...prev, 
                   actualArrivalTime: e.target.value
                 }))}
                 className="time-selector"
               >
                 <option value="">Select arrival time...</option>
                 {timeOptions.map(option => (
                   <option key={option.value} value={option.value}>
                     {option.label} 
                     {option.difference !== 0 && (
                       <span className={`difference ${option.difference > 0 ? 'late' : 'early'}`}>
                         ({option.difference > 0 ? '+' : ''}{option.difference}min)
                       </span>
                     )}
                   </option>
                 ))}
               </select>
             </div>
             
             <div className="form-group">
               <label>Rate the prediction accuracy:</label>
               <div className="rating-buttons">
                 {[1, 2, 3, 4, 5].map(rating => (
                   <button
                     key={rating}
                     className={`rating-btn ${verificationData.accuracyRating === rating ? 'selected' : ''}`}
                     onClick={() => setVerificationData(prev => ({
                       ...prev, 
                       accuracyRating: rating
                     }))}
                   >
                     <span className="rating-number">{rating}</span>
                     <span className="rating-label">{getRatingLabel(rating)}</span>
                   </button>
                 ))}
               </div>
             </div>
             
             <div className="form-group">
               <label>Additional comments (optional):</label>
               <textarea
                 value={verificationData.comments}
                 onChange={(e) => setVerificationData(prev => ({
                   ...prev, 
                   comments: e.target.value
                 }))}
                 placeholder="Any additional details about the arrival..."
                 rows={3}
                 className="comments-textarea"
               />
             </div>
           </div>
         </div>
         
         <div className="verification-actions">
           <button 
             className="verify-btn primary"
             onClick={handleSubmitVerification}
             disabled={!verificationData.actualArrivalTime || !verificationData.accuracyRating}
           >
             Submit Verification
           </button>
           <button 
             className="skip-btn secondary"
             onClick={onSkip}
           >
             Skip This One
           </button>
         </div>
       </div>
     );
   }
   
   function getRatingLabel(rating) {
     const labels = {
       1: 'Very Poor',
       2: 'Poor', 
       3: 'Fair',
       4: 'Good',
       5: 'Excellent'
     };
     return labels[rating];
   }
   ```

2. **Implement Verification Submission System** (2.5 days)
   ```javascript
   // services/verification/VerificationService.js
   class VerificationService {
     async submitVerification(verificationData) {
       const {
         predictionId,
         trackerUserId,
         verifierUserId,
         actualArrivalTime,
         accuracyRating,
         comments,
         verificationLocation
       } = verificationData;
       
       // Validate verification eligibility
       await this.validateVerificationEligibility(verifierUserId, predictionId);
       
       // Calculate accuracy metrics
       const accuracy = await this.calculateAccuracyMetrics(
         predictionId,
         actualArrivalTime
       );
       
       // Create verification record
       const verification = await db('community_verifications').insert({
         prediction_id: predictionId,
         tracker_user_id: trackerUserId,
         verifier_user_id: verifierUserId,
         actual_arrival_time: actualArrivalTime,
         accuracy_rating: accuracyRating,
         accuracy_minutes: accuracy.minutes,
         comments,
         verification_location: JSON.stringify(verificationLocation),
         created_at: new Date()
       });
       
       // Update prediction accuracy
       await db('arrival_predictions')
         .where('id', predictionId)
         .update({
           actual_arrival_time: actualArrivalTime,
           accuracy_percentage: accuracy.percentage,
           verification_count: db.raw('verification_count + 1'),
           last_verified_at: new Date()
         });
       
       // Update tracker's social score
       await this.updateTrackerSocialScore(trackerUserId, accuracy);
       
       // Update verifier's contribution score
       await this.updateVerifierContributionScore(verifierUserId);
       
       // Emit events for real-time updates
       eventEmitter.emit('verification_submitted', {
         trackerUserId,
         verifierUserId,
         accuracy,
         verification
       });
       
       return {
         success: true,
         verification,
         accuracy,
         pointsEarned: this.calculateVerificationPoints(accuracyRating)
       };
     }
     
     async validateVerificationEligibility(verifierUserId, predictionId) {
       // Check if user already verified this prediction
       const existingVerification = await db('community_verifications')
         .where({
           verifier_user_id: verifierUserId,
           prediction_id: predictionId
         })
         .first();
         
       if (existingVerification) {
         throw new Error('You have already verified this prediction');
       }
       
       // Check if user is trying to verify their own prediction
       const prediction = await db('arrival_predictions')
         .where('id', predictionId)
         .first();
         
       if (prediction.tracker_user_id === verifierUserId) {
         throw new Error('Cannot verify your own predictions');
       }
       
       // Check user's verification quota (prevent spam)
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       
       const todayVerifications = await db('community_verifications')
         .where('verifier_user_id', verifierUserId)
         .where('created_at', '>=', today)
         .count('* as count')
         .first();
         
       if (todayVerifications.count >= 20) { // Max 20 verifications per day
         throw new Error('Daily verification limit reached');
       }
     }
     
     async calculateAccuracyMetrics(predictionId, actualArrivalTime) {
       const prediction = await db('arrival_predictions')
         .where('id', predictionId)
         .first();
         
       const predictedTime = new Date(prediction.predicted_arrival_time);
       const actualTime = new Date(actualArrivalTime);
       const accuracyMinutes = Math.abs(predictedTime - actualTime) / (1000 * 60);
       
       // Calculate percentage accuracy
       let percentage;
       if (accuracyMinutes <= 1) percentage = 100;
       else if (accuracyMinutes <= 2) percentage = 90;
       else if (accuracyMinutes <= 3) percentage = 80;
       else if (accuracyMinutes <= 5) percentage = 70;
       else percentage = Math.max(0, 70 - (accuracyMinutes - 5) * 5);
       
       return {
         minutes: Math.round(accuracyMinutes * 10) / 10,
         percentage: Math.round(percentage),
         category: this.getAccuracyCategory(accuracyMinutes)
       };
     }
   }
   ```

3. **Create Verification Notification System** (2 days)
   ```javascript
   // services/notifications/VerificationNotificationService.js
   class VerificationNotificationService {
     async sendVerificationRequest(userId, pendingPredictions) {
       if (pendingPredictions.length === 0) return;
       
       // Check user notification preferences
       const user = await db('users')
         .select('notification_preferences')
         .where('id', userId)
         .first();
         
       const prefs = user.notification_preferences || {};
       
       if (prefs.verification_requests !== false) {
         // Send in-app notification
         await this.createInAppNotification(userId, {
           type: 'verification_request',
           title: 'Help Verify Bus Arrivals',
           message: `${pendingPredictions.length} predictions need verification`,
           data: { predictions: pendingPredictions },
           priority: 'medium'
         });
         
         // Send push notification if enabled
         if (prefs.push_notifications) {
           await this.sendPushNotification(userId, {
             title: 'Transit Tracker',
             body: `Help verify ${pendingPredictions.length} bus arrival predictions`,
             action: 'verify_predictions'
           });
         }
       }
     }
     
     async notifyPredictionVerified(trackerUserId, verification) {
       const accuracy = verification.accuracy_percentage;
       let message, icon;
       
       if (accuracy >= 90) {
         message = `🎉 Excellent prediction! ${accuracy}% accurate`;
         icon = '🏆';
       } else if (accuracy >= 70) {
         message = `👍 Good prediction! ${accuracy}% accurate`;
         icon = '✅';
       } else {
         message = `📊 Prediction verified: ${accuracy}% accurate`;
         icon = '📈';
       }
       
       await this.createInAppNotification(trackerUserId, {
         type: 'prediction_verified',
         title: 'Prediction Verified',
         message,
         icon,
         data: { verification },
         priority: 'high'
       });
     }
     
     async createInAppNotification(userId, notificationData) {
       await db('notifications').insert({
         user_id: userId,
         type: notificationData.type,
         title: notificationData.title,
         message: notificationData.message,
         icon: notificationData.icon,
         data: JSON.stringify(notificationData.data),
         priority: notificationData.priority,
         is_read: false,
         created_at: new Date()
       });
       
       // Emit real-time notification
       socketService.emitToUser(userId, 'new_notification', notificationData);
     }
   }
   ```

4. **Build Verification History Tracking** (1.5 days)
   ```javascript
   // components/verification/VerificationHistory.jsx
   function VerificationHistory({ userId }) {
     const [verifications, setVerifications] = useState([]);
     const [filter, setFilter] = useState('all'); // all, given, received
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       loadVerificationHistory();
     }, [userId, filter]);
     
     const loadVerificationHistory = async () => {
       setLoading(true);
       try {
         const endpoint = filter === 'given' 
           ? `/api/verifications/given/${userId}`
           : filter === 'received'
           ? `/api/verifications/received/${userId}`
           : `/api/verifications/all/${userId}`;
           
         const response = await fetch(endpoint);
         const data = await response.json();
         setVerifications(data);
       } catch (error) {
         console.error('Failed to load verification history:', error);
       } finally {
         setLoading(false);
       }
     };
     
     const renderVerificationItem = (verification) => {
       const isGiven = verification.verifier_user_id === userId;
       const accuracy = verification.accuracy_percentage;
       
       return (
         <div key={verification.id} className="verification-item">
           <div className="verification-header">
             <div className="route-info">
               <span className="bus-number">{verification.bus_number}</span>
               <span className="route-name">{verification.route_name}</span>
             </div>
             <div className="verification-type">
               {isGiven ? '✅ Verified' : '📊 Received'}
             </div>
           </div>
           
           <div className="verification-details">
             <div className="accuracy-info">
               <span className="accuracy-percentage">
                 {accuracy}% accurate
               </span>
               <span className="accuracy-minutes">
                 (±{verification.accuracy_minutes}min)
               </span>
             </div>
             
             <div className="timing-info">
               <div className="time-row">
                 <span className="label">Predicted:</span>
                 <span className="time">
                   {new Date(verification.predicted_time).toLocaleTimeString()}
                 </span>
               </div>
               <div className="time-row">
                 <span className="label">Actual:</span>
                 <span className="time">
                   {new Date(verification.actual_arrival_time).toLocaleTimeString()}
                 </span>
               </div>
             </div>
             
             {verification.comments && (
               <div className="comments">
                 <span className="label">Comments:</span>
                 <span className="text">{verification.comments}</span>
               </div>
             )}
           </div>
           
           <div className="verification-footer">
             <span className="date">
               {new Date(verification.created_at).toLocaleDateString()}
             </span>
             {isGiven ? (
               <span className="other-user">
                 Verified {verification.tracker_name}'s prediction
               </span>
             ) : (
               <span className="other-user">
                 Verified by {verification.verifier_name}
               </span>
             )}
           </div>
         </div>
       );
     };
     
     return (
       <div className="verification-history">
         <div className="history-header">
           <h3>Verification History</h3>
           <div className="filter-tabs">
             <button 
               className={filter === 'all' ? 'active' : ''}
               onClick={() => setFilter('all')}
             >
               All
             </button>
             <button 
               className={filter === 'given' ? 'active' : ''}
               onClick={() => setFilter('given')}
             >
               Given
             </button>
             <button 
               className={filter === 'received' ? 'active' : ''}
               onClick={() => setFilter('received')}
             >
               Received
             </button>
           </div>
         </div>
         
         {loading ? (
           <div className="loading">Loading verification history...</div>
         ) : verifications.length === 0 ? (
           <div className="empty-state">
             <p>No verifications found</p>
             <button onClick={() => window.location.href = '/verify'}>
               Start Verifying Predictions
             </button>
           </div>
         ) : (
           <div className="verification-list">
             {verifications.map(renderVerificationItem)}
           </div>
         )}
       </div>
     );
   }
   ```

5. **Add Anti-Spam and Abuse Prevention** (1 day)
   ```javascript
   // services/verification/AbusePreventionService.js
   class AbusePreventionService {
     async validateVerification(verificationData) {
       const checks = await Promise.all([
         this.checkRateLimit(verificationData.verifierUserId),
         this.checkLocationConsistency(verificationData),
         this.checkSuspiciousPatterns(verificationData.verifierUserId),
         this.checkTimeWindow(verificationData.predictionId)
       ]);
       
       const issues = checks.filter(check => !check.valid);
       
       if (issues.length > 0) {
         return {
           valid: false,
           issues: issues.map(i => i.reason),
           severity: Math.max(...issues.map(i => i.severity))
         };
       }
       
       return { valid: true };
     }
     
     async checkLocationConsistency(verificationData) {
       const prediction = await this.getPredictionDetails(verificationData.predictionId);
       const verificationLocation = verificationData.verificationLocation;
       
       // Check if verifier is reasonably close to the bus stop
       const distance = this.calculateDistance(
         verificationLocation,
         prediction.stopLocation
       );
       
       if (distance > 1000) { // 1km threshold
         return {
           valid: false,
           reason: 'Verification location too far from bus stop',
           severity: 3
         };
       }
       
       return { valid: true };
     }
     
     async checkSuspiciousPatterns(userId) {
       const recentVerifications = await db('community_verifications')
         .where('verifier_user_id', userId)
         .where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
         .orderBy('created_at', 'desc');
       
       // Check for suspicious patterns
       const patterns = {
         tooManyInShortTime: recentVerifications.length > 30,
         allSameRating: this.checkAllSameRating(recentVerifications),
         rapidFire: this.checkRapidFireVerifications(recentVerifications)
       };
       
       const suspiciousCount = Object.values(patterns).filter(Boolean).length;
       
       if (suspiciousCount >= 2) {
         return {
           valid: false,
           reason: 'Suspicious verification pattern detected',
           severity: 4
         };
       }
       
       return { valid: true };
     }
     
     checkAllSameRating(verifications) {
       if (verifications.length < 10) return false;
       
       const ratings = verifications.map(v => v.accuracy_rating);
       const uniqueRatings = new Set(ratings);
       
       return uniqueRatings.size === 1; // All same rating
     }
   }
   ```

**Acceptance Criteria**:
- ✅ Easy-to-use verification interface with clear options
- ✅ Users can verify arrival times quickly (<30 seconds)
- ✅ Spam prevention mechanisms active and effective
- ✅ Verification data feeds back to social scores immediately
- ✅ Location validation ensures verifiers are at bus stops
- ✅ Notification system encourages participation

---

### 🟠 HIGH-006: Achievement & Badge System
**Priority**: HIGH  
**Estimate**: 6 days  
**Owner**: Frontend Developer + Backend Developer  
**Dependencies**: HIGH-004, HIGH-005  
**Blocks**: None

#### Detailed Subtasks

1. **Design Achievement Criteria and Badges** (1.5 days)
   ```javascript
   // config/achievements.js
   export const ACHIEVEMENTS = {
     // Accuracy Achievements
     SHARP_SHOOTER: {
       id: 'sharp_shooter',
       name: 'Sharp Shooter',
       description: 'Make 10 predictions with 95%+ accuracy',
       icon: '🎯',
       category: 'accuracy',
       requirements: {
         accurate_predictions: 10,
         min_accuracy: 95
       },
       points: 100,
       badge_color: '#ff6b6b'
     },
     
     PRECISION_MASTER: {
       id: 'precision_master',
       name: 'Precision Master',
       description: 'Achieve 90%+ accuracy over 50 predictions',
       icon: '🏹',
       category: 'accuracy',
       requirements: {
         total_predictions: 50,
         overall_accuracy: 90
       },
       points: 250,
       badge_color: '#4ecdc4'
     },
     
     // Consistency Achievements
     DAILY_COMMUTER: {
       id: 'daily_commuter',
       name: 'Daily Commuter',
       description: 'Track your commute for 7 consecutive days',
       icon: '🚌',
       category: 'consistency',
       requirements: {
         consecutive_days: 7
       },
       points: 50,
       badge_color: '#45b7d1'
     },
     
     ROUTE_GUARDIAN: {
       id: 'route_guardian',
       name: 'Route Guardian',
       description: 'Track the same route 20 times',
       icon: '🛡️',
       category: 'consistency',
       requirements: {
         same_route_count: 20
       },
       points: 150,
       badge_color: '#96ceb4'
     },
     
     // Community Achievements
     COMMUNITY_HELPER: {
       id: 'community_helper',
       name: 'Community Helper',
       description: 'Verify 50 predictions from other users',
       icon: '🤝',
       category: 'community',
       requirements: {
         verifications_given: 50
       },
       points: 200,
       badge_color: '#feca57'
     },
     
     TRUST_BUILDER: {
       id: 'trust_builder',
       name: 'Trust Builder',
       description: 'Receive 100 positive verifications',
       icon: '⭐',
       category: 'community',
       requirements: {
         positive_verifications: 100
       },
       points: 300,
       badge_color: '#ff9ff3'
     },
     
     // Distance & Coverage Achievements
     CITY_EXPLORER: {
       id: 'city_explorer',
       name: 'City Explorer',
       description: 'Track buses on 10 different routes',
       icon: '🗺️',
       category: 'exploration',
       requirements: {
         unique_routes: 10
       },
       points: 100,
       badge_color: '#74b9ff'
     },
     
     MILE_MASTER: {
       id: 'mile_master',
       name: 'Mile Master',
       description: 'Track 1000km of bus journeys',
       icon: '📏',
       category: 'distance',
       requirements: {
         total_distance_km: 1000
       },
       points: 500,
       badge_color: '#e17055'
     }
   };
   
   export const ACHIEVEMENT_CATEGORIES = {
     accuracy: { name: 'Accuracy', icon: '🎯', color: '#ff6b6b' },
     consistency: { name: 'Consistency', icon: '📅', color: '#45b7d1' },
     community: { name: 'Community', icon: '🤝', color: '#feca57' },
     exploration: { name: 'Exploration', icon: '🗺️', color: '#74b9ff' },
     distance: { name: 'Distance', icon: '📏', color: '#e17055' }
   };
   ```

2. **Implement Badge Earning Logic** (2 days)
   ```javascript
   // services/achievements/AchievementEngine.js
   class AchievementEngine {
     async checkUserAchievements(userId, triggerEvent = null) {
       const userStats = await this.getUserStats(userId);
       const currentAchievements = await this.getUserAchievements(userId);
       const earnedAchievementIds = new Set(currentAchievements.map(a => a.achievement_id));
       
       const newAchievements = [];
       
       // Check each achievement
       for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
         if (earnedAchievementIds.has(achievementId)) continue;
         
         const earned = await this.checkAchievementRequirements(
           achievement,
           userStats,
           triggerEvent
         );
         
         if (earned) {
           newAchievements.push(achievement);
           await this.awardAchievement(userId, achievement);
         }
       }
       
       if (newAchievements.length > 0) {
         await this.notifyNewAchievements(userId, newAchievements);
       }
       
       return newAchievements;
     }
     
     async checkAchievementRequirements(achievement, userStats, triggerEvent) {
       const reqs = achievement.requirements;
       
       // Check each requirement
       for (const [reqKey, reqValue] of Object.entries(reqs)) {
         if (!this.checkRequirement(reqKey, reqValue, userStats, triggerEvent)) {
           return false;
         }
       }
       
       return true;
     }
     
     checkRequirement(reqKey, reqValue, userStats, triggerEvent) {
       switch (reqKey) {
         case 'accurate_predictions':
           return userStats.accurate_predictions >= reqValue;
           
         case 'min_accuracy':
           return userStats.overall_accuracy >= reqValue;
           
         case 'total_predictions':
           return userStats.total_predictions >= reqValue;
           
         case 'consecutive_days':
           return userStats.current_streak >= reqValue;
           
         case 'same_route_count':
           return Math.max(...Object.values(userStats.route_counts || {})) >= reqValue;
           
         case 'verifications_given':
           return userStats.verifications_given >= reqValue;
           
         case 'positive_verifications':
           return userStats.positive_verifications >= reqValue;
           
         case 'unique_routes':
           return Object.keys(userStats.route_counts || {}).length >= reqValue;
           
         case 'total_distance_km':
           return userStats.total_distance_km >= reqValue;
           
         default:
           console.warn(`Unknown requirement: ${reqKey}`);
           return false;
       }
     }
     
     async awardAchievement(userId, achievement) {
       // Record achievement
       await db('user_achievements').insert({
         user_id: userId,
         achievement_id: achievement.id,
         earned_at: new Date(),
         points_awarded: achievement.points
       });
       
       // Update user's total points
       await db('user_social_scores')
         .where('user_id', userId)
         .increment('total_points', achievement.points);
       
       // Log achievement event
       await db('achievement_events').insert({
         user_id: userId,
         achievement_id: achievement.id,
         event_type: 'earned',
         metadata: JSON.stringify({
           points: achievement.points,
           timestamp: new Date()
         })
       });
       
       // Emit real-time event
       eventEmitter.emit('achievement_earned', {
         userId,
         achievement
       });
     }
   }
   ```

3. **Create Achievement Notification System** (1 day)
   ```javascript
   // components/achievements/AchievementNotification.jsx
   import { useState, useEffect } from 'react';
   
   function AchievementNotification({ achievement, onClose }) {
     const [visible, setVisible] = useState(false);
     const [celebrating, setCelebrating] = useState(false);
     
     useEffect(() => {
       // Animate in
       setTimeout(() => setVisible(true), 100);
       
       // Start celebration animation
       setTimeout(() => setCelebrating(true), 500);
       
       // Auto close after 5 seconds
       const timer = setTimeout(() => {
         handleClose();
       }, 5000);
       
       return () => clearTimeout(timer);
     }, []);
     
     const handleClose = () => {
       setVisible(false);
       setTimeout(onClose, 300); // Wait for animation
     };
     
     return (
       <div className={`achievement-notification ${visible ? 'visible' : ''}`}>
         <div className="notification-content">
           <div className="celebration-overlay">
             {celebrating && <ConfettiAnimation />}
           </div>
           
           <div className="achievement-header">
             <h2>🎉 Achievement Unlocked!</h2>
           </div>
           
           <div className="achievement-details">
             <div 
               className="achievement-badge"
               style={{ backgroundColor: achievement.badge_color }}
             >
               <span className="achievement-icon">{achievement.icon}</span>
             </div>
             
             <div className="achievement-info">
               <h3 className="achievement-name">{achievement.name}</h3>
               <p className="achievement-description">{achievement.description}</p>
               <div className="achievement-points">
                 +{achievement.points} points
               </div>
             </div>
           </div>
           
           <button className="close-btn" onClick={handleClose}>
             Continue
           </button>
         </div>
       </div>
     );
   }
   
   function ConfettiAnimation() {
     return (
       <div className="confetti-container">
         {Array.from({ length: 50 }, (_, i) => (
           <div
             key={i}
             className="confetti-piece"
             style={{
               left: `${Math.random() * 100}%`,
               animationDelay: `${Math.random() * 2}s`,
               backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
             }}
           />
         ))}
       </div>
     );
   }
   ```

4. **Build Badge Display Components** (1 day)
   ```javascript
   // components/achievements/BadgeCollection.jsx
   function BadgeCollection({ userId, viewMode = 'grid' }) {
     const [achievements, setAchievements] = useState([]);
     const [categories, setCategories] = useState(ACHIEVEMENT_CATEGORIES);
     const [selectedCategory, setSelectedCategory] = useState('all');
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       loadUserAchievements();
     }, [userId]);
     
     const loadUserAchievements = async () => {
       try {
         const response = await fetch(`/api/users/${userId}/achievements`);
         const data = await response.json();
         setAchievements(data);
       } catch (error) {
         console.error('Failed to load achievements:', error);
       } finally {
         setLoading(false);
       }
     };
     
     const filteredAchievements = selectedCategory === 'all' 
       ? achievements
       : achievements.filter(a => a.category === selectedCategory);
     
     const getAchievementStatus = (achievementId) => {
       return achievements.find(a => a.achievement_id === achievementId);
     };
     
     const renderBadge = (achievement) => {
       const earned = getAchievementStatus(achievement.id);
       
       return (
         <div 
           key={achievement.id}
           className={`achievement-badge ${earned ? 'earned' : 'locked'}`}
         >
           <div 
             className="badge-icon"
             style={{ 
               backgroundColor: earned ? achievement.badge_color : '#ccc',
               opacity: earned ? 1 : 0.4
             }}
           >
             <span className="icon">{achievement.icon}</span>
           </div>
           
           <div className="badge-info">
             <h4 className="badge-name">{achievement.name}</h4>
             <p className="badge-description">{achievement.description}</p>
             
             {earned ? (
               <div className="earned-info">
                 <span className="points">+{achievement.points} pts</span>
                 <span className="date">
                   {new Date(earned.earned_at).toLocaleDateString()}
                 </span>
               </div>
             ) : (
               <div className="progress-info">
                 <span className="locked-text">Not yet earned</span>
               </div>
             )}
           </div>
           
           {earned && (
             <div className="earned-indicator">
               ✓
             </div>
           )}
         </div>
       );
     };
     
     if (loading) {
       return <div className="loading">Loading achievements...</div>;
     }
     
     return (
       <div className="badge-collection">
         <div className="collection-header">
           <h2>Achievement Collection</h2>
           <div className="stats-summary">
             <span className="earned-count">
               {achievements.filter(a => a.earned_at).length} earned
             </span>
             <span className="total-count">
               of {Object.keys(ACHIEVEMENTS).length} total
             </span>
           </div>
         </div>
         
         <div className="category-filters">
           <button
             className={selectedCategory === 'all' ? 'active' : ''}
             onClick={() => setSelectedCategory('all')}
           >
             All
           </button>
           {Object.entries(categories).map(([key, category]) => (
             <button
               key={key}
               className={selectedCategory === key ? 'active' : ''}
               onClick={() => setSelectedCategory(key)}
             >
               <span className="category-icon">{category.icon}</span>
               {category.name}
             </button>
           ))}
         </div>
         
         <div className={`achievements-grid ${viewMode}`}>
           {Object.values(ACHIEVEMENTS)
             .filter(achievement => 
               selectedCategory === 'all' || achievement.category === selectedCategory
             )
             .map(renderBadge)}
         </div>
       </div>
     );
   }
   ```

5. **Add Leaderboard Functionality** (0.5 days)
   ```javascript
   // components/achievements/Leaderboard.jsx
   function Leaderboard({ timeframe = 'all_time' }) {
     const [leaders, setLeaders] = useState([]);
     const [currentUser, setCurrentUser] = useState(null);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       loadLeaderboard();
     }, [timeframe]);
     
     const loadLeaderboard = async () => {
       try {
         const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
         const data = await response.json();
         setLeaders(data.leaders);
         setCurrentUser(data.currentUser);
       } catch (error) {
         console.error('Failed to load leaderboard:', error);
       } finally {
         setLoading(false);
       }
     };
     
     const renderLeaderItem = (leader, index) => {
       const isCurrentUser = currentUser && leader.user_id === currentUser.user_id;
       
       return (
         <div 
           key={leader.user_id}
           className={`leader-item ${isCurrentUser ? 'current-user' : ''}`}
         >
           <div className="rank">
             {index + 1 <= 3 ? (
               <span className={`medal rank-${index + 1}`}>
                 {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
               </span>
             ) : (
               <span className="rank-number">#{index + 1}</span>
             )}
           </div>
           
           <div className="user-info">
             <div className="username">{leader.username}</div>
             <div className="user-stats">
               <span className="social-score">
                 {leader.social_score}⭐
               </span>
               <span className="achievements">
                 {leader.achievement_count} badges
               </span>
             </div>
           </div>
           
           <div className="score">
             <span className="points">{leader.total_points}</span>
             <span className="label">points</span>
           </div>
         </div>
       );
     };
     
     return (
       <div className="leaderboard">
         <div className="leaderboard-header">
           <h3>🏆 Top Contributors</h3>
           <select 
             value={timeframe}
             onChange={(e) => setTimeframe(e.target.value)}
           >
             <option value="all_time">All Time</option>
             <option value="this_month">This Month</option>
             <option value="this_week">This Week</option>
           </select>
         </div>
         
         {loading ? (
           <div className="loading">Loading leaderboard...</div>
         ) : (
           <div className="leader-list">
             {leaders.map(renderLeaderItem)}
             
             {currentUser && !leaders.find(l => l.user_id === currentUser.user_id) && (
               <>
                 <div className="separator">...</div>
                 {renderLeaderItem(currentUser, currentUser.rank - 1)}
               </>
             )}
           </div>
         )}
       </div>
     );
   }
   ```

**Acceptance Criteria**:
- ✅ Achievements motivate continued participation
- ✅ Badge system is clear and rewarding with visual feedback
- ✅ Leaderboards encourage healthy competition
- ✅ Analytics track engagement improvement from gamification
- ✅ Achievement notifications are celebratory but not intrusive
- ✅ Progress tracking helps users understand how to earn badges

---

## PHASE 4: AI/ML PREDICTIONS (Months 4-6)
*Goal: Launch intelligent arrival predictions*

### 🟡 MEDIUM-001: ML Data Pipeline Implementation
**Priority**: MEDIUM  
**Estimate**: 14 days  
**Owner**: Data Engineer + ML Engineer  
**Dependencies**: HIGH-002, HIGH-003  
**Blocks**: MEDIUM-002

#### Detailed Subtasks

1. **Design Training Data Collection System** (3 days)
   ```python
   # ml/data_pipeline/DataCollector.py
   import pandas as pd
   import numpy as np
   from datetime import datetime, timedelta
   import asyncio
   import logging
   
   class TransitDataCollector:
       def __init__(self, config):
           self.db_connection = config.database
           self.weather_api = config.weather_api
           self.traffic_api = config.traffic_api
           self.logger = logging.getLogger(__name__)
           
       async def collect_training_data(self, route_id, days_back=90):
           """Collect comprehensive training data for ML models"""
           end_date = datetime.now()
           start_date = end_date - timedelta(days=days_back)
           
           # Collect core tracking data
           tracking_data = await self.get_tracking_data(route_id, start_date, end_date)
           
           # Enrich with external data
           enriched_data = await self.enrich_with_external_data(tracking_data)
           
           # Feature engineering
           features = await self.extract_features(enriched_data)
           
           return features
           
       async def get_tracking_data(self, route_id, start_date, end_date):
           """Get historical tracking data with high social score users only"""
           query = """
           SELECT 
               lt.id,
               lt.user_id,
               lt.route_id,
               lt.current_lat,
               lt.current_lng,
               lt.speed,
               lt.direction,
               lt.tracking_start_time,
               lt.last_update,
               u.social_score,
               ap.predicted_arrival_time,
               ap.actual_arrival_time,
               ap.accuracy_percentage,
               ts.id as stop_id,
               ts.stop_name,
               ts.latitude as stop_lat,
               ts.longitude as stop_lng,
               ts.stop_order
           FROM live_tracking lt
           JOIN users u ON lt.user_id = u.id
           LEFT JOIN arrival_predictions ap ON lt.id = ap.tracking_session_id
           LEFT JOIN transport_stops ts ON ap.stop_id = ts.id
           WHERE lt.route_id = %s
           AND lt.tracking_start_time BETWEEN %s AND %s
           AND u.social_score >= 60  -- Only reliable trackers
           AND ap.actual_arrival_time IS NOT NULL  -- Only verified predictions
           ORDER BY lt.tracking_start_time
           """
           
           return await self.db_connection.fetch_all(query, [route_id, start_date, end_date])
           
       async def enrich_with_external_data(self, tracking_data):
           """Add weather, traffic, and time-based features"""
           enriched = []
           
           for row in tracking_data:
               # Get weather data for the timestamp
               weather = await self.get_weather_data(
                   row['current_lat'], 
                   row['current_lng'], 
                   row['tracking_start_time']
               )
               
               # Get traffic data
               traffic = await self.get_traffic_data(
                   row['route_id'],
                   row['tracking_start_time']
               )
               
               # Add time-based features
               timestamp = row['tracking_start_time']
               time_features = {
                   'hour_of_day': timestamp.hour,
                   'day_of_week': timestamp.weekday(),
                   'is_weekend': timestamp.weekday() >= 5,
                   'is_peak_morning': 7 <= timestamp.hour <= 10,
                   'is_peak_evening': 17 <= timestamp.hour <= 20,
                   'month': timestamp.month,
                   'is_holiday': await self.is_holiday(timestamp.date())
               }
               
               enriched_row = {
                   **row,
                   **weather,
                   **traffic,
                   **time_features
               }
               
               enriched.append(enriched_row)
               
           return enriched
           
       async def extract_features(self, enriched_data):
           """Extract ML features from enriched data"""
           features = []
           
           for i, row in enumerate(enriched_data):
               if i == 0:
                   continue  # Skip first row (need previous data)
                   
               prev_row = enriched_data[i-1]
               
               # Calculate derived features
               feature_row = {
                   # Target variable
                   'actual_travel_time_minutes': self.calculate_travel_time(row),
                   
                   # Location features
                   'current_lat': row['current_lat'],
                   'current_lng': row['current_lng'],
                   'distance_to_stop_km': self.calculate_distance(
                       row['current_lat'], row['current_lng'],
                       row['stop_lat'], row['stop_lng']
                   ),
                   
                   # Speed and movement features
                   'current_speed_kmh': row['speed'] or 0,
                   'speed_change': (row['speed'] or 0) - (prev_row['speed'] or 0),
                   'acceleration': self.calculate_acceleration(row, prev_row),
                   
                   # Route features
                   'stops_remaining': self.calculate_stops_remaining(row),
                   'route_progress_percentage': self.calculate_route_progress(row),
                   
                   # Time features
                   'hour_of_day': row['hour_of_day'],
                   'day_of_week': row['day_of_week'],
                   'is_weekend': row['is_weekend'],
                   'is_peak_morning': row['is_peak_morning'],
                   'is_peak_evening': row['is_peak_evening'],
                   'is_holiday': row['is_holiday'],
                   
                   # Weather features
                   'temperature_c': row['temperature'],
                   'humidity_percent': row['humidity'],
                   'wind_speed_kmh': row['wind_speed'],
                   'precipitation_mm': row['precipitation'],
                   'visibility_km': row['visibility'],
                   'is_raining': row['precipitation'] > 0,
                   
                   # Traffic features
                   'traffic_factor': row['traffic_factor'],
                   'average_speed_on_route': row['route_average_speed'],
                   'congestion_level': row['congestion_level'],
                   
                   # Historical features
                   'historical_average_time': await self.get_historical_average(row),
                   'same_time_last_week': await self.get_same_time_last_week(row),
                   
                   # Tracker credibility
                   'tracker_social_score': row['social_score'],
                   'tracker_accuracy_score': await self.get_tracker_accuracy(row['user_id'])
               }
               
               features.append(feature_row)
               
           return pd.DataFrame(features)
   ```

2. **Implement Data Cleaning and Preprocessing** (3 days)
   ```python
   # ml/data_pipeline/DataPreprocessor.py
   import pandas as pd
   import numpy as np
   from sklearn.preprocessing import StandardScaler, LabelEncoder
   from sklearn.impute import SimpleImputer
   import logging
   
   class DataPreprocessor:
       def __init__(self):
           self.scaler = StandardScaler()
           self.label_encoders = {}
           self.imputers = {}
           self.logger = logging.getLogger(__name__)
           
       def clean_and_preprocess(self, df):
           """Main preprocessing pipeline"""
           self.logger.info(f"Starting preprocessing of {len(df)} samples")
           
           # 1. Remove outliers
           df_clean = self.remove_outliers(df)
           self.logger.info(f"After outlier removal: {len(df_clean)} samples")
           
           # 2. Handle missing values
           df_imputed = self.handle_missing_values(df_clean)
           
           # 3. Feature engineering
           df_engineered = self.engineer_features(df_imputed)
           
           # 4. Encode categorical variables
           df_encoded = self.encode_categorical_features(df_engineered)
           
           # 5. Scale numerical features
           df_scaled = self.scale_numerical_features(df_encoded)
           
           # 6. Feature selection
           df_selected = self.select_features(df_scaled)
           
           self.logger.info(f"Final preprocessed dataset: {df_selected.shape}")
           return df_selected
           
       def remove_outliers(self, df):
           """Remove statistical outliers using IQR method"""
           outlier_columns = [
               'actual_travel_time_minutes',
               'current_speed_kmh',
               'distance_to_stop_km',
               'temperature_c',
               'wind_speed_kmh'
           ]
           
           df_clean = df.copy()
           
           for col in outlier_columns:
               if col in df_clean.columns:
                   Q1 = df_clean[col].quantile(0.25)
                   Q3 = df_clean[col].quantile(0.75)
                   IQR = Q3 - Q1
                   
                   lower_bound = Q1 - 1.5 * IQR
                   upper_bound = Q3 + 1.5 * IQR
                   
                   outlier_mask = (df_clean[col] < lower_bound) | (df_clean[col] > upper_bound)
                   outlier_count = outlier_mask.sum()
                   
                   if outlier_count > 0:
                       self.logger.info(f"Removing {outlier_count} outliers from {col}")
                       df_clean = df_clean[~outlier_mask]
                       
           return df_clean
           
       def handle_missing_values(self, df):
           """Handle missing values with appropriate strategies"""
           df_imputed = df.copy()
           
           # Numerical columns - use median imputation
           numerical_cols = df_imputed.select_dtypes(include=[np.number]).columns
           for col in numerical_cols:
               if df_imputed[col].isna().sum() > 0:
                   if col not in self.imputers:
                       self.imputers[col] = SimpleImputer(strategy='median')
                       df_imputed[col] = self.imputers[col].fit_transform(
                           df_imputed[col].values.reshape(-1, 1)
                       ).flatten()
                   else:
                       df_imputed[col] = self.imputers[col].transform(
                           df_imputed[col].values.reshape(-1, 1)
                       ).flatten()
           
           # Categorical columns - use mode imputation
           categorical_cols = df_imputed.select_dtypes(include=['object', 'bool']).columns
           for col in categorical_cols:
               if df_imputed[col].isna().sum() > 0:
                   mode_value = df_imputed[col].mode().iloc[0] if not df_imputed[col].mode().empty else 'unknown'
                   df_imputed[col].fillna(mode_value, inplace=True)
                   
           return df_imputed
           
       def engineer_features(self, df):
           """Create additional engineered features"""
           df_eng = df.copy()
           
           # Time-based feature combinations
           df_eng['is_rush_hour'] = (df_eng['is_peak_morning'] | df_eng['is_peak_evening']).astype(int)
           df_eng['weekend_evening'] = (df_eng['is_weekend'] & (df_eng['hour_of_day'] >= 18)).astype(int)
           
           # Weather combinations
           df_eng['bad_weather'] = (
               (df_eng['is_raining']) | 
               (df_eng['wind_speed_kmh'] > 20) | 
               (df_eng['visibility_km'] < 5)
           ).astype(int)
           
           # Speed features
           df_eng['speed_vs_limit'] = df_eng['current_speed_kmh'] / 50  # Assume 50 kmh speed limit
           df_eng['is_moving'] = (df_eng['current_speed_kmh'] > 5).astype(int)
           df_eng['is_fast'] = (df_eng['current_speed_kmh'] > 30).astype(int)
           
           # Distance features
           df_eng['distance_category'] = pd.cut(
               df_eng['distance_to_stop_km'],
               bins=[0, 1, 3, 5, float('inf')],
               labels=['very_close', 'close', 'medium', 'far']
           )
           
           # Traffic and weather interaction
           df_eng['traffic_weather_factor'] = (
               df_eng['traffic_factor'] * (1 + df_eng['bad_weather'] * 0.3)
           )
           
           return df_eng
           
       def encode_categorical_features(self, df):
           """Encode categorical variables"""
           df_encoded = df.copy()
           
           categorical_columns = [
               'day_of_week',
               'distance_category'
           ]
           
           for col in categorical_columns:
               if col in df_encoded.columns:
                   if col not in self.label_encoders:
                       self.label_encoders[col] = LabelEncoder()
                       df_encoded[col] = self.label_encoders[col].fit_transform(df_encoded[col])
                   else:
                       df_encoded[col] = self.label_encoders[col].transform(df_encoded[col])
                       
           return df_encoded
           
       def scale_numerical_features(self, df):
           """Scale numerical features"""
           features_to_scale = [
               'distance_to_stop_km',
               'current_speed_kmh',
               'temperature_c',
               'humidity_percent',
               'wind_speed_kmh',
               'precipitation_mm',
               'traffic_factor',
               'tracker_social_score'
           ]
           
           df_scaled = df.copy()
           
           for col in features_to_scale:
               if col in df_scaled.columns:
                   df_scaled[col] = self.scaler.fit_transform(
                       df_scaled[col].values.reshape(-1, 1)
                   ).flatten()
                   
           return df_scaled
   ```

3. **Create Feature Engineering Pipeline** (3 days)
   ```python
   # ml/features/FeatureExtractor.py
   import pandas as pd
   import numpy as np
   from geopy.distance import geodesic
   from datetime import datetime, timedelta
   
   class FeatureExtractor:
       def __init__(self, config):
           self.route_cache = {}
           self.historical_cache = {}
           
       def extract_all_features(self, tracking_data):
           """Extract comprehensive feature set"""
           features = []
           
           for data_point in tracking_data:
               feature_vector = {}
               
               # Basic location and time features
               feature_vector.update(self.extract_basic_features(data_point))
               
               # Route-specific features
               feature_vector.update(self.extract_route_features(data_point))
               
               # Historical pattern features
               feature_vector.update(self.extract_historical_features(data_point))
               
               # Weather impact features
               feature_vector.update(self.extract_weather_features(data_point))
               
               # Traffic pattern features
               feature_vector.update(self.extract_traffic_features(data_point))
               
               # Tracker credibility features
               feature_vector.update(self.extract_credibility_features(data_point))
               
               features.append(feature_vector)
               
           return pd.DataFrame(features)
           
       def extract_basic_features(self, data_point):
           """Basic spatial and temporal features"""
           timestamp = data_point['timestamp']
           
           return {
               'hour_of_day': timestamp.hour,
               'day_of_week': timestamp.weekday(),
               'day_of_month': timestamp.day,
               'month': timestamp.month,
               'is_weekend': int(timestamp.weekday() >= 5),
               'is_holiday': int(self.is_holiday(timestamp.date())),
               'season': self.get_season(timestamp),
               
               'current_lat': data_point['latitude'],
               'current_lng': data_point['longitude'],
               'current_speed': data_point['speed'] or 0,
               'current_direction': data_point['direction'] or 0,
           }
           
       def extract_route_features(self, data_point):
           """Route-specific spatial features"""
           route_id = data_point['route_id']
           current_pos = (data_point['latitude'], data_point['longitude'])
           
           route_info = self.get_route_info(route_id)
           
           # Distance to each upcoming stop
           upcoming_stops = self.get_upcoming_stops(current_pos, route_info['stops'])
           
           features = {
               'stops_remaining': len(upcoming_stops),
               'distance_to_next_stop': self.calculate_distance_to_next_stop(current_pos, upcoming_stops),
               'route_progress_pct': self.calculate_route_progress(current_pos, route_info),
               'deviation_from_route': self.calculate_route_deviation(current_pos, route_info['path']),
           }
           
           # Add distance to next 3 stops
           for i, stop in enumerate(upcoming_stops[:3]):
               features[f'distance_to_stop_{i+1}'] = geodesic(current_pos, stop['location']).kilometers
               
           return features
           
       def extract_historical_features(self, data_point):
           """Historical pattern features"""
           route_id = data_point['route_id']
           timestamp = data_point['timestamp']
           current_pos = (data_point['latitude'], data_point['longitude'])
           
           # Same time patterns
           same_hour_last_week = timestamp - timedelta(days=7)
           same_day_last_week = timestamp - timedelta(days=7)
           
           return {
               'avg_speed_this_hour_historical': self.get_historical_avg_speed(
                   route_id, timestamp.hour, timestamp.weekday()
               ),
               'avg_travel_time_this_segment': self.get_segment_historical_time(
                   route_id, current_pos
               ),
               'same_time_last_week_speed': self.get_speed_at_time(
                   route_id, same_hour_last_week
               ),
               'typical_delay_this_time': self.get_typical_delay(
                   route_id, timestamp.hour, timestamp.weekday()
               ),
               'route_reliability_score': self.get_route_reliability(route_id),
           }
           
       def extract_weather_features(self, data_point):
           """Weather impact features"""
           weather = data_point.get('weather', {})
           
           return {
               'temperature': weather.get('temperature', 20),
               'humidity': weather.get('humidity', 50),
               'wind_speed': weather.get('wind_speed', 0),
               'precipitation': weather.get('precipitation', 0),
               'visibility': weather.get('visibility', 10),
               'weather_condition': self.encode_weather_condition(weather.get('condition', 'clear')),
               
               # Weather impact factors
               'is_raining': int(weather.get('precipitation', 0) > 0),
               'is_windy': int(weather.get('wind_speed', 0) > 15),
               'poor_visibility': int(weather.get('visibility', 10) < 5),
               'extreme_temperature': int(abs(weather.get('temperature', 20) - 25) > 10),
               
               # Combined weather impact score
               'weather_impact_score': self.calculate_weather_impact(weather),
           }
           
       def extract_traffic_features(self, data_point):
           """Traffic pattern features"""
           traffic = data_point.get('traffic', {})
           timestamp = data_point['timestamp']
           
           return {
               'traffic_density': traffic.get('density', 0.5),
               'average_speed_on_route': traffic.get('average_speed', 30),
               'congestion_level': traffic.get('congestion_level', 'medium'),
               'incidents_nearby': traffic.get('incidents_count', 0),
               
               # Time-based traffic patterns
               'is_peak_morning': int(7 <= timestamp.hour <= 10),
               'is_peak_evening': int(17 <= timestamp.hour <= 20),
               'is_lunch_time': int(12 <= timestamp.hour <= 14),
               'is_night': int(timestamp.hour <= 6 or timestamp.hour >= 22),
               
               # Traffic prediction factors
               'expected_congestion': self.get_expected_congestion(
                   data_point['route_id'], timestamp
               ),
               'traffic_vs_normal': traffic.get('density', 0.5) / self.get_normal_traffic(
                   data_point['route_id'], timestamp
               ),
           }
           
       def extract_credibility_features(self, data_point):
           """Tracker credibility and data quality features"""
           user_id = data_point['user_id']
           
           return {
               'tracker_social_score': data_point.get('social_score', 50),
               'tracker_accuracy_rate': self.get_user_accuracy_rate(user_id),
               'tracker_experience_days': self.get_user_experience_days(user_id),
               'tracker_route_familiarity': self.get_route_familiarity(
                   user_id, data_point['route_id']
               ),
               'data_freshness_minutes': self.calculate_data_freshness(data_point),
               'gps_accuracy': data_point.get('gps_accuracy', 10),
               'signal_strength': data_point.get('signal_strength', 0.8),
           }
   ```

4. **Set Up Model Training Infrastructure** (3 days)
   ```python
   # ml/training/ModelTrainer.py
   import pandas as pd
   import numpy as np
   from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
   from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
   from sklearn.neural_network import MLPRegressor
   from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
   import joblib
   import mlflow
   import logging
   
   class ModelTrainer:
       def __init__(self, config):
           self.config = config
           self.models = {}
           self.best_model = None
           self.feature_importance = None
           self.logger = logging.getLogger(__name__)
           
       def train_models(self, X, y):
           """Train multiple models and select the best one"""
           self.logger.info(f"Training models on {X.shape[0]} samples with {X.shape[1]} features")
           
           # Split data
           X_train, X_test, y_train, y_test = train_test_split(
               X, y, test_size=0.2, random_state=42, stratify=None
           )
           
           # Define models to train
           model_configs = {
               'random_forest': {
                   'model': RandomForestRegressor(random_state=42),
                   'params': {
                       'n_estimators': [100, 200, 300],
                       'max_depth': [10, 20, None],
                       'min_samples_split': [2, 5, 10],
                       'min_samples_leaf': [1, 2, 4]
                   }
               },
               'gradient_boosting': {
                   'model': GradientBoostingRegressor(random_state=42),
                   'params': {
                       'n_estimators': [100, 200],
                       'learning_rate': [0.05, 0.1, 0.15],
                       'max_depth': [3, 5, 7],
                       'subsample': [0.8, 0.9, 1.0]
                   }
               },
               'neural_network': {
                   'model': MLPRegressor(random_state=42, max_iter=1000),
                   'params': {
                       'hidden_layer_sizes': [(100,), (100, 50), (200, 100)],
                       'alpha': [0.0001, 0.001, 0.01],
                       'learning_rate': ['constant', 'adaptive']
                   }
               }
           }
           
           best_score = float('inf')
           best_model_name = None
           
           # Train each model
           for model_name, config in model_configs.items():
               self.logger.info(f"Training {model_name}")
               
               # Hyperparameter tuning
               grid_search = GridSearchCV(
                   config['model'],
                   config['params'],
                   cv=5,
                   scoring='neg_mean_squared_error',
                   n_jobs=-1,
                   verbose=1
               )
               
               grid_search.fit(X_train, y_train)
               
               # Evaluate on test set
               best_model = grid_search.best_estimator_
               y_pred = best_model.predict(X_test)
               
               mse = mean_squared_error(y_test, y_pred)
               mae = mean_absolute_error(y_test, y_pred)
               r2 = r2_score(y_test, y_pred)
               
               self.models[model_name] = {
                   'model': best_model,
                   'mse': mse,
                   'mae': mae,
                   'r2': r2,
                   'best_params': grid_search.best_params_
               }
               
               self.logger.info(f"{model_name} - MSE: {mse:.4f}, MAE: {mae:.4f}, R2: {r2:.4f}")
               
               # Track best model
               if mse < best_score:
                   best_score = mse
                   best_model_name = model_name
                   self.best_model = best_model
                   
               # Log to MLflow
               with mlflow.start_run(run_name=f"{model_name}_training"):
                   mlflow.log_params(grid_search.best_params_)
                   mlflow.log_metrics({
                       'mse': mse,
                       'mae': mae,
                       'r2': r2
                   })
                   mlflow.sklearn.log_model(best_model, f"model_{model_name}")
                   
           self.logger.info(f"Best model: {best_model_name} with MSE: {best_score:.4f}")
           
           # Feature importance analysis
           if hasattr(self.best_model, 'feature_importances_'):
               self.feature_importance = pd.DataFrame({
                   'feature': X.columns,
                   'importance': self.best_model.feature_importances_
               }).sort_values('importance', ascending=False)
               
               self.logger.info("Top 10 most important features:")
               for _, row in self.feature_importance.head(10).iterrows():
                   self.logger.info(f"  {row['feature']}: {row['importance']:.4f}")
                   
           return self.best_model
           
       def evaluate_model(self, model, X_test, y_test):
           """Comprehensive model evaluation"""
           y_pred = model.predict(X_test)
           
           metrics = {
               'mse': mean_squared_error(y_test, y_pred),
               'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
               'mae': mean_absolute_error(y_test, y_pred),
               'r2': r2_score(y_test, y_pred),
               'mape': np.mean(np.abs((y_test - y_pred) / y_test)) * 100
           }
           
           # Accuracy within time windows
           accuracy_1min = np.mean(np.abs(y_test - y_pred) <= 1)
           accuracy_2min = np.mean(np.abs(y_test - y_pred) <= 2)
           accuracy_5min = np.mean(np.abs(y_test - y_pred) <= 5)
           
           metrics.update({
               'accuracy_within_1min': accuracy_1min,
               'accuracy_within_2min': accuracy_2min,
               'accuracy_within_5min': accuracy_5min
           })
           
           return metrics
           
       def save_model(self, model, model_name, version):
           """Save trained model with metadata"""
           model_path = f"models/{model_name}_v{version}.joblib"
           
           model_metadata = {
               'model': model,
               'feature_importance': self.feature_importance,
               'training_date': datetime.now(),
               'version': version,
               'config': self.config
           }
           
           joblib.dump(model_metadata, model_path)
           self.logger.info(f"Model saved to {model_path}")
           
           return model_path
   ```

5. **Build Model Evaluation Framework** (2 days)
   ```python
   # ml/evaluation/ModelEvaluator.py
   import numpy as np
   import pandas as pd
   import matplotlib.pyplot as plt
   import seaborn as sns
   from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
   import logging
   
   class ModelEvaluator:
       def __init__(self):
           self.logger = logging.getLogger(__name__)
           
       def comprehensive_evaluation(self, model, X_test, y_test, feature_names=None):
           """Comprehensive model evaluation with multiple metrics"""
           y_pred = model.predict(X_test)
           
           # Basic metrics
           metrics = self.calculate_basic_metrics(y_test, y_pred)
           
           # Time-based accuracy
           time_accuracy = self.calculate_time_accuracy(y_test, y_pred)
           
           # Error distribution analysis
           error_analysis = self.analyze_error_distribution(y_test, y_pred)
           
           # Feature importance (if available)
           feature_importance = self.get_feature_importance(model, feature_names)
           
           # Prediction confidence
           confidence_analysis = self.analyze_prediction_confidence(model, X_test, y_test)
           
           return {
               'basic_metrics': metrics,
               'time_accuracy': time_accuracy,
               'error_analysis': error_analysis,
               'feature_importance': feature_importance,
               'confidence_analysis': confidence_analysis
           }
           
       def calculate_basic_metrics(self, y_true, y_pred):
           """Calculate basic regression metrics"""
           return {
               'mse': mean_squared_error(y_true, y_pred),
               'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
               'mae': mean_absolute_error(y_true, y_pred),
               'r2': r2_score(y_true, y_pred),
               'mape': np.mean(np.abs((y_true - y_pred) / y_true)) * 100,
               'median_error': np.median(np.abs(y_true - y_pred))
           }
           
       def calculate_time_accuracy(self, y_true, y_pred):
           """Calculate accuracy within specific time windows"""
           errors = np.abs(y_true - y_pred)
           
           return {
               'within_30sec': np.mean(errors <= 0.5),
               'within_1min': np.mean(errors <= 1.0),
               'within_2min': np.mean(errors <= 2.0),
               'within_3min': np.mean(errors <= 3.0),
               'within_5min': np.mean(errors <= 5.0),
               'within_10min': np.mean(errors <= 10.0)
           }
           
       def analyze_error_distribution(self, y_true, y_pred):
           """Analyze the distribution of prediction errors"""
           errors = y_pred - y_true
           abs_errors = np.abs(errors)
           
           return {
               'mean_error': np.mean(errors),
               'std_error': np.std(errors),
               'error_percentiles': {
                   '25th': np.percentile(abs_errors, 25),
                   '50th': np.percentile(abs_errors, 50),
                   '75th': np.percentile(abs_errors, 75),
                   '90th': np.percentile(abs_errors, 90),
                   '95th': np.percentile(abs_errors, 95)
               },
               'max_error': np.max(abs_errors),
               'bias': np.mean(errors),
               'early_predictions': np.mean(errors < 0),
               'late_predictions': np.mean(errors > 0)
           }
           
       def generate_evaluation_report(self, evaluation_results, model_name):
           """Generate comprehensive evaluation report"""
           report = f"""
   # Model Evaluation Report: {model_name}
   
   ## Basic Performance Metrics
   - RMSE: {evaluation_results['basic_metrics']['rmse']:.2f} minutes
   - MAE: {evaluation_results['basic_metrics']['mae']:.2f} minutes
   - R²: {evaluation_results['basic_metrics']['r2']:.3f}
   - MAPE: {evaluation_results['basic_metrics']['mape']:.1f}%
   
   ## Time Window Accuracy
   - Within 1 minute: {evaluation_results['time_accuracy']['within_1min']:.1%}
   - Within 2 minutes: {evaluation_results['time_accuracy']['within_2min']:.1%}
   - Within 5 minutes: {evaluation_results['time_accuracy']['within_5min']:.1%}
   
   ## Error Analysis
   - Mean Error: {evaluation_results['error_analysis']['mean_error']:.2f} minutes
   - Error Std Dev: {evaluation_results['error_analysis']['std_error']:.2f} minutes
   - Median Error: {evaluation_results['basic_metrics']['median_error']:.2f} minutes
   - 95th Percentile Error: {evaluation_results['error_analysis']['error_percentiles']['95th']:.2f} minutes
   
   ## Prediction Bias
   - Early Predictions: {evaluation_results['error_analysis']['early_predictions']:.1%}
   - Late Predictions: {evaluation_results['error_analysis']['late_predictions']:.1%}
   - Bias: {evaluation_results['error_analysis']['bias']:.2f} minutes
   """
           
           return report
   ```

**Acceptance Criteria**:
- ✅ Clean, structured training data available from high-trust users
- ✅ Feature engineering improves prediction accuracy over baseline
- ✅ Models can be trained and deployed automatically
- ✅ Evaluation metrics track improvement over time (target: 85% within 3 minutes)
- ✅ Data pipeline handles real-time updates efficiently
- ✅ Model versioning and experiment tracking implemented

---

---

### 🟡 MEDIUM-002: Neural Network Implementation
**Priority**: MEDIUM  
**Estimate**: 12 days  
**Owner**: ML Engineer + Backend Developer  
**Dependencies**: MEDIUM-001  
**Blocks**: Phase 5 advanced analytics

#### Detailed Subtasks

1. **Neural Network Architecture Design** (2 days)
   ```python
   # ml/models/arrival_prediction_network.py
   import tensorflow as tf
   from tensorflow.keras import layers, Model
   import numpy as np
   
   class ArrivalPredictionNetwork:
       def __init__(self, input_features=15, sequence_length=10):
           self.input_features = input_features
           self.sequence_length = sequence_length
           self.model = self._build_network()
       
       def _build_network(self):
           # Input layers for different feature types
           route_input = layers.Input(shape=(self.input_features,), name='route_features')
           temporal_input = layers.Input(shape=(self.sequence_length, 8), name='temporal_features')
           social_input = layers.Input(shape=(5,), name='social_features')
           
           # Route feature processing
           route_dense = layers.Dense(64, activation='relu')(route_input)
           route_dropout = layers.Dropout(0.2)(route_dense)
           route_processed = layers.Dense(32, activation='relu')(route_dropout)
           
           # Temporal sequence processing (LSTM for time patterns)
           temporal_lstm = layers.LSTM(64, return_sequences=True)(temporal_input)
           temporal_attention = layers.Attention()([temporal_lstm, temporal_lstm])
           temporal_pooled = layers.GlobalAveragePooling1D()(temporal_attention)
           temporal_processed = layers.Dense(32, activation='relu')(temporal_pooled)
           
           # Social credibility processing
           social_dense = layers.Dense(16, activation='relu')(social_input)
           social_processed = layers.Dense(8, activation='relu')(social_dense)
           
           # Feature fusion
           combined = layers.Concatenate()([
               route_processed, 
               temporal_processed, 
               social_processed
           ])
           
           # Final prediction layers
           fusion_layer = layers.Dense(64, activation='relu')(combined)
           fusion_dropout = layers.Dropout(0.3)(fusion_layer)
           prediction_layer = layers.Dense(32, activation='relu')(fusion_dropout)
           
           # Multi-output: arrival time + confidence
           arrival_output = layers.Dense(1, activation='linear', name='arrival_time')(prediction_layer)
           confidence_output = layers.Dense(1, activation='sigmoid', name='confidence_score')(prediction_layer)
           
           model = Model(
               inputs=[route_input, temporal_input, social_input],
               outputs=[arrival_output, confidence_output]
           )
           
           return model
   ```

2. **Real-time Inference API** (3 days)
   ```python
   # ml/inference/realtime_predictor.py
   import tensorflow as tf
   import numpy as np
   from typing import Dict, List, Tuple
   import redis
   import json
   from datetime import datetime, timedelta
   
   class RealTimePredictionService:
       def __init__(self, model_path: str, redis_client: redis.Redis):
           self.model = tf.keras.models.load_model(model_path)
           self.redis = redis_client
           self.feature_cache_ttl = 300  # 5 minutes
           
       async def predict_arrival_time(self, route_id: str, stop_id: str, 
                                    current_location: Dict) -> Dict:
           """
           Main prediction endpoint for real-time arrival predictions
           """
           try:
               # Gather features from multiple sources
               features = await self._gather_prediction_features(
                   route_id, stop_id, current_location
               )
               
               # Generate prediction
               arrival_time, confidence = self._generate_prediction(features)
               
               # Apply community corrections
               corrected_time = await self._apply_community_corrections(
                   route_id, stop_id, arrival_time
               )
               
               # Cache result
               await self._cache_prediction(route_id, stop_id, {
                   'predicted_arrival': corrected_time,
                   'confidence': confidence,
                   'timestamp': datetime.now().isoformat()
               })
               
               return {
                   'route_id': route_id,
                   'stop_id': stop_id,
                   'predicted_arrival_time': corrected_time,
                   'confidence_score': float(confidence),
                   'prediction_timestamp': datetime.now().isoformat(),
                   'model_version': self._get_model_version()
               }
               
           except Exception as e:
               return {
                   'error': str(e),
                   'fallback_prediction': await self._get_fallback_prediction(route_id, stop_id)
               }
       
       def _generate_prediction(self, features: Dict) -> Tuple[datetime, float]:
           """
           Core ML prediction logic
           """
           # Prepare input tensors
           route_features = np.array([features['route']]).astype(np.float32)
           temporal_features = np.array([features['temporal']]).astype(np.float32)
           social_features = np.array([features['social']]).astype(np.float32)
           
           # Model inference
           predictions = self.model.predict([
               route_features, 
               temporal_features, 
               social_features
           ], verbose=0)
           
           arrival_minutes = predictions[0][0][0]  # Arrival time output
           confidence = predictions[1][0][0]       # Confidence output
           
           # Convert to actual datetime
           predicted_arrival = datetime.now() + timedelta(minutes=float(arrival_minutes))
           
           return predicted_arrival, confidence
   ```

3. **Model Versioning System** (2 days)
4. **A/B Testing Framework** (2.5 days)
5. **Performance Monitoring** (2.5 days)

**Acceptance Criteria**:
- Neural network achieves <2 minute prediction accuracy on test data
- Real-time inference responds under 100ms
- Model versioning allows safe rollbacks
- A/B testing framework enables controlled model comparisons
- Performance monitoring detects degradation automatically
- System handles 1000+ concurrent predictions

---

## PHASE 5: SCALE & POLISH (Months 6-8)
*Goal: Multi-city expansion and advanced features*

### 🟡 MEDIUM-003: Multi-City Infrastructure
**Priority**: MEDIUM  
**Estimate**: 10 days  
**Owner**: Backend Developer + DevOps Engineer  
**Dependencies**: All Phase 2-4 tasks  
**Blocks**: Phase 6 expansion tasks

#### Detailed Subtasks

1. **City Configuration System** (2 days)
   ```javascript
   // services/cityConfigService.js
   class CityConfigurationService {
     constructor(database) {
       this.db = database;
       this.cityConfigs = new Map();
     }
     
     async initializeCity(cityData) {
       const cityConfig = {
         id: cityData.id,
         name: cityData.name,
         timezone: cityData.timezone,
         coordinates: cityData.centerCoordinates,
         transportTypes: cityData.supportedTransports,
         routingConfig: {
           provider: cityData.mapProvider || 'openrouteservice',
           apiKeys: cityData.apiKeys,
           bounds: cityData.geographicBounds
         },
         mlConfig: {
           trafficPatterns: cityData.trafficPatterns,
           weatherApiKey: cityData.weatherApiKey,
           modelVariant: cityData.modelVariant || 'standard'
         },
         socialConfig: {
           verificationThresholds: cityData.verificationThresholds,
           achievementCriteria: cityData.achievements,
           localLanguage: cityData.language
         },
         businessRules: {
           maxWalkingDistance: cityData.maxWalkingDistance || 1000,
           predictionWindow: cityData.predictionWindow || 60,
           trackingAccuracy: cityData.trackingAccuracy || 'high'
         }
       };
       
       // Store in database
       await this.db.cities.create(cityConfig);
       
       // Cache configuration
       this.cityConfigs.set(cityData.id, cityConfig);
       
       return cityConfig;
     }
   }
   ```

2. **Geographic Load Balancing** (2.5 days)
3. **City Onboarding Workflow** (2.5 days)
4. **City-Specific Analytics** (1.5 days)
5. **City Management Admin Panel** (1.5 days)

**Acceptance Criteria**:
- System supports multiple cities efficiently
- City-specific configurations isolated properly
- Performance remains consistent across cities
- Easy onboarding process for new cities
- Admin panel provides comprehensive city management
- Geographic load balancing routes requests appropriately

### 🟡 MEDIUM-004: Government API Integrations
**Priority**: MEDIUM  
**Estimate**: 8 days  
**Owner**: Backend Developer + Integration Specialist  
**Dependencies**: MEDIUM-003  
**Blocks**: Enhanced prediction accuracy

#### Detailed Subtasks

1. **API Integration Framework** (2 days)
2. **GTFS Data Processing** (2 days)
3. **Real-time Feed Integration** (2 days)
4. **Data Quality Monitoring** (1.5 days)
5. **Fallback Mechanisms** (0.5 days)

**Acceptance Criteria**:
- Successfully integrates with at least 2 government transport APIs
- GTFS data processed and synchronized daily
- Real-time updates improve prediction accuracy by 15%
- Fallback to crowdsourced data when APIs unavailable

---

## PHASE 6: PLATFORM EXPANSION (Months 8-12)
*Goal: Support multiple transport types and advanced features*

### 🟢 LOW-001: Multi-Modal Transport Support
**Priority**: LOW  
**Estimate**: 20 days  
**Owner**: Full-stack Team  
**Dependencies**: All previous phases  
**Blocks**: Multi-modal journey planning

#### Detailed Subtasks

1. **Transport Abstraction Enhancement** (3 days)
   ```javascript
   // services/multiModalTransportService.js
   class MultiModalTransportService {
     constructor(dependencies) {
       this.transportProviders = new Map();
       this.journeyPlanner = dependencies.journeyPlanner;
       this.mlService = dependencies.mlService;
       this.routingService = dependencies.routingService;
       
       // Register transport providers
       this.registerProvider('bus', new BusTransportProvider());
       this.registerProvider('train', new TrainTransportProvider());
       this.registerProvider('metro', new MetroTransportProvider());
       this.registerProvider('auto', new AutoRickshawProvider());
     }
     
     async planMultiModalJourney(origin, destination, preferences = {}) {
       // Get all possible transport combinations
       const availableTransports = await this.getAvailableTransports(origin, destination);
       
       // Generate journey options (single mode + multi-modal)
       const journeyOptions = [];
       
       // Single mode journeys
       for (const transport of availableTransports) {
         const singleModeJourney = await this.planSingleModeJourney(
           origin, destination, transport, preferences
         );
         if (singleModeJourney) {
           journeyOptions.push(singleModeJourney);
         }
       }
       
       // Multi-modal combinations
       if (preferences.allowMultiModal !== false) {
         const multiModalJourneys = await this.generateMultiModalOptions(
           origin, destination, availableTransports, preferences
         );
         journeyOptions.push(...multiModalJourneys);
       }
       
       // Rank options by user preferences
       const rankedOptions = this.rankJourneyOptions(journeyOptions, preferences);
       
       return {
         origin,
         destination,
         options: rankedOptions.slice(0, 5), // Top 5 options
         metadata: {
           searchTime: new Date(),
           criteriaUsed: preferences,
           totalOptionsGenerated: journeyOptions.length
         }
       };
     }
   }
   ```

2. **Train-Specific Implementation** (4 days)
3. **Metro System Integration** (4 days)
4. **Auto-rickshaw Tracking** (3 days)
5. **Cross-Modal Predictions** (3 days)
6. **Journey Planning Interface** (3 days)

**Acceptance Criteria**:
- Multiple transport types work seamlessly
- Journey planning across transport modes
- Unified prediction accuracy maintained
- User experience remains intuitive

### 🟢 LOW-002: Advanced Mobile Features
**Priority**: LOW  
**Estimate**: 15 days  
**Owner**: Mobile Developer + Frontend Developer  
**Dependencies**: LOW-001  
**Blocks**: None

#### Detailed Subtasks

1. **Offline Journey Planning** (4 days)
2. **Push Notification System** (3 days)
3. **Widget/Quick Actions** (3 days)
4. **Accessibility Improvements** (2.5 days)
5. **Performance Optimization** (2.5 days)

**Acceptance Criteria**:
- App works offline for basic journey planning
- Push notifications for arrival updates
- Home screen widgets for quick access
- Full accessibility compliance
- App launches under 2 seconds

---

## IMPLEMENTATION SUMMARY

### Total Effort Estimation
- **Phase 1 (Foundation)**: 19 days
- **Phase 2 (Bus Tracking MVP)**: 30 days
- **Phase 3 (Social Credibility)**: 23 days
- **Phase 4 (AI/ML Predictions)**: 26 days
- **Phase 5 (Scale & Polish)**: 18 days
- **Phase 6 (Platform Expansion)**: 35 days

**Total Implementation Time**: ~151 days (approximately 7.5 months with 1 developer)

### Recommended Team Structure
- **1 Tech Lead** (architecture oversight)
- **2 Full-stack Developers** (feature development)
- **1 ML Engineer** (prediction algorithms)
- **1 Data Engineer** (data pipeline and analytics)
- **1 Mobile Developer** (mobile optimization)
- **0.5 DevOps Engineer** (infrastructure scaling)

### Success Metrics Targets
- **Month 6**: 10,000+ active users, 80% route coverage
- **Month 8**: 85% prediction accuracy, 75+ average social score
- **Month 12**: 50K users, 5 cities, $50K ARR

This completes the comprehensive task breakdown for all phases of the Public Transit Tracker implementation. Each task includes detailed code examples, acceptance criteria, and technical specifications to ensure successful implementation across all development phases.