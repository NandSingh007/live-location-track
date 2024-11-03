const socket = io();

// Track user location and emit to the server
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { longitude, latitude });
      map.setView([latitude, longitude], 16); // Center the map on the user's location
    },
    (error) => {
      console.error(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
}

// Initialize map
const map = L.map("map").setView([0, 0], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "OpenStreetMap"
}).addTo(map);

// Store markers for each user
const markers = {};

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Listen for existing locations from the server
socket.on("existing-locations", (locations) => {
  Object.entries(locations).forEach(([id, { latitude, longitude }]) => {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  });
});

// Listen for location updates from the server
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  // Check if marker already exists for this user
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    // Create a new marker and add it to the map
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  // Calculate and display distances from the current user to other users
  const currentUserMarker = markers[socket.id];
  if (currentUserMarker) {
    const currentLatLng = currentUserMarker.getLatLng();
    const distance = calculateDistance(
      currentLatLng.lat,
      currentLatLng.lng,
      latitude,
      longitude
    ).toFixed(2); // Distance in kilometers

    console.log(`Distance to user ${id}: ${distance} km`);
  }
});

// Handle user disconnection
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
