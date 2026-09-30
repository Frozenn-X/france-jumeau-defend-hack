import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useAppContext } from '../../context/AppContext';
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

export default function EnergyMixDonut({ data }) {
  const svgRef = useRef(null);
  const { mode, simulation, timelineIndex } = useAppContext();
  const { national } = useEnergyData();

  // Retrieve last known good data from localStorage if prop data is empty/loading
  const fallbackNationalData = useMemo(() => {
    try {
      const cached = localStorage.getItem('fallback_national_data');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const activeData = useMemo(() => {
    if (data && data.length > 0) return data;
    return fallbackNationalData;
  }, [data, fallbackNationalData]);

  const isFallbackUsed = !data || data.length === 0;

  const baseRecord = useMemo(() => {
    if (!national || national.length === 0) return null;
    return national[timelineIndex] || national[0];
  }, [national, timelineIndex]);

  const simRecord = useMemo(() => {
    if (activeData.length === 0) return null;
    return activeData[0];
  }, [activeData]);

  const isSimActive = useMemo(() => {
    return mode === 'simulation' && (
      simulation.windDelta !== 0 ||
      simulation.solarDelta !== 0 ||
      simulation.tempDelta !== 0 ||
      Object.values(simulation.importOverrides || {}).some(v => v !== 'normal')
    );
  }, [mode, simulation]);

  // Donut chart logic for non-simulation mode (or when simulation is not active yet)
  useEffect(() => {
    if (isSimActive || activeData.length === 0 || !svgRef.current) return;

    const latest = activeData[0];
    
    // Process data
    const sources = [
      { id: 'nuclear', label: 'Nucléaire', value: latest.nucleaire || 0, color: '#8b5cf6' },
      { id: 'wind', label: 'Éolien', value: latest.eolien || 0, color: '#0ea5e9' },
      { id: 'solar', label: 'Solaire', value: latest.solaire || 0, color: '#f59e0b' },
      { id: 'hydro_lacs', label: 'Hydro (Lacs)', value: latest.hydraulique_lacs || 0, color: '#1d4ed8' },
      { id: 'hydro_fil', label: "Hydro (Fil de l'eau)", value: latest.hydraulique_fil_eau_eclusee || 0, color: '#3b82f6' },
      { id: 'hydro_step', label: 'Hydro (STEP Turbinage)', value: latest.hydraulique_step_turbinage || 0, color: '#60a5fa' },
      { id: 'gas', label: 'Gaz', value: latest.gaz || 0, color: '#f97316' },
      { id: 'bio', label: 'Bioénergies', value: latest.bioenergies || 0, color: '#10b981' },
      { id: 'thermal', label: 'Thermique Fossile (Charbon/Fioul)', value: (latest.fioul || 0) + (latest.charbon || 0), color: '#475569' }
    ].filter(d => d.value > 0);

    const total = d3.sum(sources, d => d.value);

    const width = 180;
    const height = 180;
    const margin = 5;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.65).outerRadius(radius);

    const arcs = g.selectAll("arc")
      .data(pie(sources))
      .enter()
      .append("g");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => d.data.color)
      .attr("stroke", "rgba(10, 14, 26, 0.5)")
      .style("stroke-width", "2px")
      .style("opacity", 0.9);

    // Add total text in center
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -3)
      .style("fill", "white")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text(`${(total / 1000).toFixed(1)} GW`);
      
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 12)
      .style("fill", "#9ca3af")
      .style("font-size", "9px")
      .text("Prod. totale");

  }, [activeData, isSimActive]);

  // Compute values for comparison view
  const comparisonData = useMemo(() => {
    if (!baseRecord || !simRecord) return [];

    return [
      { id: 'nuclear', label: '☢️ Nucléaire', base: baseRecord.nucleaire || 0, sim: simRecord.nucleaire || 0, color: '#8b5cf6' },
      { id: 'wind', label: '🌬️ Éolien', base: baseRecord.eolien || 0, sim: simRecord.eolien || 0, color: '#0ea5e9' },
      { id: 'solar', label: '☀️ Solaire', base: baseRecord.solaire || 0, sim: simRecord.solaire || 0, color: '#f59e0b' },
      { id: 'hydro_lacs', label: '💧 Hydro (Lacs)', base: baseRecord.hydraulique_lacs || 0, sim: simRecord.hydraulique_lacs || 0, color: '#1d4ed8' },
      { id: 'hydro_fil', label: "💧 Hydro (Fil de l'eau)", base: baseRecord.hydraulique_fil_eau_eclusee || 0, sim: simRecord.hydraulique_fil_eau_eclusee || 0, color: '#3b82f6' },
      { id: 'hydro_step', label: '💧 Hydro (STEP Turb.)', base: baseRecord.hydraulique_step_turbinage || 0, sim: simRecord.hydraulique_step_turbinage || 0, color: '#60a5fa' },
      { id: 'gas', label: '🔥 Gaz', base: baseRecord.gaz || 0, sim: simRecord.gaz || 0, color: '#f97316' },
      { id: 'bio', label: '🌱 Bioénergies', base: baseRecord.bioenergies || 0, sim: simRecord.bioenergies || 0, color: '#10b981' },
      { id: 'thermal', label: '🪨 Thermique Fossile', base: (baseRecord.fioul || 0) + (baseRecord.charbon || 0), sim: (simRecord.fioul || 0) + (simRecord.charbon || 0), color: '#475569' }
    ];
  }, [baseRecord, simRecord]);

  const maxVal = useMemo(() => {
    if (comparisonData.length === 0) return 1;
    return Math.max(
      d3.max(comparisonData, d => d.base) || 1,
      d3.max(comparisonData, d => d.sim) || 1
    );
  }, [comparisonData]);

  if (isSimActive) {
    return (
      <div style={{ padding: '2px', fontFamily: 'Inter, sans-serif', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '12px', marginBottom: '4px', color: '#f9fafb', borderBottom: '1px solid var(--border-light)', paddingBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚖️ Mix de Production</span>
          <span style={{ fontSize: '8.5px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
            Données : {getUpdateDateText(simRecord)} {isFallbackUsed && simRecord && "(Sauvegardé)"}
          </span>
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <span>Filière</span>
          <span>Réel vs Simulé (MW)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          {comparisonData.map((d) => {
            const pctChange = d.base > 0 ? ((d.sim - d.base) / d.base) * 100 : 0;
            const hasChanged = Math.round(d.sim - d.base) !== 0;

            const baseWidth = Math.max(2, (d.base / maxVal) * 100);
            const simWidth = Math.max(2, (d.sim / maxVal) * 100);

            return (
              <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ fontWeight: '500', color: '#f9fafb' }}>{d.label}</span>
                  <span style={{ fontSize: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{Math.round(d.base).toLocaleString()}</span>
                    <span style={{ color: 'var(--text-secondary)', margin: '0 4px' }}>→</span>
                    <b style={{ color: hasChanged ? d.color : '#f9fafb' }}>{Math.round(d.sim).toLocaleString()}</b>
                    {hasChanged && (
                      <span style={{ color: pctChange > 0 ? 'var(--color-export)' : 'var(--color-import)', marginLeft: '4px', fontSize: '9px', fontWeight: 'bold' }}>
                        ({pctChange > 0 ? '+' : ''}{Math.round(pctChange)}%)
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Visual bar comparisons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '4px' }}>
                  {/* Base bar */}
                  <div style={{ display: 'flex', alignItems: 'center', height: '4px' }}>
                    <div style={{
                      width: `${baseWidth}%`,
                      height: '100%',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '2px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  {/* Simulated bar */}
                  <div style={{ display: 'flex', alignItems: 'center', height: '6px' }}>
                    <div style={{
                      width: `${simWidth}%`,
                      height: '100%',
                      background: d.color,
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                      boxShadow: hasChanged ? `0 0 6px ${d.color}` : 'none'
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Classic Donut Chart UI
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <h3 style={{ fontSize: '12px', margin: '0 0 4px 0', color: '#f9fafb', alignSelf: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '3px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Mix Énergétique National</span>
        <span style={{ fontSize: '8.5px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
          Données : {getUpdateDateText(simRecord)} {isFallbackUsed && simRecord && "(Sauvegardé)"}
        </span>
      </h3>
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <svg ref={svgRef}></svg>
        {/* Simple legend right of donut */}
        {activeData && activeData[0] && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '8.5px', marginLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Nucléaire</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Éolien</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Solaire</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1d4ed8' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Hydro (Lacs)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Hydro (Fil eau)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Hydro (STEP)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Gaz</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#475569' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Thermique Fossile</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
