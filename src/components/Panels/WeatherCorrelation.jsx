import React, { useMemo, useState } from 'react';
import { useEnergyData } from '../../hooks/useEnergyData';
import { useWeatherData } from '../../hooks/useWeatherData';

// Pearson R² correlation helper
function calculateR2(xArray, yArray) {
  const n = xArray.length;
  if (n === 0 || n !== yArray.length) return 0;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xArray[i];
    const y = yArray[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;
  const r = num / den;
  return r * r;
}

export default function WeatherCorrelation() {
  const { national } = useEnergyData();
  const { history: weatherHistory, isLoading } = useWeatherData();
  const [hoverIndex, setHoverIndex] = useState(null);

  // Sync the data
  const chartData = useMemo(() => {
    if (!national || national.length === 0 || !weatherHistory || !weatherHistory.hourly) return [];
    
    const hourly = weatherHistory.hourly;
    const times = hourly.time || [];
    const now = new Date();
    const past24h = now.getTime() - 24 * 60 * 60 * 1000;

    const points = [];
    times.forEach((timeStr, idx) => {
      const time = new Date(timeStr);
      // Limit to past 24h
      if (time.getTime() < past24h || time.getTime() > now.getTime()) return;

      // Find closest national electricity record (within 30 mins)
      const closestEnergy = national.find((e) => {
        const eTime = new Date(e.date_heure);
        return Math.abs(eTime.getTime() - time.getTime()) < 30 * 60 * 1000;
      });

      if (closestEnergy) {
        points.push({
          time: timeStr,
          hourLabel: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          temp: hourly.temperature_2m?.[idx] ?? 0,
          wind: hourly.wind_speed_10m?.[idx] ?? 0,
          rad: hourly.shortwave_radiation?.[idx] ?? 0,
          conso: closestEnergy.consommation || 0,
          windProd: closestEnergy.eolien || 0,
          solarProd: closestEnergy.solaire || 0,
        });
      }
    });

    // Return sorted chronologically
    return points.sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [national, weatherHistory]);

  const r2Values = useMemo(() => {
    if (chartData.length === 0) return { tempConso: 0, wind: 0, solar: 0 };
    return {
      tempConso: calculateR2(chartData.map(d => d.temp), chartData.map(d => d.conso)),
      wind: calculateR2(chartData.map(d => d.wind), chartData.map(d => d.windProd)),
      solar: calculateR2(chartData.map(d => d.rad), chartData.map(d => d.solarProd))
    };
  }, [chartData]);

  if (isLoading || chartData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Chargement des corrélations météo...
      </div>
    );
  }

  // Dimensions for each chart
  const width = 310;
  const height = 70;
  const padding = { top: 5, right: 5, bottom: 12, left: 32 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Scale functions helper
  const getX = (index) => padding.left + (index / (chartData.length - 1)) * graphWidth;

  const renderChart = (title, r2Val, description, primaryData, secondaryData, primaryColor, secondaryColor, primaryUnit, secondaryUnit, primaryLabel, secondaryLabel) => {
    // Find max values for scaling
    const maxPrimary = Math.max(...primaryData, 1);
    const maxSecondary = Math.max(...secondaryData, 1);

    const getPrimaryY = (val) => padding.top + graphHeight - (val / maxPrimary) * graphHeight;
    const getSecondaryY = (val) => padding.top + graphHeight - (val / maxSecondary) * graphHeight;

    // Create SVG Area Path for primary
    let areaPath = `M ${getX(0)} ${padding.top + graphHeight}`;
    primaryData.forEach((val, idx) => {
      areaPath += ` L ${getX(idx)} ${getPrimaryY(val)}`;
    });
    areaPath += ` L ${getX(chartData.length - 1)} ${padding.top + graphHeight} Z`;

    // Create SVG Line Path for secondary
    let linePath = `M ${getX(0)} ${getSecondaryY(secondaryData[0])}`;
    secondaryData.forEach((val, idx) => {
      linePath += ` L ${getX(idx)} ${getSecondaryY(val)}`;
    });

    return (
      <div style={{ marginBottom: '12px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {title} <span style={{ color: 'var(--text-accent)' }} title="Coefficient de corrélation R² (proximité de la relation de 0 à 1)">(R² = {r2Val.toFixed(2)})</span>
          </span>
          <span>
            <span style={{ color: primaryColor, marginRight: '6px' }}>● {primaryLabel}</span>
            <span style={{ color: secondaryColor }}>● {secondaryLabel}</span>
          </span>
        </div>
        
        <svg
          width={width}
          height={height}
          style={{ overflow: 'visible', cursor: 'crosshair', display: 'block' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - padding.left;
            const index = Math.round((x / graphWidth) * (chartData.length - 1));
            if (index >= 0 && index < chartData.length) {
              setHoverIndex(index);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Y Axis Labels */}
          <text x={1} y={padding.top + 8} fill={primaryColor} fontSize="7px" textAnchor="start">
            {Math.round(maxPrimary).toLocaleString()} {primaryUnit}
          </text>
          <text x={1} y={padding.top + graphHeight} fill={secondaryColor} fontSize="7px" textAnchor="start">
            {Math.round(maxSecondary)} {secondaryUnit}
          </text>

          {/* Area under primary (Energy) */}
          <path d={areaPath} fill={primaryColor} fillOpacity="0.12" />

          {/* Line for secondary (Weather) */}
          <path d={linePath} fill="none" stroke={secondaryColor} strokeWidth="1.2" strokeOpacity="0.85" />

          {/* X Axis label */}
          <text x={padding.left} y={height - 1} fill="var(--text-secondary)" fontSize="7px" textAnchor="start">
            {chartData[0].hourLabel}
          </text>
          <text x={width - padding.right} y={height - 1} fill="var(--text-secondary)" fontSize="7px" textAnchor="end">
            {chartData[chartData.length - 1].hourLabel}
          </text>

          {/* Hover sync line */}
          {hoverIndex !== null && (
            <>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + graphHeight}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle cx={getX(hoverIndex)} cy={getPrimaryY(primaryData[hoverIndex])} r="2.5" fill={primaryColor} />
              <circle cx={getX(hoverIndex)} cy={getSecondaryY(secondaryData[hoverIndex])} r="2.5" fill={secondaryColor} />
            </>
          )}
        </svg>
        
        {/* Dynamic educational context note */}
        <div style={{
          fontSize: '9px',
          color: 'var(--text-secondary)',
          lineHeight: '1.3',
          marginTop: '4px',
          padding: '4px 6px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '4px',
          borderLeft: `2px solid ${secondaryColor}`
        }}>
          {description}
        </div>
      </div>
    );
  };

  const hoveredPoint = hoverIndex !== null ? chartData[hoverIndex] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <h3 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
        📈 Corrélations Météo ↔ Énergie (24h)
      </h3>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
        {renderChart(
          "TEMPÉRATURE vs DEMANDE NETTE",
          r2Values.tempConso,
          "En France, chaque degré sous 15°C ajoute ~1 500 MW de conso (chauffage). Note physique : L'inertie thermique des bâtiments crée un décalage de 1 à 3h entre la baisse de température extérieure et la hausse effective de consommation.",
          chartData.map(d => d.conso),
          chartData.map(d => d.temp),
          "var(--color-hydro)",
          "var(--color-thermal)",
          "MW",
          "°C",
          "Demande",
          "Temp"
        )}

        {renderChart(
          "VENT vs PRODUCTION ÉOLIENNE",
          r2Values.wind,
          "La production éolienne varie selon le cube de la vitesse du vent. Au-delà de 90 km/h, les turbines s'arrêtent automatiquement par sécurité.",
          chartData.map(d => d.windProd),
          chartData.map(d => d.wind),
          "var(--color-wind)",
          "var(--text-accent)",
          "MW",
          "km/h",
          "Éolien",
          "Vent"
        )}

        {renderChart(
          "RAYONNEMENT vs PRODUCTION SOLAIRE",
          r2Values.solar,
          "Le rayonnement solaire direct détermine la production photovoltaïque. Elle culmine vers 13h et tombe à zéro dès la tombée de la nuit.",
          chartData.map(d => d.solarProd),
          chartData.map(d => d.rad),
          "var(--color-solar)",
          "#fb923c",
          "MW",
          "W/m²",
          "Solaire",
          "Rayon."
        )}
      </div>

      {/* Synchronized Hover Detail Box */}
      <div style={{
        marginTop: '6px',
        padding: '6px',
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-light)',
        borderRadius: '6px',
        fontSize: '10px',
        minHeight: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {hoveredPoint ? (
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-accent)', marginBottom: '2px', textAlign: 'center' }}>
              Détails relevés à {hoveredPoint.hourLabel}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', textAlign: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>🌡️ Temp :</span> <b>{hoveredPoint.temp}°C</b>
                <br/>
                <span style={{ color: 'var(--text-secondary)', fontSize: '8px' }}>Conso: {Math.round(hoveredPoint.conso).toLocaleString()} MW</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>🌬️ Vent :</span> <b>{hoveredPoint.wind} km/h</b>
                <br/>
                <span style={{ color: 'var(--text-secondary)', fontSize: '8px' }}>Éol: {hoveredPoint.windProd} MW</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>☀️ Rayon :</span> <b>{hoveredPoint.rad} W/m²</b>
                <br/>
                <span style={{ color: 'var(--text-secondary)', fontSize: '8px' }}>Sol: {hoveredPoint.solarProd} MW</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '9px' }}>
            Survolez un graphique pour observer les valeurs corrélées à cette heure
          </div>
        )}
      </div>
    </div>
  );
}
