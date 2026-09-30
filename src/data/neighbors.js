// Coordinates of neighboring countries and their connection anchors in France (lat, lng)
export const NEIGHBORS = {
  angleterre: {
    name: 'Royaume-Uni',
    code: 'GB',
    coords: [51.5, -0.12],
    franceAnchor: [49.89, 2.3], // Connects near Hauts-de-France/Normandie
    key: 'ech_comm_angleterre'
  },
  espagne: {
    name: 'Espagne',
    code: 'ES',
    coords: [41.38, 2.17], // Near Barcelona/Pyrenees border
    franceAnchor: [42.68, 1.5], // Occitanie anchor
    key: 'ech_comm_espagne'
  },
  italie: {
    name: 'Italie',
    code: 'IT',
    coords: [44.0, 10.0], // Northern Italy
    franceAnchor: [43.93, 7.2], // PACA anchor
    key: 'ech_comm_italie'
  },
  suisse: {
    name: 'Suisse',
    code: 'CH',
    coords: [46.8, 8.2], // Swiss Alps
    franceAnchor: [46.5, 6.2], // Rhône-Alpes/Bourgogne anchor
    key: 'ech_comm_suisse'
  },
  allemagne_belgique: {
    name: 'Allemagne / Belgique',
    code: 'DE_BE',
    coords: [50.5, 5.5], // Near Belgium/Germany border
    franceAnchor: [49.2, 6.1], // Grand Est anchor
    key: 'ech_comm_allemagne_belgique'
  }
};
