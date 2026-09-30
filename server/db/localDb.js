import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

const NATIONAL_FILE = path.join(DATA_DIR, 'national.json');
const REGIONAL_FILE = path.join(DATA_DIR, 'regional.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

// In-memory state for lightning-fast reads
let nationalCache = [];
let regionalCache = [];
let progressCache = null;

let isInitialized = false;

// Ensure data folder exists
async function ensureDir() {

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {}
}

// Read JSON file safely
async function readJson(file) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Write JSON file asynchronously
async function writeJson(file, data) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

// ─── DB API ───────────────────────────────────────────────────

export async function initDb() {
  if (isInitialized) return;
  await ensureDir();
  nationalCache = await readJson(NATIONAL_FILE);
  regionalCache = await readJson(REGIONAL_FILE);
  
  const rawProgress = await readJson(PROGRESS_FILE);
  if (!rawProgress || Array.isArray(rawProgress) || typeof rawProgress !== 'object') {
    progressCache = { completedQuests: [], highScores: {}, lastActiveQuest: null };
  } else {
    progressCache = {
      completedQuests: Array.isArray(rawProgress.completedQuests) ? rawProgress.completedQuests : [],
      highScores: typeof rawProgress.highScores === 'object' && rawProgress.highScores !== null ? rawProgress.highScores : {},
      lastActiveQuest: rawProgress.lastActiveQuest || null
    };
  }

  isInitialized = true;
  console.log(`[DB] Local database initialized. loaded ${nationalCache.length} national and ${regionalCache.length} regional records.`);
}

// Get latest national records (sorted newest first)
export async function getNationalRecords(limit = 100) {
  await initDb();
  return nationalCache.slice(0, limit);
}

// Insert national records, ignoring duplicates based on date_heure
export async function insertNationalRecords(records) {
  await initDb();
  const input = Array.isArray(records) ? records : [records];
  let newAdded = 0;

  for (const record of input) {
    if (!record || !record.date_heure) continue;
    const exists = nationalCache.some(r => r.date_heure === record.date_heure);
    if (!exists) {
      nationalCache.push(record);
      newAdded++;
    }
  }

  if (newAdded > 0) {
    // Sort descending by date_heure
    nationalCache.sort((a, b) => new Date(b.date_heure) - new Date(a.date_heure));
    await purgeOldRecords();
    await writeJson(NATIONAL_FILE, nationalCache);
  }

  return newAdded;
}

// Get regional records (grouped by region code, latest only)
export async function getLatestRegionalRecords() {
  await initDb();
  const byRegion = {};
  // Iterate descending (newest first) and keep the first record found for each region
  for (const r of regionalCache) {
    if (!r.code_insee_region) continue;
    if (!byRegion[r.code_insee_region]) {
      byRegion[r.code_insee_region] = r;
    }
  }
  return byRegion;
}

// Insert regional records, ignoring duplicates based on code_insee_region + date_heure
export async function insertRegionalRecords(records) {
  await initDb();
  const input = Array.isArray(records) ? records : [records];
  let newAdded = 0;

  for (const record of input) {
    if (!record || !record.date_heure || !record.code_insee_region) continue;
    const exists = regionalCache.some(r => 
      r.date_heure === record.date_heure && r.code_insee_region === record.code_insee_region
    );
    if (!exists) {
      regionalCache.push(record);
      newAdded++;
    }
  }

  if (newAdded > 0) {
    // Sort descending by date_heure
    regionalCache.sort((a, b) => new Date(b.date_heure) - new Date(a.date_heure));
    await purgeOldRecords();
    await writeJson(REGIONAL_FILE, regionalCache);
  }

  return newAdded;
}

// Purge records older than 90 days (3 months)
export async function purgeOldRecords() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const prevNatCount = nationalCache.length;
  nationalCache = nationalCache.filter(r => new Date(r.date_heure) >= threeMonthsAgo);

  const prevRegCount = regionalCache.length;
  regionalCache = regionalCache.filter(r => new Date(r.date_heure) >= threeMonthsAgo);

  const natPurged = prevNatCount - nationalCache.length;
  const regPurged = prevRegCount - regionalCache.length;

  if (natPurged > 0 || regPurged > 0) {
    console.log(`[DB] Purged old historical data: removed ${natPurged} national and ${regPurged} regional records older than 3 months.`);
  }
}

export async function getUserProgress() {
  await initDb();
  return progressCache;
}

export async function saveUserProgress(progress) {
  await initDb();
  if (progress && typeof progress === 'object') {
    progressCache = {
      completedQuests: Array.isArray(progress.completedQuests) ? progress.completedQuests : progressCache.completedQuests,
      highScores: typeof progress.highScores === 'object' && progress.highScores !== null ? progress.highScores : progressCache.highScores,
      lastActiveQuest: typeof progress.lastActiveQuest !== 'undefined' ? progress.lastActiveQuest : progressCache.lastActiveQuest
    };
    await writeJson(PROGRESS_FILE, progressCache);
  }
  return progressCache;
}

export async function resetUserProgress() {
  await initDb();
  progressCache = {
    completedQuests: [],
    highScores: {},
    lastActiveQuest: null
  };
  await writeJson(PROGRESS_FILE, progressCache);
  return progressCache;
}

