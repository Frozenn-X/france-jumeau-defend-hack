import React from 'react';
import { Popup } from 'react-map-gl/maplibre';
import { REGION_CENTERS, REGION_NAMES } from '../../data/regionCenters';
import { WindIcon } from '../Common/Icons';
import { useAppContext } from '../../context/AppContext';

const COMPACT_EXPLANATIONS = {
  '11': "Déficit structurel : produit <10% de ses besoins, dépend des importations.",
  '24': "Hub de production nucléaire fluviale le long de la Loire.",
  '27': "Transition éolienne de plaine et biomasse forestière.",
  '28': "Nucléaire littoral Manche et essor éolien en mer (offshore).",
  '32': "Plaines agricoles et maritimes : 1ère région éolienne de France.",
  '44': "Mix nucléaire rhénan et fort potentiel éolien de plaine.",
  '52': "Éolien offshore récent (Saint-Nazaire) et centrale de Cordemais.",
  '53': "Péninsule isolée : essor éolien et hydraulique de la Rance.",
  '75': "Grands parcs solaires dans les Landes et nucléaire sur la Gironde.",
  '76': "Mix hydroélectrique pyrénéen et ensoleillement optimal.",
  '84': "1ère région hydroélectrique (Alpes) et nucléaire rhodanien.",
  '93': "Ensoleillement azuréen record et hydraulique de la Durance.",
  '94': "Réseau isolé dépendant du thermique fioul et de l'hydro."
};

const renderWeatherIcon = (icon) => {
  if (icon === 'sun') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>
    );
  }
  if (icon === 'cloud') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}>
        <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.04-1.21-1.88-2.22-2.38A5.5 5.5 0 0 0 4 11c0 .17 0 .34.02.5A4.5 4.5 0 0 0 1 16c0 2.5 2 4.5 4.5 4.5"/>
      </svg>
    );
  }
  if (icon === 'sun-cloud') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}>
        <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41"/>
        <path d="M22 17a3 3 0 0 0-3-3H9a5 5 0 0 0-5 5 5.5 5.5 0 0 0 5.5 5.5A7.5 7.5 0 0 0 22 17z"/>
      </svg>
    );
  }
  if (icon === 'wind') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}>
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
      </svg>
    );
  }
  return null;
};

function RegionTooltip({ selectedRegion, regionalData, ecowattData, weatherData, onClose }) {
  const { setDetailedItem, mode } = useAppContext();
  
  if (!selectedRegion) return null;

  const coords = REGION_CENTERS[selectedRegion];
  if (!coords) return null;

  const data = regionalData[selectedRegion];
  const ecowatt = ecowattData?.find(e => String(e.code_region) === String(selectedRegion));
  const weather = weatherData?.[selectedRegion];

  if (!data) return null;

  // Production calculation
  const prodSources = [
    { label: 'Nucléaire', val: data.nucleaire || 0, color: '#818cf8' },
    { label: 'Éolien', val: data.eolien || 0, color: '#22d3ee' },
    { label: 'Solaire', val: data.solaire || 0, color: '#fbbf24' },
    { label: 'Hydraulique', val: data.hydraulique || 0, color: '#3b82f6' },
    { label: 'Thermique Fossile', val: data.thermique || 0, color: '#ef4444' },
    { label: 'Bioénergies', val: data.bioenergies || 0, color: '#34d399' }
  ];

  const totalProduction = prodSources.reduce((acc, s) => acc + s.val, 0);
  const consommation = data.consommation || 0;
  const netExchange = totalProduction - consommation;

  // Active weather impact
  let weatherText = "Conditions normales.";
  let weatherIcon = 'sun';
  if (weather) {
    if (weather.cloudCover > 50) weatherIcon = 'cloud';
    else if (weather.cloudCover > 20) weatherIcon = 'sun-cloud';
    
    if (weather.windSpeed > 25) {
      weatherIcon = 'wind';
      weatherText = "Vent fort : production éolienne accrue.";
    } else if (weather.temperature < 8) {
      weatherText = "Froid : demande de chauffage en hausse.";
    } else if (weather.temperature > 28) {
      weatherText = "Chaleur : climatisation sollicitée.";
    } else if (weather.cloudCover < 15 && new Date().getHours() > 8 && new Date().getHours() < 18) {
      weatherText = "Soleil radieux : production solaire maximale.";
    }
  }

  // Ecowatt status
  const ecowattLevel = ecowatt?.matin || 1;
  const ecowattColor = ecowattLevel === 1 ? '#22c55e' : ecowattLevel === 2 ? '#f59e0b' : '#ef4444';
  const ecowattText = ecowattLevel === 1 ? 'Normal' : ecowattLevel === 2 ? 'Tendu' : 'Alerte';

  return (
    <Popup
      longitude={coords[1]}
      latitude={coords[0]}
      anchor="top"
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      className="region-popup"
      maxWidth="310px"
    >
      <div style={{
        background: '#0a0e1a',
        color: '#f9fafb',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.15)',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: '13px', 
          fontWeight: '700',
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '4px',
          paddingRight: '15px'
        }}>
          <span>{REGION_NAMES[selectedRegion]}</span>
          <span style={{ color: ecowattColor, fontSize: '11px', fontWeight: 'bold' }}>● {ecowattText}</span>
        </h3>
        
        <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'right' }}>
          Données : {data.date && data.heure ? `${data.date.split('-').reverse().join('/')} à ${data.heure}` : data.date_heure ? new Date(data.date_heure).toLocaleString('fr-FR') : 'Inconnues'}
        </div>
        
        {/* Weather Sub-row */}
        {weather && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.02)',
            padding: '6px 8px',
            borderRadius: '4px',
            marginBottom: '6px',
            fontSize: '11px',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {renderWeatherIcon(weatherIcon)}
              <b>{Math.round(weather.temperature)}°C</b>
              <span style={{ color: 'var(--text-secondary)', margin: '0 4px' }}>|</span>
              <WindIcon size={12} style={{ color: 'var(--text-secondary)' }} />
              <span>{Math.round(weather.windSpeed)} km/h</span>
            </span>
            <span style={{ color: 'var(--text-accent)', fontStyle: 'italic', fontSize: '11px' }}>
              {weatherText}
            </span>
          </div>
        )}

        {/* Scientific profile explanation */}
        <div style={{ 
          fontStyle: 'italic', 
          color: 'var(--text-secondary)', 
          fontSize: '11px', 
          lineHeight: '1.4', 
          marginBottom: '8px',
          paddingLeft: '4px',
          borderLeft: '2px solid var(--text-accent)'
        }}>
          {COMPACT_EXPLANATIONS[selectedRegion]}
        </div>

        {/* Global Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 6px', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Production</div>
            <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '12px' }}>{totalProduction.toLocaleString()} MW</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 6px', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Consommation</div>
            <div style={{ color: '#f43f5e', fontWeight: 'bold', fontSize: '12px' }}>{consommation.toLocaleString()} MW</div>
          </div>
        </div>

        <div style={{ 
          padding: '6px 8px', 
          background: netExchange >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)', 
          border: `1px solid ${netExchange >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}`,
          borderRadius: '4px',
          fontSize: '11px',
          marginBottom: '8px'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Solde net : </span>
          <b style={{ color: netExchange >= 0 ? 'var(--color-export)' : 'var(--color-import)' }}>
            {netExchange >= 0 ? `Export (+${netExchange.toLocaleString()} MW)` : `Import (${netExchange.toLocaleString()} MW)`}
          </b>
        </div>

        {/* Breakdown bar list */}
        {totalProduction > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mix de Production Réel/Simulé
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {prodSources
                .filter(s => s.val > 0)
                .map((source, idx) => {
                  const percent = (source.val / totalProduction) * 100;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#d1d5db' }}>{source.label}</span>
                        <span>
                          <b>{Math.round(source.val).toLocaleString()} MW</b>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({Math.round(percent)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: source.color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div style={{ 
          marginTop: '10px', 
          paddingTop: '8px', 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}>
          <button
            onClick={() => setDetailedItem({
              type: 'region',
              id: selectedRegion,
              name: REGION_NAMES[selectedRegion],
              data: data,
              extra: { simulated: mode === 'simulation' }
            })}
            style={{
              background: 'rgba(96, 165, 250, 0.1)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '4px',
              color: '#60a5fa',
              padding: '4px 8px',
              fontSize: '10px',
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
}

export default RegionTooltip;
