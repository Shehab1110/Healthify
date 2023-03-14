// Helper function to convert degrees to radians
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Calculate the distance between two points using the Haversine formula
function calculateDistance(pointA, pointB) {
  const earthRadiusKm = 6371;
  const lon1 = degreesToRadians(pointA.location.coordinates[0]);
  const lat1 = degreesToRadians(pointA.location.coordinates[1]);
  const lon2 = degreesToRadians(pointB.location.coordinates[0]);
  const lat2 = degreesToRadians(pointB.location.coordinates[1]);
  const dLon = lon2 - lon1;
  const dLat = lat2 - lat1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

// Sorting function to sort doctors by distance
function sortByDistance(a, b, userLocation) {
  const distanceA = calculateDistance(userLocation, a);
  const distanceB = calculateDistance(userLocation, b);
  return distanceA - distanceB;
}

module.exports = sortByDistance;
