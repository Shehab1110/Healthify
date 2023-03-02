// Helper function to convert degrees to radians
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Calculate the distance between two points using the Haversine formula
function calculateDistance(pointA, pointB) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(pointB.latitude - pointA.latitude);
  const dLon = degreesToRadians(pointB.longitude - pointA.longitude);
  const lat1 = degreesToRadians(pointA.latitude);
  const lat2 = degreesToRadians(pointB.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

// Sorting function to sort doctors by distance
function sortByDistance(a, b) {
  const distanceA = calculateDistance(userLocation, a.coordinates);
  const distanceB = calculateDistance(userLocation, b.coordinates);
  return distanceA - distanceB;
}

// Sort the array of doctors by distance
doctors.sort(sortByDistance);
