// Correlation engine: combines energy + weather data to derive insights

export function computeCorrelations(nationalData, weatherData) {
  if (!nationalData || !weatherData) return null;

  const latest = Array.isArray(nationalData.results) ? nationalData.results[0] : nationalData;
  const weather = weatherData.aggregated || {};

  // Total production
  const totalProd = (latest.nucleaire || 0) + (latest.eolien || 0) + (latest.solaire || 0) +
    (latest.hydraulique || 0) + (latest.gaz || 0) + (latest.fioul || 0) +
    (latest.charbon || 0) + (latest.bioenergies || 0);

  // Renewable production
  const renewableProd = (latest.eolien || 0) + (latest.solaire || 0) +
    (latest.hydraulique || 0) + (latest.bioenergies || 0);

  // Weather-dependent production (wind + solar)
  const weatherDependent = (latest.eolien || 0) + (latest.solaire || 0);

  // Import/export balance
  const exchanges = {
    angleterre: latest.ech_comm_angleterre || 0,
    espagne: latest.ech_comm_espagne || 0,
    italie: latest.ech_comm_italie || 0,
    suisse: latest.ech_comm_suisse || 0,
    allemagne_belgique: latest.ech_comm_allemagne_belgique || 0,
  };
  const netExchange = Object.values(exchanges).reduce((a, b) => a + b, 0);

  // Production breakdown
  const productionMix = {
    nucleaire: latest.nucleaire || 0,
    eolien: latest.eolien || 0,
    eolien_terrestre: latest.eolien_terrestre || 0,
    eolien_offshore: latest.eolien_offshore || 0,
    solaire: latest.solaire || 0,
    hydraulique: latest.hydraulique || 0,
    hydraulique_fil_eau: latest.hydraulique_fil_eau_eclusee || 0,
    hydraulique_lacs: latest.hydraulique_lacs || 0,
    hydraulique_step: latest.hydraulique_step_turbinage || 0,
    gaz: latest.gaz || 0,
    gaz_ccg: latest.gaz_ccg || 0,
    gaz_cogen: latest.gaz_cogen || 0,
    gaz_tac: latest.gaz_tac || 0,
    fioul: latest.fioul || 0,
    charbon: latest.charbon || 0,
    bioenergies: latest.bioenergies || 0,
    bioenergies_dechets: latest.bioenergies_dechets || 0,
    bioenergies_biomasse: latest.bioenergies_biomasse || 0,
    bioenergies_biogaz: latest.bioenergies_biogaz || 0,
  };

  // Battery storage
  const battery = {
    charging: latest.stockage_batterie || 0,
    discharging: latest.destockage_batterie || 0,
    net: (latest.destockage_batterie || 0) + (latest.stockage_batterie || 0),
  };

  // Correlations
  const windCorrelation = weather.windSpeed > 0
    ? ((latest.eolien || 0) / Math.max(weather.windSpeed, 1)).toFixed(1)
    : 0;

  return {
    timestamp: latest.date_heure,
    production: {
      total: totalProd,
      mix: productionMix,
      renewable: renewableProd,
      renewablePercent: totalProd > 0 ? Math.round((renewableProd / totalProd) * 100) : 0,
      weatherDependent,
      weatherDependentPercent: totalProd > 0 ? Math.round((weatherDependent / totalProd) * 100) : 0,
    },
    consumption: {
      current: latest.consommation || 0,
      forecast_j1: latest.prevision_j1 || 0,
      forecast_j: latest.prevision_j || 0,
    },
    exchanges: {
      ...exchanges,
      net: netExchange,
      isExporting: netExchange < 0,
      netAbsolute: Math.abs(netExchange),
    },
    carbon: {
      intensity: latest.taux_co2 || 0,
    },
    battery,
    weather: {
      temperature: weather.temperature || 0,
      windSpeed: weather.windSpeed || 0,
      cloudCover: weather.cloudCover || 0,
    },
    correlations: {
      windToEolien: windCorrelation,
      temperatureEffect: weather.temperature < 15 ? 'heating' : weather.temperature > 25 ? 'cooling' : 'neutral',
      solarPotential: weather.cloudCover < 30 ? 'high' : weather.cloudCover < 70 ? 'medium' : 'low',
    },
  };
}

// Compute simulation: what if weather changes?
export function simulateWeatherChange(correlations, deltas) {
  if (!correlations) return null;

  const { windDelta = 0, solarDelta = 0, tempDelta = 0 } = deltas;

  const currentWind = correlations.production.mix.eolien;
  const currentSolar = correlations.production.mix.solaire;
  const currentConso = correlations.consumption.current;

  // Wind: roughly linear relationship
  const newWind = Math.max(0, Math.round(currentWind * (1 + windDelta / 100)));

  // Solar: roughly linear relationship
  const newSolar = Math.max(0, Math.round(currentSolar * (1 + solarDelta / 100)));

  // Temperature: ~1500 MW per °C for heating (below 15°C), ~800 MW per °C for cooling (above 25°C)
  let consoChange = 0;
  const effectiveTemp = correlations.weather.temperature + tempDelta;
  if (effectiveTemp < 15) {
    consoChange = Math.round(tempDelta * -1500); // colder = more consumption
  } else if (effectiveTemp > 25) {
    consoChange = Math.round(tempDelta * 800); // hotter = more consumption (AC)
  }
  const newConso = Math.max(0, currentConso + consoChange);

  // Recalculate totals
  const windChange = newWind - currentWind;
  const solarChange = newSolar - currentSolar;
  const totalChange = windChange + solarChange;

  // Impact on imports
  const currentNet = correlations.exchanges.net;
  const newNet = currentNet - totalChange + consoChange;

  // Impact on CO2 (rough: less fossil = less CO2)
  const fossilReduction = Math.min(totalChange, correlations.production.mix.gaz + correlations.production.mix.fioul);
  const co2Factor = correlations.carbon.intensity;
  const newCo2 = Math.max(0, Math.round(co2Factor * (1 - fossilReduction / Math.max(correlations.production.total, 1))));

  return {
    original: {
      eolien: currentWind,
      solaire: currentSolar,
      consommation: currentConso,
      imports: currentNet,
      co2: co2Factor,
    },
    simulated: {
      eolien: newWind,
      solaire: newSolar,
      consommation: newConso,
      imports: newNet,
      co2: newCo2,
    },
    deltas: {
      eolien: windChange,
      solaire: solarChange,
      consommation: consoChange,
      imports: newNet - currentNet,
      co2: newCo2 - co2Factor,
    },
  };
}
