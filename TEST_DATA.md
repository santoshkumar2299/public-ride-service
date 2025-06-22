# 🧪 TEST DATA & USER SCENARIOS

## 📊 Sample Users

### **Primary Test Users**

```json
{
  "users": [
    {
      "id": 1,
      "username": "commuter_maya",
      "email": "maya@example.com",
      "password": "test123",
      "created_at": "2024-01-15T09:00:00Z",
      "preferences": {
        "transport_modes": ["bus", "metro", "walking"],
        "accessibility": ["wheelchair_access"],
        "notifications": true,
        "location_sharing": true
      },
      "profile": "Daily commuter, uses public transport, wheelchair user",
      "usage_pattern": "Peak hours (8-9 AM, 6-7 PM)"
    },
    {
      "id": 2,
      "username": "student_alex",
      "email": "alex@university.edu",
      "password": "test123",
      "created_at": "2024-02-01T14:30:00Z",
      "preferences": {
        "transport_modes": ["bus", "auto_rickshaw", "cycling"],
        "accessibility": [],
        "notifications": true,
        "location_sharing": false
      },
      "profile": "University student, budget-conscious, flexible schedule",
      "usage_pattern": "Off-peak hours, price-sensitive"
    },
    {
      "id": 3,
      "username": "senior_raj",
      "email": "raj@example.com",
      "password": "test123",
      "created_at": "2024-01-20T11:15:00Z",
      "preferences": {
        "transport_modes": ["bus", "auto_rickshaw"],
        "accessibility": ["low_floor", "audio_announcements"],
        "notifications": true,
        "location_sharing": true
      },
      "profile": "Senior citizen, needs accessibility features, frequent traveler",
      "usage_pattern": "Mid-day travel, slower pace"
    },
    {
      "id": 4,
      "username": "tech_priya",
      "email": "priya@tech.com",
      "password": "test123",
      "created_at": "2024-01-10T16:45:00Z",
      "preferences": {
        "transport_modes": ["metro", "bus", "ride_share"],
        "accessibility": [],
        "notifications": true,
        "location_sharing": true
      },
      "profile": "Tech professional, values speed and convenience",
      "usage_pattern": "Mixed hours, tech-savvy"
    }
  ]
}
```

## 🗺️ Sample Locations (Bangalore-focused)

### **Key Transit Hubs**

```json
{
  "locations": [
    {
      "id": "majestic_bus_station",
      "name": "Kempegowda Bus Station (Majestic)",
      "coordinates": [12.9767, 77.5717],
      "type": "major_hub",
      "transport_types": ["bus", "metro"],
      "routes": ["102", "156K", "500", "BMTC Volvo"],
      "crowding": "high",
      "accessibility": true
    },
    {
      "id": "mg_road_metro",
      "name": "MG Road Metro Station",
      "coordinates": [12.9759, 77.6055],
      "type": "metro_station",
      "transport_types": ["metro", "bus", "auto_rickshaw"],
      "routes": ["Purple Line", "201", "218"],
      "crowding": "high",
      "accessibility": true
    },
    {
      "id": "koramangala_bus_stop",
      "name": "Koramangala 5th Block",
      "coordinates": [12.9352, 77.6192],
      "type": "bus_stop",
      "transport_types": ["bus", "auto_rickshaw"],
      "routes": ["201", "218", "335E"],
      "crowding": "medium",
      "accessibility": false
    },
    {
      "id": "electronic_city",
      "name": "Electronic City Phase 1",
      "coordinates": [12.8456, 77.6603],
      "type": "tech_hub",
      "transport_types": ["bus", "metro"],
      "routes": ["500", "500K", "Purple Line"],
      "crowding": "high",
      "accessibility": true
    },
    {
      "id": "whitefield_itpl",
      "name": "Whitefield ITPL",
      "coordinates": [12.9891, 77.7417],
      "type": "tech_hub",
      "transport_types": ["bus", "metro"],
      "routes": ["500K", "G4", "Blue Line"],
      "crowding": "high",
      "accessibility": true
    }
  ]
}
```

## 🚌 Sample Transport Data

### **Live Transport Vehicles**

```json
{
  "live_transport": [
    {
      "id": "bus_102_001",
      "type": "bus",
      "route": "102",
      "current_location": [12.9716, 77.5946],
      "destination": "Shivajinagar",
      "capacity": 60,
      "current_occupancy": 45,
      "crowding_level": "medium",
      "eta_minutes": 8,
      "accessibility_features": ["low_floor", "wheelchair_space"]
    },
    {
      "id": "bus_156k_003",
      "type": "bus",
      "route": "156K",
      "current_location": [12.9352, 77.6192],
      "destination": "KR Market",
      "capacity": 40,
      "current_occupancy": 38,
      "crowding_level": "high",
      "eta_minutes": 12,
      "accessibility_features": ["audio_announcements"]
    },
    {
      "id": "auto_001",
      "type": "auto_rickshaw",
      "current_location": [12.9759, 77.6055],
      "available": true,
      "fare_estimate": "₹80-₹120",
      "rating": 4.2,
      "eta_minutes": 3
    },
    {
      "id": "metro_purple_01",
      "type": "metro",
      "line": "Purple Line",
      "current_station": "MG Road",
      "next_station": "Trinity",
      "eta_minutes": 2,
      "crowding_level": "medium",
      "accessibility_features": ["elevator", "tactile_guidance"]
    }
  ]
}
```

## 🎯 User Testing Scenarios

### **Scenario 1: Daily Commuter (Maya)**
**Goal**: Get from home to work during peak hours
- **Start**: Koramangala 5th Block
- **Destination**: Electronic City Phase 1
- **Time**: 8:30 AM (peak hour)
- **Constraints**: Wheelchair accessible transport only
- **Expected**: Bus route 500 with accessibility features

### **Scenario 2: Student Journey (Alex)**
**Goal**: Budget-friendly travel to university
- **Start**: Whitefield ITPL
- **Destination**: MG Road
- **Time**: 2:00 PM (off-peak)
- **Constraints**: Cost under ₹50
- **Expected**: Bus + Metro combination

### **Scenario 3: Emergency Transport (Priya)**
**Goal**: Quick emergency transport to hospital
- **Start**: Current GPS location
- **Destination**: Nearest hospital
- **Time**: Any
- **Constraints**: Fastest available option
- **Expected**: Auto-rickshaw or immediate transport

### **Scenario 4: Senior Citizen (Raj)**
**Goal**: Medical appointment with comfort
- **Start**: Majestic Bus Station
- **Destination**: Jayanagar 4th Block
- **Time**: 11:00 AM (off-peak)
- **Constraints**: Low-floor bus, audio announcements
- **Expected**: Accessible bus with senior-friendly features

### **Scenario 5: Community Reporting**
**Goal**: Report bus spot for community benefit
- **Action**: Spot bus #156K at Koramangala
- **Location**: GPS-enabled accurate reporting
- **Expected**: Successful report with credit rewards

## 🔧 Testing Tools & Automation

### **Recommended Headed Testing Tools**

#### **1. Playwright** ⭐ **RECOMMENDED**
```bash
npm install @playwright/test
```
**Pros**: 
- ✅ Multi-browser testing (Chrome, Firefox, Safari)
- ✅ Mobile device simulation
- ✅ GPS location mocking
- ✅ Screenshot/video recording
- ✅ Built-in assertions
- ✅ Network interception

**Setup Example**:
```javascript
// tests/e2e/user-journey.spec.js
import { test, expect } from '@playwright/test';

test('Maya commuter journey', async ({ page, context }) => {
  // Grant location permissions
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({
    latitude: 12.9352,
    longitude: 77.6192
  });
  
  await page.goto('http://localhost:5174');
  
  // Login as Maya
  await page.fill('[data-testid="username"]', 'commuter_maya');
  await page.fill('[data-testid="password"]', 'test123');
  await page.click('[data-testid="login-btn"]');
  
  // Test map interaction
  await page.click('[data-testid="map-pin"]');
  await page.click('[data-testid="find-transport"]');
  
  // Verify accessible transport options
  await expect(page.locator('[data-testid="wheelchair-accessible"]')).toBeVisible();
});
```

#### **2. Cypress**
```bash
npm install cypress --save-dev
```
**Pros**:
- ✅ Great debugging experience
- ✅ Time-travel debugging
- ✅ Visual testing
- ❌ Limited multi-browser support

#### **3. Selenium WebDriver**
**Pros**:
- ✅ Mature ecosystem
- ✅ Multi-language support
- ❌ More complex setup

### **Mobile Testing**

#### **Playwright Mobile**
```javascript
// Mobile device testing
const iPhone = devices['iPhone 12'];
test.use({
  ...iPhone,
  geolocation: { latitude: 12.9352, longitude: 77.6192 },
  permissions: ['geolocation']
});
```

#### **Browser Stack/Sauce Labs**
- Real device testing
- Cross-platform compatibility
- GPS location simulation

### **Location-Specific Testing**

#### **GPS Mocking**
```javascript
// Mock different Bangalore locations
const locations = {
  koramangala: { latitude: 12.9352, longitude: 77.6192 },
  mg_road: { latitude: 12.9759, longitude: 77.6055 },
  electronic_city: { latitude: 12.8456, longitude: 77.6603 }
};
```

## 🚀 Quick Test Setup

### **1. Install Playwright**
```bash
cd frontend
npm install @playwright/test
npx playwright install
```

### **2. Create Test File**
```bash
mkdir tests/e2e
# Copy sample test scenarios
```

### **3. Run Tests**
```bash
# Headed mode (visible browser)
npx playwright test --headed

# With UI mode
npx playwright test --ui

# Mobile simulation
npx playwright test --project=Mobile
```

### **4. Test Data Setup**
```bash
# Seed database with test users and transport data
node backend/seedTestData.js
```

## 📱 Test Coverage Areas

### **Core Features**
- [ ] User authentication (login/register)
- [ ] Map interaction and pin placement
- [ ] Location detection (GPS vs manual)
- [ ] Transport option display
- [ ] Route planning and selection
- [ ] Emergency transport scenarios
- [ ] Community bus reporting
- [ ] Profile management
- [ ] Accessibility features

### **Edge Cases**
- [ ] No GPS permission
- [ ] Offline mode
- [ ] Poor network conditions
- [ ] Invalid locations
- [ ] No transport available
- [ ] High traffic scenarios

### **Performance**
- [ ] Map loading times
- [ ] Search response times
- [ ] Large dataset handling
- [ ] Mobile performance

**🎯 Start with Playwright for comprehensive headed testing - it's the best tool for location-based mobile web apps!**