import NodeCache from 'node-cache';
import {
  getNationalRecords,
  getLatestRegionalRecords,
  insertNationalRecords,
  insertRegionalRecords
} from '../db/localDb.js';

const cache = new NodeCache();
const ODRE_BASE = 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets';

async function fetchWithCache(key, url, ttlSeconds = 300) {
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`ODRÉ API error: ${res.status} for ${key}`);
  const data = await res.json();
  cache.set(key, data, ttlSeconds);
  return data;
}

// ─── Direct Database Sync Routine ─────────────────────────────

export async function syncDatabase() {
  try {
    console.log('[DB Sync] Fetching fresh updates from ODRÉ API...');
    
    // 1. Fetch latest national records (limit 100 to catch any offline gap)
    const nationalUrl = `${ODRE_BASE}/eco2mix-national-tr/records?where=consommation%20is%20not%20null&order_by=date_heure%20DESC&limit=100`;
    const resNat = await fetch(nationalUrl);
    let addedNat = 0;
    if (resNat.ok) {
      const dataNat = await resNat.json();
      if (dataNat && dataNat.results) {
        const filtered = dataNat.results.filter(r => r.consommation !== null && r.consommation !== undefined);
        addedNat = await insertNationalRecords(filtered);
      }
    }

    // 2. Fetch latest regional records (limit 100 - ODRÉ max limit is 100)
    const regionalUrl = `${ODRE_BASE}/eco2mix-regional-tr/records?where=consommation%20is%20not%20null&order_by=date_heure%20DESC&limit=100`;
    const resReg = await fetch(regionalUrl);
    let addedReg = 0;
    if (resReg.ok) {
      const dataReg = await resReg.json();
      if (dataReg && dataReg.results) {
        const filtered = dataReg.results.filter(r => r.consommation !== null && r.consommation !== undefined);
        addedReg = await insertRegionalRecords(filtered);
      }
    }

    console.log(`[DB Sync] Success. Stored ${addedNat} new national and ${addedReg} new regional records.`);
  } catch (err) {
    console.error('[DB Sync] Error performing synchronization:', err.message);
  }
}

// ─── Exposed Services ─────────────────────────────────────────

// 1. National real-time (eco2mix-national-tr) - Read from local database
export async function getNationalRealTime(limit = 100) {
  let records = await getNationalRecords(limit);
  if (records.length === 0) {
    console.log('[DB] Local national data is empty. Running instant sync...');
    await syncDatabase();
    records = await getNationalRecords(limit);
  }
  return { results: records };
}

// 1.b National Forecasts (prevision_j1 from eco2mix-national-tr)
export async function getNationalForecasts(limit = 96) {
  const url = `${ODRE_BASE}/eco2mix-national-tr/records?where=consommation%20is%20null%20and%20prevision_j1%20is%20not%20null&order_by=date_heure%20ASC&limit=${limit}`;
  const data = await fetchWithCache(`national-forecasts-${limit}`, url, 1800);
  
  // Since RTE doesn't directly provide wind/solar forecasts here, we mock them based on diurnal cycles
  // to support the pedagogical dashboard's 24/48h forecasting feature.
  if (data && data.results) {
    data.results = data.results.map((r, i) => {
      const hour = new Date(r.date_heure).getHours();
      // Mock solar: peak at noon, 0 at night
      const solarFactor = hour >= 7 && hour <= 21 ? Math.sin((hour - 7) * Math.PI / 14) : 0;
      // Mock wind: slight pseudo-random variation
      const windFactor = 0.8 + (Math.sin(i * 0.5) * 0.2);
      
      return {
        ...r,
        consommation: r.prevision_j1 || r.prevision_j || 45000,
        solaire: Math.round(15000 * solarFactor),
        eolien: Math.round(10000 * windFactor),
        isForecast: true
      };
    });
  }
  return data;
}

// 2. Regional real-time (eco2mix-regional-tr) - Read from local database
export async function getRegionalRealTime(limit = 100) {
  // Used primarily for mapping timeline history
  const clampedLimit = Math.min(100, limit);
  const nationalUrl = `${ODRE_BASE}/eco2mix-regional-tr/records?where=consommation%20is%20not%20null&order_by=date_heure%20DESC&limit=${clampedLimit}`;
  const data = await fetchWithCache(`regional-rt-${clampedLimit}`, nationalUrl, 300);
  if (data && data.results) {
    data.results = data.results.filter(r => r.consommation !== null && r.consommation !== undefined);
  }
  return data;
}

// 3. Carbon intensity + renewable share (part-enr-intensite-ges-conso-tr)
export async function getCarbonIntensity(limit = 50) {
  const url = `${ODRE_BASE}/part-enr-intensite-ges-conso-tr/records?order_by=date_heure_utc%20DESC&limit=${limit}`;
  return fetchWithCache(`carbon-intensity-${limit}`, url, 300);
}

// 4. Ecowatt signal (signal-ecowatt)
export async function getEcowattSignal(limit = 26) {
  const url = `${ODRE_BASE}/signal-ecowatt/records?order_by=date%20DESC&limit=${limit}`;
  return fetchWithCache(`ecowatt-${limit}`, url, 1800);
}



// 6b. Installations with aggregated counts per region/filiere
export async function getInstallationsByRegion() {
  const filieres = ['Nucl%C3%A9aire', 'Eolien', 'Solaire', 'Hydraulique', 'Thermique%20fossile', 'Bio%C3%A9nergies'];
  const url = `${ODRE_BASE}/registre-national-installation-production-stockage-electricite-agrege-311224/records?select=coderegion%2Cregion%2Cfiliere%2Csum(puismaxinstallee)%20as%20puissance_totale%2Ccount(*)%20as%20nb_installations&where=regime%3D'En%20service'&group_by=coderegion%2Cregion%2Cfiliere&limit=100`;
  return fetchWithCache('installations-region', url, 86400);
}

// 7. Metropoles (eco2mix-metropoles-tr)
export async function getMetropoles(limit = 50) {
  const url = `${ODRE_BASE}/eco2mix-metropoles-tr/records?where=consommation%20is%20not%20null&order_by=date_heure%20DESC&limit=${limit}`;
  return fetchWithCache(`metropoles-${limit}`, url, 300);
}

// 8. RTE substations (postes-electriques-rte)
export async function getSubstations() {
  const url = `${ODRE_BASE}/postes-electriques-rte/records?where=etat%3D'EN%20EXPLOITATION'%20AND%20tension%20IN%20('400kV'%2C'225kV')&limit=100`;
  return fetchWithCache('substations', url, 86400);
}

// 9. Production capacity by filiere (parc-prod-par-filiere)
export async function getProductionCapacity(limit = 20) {
  const url = `${ODRE_BASE}/parc-prod-par-filiere/records?order_by=annee%20DESC&limit=${limit}`;
  return fetchWithCache(`capacity-${limit}`, url, 86400);
}

// Helper: get latest national data point
export async function getLatestNational() {
  const data = await getNationalRealTime(1);
  return data.results?.[0] || null;
}

// Helper: get regional data grouped by region (latest tick) - Read from local database
export async function getLatestRegional() {
  let byRegion = await getLatestRegionalRecords();
  if (Object.keys(byRegion).length === 0) {
    console.log('[DB] Local regional data is empty. Running instant sync...');
    await syncDatabase();
    byRegion = await getLatestRegionalRecords();
  }
  return byRegion;
}
