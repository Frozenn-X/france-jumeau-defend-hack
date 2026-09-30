import React, { useState, useEffect, useMemo } from 'react';
import { useEnergyData } from '../../hooks/useEnergyData';
import { useCarbonData } from '../../hooks/useCarbonData';
import { REGION_NAMES } from '../../data/regionCenters';
import { LightningIcon, EuroIcon, PlugIcon, WorldIcon, CarbonIcon, PinIcon } from '../Common/Icons';

function SlideIcon({ name, size = 18 }) {
  switch (name) {
    case 'lightning': return <LightningIcon size={size} color="var(--color-export)" />;
    case 'euro': return <EuroIcon size={size} color="var(--color-solar)" />;
    case 'plug': return <PlugIcon size={size} color="var(--color-import)" />;
    case 'world': return <WorldIcon size={size} color="#60a5fa" />;
    case 'carbon': return <CarbonIcon size={size} color="var(--color-success)" />;
    case 'pin': return <PinIcon size={size} color="var(--text-accent)" />;
    default: return null;
  }
}

export default function EducationalOverlay() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { national, regional } = useEnergyData();
  const { data: carbon } = useCarbonData();

  const latest = useMemo(() => {
    if (!national || national.length === 0) return null;
    return national[0]; // latest record
  }, [national]);

  // Dynamically build slide data from live API states
  const slides = useMemo(() => {
    const prod = latest
      ? (latest.nucleaire || 0) + (latest.eolien || 0) + (latest.solaire || 0) + 
        (latest.hydraulique || 0) + (latest.gaz || 0) + (latest.fioul || 0) + 
        (latest.charbon || 0) + (latest.bioenergies || 0)
      : 0;
    
    const hasRealData = latest && (latest.consommation || 0) > 0 && prod > 0;

    const nucPct = hasRealData ? Math.round((latest.nucleaire || 0) / prod * 100) : 0;
    const renProd = latest ? (latest.eolien || 0) + (latest.solaire || 0) + (latest.hydraulique || 0) + (latest.bioenergies || 0) : 0;
    const renPct = hasRealData ? Math.round(renProd / prod * 100) : 0;
    const fossilProd = latest ? (latest.gaz || 0) + (latest.fioul || 0) + (latest.charbon || 0) : 0;

    // Find largest interconnector exchange in absolute values
    const exchanges = latest ? [
      { name: 'Royaume-Uni', val: latest.ech_comm_angleterre || 0, code: 'GB' },
      { name: 'Espagne', val: latest.ech_comm_espagne || 0, code: 'ES' },
      { name: 'Italie', val: latest.ech_comm_italie || 0, code: 'IT' },
      { name: 'Suisse', val: latest.ech_comm_suisse || 0, code: 'CH' },
      { name: 'Allemagne/Belgique', val: latest.ech_comm_allemagne_belgique || 0, code: 'DE/BE' }
    ] : [];
    
    const largestExchange = exchanges.length > 0
      ? exchanges.reduce((max, curr) => Math.abs(curr.val) > Math.abs(max.val) ? curr : max, exchanges[0])
      : { name: 'Réseau Européen', val: 0 };
      
    const exDirection = largestExchange.val < 0 ? 'export' : 'import';
    const exValueGW = (Math.abs(largestExchange.val) / 1000).toFixed(1);

    // Live CO2 intensity
    const co2 = carbon?.intensite_emissions_conso || (latest ? latest.taux_co2 : 0) || 0;
    const deComparison = co2 > 0 ? Math.max(1, Math.round(350 / co2)) : 10;

    // Scan regional leaders
    let maxWindRegion = 'Hauts-de-France';
    let maxWindVal = 0;
    let maxSolarRegion = 'Occitanie';
    let maxSolarVal = 0;

    const hasRegionalData = regional && Object.keys(regional).length > 0;
    if (hasRegionalData) {
      Object.entries(regional).forEach(([code, r]) => {
        if ((r.eolien || 0) > maxWindVal) {
          maxWindVal = r.eolien;
          maxWindRegion = REGION_NAMES[code] || maxWindRegion;
        }
        if ((r.solaire || 0) > maxSolarVal) {
          maxSolarVal = r.solaire;
          maxSolarRegion = REGION_NAMES[code] || maxSolarRegion;
        }
      });
    }

    return [
      {
        icon: 'lightning',
        title: "Comment l'électricité est-elle produite ?",
        content: [
          hasRealData
            ? `Actuellement, la France produit ${(prod / 1000).toFixed(1)} GW. Le nucléaire fournit la majeure partie du mix avec ${nucPct}% (${(latest.nucleaire / 1000).toFixed(1)} GW), tandis que les énergies renouvelables couvrent ${renPct}% de la production.`
            : "La France produit son électricité grâce à un mix diversifié. Le nucléaire fournit l'énergie de base stable (environ 70% en moyenne), complété par les énergies renouvelables (hydraulique, éolien, solaire) et le thermique de pointe.",
          "Méthodologie : La part renouvelable comprend l'éolien, le solaire, l'hydraulique et la biomasse. L'électricité ne pouvant pas être stockée à grande échelle, la production doit être adaptée à la consommation en temps réel à chaque seconde."
        ]
      },
      {
        icon: 'euro',
        title: "Pourquoi le prix de l'électricité change-t-il ?",
        content: [
          hasRealData
            ? `À cet instant, la demande électrique est de ${(latest.consommation / 1000).toFixed(1)} GW. Le coût du marché est fixé par le coût marginal de la dernière centrale appelée. En ce moment, le réseau fait appel à ${fossilProd > 100 ? 'des centrales thermiques (gaz/charbon) de pointe' : 'des sources décarbonées locales ou des imports stables'}, déterminant la tarification de gros.`
            : "Le prix de gros de l'électricité varie selon la demande et la disponibilité des centrales. Le coût du marché européen est fixé par le coût de fonctionnement de la dernière centrale appelée pour équilibrer le réseau (le Merit Order).",
          "Comment ça marche : Le principe du 'Merit Order' européen classe les centrales par coût d'exploitation croissant. Si la demande oblige à démarrer des centrales à gaz onéreuses, le prix de gros s'aligne entièrement sur le gaz pour tous les producteurs actifs."
        ]
      },
      {
        icon: 'plug',
        title: "Qu'est-ce qui fait varier la consommation ?",
        content: [
          hasRealData
            ? `La consommation nationale s'élève à ${(latest.consommation / 1000).toFixed(1)} GW. Elle dépend étroitement des activités humaines (pics à 12h et 19h) et de la température extérieure (thermo-sensibilité).`
            : "La consommation nationale d'électricité fluctue fortement au cours de la journée (avec des pics à 12h et 19h) et varie considérablement selon la météo, le chauffage électrique en hiver et la climatisation en été.",
          "Explication physique : La France possède une forte proportion de chauffage électrique. Chaque degré en dessous de la normale hivernale (15°C) crée un appel d'air automatique de ~1 500 MW sur le réseau, soit l'équivalent de 1,5 réacteur nucléaire supplémentaire."
        ]
      },
      {
        icon: 'world',
        title: "Import / Export : à quoi ça sert ?",
        content: [
          (hasRealData && largestExchange.val !== 0)
            ? `La France est interconnectée avec ses voisins. Actuellement, notre plus gros échange commercial est un ${exDirection} net de ${exValueGW} GW avec le réseau d'interconnexion : ${largestExchange.name}.`
            : "La France est connectée aux réseaux électriques de ses voisins (Angleterre, Espagne, Italie, Suisse, Allemagne/Belgique). Ces liens permettent d'échanger de l'électricité pour optimiser les coûts et assurer la sécurité de l'approvisionnement.",
          "Pourquoi cela se produit : Le courant circule toujours naturellement du marché le moins cher vers le plus cher. Si nos voisins produisent un surplus d'énergie propre à bas coût (ex: éolien allemand ou solaire espagnol), la France importe pour économiser ses propres ressources."
        ]
      },
      {
        icon: 'carbon',
        title: "Comment est calculé l'impact CO₂ ?",
        content: [
          (hasRealData && co2 > 0)
            ? `L'intensité carbone consommée s'établit à ${co2} gCO₂eq/kWh. Grâce à notre mix de production bas-carbone, l'électricité française est actuellement environ ${deComparison} fois moins polluante que celle de l'Allemagne (moyenne annuelle ~350g/kWh).`
            : "L'intensité carbone moyenne de l'électricité française est parmi les plus basses d'Europe (généralement sous les 50 gCO₂eq/kWh) grâce à un mix énergétique décarboné composé principalement de nucléaire et de renouvelables.",
          "Détail du calcul : L'intensité carbone est la moyenne pondérée du taux d'émissions des sources utilisées. Le nucléaire, l'éolien et le solaire émettent environ 6g de CO₂/kWh, le gaz en émet 400g et le charbon près de 1000g."
        ]
      },
      {
        icon: 'pin',
        title: "Pourquoi les régions produisent-elles différemment ?",
        content: [
          (hasRegionalData && maxWindVal > 0 && maxSolarVal > 0)
            ? `La production s'ajuste selon les atouts climatiques locaux. En ce moment, le leader de la production éolienne est : ${maxWindRegion} (${maxWindVal.toLocaleString()} MW), et le leader de la production solaire est : ${maxSolarRegion} (${maxSolarVal.toLocaleString()} MW).`
            : "La production d'énergies renouvelables varie selon les régions : l'éolien est concentré dans les plaines venteuses du Nord et de l'Est, le solaire dans le Sud ensoleillé, et l'hydraulique dans les massifs montagneux.",
          "Raison scientifique : L'éolien privilégie les plaines dégagées et littorales (Hauts-de-France, Grand Est) tandis que le solaire bénéficie de l'irradiation élevée du sud (Occitanie, PACA, Nouvelle-Aquitaine). L'hydraulique reste l'apanage des montagnes (Alpes, Pyrénées)."
        ]
      }
    ];
  }, [latest, carbon, regional]);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 15000); // rotate every 15s
    return () => clearInterval(timer);
  }, [isHovered, slides.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide] || slides[0];

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        fontFamily: 'Inter, sans-serif',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
        <h3 style={{ fontSize: '13px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LightningIcon size={12} color="var(--text-accent)" />
          <span>Comprendre le Réseau en Direct</span>
        </h3>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={handlePrev} style={btnStyle} title="Fiche précédente">‹</button>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', minWidth: '24px', textAlign: 'center' }}>
            {currentSlide + 1} / {slides.length}
          </span>
          <button onClick={handleNext} style={btnStyle} title="Fiche suivante">›</button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px', 
        justifyContent: 'flex-start',
        padding: '2px 4px',
        marginTop: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <SlideIcon name={slide.icon} size={18} />
          <h4 style={{ fontSize: '14px', margin: 0, fontWeight: '700', color: 'var(--text-accent)' }}>
            {slide.title}
          </h4>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {slide.content.map((p, idx) => {
            const isMethodology = idx === 1;
            return (
              <p key={idx} style={{ 
                fontSize: isMethodology ? '11px' : '12.5px', 
                color: isMethodology ? 'var(--text-secondary)' : '#d1d5db', 
                fontStyle: isMethodology ? 'italic' : 'normal',
                lineHeight: '1.4', 
                margin: 0, 
                textAlign: 'justify' 
              }}>
                {p}
              </p>
            );
          })}
        </div>
      </div>

      {/* Small dot navigation indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
        {slides.map((_, idx) => (
          <div 
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: idx === currentSlide ? 'var(--text-accent)' : 'var(--border-light)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

const btnStyle = {
  background: 'transparent',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  borderRadius: '4px',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '11px',
  outline: 'none',
  transition: 'all 0.15s'
};
