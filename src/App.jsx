import React, { useMemo, useState } from 'react';
import { MapProvider } from 'react-map-gl/maplibre';
import { LightningIcon, GameIcon } from './components/Common/Icons';
import { AppProvider, useAppContext } from './context/AppContext';
import { useEnergyData } from './hooks/useEnergyData';
import { useCarbonData } from './hooks/useCarbonData';
import { useEcowatt } from './hooks/useEcowatt';
import EnergyMapLayer from './components/Map/EnergyMapLayer';
import KPIBar from './components/Panels/KPIBar';
import EnergyMixDonut from './components/Panels/EnergyMixDonut';
import EducationalOverlay from './components/Panels/EducationalOverlay';
import CapacityPanel from './components/Panels/CapacityPanel';
import WeatherCorrelation from './components/Panels/WeatherCorrelation';
import ExchangePanel from './components/Panels/ExchangePanel';
import EcowattBadge from './components/Panels/EcowattBadge';
import MetropoleDetail from './components/Panels/MetropoleDetail';
import SimulationPanel from './components/Simulation/SimulationPanel';
import NarratorBar from './components/Narrator/NarratorBar';
import ModeSelector from './components/Controls/ModeSelector';
import MapLayerSelector from './components/Controls/MapLayerSelector';
import Timeline from './components/Controls/Timeline';
import RegionEnergyExplainer from './components/Panels/RegionEnergyExplainer';
import MeritOrderModal from './components/Panels/MeritOrderModal';
import EnergyFlowSankey from './components/Panels/EnergyFlowSankey';
import { GlossaryModal } from './components/Panels/Glossary';
import CitizenHubModal from './components/Panels/CitizenHubModal';
import HistoricalScenariosPanel from './components/Panels/HistoricalScenariosPanel';
import ScenarioInfoDrawer from './components/Panels/ScenarioInfoDrawer';
import DiscoveryDashboard from './components/Pedagogical/DiscoveryDashboard';
import DataDetailModal from './components/Panels/DataDetailModal';
// Custom SVG Icons for mode selector and headers
const BookOpen = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const Activity = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const Sliders = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="18" y1="16" x2="22" y2="16" />
  </svg>
);

const PlugIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 10h-1.25A3 3 0 0 0 14 12.75V17" />
    <path d="M6 10h1.25A3 3 0 0 1 10 12.75V17" />
    <path d="M10 17h4v2a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
    <path d="M12 2v6" />
  </svg>
);

const CloudSunIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    <path d="M22 17a3 3 0 0 0-3-3H9a5 5 0 0 0-5 5 5.5 5.5 0 0 0 5.5 5.5A7.5 7.5 0 0 0 22 17z" />
  </svg>
);

const CityIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="10" width="4" height="11" />
    <rect x="6" y="2" width="4" height="19" />
    <rect x="10" y="12" width="4" height="9" />
    <rect x="14" y="6" width="4" height="15" />
    <rect x="18" y="10" width="4" height="11" />
  </svg>
);

const MapPinIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

import { NEIGHBORS } from './data/neighbors';

// Physical capacity limits (from ODRE metrics)
const INSTALLED_WIND = 25789;
const INSTALLED_SOLAR = 30437;
const INSTALLED_THERMAL = 17260;
const MAX_STEP_PUMPING = 5000;

// Estimate wholesale spot price using Merit Order rules & Carbon Tax ETS pricing
const estimateSpotPrice = (record) => {
  if (!record) return 30;
  const gaz = record.gaz || 0;
  const fioul = record.fioul || 0;
  const charbon = record.charbon || 0;
  const imports = record.ech_physiques > 0 ? record.ech_physiques : 0;
  const conso = record.consommation || 0;

  let basePrice = 35; // Standard base nuclear/renewables price

  if (charbon > 50 || fioul > 50) {
    basePrice = 145; // Coal/Oil marginal plant sets price
  } else if (gaz > 200) {
    basePrice = 78; // Gas marginal plant sets price
  } else if (imports > 1500) {
    basePrice = 85; // High import dependence sets price
  } else if (imports > 0) {
    basePrice = 55; // Moderate imports
  } else if (conso > 60000) {
    basePrice = 62; // High hydro/nuclear marginal peaking
  } else if (record.ech_physiques < -5000) {
    basePrice = 24; // High export surplus depresses prices
  }

  // Carbon ETS Tax Penalty (~80€/tCO2)
  let co2TaxImpact = 0;
  if (charbon > 50) {
    co2TaxImpact = 72; // Coal sets the carbon tax penalty
  } else if (fioul > 50) {
    co2TaxImpact = 56;
  } else if (gaz > 200) {
    co2TaxImpact = 32; // Gas sets the carbon tax penalty
  }

  // Grid stress penalty (in case of unresolved deficit / load shedding risk)
  const gridStress = record.grid_stress || 0;
  let stressPremium = 0;
  if (gridStress > 0) {
    stressPremium = Math.min(200, Math.round(gridStress / 50));
  }

  return basePrice + co2TaxImpact + stressPremium;
};

function DashboardLayout() {
  const { mode, timelineIndex, simulation, selectedRegion, setSelectedRegion, activeScenario, showDiscovery, setShowDiscovery } = useAppContext();

  // Right panel tab state management
  const [rightPanelTab, setRightPanelTab] = useState('exchanges');
  const [previousTab, setPreviousTab] = useState('exchanges');

  const handleTabChange = (newTab) => {
    setRightPanelTab(newTab);
    if (newTab !== 'region') {
      setPreviousTab(newTab);
    }
  };

  // Switch to region focus tab automatically on map selection
  React.useEffect(() => {
    if (selectedRegion) {
      setRightPanelTab('region');
    } else if (rightPanelTab === 'region') {
      setRightPanelTab(previousTab);
    }
  }, [selectedRegion]);

  // Adjust default tab when mode changes
  React.useEffect(() => {
    if (mode === 'simulation') {
      setRightPanelTab('simulation');
      setPreviousTab('simulation');
    } else {
      setRightPanelTab('exchanges');
      setPreviousTab('exchanges');
    }
  }, [mode]);

  const getRightPanelTabs = () => {
    const tabs = [];
    if (mode === 'simulation') {
      tabs.push({ id: 'simulation', label: 'Sim.', icon: Sliders });
    }
    tabs.push({ id: 'exchanges', label: 'Flux', icon: PlugIcon });
    tabs.push({ id: 'weather', label: 'Météo', icon: CloudSunIcon });
    if (mode === 'expert') {
      tabs.push({ id: 'metropoles', label: 'Métros', icon: CityIcon });
    }
    if (selectedRegion) {
      tabs.push({ id: 'region', label: 'Région', icon: MapPinIcon });
    }
    return tabs;
  };
  const { national, regional, forecasts, isLoading } = useEnergyData();
  const { data: carbon } = useCarbonData();
  const { data: ecowatt } = useEcowatt();

  // 1. Compute simulated regional data
  const simulatedRegional = useMemo(() => {
    if (!regional || Object.keys(regional).length === 0) return {};

    // Check if simulation is active (any delta != 0 or import overrides)
    const isSimActive = simulation.windDelta !== 0 ||
      simulation.solarDelta !== 0 ||
      simulation.tempDelta !== 0 ||
      Object.values(simulation.importOverrides || {}).some(v => v !== 'normal');

    if (!isSimActive) return regional;

    const copy = {};
    for (const [code, record] of Object.entries(regional)) {
      // Check if this region is targeted by the simulation
      const isTargeted = !simulation.activeRegions ||
        simulation.activeRegions.length === 0 ||
        simulation.activeRegions.includes(code);

      if (isTargeted) {
        const currentWind = record.eolien || 0;
        const currentSolar = record.solaire || 0;
        const currentConso = record.consommation || 0;

        const newWind = Math.max(0, Math.round(currentWind * (1 + simulation.windDelta / 100)));
        const newSolar = Math.max(0, Math.round(currentSolar * (1 + simulation.solarDelta / 100)));

        // Project consumption based on temperature sensitivity (scaled by region's share of national conso)
        let consoChange = 0;
        const effectiveTemp = 15 + simulation.tempDelta;
        if (effectiveTemp < 15) {
          consoChange = Math.round(simulation.tempDelta * -1500 * (currentConso / 55000));
        } else if (effectiveTemp > 25) {
          consoChange = Math.round(simulation.tempDelta * 800 * (currentConso / 55000));
        }
        const newConso = Math.max(0, currentConso + consoChange);

        copy[code] = {
          ...record,
          eolien: newWind,
          solaire: newSolar,
          consommation: newConso,
          production: (record.thermique || 0) + (record.nucleaire || 0) + newWind + newSolar + (record.hydraulique || 0) + (record.bioenergies || 0)
        };
      } else {
        copy[code] = record;
      }
    }
    return copy;
  }, [regional, simulation]);

  // 2. Selected or simulated active national record
  const activeRecord = useMemo(() => {
    if (!national || national.length === 0) return null;
    let baseRecord;
    if (timelineIndex < 0 && forecasts && forecasts.length > 0) {
      baseRecord = forecasts[Math.abs(timelineIndex) - 1];
    } else {
      baseRecord = national[timelineIndex] || national[0];
    }

    const isSimActive = simulation.windDelta !== 0 ||
      simulation.solarDelta !== 0 ||
      simulation.tempDelta !== 0 ||
      Object.values(simulation.importOverrides || {}).some(v => v !== 'normal');

    // Sum of baseline commercial border exchanges
    const baseExchangesSum = Object.values(NEIGHBORS).reduce(
      (sum, neighbor) => sum + (baseRecord[neighbor.key] || 0),
      0
    );

    if (!isSimActive) {
      const alignedRecord = {
        ...baseRecord,
        ech_physiques: baseExchangesSum,
        grid_stress: 0,
        step_pumping: 0,
        curtailment: 0
      };
      return {
        ...alignedRecord,
        spot_price: estimateSpotPrice(alignedRecord)
      };
    }

    // Calculate sum of regional changes
    let deltaWind = 0;
    let deltaSolar = 0;
    let deltaConso = 0;

    const hasRegional = regional && Object.keys(regional).length > 0;
    if (hasRegional) {
      for (const [code, record] of Object.entries(regional)) {
        const simRecord = simulatedRegional[code];
        if (simRecord) {
          deltaWind += (simRecord.eolien || 0) - (record.eolien || 0);
          deltaSolar += (simRecord.solaire || 0) - (record.solaire || 0);
          deltaConso += (simRecord.consommation || 0) - (record.consommation || 0);
        }
      }
    } else {
      // Fallback if regional data is not yet loaded
      const currentWind = baseRecord.eolien || 0;
      const currentSolar = baseRecord.solaire || 0;
      const currentConso = baseRecord.consommation || 0;

      deltaWind = Math.max(0, Math.round(currentWind * (1 + simulation.windDelta / 100))) - currentWind;
      deltaSolar = Math.max(0, Math.round(currentSolar * (1 + simulation.solarDelta / 100))) - currentSolar;

      let consoChange = 0;
      const effectiveTemp = 15 + simulation.tempDelta;
      if (effectiveTemp < 15) {
        consoChange = Math.round(simulation.tempDelta * -1500);
      } else if (effectiveTemp > 25) {
        consoChange = Math.round(simulation.tempDelta * 800);
      }
      deltaConso = consoChange;
    }

    const currentWind = baseRecord.eolien || 0;
    const currentSolar = baseRecord.solaire || 0;
    const currentConso = baseRecord.consommation || 0;
    const currentCo2 = baseRecord.taux_co2 || 30;

    // Enforce FACTEUR DE CHARGE PHYSIQUE MAXIMUM (Innovation #5)
    // Wind and Solar cannot exceed physical capacity bounds
    let newWind = Math.min(INSTALLED_WIND, Math.max(0, currentWind + deltaWind));
    let newSolar = Math.min(INSTALLED_SOLAR, Math.max(0, currentSolar + deltaSolar));
    const newConso = Math.max(0, currentConso + deltaConso);

    // Calculate neighbor exchanges based on overrides
    let calcBaseExchangesSum = 0;
    let simulatedExchangesSum = 0;
    const updatedNeighborExchanges = {};

    Object.entries(NEIGHBORS).forEach(([key, neighbor]) => {
      const baseVal = baseRecord[neighbor.key] || 0;
      calcBaseExchangesSum += baseVal;

      let newVal = baseVal;
      const override = simulation.importOverrides[key] || 'normal';
      if (override === 'blocked') {
        newVal = 0;
      } else if (override === 'reversed') {
        newVal = -baseVal;
      }

      simulatedExchangesSum += newVal;
      updatedNeighborExchanges[neighbor.key] = newVal;
    });

    const overridesImportDelta = simulatedExchangesSum - calcBaseExchangesSum;
    const weatherGenDelta = (newWind - currentWind) + (newSolar - currentSolar) - (newConso - currentConso);

    // Grid Balance calculations (Innovations #1, #2, #3, #6)
    const netBalanceNeeded = - (weatherGenDelta + overridesImportDelta);

    const currentGaz = baseRecord.gaz || 0;
    const currentFioul = baseRecord.fioul || 0;
    const currentCharbon = baseRecord.charbon || 0;
    const currentThermal = currentGaz + currentFioul + currentCharbon;

    let newThermal = currentThermal;
    let stepPumping = 0;
    let curtailment = 0;
    let gridStress = 0;

    if (netBalanceNeeded > 0) {
      // Deficit: call for thermal up to physical thermal capacity (INSTALLED_THERMAL)
      const thermalAvailable = Math.max(0, INSTALLED_THERMAL - currentThermal);
      const thermalIncrease = Math.min(netBalanceNeeded, thermalAvailable);
      newThermal = currentThermal + thermalIncrease;

      // Unresolved deficit leads to grid stress (blackout / Ecowatt alerts)
      gridStress = Math.round(netBalanceNeeded - thermalIncrease);
    } else if (netBalanceNeeded < 0) {
      // Surplus: cut thermal first
      const surplus = -netBalanceNeeded;
      const thermalReduction = Math.min(surplus, currentThermal);
      newThermal = currentThermal - thermalReduction;
      let remainingSurplus = surplus - thermalReduction;

      if (remainingSurplus > 0) {
        // Charge STEP hydro storage (up to MAX_STEP_PUMPING)
        stepPumping = Math.min(remainingSurplus, MAX_STEP_PUMPING);
        remainingSurplus -= stepPumping;
      }

      if (remainingSurplus > 0) {
        // Curtail renewable generation
        curtailment = Math.round(remainingSurplus);
        const totalRenewables = newWind + newSolar;
        if (totalRenewables > 0) {
          const windRatio = newWind / totalRenewables;
          newWind = Math.max(0, newWind - Math.round(curtailment * windRatio));
          newSolar = Math.max(0, newSolar - Math.round(curtailment * (1 - windRatio)));
        }
      }
    }

    // Allocate new thermal proportions
    let newGaz = 0, newFioul = 0, newCharbon = 0;
    if (currentThermal > 0) {
      const ratio = newThermal / currentThermal;
      newGaz = Math.round(currentGaz * ratio);
      newFioul = Math.round(currentFioul * ratio);
      newCharbon = Math.round(currentCharbon * ratio);
    } else if (newThermal > 0) {
      newGaz = Math.round(newThermal * 0.8);
      newFioul = Math.round(newThermal * 0.15);
      newCharbon = Math.round(newThermal * 0.05);
    }

    const finalThermal = newGaz + newFioul + newCharbon;
    const thermalChange = finalThermal - currentThermal;

    // Carbon intensity formula
    const newCo2 = Math.max(10, Math.min(250, Math.round(
      ((currentCo2 * currentConso) + (thermalChange * 500)) / Math.max(newConso, 1)
    )));

    const finalRecord = {
      ...baseRecord,
      ...updatedNeighborExchanges,
      eolien: newWind,
      solaire: newSolar,
      consommation: newConso,
      gaz: newGaz,
      fioul: newFioul,
      charbon: newCharbon,
      ech_physiques: simulatedExchangesSum,
      taux_co2: newCo2,
      grid_stress: gridStress,
      step_pumping: stepPumping,
      curtailment: curtailment
    };

    return {
      ...finalRecord,
      spot_price: estimateSpotPrice(finalRecord)
    };
  }, [national, timelineIndex, simulation, regional, simulatedRegional]);

  // Wrapped national data array to inject the active/simulated record at index 0
  const wrappedNationalData = useMemo(() => {
    if (!national || national.length === 0 || !activeRecord) return [];
    const copy = [...national];
    copy[timelineIndex] = activeRecord;
    return [activeRecord, ...copy.slice(1)];
  }, [national, activeRecord, timelineIndex]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0e1a' }}>
      {/* Background Map Component */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <EnergyMapLayer
          regionalData={simulatedRegional}
          ecowattData={ecowatt || []}
          nationalData={wrappedNationalData}
        />
      </div>

      {/* Top Header Bar */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 20,
        right: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '800',
            margin: 0,
            background: 'linear-gradient(135deg, #ffffff, #9ca3af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <LightningIcon size={18} color="#f59e0b" style={{ display: 'inline' }} />
            <span>ÉnergieFrance</span>
          </h1>
          <ModeSelector />
          <HistoricalScenariosPanel />
          <button
            onClick={() => setShowDiscovery(true)}
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 18px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 15px rgba(251, 191, 36, 0.4)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(251, 191, 36, 0.4)';
            }}
          >
            <GameIcon size={14} color="#ffffff" /> Découvrir & Relever les Défis Réseau
          </button>
        </div>
        <MapLayerSelector />
      </div>

      {/* Top KPI Bar */}
      <div style={{ position: 'absolute', top: 52, left: 20, right: 20, zIndex: 10 }}>
        <KPIBar nationalData={wrappedNationalData} carbonData={carbon} />
      </div>

      {/* Left Panel */}
      <div
        className="left-panel-container no-scrollbar"
      >
        {/* Active Mode Guide Banner */}
        <div className="glass-panel" style={{ flexShrink: 0, padding: '6px 10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {mode === 'pedagogical' ? (
              <>
                <BookOpen color="var(--text-accent)" />
                <span>Mode Pédagogique</span>
              </>
            ) : mode === 'expert' ? (
              <>
                <Activity color="var(--text-accent)" />
                <span>Mode Expert</span>
              </>
            ) : (
              <>
                <Sliders color="var(--text-accent)" />
                <span>Mode Simulation</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.3' }}>
            {mode === 'pedagogical'
              ? 'Parcours simplifié et interactif pour s\'initier à l\'équilibre énergétique.'
              : mode === 'expert'
                ? 'Analyse technique : filières de production, réseau haute tension et corrélations météo.'
                : 'Simulez l\'impact de scénarios climatiques et frontaliers sur le réseau.'}
          </div>
        </div>

        {/* Energy Mix Donut Chart */}
        <div className="glass-panel" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '10px 12px' }}>
          <EnergyMixDonut data={wrappedNationalData} />
        </div>

        {/* Adaptable Lower Left Panel */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '10px 12px' }}>
          {mode === 'pedagogical' ? (
            <EducationalOverlay />
          ) : (
            <CapacityPanel nationalData={wrappedNationalData} />
          )}
        </div>

      </div>

      {/* Right Panel / Scenario Info Drawer */}
      {activeScenario ? (
        <ScenarioInfoDrawer />
      ) : (
        <div className="right-panel-container">
          {/* Tabs header selector for Expert & Simulation modes */}
          {(mode === 'expert' || mode === 'simulation') && (
            <div style={{
              display: 'flex',
              background: 'rgba(10, 14, 26, 0.6)',
              border: '1px solid var(--border-light)',
              borderRadius: '24px',
              padding: '3px',
              gap: '3px',
              flexShrink: 0,
              boxSizing: 'border-box',
              width: '100%'
            }}>
              {getRightPanelTabs().map((tab) => {
                const isActive = rightPanelTab === tab.id;
                const TabIcon = tab.icon;
                const color = isActive ? '#ffffff' : 'var(--text-secondary)';
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    style={{
                      flex: 1,
                      background: isActive ? 'linear-gradient(135deg, var(--color-hydro), #1d4ed8)' : 'transparent',
                      color: color,
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 0',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <TabIcon color={color} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Unified Right Panel Content Wrapper */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '10px 12px' }}>
            {mode === 'pedagogical' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0 }}>
                {selectedRegion ? (
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <RegionEnergyExplainer regionCode={selectedRegion} onClose={() => setSelectedRegion(null)} />
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1.2, overflowY: 'auto', minHeight: 0 }}>
                      <ExchangePanel nationalData={wrappedNationalData} />
                    </div>
                    <div style={{ flex: 0.8, overflowY: 'auto', minHeight: 0 }}>
                      <EcowattBadge />
                    </div>
                  </>
                )}
              </div>
            ) : rightPanelTab === 'region' && selectedRegion ? (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <RegionEnergyExplainer regionCode={selectedRegion} onClose={() => setSelectedRegion(null)} />
              </div>
            ) : rightPanelTab === 'exchanges' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <ExchangePanel nationalData={wrappedNationalData} />
              </div>
            ) : rightPanelTab === 'weather' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <WeatherCorrelation />
              </div>
            ) : rightPanelTab === 'metropoles' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <MetropoleDetail />
              </div>
            ) : rightPanelTab === 'simulation' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <SimulationPanel nationalData={wrappedNationalData} />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Bottom Control & Narrator Bar */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: '65px',
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        zIndex: 10,
        padding: '0 20px'
      }}>
        <div style={{ flex: 1.8, height: '100%' }}>
          <NarratorBar nationalData={wrappedNationalData} />
        </div>
        <div style={{ flex: 1.2, height: '100%', borderLeft: '1px solid var(--border-light)', paddingLeft: '20px', display: 'flex', alignItems: 'center' }}>
          <Timeline nationalData={national} forecastData={forecasts} />
        </div>
      </div>
      {/* Pedagogical Modals */}
      <DiscoveryDashboard />
      <DataDetailModal />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MapProvider>
        <DashboardLayout />
      </MapProvider>
    </AppProvider>
  );
}

export default App;
