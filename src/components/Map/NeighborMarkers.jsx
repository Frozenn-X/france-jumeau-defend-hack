import React, { useState, useMemo } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { NEIGHBORS } from '../../data/neighbors';
import { useAppContext } from '../../context/AppContext';

const NEIGHBOR_DETAILS = {
  angleterre: {
    code: 'UK',
    carbon: 145,
    mixDesc: "Transition rapide vers l'éolien offshore et le nucléaire, avec backup gaz.",
    color: '#60a5fa'
  },
  espagne: {
    code: 'ES',
    carbon: 110,
    mixDesc: "Excellent mix solaire et éolien complété par des cycles combinés gaz.",
    color: '#fbbf24'
  },
  italie: {
    code: 'IT',
    carbon: 275,
    mixDesc: "Mix fortement dominé par le gaz naturel et de faibles imports renouvelables.",
    color: '#f97316'
  },
  suisse: {
    code: 'CH',
    carbon: 28,
    mixDesc: "Mix électrique très bas carbone grâce à 60% d'hydroélectricité et 35% de nucléaire.",
    color: '#10b981'
  },
  allemagne_belgique: {
    code: 'DE/BE',
    carbon: 360,
    mixDesc: "Sortie du nucléaire compensée par le charbon/lignite et le gaz en période sans vent.",
    color: '#f43f5e'
  }
};

export default function NeighborMarkers({ nationalData }) {
  const { timelineIndex } = useAppContext();
  const [hoveredNeighbor, setHoveredNeighbor] = useState(null);

  const latestRecord = useMemo(() => {
    if (!nationalData || nationalData.length === 0) return null;
    return nationalData[0];
  }, [nationalData]);

  if (!latestRecord) return null;

  return (
    <>
      {Object.entries(NEIGHBORS).map(([key, neighbor]) => {
        const val = latestRecord[neighbor.key] || 0;
        const details = NEIGHBOR_DETAILS[key] || { code: 'EU', carbon: 150, mixDesc: '', color: '#ffffff' };
        
        const isExport = val < 0;
        const absVal = Math.abs(val);

        return (
          <React.Fragment key={key}>
            <Marker
              longitude={neighbor.coords[1]}
              latitude={neighbor.coords[0]}
              anchor="center"
            >
              <div
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  setHoveredNeighbor({
                    ...neighbor,
                    ...details,
                    flow: val,
                    absFlow: absVal,
                    isExport
                  });
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  setHoveredNeighbor(null);
                }}
                style={{
                  background: 'rgba(17, 24, 39, 0.9)',
                  border: `1px solid ${details.color}`,
                  borderRadius: '16px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  transition: 'all 0.2s',
                  pointerEvents: 'auto'
                }}
              >
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '1px 3px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: '800',
                  color: details.color,
                  lineHeight: '1'
                }}>
                  {details.code}
                </span>
                {val !== 0 && (
                  <span style={{
                    fontSize: '11px',
                    color: isExport ? 'var(--color-export)' : 'var(--color-import)'
                  }}>
                    {isExport ? '↗' : '↙'}
                  </span>
                )}
              </div>
            </Marker>
          </React.Fragment>
        );
      })}

      {hoveredNeighbor && (
        <Popup
          longitude={hoveredNeighbor.coords[1]}
          latitude={hoveredNeighbor.coords[0]}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
          offset={18}
        >
          <div style={{
            background: 'rgba(17, 24, 39, 0.96)',
            border: `1px solid ${hoveredNeighbor.color}`,
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f9fafb',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            maxWidth: '240px',
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--border-light)',
                padding: '1px 4px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: '800',
                color: hoveredNeighbor.color
              }}>
                {hoveredNeighbor.code}
              </span>
              <span>{hoveredNeighbor.name}</span>
            </div>
            
            <div style={{ fontSize: '11px', margin: '4px 0 8px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              Mix Carbone : <strong style={{ color: hoveredNeighbor.carbon < 50 ? 'var(--color-success)' : hoveredNeighbor.carbon < 200 ? 'var(--color-warning)' : '#ef4444' }}>
                {hoveredNeighbor.carbon} gCO₂/kWh
              </strong>
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '8px' }}>
              {hoveredNeighbor.mixDesc}
            </div>

            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: '4px' }}>
              <span>Flux commercial :</span>
              <strong style={{ color: hoveredNeighbor.flow === 0 ? '#ffffff' : hoveredNeighbor.isExport ? 'var(--color-export)' : 'var(--color-import)' }}>
                {hoveredNeighbor.flow === 0 ? 'Aucun' : `${hoveredNeighbor.isExport ? 'Export' : 'Import'} ${Math.round(hoveredNeighbor.absFlow).toLocaleString('fr-FR')} MW`}
              </strong>
            </div>
            <div style={{ fontSize: '8.5px', color: '#9ca3af', marginTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '4px', textAlign: 'right' }}>
              Données : {latestRecord ? (latestRecord.date && latestRecord.heure ? `${latestRecord.date.split('-').reverse().join('/')} à ${latestRecord.heure}` : new Date(latestRecord.date_heure).toLocaleString('fr-FR')) : 'En attente...'}
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}
