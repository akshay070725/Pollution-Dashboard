export const PRESETS = [
  { id: "delhi", name: "Delhi", city: "Delhi", lat: 28.6139, lon: 77.209 },
  { id: "mumbai", name: "Mumbai", city: "Mumbai", lat: 19.076, lon: 72.8777 },
  { id: "bengaluru", name: "Bengaluru", city: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { id: "kolkata", name: "Kolkata", city: "Kolkata", lat: 22.5726, lon: 88.3639 },
];

export function getCityById(cityId) {
  return PRESETS.find((city) => city.id === cityId) ?? PRESETS[0];
}
