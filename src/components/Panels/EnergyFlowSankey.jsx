import React, { useMemo } from 'react';
import { useEnergyData } from '../../hooks/useEnergyData';

const getUpdateDateText = (record) => {
  if (!record) return "En attente...";
  if (record.date && record.heure) {
    const parts = record.date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : record.date;
    return `${formattedDate} à ${record.heure}`;
  }
  if (record.date_heure) {
    const d = new Date(record.date_heure);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return "Inconnue";
};

/**
 * EnergyFlowSankey — Diagramme simplifié du parcours de l'électricité
 * 
 * Montre visuellement d'où vient l'énergie (sources), où elle transite
 * (pertes réseau, stockage, échanges) et où elle va (consommation).
 * Implémenté en CSS pur avec des barres proportionnelles animées.
 */
export default function EnergyFlowSankey({ isOpen, onClose }) {
  const { national } = useEnergyData();

  const latest = useMemo(() => {
    if (!national || national.length === 0) return null;
    return national[0];
  }, [national]);

  const flowData = useMemo(() => {
    if (!latest) return null;

    const nuclear = latest.nucleaire || 0;
    const wind = latest.eolien || 0;
    const solar = latest.solaire || 0;
    const hydro = latest.hydraulique || 0;
    const gas = latest.gaz || 0;
    const bio = latest.bioenergies || 0;
    const thermal = (latest.fioul || 0) + (latest.charbon || 0);
    const totalProd = nuclear + wind + solar + hydro + gas + bio + thermal;

    const conso = latest.consommation || 0;
    const exchanges = latest.ech_physiques || 0; // Negative = export, Positive = import
    const pompage = Math.abs(parseInt(latest.pompage) || 0);

    // Estimate grid losses (~2.5% of production)
    const losses = Math.round(totalProd * 0.025);

    // Sector breakdown (estimated percentages based on RTE annual stats)
    const residential = Math.round(conso * 0.36);
    const industry = Math.round(conso * 0.28);
    const tertiary = Math.round(conso * 0.26);
    const transport = Math.round(conso * 0.10);

    return {
      sources: [
        { label: '⚛️ Nucléaire', value: nuclear, color: '#818cf8', pct: totalProd > 0 ? Math.round(nuclear / totalProd * 100) : 0 },
        { label: '💧 Hydraulique', value: hydro, color: '#3b82f6', pct: totalProd > 0 ? Math.round(hydro / totalProd * 100) : 0 },
        { label: '🌬️ Éolien', value: wind, color: '#22d3ee', pct: totalProd > 0 ? Math.round(wind / totalProd * 100) : 0 },
        { label: '☀️ Solaire', value: solar, color: '#fbbf24', pct: totalProd > 0 ? Math.round(solar / totalProd * 100) : 0 },
        { label: '🌱 Biomasse', value: bio, color: '#34d399', pct: totalProd > 0 ? Math.round(bio / totalProd * 100) : 0 },
        { label: '🔥 Gaz', value: gas, color: '#f97316', pct: totalProd > 0 ? Math.round(gas / totalProd * 100) : 0 },
        { label: '🪨 Charbon/Fioul', value: thermal, color: '#ef4444', pct: totalProd > 0 ? Math.round(thermal / totalProd * 100) : 0 },
      ].filter(s => s.value > 0),
      totalProd,
      transit: {
        losses,
        pompage,
        exchanges,
        isExport: exchanges < 0
      },
      consumption: {
        total: conso,
        sectors: [
          { label: '🏠 Résidentiel', value: residential, color: '#a78bfa', desc: 'Chauffage, éclairage, électroménager' },
          { label: '🏭 Industrie', value: industry, color: '#f97316', desc: 'Métallurgie, chimie, agroalimentaire' },
          { label: '🏢 Tertiaire', value: tertiary, color: '#60a5fa', desc: 'Bureaux, commerces, hôpitaux' },
          { label: '🚗 Transport', value: transport, color: '#34d399', desc: 'TGV, métro, recharge VE' },
        ]
      }
    };
  }, [latest]);

  if (!isOpen) return null;

  const fmt = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)} GW` : `${v} MW`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #0f1629, #111827)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          width: '740px',
          maxHeight: '88vh',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f9fafb', margin: 0 }}>
              ⚡ D'où vient l'électricité et où va-t-elle ?
            </h2>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>
              Parcours de l'énergie (Données du {getUpdateDateText(latest)})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af', borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.15)'; e.target.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#9ca3af'; }}
          >✕</button>
        </div>

        {!flowData ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Chargement des données...</div>
        ) : (
          <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
            {/* 3-column flow layout */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>

              {/* LEFT: Sources de production */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: '700', color: '#60a5fa',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
                  textAlign: 'center', paddingBottom: '4px', borderBottom: '1px solid rgba(96,165,250,0.2)'
                }}>
                  🔋 Production — {fmt(flowData.totalProd)}
                </div>
                {flowData.sources.map((s, i) => {
                  const barW = Math.max(8, (s.value / flowData.totalProd) * 100);
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', gap: '2px',
                      padding: '6px 8px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ fontWeight: '600', color: '#f9fafb' }}>{s.label}</span>
                        <span style={{ color: s.color, fontWeight: '700' }}>{fmt(s.value)} <span style={{ color: '#6b7280', fontWeight: '400' }}>({s.pct}%)</span></span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${barW}%`, height: '100%', background: s.color,
                          borderRadius: '3px', boxShadow: `0 0 6px ${s.color}`,
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CENTER: Transit (pertes, stockage, échanges) */}
              <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <div style={{
                  fontSize: '11px', fontWeight: '700', color: '#fbbf24',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
                  textAlign: 'center', paddingBottom: '4px', borderBottom: '1px solid rgba(251,191,36,0.2)'
                }}>
                  🔄 Transit Réseau
                </div>

                {/* Flow arrows visual */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  position: 'relative'
                }}>
                  {/* Big arrow */}
                  <div style={{
                    textAlign: 'center', fontSize: '24px', color: 'rgba(255,255,255,0.15)',
                    lineHeight: 1
                  }}>→</div>

                  {/* Losses */}
                  <div style={{
                    padding: '8px', borderRadius: '6px',
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                    fontSize: '10px', textAlign: 'center'
                  }}>
                    <div style={{ color: '#ef4444', fontWeight: '700' }}>🔥 Pertes réseau</div>
                    <div style={{ color: '#d1d5db', marginTop: '2px' }}>{fmt(flowData.transit.losses)}</div>
                    <div style={{ color: '#6b7280', fontSize: '8.5px', marginTop: '2px', fontStyle: 'italic' }}>
                      ~2,5% dissipés en chaleur (effet Joule) dans les câbles haute tension
                    </div>
                  </div>

                  {/* STEP / Pumpage */}
                  {flowData.transit.pompage > 0 && (
                    <div style={{
                      padding: '8px', borderRadius: '6px',
                      background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                      fontSize: '10px', textAlign: 'center'
                    }}>
                      <div style={{ color: '#3b82f6', fontWeight: '700' }}>🔋 Pompage STEP</div>
                      <div style={{ color: '#d1d5db', marginTop: '2px' }}>{fmt(flowData.transit.pompage)}</div>
                      <div style={{ color: '#6b7280', fontSize: '8.5px', marginTop: '2px', fontStyle: 'italic' }}>
                        Eau pompée vers l'altitude pour stocker l'énergie
                      </div>
                    </div>
                  )}

                  {/* Exchanges */}
                  <div style={{
                    padding: '8px', borderRadius: '6px',
                    background: flowData.transit.isExport ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
                    border: `1px solid ${flowData.transit.isExport ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`,
                    fontSize: '10px', textAlign: 'center'
                  }}>
                    <div style={{ color: flowData.transit.isExport ? '#10b981' : '#f43f5e', fontWeight: '700' }}>
                      🇪🇺 {flowData.transit.isExport ? 'Export vers voisins' : 'Import des voisins'}
                    </div>
                    <div style={{ color: '#d1d5db', marginTop: '2px' }}>{fmt(Math.abs(flowData.transit.exchanges))}</div>
                    <div style={{ color: '#6b7280', fontSize: '8.5px', marginTop: '2px', fontStyle: 'italic' }}>
                      {flowData.transit.isExport
                        ? "Surplus vendu aux pays voisins"
                        : "Complément acheté aux pays voisins"}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    textAlign: 'center', fontSize: '24px', color: 'rgba(255,255,255,0.15)',
                    lineHeight: 1
                  }}>→</div>
                </div>
              </div>

              {/* RIGHT: Consommation */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: '700', color: '#f43f5e',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
                  textAlign: 'center', paddingBottom: '4px', borderBottom: '1px solid rgba(244,63,94,0.2)'
                }}>
                  🏠 Consommation — {fmt(flowData.consumption.total)}
                </div>

                {flowData.consumption.sectors.map((sec, i) => {
                  const pct = flowData.consumption.total > 0 ? Math.round(sec.value / flowData.consumption.total * 100) : 0;
                  const barW = Math.max(8, pct);
                  return (
                    <div key={i} style={{
                      padding: '8px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', flexDirection: 'column', gap: '3px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                        <span style={{ fontWeight: '600', color: '#f9fafb' }}>{sec.label}</span>
                        <span style={{ color: sec.color, fontWeight: '700' }}>{fmt(sec.value)} <span style={{ color: '#6b7280', fontWeight: '400' }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${barW}%`, height: '100%', background: sec.color,
                          borderRadius: '3px', transition: 'width 0.8s ease'
                        }} />
                      </div>
                      <div style={{ fontSize: '8.5px', color: '#6b7280', fontStyle: 'italic' }}>{sec.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Balance equation */}
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.12)',
              fontSize: '10.5px', color: '#d1d5db', textAlign: 'center', lineHeight: '1.5'
            }}>
              <b style={{ color: '#60a5fa' }}>🔑 Règle d'or du réseau :</b> À chaque seconde,
              <b style={{ color: '#10b981' }}> Production</b> =
              <b style={{ color: '#f43f5e' }}> Consommation</b> +
              <span style={{ color: '#ef4444' }}> Pertes</span> ±
              <span style={{ color: '#fbbf24' }}> Échanges</span>.
              Si cette équation se déséquilibre, la fréquence du réseau (50 Hz) dévie → risque de blackout.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
