export const WEEKLY_RANKING = [
  { city: "Delhi", aqi: 286 },
  { city: "Ghaziabad", aqi: 274 },
  { city: "Noida", aqi: 266 },
  { city: "Faridabad", aqi: 258 },
  { city: "Patna", aqi: 242 },
  { city: "Kanpur", aqi: 236 },
  { city: "Lucknow", aqi: 229 },
  { city: "Gurugram", aqi: 222 },
  { city: "Varanasi", aqi: 214 },
  { city: "Mumbai", aqi: 198 },
];

export const MONTHLY_RANKING = [
  { city: "Delhi", aqi: 271 },
  { city: "Ghaziabad", aqi: 261 },
  { city: "Noida", aqi: 255 },
  { city: "Faridabad", aqi: 248 },
  { city: "Kanpur", aqi: 241 },
  { city: "Patna", aqi: 236 },
  { city: "Lucknow", aqi: 230 },
  { city: "Gurugram", aqi: 224 },
  { city: "Varanasi", aqi: 216 },
  { city: "Kolkata", aqi: 201 },
];

export function getSeverity(aqi) {
  if (aqi >= 301) return { label: "Severe", className: "severity-severe" };
  if (aqi >= 201) return { label: "Very Poor", className: "severity-very-poor" };
  if (aqi >= 151) return { label: "Poor", className: "severity-poor" };
  if (aqi >= 101) return { label: "Moderate", className: "severity-moderate" };
  return { label: "Satisfactory", className: "severity-satisfactory" };
}
