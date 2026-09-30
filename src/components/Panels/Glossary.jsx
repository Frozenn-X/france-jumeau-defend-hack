import React from 'react';
import { 
  ChartIcon, BatteryIcon, ScaleIcon, ScissorsIcon, AlertIcon, 
  CarbonIcon, PlugIcon, TempIcon, EuroIcon, LightningIcon, 
  ThermalIcon, BookIcon, CloseIcon 
} from '../Common/Icons';

/**
 * GLOSSARY — Dictionnaire interactif des termes du réseau électrique
 * 
 * Chaque terme est associé à une définition courte et accessible.
 * Utilisé dans GlossaryTerm pour le survol et dans la modale pour la consultation.
 */
export const GLOSSARY = {
  'merit order': {
    term: 'Merit Order',
    icon: ChartIcon,
    definition: "Système de classement des centrales électriques par coût de production croissant. On allume d'abord les moins chères (solaire, éolien) puis les plus chères (gaz, charbon). La dernière centrale allumée fixe le prix pour tout le monde.",
    category: 'marché'
  },
  'step': {
    term: 'STEP',
    icon: BatteryIcon,
    definition: "Station de Transfert d'Énergie par Pompage. Quand il y a trop d'électricité, on pompe de l'eau vers un lac en altitude. Quand on en manque, on la relâche pour produire. C'est la plus grosse « batterie » de France.",
    category: 'stockage'
  },
  'facteur de charge': {
    term: 'Facteur de charge',
    icon: ScaleIcon,
    definition: "Pourcentage de la puissance maximale réellement utilisé par une centrale. Ex : une éolienne de 3 MW qui produit 750 kW en moyenne a un facteur de charge de 25%. Le nucléaire tourne souvent à 75%, le solaire à 15%.",
    category: 'technique'
  },
  'bridage': {
    term: 'Bridage (Écrêtage)',
    icon: ScissorsIcon,
    definition: "Quand il y a trop d'énergie renouvelable et que personne n'en veut (ni stockage, ni export), on est obligé de couper volontairement des éoliennes ou des panneaux solaires. C'est de l'énergie perdue.",
    category: 'réseau'
  },
  'délestage': {
    term: 'Délestage',
    icon: AlertIcon,
    definition: "Coupure de courant organisée dans certains quartiers quand la demande dépasse la production disponible. C'est la solution de dernier recours pour éviter un blackout général de tout le réseau.",
    category: 'réseau'
  },
  'intensité carbone': {
    term: 'Intensité carbone',
    icon: CarbonIcon,
    definition: "Quantité de CO₂ émise pour produire 1 kWh d'électricité (en grammes). En France : ~30g grâce au nucléaire. En Allemagne : ~350g à cause du charbon. En Pologne : ~700g.",
    category: 'environnement'
  },
  'interconnexion': {
    term: 'Interconnexion',
    icon: PlugIcon,
    definition: "Câble électrique géant reliant deux pays. La France en a avec 6 voisins. Ils permettent d'acheter de l'électricité moins chère à l'étranger ou de vendre nos surplus. Capacité totale : ~17 GW.",
    category: 'réseau'
  },
  'thermosensibilité': {
    term: 'Thermosensibilité',
    icon: TempIcon,
    definition: "La consommation d'électricité française augmente de ~1 500 MW pour chaque degré en dessous de la normale (15°C). C'est parce que beaucoup de Français se chauffent à l'électricité.",
    category: 'consommation'
  },
  'ecowatt': {
    term: 'Ecowatt',
    icon: AlertIcon,
    definition: "Signal de RTE indiquant la tension sur le réseau : Vert (tout va bien), Orange (réseau tendu, réduisez votre conso), Rouge (risque de coupure, éco-gestes urgents demandés).",
    category: 'réseau'
  },
  'prix spot': {
    term: 'Prix Spot',
    icon: EuroIcon,
    definition: "Prix de l'électricité sur le marché de gros européen (EPEX Spot), fixé heure par heure. Il peut passer de 20€/MWh (surplus éolien) à 500€/MWh (pénurie en hiver) en quelques heures.",
    category: 'marché'
  },
  'puissance installée': {
    term: 'Puissance installée',
    icon: LightningIcon,
    definition: "Capacité maximale théorique d'une centrale ou d'un parc. Ex : la France a ~61 GW de nucléaire installé, mais ils ne tournent pas tous en même temps (maintenance, rechargement).",
    category: 'technique'
  },
  'réseau synchrone': {
    term: 'Réseau synchrone',
    icon: LightningIcon,
    definition: "Tout le réseau électrique européen continental vibre exactement à 50 Hz. Si la production baisse, la fréquence descend. En dessous de 49 Hz → coupures automatiques pour protéger les machines.",
    category: 'technique'
  },
  'thermique': {
    term: 'Thermique Fossile',
    icon: ThermalIcon,
    definition: "Production d'électricité à partir de combustibles fossiles (charbon, fioul). Ces énergies sont fortement émettrices de CO₂ et sont principalement utilisées en appoint en France lors des pics de consommation hivernaux.",
    category: 'technique'
  },
  'thermique fossile': {
    term: 'Thermique Fossile',
    icon: ThermalIcon,
    definition: "Production d'électricité à partir de combustibles fossiles (charbon, fioul). Ces énergies sont fortement émettrices de CO₂ et sont principalement utilisées en appoint en France lors des pics de consommation hivernaux.",
    category: 'technique'
  }
};

const CATEGORY_COLORS = {
  marché: '#fbbf24',
  stockage: '#3b82f6',
  technique: '#818cf8',
  réseau: '#f43f5e',
  environnement: '#10b981',
  consommation: '#f97316'
};

/**
 * GlossaryTerm — Composant inline qui souligne un terme et affiche sa définition au survol
 */
export function GlossaryTerm({ term, children }) {
  const entry = GLOSSARY[term.toLowerCase()];
  if (!entry) return <span>{children || term}</span>;

  return (
    <span
      style={{
        borderBottom: '1px dotted rgba(96, 165, 250, 0.5)',
        cursor: 'help',
        position: 'relative',
        display: 'inline'
      }}
      title={`${entry.term} : ${entry.definition}`}
    >
      {children || entry.term}
    </span>
  );
}

/**
 * GlossaryModal — Panneau lexique centralisé dans une modale
 */
export function GlossaryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const entries = Object.values(GLOSSARY);
  const categories = [...new Set(entries.map(e => e.category))];

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
          width: '640px',
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
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f9fafb', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookIcon size={14} color="var(--text-accent)" />
              <span>Lexique de l'Énergie — Termes clés</span>
            </h2>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>
              {entries.length} définitions simples pour décoder le réseau électrique
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af', borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <CloseIcon size={14} color="currentColor" />
          </button>
        </div>

        {/* Category legend */}
        <div style={{ padding: '10px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <span key={cat} style={{
              fontSize: '9px', fontWeight: '600', textTransform: 'uppercase',
              letterSpacing: '0.05em', padding: '3px 8px', borderRadius: '10px',
              background: `${CATEGORY_COLORS[cat]}15`, color: CATEGORY_COLORS[cat],
              border: `1px solid ${CATEGORY_COLORS[cat]}30`
            }}>
              {cat}
            </span>
          ))}
        </div>

        {/* Entries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entries.map((entry, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {entry.icon && React.createElement(entry.icon, { size: 14, color: CATEGORY_COLORS[entry.category] })}
                  <span>{entry.term}</span>
                </span>
                <span style={{
                  fontSize: '8px', fontWeight: '600', textTransform: 'uppercase',
                  letterSpacing: '0.05em', padding: '2px 6px', borderRadius: '8px',
                  background: `${CATEGORY_COLORS[entry.category]}15`,
                  color: CATEGORY_COLORS[entry.category],
                  border: `1px solid ${CATEGORY_COLORS[entry.category]}30`
                }}>
                  {entry.category}
                </span>
              </div>
              <p style={{
                fontSize: '11px', color: '#d1d5db', lineHeight: '1.5',
                margin: 0, textAlign: 'justify'
              }}>
                {entry.definition}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', fontSize: '9px', color: '#6b7280',
          fontStyle: 'italic', textAlign: 'center', lineHeight: '1.4',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px'
        }}>
          <LightningIcon size={12} color="var(--text-accent)" />
          <span>Sur le tableau de bord, les termes soulignés en pointillé affichent leur définition au survol.</span>
        </div>
      </div>
    </div>
  );
}
