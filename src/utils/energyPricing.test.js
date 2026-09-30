import { describe, expect, it } from 'vitest';
import { estimateSpotPrice } from './energyPricing';

describe('estimateSpotPrice', () => {
  it.each([
    ['fallback without record', null, 30],
    ['standard low-carbon mix', {}, 35],
    ['coal marginal plant and carbon cost', { charbon: 51 }, 217],
    ['fuel-oil marginal plant and carbon cost', { fioul: 51 }, 201],
    ['gas marginal plant and carbon cost', { gaz: 201 }, 110],
    ['high imports', { ech_physiques: 1501 }, 85],
    ['moderate imports', { ech_physiques: 1 }, 55],
    ['high consumption', { consommation: 60001 }, 62],
    ['high exports', { ech_physiques: -5001 }, 24],
    ['grid-stress premium is capped', { grid_stress: 10001 }, 235],
  ])('%s', (_label, record, expected) => {
    expect(estimateSpotPrice(record)).toBe(expected);
  });
});
