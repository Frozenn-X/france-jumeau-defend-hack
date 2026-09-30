import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { REGION_CENTERS } from '../../data/regionCenters';

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);

const SunCloudIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41"/>
    <path d="M22 17a3 3 0 0 0-3-3H9a5 5 0 0 0-5 5 5.5 5.5 0 0 0 5.5 5.5A7.5 7.5 0 0 0 22 17z"/>
  </svg>
);

const CloudIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.04-1.21-1.88-2.22-2.38A5.5 5.5 0 0 0 4 11c0 .17 0 .34.02.5A4.5 4.5 0 0 0 1 16c0 2.5 2 4.5 4.5 4.5"/>
  </svg>
);

const WindIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);

function WeatherOverlay({ weatherDataByRegion }) {
  if (!weatherDataByRegion) return null;

  return (
    <>
      {Object.entries(weatherDataByRegion).map(([regionCode, weather]) => {
        const coords = REGION_CENTERS[regionCode];
        if (!coords) return null;

        // Determine icon based on cloud cover and wind
        let icon = <SunIcon />;
        if (weather.cloudCover > 20) icon = <SunCloudIcon />;
        if (weather.cloudCover > 60) icon = <CloudIcon />;
        
        // Show wind if it's windy
        if (weather.windSpeed > 20) icon = <WindIcon />;

        return (
          <Marker 
            key={regionCode} 
            longitude={coords[1]} 
            latitude={coords[0]} 
            anchor="bottom"
          >
            <div style={{
              background: 'rgba(10, 14, 26, 0.85)',
              backdropFilter: 'blur(4px)',
              padding: '4px 8px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
              <span style={{ fontWeight: 'bold' }}>{Math.round(weather.temperature)}°C</span>
            </div>
          </Marker>
        );
      })}
    </>
  );
}

export default WeatherOverlay;
