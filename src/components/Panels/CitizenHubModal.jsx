import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEnergyData } from '../../hooks/useEnergyData';
import { useCarbonData } from '../../hooks/useCarbonData';

/**
 * CitizenHubModal — Espace Citoyen & Découverte Pédagogique
 * 
 * Regroupe 5 modules interactifs et simples pour vulgariser le réseau électrique :
 * 1. Éco-Calculateur (Traducteur d'impact quotidien)
 * 2. Balance Réseau (Mini-jeu d'équilibre Fréquence 50 Hz)
 * 3. Les Métiers (Fiches narratives incarnées)
 * 4. L'Odyssée de l'Électron (Storyline visuelle du voyage de Volt)
 * 5. Empreinte & Foncier (Comparateur de densité d'occupation au sol et ressources)
 */
export default function CitizenHubModal({ isOpen, onClose, defaultTab = 'calculator' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { national } = useEnergyData();
  const { data: carbon } = useCarbonData();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const latest = useMemo(() => {
    if (!national || national.length === 0) return null;
    return national[0];
  }, [national]);

  // Carbon intensity calculation
  const co2Intensity = useMemo(() => {
    if (carbon?.intensite_emissions_conso) return carbon.intensite_emissions_conso;
    if (latest && latest.taux_co2) return latest.taux_co2;
    return 55; // Default French grid average (gCO2/kWh)
  }, [carbon, latest]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #0b0f19, #111827)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          width: '850px',
          height: '620px',
          boxShadow: '0 30px 70px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎓 Espace Découverte Citoyen
            </h2>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>
              Comprendre l'énergie simplement avec des outils concrets et des mini-jeux
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

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 12px'
        }}>
          <TabButton active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} icon="🔌" label="Calculateur Carbone" />
          <TabButton active={activeTab === 'balancer'} onClick={() => setActiveTab('balancer')} icon="⚖️" label="Jeu de la Balance (50Hz)" />
          <TabButton active={activeTab === 'journey'} onClick={() => setActiveTab('journey')} icon="🪐" label="Odyssée de l'Électron" />
          <TabButton active={activeTab === 'footprint'} onClick={() => setActiveTab('footprint')} icon="📐" label="Surface & Matières" />
          <TabButton active={activeTab === 'avatars'} onClick={() => setActiveTab('avatars')} icon="👤" label="Métiers du Réseau" />
        </div>

        {/* Tab Content Area */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'calculator' && <DailyImpact co2Intensity={co2Intensity} />}
          {activeTab === 'balancer' && <GridBalancer />}
          {activeTab === 'journey' && <ElectronJourney />}
          {activeTab === 'footprint' && <FootprintCompare />}
          {activeTab === 'avatars' && <EnergyAvatars />}
        </div>
      </div>
    </div>
  );
}

/* Helper Tab Button */
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 18px',
        background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent',
        color: active ? '#60a5fa' : '#9ca3af',
        fontSize: '12px',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s'
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

// ==========================================
// 1. DAILY IMPACT CALCULATOR SUBCOMPONENT
// ==========================================
function DailyImpact({ co2Intensity }) {
  const items = [
    {
      id: 'washing',
      label: '1 Cycle de Lave-linge',
      icon: '🧼',
      consumption: 1.0, // kWh
      desc: 'Consomme environ 1.0 kWh pour un cycle standard à 40°C.'
    },
    {
      id: 'phone',
      label: '100 Charges de Smartphone',
      icon: '📱',
      consumption: 0.015 * 100, // kWh (1 charge = ~0.015 kWh)
      desc: 'Charger complètement un smartphone 100 fois consomme 1.5 kWh.'
    },
    {
      id: 'streaming',
      label: '5 Heures de Vidéo HD (TV)',
      icon: '📺',
      consumption: 0.12 * 5, // kWh (TV connectée + Box = ~120W)
      desc: 'Regarder 5h de streaming sur TV et réseau internet consomme 0.6 kWh.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{
        background: 'rgba(96,165,250,0.06)',
        border: '1px solid rgba(96,165,250,0.12)',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '12px',
        lineHeight: '1.5',
        color: '#d1d5db'
      }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#60a5fa', fontWeight: '600' }}>
          🌱 Traducteur Carbone de vos Appareils
        </h3>
        En ce moment, le mix électrique français émet <b style={{ color: '#60a5fa' }}>{co2Intensity} g CO₂/kWh</b>. 
        Voici le poids carbone direct libéré par des usages du quotidien en fonction de la propreté du réseau à cet instant précis.
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        {items.map(item => {
          const emissions = Math.round(item.consumption * co2Intensity);
          // Scale from 0 to 100g CO2 for visual reference
          const pct = Math.min(100, Math.round((emissions / 150) * 100));
          
          return (
            <div key={item.id} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: '#f3f4f6', fontWeight: '600' }}>{item.label}</h4>
                <p style={{ margin: '0 0 12px', fontSize: '10.5px', color: '#9ca3af', lineHeight: '1.4' }}>{item.desc}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>Consommation</span>
                  <span style={{ fontSize: '12px', color: '#e5e7eb', fontWeight: '600' }}>{item.consumption.toFixed(1)} kWh</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>Équivalent CO₂</span>
                  <span style={{ fontSize: '16px', color: emissions > 80 ? '#f87171' : '#34d399', fontWeight: '700' }}>{emissions} g</span>
                </div>

                {/* Progress bar representing CO2 weight */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: emissions > 80 ? 'linear-gradient(90deg, #f87171, #ef4444)' : 'linear-gradient(90deg, #34d399, #10b981)',
                    borderRadius: '3px',
                    transition: 'width 0.4s'
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carbon Scale Comparison */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '8px',
        fontSize: '10px',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>💡 <b>Rappel d'ordre de grandeur</b> : Brûler 1 L d'essence produit ~2300 g de CO₂. Notre électricité décarbonée française reste extrêmement sobre !</span>
        <span style={{ color: '#34d399' }}>● Énergie propre</span>
      </div>
    </div>
  );
}

// ==========================================
// 2. GRID FREQUENCY BALANCER MINI-GAME
// ==========================================
function GridBalancer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(50.0);
  const [consumption, setConsumption] = useState(55000); // MW
  const [production, setProduction] = useState(55000); // MW
  
  // Power plant generation values
  const [nuclear, setNuclear] = useState(38000);
  const [hydro, setHydro] = useState(12000);
  const [thermal, setThermal] = useState(5000);
  
  const [score, setScore] = useState(100);
  const [ticks, setTicks] = useState(0);
  const [alertMsg, setAlertMsg] = useState('Cliquez sur Démarrer pour équilibrer la grille !');

  // Event list triggered during ticks
  const events = [
    { tick: 3, type: 'conso_rise', val: 3000, text: "📢 Alerte : Retour du travail à 19h. La consommation grimpe de +3000 MW !" },
    { tick: 8, type: 'wind_drop', val: 4000, text: "💨 Alerte : Le vent tombe subitement en mer du Nord. Production éolienne en baisse de -4000 MW !" },
    { tick: 14, type: 'conso_drop', val: 5000, text: "🌙 Alerte : Les usines s'arrêtent pour la nuit. La consommation baisse de -5000 MW !" },
    { tick: 20, type: 'solar_rise', val: 3000, text: "☀️ Alerte : Le brouillard se dissipe, le solaire produit +3000 MW !" }
  ];

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTicks(t => {
        const nextTick = t + 1;
        
        // Apply events
        const ev = events.find(e => e.tick === nextTick);
        if (ev) {
          setAlertMsg(ev.text);
          if (ev.type === 'conso_rise') setConsumption(c => c + ev.val);
          if (ev.type === 'wind_drop') setProduction(p => Math.max(25000, p - ev.val));
          if (ev.type === 'conso_drop') setConsumption(c => Math.max(30000, c - ev.val));
          if (ev.type === 'solar_rise') setProduction(p => p + ev.val);
        } else if (nextTick % 2 === 0) {
          // Add small random drift
          const drift = Math.round((Math.random() - 0.5) * 800);
          setConsumption(c => Math.max(30000, c + drift));
        }

        return nextTick;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Adjust production to match changes in nuclear, hydro, thermal
  useEffect(() => {
    setProduction(nuclear + hydro + thermal);
  }, [nuclear, hydro, thermal]);

  // Calculate frequency based on production vs consumption balance
  useEffect(() => {
    if (!isPlaying) return;

    const diff = production - consumption;
    // Frequency shifts by ~0.0001 Hz per MW of imbalance
    const targetFreq = 50.0 + (diff / 25000);
    const clampFreq = Math.max(48.5, Math.min(51.5, targetFreq));
    setFrequency(parseFloat(clampFreq.toFixed(2)));

    // Score deduction if off 50.0
    const dev = Math.abs(50.0 - clampFreq);
    if (dev > 0.05) {
      setScore(s => Math.max(0, s - Math.round(dev * 12)));
    }
  }, [production, consumption, isPlaying]);

  const handleStart = () => {
    setFrequency(50.0);
    setConsumption(55000);
    setNuclear(38000);
    setHydro(12000);
    setThermal(5000);
    setScore(100);
    setTicks(0);
    setAlertMsg('Le jeu commence ! Maintenez la fréquence autour de 50.00 Hz en augmentant/diminuant vos centrales.');
    setIsPlaying(true);
  };

  const scoreColor = score > 80 ? '#34d399' : score > 50 ? '#fbbf24' : '#f87171';
  const freqColor = Math.abs(50.0 - frequency) < 0.05 ? '#34d399' : Math.abs(50.0 - frequency) < 0.2 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Top dashboard row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
          Objectif : RTE doit réguler le réseau à <b>50 Hz</b>. Ajustez la production pour compenser les chocs météo !
        </div>
        {!isPlaying ? (
          <button onClick={handleStart} style={{
            background: '#60a5fa', color: '#0b0f19', border: 'none', borderRadius: '6px',
            padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '12px'
          }}>🎮 Démarrer le Défi</button>
        ) : (
          <button onClick={() => setIsPlaying(false)} style={{
            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171',
            borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px'
          }}>Arrêter</button>
        )}
      </div>

      {/* Info status boxes */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1.5, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Fréquence Actuelle</span>
          <span style={{ fontSize: '36px', fontWeight: '800', color: freqColor, margin: '4px 0' }}>{frequency.toFixed(2)} Hz</span>
          <span style={{ fontSize: '9px', color: freqColor === '#34d399' ? '#34d399' : '#9ca3af' }}>
            {freqColor === '#34d399' ? '✓ Stable' : freqColor === '#fbbf24' ? '⚠️ Légère déviation' : '🚨 Risque de Blackout !'}
          </span>
        </div>

        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Stabilité Réseau</span>
          <span style={{ fontSize: '36px', fontWeight: '800', color: scoreColor, margin: '4px 0' }}>{score}%</span>
          <span style={{ fontSize: '9px', color: '#6b7280' }}>Score de performance</span>
        </div>
      </div>

      {/* Alert ticker */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '11px',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '14px' }}>📢</span>
        <span>{alertMsg}</span>
      </div>

      {/* Dispatch control deck */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
        {/* Left Side: Demand vs Supply scale bar */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#60a5fa' }}>⚡ Prod : {(production / 1000).toFixed(1)} GW</span>
            <span style={{ color: '#f43f5e' }}>📉 Conso : {(consumption / 1000).toFixed(1)} GW</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: '#6b7280' }}>Visualisation de la Balance :</span>
            <div style={{ width: '100%', height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: '50%', width: '2px',
                background: 'rgba(255,255,255,0.3)',
                zIndex: 2
              }} />
              {/* Balancer indicator sliding left/right */}
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: `${50 + ((production - consumption) / 30000) * 50}%`,
                width: '6px',
                transform: 'translateX(-50%)',
                background: freqColor,
                borderRadius: '2px',
                transition: 'left 0.4s ease, background 0.4s'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#6b7280' }}>
              <span>Trop de prod (Fréquence +)</span>
              <span>Équilibre</span>
              <span>Déficit (Fréquence -)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Actuators controls */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <ActuatorRow
            label="⚛️ Nucléaire (Base stable)"
            val={nuclear}
            limit={[15000, 48000]}
            disabled={!isPlaying}
            onInc={() => setNuclear(n => Math.min(48000, n + 2000))}
            onDec={() => setNuclear(n => Math.max(15000, n - 2000))}
          />
          <ActuatorRow
            label="💧 Hydraulique (Réponse rapide)"
            val={hydro}
            limit={[5000, 18000]}
            disabled={!isPlaying}
            onInc={() => setHydro(h => Math.min(18000, h + 2000))}
            onDec={() => setHydro(h => Math.max(5000, h - 2000))}
          />
          <ActuatorRow
            label="🔥 Thermique (Ajustement de pointe)"
            val={thermal}
            limit={[0, 10000]}
            disabled={!isPlaying}
            onInc={() => setThermal(t => Math.min(10000, t + 1000))}
            onDec={() => setThermal(t => Math.max(0, t - 1000))}
          />
        </div>
      </div>
    </div>
  );
}

/* Helper Control Button Row */
function ActuatorRow({ label, val, limit, disabled, onInc, onDec }) {
  const isMin = val <= limit[0];
  const isMax = val >= limit[1];

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '8px', padding: '6px 12px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '10.5px', color: '#e5e7eb', fontWeight: '500' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '700', marginTop: '2px' }}>{(val / 1000).toFixed(1)} GW</span>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={onDec}
          disabled={disabled || isMin}
          style={{
            background: isMin ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
            color: isMin ? '#4b5563' : '#d1d5db',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
            width: '28px', height: '28px', cursor: disabled || isMin ? 'not-allowed' : 'pointer',
            fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >-</button>
        <button
          onClick={onInc}
          disabled={disabled || isMax}
          style={{
            background: isMax ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
            color: isMax ? '#4b5563' : '#d1d5db',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
            width: '28px', height: '28px', cursor: disabled || isMax ? 'not-allowed' : 'pointer',
            fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >+</button>
      </div>
    </div>
  );
}

// ==========================================
// 3. ELECTRON ODYSSEY (SLIDESHOW DIAPORAMA)
// ==========================================
function ElectronJourney() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "1. La naissance dans l'alternateur",
      desc: "Dans une centrale (nucléaire, éolienne, thermique), un gros aimant tourne très vite à côté de bobines de cuivre. Ce mouvement mécanique pousse et agite les électrons : c'est la création du courant alternatif !",
      icon: "⚡",
      fact: "💡 Fait amusant : Les électrons sur place vibrent à 50 allers-retours par seconde (50 Hz) mais ne se déplacent qu'à quelques millimètres par seconde !"
    },
    {
      title: "2. La rampe d'autoroute (La Haute Tension)",
      desc: "À la sortie de la centrale, un transformateur 'gonfle' la tension électrique à 400 000 Volts. Cela permet de minimiser les pertes par échauffement (effet Joule) le long du voyage. C'est l'équivalent de compresser l'eau pour l'envoyer très loin sans fuite.",
      icon: "🏢",
      fact: "🛣️ Le réseau de transport RTE utilise 100 000 km de lignes électriques aériennes et souterraines à très haute tension."
    },
    {
      title: "3. Le poste d'aiguillage (Le Dispatching)",
      desc: "Avant d'arriver en ville, les postes électriques abaissent la tension à 20 000 Volts (Moyenne Tension) puis à 230 Volts (Basse Tension). Les disjoncteurs et répartiteurs s'assurent que l'électricité circule vers les zones qui en ont besoin.",
      icon: "🛡️",
      fact: "🔄 Tout est géré par des centres de contrôle automatisés et des ingénieurs réseau veillant 24h/24."
    },
    {
      title: "4. L'arrivée à la prise",
      desc: "L'électricité arrive finalement à votre tableau électrique et à votre prise domestique en 230 Volts. Elle alimente instantanément le moteur de votre lave-linge, chauffe la résistance de votre grille-pain ou éclaire votre écran.",
      icon: "🔌",
      fact: "🏠 La consommation totale en France s'adapte en temps réel à chaque micro-seconde de branchement de vos appareils."
    }
  ];

  const curr = steps[step];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '24px', flex: 1, alignItems: 'center' }}>
        {/* Visual symbol */}
        <div style={{
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(96,165,250,0.06)', border: '2px dashed #60a5fa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '48px', flexShrink: 0
        }}>
          {curr.icon}
        </div>

        {/* Narrative info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Étape {step + 1} sur {steps.length}</span>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#f3f4f6', fontWeight: '700' }}>{curr.title}</h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#d1d5db', lineHeight: '1.5' }}>{curr.desc}</p>
          
          <div style={{
            marginTop: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
            borderLeft: '3px solid #10b981', borderRadius: '0 8px 8px 0', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic'
          }}>
            {curr.fact}
          </div>
        </div>
      </div>

      {/* Progress navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)', paddingActive: '12px 0 0', paddingTop: '14px'
      }}>
        {/* Indicators dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: i === step ? '#60a5fa' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.2s'
            }} />
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px', color: step === 0 ? '#4b5563' : '#d1d5db', cursor: step === 0 ? 'not-allowed' : 'pointer',
              fontSize: '11px', transition: 'all 0.15s'
            }}
          >Précédent</button>
          <button
            onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
            disabled={step === steps.length - 1}
            style={{
              padding: '6px 14px', background: step === steps.length - 1 ? 'rgba(255,255,255,0.05)' : '#60a5fa',
              border: step === steps.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderRadius: '6px', color: step === steps.length - 1 ? '#4b5563' : '#0b0f19',
              cursor: step === steps.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '11px', fontWeight: step === steps.length - 1 ? '400' : '600', transition: 'all 0.15s'
            }}
          >Suivant</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. FOOTPRINT & SURFACE AREA COMPARISON
// ==========================================
function FootprintCompare() {
  const data = [
    {
      source: '⚛️ Nucléaire',
      footprint: 1, // relative land use
      concrete: 5000, // tons per TWh
      desc: 'Très forte densité énergétique. Emprise foncière minime, forte consommation de béton lors du gros œuvre initial.'
    },
    {
      source: '🌬️ Éolien terrestre',
      footprint: 150,
      concrete: 60000,
      desc: 'Nécessite d\'espacer les éoliennes terrestres pour éviter les turbulences. Socles en béton massif pour l\'ancrage des mâts.'
    },
    {
      source: '☀️ Solaire au sol',
      footprint: 45,
      concrete: 5000,
      desc: 'Occupation au sol continue. Matériaux principalement constitués d\'acier pour les structures portantes.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
        Comparaison des ressources physiques et de la surface au sol nécessaires pour produire <b>1 TWh d'électricité par an</b> (la consommation moyenne de ~200 000 foyers).
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {data.map(item => {
          // Normalize max scale (150 footprint, 60000 concrete)
          const fPct = Math.round((item.footprint / 150) * 100);
          const cPct = Math.round((item.concrete / 60000) * 100);

          return (
            <div key={item.source} style={{
              background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <h4 style={{ margin: 0, fontSize: '12.5px', color: '#f3f4f6', fontWeight: '600' }}>{item.source}</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Land footprint bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '9px', color: '#9ca3af', width: '90px', flexShrink: 0 }}>Surface requise :</span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${fPct}%`, height: '100%', background: '#fbbf24', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: '#fbbf24', width: '60px', textAlign: 'right', fontWeight: '600' }}>{item.footprint} km²</span>
                </div>

                {/* Concrete footprint bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '9px', color: '#9ca3af', width: '90px', flexShrink: 0 }}>Béton nécessaire :</span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${cPct}%`, height: '100%', background: '#60a5fa', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: '#60a5fa', width: '60px', textAlign: 'right', fontWeight: '600' }}>{item.concrete.toLocaleString()} t</span>
                </div>
              </div>

              <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#6b7280', lineHeight: '1.45' }}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 5. ROAD OPERATORS & REGULATOR AVATARS
// ==========================================
function EnergyAvatars() {
  const [selected, setSelected] = useState(0);

  const avatars = [
    {
      name: "Sarah, 34 ans",
      title: "📡 Dispatcher chez RTE (Régulation)",
      quote: "« Mon obsession, c'est le 50.00 Hertz. Si la France branche trop d'appareils d'un coup, la fréquence baisse et on risque la panne générale. Je passe mes journées à appeler les producteurs pour démarrer les barrages en renfort. »",
      task: "Ajuster la production à la consommation en temps réel et organiser les échanges d'électricité transfrontaliers.",
      challenge: "Gérer l'intermittence du vent et du soleil qui peuvent disparaître en moins de 15 minutes."
    },
    {
      name: "Thomas, 28 ans",
      title: "🌬️ Technicien de Maintenance Éolienne",
      quote: "« Les gens voient les éoliennes tourner de loin, mais ils ne voient pas que chaque turbine est une merveille industrielle. En cas de tempête extrême à plus de 90 km/h, nous bridons ou coupons les machines par sécurité. »",
      task: "Inspecter les pales et assurer le bon fonctionnement de l'électronique de puissance dans la nacelle à 100m de hauteur.",
      challenge: "Travailler par tous les temps et optimiser la durée de vie des roulements soumis à de fortes charges."
    },
    {
      name: "Amine, 42 ans",
      title: "💧 Opérateur de Barrage Hydroélectrique",
      quote: "« L'hydroélectricité est le couteau suisse du réseau. Nos turbines peuvent démarrer de zéro et atteindre leur pleine puissance en moins de 2 minutes. C'est l'arme absolue pour éteindre un début d'incendie électrique. »",
      task: "Surveiller les réserves d'eau dans les lacs de retenue et piloter les vannes pour lâcher l'eau au moment des pics de consommation.",
      challenge: "Préserver la biodiversité aquatique locale tout en maintenant les débits de sécurité exigés."
    }
  ];

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {/* Side list of avatars */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {avatars.map((av, idx) => (
          <button
            key={av.name}
            onClick={() => setSelected(idx)}
            style={{
              padding: '12px 16px',
              background: idx === selected ? 'rgba(96,165,250,0.06)' : 'rgba(255,255,255,0.01)',
              border: idx === selected ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '10px',
              color: idx === selected ? '#60a5fa' : '#d1d5db',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '700' }}>{av.name}</div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>{av.title}</div>
          </button>
        ))}
      </div>

      {/* Selected avatar detail */}
      <div style={{
        flex: 1.8,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: '#f3f4f6', fontWeight: '700' }}>
          {avatars[selected].title}
        </h4>
        
        <p style={{
          margin: 0, fontSize: '11.5px', color: '#d1d5db', lineHeight: '1.5',
          fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px'
        }}>
          {avatars[selected].quote}
        </p>

        <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <div>
            <b style={{ color: '#60a5fa' }}>⚡ Mission principale :</b>
            <div style={{ color: '#9ca3af', marginTop: '2px', lineHeight: '1.4' }}>{avatars[selected].task}</div>
          </div>
          <div>
            <b style={{ color: '#f87171' }}>⚠️ Défi quotidien :</b>
            <div style={{ color: '#9ca3af', marginTop: '2px', lineHeight: '1.4' }}>{avatars[selected].challenge}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
