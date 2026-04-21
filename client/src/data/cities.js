export const PRESETS = [
  { id: "delhi", name: "Delhi", city: "Delhi", lat: 28.6139, lon: 77.209 },
  { id: "mumbai", name: "Mumbai", city: "Mumbai", lat: 19.076, lon: 72.8777 },
  { id: "bengaluru", name: "Bengaluru", city: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { id: "kolkata", name: "Kolkata", city: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { id: "chennai", name: "Chennai", city: "Chennai", lat: 13.0827, lon: 80.2707 },
  { id: "hyderabad", name: "Hyderabad", city: "Hyderabad", lat: 17.385, lon: 78.4867 },
  { id: "pune", name: "Pune", city: "Pune", lat: 18.5204, lon: 73.8567 },
  { id: "ahmedabad", name: "Ahmedabad", city: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { id: "jaipur", name: "Jaipur", city: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { id: "lucknow", name: "Lucknow", city: "Lucknow", lat: 26.8467, lon: 80.9462 },
  { id: "kanpur", name: "Kanpur", city: "Kanpur", lat: 26.4499, lon: 80.3319 },
  { id: "surat", name: "Surat", city: "Surat", lat: 21.1702, lon: 72.8311 },
  { id: "nagpur", name: "Nagpur", city: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { id: "bhopal", name: "Bhopal", city: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { id: "indore", name: "Indore", city: "Indore", lat: 22.7196, lon: 75.8577 },
  { id: "patna", name: "Patna", city: "Patna", lat: 25.5941, lon: 85.1376 },
  { id: "chandigarh", name: "Chandigarh", city: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { id: "kochi", name: "Kochi", city: "Kochi", lat: 9.9312, lon: 76.2673 },
  { id: "visakhapatnam", name: "Visakhapatnam", city: "Visakhapatnam", lat: 17.6868, lon: 83.2185 },
];

export function getCityById(cityId) {
  return PRESETS.find((city) => city.id === cityId) ?? PRESETS[0];
}
