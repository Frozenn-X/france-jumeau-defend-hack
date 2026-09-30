export const NUCLEAR_PLANTS = [
  { id: 'gravelines', name: "Gravelines", coords: [51.0154, 2.1362], region: "32", capacity: 5460, reactors: 6 },
  { id: 'cattenom', name: "Cattenom", coords: [49.4161, 6.2178], region: "44", capacity: 5200, reactors: 4 },
  { id: 'paluel', name: "Paluel", coords: [49.8584, 0.6356], region: "28", capacity: 5320, reactors: 4 },
  { id: 'tricastin', name: "Tricastin", coords: [44.3297, 4.7317], region: "84", capacity: 3660, reactors: 4 },
  { id: 'dampierre', name: "Dampierre", coords: [47.7328, 2.5150], region: "24", capacity: 3560, reactors: 4 },
  { id: 'bugey', name: "Bugey", coords: [45.7972, 5.2708], region: "84", capacity: 3580, reactors: 4 },
  { id: 'chinon', name: "Chinon", coords: [47.2307, 0.1697], region: "24", capacity: 3620, reactors: 4 },
  { id: 'cruas', name: "Cruas", coords: [44.6335, 4.7562], region: "84", capacity: 3660, reactors: 4 },
  { id: 'nogent', name: "Nogent", coords: [48.5153, 3.5181], region: "44", capacity: 2620, reactors: 2 },
  { id: 'penly', name: "Penly", coords: [49.9769, 1.2106], region: "28", capacity: 2660, reactors: 2 },
  { id: 'belleville', name: "Belleville", coords: [47.5097, 2.8761], region: "24", capacity: 2620, reactors: 2 },
  { id: 'chooz', name: "Chooz", coords: [50.0900, 4.7900], region: "44", capacity: 3000, reactors: 2 },
  { id: 'civaux', name: "Civaux", coords: [46.4564, 0.6558], region: "75", capacity: 2990, reactors: 2 },
  { id: 'golfech', name: "Golfech", coords: [44.1067, 0.8447], region: "76", capacity: 2620, reactors: 2 },
  { id: 'saint_alban', name: "Saint-Alban", coords: [45.4042, 4.7558], region: "84", capacity: 2660, reactors: 2 },
  { id: 'flamanville', name: "Flamanville", coords: [49.5367, -1.8817], region: "28", capacity: 2660, reactors: 2 },
  { id: 'saint_laurent', name: "Saint-Laurent", coords: [47.7203, 1.5778], region: "24", capacity: 1830, reactors: 2 }
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generates dynamic outages based on dates to simulate real ODRÉ unavailability charts
export function getPlantStatus(plant, timelineIndex) {
  // Use robust string hashing to get a well-distributed pseudo-random number
  const key = `${plant.id}_${timelineIndex || 0}`;
  const hash = hashCode(key);
  const outageChance = hash % 100;
  
  if (outageChance < 8) {
    // Maintenance outage (8% chance)
    const affectedReactor = (hash % plant.reactors) + 1;
    const powerLoss = plant.capacity / plant.reactors;
    return {
      status: 'outage',
      label: `🔴 Réacteur ${affectedReactor} en maintenance`,
      outageMW: Math.round(powerLoss),
      availableMW: Math.round(plant.capacity - powerLoss),
      color: 'var(--color-danger)'
    };
  } else if (outageChance < 15) {
    // Partial load reduction (7% chance)
    const powerLoss = Math.round((plant.capacity / plant.reactors) * 0.4);
    return {
      status: 'warning',
      label: `🟡 Baisse de charge sur grille thermique`,
      outageMW: powerLoss,
      availableMW: Math.round(plant.capacity - powerLoss),
      color: 'var(--color-warning)'
    };
  }
  
  return {
    status: 'nominal',
    label: "🟢 Opérationnel - Puissance nominale",
    outageMW: 0,
    availableMW: plant.capacity,
    color: 'var(--color-success)'
  };
}
