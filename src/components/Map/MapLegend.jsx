import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { LightningIcon, ChartIcon, CarbonIcon, AlertIcon } from '../Common/Icons';

export default function MapLegend() {
  const { mapLayer } = useAppContext();

  // Setup scale specs based on active layer
  const getLegendSpec = () => {
    switch (mapLayer) {
      case 'production':
        return {
          title: 'Production régionale',
          icon: LightningIcon,
          iconColor: 'var(--color-export)',
          unit: 'MW',
          type: 'gradient',
          gradient: 'linear-gradient(to right, #111827, #1e3a8a, #1d4ed8, #3b82f6, #06b6d4, #10b981)',
          labels: ['0', '4k', '8k', '12k', '16k+']
        };
      case 'consumption':
        return {
          title: 'Consommation régionale',
          icon: ChartIcon,
          iconColor: 'var(--color-import)',
          unit: 'MW',
          type: 'gradient',
          gradient: 'linear-gradient(to right, #111827, #312e81, #d97706, #ea580c, #dc2626)',
          labels: ['0', '2k', '6k', '10k', '15k+']
        };
      case 'co2':
        return {
          title: 'Empreinte Carbone',
          icon: CarbonIcon,
          iconColor: '#10b981',
          unit: 'gCO₂eq/kWh',
          type: 'gradient',
          gradient: 'linear-gradient(to right, #10b981, #84cc16, #fbbf24, #f97316, #ef4444)',
          labels: ['10g (Bas)', '40g', '70g', '100g', '150g+ (Fort)']
        };
      case 'ecowatt':
        return {
          title: 'Signal Ecowatt (Pic max quotidien)',
          icon: AlertIcon,
          iconColor: 'var(--color-warning)',
          unit: 'Niveau d\'alerte',
          type: 'categories',
          items: [
            { label: 'Normal', color: '#10b981' },
            { label: 'Tendu', color: '#fbbf24' },
            { label: 'Alerte', color: '#ef4444' }
          ]
        };
      default:
        return null;
    }
  };

  const spec = getLegendSpec();
  if (!spec) return null;

  return (
    <div 
      className="glass-panel animate-pulse-glow" 
      style={{
        position: 'absolute',
        left: '390px',
        bottom: '100px',
        zIndex: 5,
        padding: '8px 12px',
        borderRadius: '6px',
        width: '240px',
        background: 'rgba(10, 14, 26, 0.85)',
        border: '1px solid var(--border-light)',
        animationDuration: '4s', // very subtle pulse
        pointerEvents: 'auto'
      }}
    >
      <div style={{ 
        fontSize: '12px', 
        fontWeight: 'bold', 
        color: 'var(--text-primary)', 
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {spec.icon && React.createElement(spec.icon, { size: 13, color: spec.iconColor })}
        <span>{spec.title}</span>
      </div>
      
      {spec.type === 'gradient' ? (
        <div>
          {/* Gradient bar */}
          <div style={{
            height: '8px',
            borderRadius: '4px',
            background: spec.gradient,
            marginBottom: '4px',
            border: '1px solid rgba(255,255,255,0.1)'
          }} />
          {/* Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
            {spec.labels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
          {spec.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: item.color,
                boxShadow: `0 0 4px ${item.color}`
              }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Unité : {spec.unit}
      </div>
    </div>
  );
}
