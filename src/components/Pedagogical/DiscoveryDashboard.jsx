import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  ScaleIcon, TempIcon, WindIcon, ChartIcon, BookIcon, HomeIcon, PlugIcon
} from '../Common/Icons';

import MeritOrderModal from '../Panels/MeritOrderModal';
import EnergyFlowSankey from '../Panels/EnergyFlowSankey';
import { GlossaryModal } from '../Panels/Glossary';
import CitizenHubModal from '../Panels/CitizenHubModal';

const UsersIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BarChartIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

// Presentation Slides
const SLIDES = [
  {
    title: "L'Équilibre Temps Réel",
    icon: ScaleIcon,
    text: "L'électricité ne se stockant pas à grande échelle, la production et la consommation doivent être égales à chaque quart d'heure. Si la production dépasse la consommation, la fréquence monte au-dessus de 50 Hz. Si elle est insuffisante, la fréquence chute, risquant de provoquer un blackout."
  },
  {
    title: "La Thermosensibilité",
    icon: TempIcon,
    text: "En France, le chauffage électrique est très répandu. En hiver, chaque degré perdu sous les normales saisonnières augmente la consommation nationale d'environ 1,5 GW — l'équivalent de la consommation d'une ville comme Paris."
  },
  {
    title: "L'Intermittence Renouvelable",
    icon: WindIcon,
    text: "L'éolien et le solaire dépendent de la météo. De plus, par mesure de sécurité mécanique, les éoliennes s'arrêtent automatiquement si le vent dépasse 90 km/h (phénomène de coupure ou cut-off)."
  },
  {
    title: "La Règle du Merit Order",
    icon: ChartIcon,
    text: "Le prix de l'électricité sur le marché de gros européen est fixé par le coût marginal de la dernière centrale appelée pour satisfaire la demande. Les renouvelables et le nucléaire (coût variable proche de 0) sont appelés en premier, suivis par l'hydroélectricité, puis le gaz et le charbon qui font grimper les prix."
  }
];

export default function DiscoveryDashboard() {
  const { showDiscovery, setShowDiscovery } = useAppContext();
  const [activeTab, setActiveTab] = useState('menu'); // menu, presentation
  const [slideIndex, setSlideIndex] = useState(0);

  const [showMeritOrder, setShowMeritOrder] = useState(false);
  const [showEnergyFlow, setShowEnergyFlow] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showCitizenHub, setShowCitizenHub] = useState(false);
  const [citizenHubTab, setCitizenHubTab] = useState('calculator');

  if (!showDiscovery) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 14, 26, 0.96)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
      color: '#ffffff'
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '800',
            margin: 0,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BookIcon size={20} color="#f59e0b" />
            <span>Espace Découverte Pédagogique</span>
          </h1>
        </div>
        <button
          onClick={() => { setShowDiscovery(false); }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-light)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          ✕
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', padding: '40px', overflow: 'hidden' }}>

        {/* Left Side Navigation Menu */}
        <div style={{
          width: '280px',
          borderRight: '1px solid var(--border-light)',
          paddingRight: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('menu')}
              style={{
                width: '100%',
                background: activeTab === 'menu' ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'rgba(255, 255, 255, 0.02)',
                color: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '12px 18px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <HomeIcon size={16} color="#ffffff" />
              <span>Menu Principal</span>
            </button>

            <button
              onClick={() => { setActiveTab('presentation'); setSlideIndex(0); }}
              style={{
                width: '100%',
                background: activeTab === 'presentation' ? 'linear-gradient(135deg, #10b981, #047857)' : 'rgba(255, 255, 255, 0.02)',
                color: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '12px 18px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <BookIcon size={16} color="#ffffff" />
              <span>Présentation Enseignant</span>
            </button>
          </div>
        </div>

        {/* Right Side Content Display */}
        <div style={{ flex: 1, paddingLeft: '40px', overflowY: 'auto' }}>

          {/* 1. Menu Principal */}
          {activeTab === 'menu' && (
            <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div>
                <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px' }}>Bienvenue dans l'Espace Découverte</h2>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Cet espace interactif est conçu pour les étudiants, enseignants et citoyens désireux de comprendre le fonctionnement
                  complexe du réseau électrique national. Parcourez notre fiche de cours guidée interactive.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '18px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookIcon size={18} color="#34d399" />
                    <span>Présentation Guidée</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Un parcours pédagogique structuré en diapositives illustrées pour comprendre les concepts de base du dispatching : de l'équilibre physique à la fixation des prix de gros.
                  </p>
                  <button
                    onClick={() => setActiveTab('presentation')}
                    style={{
                      background: 'var(--color-export)', border: 'none', borderRadius: '6px',
                      padding: '10px 20px', color: '#ffffff', fontWeight: '600', cursor: 'pointer',
                      alignSelf: 'flex-start', fontSize: '12px'
                    }}
                  >
                    Ouvrir le Cours →
                  </button>
                </div>

                <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '18px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlugIcon size={18} color="#60a5fa" />
                    <span>Outils Interactifs</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                    Accédez aux modules de simulation et d'analyse détaillée pour expérimenter par vous-même.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => setShowMeritOrder(true)}
                      style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      <BarChartIcon color="#fbbf24" /> Simulateur Merit Order
                    </button>
                    <button
                      onClick={() => setShowEnergyFlow(true)}
                      style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      <PlugIcon color="#60a5fa" /> Flux d'Énergie (Sankey)
                    </button>
                    <button
                      onClick={() => setShowGlossary(true)}
                      style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      <BookIcon color="#10b981" /> Lexique Énergétique
                    </button>
                    <button
                      onClick={() => { setShowCitizenHub(true); setCitizenHubTab('balancer'); }}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      ⚖️ Jeu de la Balance (50Hz)
                    </button>
                    <button
                      onClick={() => { setShowCitizenHub(true); setCitizenHubTab('calculator'); }}
                      style={{ background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      <UsersIcon color="#c084fc" /> Espace Citoyen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Présentation Slides */}
          {activeTab === 'presentation' && (
            <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Diapositives de Présentation</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Diapositive {slideIndex + 1} / {SLIDES.length}
                </span>
              </div>

              <div className="glass-panel" style={{
                padding: '40px',
                minHeight: '240px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '1px solid rgba(16,185,129,0.2)'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  color: '#34d399',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {React.createElement(SLIDES[slideIndex].icon, { size: 20, color: '#34d399' })}
                  <span>{SLIDES[slideIndex].title}</span>
                </h3>
                <p style={{ fontSize: '14.5px', lineHeight: '1.7', color: '#f3f4f6', textAlign: 'justify' }}>
                  {SLIDES[slideIndex].text}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  disabled={slideIndex === 0}
                  onClick={() => setSlideIndex(prev => prev - 1)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: slideIndex === 0 ? 0.3 : 1
                  }}
                >
                  ← Précédente
                </button>

                <button
                  disabled={slideIndex === SLIDES.length - 1}
                  onClick={() => setSlideIndex(prev => prev + 1)}
                  style={{
                    background: 'var(--color-export)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: slideIndex === SLIDES.length - 1 ? 0.3 : 1
                  }}
                >
                  Suivante →
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
      <MeritOrderModal isOpen={showMeritOrder} onClose={() => setShowMeritOrder(false)} />
      <EnergyFlowSankey isOpen={showEnergyFlow} onClose={() => setShowEnergyFlow(false)} />
      <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
      <CitizenHubModal isOpen={showCitizenHub} onClose={() => setShowCitizenHub(false)} defaultTab={citizenHubTab} />
    </div>
  );
}
