export const SCENARIOS = [
  {
    id: 'canicule',
    title: "☀️ Canicule & Calme Blanc",
    date: "Août 2022",
    windDelta: -90,
    solarDelta: 50,
    tempDelta: 15,
    importOverrides: {},
    description: "Une période de chaleur extrême combinée à une absence totale de vent (appelée calme blanc). La climatisation pousse la demande nationale à la hausse tandis que la production éolienne est paralysée, forçant le recours massif au thermique de pointe et aux importations.",
    lessons: "Ce scénario illustre les limites des énergies intermittentes sans stockage associé et démontre la solidarité électrique indispensable à l'échelle européenne."
  },
  {
    id: 'moscou_paris',
    title: "❄️ Moscou-Paris (Vague de froid)",
    date: "Février 2012",
    windDelta: 15,
    solarDelta: -30,
    tempDelta: -15,
    importOverrides: {},
    description: "Un flux polaire sibérien fait chuter les températures 15°C sous les moyennes saisonnières. La France fait face à une thermosensibilité record (chaque degré en moins augmente la conso nationale de 1 500 MW due au chauffage électrique).",
    lessons: "Ce pic de charge historique montre comment la disponibilité de la production pilotable (nucléaire, hydraulique) et l'effacement industriel évitent le délestage."
  },
  {
    id: 'eclipse',
    title: "🌑 Éclipse Solaire Majeure",
    date: "Mars 2015",
    windDelta: 0,
    solarDelta: -100,
    tempDelta: 0,
    importOverrides: {},
    description: "Le passage de la lune coupe brutalement la quasi-totalité de l'irradiation solaire en pleine matinée sur l'Europe continentale. La perte instantanée de puissance solaire doit être compensée à la minute près.",
    lessons: "Ce scénario met en évidence la vitesse de rampe (réactivité de démarrage) requise sur les barrages hydroélectriques et les centrales à gaz pour maintenir la fréquence de 50 Hz stable."
  },
  {
    id: 'tempete',
    title: "💨 Tempête & Sécurité Éolienne",
    date: "Tempête Ciaran 2023",
    windDelta: -60, // Due to security cut-off
    solarDelta: -40,
    tempDelta: -2,
    importOverrides: {},
    description: "Des vents cycloniques dépassent les 120 km/h. Paradoxalement, cela fait chuter la production éolienne : par sécurité mécanique, les turbines s'arrêtent et se mettent en drapeau à partir de 90 km/h.",
    lessons: "Ce cas de figure montre le mécanisme de coupure (cut-off) éolien, crucial pour protéger le matériel mais contraignant pour l'équilibre prédictif du gestionnaire de réseau."
  }
];
