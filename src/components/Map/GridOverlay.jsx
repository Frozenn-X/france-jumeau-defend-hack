import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Marker } from 'react-map-gl/maplibre';
import { useAppContext } from '../../context/AppContext';

// Approximate coordinates for French departments (lat, lng)
const DEPT_COORDS = {
  'Marne': [48.95, 4.35],
  'Ain': [46.10, 5.30],
  'Isère': [45.20, 5.80],
  'Gironde': [44.80, -0.60],
  'Nord': [50.60, 3.20],
  'Bouches-du-Rhône': [43.50, 5.40],
  'Rhône': [45.90, 4.70],
  'Loire': [45.70, 4.10],
  'Seine-et-Marne': [48.60, 3.00],
  'Yvelines': [48.80, 1.90],
  'Essonne': [48.50, 2.20],
  'Val-de-Marne': [48.78, 2.45],
  'Val-d\'Oise': [49.08, 2.18],
  'Oise': [49.40, 2.25],
  'Somme': [49.90, 2.20],
  'Pas-de-Calais': [50.50, 2.20],
  'Calvados': [49.10, -0.40],
  'Morbihan': [47.85, -2.70],
  'Ille-et-Vilaine': [48.15, -1.60],
  'Loire-Atlantique': [47.35, -1.70],
  'Maine-et-Loire': [47.40, -0.55],
  'Vendée': [46.65, -1.40],
  'Vienne': [46.60, 0.40],
  'Haute-Garonne': [43.60, 1.30],
  'Aude': [43.10, 2.40],
  'Hérault': [43.60, 3.20],
  'Var': [43.40, 6.20],
  'Savoie': [45.50, 6.40],
  'Haute-Savoie': [46.00, 6.40],
  'Moselle': [49.00, 6.60],
  'Meurthe-et-Moselle': [48.70, 6.20],
  'Bas-Rhin': [48.60, 7.50],
  'Haut-Rhin': [47.80, 7.30],
  'Puy-de-Dôme': [45.75, 3.25],
  'Ardennes': [49.60, 4.70],
  'Meuse': [49.00, 5.40],
  'Côte-d\'Or': [47.30, 4.80],
  'Saône-et-Loire': [46.60, 4.70],
  'Doubs': [47.20, 6.30],
  'Corrèze': [45.30, 1.90],
  'Aveyron': [44.30, 2.70],
  'Tarn-et-Garonne': [44.00, 1.20],
  'Pyrénées-Atlantiques': [43.30, -0.80],
  'Landes': [44.00, -0.80],
  'Charente-Maritime': [45.75, -0.75],
  'Charente': [45.70, 0.15],
  'Indre-et-Loire': [47.30, 0.70],
  'Indre': [46.80, 1.60],
  'Loir-et-Cher': [47.60, 1.35],
  'Eure-et-Loir': [48.40, 1.40],
  'Loiret': [47.90, 2.10],
  'Yonne': [47.80, 3.50],
  'Aube': [48.30, 4.10],
  'Aisne': [49.50, 3.60],
  'Mayenne': [48.15, -0.60],
  'Manche': [49.00, -1.30],
  'Eure': [49.10, 1.00]
};

// Deterministic jitter based on substation name to spread out nodes within the same department
function getJitter(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const jitterLat = ((hash & 0xFF) / 255 - 0.5) * 0.25;
  const jitterLng = (((hash >> 8) & 0xFF) / 255 - 0.5) * 0.25;
  return [jitterLat, jitterLng];
}

export default function GridOverlay() {
  const { mode } = useAppContext();

  const { data: substations, isLoading } = useQuery({
    queryKey: ['energy', 'substations'],
    queryFn: async () => {
      const res = await fetch('/api/energy/substations');
      if (!res.ok) throw new Error('Failed to fetch substations data');
      const data = await res.json();
      return data.results || [];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Compute positions of substations
  const positionedSubstations = useMemo(() => {
    if (!substations) return [];
    return substations.map((sub, idx) => {
      const dept = sub.departement;
      const baseCoords = DEPT_COORDS[dept] || [46.5, 2.5]; // default center of France if missing
      const [jLat, jLng] = getJitter(sub.nom_poste);
      return {
        ...sub,
        latitude: baseCoords[0] + jLat,
        longitude: baseCoords[1] + jLng,
      };
    });
  }, [substations]);

  // Only show grid overlay in expert mode
  if (mode !== 'expert' || isLoading || !substations || positionedSubstations.length === 0) return null;

  return (
    <>
      {/* Substations nodes */}
      {positionedSubstations.map((sub, idx) => {
        const is400kV = sub.tension === '400kV';
        const color = is400kV ? '#a78bfa' : '#fbbf24'; // purple for 400kV, yellow for 225kV
        const size = is400kV ? '8px' : '6px';

        return (
          <Marker
            key={`sub-${idx}`}
            longitude={sub.longitude}
            latitude={sub.latitude}
            anchor="center"
          >
            <div
              title={`${sub.nom_poste} (${sub.tension})`}
              style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 6px ${color}`,
                cursor: 'pointer',
                opacity: 0.75,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'scale(1.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '0.75';
                e.target.style.transform = 'scale(1)';
              }}
            />
          </Marker>
        );
      })}
    </>
  );
}
