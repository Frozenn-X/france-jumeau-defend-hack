import React from 'react';
import { NEIGHBORS } from '../../data/neighbors';
import { useAppContext } from '../../context/AppContext';
import { useEnergyData } from '../../hooks/useEnergyData';
import { PlugIcon } from '../Common/Icons';

export default function ExchangePanel({ nationalData }) {
  const { mode, simulation, setSimulation, timelineIndex } = useAppContext();
  const { national } = useEnergyData();

  if (!nationalData || nationalData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Chargement des échanges...
      </div>
    );
  }

  // Get baseline record safely from original national data
  const baseRecord = national[timelineIndex] || national[0];
  const latest = nationalData[0]; // simulated record (includes overrides)
  
  const isSimulation = mode === 'simulation';
  const importOverrides = simulation.importOverrides || {};

  // Map our neighbors with active values
  const exchanges = Object.entries(NEIGHBORS).map(([key, neighbor]) => {
    const dbKey = neighbor.key;
    const baseVal = baseRecord ? (baseRecord[dbKey] || 0) : 0;
    const val = latest[dbKey] || 0; // Simulated/overridden value in MW
    const isExport = val < 0; // Negative means export, positive means import
    const absVal = Math.abs(val);
    const baseIsExport = baseVal < 0;
    const absBaseVal = Math.abs(baseVal);
    
    // Country codes and labels
    let code = 'EU';
    let shortName = neighbor.name;
    if (key === 'angleterre') { code = 'UK'; shortName = 'Angleterre'; }
    else if (key === 'espagne') { code = 'ES'; shortName = 'Espagne'; }
    else if (key === 'italie') { code = 'IT'; shortName = 'Italie'; }
    else if (key === 'suisse') { code = 'CH'; shortName = 'Suisse'; }
    else if (key === 'allemagne_belgique') { code = 'DE/BE'; shortName = 'All. / Belg.'; }

    return {
      key,
      name: shortName,
      code,
      baseValue: baseVal,
      absBaseVal,
      baseIsExport,
      value: val,
      absVal,
      isExport,
      overrideStatus: importOverrides[key] || 'normal'
    };
  });

  // Calculate Net Solde
  const netSolde = exchanges.reduce((acc, curr) => acc + curr.value, 0);
  const isNetExport = netSolde < 0;
  const absNetSolde = Math.abs(netSolde);

  // Maximum value for scaling the progress bars (e.g. 10 GW max per country)
  const maxScaleVal = 10000;

  const handleOverride = (countryKey, status) => {
    setSimulation(prev => ({
      ...prev,
      importOverrides: {
        ...(prev.importOverrides || {}),
        [countryKey]: status
      }
    }));
  };

  const getOverrideExplanation = (ex) => {
    if (ex.overrideStatus === 'normal') return null;

    if (ex.overrideStatus === 'blocked') {
      if (!ex.baseIsExport) {
        // France was importing, now blocked
        return `Import bloqué depuis ${ex.name}. La France perd ${ex.absBaseVal.toLocaleString()} MW de puissance décarbonée externe. Elle doit compenser en allumant des centrales thermiques françaises (+CO₂).`;
      } else {
        // France was exporting, now blocked
        return `Export bloqué vers ${ex.name}. ${ex.absBaseVal.toLocaleString()} MW sont conservés sur le réseau français, créant un surplus qui permet de couper nos centrales thermiques.`;
      }
    }

    if (ex.overrideStatus === 'reversed') {
      if (!ex.baseIsExport) {
        // France was importing, now exporting
        return `Flux inversé : La France exporte maintenant ${ex.absBaseVal.toLocaleString()} MW vers ${ex.name} au lieu d'importer. Cela crée un déficit national de ${ex.absBaseVal * 2} MW à compenser localement.`;
      } else {
        // France was exporting, now importing
        return `Flux inversé : La France importe maintenant ${ex.absBaseVal.toLocaleString()} MW de ${ex.name} au lieu d'exporter. Ce surplus externe permet de couper du thermique français.`;
      }
    }

    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <h3 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <PlugIcon size={14} color="var(--text-accent)" />
        <span>Échanges aux Frontières</span>
      </h3>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '2px' }}>
        {exchanges.map((ex) => {
          // Percent fill for the bar
          const fillPercent = Math.min(100, (ex.absVal / maxScaleVal) * 100);
          const barColor = ex.isExport ? 'var(--color-export)' : 'var(--color-import)';
          const explanation = getOverrideExplanation(ex);

          return (
            <div key={ex.key} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              padding: '6px',
              borderRadius: '6px',
              background: ex.overrideStatus !== 'normal' ? 'rgba(255,255,255,0.02)' : 'transparent',
              border: ex.overrideStatus !== 'normal' ? '1px solid var(--border-light)' : '1px solid transparent',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-light)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: '800',
                      color: 'var(--text-accent)',
                      lineHeight: '1'
                    }}>
                      {ex.code}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {ex.name}
                    </span>
                  </div>
                  {isSimulation && (
                    <span style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Physique initial : {ex.baseIsExport ? '← Export' : '→ Import'} {ex.absBaseVal.toLocaleString()} MW
                    </span>
                  )}
                </div>
                <span style={{ color: barColor, fontWeight: 'bold', fontSize: '10px' }}>
                  {ex.value === 0 ? 'Flux Coupé' : (ex.isExport ? '← Export' : '→ Import') + ' ' + Math.round(ex.absVal).toLocaleString('fr-FR') + ' MW'}
                </span>
              </div>
              
              {/* Bidirectional Bar container */}
              <div style={{
                height: '6px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '3px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  background: 'rgba(255,255,255,0.25)',
                  zIndex: 2
                }} />

                {ex.value !== 0 && (
                  <div style={{
                    position: 'absolute',
                    left: ex.isExport ? 'auto' : '50%',
                    right: ex.isExport ? '50%' : 'auto',
                    width: `${fillPercent / 2}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: '2px',
                    transition: 'width 0.5s ease',
                    boxShadow: `0 0 4px ${barColor}`
                  }} />
                )}
              </div>

              {/* Simulation buttons */}
              {isSimulation && (
                <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                  <button
                    onClick={() => handleOverride(ex.key, 'normal')}
                    style={{
                      flex: 1,
                      fontSize: '8px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      border: '1px solid ' + (ex.overrideStatus === 'normal' ? 'var(--text-accent)' : 'var(--border-light)'),
                      background: ex.overrideStatus === 'normal' ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                      color: ex.overrideStatus === 'normal' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    ▶ Normal
                  </button>
                  <button
                    onClick={() => handleOverride(ex.key, 'blocked')}
                    style={{
                      flex: 1,
                      fontSize: '8px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      border: '1px solid ' + (ex.overrideStatus === 'blocked' ? 'var(--color-danger)' : 'var(--border-light)'),
                      background: ex.overrideStatus === 'blocked' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: ex.overrideStatus === 'blocked' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    ⏸ Bloqué
                  </button>
                  <button
                    onClick={() => handleOverride(ex.key, 'reversed')}
                    style={{
                      flex: 1,
                      fontSize: '8px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      border: '1px solid ' + (ex.overrideStatus === 'reversed' ? 'var(--color-warning)' : 'var(--border-light)'),
                      background: ex.overrideStatus === 'reversed' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      color: ex.overrideStatus === 'reversed' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    🔄 Inversé
                  </button>
                </div>
              )}

              {/* Contextual warning text */}
              {explanation && (
                <div style={{
                  fontSize: '8px',
                  color: ex.overrideStatus === 'blocked' ? 'var(--color-danger)' : 'var(--color-warning)',
                  lineHeight: '1.2',
                  marginTop: '2px',
                  padding: '4px',
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: '3px'
                }}>
                  {explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Net Solde footer block */}
      <div style={{
        marginTop: '8px',
        padding: '6px 10px',
        background: isNetExport ? 'rgba(16, 185, 129, 0.06)' : 'rgba(244, 63, 94, 0.06)',
        border: `1px solid ${isNetExport ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}`,
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px'
      }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>SOLDE NET SIMULÉ</span>
        <b style={{ color: isNetExport ? 'var(--color-export)' : 'var(--color-import)', fontSize: '11px' }}>
          {isNetExport ? 'Exportateur' : 'Importateur'} net ({Math.round(absNetSolde).toLocaleString('fr-FR')} MW)
        </b>
      </div>
    </div>
  );
}
