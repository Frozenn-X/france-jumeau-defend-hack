import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { LightningIcon, PlugIcon, BioIcon, CarbonIcon, WorldIcon } from '../Common/Icons';

export default function KPIBar({ nationalData, carbonData }) {
  const { mode } = useAppContext();

  if (!nationalData || nationalData.length === 0) return null;

  const latest = nationalData[0];
  
  // Production (sum of all sources)
  const production = (latest.nucleaire || 0) + (latest.eolien || 0) + (latest.solaire || 0) + 
                     (latest.hydraulique || 0) + (latest.gaz || 0) + (latest.fioul || 0) + 
                     (latest.charbon || 0) + (latest.bioenergies || 0);

  const consommation = latest.consommation || 0;
  const echanges = latest.ech_physiques || 0;

  // Compute Part ENR
  const enrProd = (latest.eolien || 0) + (latest.solaire || 0) + (latest.hydraulique || 0) + (latest.bioenergies || 0);
  
  // Use simulated values in simulation mode, fallback to API carbonData in other modes
  const isSimulation = mode === 'simulation';
  
  const enrPct = isSimulation 
    ? Math.round((enrProd / Math.max(production, 1)) * 100)
    : (carbonData?.part_enr_conso || Math.round((enrProd / Math.max(production, 1)) * 100));

  const co2 = isSimulation
    ? (latest.taux_co2 || 30)
    : (carbonData?.intensite_emissions_conso || latest.taux_co2 || 30);

  return (
    <div className="glass-panel" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '8px 16px', 
      borderRadius: '8px',
      gap: '12px',
      alignItems: 'center',
      border: '1px solid var(--border-light)'
    }}>
      <div className="kpi kpi-first" data-tooltip="Puissance totale générée par toutes les sources nationales (nucléaire, renouvelables, thermique)" style={{ cursor: 'help', flex: 1, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <LightningIcon size={12} color="var(--text-secondary)" />
          <span>Production</span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {production.toLocaleString('fr-FR')} MW
        </div>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }} />

      <div className="kpi" data-tooltip="Demande d'électricité en temps réel sur l'ensemble du territoire français" style={{ cursor: 'help', flex: 1, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <PlugIcon size={12} color="var(--text-secondary)" />
          <span>Consommation</span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {consommation.toLocaleString('fr-FR')} MW
        </div>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }} />

      <div className="kpi" data-tooltip="Échanges physiques nets aux frontières. Un export net (vert) signifie que la France vend de l'énergie. Un import net (rouge) signifie qu'elle achète." style={{ cursor: 'help', flex: 1, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <WorldIcon size={12} color="var(--text-secondary)" />
          <span>{echanges < 0 ? 'Export Net' : 'Import Net'}</span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: echanges < 0 ? 'var(--color-export)' : 'var(--color-import)' }}>
          {Math.abs(echanges).toLocaleString('fr-FR')} MW
        </div>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }} />

      <div className="kpi" data-tooltip="Pourcentage de la production nationale issue des énergies renouvelables (éolien, solaire, hydraulique, bioénergies)" style={{ cursor: 'help', flex: 1, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <BioIcon size={12} color="var(--text-secondary)" />
          <span>Part ENR</span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-bio)' }}>
          {enrPct ? `${enrPct}%` : '0%'}
        </div>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }} />

      <div className="kpi kpi-last" data-tooltip="Intensité carbone moyenne de l'électricité consommée (gCO₂ par kWh). Dépend du mix de production (faible pour le nucléaire et les ENR, élevé pour le charbon et le gaz)." style={{ cursor: 'help', flex: 1, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <CarbonIcon size={12} color="var(--text-secondary)" />
          <span>Intensité CO₂</span>
        </div>
        <div style={{ 
          fontSize: '15px', 
          fontWeight: 'bold', 
          color: co2 < 50 ? 'var(--color-success)' : co2 < 90 ? 'var(--color-warning)' : 'var(--color-danger)' 
        }}>
          {co2} g/kWh
        </div>
      </div>
    </div>
  );
}
