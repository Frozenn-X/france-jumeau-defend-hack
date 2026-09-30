import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { getNationalRealTime } from './services/rteService.js';
import { app } from './index.js';

vi.mock('./services/rteService.js', () => ({
  getNationalRealTime: vi.fn(),
  getRegionalRealTime: vi.fn(),
  getCarbonIntensity: vi.fn(),
  getEcowattSignal: vi.fn(),
  getInstallationsByRegion: vi.fn(),
  getMetropoles: vi.fn(),
  getSubstations: vi.fn(),
  getProductionCapacity: vi.fn(),
  getLatestNational: vi.fn(),
  getLatestRegional: vi.fn(),
  getNationalForecasts: vi.fn(),
  syncDatabase: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/health', () => {
  it('retourne un état exploitable sans démarrer un serveur réseau', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(Date.parse(response.body.timestamp)).not.toBeNaN();
  });
});

describe('GET /api/energy/national', () => {
  it('retourne les données de la source avec la limite demandée', async () => {
    const payload = { results: [{ consommation: 42000 }] };
    getNationalRealTime.mockResolvedValue(payload);

    const response = await request(app).get('/api/energy/national?limit=2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(payload);
    expect(getNationalRealTime).toHaveBeenCalledWith(2);
  });

  it('retourne une erreur exploitable quand la source expire', async () => {
    getNationalRealTime.mockRejectedValue(new Error('ODRÉ timeout'));

    const response = await request(app).get('/api/energy/national');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'ODRÉ timeout' });
  });
});
