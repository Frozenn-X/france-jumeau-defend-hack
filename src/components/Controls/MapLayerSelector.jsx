import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { LightningIcon, ChartIcon, CarbonIcon, AlertIcon } from '../Common/Icons';

export default function MapLayerSelector() {
  const { mapLayer, setMapLayer } = useAppContext();

  const layers = [
    { 
      id: 'production', 
      label: 'Production', 
      icon: LightningIcon,
      color: '#10b981',
      desc: "Colorie les régions selon leur production totale d'électricité (MW). Plus la couleur est vive, plus la région produit."
    },
    { 
      id: 'consumption', 
      label: 'Consommation', 
      icon: ChartIcon,
      color: '#f43f5e',
      desc: "Colorie les régions selon leur demande d'énergie. Les zones urbaines denses consomment plus."
    },
    { 
      id: 'co2', 
      label: 'Taux CO₂', 
      icon: CarbonIcon,
      color: '#3b82f6',
      desc: "Intensité carbone de la production. Vert = bas carbone, Rouge = fort recours au gaz/charbon."
    },
    { 
      id: 'ecowatt', 
      label: 'Ecowatt', 
      icon: AlertIcon,
      color: '#f59e0b',
      desc: "Signal RTE de tension sur le réseau : Vert = OK, Orange = système tendu, Rouge = risque élevé de coupures."
    }
  ];

  return (
    <div style={{
      display: 'flex',
      background: 'rgba(10, 14, 26, 0.6)',
      border: '1px solid var(--border-light)',
      borderRadius: '24px',
      padding: '4px',
      gap: '4px'
    }}>
      {layers.map((layer) => {
        const isActive = mapLayer === layer.id;
        const Icon = layer.icon;
        return (
          <button
            key={layer.id}
            onClick={() => setMapLayer(layer.id)}
            title={layer.desc}
            style={{
              background: isActive ? layer.color : 'transparent',
              color: isActive ? '#0a0e1a' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 10px ${layer.color}` : 'none',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Icon size={12} color="currentColor" />
            <span>{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
}
