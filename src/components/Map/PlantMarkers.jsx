import React, { useState, useEffect, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-map-gl/maplibre';
import { useInstallations } from '../../hooks/useInstallations';
import { REGION_CENTERS } from '../../data/regionCenters';
import { useAppContext } from '../../context/AppContext';
import { useWeatherData } from '../../hooks/useWeatherData';
import { NUCLEAR_PLANTS, getPlantStatus } from '../../data/nuclearPlants';
import { useEnergyData } from '../../hooks/useEnergyData';
import { 
  WindIcon, SolarIcon, HydroIcon, ThermalIcon, BioIcon, 
  NuclearIcon, LightningIcon, PinIcon 
} from '../Common/Icons';

// Precise geographic centers for regional energy hubs to distribute markers naturally
const DETAILED_COORDINATES = {
  '11': { // Île-de-France
    'Eolien': [48.4, 2.1],       // Essonne / Sud-IDF
    'Solaire': [48.3, 2.8],      // Seine-et-Marne
    'Hydraulique': [48.9, 2.6],
    'Thermique fossile': [48.78, 2.45],
    'Bioénergies': [48.95, 2.3]
  },
  '24': { // Centre-Val de Loire
    'Eolien': [48.1, 1.6],       // Beauce
    'Solaire': [47.2, 2.2],      // Cher
    'Hydraulique': [46.8, 1.6],
    'Thermique fossile': [47.8, 1.8],
    'Bioénergies': [47.9, 1.9]
  },
  '27': { // Bourgogne-Franche-Comté
    'Eolien': [47.7, 4.2],       // Yonne / Côte-d'Or
    'Solaire': [46.8, 5.2],      // Saône-et-Loire
    'Hydraulique': [46.6, 5.9],  // Jura
    'Thermique fossile': [47.2, 5.9],
    'Bioénergies': [47.3, 5.0]
  },
  '28': { // Normandie
    'Eolien': [49.7, 1.1],       // Seine-Maritime / Mer du Nord
    'Solaire': [49.0, 1.0],      // Eure
    'Hydraulique': [48.6, -1.1],
    'Thermique fossile': [49.46, 0.4], // Le Havre
    'Bioénergies': [49.4, 1.0]
  },
  '32': { // Hauts-de-France
    'Eolien': [49.9, 3.0],       // Somme / Aisne
    'Solaire': [50.3, 2.8],      // Pas-de-Calais
    'Hydraulique': [49.9, 2.0],
    'Thermique fossile': [50.4, 2.9],
    'Bioénergies': [50.6, 3.1]
  },
  '44': { // Grand Est
    'Eolien': [48.8, 4.3],       // Marne
    'Solaire': [48.2, 6.0],      // Vosges
    'Hydraulique': [47.8, 7.5],  // Rhin (Centrales hydroélectriques majeures)
    'Thermique fossile': [49.2, 6.1], // Emile Huchet
    'Bioénergies': [48.6, 7.7]
  },
  '52': { // Pays de la Loire
    'Eolien': [47.2, -1.9],      // Loire-Atlantique
    'Solaire': [46.6, -1.4],     // Vendée
    'Hydraulique': [48.0, -0.3],
    'Thermique fossile': [47.27, -1.88], // Cordemais
    'Bioénergies': [47.4, -0.6]
  },
  '53': { // Bretagne
    'Eolien': [48.5, -2.8],      // Côtes-d'Armor
    'Solaire': [47.8, -3.3],     // Morbihan
    'Hydraulique': [48.01, -2.01], // La Rance (Marémotrice)
    'Thermique fossile': [48.1, -1.7],
    'Bioénergies': [48.2, -3.0]
  },
  '75': { // Nouvelle-Aquitaine
    'Eolien': [46.0, 0.2],       // Deux-Sèvres
    'Solaire': [44.4, -0.7],     // Landes (Cestas)
    'Hydraulique': [43.0, -0.6], // Pyrénées
    'Thermique fossile': [45.6, -0.3],
    'Bioénergies': [44.8, -0.5]
  },
  '76': { // Occitanie
    'Eolien': [43.6, 3.1],       // Aude
    'Solaire': [43.8, 4.3],      // Gard
    'Hydraulique': [42.8, 1.2],  // Pyrénées (Ariège)
    'Thermique fossile': [43.5, 1.4],
    'Bioénergies': [43.6, 2.2]
  },
  '84': { // Auvergne-Rhône-Alpes
    'Eolien': [45.1, 3.2],       // Haute-Loire
    'Solaire': [44.5, 4.8],      // Drôme
    'Hydraulique': [45.4, 6.4],  // Savoie / Alpes (Barrages hydroélectriques majeurs)
    'Thermique fossile': [45.8, 5.1],
    'Bioénergies': [45.7, 4.8]
  },
  '93': { // Provence-Alpes-Côte d'Azur
    'Eolien': [43.4, 4.9],       // Fos-sur-mer
    'Solaire': [44.1, 5.9],      // Alpes-de-Haute-Provence
    'Hydraulique': [43.7, 6.1],  // Durance / Verdon
    'Thermique fossile': [43.4, 5.4],
    'Bioénergies': [43.5, 6.0]
  },
  '94': { // Corse
    'Eolien': [42.9, 9.3],       // Cap Corse
    'Solaire': [41.6, 9.0],      // Sud Corse
    'Hydraulique': [42.3, 9.1],  // Montagne corse
    'Thermique fossile': [42.7, 9.4], // Lucciana/Vazzio
    'Bioénergies': [42.0, 9.0]
  }
};

// CSS animations for the markers
const markerStyleTag = `
@keyframes spin-turbine {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes sun-pulse {
  0%, 100% { box-shadow: 0 0 8px #fbbf24; transform: scale(1); }
  50% { box-shadow: 0 0 20px #fbbf24; transform: scale(1.1); }
}
@keyframes nuclear-glow {
  0%, 100% { box-shadow: 0 0 8px #818cf8; transform: scale(1); }
  50% { box-shadow: 0 0 20px #818cf8; transform: scale(1.05); }
}
@keyframes nuclear-outage-pulse {
  0%, 100% { box-shadow: 0 0 8px #f43f5e; transform: scale(1); }
  50% { box-shadow: 0 0 22px #f43f5e; transform: scale(1.08); }
}
@keyframes hydro-pulse {
  0%, 100% { box-shadow: 0 0 8px #3b82f6; transform: scale(1); }
  50% { box-shadow: 0 0 16px #3b82f6; transform: scale(1.05); }
}
@keyframes thermal-flicker {
  0%, 100% { box-shadow: 0 0 6px #ef4444; opacity: 0.9; }
  50% { box-shadow: 0 0 16px #ef4444; opacity: 1; }
}
`;

const FILIERE_CONFIGS = {
  'Eolien': {
    icon: WindIcon,
    color: '#22d3ee',
    animation: 'spin-turbine 4s infinite linear',
    offset: [0.12, 0.12]
  },
  'Solaire': {
    icon: SolarIcon,
    color: '#fbbf24',
    animation: 'sun-pulse 2s infinite ease-in-out',
    offset: [-0.12, -0.12]
  },
  'Hydraulique': {
    icon: HydroIcon,
    color: '#3b82f6',
    animation: 'hydro-pulse 3s infinite ease-in-out',
    offset: [-0.12, 0.12]
  },
  'Thermique fossile': {
    icon: ThermalIcon,
    color: '#ef4444',
    animation: 'thermal-flicker 1.5s infinite ease-in-out',
    offset: [0.0, 0.18]
  },
  'Bioénergies': {
    icon: BioIcon,
    color: '#34d399',
    animation: 'hydro-pulse 4s infinite ease-in-out',
    offset: [0.0, -0.18]
  }
};

export default function PlantMarkers() {
  const { mode, timelineIndex, setDetailedItem, selectedPlant, setSelectedPlant, setSelectedRegion, setSelectedCityName } = useAppContext();
  const { data: installations, isLoading } = useInstallations();
  const { current: weather } = useWeatherData();
  const [hoveredPlant, setHoveredPlant] = useState(null);
  
  // Realtime network records for timestamps
  const { national, regional } = useEnergyData();
  const currentRecord = national ? national[timelineIndex] || national[0] : null;

  // React to map zoom levels to manage marker clustering density
  const { current: map } = useMap();
  const [zoom, setZoom] = useState(map ? map.getZoom() : 5.8);

  useEffect(() => {
    if (!map) return;
    const handleZoomUpdate = () => {
      setZoom(map.getZoom());
    };
    map.on('zoom', handleZoomUpdate);
    map.on('move', handleZoomUpdate);
    return () => {
      map.off('zoom', handleZoomUpdate);
      map.off('move', handleZoomUpdate);
    };
  }, [map]);

  const markerScale = Math.min(1.35, Math.max(0.65, 1 + (zoom - 5.8) * 0.18));

  // Filter out aggregated generic nuclear plants from ODRÉ
  const otherInstallations = useMemo(() => {
    if (!installations) return [];
    return installations.filter(plant => plant.filiere !== 'Nucléaire');
  }, [installations]);

  const regionalSummaries = useMemo(() => {
    const rMap = {};
    otherInstallations.forEach(plant => {
      const regionCode = plant.coderegion;
      if (!rMap[regionCode]) {
        rMap[regionCode] = {
          regionCode,
          regionName: plant.region,
          totalCapacity: 0,
          breakdown: []
        };
      }
      rMap[regionCode].totalCapacity += plant.puissance_totale || 0;
      rMap[regionCode].breakdown.push({
        filiere: plant.filiere,
        capacity: plant.puissance_totale || 0,
        count: plant.nb_installations || 0
      });
    });
    return Object.values(rMap);
  }, [otherInstallations]);

  if (isLoading || !installations) return null;

  return (
    <>
      <style>{markerStyleTag}</style>

      {/* 1. Specific Named Nuclear Plants */}
      {NUCLEAR_PLANTS.map((plant) => {
        const coords = plant.coords;
        const status = getPlantStatus(plant, timelineIndex);
        
        const size = Math.min(35, Math.max(20, (plant.capacity / 6000) * 15 + 20)) * markerScale;
        
        let markerColor = '#818cf8'; // Nominal blue/indigo
        let activeAnimation = 'nuclear-glow 3s infinite ease-in-out';
        
        if (status.status === 'outage') {
          markerColor = '#f43f5e'; // Red
          activeAnimation = 'nuclear-outage-pulse 1.8s infinite ease-in-out';
        } else if (status.status === 'warning') {
          markerColor = '#fbbf24'; // Yellow
          activeAnimation = 'nuclear-outage-pulse 2.5s infinite ease-in-out';
        }

        return (
          <React.Fragment key={`nuclear-${plant.id}`}>
            <Marker
              longitude={coords[1]}
              latitude={coords[0]}
              anchor="center"
            >
              <div
                onMouseEnter={() => setHoveredPlant({
                  isNuclear: true,
                  name: plant.name,
                  capacity: plant.capacity,
                  reactors: plant.reactors,
                  statusLabel: status.label,
                  outageMW: status.outageMW,
                  availableMW: status.availableMW,
                  statusType: status.status,
                  color: markerColor,
                  longitude: coords[1],
                  latitude: coords[0]
                })}
                onMouseLeave={() => setHoveredPlant(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlant({
                    isNuclear: true,
                    name: plant.name,
                    capacity: plant.capacity,
                    reactors: plant.reactors,
                    statusLabel: status.label,
                    outageMW: status.outageMW,
                    availableMW: status.availableMW,
                    statusType: status.status,
                    color: markerColor,
                    longitude: coords[1],
                    latitude: coords[0]
                  });
                  setSelectedRegion(null);
                  setSelectedCityName(null);
                  setHoveredPlant(null);
                }}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: 'rgba(10, 14, 26, 0.9)',
                  border: `2px solid ${markerColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: `${size * 0.5}px`,
                  animation: activeAnimation,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 0 12px ${markerColor}`
                }}
              >
                <NuclearIcon size={size * 0.55} color="#ffffff" style={{ transform: 'translateY(-1px)' }} />
              </div>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* 2. Regional summaries when zoomed out */}
      {zoom < 6.0 && regionalSummaries.map((summary) => {
        const center = REGION_CENTERS[summary.regionCode];
        if (!center) return null;

        const totalCapacityGW = (summary.totalCapacity / 1000).toFixed(1);

        return (
          <React.Fragment key={`summary-${summary.regionCode}`}>
            <Marker
              longitude={center[1]}
              latitude={center[0]}
              anchor="center"
            >
              <div
                onMouseEnter={() => setHoveredPlant({
                  isRegionSummary: true,
                  regionCode: summary.regionCode,
                  regionName: summary.regionName,
                  totalCapacity: summary.totalCapacity,
                  breakdown: summary.breakdown,
                  color: '#a78bfa',
                  longitude: center[1],
                  latitude: center[0]
                })}
                onMouseLeave={() => setHoveredPlant(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlant({
                    isRegionSummary: true,
                    regionCode: summary.regionCode,
                    regionName: summary.regionName,
                    totalCapacity: summary.totalCapacity,
                    breakdown: summary.breakdown,
                    color: '#a78bfa',
                    longitude: center[1],
                    latitude: center[0]
                  });
                  setSelectedRegion(null);
                  setSelectedCityName(null);
                  setHoveredPlant(null);
                }}
                style={{
                  background: 'rgba(10, 14, 26, 0.85)',
                  border: '2px solid #a78bfa',
                  borderRadius: '16px',
                  padding: '4px 8px',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 10px rgba(167, 139, 250, 0.5)',
                  animation: 'nuclear-glow 4s infinite ease-in-out',
                  transition: 'all 0.3s ease'
                }}
              >
                <LightningIcon size={12} color="#ffffff" />
                <span>{totalCapacityGW} GW</span>
              </div>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* 3. Other Aggregated Renewable & Fossil Plants (Zoom & Clustering density logic) */}
      {zoom >= 6.0 && otherInstallations.map((plant, idx) => {
        const regionCode = plant.coderegion;
        const preciseCoords = DETAILED_COORDINATES[regionCode]?.[plant.filiere];
        const baseCoords = preciseCoords || REGION_CENTERS[regionCode];
        if (!baseCoords) return null;

        const config = FILIERE_CONFIGS[plant.filiere] || {
          icon: LightningIcon,
          color: '#a78bfa',
          animation: '',
          offset: [0, 0]
        };

        const latitude = baseCoords[0];
        const longitude = baseCoords[1];

        const totalCapacity = plant.puissance_totale || 0;
        const capacityMW = totalCapacity >= 1000 ? Math.round(totalCapacity / 1000) : Math.round(totalCapacity);
        const count = plant.nb_installations || 0;

        // Shrink markers when zoomed out to reduce visual noise
        const sizeMultiplier = zoom < 7.0 ? 0.75 : 1.0;
        const opacity = zoom < 7.0 ? 0.75 : 1.0;
        const size = Math.min(38, Math.max(20, (capacityMW / 15000) * 18 + 20)) * sizeMultiplier;

        const regionWeather = weather?.byRegion?.[regionCode] || {};
        const windSpeed = regionWeather.windSpeed || 15;
        const cloudCover = regionWeather.cloudCover || 20;

        let activeAnimation = config.animation;
        if (plant.filiere === 'Eolien') {
          const spinDuration = windSpeed > 3 ? `${Math.max(0.4, Math.min(10, 60 / windSpeed))}s` : '0s';
          activeAnimation = spinDuration !== '0s' ? `spin-turbine ${spinDuration} infinite linear` : 'none';
        } else if (plant.filiere === 'Solaire') {
          const pulseDuration = `${Math.max(1.2, Math.min(6.0, 1.2 + (cloudCover / 100) * 4.8))}s`;
          activeAnimation = `sun-pulse ${pulseDuration} infinite ease-in-out`;
        }

        return (
          <React.Fragment key={`${regionCode}-${plant.filiere}-${idx}`}>
            <Marker
              longitude={longitude}
              latitude={latitude}
              anchor="center"
            >
              <div
                onMouseEnter={() => setHoveredPlant({
                  isNuclear: false,
                  filiere: plant.filiere,
                  region: plant.region,
                  capacityMW,
                  count,
                  color: config.color,
                  icon: config.icon,
                  longitude,
                  latitude
                })}
                onMouseLeave={() => setHoveredPlant(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlant({
                    isNuclear: false,
                    filiere: plant.filiere,
                    region: plant.region,
                    capacityMW,
                    count,
                    color: config.color,
                    icon: config.icon,
                    longitude,
                    latitude
                  });
                  setSelectedRegion(null);
                  setSelectedCityName(null);
                  setHoveredPlant(null);
                }}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: 'rgba(10, 14, 26, 0.85)',
                  border: `2px solid ${config.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: `${size * 0.5}px`,
                  animation: activeAnimation,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 0 10px ${config.color}`,
                  opacity: opacity
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.createElement(config.icon, { size: Math.max(10, size * 0.55), color: config.color })}
                </span>
              </div>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* Hover Popup details */}
      {hoveredPlant && (!selectedPlant || selectedPlant.longitude !== hoveredPlant.longitude || selectedPlant.latitude !== hoveredPlant.latitude) && (
        <Popup
          longitude={hoveredPlant.longitude}
          latitude={hoveredPlant.latitude}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
          offset={15}
        >
          <div
            style={{
              background: 'rgba(17, 24, 39, 0.95)',
              border: `1px solid ${hoveredPlant.color}`,
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f9fafb',
              fontFamily: 'Inter, sans-serif',
              pointerEvents: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              maxWidth: '260px'
            }}
          >
            {hoveredPlant.isRegionSummary ? (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <PinIcon size={12} color="#a78bfa" />
                  <span>Mix Régional : {hoveredPlant.regionName}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '4px' }}>
                  {hoveredPlant.breakdown.map((item, i) => {
                    const config = FILIERE_CONFIGS[item.filiere] || { icon: LightningIcon, color: '#a78bfa' };
                    const capacityGW = item.capacity >= 1000 ? (item.capacity / 1000).toFixed(1) : Math.round(item.capacity);
                    const unit = item.capacity >= 1000 ? 'GW' : 'MW';
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
                        <span style={{ color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {React.createElement(config.icon, { size: 12, color: config.color })}
                          <span>{item.filiere === 'Thermique fossile' ? 'Thermique Fossile' : item.filiere}</span>
                        </span>
                        <span style={{ color: config.color, fontWeight: 'bold' }}>{capacityGW} {unit}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '8.5px', color: '#9ca3af', marginTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '4px', textAlign: 'right' }}>
                  Données du {currentRecord ? (currentRecord.date && currentRecord.heure ? `${currentRecord.date.split('-').reverse().join('/')} à ${currentRecord.heure}` : new Date(currentRecord.date_heure).toLocaleString('fr-FR')) : 'En attente...'}
                </div>
              </>
            ) : hoveredPlant.isNuclear ? (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: hoveredPlant.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <NuclearIcon size={13} color={hoveredPlant.color} />
                  <span>Centrale de {hoveredPlant.name}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                  {hoveredPlant.statusLabel}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Max installée</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>
                      {hoveredPlant.capacity.toLocaleString('fr-FR')} MW
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Puissance Active</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: hoveredPlant.statusType === 'nominal' ? 'var(--color-success)' : hoveredPlant.statusType === 'warning' ? 'var(--color-warning)' : '#ffffff' }}>
                      {hoveredPlant.availableMW.toLocaleString('fr-FR')} MW
                    </div>
                  </div>
                </div>
                {hoveredPlant.outageMW > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '9px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '3px 6px', borderRadius: '4px', textAlign: 'center' }}>
                    Indisponibilité : -{hoveredPlant.outageMW.toLocaleString('fr-FR')} MW
                  </div>
                )}
                <div style={{ fontSize: '8.5px', color: '#9ca3af', marginTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '4px', textAlign: 'right' }}>
                  Données : {currentRecord ? (currentRecord.date && currentRecord.heure ? `${currentRecord.date.split('-').reverse().join('/')} à ${currentRecord.heure}` : new Date(currentRecord.date_heure).toLocaleString('fr-FR')) : 'En attente...'}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: hoveredPlant.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {React.createElement(hoveredPlant.icon, { size: 13, color: hoveredPlant.color })}
                  <span>{hoveredPlant.filiere === 'Thermique fossile' ? 'Thermique Fossile' : hoveredPlant.filiere}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                  Région: {hoveredPlant.region}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Capacité</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                      {hoveredPlant.capacityMW.toLocaleString('fr-FR')} MW
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Sites</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                      {hoveredPlant.count.toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '8.5px', color: '#9ca3af', marginTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '4px', textAlign: 'right' }}>
                  Données : {currentRecord ? (currentRecord.date && currentRecord.heure ? `${currentRecord.date.split('-').reverse().join('/')} à ${currentRecord.heure}` : new Date(currentRecord.date_heure).toLocaleString('fr-FR')) : 'En attente...'}
                </div>
              </>
            )}
          </div>
        </Popup>
      )}

      {/* Selected/Clicked Plant Popup */}
      {selectedPlant && (
        <Popup
          longitude={selectedPlant.longitude}
          latitude={selectedPlant.latitude}
          anchor="bottom"
          closeButton={true}
          closeOnClick={false}
          onClose={() => setSelectedPlant(null)}
          offset={15}
        >
          <div
            style={{
              background: 'rgba(10, 14, 26, 0.98)',
              border: `1px solid ${selectedPlant.color}`,
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#f9fafb',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 25px rgba(0,0,0,0.6)',
              minWidth: '220px',
              maxWidth: '260px'
            }}
          >
            {selectedPlant.isRegionSummary ? (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <PinIcon size={12} color="#a78bfa" />
                  <span>Mix Régional : {selectedPlant.regionName}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '4px' }}>
                  {selectedPlant.breakdown.map((item, i) => {
                    const config = FILIERE_CONFIGS[item.filiere] || { icon: LightningIcon, color: '#a78bfa' };
                    const capacityGW = item.capacity >= 1000 ? (item.capacity / 1000).toFixed(1) : Math.round(item.capacity);
                    const unit = item.capacity >= 1000 ? 'GW' : 'MW';
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
                        <span style={{ color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {React.createElement(config.icon, { size: 12, color: config.color })}
                          <span>{item.filiere === 'Thermique fossile' ? 'Thermique Fossile' : item.filiere}</span>
                        </span>
                        <span style={{ color: config.color, fontWeight: 'bold' }}>{capacityGW} {unit}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : selectedPlant.isNuclear ? (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: selectedPlant.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <NuclearIcon size={13} color={selectedPlant.color} />
                  <span>Centrale de {selectedPlant.name}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                  {selectedPlant.statusLabel}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Max installée</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>
                      {selectedPlant.capacity.toLocaleString('fr-FR')} MW
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Puissance Active</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: selectedPlant.statusType === 'nominal' ? 'var(--color-success)' : selectedPlant.statusType === 'warning' ? 'var(--color-warning)' : '#ffffff' }}>
                      {selectedPlant.availableMW.toLocaleString('fr-FR')} MW
                    </div>
                  </div>
                </div>
                {selectedPlant.outageMW > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '9px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '3px 6px', borderRadius: '4px', textAlign: 'center' }}>
                    Indisponibilité : -{selectedPlant.outageMW.toLocaleString('fr-FR')} MW
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: selectedPlant.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {React.createElement(selectedPlant.icon, { size: 13, color: selectedPlant.color })}
                  <span>{selectedPlant.filiere === 'Thermique fossile' ? 'Thermique Fossile' : selectedPlant.filiere}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                  Région: {selectedPlant.region}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Capacité</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                      {selectedPlant.capacityMW.toLocaleString('fr-FR')} MW
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Sites</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                      {selectedPlant.count.toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div style={{ fontSize: '8px', color: '#9ca3af', marginTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '4px', textAlign: 'right' }}>
              Données : {currentRecord ? (currentRecord.date && currentRecord.heure ? `${currentRecord.date.split('-').reverse().join('/')} à ${currentRecord.heure}` : new Date(currentRecord.date_heure).toLocaleString('fr-FR')) : 'En attente...'}
            </div>

            {/* Action button details */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => {
                  if (selectedPlant.isNuclear) {
                    setDetailedItem({
                      type: 'plant',
                      id: selectedPlant.name,
                      name: selectedPlant.name,
                      data: selectedPlant
                    });
                  } else if (selectedPlant.isRegionSummary) {
                    setDetailedItem({
                      type: 'region',
                      id: selectedPlant.regionCode,
                      name: selectedPlant.regionName,
                      data: regional?.[selectedPlant.regionCode]
                    });
                  } else {
                    setDetailedItem({
                      type: 'plant',
                      id: `${selectedPlant.region}_${selectedPlant.filiere}`,
                      name: `${selectedPlant.filiere} - ${selectedPlant.region}`,
                      data: selectedPlant
                    });
                  }
                }}
                style={{
                  background: 'rgba(96, 165, 250, 0.1)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  borderRadius: '4px',
                  color: '#60a5fa',
                  padding: '3px 8px',
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
      )}
    </>
  );
}
