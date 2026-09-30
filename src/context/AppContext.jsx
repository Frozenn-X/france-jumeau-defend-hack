import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [mode, setMode] = useState('pedagogical'); // pedagogical, expert, simulation
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [mapLayer, setMapLayer] = useState('production'); // production, consumption, co2, ecowatt
  const [timelineIndex, setTimelineIndex] = useState(0); // 0 = real-time, larger = further in past
  const [detailedItem, setDetailedItem] = useState(null); // { type, id, name, data, extra }
  const [selectedPlant, setSelectedPlant] = useState(null); // { name, capacity, reactors, statusLabel, ... }
  const [selectedCityName, setSelectedCityName] = useState(null); // fullName
  
  // Store coordinates of the last click on screen to position detail modals dynamically
  const lastClickCoords = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalClick = (e) => {
      lastClickCoords.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousedown', handleGlobalClick, true);
    return () => window.removeEventListener('mousedown', handleGlobalClick, true);
  }, []);
  
  // Simulation states
  const [simulation, setSimulation] = useState({
    windDelta: 0,
    solarDelta: 0,
    tempDelta: 0,
    activeRegions: [], // empty = France entière, otherwise list of region codes
    importOverrides: {} // countryCode -> 'normal' | 'blocked' | 'reversed'
  });

  const [activeScenario, setActiveScenario] = useState(null);
  const [showDiscovery, setShowDiscovery] = useState(false);

  return (
    <AppContext.Provider value={{
      mode, setMode,
      selectedRegion, setSelectedRegion,
      mapLayer, setMapLayer,
      simulation, setSimulation,
      timelineIndex, setTimelineIndex,
      activeScenario, setActiveScenario,
      showDiscovery, setShowDiscovery,
      detailedItem, setDetailedItem,
      selectedPlant, setSelectedPlant,
      selectedCityName, setSelectedCityName,
      lastClickCoords
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
