import { useState, useEffect } from 'react';

/**
 * Map layer showing community contributions
 * Integrates with LiveCityMap to show bus spots, verifications, and helper locations
 */
function ContributionMapLayer({ 
  bounds, 
  showContributions = true, 
  userId = null, // Show only specific user's contributions
  timeRange = '7d' // 1d, 7d, 30d, all
}) {
  const [busSpots, setBusSpots] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showContributions && bounds) {
      fetchContributions();
    }
  }, [bounds, showContributions, userId, timeRange]);

  const fetchContributions = async () => {
    setIsLoading(true);
    try {
      // Fetch bus spot reports with contributor info
      const spotsResponse = await fetch(`/api/reports/bus-spots?${new URLSearchParams({
        bounds: JSON.stringify(bounds),
        minutes_ago: timeRange === '1d' ? 1440 : timeRange === '7d' ? 10080 : timeRange === '30d' ? 43200 : 525600,
        include_contributor: true,
        user_id: userId || ''
      })}`);
      
      if (spotsResponse.ok) {
        const spotsData = await spotsResponse.json();
        setBusSpots(spotsData.spot_reports || []);
      }

      // Fetch active helpers at bus stops
      const helpersResponse = await fetch(`/api/bus-stop/nearby-helpers?${new URLSearchParams({
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2,
        radius: 5000,
        user_id: userId || ''
      })}`);
      
      if (helpersResponse.ok) {
        const helpersData = await helpersResponse.json();
        setHelpers(helpersData.helpers || []);
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContributionMarkers = () => {
    const markers = [];

    // Bus spot markers
    busSpots.forEach(spot => {
      markers.push({
        id: `spot-${spot.id}`,
        latitude: spot.latitude,
        longitude: spot.longitude,
        type: 'bus-spot',
        title: `Bus ${spot.bus_number}`,
        description: `Spotted by ${spot.reporter_name || 'Anonymous'}`,
        icon: '🚌',
        color: spot.is_verified ? '#4CAF50' : '#FF9800',
        contributor: spot.reporter_name,
        timestamp: spot.reported_at,
        hasPhoto: !!spot.photo_path,
        confidence: spot.confidence_level,
        verificationCount: spot.verification_count || 0
      });
    });

    // Helper markers
    helpers.forEach(helper => {
      markers.push({
        id: `helper-${helper.id}`,
        latitude: helper.bus_stop_lat,
        longitude: helper.bus_stop_lng,
        type: 'helper',
        title: `Helper at ${helper.bus_stop_name}`,
        description: `${helper.username} helping travelers`,
        icon: '🤝',
        color: '#2196F3',
        contributor: helper.username,
        helpingFor: helper.waiting_for_buses,
        rating: helper.average_rating,
        totalHelped: helper.total_people_helped
      });
    });

    return markers;
  };

  const getContributionStats = () => {
    const totalSpots = busSpots.length;
    const verifiedSpots = busSpots.filter(spot => spot.is_verified).length;
    const activeHelpers = helpers.length;
    const uniqueContributors = new Set([
      ...busSpots.map(spot => spot.user_id),
      ...helpers.map(helper => helper.user_id)
    ]).size;

    return {
      totalSpots,
      verifiedSpots,
      activeHelpers,
      uniqueContributors,
      verificationRate: totalSpots > 0 ? Math.round((verifiedSpots / totalSpots) * 100) : 0
    };
  };

  return {
    markers: getContributionMarkers(),
    stats: getContributionStats(),
    isLoading
  };
}

export default ContributionMapLayer;