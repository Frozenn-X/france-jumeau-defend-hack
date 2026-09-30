import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NuclearIcon, WindIcon, SolarIcon, HydroIcon, ThermalIcon, BioIcon } from '../Common/Icons';

const FILIERE_DETAILS = {
  nucleaire: { label: 'Nucléaire', icon: NuclearIcon, color: 'var(--color-nuclear)', capacityKey: 'parc_nucleaire' },
  eolien: { label: 'Éolien', icon: WindIcon, color: 'var(--color-wind)', capacityKey: 'parc_eolien' },
  solaire: { label: 'Solaire', icon: SolarIcon, color: 'var(--color-solar)', capacityKey: 'parc_solaire' },
  hydraulique_lacs: { label: 'Hydro (Lacs / Réservoirs)', icon: HydroIcon, color: '#3b82f6', capacityKey: 'parc_hydraulique_lacs' },
  hydraulique_fil_eau_eclusee: { label: "Hydro (Fil de l'eau)", icon: HydroIcon, color: '#60a5fa', capacityKey: 'parc_hydraulique_fil_eau' },
  hydraulique_step_turbinage: { label: 'Hydro (STEP Turbinage)', icon: HydroIcon, color: '#93c5fd', capacityKey: 'parc_hydraulique_step' },
  thermique: { label: 'Thermique', icon: ThermalIcon, color: 'var(--color-thermal)', capacityKey: 'parc_thermique_fossile' },
  bioenergies: { label: 'Bioénergies', icon: BioIcon, color: 'var(--color-bio)', capacityKey: 'parc_bioenergie' }
};

const parseCapacityValue = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

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

export default function CapacityPanel({ nationalData }) {
  const { data: capacityRecords, isLoading } = useQuery({
    queryKey: ['energy', 'capacity'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/energy/capacity');
        if (!res.ok) throw new Error('Failed to fetch production capacities');
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
          localStorage.setItem('fallback_capacity_data', JSON.stringify(data.results));
          return data.results;
        }
        throw new Error('Empty capacity data');
      } catch (e) {
        const cached = localStorage.getItem('fallback_capacity_data');
        if (cached) {
          return JSON.parse(cached);
        }
        throw e;
      }
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  const latestCapacity = useMemo(() => {
    if (!capacityRecords || capacityRecords.length === 0) return null;
    return capacityRecords[0];
  }, [capacityRecords]);

  // Retrieve last known good data from localStorage if nationalData prop is empty/loading
  const fallbackNationalData = useMemo(() => {
    try {
      const cached = localStorage.getItem('fallback_national_data');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const activeNationalData = useMemo(() => {
    if (nationalData && nationalData.length > 0) return nationalData;
    return fallbackNationalData;
  }, [nationalData, fallbackNationalData]);

  const isFallbackUsed = !nationalData || nationalData.length === 0;

  const stats = useMemo(() => {
    if (activeNationalData.length === 0 || !latestCapacity) return [];

    const latest = activeNationalData[0];
    
    // Group real-time production to match our capacities
    const realTimeProd = {
      nucleaire: latest.nucleaire || 0,
      eolien: latest.eolien || 0,
      solaire: latest.solaire || 0,
      hydraulique_lacs: latest.hydraulique_lacs || 0,
      hydraulique_fil_eau_eclusee: latest.hydraulique_fil_eau_eclusee || 0,
      hydraulique_step_turbinage: latest.hydraulique_step_turbinage || 0,
      thermique: (latest.gaz || 0) + (latest.fioul || 0) + (latest.charbon || 0),
      bioenergies: latest.bioenergies || 0
    };

    return Object.entries(FILIERE_DETAILS).map(([key, details]) => {
      let installed = 0;
      if (key === 'hydraulique_lacs') {
        installed = 8200;
      } else if (key === 'hydraulique_fil_eau_eclusee') {
        installed = 12500;
      } else if (key === 'hydraulique_step_turbinage') {
        installed = 5000;
      } else {
        installed = parseCapacityValue(latestCapacity[details.capacityKey]);
      }
      const current = realTimeProd[key];
      // Load factor (%) = (current / installed) * 100
      const loadFactor = installed > 0 ? Math.round((current / installed) * 100) : 0;

      return {
        key,
        label: details.label,
        icon: details.icon,
        color: details.color,
        installed,
        current,
        loadFactor
      };
    });

  }, [activeNationalData, latestCapacity]);

  // Check if we are still waiting for data (both live and fallback cache are empty)
  const isWaitingData = activeNationalData.length === 0 || !latestCapacity;

  if (isLoading && isWaitingData) {
    return <div style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '10px' }}>Chargement des capacités...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <h3 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Capacités & Taux de Charge</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
          Données : {activeNationalData[0] ? getUpdateDateText(activeNationalData[0]) : 'En attente...'} {isFallbackUsed && activeNationalData[0] && "(Sauvegardé)"}
        </span>
      </h3>

      {isWaitingData ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '11px', fontStyle: 'italic' }}>
          Aucune donnée disponible.
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {stats.map((item) => {
            const fillPercent = Math.min(100, item.installed > 0 ? (item.current / item.installed) * 100 : 0);

            return (
              <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {React.createElement(item.icon, { size: 12, color: item.color })}
                    <span>{item.label}</span>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <b style={{ color: 'var(--text-primary)' }}>{Math.round(item.current).toLocaleString('fr-FR')}</b> / {Math.round(item.installed).toLocaleString('fr-FR')} MW
                  </span>
                </div>

                {/* Progress bar and charge factor badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    flex: 1,
                    height: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${fillPercent}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '3px',
                      boxShadow: `0 0 6px ${item.color}`,
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>

                  <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: item.color,
                    background: `rgba(${item.key === 'nucleaire' ? '129,140,248' : item.key === 'eolien' ? '34,211,238' : item.key === 'solaire' ? '251,191,36' : item.key.startsWith('hydraulique') ? '59,130,246' : item.key === 'thermique' ? '239,68,68' : '52,211,153'}, 0.1)`,
                    border: `1px solid ${item.color}`,
                    borderRadius: '4px',
                    padding: '1px 4px',
                    width: '36px',
                    textAlign: 'center'
                  }}>
                    {item.loadFactor}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
