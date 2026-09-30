import React, { useRef, useEffect, useMemo } from 'react';
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
 * MeritOrderModal — Visualisation interactive de la courbe du Merit Order
 * 
 * Explique visuellement comment le prix de gros de l'électricité est fixé :
 * les centrales sont classées par coût marginal croissant et la demande 
 * (ligne verticale) coupe la courbe pour fixer le prix de marché.
 */
export default function MeritOrderModal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const { national } = useEnergyData();

  const latest = useMemo(() => {
    if (!national || national.length === 0) return null;
    return national[0];
  }, [national]);

  // Build merit order stack from real data
  const meritData = useMemo(() => {
    if (!latest) return { sources: [], demand: 0 };

    const sources = [
      { id: 'solar', label: '☀️ Solaire', cost: 0, capacity: latest.solaire || 0, color: '#fbbf24', desc: 'Coût marginal nul — le soleil est gratuit' },
      { id: 'wind', label: '🌬️ Éolien', cost: 1, capacity: latest.eolien || 0, color: '#22d3ee', desc: 'Coût marginal quasi-nul — le vent est gratuit' },
      { id: 'hydro', label: '💧 Hydraulique', cost: 5, capacity: latest.hydraulique || 0, color: '#3b82f6', desc: 'Très faible — eau gravitaire, amortissement ancien' },
      { id: 'nuclear', label: '⚛️ Nucléaire', cost: 12, capacity: latest.nucleaire || 0, color: '#818cf8', desc: '~12 €/MWh — combustible uranium très dense' },
      { id: 'bio', label: '🌱 Biomasse', cost: 35, capacity: latest.bioenergies || 0, color: '#34d399', desc: '~35 €/MWh — approvisionnement en matière organique' },
      { id: 'gas', label: '🔥 Gaz', cost: 78, capacity: latest.gaz || 0, color: '#f97316', desc: '~78 €/MWh — prix du gaz + taxe carbone ETS' },
      { id: 'coal', label: '🪨 Charbon', cost: 120, capacity: (latest.charbon || 0) + (latest.fioul || 0), color: '#ef4444', desc: '~120 €/MWh — prix du charbon + forte taxe carbone' },
    ].filter(s => s.capacity > 0 || ['gas', 'coal'].includes(s.id)); // Keep gas/coal even if 0 to show the full curve

    const demand = latest.consommation || 0;
    return { sources, demand };
  }, [latest]);

  // Draw the merit order chart on canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || meritData.sources.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const padLeft = 55;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 50;
    const chartW = displayW - padLeft - padRight;
    const chartH = displayH - padTop - padBottom;

    // Clear
    ctx.clearRect(0, 0, displayW, displayH);

    // Calculate total capacity and max cost for scaling
    const totalCapacity = meritData.sources.reduce((a, s) => a + Math.max(s.capacity, 200), 0);
    const maxCost = Math.max(150, ...meritData.sources.map(s => s.cost)) * 1.15;

    // Draw axes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + chartH);
    ctx.lineTo(padLeft + chartW, padTop + chartH);
    ctx.stroke();

    // Y-axis label
    ctx.save();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Inter, sans-serif';
    ctx.translate(12, padTop + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Prix (€/MWh)', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Puissance cumulée (GW)', padLeft + chartW / 2, displayH - 6);

    // Y-axis ticks
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let price = 0; price <= maxCost; price += 30) {
      const y = padTop + chartH - (price / maxCost) * chartH;
      ctx.fillText(`${price}€`, padLeft - 6, y + 3);
      // Grid line
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();
    }

    // Draw stacked rectangles (the merit order staircase)
    let cumulX = 0;
    meritData.sources.forEach((source) => {
      const cap = Math.max(source.capacity, 200); // min visual width
      const barW = (cap / totalCapacity) * chartW;
      const barH = (source.cost / maxCost) * chartH;
      const x = padLeft + (cumulX / totalCapacity) * chartW;
      const y = padTop + chartH - barH;

      // Fill rectangle
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = source.color;
      ctx.fillRect(x, y, barW, barH);

      // Top edge highlight
      ctx.globalAlpha = 1;
      ctx.strokeStyle = source.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + barW, y);
      ctx.stroke();

      // Label on top
      if (barW > 25) {
        ctx.fillStyle = '#f9fafb';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(source.label.replace(/[^\w\s]/g, '').trim(), x + barW / 2, y - 6);
        
        // MW text inside
        if (source.capacity > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '8px Inter, sans-serif';
          ctx.fillText(`${(source.capacity / 1000).toFixed(1)} GW`, x + barW / 2, y + 14);
        }
      }

      cumulX += cap;
    });

    // Draw demand line (vertical dashed red line)
    const demandX = padLeft + Math.min(1, meritData.demand / totalCapacity) * chartW;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(demandX, padTop);
    ctx.lineTo(demandX, padTop + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Demand label
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Demande : ${(meritData.demand / 1000).toFixed(1)} GW`, demandX, padTop + chartH + 16);

    // Find the clearing price (the cost of the last source needed to meet demand)
    let cumCap = 0;
    let clearingPrice = 0;
    let clearingSource = '';
    for (const source of meritData.sources) {
      cumCap += Math.max(source.capacity, 200);
      if (cumCap >= meritData.demand) {
        clearingPrice = source.cost;
        clearingSource = source.label;
        break;
      }
    }
    if (clearingPrice === 0 && meritData.sources.length > 0) {
      clearingPrice = meritData.sources[meritData.sources.length - 1].cost;
      clearingSource = meritData.sources[meritData.sources.length - 1].label;
    }

    // Draw clearing price horizontal line
    const priceY = padTop + chartH - (clearingPrice / maxCost) * chartH;
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, priceY);
    ctx.lineTo(demandX, priceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`→ Prix de marché : ~${clearingPrice} €/MWh`, padLeft + 6, priceY - 8);

  }, [isOpen, meritData]);

  if (!isOpen) return null;

  // Find clearing info for the text explanation
  let cumCap = 0;
  let clearingPrice = 0;
  let clearingSource = '';
  for (const source of meritData.sources) {
    cumCap += Math.max(source.capacity, 200);
    if (cumCap >= meritData.demand) {
      clearingPrice = source.cost;
      clearingSource = source.label;
      break;
    }
  }

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
          width: '720px',
          maxHeight: '85vh',
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
              📊 Le Merit Order — Comment se fixe le prix de l'électricité ?
            </h2>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>
              Visualisation en temps réel du marché de gros européen (Données du {getUpdateDateText(latest)})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af', borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.15)'; e.target.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#9ca3af'; }}
          >✕</button>
        </div>

        {/* Explanation cards */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '10px' }}>
          <div style={{
            flex: 1, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
            borderRadius: '8px', padding: '10px', fontSize: '10.5px', lineHeight: '1.45', color: '#d1d5db'
          }}>
            <b style={{ color: '#60a5fa' }}>💡 Comment ça marche ?</b><br/>
            Les centrales sont classées de la <b>moins chère</b> (renouvelables à gauche) à la <b>plus chère</b> (fossiles à droite).
            On allume les centrales une par une jusqu'à couvrir la <span style={{ color: '#f43f5e' }}>demande</span> (trait rouge).
          </div>
          <div style={{
            flex: 1, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
            borderRadius: '8px', padding: '10px', fontSize: '10.5px', lineHeight: '1.45', color: '#d1d5db'
          }}>
            <b style={{ color: '#fbbf24' }}>💰 Le prix = la dernière centrale allumée</b><br/>
            La <b>dernière source</b> nécessaire pour couvrir la demande fixe le prix pour <i>tout le monde</i>.
            {clearingSource && <> En ce moment : <b style={{ color: '#fbbf24' }}>{clearingSource}</b> → ~{clearingPrice} €/MWh.</>}
          </div>
        </div>

        {/* Canvas chart */}
        <div style={{ padding: '0 20px 12px', flex: 1 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '280px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}
          />
        </div>

        {/* Source legend */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center'
        }}>
          {meritData.sources.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', padding: '4px 8px', fontSize: '9px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color }} />
              <span style={{ color: '#d1d5db' }}>{s.label}</span>
              <span style={{ color: '#6b7280' }}>~{s.cost}€</span>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <div style={{
          padding: '8px 20px 14px', fontSize: '9px', color: '#6b7280',
          fontStyle: 'italic', textAlign: 'center', lineHeight: '1.4'
        }}>
          ⚠️ Les coûts marginaux sont des estimations pédagogiques simplifiées. Le prix réel du marché spot (EPEX Spot)
          dépend aussi des interconnexions européennes, de la disponibilité des centrales et de la spéculation financière.
        </div>
      </div>
    </div>
  );
}
