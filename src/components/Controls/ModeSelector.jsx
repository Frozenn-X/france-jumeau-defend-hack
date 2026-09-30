import React from 'react';
import { useAppContext } from '../../context/AppContext';

// Custom SVG Icons
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

export default function ModeSelector() {
  const { mode, setMode } = useAppContext();

  const modes = [
    { id: 'pedagogical', label: 'Pédagogique', icon: BookOpen, desc: 'Phrases simples, mix résumé' },
    { id: 'expert', label: 'Expert', icon: Activity, desc: 'Données complètes, postes RTE, centrales' },
    { id: 'simulation', label: 'Simulation', icon: Sliders, desc: 'Sliders d\'impact climatique' }
  ];

  return (
    <div style={{
      display: 'flex',
      background: 'rgba(10, 14, 26, 0.6)',
      border: '1px solid var(--border-light)',
      borderRadius: '24px',
      padding: '4px',
      gap: '4px'
    }}>
      {modes.map((m) => {
        const isActive = mode === m.id;
        const IconComponent = m.icon;
        const color = isActive ? '#ffffff' : 'var(--text-secondary)';

        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            title={m.desc}
            style={{
              background: isActive ? 'linear-gradient(135deg, var(--color-hydro), #1d4ed8)' : 'transparent',
              color: color,
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <IconComponent color={isActive ? '#ffffff' : 'var(--text-secondary)'} />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
