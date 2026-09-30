// Dynamic narration engine — generates pedagogical sentences from energy data changes

const TEMPLATES = {
  windUp: {
    icon: 'wind',
    pedagogical: 'Le vent se renforce ({speed} km/h) → la production éolienne augmente de {delta}% pour atteindre {mw} MW',
    expert: 'Éolien +{delta}% ({mw} MW) — vent moyen {speed} km/h',
  },
  windDown: {
    icon: 'wind',
    pedagogical: 'Le vent faiblit → la production éolienne baisse de {delta}%, les autres sources compensent',
    expert: 'Éolien {delta}% ({mw} MW) — vent {speed} km/h',
  },
  solarPeak: {
    icon: 'solar',
    pedagogical: 'Fort ensoleillement ({radiation} W/m²) → le solaire produit {mw} MW, soit {pct}% du mix',
    expert: 'Solaire {mw} MW ({pct}% du mix) — irradiation {radiation} W/m²',
  },
  solarDrop: {
    icon: 'cloud',
    pedagogical: 'La couverture nuageuse augmente → la production solaire diminue à {mw} MW',
    expert: 'Solaire ↓ {mw} MW — couverture nuageuse {clouds}%',
  },
  coldWave: {
    icon: 'temp',
    pedagogical: 'Il fait froid ({temp}°C) → la consommation grimpe pour le chauffage ({conso} MW)',
    expert: 'Consommation {conso} MW — température {temp}°C (effet thermo-sensibilité)',
  },
  heatWave: {
    icon: 'temp',
    pedagogical: 'Il fait très chaud ({temp}°C) → la climatisation fait monter la consommation à {conso} MW',
    expert: 'Consommation {conso} MW — température {temp}°C (climatisation)',
  },
  exporting: {
    icon: 'exchange',
    pedagogical: 'La France exporte {mw} MW d\'électricité — notre production dépasse la demande',
    expert: 'Export net {mw} MW — solde commercial positif',
  },
  importing: {
    icon: 'exchange',
    pedagogical: 'La France importe {mw} MW d\'électricité — la demande dépasse notre production',
    expert: 'Import net {mw} MW — solde commercial négatif',
  },
  co2Low: {
    icon: 'carbon',
    pedagogical: 'L\'intensité carbone est très basse ({co2} gCO₂/kWh) — merci le nucléaire et les renouvelables !',
    expert: 'Intensité carbone {co2} gCO₂/kWh — mix bas-carbone',
  },
  co2High: {
    icon: 'alert',
    pedagogical: 'L\'intensité carbone monte ({co2} gCO₂/kWh) — le gaz et le fioul sont davantage utilisés',
    expert: 'Intensité carbone {co2} gCO₂/kWh — recours accru au thermique fossile',
  },
  ecowattAlert: {
    icon: 'alert',
    pedagogical: 'Signal Ecowatt {level} en {region} : {message}',
    expert: 'Ecowatt {level} — {region} — {message}',
  },
  renewableRecord: {
    icon: 'record',
    pedagogical: 'Les énergies renouvelables couvrent {pct}% de la consommation française !',
    expert: 'Part ENR {pct}% — {mw} MW sur {total} MW consommés',
  },
  nuclearBase: {
    icon: 'nuclear',
    pedagogical: 'Le nucléaire fournit la base avec {mw} MW, soit {pct}% de notre électricité',
    expert: 'Nucléaire {mw} MW ({pct}% du mix)',
  },
  batteryAction: {
    icon: 'battery',
    pedagogical: 'Les batteries {action} {mw} MW — elles {explanation}',
    expert: 'Batteries {action} {mw} MW',
  },
  exchangeDetail: {
    icon: 'plug',
    pedagogical: 'La France {action} {mw} MW {direction} {country}',
    expert: '{country}: {sign}{mw} MW',
  },
};

// Generate narration based on current state
export function generateNarration(correlations, mode = 'pedagogical') {
  if (!correlations) return [];

  const narrations = [];
  const prod = correlations.production;
  const conso = correlations.consumption;
  const exch = correlations.exchanges;
  const weather = correlations.weather;
  const carbon = correlations.carbon;

  // 1. Nuclear base (always)
  if (prod.mix.nucleaire > 0) {
    const pct = Math.round((prod.mix.nucleaire / prod.total) * 100);
    narrations.push({
      priority: 3,
      ...formatTemplate('nuclearBase', mode, {
        mw: formatMW(prod.mix.nucleaire),
        pct,
      }),
    });
  }

  // 2. Wind status
  if (prod.mix.eolien > 500) {
    narrations.push({
      priority: 2,
      ...formatTemplate(weather.windSpeed > 20 ? 'windUp' : 'windDown', mode, {
        speed: weather.windSpeed,
        mw: formatMW(prod.mix.eolien),
        delta: Math.round((prod.mix.eolien / Math.max(prod.total, 1)) * 100),
        pct: Math.round((prod.mix.eolien / Math.max(prod.total, 1)) * 100),
      }),
    });
  }

  // 3. Solar status
  if (new Date().getHours() >= 6 && new Date().getHours() <= 20) {
    const solarPct = Math.round((prod.mix.solaire / Math.max(prod.total, 1)) * 100);
    narrations.push({
      priority: 2,
      ...formatTemplate(prod.mix.solaire > 1000 ? 'solarPeak' : 'solarDrop', mode, {
        radiation: Math.round(weather.cloudCover < 50 ? 600 : 200),
        mw: formatMW(prod.mix.solaire),
        pct: solarPct,
        clouds: weather.cloudCover,
      }),
    });
  }

  // 4. Temperature effect
  if (weather.temperature < 10) {
    narrations.push({
      priority: 1,
      ...formatTemplate('coldWave', mode, {
        temp: weather.temperature,
        conso: formatMW(conso.current),
      }),
    });
  } else if (weather.temperature > 30) {
    narrations.push({
      priority: 1,
      ...formatTemplate('heatWave', mode, {
        temp: weather.temperature,
        conso: formatMW(conso.current),
      }),
    });
  }

  // 5. Import/export
  narrations.push({
    priority: 2,
    ...formatTemplate(exch.isExporting ? 'exporting' : 'importing', mode, {
      mw: formatMW(exch.netAbsolute),
    }),
  });

  // 6. Carbon intensity
  narrations.push({
    priority: carbon.intensity < 50 ? 3 : 1,
    ...formatTemplate(carbon.intensity < 50 ? 'co2Low' : 'co2High', mode, {
      co2: carbon.intensity,
    }),
  });

  // 7. Renewable share
  if (prod.renewablePercent > 30) {
    narrations.push({
      priority: prod.renewablePercent > 50 ? 1 : 3,
      ...formatTemplate('renewableRecord', mode, {
        pct: prod.renewablePercent,
        mw: formatMW(prod.renewable),
        total: formatMW(conso.current),
      }),
    });
  }

  // Sort by priority (1 = highest)
  narrations.sort((a, b) => a.priority - b.priority);

  return narrations;
}

// Generate the main "story" sentence that chains events (no emojis in text strings)
export function generateStoryChain(correlations, mode = 'pedagogical') {
  if (!correlations) return '';

  const parts = [];
  const weather = correlations.weather;
  const prod = correlations.production;
  const exch = correlations.exchanges;
  const carbon = correlations.carbon;

  // Start with weather
  if (weather.windSpeed > 20) {
    parts.push(`Vent fort (${weather.windSpeed} km/h)`);
    parts.push(`→ éolien à ${formatMW(prod.mix.eolien)} MW`);
  } else if (weather.temperature > 30) {
    parts.push(`Chaleur (${weather.temperature}°C)`);
    parts.push(`→ consommation élevée (${formatMW(correlations.consumption.current)} MW)`);
  } else if (weather.temperature < 5) {
    parts.push(`Froid (${weather.temperature}°C)`);
    parts.push(`→ forte consommation chauffage`);
  } else {
    parts.push(`Production : ${formatMW(prod.total)} MW`);
  }

  // Exchange consequence
  if (exch.isExporting) {
    parts.push(`→ la France exporte ${formatMW(exch.netAbsolute)} MW`);
  } else {
    parts.push(`→ la France importe ${formatMW(exch.netAbsolute)} MW`);
  }

  // Carbon conclusion
  parts.push(`→ CO₂ : ${carbon.intensity} gCO₂/kWh`);

  return parts.join(' ');
}

function formatTemplate(templateKey, mode, vars) {
  const template = TEMPLATES[templateKey];
  if (!template) return { icon: 'warning', text: 'Données en cours de chargement...' };

  let text = template[mode] || template.pedagogical;
  for (const [key, value] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return { icon: template.icon, text };
}

function formatMW(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}
