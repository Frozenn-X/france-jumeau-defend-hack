import React, { useEffect, useState, useMemo } from 'react';
import { useNarrator } from '../../hooks/useNarrator';
import { useAppContext } from '../../context/AppContext';
import { useEnergyData } from '../../hooks/useEnergyData';
import { 
  WindIcon, SolarIcon, TempIcon, PlugIcon, ThermalIcon, 
  AlertIcon, CarbonIcon, NuclearIcon, HydroIcon, ScaleIcon, 
  EuroIcon, LightningIcon, BatteryIcon
} from '../Common/Icons';

// Custom component to render SVG icon for a given key string
function NarratorIcon({ name, color = 'currentColor', size = 12, style }) {
  switch (name) {
    case 'wind': return <WindIcon size={size} color={color} style={style} />;
    case 'solar': return <SolarIcon size={size} color={color} style={style} />;
    case 'temp': return <TempIcon size={size} color={color} style={style} />;
    case 'plug': return <PlugIcon size={size} color={color} style={style} />;
    case 'thermal': return <ThermalIcon size={size} color={color} style={style} />;
    case 'alert': return <AlertIcon size={size} color="var(--color-danger)" style={style} />;
    case 'carbon': return <CarbonIcon size={size} color="var(--color-success)" style={style} />;
    case 'nuclear': return <NuclearIcon size={size} color="var(--color-nuclear)" style={style} />;
    case 'hydro': return <HydroIcon size={size} color="var(--color-hydro)" style={style} />;
    case 'scale': return <ScaleIcon size={size} color="var(--color-warning)" style={style} />;
    case 'euro': return <EuroIcon size={size} color="var(--color-solar)" style={style} />;
    case 'battery': return <BatteryIcon size={size} color={color} style={style} />;
    case 'exchange': return <PlugIcon size={size} color={color} style={style} />;
    case 'record': return <ScaleIcon size={size} color="var(--color-success)" style={style} />;
    case 'narrator': return <LightningIcon size={size} color="var(--text-accent)" style={{ marginRight: '2px', ...style }} />;
    default: return null;
  }
}

export default function NarratorBar({ nationalData }) {
  const { mode, simulation, timelineIndex } = useAppContext();
  const { national } = useEnergyData();
  const { data: narrationData, isLoading } = useNarrator(mode);
  const [activeIdx, setActiveIdx] = useState(0);

  const baseRecord = useMemo(() => {
    if (!national || national.length === 0) return null;
    return national[timelineIndex] || national[0];
  }, [national, timelineIndex]);

  // Client-side simulation narration
  const simNarration = useMemo(() => {
    if (mode !== 'simulation' || !nationalData || nationalData.length === 0 || !baseRecord) return null;
    
    const simRecord = nationalData[0];
    const windDelta = simulation.windDelta;
    const solarDelta = simulation.solarDelta;
    const tempDelta = simulation.tempDelta;

    const isSimActive = windDelta !== 0 ||
                        solarDelta !== 0 ||
                        tempDelta !== 0 ||
                        Object.values(simulation.importOverrides || {}).some(v => v !== 'normal');

    if (!isSimActive) {
      return {
        story: "Mode Simulation : Modifiez la météo de droite ou bloquez des imports pour analyser le comportement du réseau.",
        narrations: [
          { icon: 'wind', text: "Déplacez le slider Vent pour modifier la production éolienne ciblée." },
          { icon: 'solar', text: "Ajustez le Soleil pour tester la contribution photovoltaïque." },
          { icon: 'temp', text: "Changez la Température pour voir la sensibilité thermique nationale." }
        ]
      };
    }

    const narrations = [];
    let storyParts = [];

    if (windDelta !== 0) {
      narrations.push({
        icon: 'wind',
        text: `Vent à ${windDelta > 0 ? '+' : ''}${windDelta}% → Éolien : ${Math.round(simRecord.eolien).toLocaleString()} MW (${windDelta > 0 ? 'hausse' : 'baisse'})`
      });
      storyParts.push(`Vent ${windDelta > 0 ? '+' : ''}${windDelta}%`);
    }

    if (solarDelta !== 0) {
      narrations.push({
        icon: 'solar',
        text: `Soleil à ${solarDelta > 0 ? '+' : ''}${solarDelta}% → Solaire : ${Math.round(simRecord.solaire).toLocaleString()} MW`
      });
      storyParts.push(`Soleil ${solarDelta > 0 ? '+' : ''}${solarDelta}%`);
    }

    if (tempDelta !== 0) {
      const consoDiff = simRecord.consommation - baseRecord.consommation;
      narrations.push({
        icon: 'temp',
        text: `Temp. ${tempDelta > 0 ? '+' : ''}${tempDelta}°C → Conso : ${Math.round(simRecord.consommation).toLocaleString()} MW (${consoDiff >= 0 ? '+' : ''}${Math.round(consoDiff).toLocaleString()} MW)`
      });
      storyParts.push(`Temp. ${tempDelta > 0 ? '+' : ''}${tempDelta}°C`);
    }

    // Overrides
    const overrides = Object.entries(simulation.importOverrides || {}).filter(([_, v]) => v !== 'normal');
    if (overrides.length > 0) {
      narrations.push({
        icon: 'plug',
        text: `Échanges : ${overrides.length} frontière(s) forcée(s)`
      });
      storyParts.push(`Flux modifiés`);
    }

    // Thermal and CO2 differences
    const thermalBase = (baseRecord.gaz || 0) + (baseRecord.fioul || 0) + (baseRecord.charbon || 0);
    const thermalSim = (simRecord.gaz || 0) + (simRecord.fioul || 0) + (simRecord.charbon || 0);
    const thermalDiff = thermalSim - thermalBase;
    
    if (thermalDiff !== 0) {
      narrations.push({
        icon: 'thermal',
        text: `Fossiles (Gaz/Charbon) : ${thermalSim.toLocaleString()} MW (${thermalDiff > 0 ? 'compense le déficit de +' : 'absorbe le surplus de -'}${Math.abs(thermalDiff).toLocaleString()} MW)`
      });
    }

    const co2Diff = simRecord.taux_co2 - baseRecord.taux_co2;
    narrations.push({
      icon: co2Diff > 0 ? 'alert' : 'carbon',
      text: `Intensité CO₂ : ${simRecord.taux_co2} g/kWh (${co2Diff > 0 ? 'hausse de +' : 'baisse de -'}${Math.abs(co2Diff)} g)`
    });

    const story = "Simulation active : " + storyParts.join(' | ') + ` → CO₂ résultant : ${simRecord.taux_co2} g/kWh`;
    return { story, narrations };
  }, [mode, simulation, nationalData, baseRecord]);

  // Enrich pedagogical slide decks client-side
  const enrichedNarrationData = useMemo(() => {
    if (mode === 'simulation') return simNarration;
    if (!narrationData) return null;
    if (mode !== 'pedagogical' || !narrationData.narrations) return narrationData;

    const extraFacts = [
      { icon: 'nuclear', text: "Le nucléaire fournit ~70% de notre électricité grâce à 56 réacteurs répartis sur 18 sites." },
      { icon: 'hydro', text: "L'hydraulique est la 1ère source renouvelable française (25 GW installés, réservoir principal)." },
      { icon: 'scale', text: "L'électricité ne se stockant pas, production et demande doivent s'équilibrer à chaque instant." },
      { icon: 'euro', text: "Le prix de marché est couplé au coût marginal de la dernière centrale appelée (Merit Order)." }
    ];

    return {
      ...narrationData,
      narrations: [...narrationData.narrations, ...extraFacts]
    };
  }, [mode, narrationData, simNarration]);

  // Rotate bullets
  useEffect(() => {
    if (!enrichedNarrationData || !enrichedNarrationData.narrations || enrichedNarrationData.narrations.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % enrichedNarrationData.narrations.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [enrichedNarrationData]);

  // Reset active index when mode changes
  useEffect(() => {
    setActiveIdx(0);
  }, [mode]);

  if (isLoading && mode !== 'simulation') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', color: 'var(--text-secondary)', fontSize: '11px' }}>
        <NarratorIcon name="narrator" size={14} />
        <span>Analyse en temps réel du réseau électrique...</span>
      </div>
    );
  }

  if (!enrichedNarrationData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', color: 'var(--text-secondary)', fontSize: '11px' }}>
        <NarratorIcon name="narrator" size={14} />
        <span>Données en cours de chargement...</span>
      </div>
    );
  }

  const { narrations, story } = enrichedNarrationData;
  const currentBullet = narrations && narrations[activeIdx];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '0 10px',
      fontFamily: 'Inter, sans-serif',
      gap: '15px'
    }}>
      {/* Narrative Chain Summary */}
      <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        <NarratorIcon name="narrator" size={14} />
        <div style={{
          fontSize: '11.5px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.02)',
          padding: '4px 10px',
          borderRadius: '20px',
          border: '1px solid var(--border-light)'
        }}>
          {story || "Calcul des données de production et consommation nationale..."}
        </div>
      </div>

      {/* Rotating detail bullet with transition */}
      {currentBullet && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(96,165,250,0.06)',
          border: '1px solid rgba(96,165,250,0.15)',
          padding: '4px 12px',
          borderRadius: '20px',
          maxWidth: '45%',
          flex: 0.8,
          overflow: 'hidden'
        }}>
          <NarratorIcon name={currentBullet.icon} size={12} color="var(--text-accent)" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: '11px',
            color: 'var(--text-accent)',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }} title={currentBullet.text}>
            {currentBullet.text}
          </span>
        </div>
      )}
    </div>
  );
}
