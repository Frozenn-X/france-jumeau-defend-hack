import React, { useState, useMemo, useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useMetropoles } from '../../hooks/useMetropoles';
import { PlugIcon, LightningIcon, AlertIcon } from '../Common/Icons';
import { useAppContext } from '../../context/AppContext';

export const METRO_COORDS = {
  "Lyon": [45.764043, 4.835659],
  "Paris": [48.856614, 2.352222],
  "Marseille": [43.296482, 5.36978],
  "Bordeaux": [44.837789, -0.57918],
  "Toulouse": [43.604652, 1.444209],
  "Nantes": [47.218371, -1.553621],
  "Lille": [50.62925, 3.057256],
  "Nice": [43.710173, 7.261953],
  "Strasbourg": [48.573405, 7.752111],
  "Montpellier": [43.610769, 3.876716],
  "Rennes": [48.117266, -1.677793],
  "Grenoble": [45.188529, 5.724524],
  "Rouen": [49.443232, 1.099971],
  "Brest": [48.390394, -4.486076],
  "Nancy": [48.692054, 6.184417],
  "Dijon": [47.322047, 5.04148],
  "Orléans": [47.902964, 1.909251],
  "Saint-Etienne": [45.439695, 4.387178],
  "Clermont": [45.777222, 3.087025],
  "Tours": [47.394144, 0.68484],
  "Metz": [49.119308, 6.175715],
  "Toulon": [43.124228, 5.928523]
};

export const getCoordsForMetro = (name) => {
  if (!name) return null;
  const clean = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, " "); // replace non-alphanumeric with spaces
  
  const match = Object.keys(METRO_COORDS).find(key => {
    const cleanKey = key.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, " ");
    return clean.includes(cleanKey) || cleanKey.includes(clean);
  });
  return match ? METRO_COORDS[match] : null;
};

export default function MetropoleDetail() {
  const { setDetailedItem } = useAppContext();
  const { data: metropoles, isLoading } = useMetropoles();
  const [selectedMetroName, setSelectedMetroName] = useState('');
  const mapContext = useMap();
  const map = mapContext.current || mapContext.default;

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

  // Set initial selected metropole cleanly in useEffect
  useEffect(() => {
    const names = Object.keys(latestMetropoles);
    if (names.length > 0 && !selectedMetroName) {
      const defaultMetro = names.find(n => n.includes('Paris') || n.includes('Lyon') || n.includes('Lille')) || names[0];
      setSelectedMetroName(defaultMetro);
    }
  }, [latestMetropoles, selectedMetroName]);

  // Fly to metropole coords when chosen
  useEffect(() => {
    if (!map || !selectedMetroName) return;
    const coords = getCoordsForMetro(selectedMetroName);
    if (coords) {
      map.flyTo({
        center: [coords[1], coords[0]], // [lng, lat]
        zoom: 10.5,
        essential: true,
        duration: 2000
      });
    }
  }, [selectedMetroName, map]);

  if (isLoading) {
    return <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Chargement des métropoles...</div>;
  }

  const metroNames = Object.keys(latestMetropoles);
  const activeMetro = latestMetropoles[selectedMetroName];

  if (!activeMetro) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', padding: '10px' }}>
        Aucune métropole disponible
      </div>
    );
  }

  // Safe parsing (ODRÉ sometimes outputs "ND" string for ND values)
  const parseVal = (val) => {
    if (val === undefined || val === null || val === 'ND') return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const conso = parseVal(activeMetro.consommation);
  const prod = parseVal(activeMetro.production);
  const hasProd = activeMetro.production !== undefined && activeMetro.production !== null && activeMetro.production !== 'ND';
  const net = prod - conso;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
        <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--text-primary)' }}>
          Zoom Métropoles
        </h3>
        
        <select
          value={selectedMetroName}
          onChange={(e) => setSelectedMetroName(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
            fontSize: '10px',
            padding: '2px 4px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {metroNames.map((name) => (
            <option key={name} value={name}>
              {name.replace('Métropole du ', '').replace('Métropole d\'', '').replace('Métropole ', '')}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <PlugIcon size={12} color="var(--text-secondary)" />
            <span>Consommation</span>
          </span>
          <b style={{ color: 'var(--color-import)' }}>{Math.round(conso).toLocaleString('fr-FR')} MW</b>
        </div>

        {hasProd && prod > 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <LightningIcon size={12} color="var(--text-secondary)" />
                <span>Production locale</span>
              </span>
              <b style={{ color: 'var(--color-export)' }}>{Math.round(prod).toLocaleString('fr-FR')} MW</b>
            </div>

            {/* Compare production coverage bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '2px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)' }}>
                <span>Autonomie Énergétique</span>
                <span>{conso > 0 ? Math.round((prod / conso) * 100) : 0}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, conso > 0 ? (prod / conso) * 100 : 0)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-hydro), var(--color-export))',
                  borderRadius: '3px'
                }} />
              </div>
            </div>

            {/* Local net Solde */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', paddingTop: '4px', borderTop: '1px dashed var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Solde local</span>
              <span style={{ color: net >= 0 ? 'var(--color-export)' : 'var(--color-import)', fontWeight: 'bold' }}>
                {net >= 0 ? `Export (+${Math.round(net)} MW)` : `Déficit (-${Math.round(Math.abs(net))} MW)`}
              </span>
            </div>
          </>
        ) : (
          <div style={{
            fontSize: '10px',
            color: 'var(--text-secondary)',
            padding: '6px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '4px',
            textAlign: 'center',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <AlertIcon size={12} color="var(--color-warning)" />
            <span>Production locale non disponible (ND)</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setDetailedItem({
            type: 'metropole',
            id: selectedMetroName,
            name: selectedMetroName,
            data: activeMetro
          })}
          style={{
            width: '100%',
            background: 'rgba(96, 165, 250, 0.1)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: '6px',
            color: '#60a5fa',
            padding: '6px 0',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'}
        >
          + de détails (Audit sources & calculs)
        </button>
      </div>
    </div>
  );
}
