import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getUserProgress, saveUserProgress, resetUserProgress } from './db/localDb.js';
import {
  getNationalRealTime,
  getRegionalRealTime,
  getCarbonIntensity,
  getEcowattSignal,
  getInstallationsByRegion,
  getMetropoles,
  getSubstations,
  getProductionCapacity,
  getLatestNational,
  getLatestRegional,
  getNationalForecasts,
  syncDatabase,
} from './services/rteService.js';
import { getWeatherForAllCities, getWeatherHistory } from './services/weatherService.js';
import { computeCorrelations, simulateWeatherChange } from './services/correlationService.js';
import { generateNarration, generateStoryChain } from './services/narratorService.js';

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User Progress API Endpoints
app.get('/api/progress', async (req, res) => {
  try {
    const progress = await getUserProgress();
    res.json(progress);
  } catch (err) {
    console.error('Error GET /api/progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const updated = await saveUserProgress(req.body);
    res.json(updated);
  } catch (err) {
    console.error('Error POST /api/progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/progress', async (req, res) => {
  try {
    const updated = await resetUserProgress();
    res.json(updated);
  } catch (err) {
    console.error('Error DELETE /api/progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// GeoJSON endpoints
app.get('/api/geojson/france-regions', async (req, res) => {
  try {
    const geojsonPath = path.join(__dirname, '../src/data/france-regions.geojson');
    const data = await fs.readFile(geojsonPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error /api/geojson/france-regions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Energy endpoints ──────────────────────────────────────

// National real-time data (production, consumption, exchanges)
app.get('/api/energy/national', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const data = await getNationalRealTime(limit);
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/national:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Regional real-time data
app.get('/api/energy/regional', async (req, res) => {
  try {
    const data = await getLatestRegional();
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/regional:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// National Forecasts
app.get('/api/energy/forecasts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 96;
    const data = await getNationalForecasts(limit);
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/forecasts:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Carbon intensity + renewable share
app.get('/api/energy/carbon', async (req, res) => {
  try {
    const data = await getCarbonIntensity();
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/carbon:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ecowatt signal
app.get('/api/energy/ecowatt', async (req, res) => {
  try {
    const data = await getEcowattSignal();
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/ecowatt:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Installations registry (aggregated by region/filiere)
app.get('/api/energy/installations', async (req, res) => {
  try {
    const data = await getInstallationsByRegion();
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/installations:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Metropoles data
app.get('/api/energy/metropoles', async (req, res) => {
  try {
    const data = await getMetropoles();
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/metropoles:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// RTE substations
app.get('/api/energy/substations', async (req, res) => {
  try {
    const data = await getSubstations();
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/substations:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Production capacity
app.get('/api/energy/capacity', async (req, res) => {
  try {
    const data = await getProductionCapacity();
    res.json(data);
  } catch (err) {
    console.error('Error /api/energy/capacity:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Weather endpoints ─────────────────────────────────────

app.get('/api/weather/current', async (req, res) => {
  try {
    const data = await getWeatherForAllCities();
    res.json(data);
  } catch (err) {
    console.error('Error /api/weather/current:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/weather/history', async (req, res) => {
  try {
    const data = await getWeatherHistory();
    res.json(data);
  } catch (err) {
    console.error('Error /api/weather/history:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Correlation & narration endpoints ─────────────────────


app.get('/api/narration', async (req, res) => {
  try {
    const mode = req.query.mode || 'pedagogical';
    const [national, weather] = await Promise.all([
      getNationalRealTime(1),
      getWeatherForAllCities(),
    ]);
    const correlations = computeCorrelations(national, weather);
    const narrations = generateNarration(correlations, mode);
    const story = generateStoryChain(correlations, mode);

    res.json({ narrations, story, correlations });
  } catch (err) {
    console.error('Error /api/narration:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Simulation endpoint
app.post('/api/simulate', async (req, res) => {
  try {
    const { windDelta = 0, solarDelta = 0, tempDelta = 0 } = req.body;
    const [national, weather] = await Promise.all([
      getNationalRealTime(1),
      getWeatherForAllCities(),
    ]);
    const correlations = computeCorrelations(national, weather);
    const simulation = simulateWeatherChange(correlations, { windDelta, solarDelta, tempDelta });

    res.json(simulation);
  } catch (err) {
    console.error('Error /api/simulate:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── All-in-one dashboard endpoint ─────────────────────────

app.get('/api/dashboard', async (req, res) => {
  try {
    const mode = req.query.mode || 'pedagogical';

    const [national, forecasts, regional, weather, carbon, ecowatt] = await Promise.all([
      getNationalRealTime(100),
      getNationalForecasts(96),
      getLatestRegional(),
      getWeatherForAllCities(),
      getCarbonIntensity(1),
      getEcowattSignal(),
    ]);

    const correlations = computeCorrelations(national, weather);
    const narrations = generateNarration(correlations, mode);
    const story = generateStoryChain(correlations, mode);

    res.json({
      national: national.results,
      forecasts: forecasts.results || [],
      regional,
      weather,
      carbon: carbon.results?.[0] || null,
      ecowatt: ecowatt.results || [],
      correlations,
      narrations,
      story,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error /api/dashboard:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start server ──────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`⚡ ÉnergieFrance API server running on http://localhost:${PORT}`);

  try {
    await initDb();
    // Run initial sync in background
    syncDatabase();
    // Schedule periodic syncs every 15 minutes (900000 ms)
    setInterval(syncDatabase, 15 * 60 * 1000);
  } catch (err) {
    console.error('Failed to initialize local DB sync:', err.message);
  }

  console.log(`   GET /api/health`);
  console.log(`   GET /api/dashboard`);
  console.log(`   GET /api/energy/national`);
  console.log(`   GET /api/energy/forecasts`);
  console.log(`   GET /api/energy/regional`);
  console.log(`   GET /api/energy/carbon`);
  console.log(`   GET /api/energy/ecowatt`);
  console.log(`   GET /api/energy/installations`);
  console.log(`   GET /api/energy/metropoles`);
  console.log(`   GET /api/energy/substations`);
  console.log(`   GET /api/energy/capacity`);
  console.log(`   GET /api/weather/current`);
  console.log(`   GET /api/weather/history`);
  console.log(`   GET /api/narration`);
  console.log(`   POST /api/simulate`);
});
