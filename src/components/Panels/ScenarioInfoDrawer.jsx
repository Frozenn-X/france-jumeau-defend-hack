import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { TempIcon, WindIcon, SolarIcon, GraduationCapIcon, ResetIcon, CloseIcon } from '../Common/Icons';

export default function ScenarioInfoDrawer() {
  const { activeScenario, setActiveScenario, setSimulation } = useAppContext();

  if (!activeScenario) return null;

  const handleClose = () => {
    setActiveScenario(null);
  };

  const handleReset = () => {
    setSimulation({
      windDelta: 0,
      solarDelta: 0,
      tempDelta: 0,
      activeRegions: [],
      importOverrides: {}
    });
    setActiveScenario(null);
  };

  return (
    <div className="right-panel-container" style={{
      position: 'absolute',
      top: '115px',
      right: '20px',
      bottom: '105px',
      width: '310px',
      background: 'rgba(10, 14, 26, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-light)',
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              background: activeScenario.color || '#ef4444',
              color: '#0a0e1a',
              fontSize: '9px',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Scénario Actif
            </span>
            <h2 style={{ fontSize: '15px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
              {activeScenario.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <CloseIcon size={14} color="currentColor" />
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '10px 0 15px 0' }} />

        {/* Configuration Offsets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Ajustements Réseau Actifs
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <TempIcon size={16} color="var(--color-import)" />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0' }}>Temp.</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: activeScenario.tempDelta > 0 ? 'var(--color-import)' : activeScenario.tempDelta < 0 ? 'var(--color-hydro)' : '#ffffff' }}>
                {activeScenario.tempDelta > 0 ? `+${activeScenario.tempDelta}°C` : `${activeScenario.tempDelta}°C`}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <WindIcon size={16} color="var(--color-export)" />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0' }}>Vent</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: activeScenario.windDelta >= 0 ? 'var(--color-export)' : 'var(--color-import)' }}>
                {activeScenario.windDelta >= 0 ? `+${activeScenario.windDelta}%` : `${activeScenario.windDelta}%`}
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <SolarIcon size={16} color="var(--color-solar)" />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0' }}>Soleil</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: activeScenario.solarDelta >= 0 ? 'var(--color-solar)' : 'var(--color-import)' }}>
                {activeScenario.solarDelta >= 0 ? `+${activeScenario.solarDelta}%` : `${activeScenario.solarDelta}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Description */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '6px' }}>
              Description de l'Événement
            </div>
            <p style={{ fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {activeScenario.description}
            </p>
          </div>

          <div style={{
            background: 'rgba(96,165,250,0.04)',
            border: '1px solid rgba(96,165,250,0.15)',
            borderRadius: '8px',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <GraduationCapIcon size={13} color="var(--text-accent)" />
              <span>Leçon Énergétique</span>
            </div>
            <p style={{ fontSize: '12px', lineHeight: '1.45', color: '#e5e7eb' }}>
              {activeScenario.lessons}
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleReset}
          style={{
            marginTop: '20px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11.5px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
        >
          <ResetIcon size={12} color="currentColor" />
          <span>Quitter le scénario et réinitialiser</span>
        </button>
      </div>
    </div>
  );
}
