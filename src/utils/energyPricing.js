export function estimateSpotPrice(record) {
  if (!record) return 30;

  const gaz = record.gaz || 0;
  const fioul = record.fioul || 0;
  const charbon = record.charbon || 0;
  const imports = record.ech_physiques > 0 ? record.ech_physiques : 0;
  const consommation = record.consommation || 0;

  let basePrice = 35;
  if (charbon > 50 || fioul > 50) basePrice = 145;
  else if (gaz > 200) basePrice = 78;
  else if (imports > 1500) basePrice = 85;
  else if (imports > 0) basePrice = 55;
  else if (consommation > 60000) basePrice = 62;
  else if (record.ech_physiques < -5000) basePrice = 24;

  let co2TaxImpact = 0;
  if (charbon > 50) co2TaxImpact = 72;
  else if (fioul > 50) co2TaxImpact = 56;
  else if (gaz > 200) co2TaxImpact = 32;

  const gridStress = record.grid_stress || 0;
  const stressPremium = gridStress > 0 ? Math.min(200, Math.round(gridStress / 50)) : 0;
  return basePrice + co2TaxImpact + stressPremium;
}
