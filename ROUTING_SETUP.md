# Route Polylines Setup

## How It Works

The app now shows **polyline routes** between pickup and destination points!

## Route Types

✅ **Without API Key (Default):**
- Shows **straight line routes** (dashed lines)
- Works immediately, no setup required
- Good for understanding general direction

🗺️ **With OpenRouteService API Key (Optional):**
- Shows **actual road routes** (solid lines)
- Follows real roads and paths
- More accurate travel routes

## Setup OpenRouteService (Optional)

### Free API Key Setup:

1. **Sign up for OpenRouteService**
   - Go to https://openrouteservice.org/dev/#/signup
   - Create a free account (no credit card needed)

2. **Get your API key**
   - After signup, go to your dashboard
   - Copy your API key

3. **Add to your app**
   - Open `frontend/.env`
   - Add: `VITE_ORS_API_KEY=your_api_key_here`

### Free Tier Limits:

- **2,000 requests per day**
- **40 requests per minute**
- Perfect for MVP testing!

## Visual Features

### Route Colors:
- 🔵 **Blue routes** - Passenger journeys
- 🟢 **Green routes** - Rider main route  
- 🔴 **Red routes** - Available rides
- ⚪ **Dashed lines** - Straight line fallback

### Map Markers:
- 🚗 **Rider location** / Available rides
- 🚶 **Passenger pickup** locations
- 🎯 **Destination** points
- 📍 **Meeting points** for matches

## Alternative: Use Without Routes

The app works perfectly without any routing API:
- All functionality remains available
- Shows straight lines for direction reference
- Zero external dependencies

Routes are a visual enhancement, not a requirement!