import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useEnergyData } from '../../hooks/useEnergyData';
import { REGION_NAMES } from '../../data/regionCenters';
import { WindIcon, SolarIcon, TempIcon, PlugIcon, BatteryIcon, ScissorsIcon, AlertIcon, CarbonIcon, EuroIcon, ResetIcon, WorldIcon, ChartIcon, PinIcon } from '../Common/Icons';

export default function SimulationPanel({ nationalData }) {
  const { simulation, setSimulation, mode, timelineIndex } = useAppContext();
  const { national } = useEnergyData();

  // Local state for smooth slider interaction
  const [localWind, setLocalWind] = useState(simulation.windDelta);
  const [localSolar, setLocalSolar] = useState(simulation.solarDelta);
  const [localTemp, setLocalTemp] = useState(simulation.tempDelta);

  const windDebounce = useRef(null);
  const solarDebounce = useRef(null);
  const tempDebounce = useRef(null);

  // Sync local state when global simulation values change (e.g., reset)
  useEffect(() => {
    setLocalWind(simulation.windDelta);
  }, [simulation.windDelta]);

  useEffect(() => {
    setLocalSolar(simulation.solarDelta);
  }, [simulation.solarDelta]);

  useEffect(() => {
    setLocalTemp(simulation.tempDelta);
  }, [simulation.tempDelta]);

  // Clean up debounce timers on unmount
  useEffect(() => {
    return () => {
      if (windDebounce.current) clearTimeout(windDebounce.current);
      if (solarDebounce.current) clearTimeout(solarDebounce.current);
      if (tempDebounce.current) clearTimeout(tempDebounce.current);
    };
  }, []);

  const handleWindChange = (val) => {
    setLocalWind(val);
    if (windDebounce.current) clearTimeout(windDebounce.current);
    windDebounce.current = setTimeout(() => {
      setSimulation(prev => ({ ...prev, windDelta: val }));
    }, 60);
  };

  const handleSolarChange = (val) => {
    setLocalSolar(val);
    if (solarDebounce.current) clearTimeout(solarDebounce.current);
    solarDebounce.current = setTimeout(() => {
      setSimulation(prev => ({ ...prev, solarDelta: val }));
    }, 60);
  };

  const handleTempChange = (val) => {
    setLocalTemp(val);
    if (tempDebounce.current) clearTimeout(tempDebounce.current);
    tempDebounce.current = setTimeout(() => {
      setSimulation(prev => ({ ...prev, tempDelta: val }));
    }, 60);
  };

  // Get baseline record safely from original national data
  const baseRecord = useMemo(() => {
    if (!national || national.length === 0) return null;
    return national[timelineIndex] || national[0];
  }, [national, timelineIndex]);

  const simulatedRecord = useMemo(() => {
    if (!nationalData || nationalData.length === 0) return null;
    return nationalData[0];
  }, [nationalData]);

  const activeRegions = simulation.activeRegions || [];

  const handleToggleRegion = (code) => {
    if (code === 'all') {
      setSimulation(prev => ({
        ...prev,
        activeRegions: []
      }));
    } else {
      setSimulation(prev => {
        const next = [...prev.activeRegions];
        const idx = next.indexOf(code);
        if (idx > -1) {
          next.splice(idx, 1);
        } else {
          next.push(code);
        }
        return {
          ...prev,
          activeRegions: next
        };
      });
    }
  };

  const handleReset = () => {
    if (windDebounce.current) clearTimeout(windDebounce.current);
    if (solarDebounce.current) clearTimeout(solarDebounce.current);
    if (tempDebounce.current) clearTimeout(tempDebounce.current);
    
    setLocalWind(0);
    setLocalSolar(0);
    setLocalTemp(0);

    setSimulation({
      windDelta: 0,
      solarDelta: 0,
      tempDelta: 0,
      activeRegions: [],
      importOverrides: {}
    });
  };

  // Compute projections directly from base and simulated records (No double logic!)
  const projection = useMemo(() => {
    if (!baseRecord || !simulatedRecord) return null;

    const currentWind = baseRecord.eolien || 0;
    const currentSolar = baseRecord.solaire || 0;
    const currentConso = baseRecord.consommation || 0;
    const currentCo2 = baseRecord.taux_co2 || 30;
    const currentThermal = (baseRecord.gaz || 0) + (baseRecord.fioul || 0) + (baseRecord.charbon || 0);

    const simWind = simulatedRecord.eolien || 0;
    const simSolar = simulatedRecord.solaire || 0;
    const simConso = simulatedRecord.consommation || 0;
    const simCo2 = simulatedRecord.taux_co2 || 30;
    const simThermal = (simulatedRecord.gaz || 0) + (simulatedRecord.fioul || 0) + (simulatedRecord.charbon || 0);

    const basePrice = baseRecord.spot_price || 35;
    const simPrice = simulatedRecord.spot_price || 35;

    return {
      wind: { original: currentWind, simulated: simWind, delta: simWind - currentWind },
      solar: { original: currentSolar, simulated: simSolar, delta: simSolar - currentSolar },
      conso: { original: currentConso, simulated: simConso, delta: simConso - currentConso },
      net: { original: baseRecord.ech_physiques || 0, simulated: simulatedRecord.ech_physiques || 0, delta: (simulatedRecord.ech_physiques || 0) - (baseRecord.ech_physiques || 0) },
      co2: { original: currentCo2, simulated: simCo2, delta: simCo2 - currentCo2 },
      thermal: { original: currentThermal, simulated: simThermal, delta: simThermal - currentThermal },
      price: { original: basePrice, simulated: simPrice, delta: simPrice - basePrice },
      gridStress: { original: 0, simulated: simulatedRecord.grid_stress || 0, delta: simulatedRecord.grid_stress || 0 },
      stepPumping: { original: 0, simulated: simulatedRecord.step_pumping || 0, delta: simulatedRecord.step_pumping || 0 },
      curtailment: { original: 0, simulated: simulatedRecord.curtailment || 0, delta: simulatedRecord.curtailment || 0 }
    };
  }, [baseRecord, simulatedRecord]);

  if (mode !== 'simulation') return null;

  const renderDeltaBadge = (delta, unit = 'MW', inverseColors = false) => {
    if (Math.round(delta) === 0) return <span style={{ color: 'var(--text-secondary)' }}>0 {unit}</span>;
    const isPositive = delta > 0;
    
    // Good vs bad variation coloring
    let color = 'var(--color-export)'; // green
    if (isPositive) {
      color = inverseColors ? 'var(--color-import)' : 'var(--color-export)';
    } else {
      color = inverseColors ? 'var(--color-export)' : 'var(--color-import)';
    }

    return (
      <span style={{ color, fontWeight: 'bold' }}>
        {isPositive ? '▲ +' : '▼ '}{Math.round(delta).toLocaleString('fr-FR')} {unit}
      </span>
    );
  };

  const getImpactExplanation = () => {
    if (!projection || !simulatedRecord) return "Ajustez les sliders météo ou modifiez les flux frontaliers pour simuler.";
    
    const parts = [];
    const activeRNames = activeRegions.length > 0 
      ? activeRegions.map(code => REGION_NAMES[code]).join(', ')
      : "France entière";
      
    parts.push(`Zone affectée : ${activeRNames}.`);

    if (simulation.windDelta !== 0) {
      parts.push(`L'ajustement du vent (${simulation.windDelta > 0 ? '+' : ''}${simulation.windDelta}%) fait varier la puissance éolienne de ${projection.wind.delta > 0 ? '+' : ''}${Math.round(projection.wind.delta)} MW.`);
    }
    if (simulation.solarDelta !== 0) {
      parts.push(`L'ensoleillement (${simulation.solarDelta > 0 ? '+' : ''}${simulation.solarDelta}%) fait varier la puissance solaire de ${projection.solar.delta > 0 ? '+' : ''}${Math.round(projection.solar.delta)} MW.`);
    }
    if (simulation.tempDelta !== 0) {
      parts.push(`L'écart de température de ${simulation.tempDelta > 0 ? '+' : ''}${simulation.tempDelta}°C modifie la demande de chauffage/climatisation de ${projection.conso.delta > 0 ? '+' : ''}${Math.round(projection.conso.delta)} MW.`);
    }

    // Overrides impacts
    const overriddenCountries = Object.entries(simulation.importOverrides || {})
      .filter(([_, status]) => status !== 'normal');
    if (overriddenCountries.length > 0) {
      const overrideText = overriddenCountries.map(([key, status]) => {
        const flag = key === 'angleterre' ? 'UK' : key === 'espagne' ? 'ES' : key === 'italie' ? 'IT' : key === 'suisse' ? 'CH' : 'DE/BE';
        const name = key === 'allemagne_belgique' ? 'All./Belgique' : key.charAt(0).toUpperCase() + key.slice(1);
        return `[${flag}] ${name} (${status === 'blocked' ? 'Bloqué' : 'Inversé'})`;
      }).join(', ');
      parts.push(`Contrôle d'échange aux frontières activé pour : ${overrideText}.`);
    }

    const thermalDelta = projection.thermal.delta;
    if (thermalDelta > 0) {
      parts.push(`⚠️ Le déficit énergétique national de +${Math.round(thermalDelta)} MW doit être compensé en allumant des centrales thermiques. Cela fait grimper l'intensité carbone de +${Math.round(projection.co2.delta)} gCO₂/kWh.`);
    } else if (thermalDelta < 0) {
      parts.push(`🌱 Le surplus de production propre de -${Math.round(Math.abs(thermalDelta))} MW permet de couper des centrales thermiques. L'intensité carbone diminue de -${Math.round(Math.abs(projection.co2.delta))} gCO₂/kWh.`);
    }

    if (simulatedRecord.grid_stress > 0) {
      parts.push(`🔴 ALERTE DÉFICIT : Les centrales thermiques nationales sont saturées à leur maximum (17 260 MW) et les imports sont insuffisants. Le réseau subit un déficit critique de ${simulatedRecord.grid_stress.toLocaleString()} MW. Risque imminent de coupures ciblées (Ecowatt Rouge).`);
    } else {
      if (simulatedRecord.step_pumping > 0) {
        parts.push(`🔋 Stockage hydroélectrique (STEP) actif : Un excédent de ${simulatedRecord.step_pumping.toLocaleString()} MW est stocké en pompant l'eau vers les barrages d'altitude.`);
      }
      if (simulatedRecord.curtailment > 0) {
        parts.push(`✂️ Écrêtage renouvelable : Un surplus non stockable de ${simulatedRecord.curtailment.toLocaleString()} MW d'éolien/solaire a été bridé pour protéger l'intégrité de la grille.`);
      }
    }

    const priceDelta = projection.price.delta;
    if (priceDelta > 0) {
      parts.push(`💸 Le prix spot augmente de +${priceDelta} €/MWh en raison du recours à des sources thermiques plus chères soumises à la taxe carbone (ETS 80€/tCO₂).`);
    } else if (priceDelta < 0) {
      parts.push(`💸 Le prix spot diminue de -${Math.abs(priceDelta)} €/MWh grâce à l'afflux d'énergies décarbonées à coût marginal quasi-nul.`);
    }

    return parts.join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <h3 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChartIcon size={14} color="var(--text-accent)" />
          <span>Outil de Simulation Climat & Réseau</span>
        </span>
        { (simulation.windDelta !== 0 || simulation.solarDelta !== 0 || simulation.tempDelta !== 0 || activeRegions.length > 0 || Object.values(simulation.importOverrides || {}).some(v => v !== 'normal')) && (
          <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-export)', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
            Active
          </span>
        )}
      </h3>

      {/* Grid Stress Critical Alert Card */}
      {simulatedRecord && simulatedRecord.grid_stress > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--color-danger)',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '11px',
          color: '#ffffff',
          marginBottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
        }}>
          <b style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertIcon size={12} color="var(--color-danger)" />
            <span>DÉLESTAGE / RISQUE DE BLACKOUT</span>
          </b>
          <span>Le réseau subit un déficit non résolu de <b>{simulatedRecord.grid_stress.toLocaleString()} MW</b>. Les interconnexions et les centrales thermiques nationales sont saturées.</span>
        </div>
      )}

      {/* Region selector chips */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
          <PinIcon size={12} color="var(--text-secondary)" />
          <span>Périmètre régional</span>
        </span>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '4px', 
          maxHeight: '65px', 
          overflowY: 'auto', 
          padding: '4px', 
          border: '1px solid var(--border-light)', 
          borderRadius: '6px', 
          background: 'rgba(0,0,0,0.15)' 
        }}>
          <button
            onClick={() => handleToggleRegion('all')}
            style={{
              padding: '2px 5px',
              fontSize: '11px',
              borderRadius: '4px',
              border: '1px solid ' + (activeRegions.length === 0 ? 'var(--text-accent)' : 'rgba(255,255,255,0.1)'),
              background: activeRegions.length === 0 ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
              color: activeRegions.length === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            France entière
          </button>
          {Object.entries(REGION_NAMES).map(([code, name]) => {
            const isSelected = activeRegions.includes(code);
            return (
              <button
                key={code}
                onClick={() => handleToggleRegion(code)}
                style={{
                  padding: '2px 5px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid ' + (isSelected ? 'var(--text-accent)' : 'rgba(255,255,255,0.1)'),
                  background: isSelected ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        {/* Wind Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <WindIcon size={12} color="var(--text-secondary)" />
              <span>Vent (Delta Éolien)</span>
            </span>
            <b style={{ color: 'var(--color-wind)' }}>{localWind > 0 ? `+${localWind}` : localWind}%</b>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={localWind}
            onChange={(e) => handleWindChange(parseInt(e.target.value, 10))}
            style={{ width: '100%', height: '3px', cursor: 'pointer', accentColor: 'var(--color-wind)' }}
          />
        </div>

        {/* Solar Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <SolarIcon size={12} color="var(--text-secondary)" />
              <span>Soleil (Delta Solaire)</span>
            </span>
            <b style={{ color: 'var(--color-solar)' }}>{localSolar > 0 ? `+${localSolar}` : localSolar}%</b>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={localSolar}
            onChange={(e) => handleSolarChange(parseInt(e.target.value, 10))}
            style={{ width: '100%', height: '3px', cursor: 'pointer', accentColor: 'var(--color-solar)' }}
          />
        </div>

        {/* Temp Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TempIcon size={12} color="var(--text-secondary)" />
              <span>Température (Sensibilité Conso)</span>
            </span>
            <b style={{ color: 'var(--color-thermal)' }}>{localTemp > 0 ? `+${localTemp}` : localTemp}°C</b>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            value={localTemp}
            onChange={(e) => handleTempChange(parseInt(e.target.value, 10))}
            style={{ width: '100%', height: '3px', cursor: 'pointer', accentColor: 'var(--color-thermal)' }}
          />
        </div>
      </div>

      {/* Projection Table */}
      {projection && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '10px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: '8px',
          padding: '6px 8px',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', fontWeight: 'bold', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px', marginBottom: '2px' }}>
            <span>Métrique</span>
            <span>Simulé</span>
            <span style={{ textAlign: 'right' }}>Variation</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <WindIcon size={11} color="var(--text-secondary)" />
              <span>Éolien</span>
            </span>
            <span>{Math.round(projection.wind.simulated).toLocaleString()} MW</span>
            <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.wind.delta, 'MW')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <SolarIcon size={11} color="var(--text-secondary)" />
              <span>Solaire</span>
            </span>
            <span>{Math.round(projection.solar.simulated).toLocaleString()} MW</span>
            <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.solar.delta, 'MW')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <PlugIcon size={11} color="var(--text-secondary)" />
              <span>Consommation</span>
            </span>
            <span>{Math.round(projection.conso.simulated).toLocaleString()} MW</span>
            <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.conso.delta, 'MW', true)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <WorldIcon size={11} color="var(--text-secondary)" />
              <span>Échanges Net</span>
            </span>
            <span>{Math.round(projection.net.simulated).toLocaleString()} MW</span>
            <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.net.delta, 'MW', true)}</span>
          </div>

          {/* STEP Hydro storage row */}
          {projection.stepPumping.simulated > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-hydro)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BatteryIcon size={11} color="var(--color-hydro)" />
                <span>Stockage STEP</span>
              </span>
              <span>{Math.round(projection.stepPumping.simulated).toLocaleString()} MW</span>
              <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.stepPumping.delta, 'MW')}</span>
            </div>
          )}

          {/* Curtailment row */}
          {projection.curtailment.simulated > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-warning)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ScissorsIcon size={11} color="var(--color-warning)" />
                <span>Écrêtage Ren.</span>
              </span>
              <span>{Math.round(projection.curtailment.simulated).toLocaleString()} MW</span>
              <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.curtailment.delta, 'MW', true)}</span>
            </div>
          )}

          {/* Deficit / Grid Stress row */}
          {projection.gridStress.simulated > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', background: 'rgba(239,68,68,0.1)', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertIcon size={11} color="var(--color-danger)" />
                <span>Déficit Réseau</span>
              </span>
              <span style={{ fontWeight: 'bold' }}>{Math.round(projection.gridStress.simulated).toLocaleString()} MW</span>
              <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.gridStress.delta, 'MW', true)}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-accent)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CarbonIcon size={11} color="var(--text-accent)" />
              <span>Intensité CO₂</span>
            </span>
            <span>{projection.co2.simulated} g</span>
            <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.co2.delta, 'g', true)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2px', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-solar)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <EuroIcon size={11} color="var(--color-solar)" />
              <span>Prix de Gros</span>
            </span>
            <span style={{ fontWeight: 'bold' }}>{projection.price.simulated} €</span>
            <span style={{ textAlign: 'right' }}>{renderDeltaBadge(projection.price.delta, '€', true)}</span>
          </div>
        </div>
      )}

      {/* Impact explanation card */}
      <div style={{
        flex: 1,
        background: 'rgba(96, 165, 250, 0.03)',
        border: '1px dashed rgba(96, 165, 250, 0.2)',
        borderRadius: '6px',
        padding: '6px 8px',
        fontSize: '10px',
        lineHeight: '1.35',
        color: '#d1d5db',
        overflowY: 'auto',
        marginBottom: '8px'
      }}>
        <b style={{ color: 'var(--text-accent)', display: 'block', marginBottom: '2px' }}>💬 Impact Expliqué :</b>
        {getImpactExplanation()}
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        style={{
          width: '100%',
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: '6px',
          padding: '5px 10px',
          fontSize: '10px',
          fontWeight: '500',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border-light)';
        }}
      >
        <ResetIcon size={12} color="currentColor" />
        <span>Réinitialiser la simulation</span>
      </button>
    </div>
  );
}
