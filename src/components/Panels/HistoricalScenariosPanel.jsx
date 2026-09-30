import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SCENARIOS } from '../../data/scenarios';

export default function HistoricalScenariosPanel() {
  const { setMode, setSimulation, activeScenario, setActiveScenario } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectScenario = (scenario) => {
    // 1. Force simulation mode so users immediately see outcomes
    setMode('simulation');
    
    // 2. Set the simulation sliders and options
    setSimulation({
      windDelta: scenario.windDelta,
      solarDelta: scenario.solarDelta,
      tempDelta: scenario.tempDelta,
      activeRegions: [],
      importOverrides: scenario.importOverrides || {}
    });

    // 3. Mark active scenario to open the side information drawer
    setActiveScenario(scenario);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: activeScenario ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.04)',
          border: activeScenario ? '1px solid var(--color-solar)' : '1px solid var(--border-light)',
          borderRadius: '20px',
          padding: '6px 14px',
          color: activeScenario ? 'var(--color-solar)' : 'var(--text-primary)',
          fontSize: '11.5px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          boxShadow: activeScenario ? '0 0 10px rgba(251, 191, 36, 0.2)' : 'none'
        }}
        onMouseEnter={e => {
          if (!activeScenario) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        }}
        onMouseLeave={e => {
          if (!activeScenario) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
      >
        <span>🎬</span> {activeScenario ? activeScenario.title : "Scénarios Historiques"}
        <span style={{ fontSize: '9px', opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '280px',
          zIndex: 100,
          padding: '8px',
          border: '1px solid var(--border-light)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '9.5px',
            fontWeight: '700',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '6px 8px 4px 8px',
            borderBottom: '1px solid var(--border-light)'
          }}>
            Sélectionner un scénario climat
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {SCENARIOS.map((scenario) => {
              const isActive = activeScenario?.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => selectScenario(scenario)}
                  style={{
                    width: '100%',
                    background: isActive ? 'rgba(251, 191, 36, 0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    color: isActive ? 'var(--color-solar)' : 'var(--text-primary)',
                    fontSize: '11.5px',
                    fontWeight: isActive ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isActive ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isActive ? 'rgba(251, 191, 36, 0.08)' : 'transparent';
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{scenario.title}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{scenario.date}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
