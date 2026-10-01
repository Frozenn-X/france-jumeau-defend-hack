import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
setWorkerUrl(maplibreWorkerUrl);

import React, { useMemo, useState, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppContext } from '../../context/AppContext';
import { useWeatherData } from '../../hooks/useWeatherData';
import FlowLines from './FlowLines';
import PlantMarkers from './PlantMarkers';
import CityMarkers from './CityMarkers';
import GridOverlay from './GridOverlay';
import NeighborMarkers from './NeighborMarkers';
import WeatherOverlay from './WeatherOverlay';
import RegionTooltip from './RegionTooltip';
import MapLegend from './MapLegend';
import { REGION_CENTERS, REGION_NAMES } from '../../data/regionCenters';

function EnergyMapLayer({ regionalData, ecowattData = [], nationalData = [] }) {
  const { mode, mapLayer, selectedRegion, setSelectedRegion, setSelectedPlant, setSelectedCityName } = useAppContext();
  const [franceRegions, setFranceRegions] = useState(null);
  const { current: weather } = useWeatherData();
  const [hoveredRegionCode, setHoveredRegionCode] = useState(null);

  useEffect(() => {
    fetch('/api/geojson/france-regions')
      .then(res => res.json())
      .then(data => setFranceRegions(data))
      .catch(err => console.error("Error loading geojson from API:", err));
  }, []);

  // Create a memoized geojson feature collection that merges our energy data into the features
  const mapData = useMemo(() => {
    if (!franceRegions || !franceRegions.features) return { type: 'FeatureCollection', features: [] };

    const features = franceRegions.features.map(feature => {
      const regionCode = feature.properties.code;
      const data = regionalData[regionCode] || {};
      const ecowatt = Array.isArray(ecowattData) ? ecowattData.find(e => String(e.code_region) === String(regionCode)) : null;
      const ecowattVal = ecowatt || {};

      // Scientific estimation of CO2 intensity of the regional mix
      const prod = (data.thermique || 0) + (data.nucleaire || 0) + (data.eolien || 0) + (data.solaire || 0) + (data.hydraulique || 0) + (data.bioenergies || 0);
      const nuclearShare = (data.nucleaire || 0) / Math.max(prod, 1);
      const windShare = (data.eolien || 0) / Math.max(prod, 1);
      const solarShare = (data.solaire || 0) / Math.max(prod, 1);
      const hydroShare = (data.hydraulique || 0) / Math.max(prod, 1);
      const bioShare = (data.bioenergies || 0) / Math.max(prod, 1);
      const thermalShare = (data.thermique || 0) / Math.max(prod, 1);
      
      const estimatedCo2 = Math.round(
        nuclearShare * 6 +
        windShare * 6 +
        solarShare * 6 +
        hydroShare * 6 +
        bioShare * 30 +
        thermalShare * 700
      );
      const finalCo2 = prod > 0 ? estimatedCo2 : 50;

      return {
        ...feature,
        properties: {
          ...feature.properties,
          production: prod,
          consommation: data.consommation || 0,
          ecowattValue: Math.max(ecowattVal.matin || 1, ecowattVal.apres_midi || 1, ecowattVal.soir || 1), // Peak alert level for the day
          co2: finalCo2
        }
      };
    });

    return { type: 'FeatureCollection', features };
  }, [franceRegions, regionalData, ecowattData]);

  // Color logic based on layer
  const fillLayerStyle = {
    id: 'region-fill',
    type: 'fill',
    paint: {
      'fill-color': 
        mapLayer === 'production' ? [
          'interpolate', ['linear'], ['get', 'production'],
          0, '#111827',
          1000, '#1e3a8a',
          4000, '#1d4ed8',
          8000, '#3b82f6',
          12000, '#06b6d4',
          16000, '#10b981'
        ] : mapLayer === 'consumption' ? [
          'interpolate', ['linear'], ['get', 'consommation'],
          0, '#111827',
          2000, '#312e81',
          6000, '#d97706',
          10000, '#ea580c',
          15000, '#dc2626'
        ] : mapLayer === 'co2' ? [
          'interpolate', ['linear'], ['get', 'co2'],
          10, '#10b981',
          40, '#84cc16',
          70, '#fbbf24',
          100, '#f97316',
          150, '#ef4444'
        ] : mapLayer === 'ecowatt' ? [
          'match', ['get', 'ecowattValue'],
          1, '#10b981',
          2, '#fbbf24',
          3, '#ef4444',
          '#111827'
        ] : '#111827',
      'fill-opacity': 0.5,
    }
  };

  const lineLayerStyle = {
    id: 'region-border',
    type: 'line',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1.5,
      'line-opacity': 0.15
    }
  };

  const onClick = (event) => {
    const feature = event.features?.[0];
    if (feature) {
      setSelectedRegion(feature.properties.code);
      setSelectedPlant(null);
      setSelectedCityName(null);
      setHoveredRegionCode(null); // Close hover immediately on click
    } else {
      setSelectedRegion(null);
      setSelectedPlant(null);
      setSelectedCityName(null);
    }
  };

  const onMouseMove = (event) => {
    const feature = event.features?.[0];
    if (feature) {
      setHoveredRegionCode(feature.properties.code);
    } else {
      setHoveredRegionCode(null);
    }
  };

  const onMouseLeave = () => {
    setHoveredRegionCode(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map
        initialViewState={{
          longitude: 2.5,
          latitude: 46.5,
          zoom: 5.8,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        interactiveLayerIds={['region-fill']}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        cursor="pointer"
      >
        <NavigationControl position="bottom-right" />
        
        <Source id="regions" type="geojson" data={mapData}>
          <Layer {...fillLayerStyle} />
          <Layer {...lineLayerStyle} />
        </Source>

        {/* Dynamic Map Layers */}
        <FlowLines nationalData={nationalData} />
        <PlantMarkers />
        <CityMarkers />
        <GridOverlay />
        <NeighborMarkers nationalData={nationalData} />
        
        
        {/* Weather condition badges */}
        <WeatherOverlay weatherDataByRegion={weather?.byRegion} />

        {/* Selected Region Tooltip */}
        <RegionTooltip 
          selectedRegion={selectedRegion} 
          regionalData={regionalData} 
          ecowattData={ecowattData} 
          weatherData={weather?.byRegion}
          onClose={() => setSelectedRegion(null)}
        />

        {/* Hover Region Tooltip */}
        {hoveredRegionCode && selectedRegion !== hoveredRegionCode && (() => {
          const coords = REGION_CENTERS[hoveredRegionCode];
          if (!coords) return null;
          const data = regionalData[hoveredRegionCode];
          if (!data) return null;
          
          const prod = (data.thermique || 0) + (data.nucleaire || 0) + (data.eolien || 0) + (data.solaire || 0) + (data.hydraulique || 0) + (data.bioenergies || 0);
          const conso = data.consommation || 0;
          
          return (
            <Popup
              longitude={coords[1]}
              latitude={coords[0]}
              anchor="top"
              closeButton={false}
              closeOnClick={false}
              offset={10}
            >
              <div style={{
                background: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                maxWidth: '200px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
                  🗺️ {REGION_NAMES[hoveredRegionCode]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Production :</span>
                    <b>{Math.round(prod).toLocaleString()} MW</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Consommation :</span>
                    <b>{Math.round(conso).toLocaleString()} MW</b>
                  </div>
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic', textAlign: 'right' }}>
                  Clic pour fixer et voir +
                </div>
              </div>
            </Popup>
          );
        })()}
      </Map>
      
      {/* Dynamic Layer Color Legend overlay */}
      <MapLegend />
    </div>
  );
}

export default EnergyMapLayer;
