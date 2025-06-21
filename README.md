# Public Ride Service Platform

A comprehensive transport coordination platform that helps users find, share, and track various modes of transportation in real-time, with community-driven features and social scoring.

## 🚀 Current Status: Phase 4 - Scenario-Driven Design
**Latest Update:** 2025-01-21 - Moving from transport-mode-first to user-scenario-first approach

📚 **Full Documentation:**
- [Product Evolution & Changelog](./PRODUCT_EVOLUTION.md) - Complete history of design iterations
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Current development roadmap

## Tech Stack

**Backend:**
- Node.js + Express.js
- SQLite database
- Dependencies: cors, helmet, morgan, uuid

**Frontend:**
- React 18 + Vite
- OpenStreetMap + Leaflet for maps
- Modern ES6+ JavaScript

**Development:**
- nodemon for backend development
- Vite dev server for frontend

## Project Structure

```
├── backend/                 # Express API server
│   ├── server.js           # Main server file
│   ├── database.js         # SQLite setup & models
│   ├── package.json        # Backend dependencies
│   └── rideshare.db        # SQLite database (auto-created)
├── frontend/               # React application
│   ├── src/                # React components
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
├── TASKS.md                # Development tasks
├── ride-share-prd.md       # Product requirements
└── README.md               # This file
```

## Database Schema

**rides table:**
- id, rider_name, destination
- current_lat/lng, destination_lat/lng
- status, created_at

**requests table:**
- id, passenger_name
- pickup_lat/lng, destination_lat/lng
- max_walk_distance, status, created_at

**matches table:**
- id, ride_id, request_id
- meeting_lat/lng, status, created_at

## Getting Started

### Environment Setup

1. **Backend Environment**
```bash
cd backend
cp .env.example .env
# Edit .env file with your settings
```

2. **Frontend Environment**
```bash
cd frontend
cp .env.example .env
# Maps work out-of-the-box with OpenStreetMap - no API keys needed!
```

### Backend Setup
```bash
cd backend
npm install
npm run dev          # Development with nodemon
# OR
npm start           # Production
```

Backend runs on: http://localhost:3001

### Frontend Setup
```bash
cd frontend
npm install
npm run dev         # Development server
```

Frontend runs on: http://localhost:5173

## API Endpoints

- `GET /health` - Health check
- `GET /api/rides` - List all rides
- `POST /api/rides` - Create a ride
- `GET /api/requests` - List all requests  
- `POST /api/requests` - Create a ride request

## Testing

✅ **Backend tested:**
- Server starts on port 3001
- Health endpoint responds: `{"status":"ok","timestamp":"..."}`
- API endpoints return expected JSON

✅ **Frontend tested:**
- Vite development server starts
- React application loads

## Features Completed ✅

1. ✅ Full CRUD operations for rides/requests
2. ✅ Geo-matching algorithm with direction-based filtering
3. ✅ Complete React UI with rider/passenger flows
4. ✅ Interactive OpenStreetMap integration with route polylines
5. ✅ Real-time notifications and polling
6. ✅ Smart coordinate input with paste support
7. ✅ Environment-based configuration

## Ready for Production! 🚀

The MVP is feature-complete and ready for deployment.

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 3001)
- `DATABASE_PATH` - SQLite database path
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT signing secret
- `LOG_LEVEL` - Logging level

### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_ENABLE_MAPS` - Enable/disable maps (true/false)
- `VITE_POLLING_INTERVAL` - Real-time polling interval (ms)
- `VITE_DEFAULT_WALK_DISTANCE` - Default walking distance
- `VITE_DEFAULT_MAP_CENTER_LAT/LNG` - Default map center coordinates
- `VITE_ORS_API_KEY` - OpenRouteService API key (optional, for road routes)

## Development Notes

- All packages installed locally (not globally)
- SQLite database auto-created on first run
- Environment-based configuration for all settings
- CORS enabled for frontend-backend communication
- Security headers via helmet middleware
- Maps powered by OpenStreetMap (no API keys required)
- Interactive maps with click-to-set coordinates
- Route polylines showing travel paths (straight line fallback without API key)