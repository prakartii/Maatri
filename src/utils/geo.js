/**
 * Haversine distance between two lat/lng points (kilometres).
 */
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Sort facilities by distance from a given point.
 */
export const sortByNearest = (items, latitude, longitude) => {
  return items
    .map((item) => ({
      ...item,
      distance_km: haversineKm(
        latitude,
        longitude,
        Number(item.latitude),
        Number(item.longitude)
      ),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);
};
