import React, { useState, useMemo, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-map-gl/maplibre';
import { useMetropoles } from '../../hooks/useMetropoles';
import { METRO_COORDS } from '../Panels/MetropoleDetail';
import { useAppContext } from '../../context/AppContext';

export default function CityMarkers() {
  const { setDetailedItem, selectedCityName, setSelectedCityName, setSelectedRegion, setSelectedPlant } = useAppContext();
  const { data: metropoles, isLoading } = useMetropoles();
  const [hoveredCity, setHoveredCity] = useState(null);
  const { current: map } = useMap();
  const [zoom, setZoom] = useState(map ? map.getZoom() : 5.8);

  useEffect(() => {
    if (!map) return;
    const updateZoom = () => setZoom(map.getZoom());
    map.on('zoom', updateZoom);
    return () => map.off('zoom', updateZoom);
  }, [map]);

  const markerScale = Math.min(1.35, Math.max(0.65, 1 + (zoom - 5.8) * 0.18));

  // Extract unique and latest records for each metropole
  const latestMetropoles = useMemo(() => {
    if (!metropoles || metropoles.length === 0) return {};
    
    const groups = {};
    metropoles.forEach((record) => {
      const name = record.libelle_metropole;
      if (name) {
        if (!groups[name] || record.date_heure > groups[name].date_heure) {
          groups[name] = record;
        }
      }
    });

    return groups;
  }, [metropoles]);

  if (isLoading || !metropoles || metropoles.length === 0) return null;

  // Safe parsing helper
  const parseVal = (val) => {
    if (val === undefined || val === null || val === 'ND') return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const getCleanName = (fullName) => {
    return fullName
      .replace('Métropole du ', '')
      .replace('Métropole d\'', '')
      .replace('Métropole ', '')
      .replace('Strasbourg Eurométropole', 'Strasbourg')
      .replace('Metz Métropole', 'Metz')
      .replace('Toulon Provence Méditerranée', 'Toulon');
  };

  return (
    <>
      {/* City Markers */}
      {Object.entries(latestMetropoles).map(([fullName, record]) => {
        // Resolve coords
        const cleanName = getCleanName(fullName);
        const coords = METRO_COORDS[cleanName] || Object.entries(METRO_COORDS).find(([key]) => fullName.includes(key) || key.includes(cleanName))?.[1];
        
        if (!coords) return null;

        const conso = parseVal(record.consommation);
        const prod = parseVal(record.production);
        const hasProd = record.production !== undefined && record.production !== null && record.production !== 'ND';

        return (
          <React.Fragment key={fullName}>
            <Marker
              longitude={coords[1]}
              latitude={coords[0]}
              anchor="center"
            >
              <div
                onMouseEnter={() => setHoveredCity({
                  name: fullName,
                  cleanName,
                  conso,
                  prod,
                  hasProd,
                  record,
                  coords
                })}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCityName(fullName);
                  setSelectedRegion(null);
                  setSelectedPlant(null);
                  setHoveredCity(null);
                }}
                style={{
                  width: `${16 * markerScale}px`,
                  height: `${16 * markerScale}px`,
                  borderRadius: '50%',
                  background: 'rgba(10, 14, 26, 0.95)',
                  border: '2px solid #ec4899', // Pink city color
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px #ec4899, inset 0 0 4px #ec4899',
                  transition: 'all 0.2s',
                  transform: hoveredCity?.name === fullName || selectedCityName === fullName ? 'scale(1.25)' : 'scale(1)'
                }}
              >
                <div style={{
                  width: `${6 * markerScale}px`,
                  height: `${6 * markerScale}px`,
                  borderRadius: '50%',
                  background: '#ffffff'
                }} />
              </div>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* Hover Popup details (non-interactive, quick summary) */}
      {hoveredCity && selectedCityName !== hoveredCity.name && (
        <Popup
          longitude={hoveredCity.coords[1]}
          latitude={hoveredCity.coords[0]}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
          offset={12}
        >
          <div
            style={{
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid #ec4899',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#f9fafb',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              maxWidth: '220px',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#ec4899', marginBottom: '4px' }}>
              🏙️ {hoveredCity.cleanName}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Consommation :</span>
                <b>{Math.round(hoveredCity.conso).toLocaleString('fr-FR')} MW</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Production :</span>
                <b>{hoveredCity.hasProd && hoveredCity.prod > 0 ? `${Math.round(hoveredCity.prod).toLocaleString('fr-FR')} MW` : 'N/D'}</b>
              </div>
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'right', fontStyle: 'italic' }}>
              Clic pour fixer et voir +
            </div>
          </div>
        </Popup>
      )}

      {/* Selected/Clicked Popup (Interactive with Details button) */}
      {selectedCityName && (() => {
        const record = latestMetropoles[selectedCityName];
        if (!record) return null;

        const cleanName = getCleanName(selectedCityName);
        const coords = METRO_COORDS[cleanName] || Object.entries(METRO_COORDS).find(([key]) => selectedCityName.includes(key) || key.includes(cleanName))?.[1];
        if (!coords) return null;

        const conso = parseVal(record.consommation);
        const prod = parseVal(record.production);
        const hasProd = record.production !== undefined && record.production !== null && record.production !== 'ND';
        const net = prod - conso;

        return (
          <Popup
            longitude={coords[1]}
            latitude={coords[0]}
            anchor="bottom"
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedCityName(null)}
            offset={12}
          >
            <div
              style={{
                background: 'rgba(10, 14, 26, 0.98)',
                border: '1px solid #ec4899',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#f9fafb',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                minWidth: '220px',
                maxWidth: '260px'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#ec4899', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
                🏙️ Métropole de {cleanName}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Consommation :</span>
                  <b style={{ color: 'var(--color-import)' }}>{Math.round(conso).toLocaleString('fr-FR')} MW</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Prod. locale :</span>
                  <b style={{ color: hasProd && prod > 0 ? 'var(--color-export)' : 'var(--text-secondary)' }}>
                    {hasProd && prod > 0 ? `${Math.round(prod).toLocaleString('fr-FR')} MW` : 'N/D'}
                  </b>
                </div>
                {hasProd && prod > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Autonomie :</span>
                    <b>{conso > 0 ? Math.round((prod / conso) * 100) : 0}%</b>
                  </div>
                )}
                {hasProd && prod > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Solde local :</span>
                    <b style={{ color: net >= 0 ? 'var(--color-export)' : 'var(--color-import)' }}>
                      {net >= 0 ? `Export (+${Math.round(net)})` : `Déficit (${Math.round(net)})`}
                    </b>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                <button
                  onClick={() => setDetailedItem({
                    type: 'metropole',
                    id: selectedCityName,
                    name: selectedCityName,
                    data: record
                  })}
                  style={{
                    background: 'rgba(96, 165, 250, 0.1)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    borderRadius: '4px',
                    color: '#60a5fa',
                    padding: '3px 6px',
                    fontSize: '9.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'}
                >
                  + de détails
                </button>
              </div>
            </div>
          </Popup>
        );
      })()}
    </>
  );
}
