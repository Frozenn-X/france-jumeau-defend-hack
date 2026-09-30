import React from 'react';
import { useEcowatt } from '../../hooks/useEcowatt';
import { useAppContext } from '../../context/AppContext';
import { REGION_NAMES } from '../../data/regionCenters';

const ecowattGlowStyle = `
@keyframes pulse-orange {
  0%, 100% { box-shadow: 0 0 6px #f59e0b; opacity: 0.8; }
  50% { box-shadow: 0 0 15px #f59e0b; opacity: 1; }
}
@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 6px #ef4444; opacity: 0.8; }
  50% { box-shadow: 0 0 18px #ef4444; opacity: 1; }
}
`;

export default function EcowattBadge() {
  const { selectedRegion } = useAppContext();
  const { data: ecowattList, isLoading } = useEcowatt();

  if (isLoading) {
    return <div style={{ color: 'var(--text-secondary)', fontSize: '11px', padding: '10px' }}>Chargement d'Ecowatt...</div>;
  }

  // Find record for selected region or default to national (Île-de-France as baseline fallback)
  const regionCode = selectedRegion || '11'; 
  const regionName = REGION_NAMES[regionCode] || 'National';

  const record = Array.isArray(ecowattList)
    ? ecowattList.find((e) => String(e.code_region) === String(regionCode)) || ecowattList[0]
    : null;

  // Level definition: 1 = Vert (ok), 2 = Orange (tendu), 3 = Rouge (très tendu)
  const getLevelColor = (level) => {
    if (level === 2) return '#f59e0b';
    if (level === 3) return '#ef4444';
    return '#22c55e';
  };

  const getLevelLabel = (level) => {
    if (level === 2) return 'Tendu';
    if (level === 3) return 'Critique';
    return 'Normal';
  };

  const getLevelAnimation = (level) => {
    if (level === 2) return 'pulse-orange 2s infinite';
    if (level === 3) return 'pulse-red 1.5s infinite';
    return 'none';
  };

  const matinLevel = record?.matin || 1;
  const midiLevel = record?.apres_midi || 1;
  const soirLevel = record?.soir || 1;

  const maxLevel = Math.max(matinLevel, midiLevel, soirLevel);

  let advice = "Réseau équilibré. Aucun éco-geste particulier requis.";
  if (maxLevel === 2) {
    advice = "Système sous tension. Réduisez le chauffage et décalez l'usage du lave-linge/four hors des heures 18h-20h.";
  } else if (maxLevel === 3) {
    advice = "Réseau critique ! Risque de coupures ciblées. Réduisez immédiatement éclairages et chauffage inutile.";
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <style>{ecowattGlowStyle}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
        <h3 style={{ fontSize: '13px', margin: 0, color: 'var(--text-primary)', fontWeight: 'bold' }}>
          Signal Ecowatt RTE
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-accent)', background: 'rgba(96,165,250,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
          {regionName}
        </span>
      </div>

      {/* Horizontal Periods Grid */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {[
          { label: 'Matin', level: matinLevel, hours: '8h-12h' },
          { label: 'Midi', level: midiLevel, hours: '12h-18h' },
          { label: 'Soir', level: soirLevel, hours: '18h-22h' },
        ].map((period, i) => {
          const color = getLevelColor(period.level);
          return (
            <div key={i} style={{ 
              flex: 1,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              background: 'rgba(255,255,255,0.02)', 
              padding: '6px 4px', 
              borderRadius: '6px', 
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                {period.label}
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
                animation: getLevelAnimation(period.level),
                marginBottom: '4px'
              }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: color }}>
                {getLevelLabel(period.level)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Official advice block */}
      <div style={{
        padding: '8px 10px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '6px',
        border: '1px solid var(--border-light)',
        fontSize: '11.5px',
        lineHeight: '1.4',
        marginBottom: '6px'
      }}>
        <b style={{ color: getLevelColor(maxLevel), fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
          Consigne active :
        </b>
        {advice}
      </div>

      {/* Pedagogical Explanation */}
      <div style={{
        fontSize: '11px',
        color: '#9ca3af',
        lineHeight: '1.4',
        background: 'rgba(0, 0, 0, 0.15)',
        padding: '8px 10px',
        borderRadius: '6px',
        borderLeft: '2px solid var(--text-accent)'
      }}>
        <b>Météo de l'électricité :</b> Ecowatt (par RTE) avertit des tensions du réseau.
        <br />
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', marginRight: '4px', verticalAlign: 'middle' }} />
        <i>Vert</i> = OK. 
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', marginLeft: '8px', marginRight: '4px', verticalAlign: 'middle' }} />
        <i>Orange</i> = Marges réduites (éco-gestes requis). 
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginLeft: '8px', marginRight: '4px', verticalAlign: 'middle' }} />
        <i>Rouge</i> = Risque de coupures si pas de baisse.
      </div>
    </div>
  );
}
