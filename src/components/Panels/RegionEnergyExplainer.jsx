import React, { useMemo } from 'react';
import { useInstallations } from '../../hooks/useInstallations';
import { REGION_NAMES } from '../../data/regionCenters';
import { useAppContext } from '../../context/AppContext';
import { useEnergyData } from '../../hooks/useEnergyData';
import { 
  PlugIcon, NuclearIcon, WindIcon, SolarIcon, HydroIcon, 
  BatteryIcon, ThermalIcon, BioIcon, PinIcon, ChartIcon, CloseIcon
} from '../Common/Icons';

function FocusIcon({ name, size = 12, style }) {
  switch (name) {
    case 'plug': return <PlugIcon size={size} color="var(--text-accent)" style={style} />;
    case 'nuclear': return <NuclearIcon size={size} color="var(--color-nuclear)" style={style} />;
    case 'wind': return <WindIcon size={size} color="var(--color-wind)" style={style} />;
    case 'solar': return <SolarIcon size={size} color="var(--color-solar)" style={style} />;
    case 'hydro': return <HydroIcon size={size} color="var(--color-hydro)" style={style} />;
    case 'battery': return <BatteryIcon size={size} color="var(--color-hydro)" style={style} />;
    case 'thermal': return <ThermalIcon size={size} color="var(--color-thermal)" style={style} />;
    case 'bio': return <BioIcon size={size} color="var(--color-bio)" style={style} />;
    default: return null;
  }
}

const SCIENTIFIC_EXPLANATIONS = {
  '11': {
    icons: ['plug'],
    focus: 'Hyper-consommatrice & Dépendante',
    text: "Avec près de 20% de la population française concentrée sur son territoire, l'Île-de-France est un gouffre énergétique. Elle produit moins de 10% de sa consommation. Ses rares unités sont des centres de valorisation des déchets (bioénergies) et de la petite cogénération au gaz. Elle dépend entièrement des lignes THT des régions voisines (Normandie, Centre, Grand Est) pour s'alimenter."
  },
  '24': {
    icons: ['nuclear'],
    focus: 'Bastion Nucléaire Fluvial',
    text: "La région Centre-Val de Loire tire profit du débit de la Loire pour le refroidissement de ses quatre centrales nucléaires majeures (Belleville, Dampierre, Saint-Laurent et Chinon). Elle exporte une grande partie de sa production vers l'Île-de-France voisine. Le solaire et l'éolien s'y développent modérément sur les plaines de la Beauce."
  },
  '27': {
    icons: ['bio'],
    focus: 'Transition Éolienne & Biomasse',
    text: "La Bourgogne-Franche-Comté possède un profil équilibré de transition. Dépourvue de nucléaire, elle mise sur un fort développement de l'éolien sur les plateaux de l'Yonne et de la Côte-d'Or, couplé à une exploitation historique du bois-énergie (biomasse) dans ses grands massifs forestiers et de la petite hydraulique dans le Jura."
  },
  '28': {
    icons: ['wind', 'nuclear'],
    focus: 'Façade Maritime & Nucléaire',
    text: "La Normandie est un pilier de la production nationale. Elle combine d'immenses centrales nucléaires côtières (Paluel, Penly et Flamanville) refroidies par la Manche, et un gisement éolien exceptionnel, maintenant enrichi par les premiers grands parcs éoliens offshore français (Fécamp, Courseulles-sur-Mer)."
  },
  '32': {
    icons: ['wind'],
    focus: 'Champion Éolien Terrestre',
    text: "Les Hauts-de-France sont la première région éolienne de France. Ses vastes plaines agricoles dégagées et ventées, combinées aux vents réguliers issus de la Manche et de la mer du Nord, offrent des conditions parfaites pour l'éolien terrestre. Elle dispose également d'une grande centrale nucléaire à Gravelines, la plus grande d'Europe de l'Ouest."
  },
  '44': {
    icons: ['nuclear', 'wind'],
    focus: 'Carrefour Énergétique Européen',
    text: "Le Grand Est est un géant industriel et énergétique. Il dispose de deux centrales nucléaires majeures (Cattenom, Chooz) à proximité des frontières, refroidies par la Meuse et le Rhin. C'est également la deuxième région éolienne de France grâce aux vents constants des plaines de Champagne, et elle est fortement interconnectée avec l'Allemagne."
  },
  '52': {
    icons: ['hydro'],
    focus: 'Éolien Offshore & Sécurité Réseau',
    text: "Les Pays de la Loire développent rapidement leur mix renouvelable, notamment via le premier parc éolien en mer de France (Saint-Nazaire). La région abrite aussi la centrale thermique à charbon de Cordemais, préservée temporairement par RTE pour assurer la sécurité d'approvisionnement électrique de la péninsule bretonne."
  },
  '53': {
    icons: ['battery'],
    focus: 'Péninsule Électrique & Éolienne',
    text: "La Bretagne a une situation géographique singulière en 'bout de réseau'. N'ayant aucune centrale nucléaire pour des raisons historiques et écologiques, elle a longtemps importé 90% de son courant. Elle réduit aujourd'hui sa dépendance grâce à un développement massif de l'éolien terrestre et offshore (Saint-Brieuc) et l'usine marémotrice de la Rance."
  },
  '75': {
    icons: ['solar', 'nuclear'],
    focus: 'Landes Solaires & Estuaire',
    text: "La Nouvelle-Aquitaine brille par sa filière solaire. Le département des Landes, fort d'une grande exposition et de terrains dégagés (anciennes tempêtes forestières), accueille les plus grands parcs photovoltaïques d'Europe (ex: Cestas). Au nord, la centrale nucléaire du Blayais, située sur la Gironde, équilibre le réseau régional."
  },
  '76': {
    icons: ['solar', 'hydro'],
    focus: 'Solaire Méditerranéen & Hydro Pyrénées',
    text: "L'Occitanie bénéficie d'atouts géographiques exceptionnels. Deuxième région solaire de France grâce à son ensoleillement méridional, elle exploite aussi le relief des Pyrénées et du Massif Central via de puissantes installations hydroélectriques. Elle possède également une centrale nucléaire majeure à Golfech."
  },
  '84': {
    icons: ['hydro'],
    focus: 'Géant de l\'Hydraulique Alpin',
    text: "Auvergne-Rhône-Alpes est la première région hydroélectrique d'Europe. Ses reliefs alpins et du Massif Central accueillent de gigantesques barrages de haute chute (Tignes, Roselend) et des stations de transfert d'énergie par pompage (STEP Grand'Maison). Elle exploite aussi un parc nucléaire massif le long du Rhône pour sécuriser les métropoles."
  },
  '93': {
    icons: ['solar', 'hydro'],
    focus: 'Solaire Azuréen & Hydro Durance',
    text: "PACA dispose d'un ensoleillement record (> 2800 heures/an), favorisant un très fort taux de panneaux photovoltaïques. Sa production hydroélectrique est également majeure, structurée autour de l'aménagement de la Durance et du Verdon (barrages de Serre-Ponçon). La région n'a aucun réacteur nucléaire de production."
  },
  '94': {
    icons: ['thermal'],
    focus: 'Isolement Insulaire Thermique',
    text: "La Corse n'est pas connectée au réseau électrique continental français (liaison limitée avec l'Italie). Pour garantir sa stabilité réseau constante, elle dépend historiquement de centrales thermiques fioul/gaz (Lucciana, Vazzio), complétées de manière croissante par l'hydroélectricité de montagne et le solaire photovoltaïque."
  }
};

export default function RegionEnergyExplainer({ regionCode, onClose }) {
  const { setDetailedItem, mode } = useAppContext();
  const { regional } = useEnergyData();
  const { data: installations, isLoading } = useInstallations();

  const data = regional?.[regionCode];
  const regionName = REGION_NAMES[regionCode] || 'Région';
  const explanation = SCIENTIFIC_EXPLANATIONS[regionCode] || { focus: 'Transition énergétique', text: 'Données explicatives en cours de chargement.', icons: [] };

  // Filter and compute capacity from API
  const stats = useMemo(() => {
    if (!installations || installations.length === 0) return [];

    // Filter by region code
    const filtered = installations.filter(inst => {
      const apiCode = String(inst.coderegion || inst.code_region);
      return apiCode === String(regionCode);
    });

    const mapping = {
      'Nucléaire': { label: 'Nucléaire', icon: NuclearIcon, color: 'var(--color-nuclear)' },
      'Eolien': { label: 'Éolien', icon: WindIcon, color: 'var(--color-wind)' },
      'Solaire': { label: 'Solaire', icon: SolarIcon, color: 'var(--color-solar)' },
      'Hydraulique': { label: 'Hydraulique', icon: HydroIcon, color: 'var(--color-hydro)' },
      'Thermique fossile': { label: 'Thermique Fossile', icon: ThermalIcon, color: 'var(--color-thermal)' },
      'Bioénergies': { label: 'Bioénergies', icon: BioIcon, color: 'var(--color-bio)' }
    };

    return filtered.map(item => {
      const info = mapping[item.filiere] || { label: item.filiere, icon: null, color: 'var(--text-secondary)' };
      return {
        filiere: item.filiere,
        label: info.label,
        icon: info.icon,
        color: info.color,
        capacity: Math.round(item.puissance_totale || item.sum_puismaxinstallee || 0),
        count: item.nb_installations || item.count || 0
      };
    }).sort((a, b) => b.capacity - a.capacity); // Sort by capacity descending
  }, [installations, regionCode]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-accent)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <PinIcon size={12} color="var(--text-accent)" />
          <span>Focus : {regionName}</span>
        </h4>
        <button 
          onClick={onClose}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer',
            fontSize: '14px',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          title="Fermer le focus régional"
        >
          <CloseIcon size={12} color="currentColor" />
        </button>
      </div>

      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f9fafb', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {explanation.icons && explanation.icons.map((ic, i) => (
          <FocusIcon key={i} name={ic} size={13} />
        ))}
        <span>{explanation.focus}</span>
      </div>

      <p style={{ fontSize: '10px', color: '#d1d5db', lineHeight: '1.4', marginBottom: '8px', textAlign: 'justify', background: 'rgba(0,0,0,0.1)', padding: '6px', borderRadius: '4px' }}>
        {explanation.text}
      </p>

      <div>
        <h5 style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ChartIcon size={11} color="var(--text-secondary)" />
          <span>Capacités de Production (RTE)</span>
        </h5>
        
        {isLoading ? (
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', padding: '4px 0' }}>
            Chargement des données de capacité RTE...
          </div>
        ) : stats.length === 0 ? (
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', padding: '4px 0', fontStyle: 'italic' }}>
            Aucune capacité majeure répertoriée.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {stats.map((s, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '10px', 
                alignItems: 'center',
                padding: '2px 4px',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <span style={{ color: '#f9fafb', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {s.icon ? <s.icon size={11} color={s.color} /> : <span style={{ color: s.color }}>●</span>}
                  <span>{s.label}</span>
                </span>
                <span style={{ fontSize: '9px' }}>
                  <b>{s.capacity.toLocaleString('fr-FR')} MW</b> 
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    ({s.count} {s.count > 1 ? 'installations' : 'installation'})
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && (
        <div style={{ 
          marginTop: '12px', 
          display: 'flex', 
          justifyContent: 'center' 
        }}>
          <button
            onClick={() => setDetailedItem({
              type: 'region',
              id: regionCode,
              name: regionName,
              data: data,
              extra: { simulated: mode === 'simulation' }
            })}
            style={{
              width: '100%',
              background: 'rgba(96, 165, 250, 0.1)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '6px',
              color: '#60a5fa',
              padding: '6px 0',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'}
          >
            + de détails (Audit sources & calculs)
          </button>
        </div>
      )}
    </div>
  );
}
