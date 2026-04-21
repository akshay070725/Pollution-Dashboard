function bandFromOwAqiIndex(i) {
  if (i === 1) return "good";
  if (i === 2) return "fair";
  if (i === 3) return "moderate";
  if (i === 4) return "poor";
  if (i === 5) return "very_poor";
  return "unknown";
}

const TIPS = {
  good: [
    "Air quality is satisfactory; enjoy outdoor activity as usual.",
    "Sensitive individuals can exercise outdoors without extra concern.",
  ],
  fair: [
    "Acceptable for most people; unusually sensitive people may consider reducing prolonged exertion outdoors.",
    "Keep windows open for ventilation unless you are near a busy road during rush hour.",
  ],
  moderate: [
    "Sensitive groups (children, elderly, respiratory conditions) should limit long outdoor exertion.",
    "Everyone else can continue normal activity but watch for symptoms if exercising outdoors.",
  ],
  poor: [
    "Reduce prolonged or heavy outdoor exertion; move workouts indoors if possible.",
    "Keep windows closed during peak traffic; use air purifiers indoors if available.",
    "Wear a well-fitting mask (e.g. N95/FFP2) if you must be outside for extended periods.",
  ],
  very_poor: [
    "Avoid outdoor exertion; stay indoors with windows closed when pollution is highest.",
    "Use HEPA air purifiers; sensitive individuals should remain indoors as much as practical.",
    "Follow local advisories and health authority guidance.",
  ],
  unknown: [
    "AQI data is unavailable; check official local air quality sources before planning outdoor activity.",
  ],
};

export function healthRecommendationsFromOpenWeather(aqiIndex) {
  const band = bandFromOwAqiIndex(aqiIndex);
  return {
    band,
    title:
      band === "good"
        ? "Good air quality"
        : band === "fair"
          ? "Fair air quality"
          : band === "moderate"
            ? "Moderate concern for sensitive groups"
            : band === "poor"
              ? "Unhealthy for sensitive groups"
              : band === "very_poor"
                ? "Health alert: everyone may experience effects"
                : "Air quality unknown",
    tips: TIPS[band] ?? TIPS.unknown,
  };
}
