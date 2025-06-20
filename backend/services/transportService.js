const { db } = require('../database');

class TransportService {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Register transport providers
    this.registerProvider('bus', new BusTransportProvider());
    this.registerProvider('train', new TrainTransportProvider());
    this.registerProvider('metro', new MetroTransportProvider());
    this.registerProvider('auto', new AutoRickshawProvider());
  }

  registerProvider(type, provider) {
    this.providers.set(type, provider);
  }

  getProvider(type) {
    return this.providers.get(type);
  }

  async getAllTransportTypes() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM transport_types ORDER BY name`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getRoutesByTransportType(transportTypeId, cityId = 'hyderabad') {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT tr.*, tt.name as transport_type_name, tt.icon 
        FROM transport_routes tr
        JOIN transport_types tt ON tr.transport_type_id = tt.id
        WHERE tr.transport_type_id = ? AND tr.city_id = ? AND tr.is_active = 1
        ORDER BY tr.route_number
      `, [transportTypeId, cityId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getRouteStops(routeId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM transport_stops 
        WHERE route_id = ? 
        ORDER BY stop_order
      `, [routeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createRoute(routeData) {
    return new Promise((resolve, reject) => {
      const { transport_type_id, route_number, route_name, start_point, end_point, city_id } = routeData;
      
      db.run(`
        INSERT INTO transport_routes 
        (transport_type_id, route_number, route_name, start_point, end_point, city_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [transport_type_id, route_number, route_name, start_point, end_point, city_id || 'hyderabad'], 
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...routeData });
      });
    });
  }

  async addStopToRoute(routeId, stopData) {
    return new Promise((resolve, reject) => {
      const { stop_name, latitude, longitude, stop_order, estimated_time_minutes, is_major_stop } = stopData;
      
      db.run(`
        INSERT INTO transport_stops 
        (route_id, stop_name, latitude, longitude, stop_order, estimated_time_minutes, is_major_stop)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [routeId, stop_name, latitude, longitude, stop_order, estimated_time_minutes || null, is_major_stop || 0],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, route_id: routeId, ...stopData });
      });
    });
  }

  async startTracking(userId, routeId, initialLocation) {
    return new Promise((resolve, reject) => {
      const { latitude, longitude } = initialLocation;
      
      db.run(`
        INSERT INTO live_tracking 
        (user_id, route_id, current_lat, current_lng, is_active)
        VALUES (?, ?, ?, ?, 1)
      `, [userId, routeId, latitude, longitude], function(err) {
        if (err) reject(err);
        else resolve({ 
          tracking_id: this.lastID, 
          user_id: userId, 
          route_id: routeId, 
          started_at: new Date() 
        });
      });
    });
  }

  async updateTrackingLocation(trackingId, location) {
    return new Promise((resolve, reject) => {
      const { latitude, longitude, speed, direction } = location;
      
      db.run(`
        UPDATE live_tracking 
        SET current_lat = ?, current_lng = ?, speed = ?, direction = ?, last_update = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `, [latitude, longitude, speed || 0, direction || 0, trackingId], function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes > 0 });
      });
    });
  }

  async stopTracking(trackingId) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE live_tracking 
        SET is_active = 0 
        WHERE id = ?
      `, [trackingId], function(err) {
        if (err) reject(err);
        else resolve({ stopped: this.changes > 0 });
      });
    });
  }

  async getLiveTracking(routeId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT lt.*, u.username, tr.route_number, tr.route_name
        FROM live_tracking lt
        JOIN users u ON lt.user_id = u.id
        JOIN transport_routes tr ON lt.route_id = tr.id
        WHERE lt.route_id = ? AND lt.is_active = 1
        ORDER BY lt.last_update DESC
      `, [routeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

// Base class for transport providers
class BaseTransportProvider {
  constructor(type) {
    this.type = type;
  }

  async validateRoute(routeData) {
    // Override in specific implementations
    return { isValid: true };
  }

  async calculateETA(currentLocation, targetStop, routeData) {
    // Basic distance-based calculation
    // Override in specific implementations for better accuracy
    const distance = this.calculateDistance(currentLocation, targetStop);
    const averageSpeed = 30; // km/h default
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = timeInHours * 60;
    
    return {
      eta_minutes: Math.round(timeInMinutes),
      confidence: 0.6,
      method: 'distance_based'
    };
  }

  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(point2.latitude - point1.latitude);
    const dLon = this.deg2rad(point2.longitude - point1.longitude);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.latitude)) * Math.cos(this.deg2rad(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

// Bus-specific transport provider
class BusTransportProvider extends BaseTransportProvider {
  constructor() {
    super('bus');
  }

  async validateRoute(routeData) {
    // Bus-specific validation
    if (!routeData.route_number || !routeData.start_point || !routeData.end_point) {
      return { isValid: false, error: 'Missing required bus route fields' };
    }
    return { isValid: true };
  }

  async calculateETA(currentLocation, targetStop, routeData) {
    // Bus-specific ETA calculation considering traffic
    const baseETA = await super.calculateETA(currentLocation, targetStop, routeData);
    
    // Add traffic factor for buses
    const currentHour = new Date().getHours();
    let trafficMultiplier = 1.0;
    
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      trafficMultiplier = 1.5; // Peak hours
    } else if (currentHour >= 10 && currentHour <= 16) {
      trafficMultiplier = 1.2; // Moderate traffic
    }
    
    return {
      eta_minutes: Math.round(baseETA.eta_minutes * trafficMultiplier),
      confidence: 0.7,
      method: 'bus_with_traffic',
      traffic_factor: trafficMultiplier
    };
  }
}

// Train-specific transport provider
class TrainTransportProvider extends BaseTransportProvider {
  constructor() {
    super('train');
  }

  async calculateETA(currentLocation, targetStop, routeData) {
    // Train-specific ETA calculation based on schedule
    const baseETA = await super.calculateETA(currentLocation, targetStop, routeData);
    
    // Trains are more predictable but can have delays
    return {
      eta_minutes: Math.round(baseETA.eta_minutes * 1.1), // Slight delay factor
      confidence: 0.8,
      method: 'train_schedule_based'
    };
  }
}

// Metro-specific transport provider
class MetroTransportProvider extends BaseTransportProvider {
  constructor() {
    super('metro');
  }

  async calculateETA(currentLocation, targetStop, routeData) {
    // Metro has high frequency and predictability
    const baseETA = await super.calculateETA(currentLocation, targetStop, routeData);
    
    return {
      eta_minutes: Math.round(baseETA.eta_minutes * 0.9), // Faster due to dedicated tracks
      confidence: 0.9,
      method: 'metro_high_frequency'
    };
  }
}

// Auto-rickshaw specific provider
class AutoRickshawProvider extends BaseTransportProvider {
  constructor() {
    super('auto');
  }

  async calculateETA(currentLocation, targetStop, routeData) {
    // Auto-rickshaws are flexible but affected by traffic
    const baseETA = await super.calculateETA(currentLocation, targetStop, routeData);
    
    const currentHour = new Date().getHours();
    let trafficMultiplier = 1.0;
    
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      trafficMultiplier = 1.8; // Higher impact during peak hours
    } else if (currentHour >= 10 && currentHour <= 16) {
      trafficMultiplier = 1.3;
    }
    
    return {
      eta_minutes: Math.round(baseETA.eta_minutes * trafficMultiplier),
      confidence: 0.6,
      method: 'auto_with_high_traffic_sensitivity',
      traffic_factor: trafficMultiplier
    };
  }
}

module.exports = { 
  TransportService, 
  BaseTransportProvider,
  BusTransportProvider,
  TrainTransportProvider,
  MetroTransportProvider,
  AutoRickshawProvider
};