import NodeCache from 'node-cache';

const cache = new NodeCache();
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// 12 cities covering all French regions
const CITIES = [
  { name: 'Paris', lat: 48.85, lon: 2.35, region: '11' },        // Île-de-France
  { name: 'Lyon', lat: 45.75, lon: 4.85, region: '84' },         // Auvergne-Rhône-Alpes
  { name: 'Marseille', lat: 43.30, lon: 5.37, region: '93' },    // PACA
  { name: 'Bordeaux', lat: 44.84, lon: -0.58, region: '75' },    // Nouvelle-Aquitaine
  { name: 'Nantes', lat: 47.22, lon: -1.55, region: '52' },      // Pays de la Loire
  { name: 'Lille', lat: 50.63, lon: 3.07, region: '32' },        // Hauts-de-France
  { name: 'Strasbourg', lat: 48.58, lon: 7.75, region: '44' },   // Grand Est
  { name: 'Toulouse', lat: 43.60, lon: 1.44, region: '76' },     // Occitanie
  { name: 'Rennes', lat: 48.11, lon: -1.68, region: '53' },      // Bretagne
  { name: 'Nice', lat: 43.70, lon: 7.27, region: '93' },         // PACA (east)
  { name: 'Brest', lat: 48.39, lon: -4.49, region: '53' },       // Bretagne (west coast wind)
  { name: 'Perpignan', lat: 42.70, lon: 2.90, region: '76' },    // Occitanie (south)
];

// Additional region mappings (regions without a dedicated city)
const REGION_CITY_FALLBACK = {
  '24': 'Paris',       // Centre-Val de Loire → closest
  '27': 'Bordeaux',    // Bourgogne-Franche-Comté → closest
  '28': 'Strasbourg',  // Normandie → closest to Grand Est
  '94': 'Marseille',   // Corse → closest
};

export function getCities() {
  return CITIES;
}

export async function getWeatherForAllCities() {
  const cached = cache.get('weather-all');
  if (cached) return cached;

  const latitudes = CITIES.map(c => c.lat).join(',');
  const longitudes = CITIES.map(c => c.lon).join(',');

  const url = `${BASE_URL}?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,weathercode&hourly=temperature_2m,wind_speed_10m,wind_speed_100m,wind_direction_10m,shortwave_radiation,direct_radiation,cloud_cover&forecast_days=2&timezone=Europe/Paris`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`);
  const rawData = await res.json();

  // Open-Meteo returns an array when multiple locations are queried
  const cityData = Array.isArray(rawData) ? rawData : [rawData];

  const result = CITIES.map((city, i) => ({
    ...city,
    current: cityData[i]?.current || null,
    hourly: cityData[i]?.hourly || null,
    hourly_units: cityData[i]?.hourly_units || null,
  }));

  // Aggregate national averages
  const validCurrents = result.filter(c => c.current);
  const aggregated = {
    temperature: avg(validCurrents.map(c => c.current.temperature_2m)),
    windSpeed: avg(validCurrents.map(c => c.current.wind_speed_10m)),
    windDirection: avg(validCurrents.map(c => c.current.wind_direction_10m)),
    cloudCover: avg(validCurrents.map(c => c.current.cloud_cover)),
  };

  // Weather by region
  const byRegion = {};
  for (const city of result) {
    if (!byRegion[city.region]) {
      byRegion[city.region] = [];
    }
    byRegion[city.region].push(city);
  }

  // Average per region
  const regionAverages = {};
  for (const [regionCode, cities] of Object.entries(byRegion)) {
    const currents = cities.filter(c => c.current);
    regionAverages[regionCode] = {
      temperature: avg(currents.map(c => c.current.temperature_2m)),
      windSpeed: avg(currents.map(c => c.current.wind_speed_10m)),
      cloudCover: avg(currents.map(c => c.current.cloud_cover)),
      solarRadiation: cities[0]?.hourly?.shortwave_radiation?.[new Date().getHours()] || 0,
    };
  }

  const fullResult = {
    cities: result,
    aggregated,
    byRegion: regionAverages,
    timestamp: new Date().toISOString(),
  };

  cache.set('weather-all', fullResult, 900); // 15 min TTL
  return fullResult;
}

// Get hourly weather for correlation charts (last 24h)
export async function getWeatherHistory() {
  const cached = cache.get('weather-history');
  if (cached) return cached;

  // Use Paris as representative for national trends
  const url = `${BASE_URL}?latitude=48.85&longitude=2.35&hourly=temperature_2m,wind_speed_10m,wind_speed_100m,shortwave_radiation,cloud_cover&past_days=1&forecast_days=1&timezone=Europe/Paris`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo history error: ${res.status}`);
  const data = await res.json();

  cache.set('weather-history', data, 900);
  return data;
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}
