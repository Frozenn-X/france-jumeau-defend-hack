import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './index.js';

describe('GET /api/health', () => {
  it('retourne un état exploitable sans démarrer un serveur réseau', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(Date.parse(response.body.timestamp)).not.toBeNaN();
  });
});
