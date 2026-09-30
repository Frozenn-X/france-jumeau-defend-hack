import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { CloseIcon } from '../Common/Icons';

// Local SVG Icons
const InfoIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ShieldIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const HelpIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function DataDetailModal() {
  const { detailedItem, setDetailedItem, lastClickCoords } = useAppContext();
  const [modalPosition, setModalPosition] = React.useState(null);

  React.useEffect(() => {
    if (detailedItem) {
      const x = lastClickCoords?.current?.x || window.innerWidth / 2;
      const y = lastClickCoords?.current?.y || window.innerHeight / 2;
      const W = window.innerWidth;
      const H = window.innerHeight;

      if (W < 768) {
        setModalPosition(null);
        return;
      }

      const style = {
        position: 'absolute',
        margin: 0
      };

      // Horizontal boundary alignment: place adjacent to cursor, clamp to fit W
      if (x > W / 2) {
        style.right = `${Math.max(20, Math.min(W - 580, W - x + 10))}px`;
      } else {
        style.left = `${Math.max(20, Math.min(W - 580, x + 10))}px`;
      }

      // Vertical boundary alignment: place adjacent to cursor, clamp to fit H and set maxHeight
      if (y > H / 2) {
        style.bottom = `${Math.max(20, H - y + 10)}px`;
        style.maxHeight = `${y - 30}px`;
      } else {
        style.top = `${Math.max(20, y + 10)}px`;
        style.maxHeight = `${H - y - 30}px`;
      }

      setModalPosition(style);
    } else {
      setModalPosition(null);
    }
  }, [detailedItem, lastClickCoords]);

  if (!detailedItem) return null;

  const handleClose = () => setDetailedItem(null);

  const { type, name, data, extra } = detailedItem;

  // Render content dynamically based on type
  const renderContent = () => {
    switch (type) {
      case 'region': {
        const prod = data ? (data.production || 0) : 0;
        const conso = data ? (data.consommation || 0) : 0;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Context */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <InfoIcon size={14} color="var(--text-accent)" />
                <span>Pourquoi et Comment ? (Contexte Scientifique)</span>
              </div>
              <p style={paragraphStyle}>
                Cette zone correspond à la région administrative <strong>{name}</strong>. Son profil énergétique dépend fortement de ses ressources géographiques (fleuves, montagnes, vents, ensoleillement) et de son tissu industriel et démographique.
              </p>
              {name.includes('Île-de-France') && (
                <p style={paragraphStyle}>
                  L'Île-de-France est structurellement déficitaire. Elle concentre plus de 20% de la consommation nationale pour moins de 10% de production locale (limitée à la valorisation des déchets et à la cogénération gaz). Elle dépend totalement du réseau de transport d'électricité (lignes THT 400kV) pour acheminer l'énergie depuis les régions voisines excédentaires comme la Normandie ou le Centre-Val de Loire.
                </p>
              )}
              {name.includes('Auvergne-Rhône-Alpes') && (
                <p style={paragraphStyle}>
                  Auvergne-Rhône-Alpes est le géant de l'hydraulique français grâce aux reliefs alpins et du Massif Central (barrages de grande chute et stations de transfert d'énergie par pompage - STEP). Le parc nucléaire rhodanien vient sécuriser la fourniture de base pour les industries et la métropole de Lyon.
                </p>
              )}
              {name.includes('Normandie') && (
                <p style={paragraphStyle}>
                  La Normandie est une région de production majeure. Elle combine de grandes centrales nucléaires côtières (Paluel, Penly, Flamanville) profitant de l'eau froide de la Manche, et un potentiel éolien terrestre et offshore en pleine expansion.
                </p>
              )}
              {!name.includes('Île-de-France') && !name.includes('Auvergne-Rhône-Alpes') && !name.includes('Normandie') && (
                <p style={paragraphStyle}>
                  Le mix de production réel de cette région est alimenté par les installations de production en service (nucléaire, éolien terrestre, parcs solaires ou centrales hydrauliques/thermiques de secours).
                </p>
              )}
            </div>

            {/* Données Récupérées */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <ShieldIcon size={14} color="var(--color-export)" />
                <span>Données Récupérées (Temps Réel)</span>
              </div>
              <div style={dataGridStyle}>
                <div style={dataCardStyle}>
                  <div style={dataLabelStyle}>Consommation Régionale</div>
                  <div style={dataValueStyle}>{conso.toLocaleString('fr-FR')} MW</div>
                </div>
                <div style={dataCardStyle}>
                  <div style={dataLabelStyle}>Production Régionale Totale</div>
                  <div style={dataValueStyle}>{prod.toLocaleString('fr-FR')} MW</div>
                </div>
              </div>
              <p style={paragraphStyle}>
                Ces données de consommation et de production par filière sont récupérées en temps réel depuis le jeu de données <strong><code>eco2mix-regional-tr</code></strong> publié par <strong>RTE (Réseau de Transport d'Électricité)</strong> via la plateforme ODRÉ (Open Data Réseau Électricité). Elles sont rafraîchies automatiquement toutes les 5 à 15 minutes.
              </p>
            </div>

            {/* Données Estimées / Calculées */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <HelpIcon size={14} color="var(--color-solar)" />
                <span>Données Estimées & Méthodes de Calcul</span>
              </div>
              
              <div style={formulaBoxStyle}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-solar)' }}>Intensité Carbone Locale Estimée</div>
                <code style={{ fontSize: '11px', display: 'block', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', color: '#f3f4f6' }}>
                  CO₂ (g/kWh) = (Thermique * 700 + Bioénergies * 30 + (Nucléaire + Éolien + Solaire + Hydro) * 6) / Production Totale
                </code>
              </div>

              <p style={paragraphStyle}>
                <strong>Pourquoi cette estimation ?</strong> RTE ne publie pas l'intensité carbone de l'électricité en temps réel à l'échelle régionale (uniquement au niveau national). L'application estime donc cette empreinte carbone locale en appliquant des facteurs d'émission standardisés du cycle de vie (ACV) issus de la <strong>Base Carbone de l'ADEME</strong> :
              </p>
              <ul style={listStyle}>
                <li><strong>Thermique Fossile :</strong> ~700 gCO₂eq/kWh (basé sur le mix gaz/charbon/fioul régional).</li>
                <li><strong>Bioénergies :</strong> ~30 gCO₂eq/kWh (valorisation de la biomasse et des déchets).</li>
                <li><strong>Décarboné (Nucléaire, Éolien, Solaire, Hydro) :</strong> ~6 gCO₂eq/kWh.</li>
              </ul>
              
              {extra?.simulated && (
                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', border: '1px dashed rgba(59,130,246,0.3)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-accent)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Modifications de Simulation Actives</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    En mode simulation, la production d'éolien et solaire de la région a été affectée par les coefficients modifiés. La consommation régionale intègre également l'effet de thermosensibilité de la météo estimée.
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      }
      
      case 'metropole': {
        const conso = data ? (data.consommation || 0) : 0;
        const prod = data ? (data.production || 0) : 0;
        const isProdND = data?.production === undefined || data?.production === null || data?.production === 'ND';
        const net = prod - conso;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Context */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <InfoIcon size={14} color="var(--text-accent)" />
                <span>Pourquoi et Comment ? (Contexte Urbain)</span>
              </div>
              <p style={paragraphStyle}>
                La métropole de <strong>{name}</strong> est un grand centre urbain caractérisé par une forte densité résidentielle et tertiaire. La demande d'énergie y est élevée, avec des pics importants le matin (démarrage des bureaux) et le soir (retour au domicile).
              </p>
              <p style={paragraphStyle}>
                En raison de leur nature urbaine, les métropoles ne disposent que de très peu d'espace pour de grandes unités de production électrique (comme des parcs éoliens ou des centrales nucléaires). Elles dépendent presque exclusivement des lignes haute tension pour importer l'énergie produite dans les zones rurales adjacentes.
              </p>
            </div>

            {/* Données Récupérées */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <ShieldIcon size={14} color="var(--color-export)" />
                <span>Données Récupérées (Temps Réel)</span>
              </div>
              <div style={dataGridStyle}>
                <div style={dataCardStyle}>
                  <div style={dataLabelStyle}>Consommation Métropolitaine</div>
                  <div style={dataValueStyle}>{conso.toLocaleString('fr-FR')} MW</div>
                </div>
                <div style={dataCardStyle}>
                  <div style={dataLabelStyle}>Production Interne</div>
                  <div style={dataValueStyle}>{isProdND ? 'Non Disponible (ND)' : `${prod.toLocaleString('fr-FR')} MW`}</div>
                </div>
              </div>
              <p style={paragraphStyle}>
                Ces données de consommation et d'injection locale sont récupérées en temps réel via l'API ODRÉ pour le jeu de données <strong><code>eco2mix-metropoles-tr</code></strong>. Ce jeu de données suit l'activité des réseaux métropolitains d'électricité en France.
              </p>
            </div>

            {/* Données Estimées / Non Disponibles */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <HelpIcon size={14} color="var(--color-solar)" />
                <span>Données Estimées & Statut de Production ND</span>
              </div>
              {isProdND ? (
                <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-warning)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Pourquoi la production est "ND" ?</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>
                    RTE applique des règles de secret industriel et statistique. Dans les métropoles ayant très peu d'installations de production (comme la Métropole du Grand Paris), publier la production en temps réel permettrait d'identifier précisément l'activité d'une ou deux entreprises locales (ex: usine d'incinération). Pour préserver cette confidentialité, RTE masque ces variables.
                  </span>
                </div>
              ) : (
                <p style={paragraphStyle}>
                  L'autonomie de la métropole est calculée directement en divisant sa production locale par sa consommation (soit <strong>{conso > 0 ? Math.round((prod / conso) * 100) : 0}%</strong>). Le solde local représente la différence (actuellement <strong>{net >= 0 ? `Export (+${Math.round(net)} MW)` : `Déficit (-${Math.round(Math.abs(net))} MW)`}</strong>).
                </p>
              )}
            </div>
          </div>
        );
      }
      
      case 'plant': {
        const { isNuclear, capacity, reactors, availableMW, outageMW, statusType, statusLabel, filiere, count, region } = data;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Context */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <InfoIcon size={14} color="var(--text-accent)" />
                <span>Pourquoi et Comment ? (Fonctionnement)</span>
              </div>
              {isNuclear ? (
                <>
                  <p style={paragraphStyle}>
                    La centrale nucléaire de <strong>{name}</strong> produit de l'électricité bas carbone de manière continue (production en base) par fission nucléaire d'atomes d'Uranium 235 au sein de ses {reactors} réacteurs à eau pressurisée (REP).
                  </p>
                  <p style={paragraphStyle}>
                    Elle requiert un débit d'eau permanent important pour condenser sa vapeur et refroidir ses réacteurs. C'est pourquoi elle est implantée soit sur le littoral (refroidissement par la mer) soit le long de grands fleuves comme la Loire, le Rhône, la Meuse ou le Rhin.
                  </p>
                </>
              ) : (
                <>
                  <p style={paragraphStyle}>
                    Ce marqueur regroupe les installations de production de la filière <strong>{filiere}</strong> situées dans la région <strong>{region}</strong>.
                  </p>
                  <p style={paragraphStyle}>
                    {filiere === 'Eolien' && "Les éoliennes convertissent l'énergie cinétique du vent en électricité. Leur production dépend de la vitesse du vent au niveau des turbines. Les parcs sont généralement répartis sur des zones de plaines agricoles ventées ou en mer (offshore)."}
                    {filiere === 'Solaire' && "Les panneaux photovoltaïques transforment le rayonnement lumineux du soleil en électricité. La production varie selon l'ensoleillement direct (W/m²), la couverture nuageuse et la saison."}
                    {filiere === 'Hydraulique' && "L'hydroélectricité exploite la force gravitationnelle de l'eau. Il existe des barrages-lacs de montagne pour les pointes de demande, des centrales au fil de l'eau pour la production continue, et des STEP (Stations de Transfert d'Énergie par Pompage) agissant comme des batteries géantes."}
                    {filiere === 'Thermique fossile' && "Les centrales thermiques brûlent du gaz naturel, du charbon ou du fioul. Extrêmement réactives, elles servent de secours en cas de pic de demande nationale mais émettent d'importantes quantités de gaz à effet de serre (CO₂)."}
                    {filiere === 'Bioénergies' && "Les bioénergies valorisent la matière organique (biomasse forestière, résidus agricoles, biogaz ou incinération de déchets ménagers). C'est une source pilotable et renouvelable."}
                  </p>
                </>
              )}
            </div>

            {/* Données Récupérées */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <ShieldIcon size={14} color="var(--color-export)" />
                <span>Données Récupérées (Registre National)</span>
              </div>
              {isNuclear ? (
                <div style={dataGridStyle}>
                  <div style={dataCardStyle}>
                    <div style={dataLabelStyle}>Capacité Nominale</div>
                    <div style={dataValueStyle}>{capacity.toLocaleString('fr-FR')} MW</div>
                  </div>
                  <div style={dataCardStyle}>
                    <div style={dataLabelStyle}>Nombre de Réacteurs</div>
                    <div style={dataValueStyle}>{reactors} tranches</div>
                  </div>
                </div>
              ) : (
                <div style={dataGridStyle}>
                  <div style={dataCardStyle}>
                    <div style={dataLabelStyle}>Capacité Installée Totale</div>
                    <div style={dataValueStyle}>{capacityMW.toLocaleString('fr-FR')} MW</div>
                  </div>
                  <div style={dataCardStyle}>
                    <div style={dataLabelStyle}>Nombre d'installations</div>
                    <div style={dataValueStyle}>{count.toLocaleString('fr-FR')} sites</div>
                  </div>
                </div>
              )}
              <p style={paragraphStyle}>
                Les données de capacité nominale installée et le nombre de sites sont réels. Ils sont issus du dataset officiel <strong><code>registre-national-installation-production-stockage-electricite-agrege-311224</code></strong> de RTE, répertoriant toutes les installations connectées au réseau national.
              </p>
            </div>

            {/* Données Estimées / Simulées */}
            <div className="detail-section" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <HelpIcon size={14} color="var(--color-solar)" />
                <span>Données Estimées & Statut de Simulation</span>
              </div>
              {isNuclear ? (
                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-danger)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Donnée Simulée (Fake Data)</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>
                    Le statut de fonctionnement en temps réel de cette centrale (disponible : <strong>{availableMW.toLocaleString('fr-FR')} MW</strong>, indisponible/panne : <strong>{outageMW.toLocaleString('fr-FR')} MW</strong>, {statusLabel}) est une <strong>simulaton locale</strong>.
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block', marginTop: '4px' }}>
                    <strong>Méthode de calcul :</strong> En raison de la complexité de l'API de pannes en temps réel RTE REMIT (nécessitant des accès sécurisés), l'application simule les indisponibilités de manière déterministe en appliquant un algorithme de hash sur le nom de la centrale et le pas de temps de l'historique de navigation. Le taux de panne simulé est statistiquement calibré sur les données historiques françaises (8% de maintenance fortuite, 7% de baisse de charge, 85% de marche nominale).
                  </span>
                </div>
              ) : (
                <>
                  <p style={paragraphStyle}>
                    La production réelle de la filière dans la région est récupérée en direct via <code>eco2mix-regional-tr</code>.
                  </p>
                  <p style={paragraphStyle}>
                    <strong>Méthode de simulation de l'animation cartographique :</strong> La vitesse d'animation des marqueurs sur la carte est calculée en direct selon la météo locale Open-Meteo :
                  </p>
                  <ul style={listStyle}>
                    {filiere === 'Eolien' && (
                      <li>La durée de rotation d'une pale éolienne est calibrée sur la vitesse du vent réel : <code>vitesse = 60 / vent_kmh</code> secondes par tour.</li>
                    )}
                    {filiere === 'Solaire' && (
                      <li>Le rayonnement du halo solaire autour du marqueur pulse plus lentement en présence de nuages : de 1.2s (ciel dégagé) à 6.0s (couvert).</li>
                    )}
                    <li>Les autres filières disposent d'un rythme d'animation constant reflétant leur taux de charge estimé.</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  const isCentered = !modalPosition;
  const dynamicOverlayStyle = {
    ...overlayStyle,
    display: isCentered ? 'flex' : 'block',
    alignItems: isCentered ? 'center' : undefined,
    justifyContent: isCentered ? 'center' : undefined
  };

  return (
    <div style={dynamicOverlayStyle}>
      {/* Backdrop click closes modal */}
      <div style={backdropStyle} onClick={handleClose} />
      
      {/* Modal Container */}
      <div className="glass-panel" style={{ ...modalStyle, ...modalPosition }}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>
              {type === 'region' ? '🗺️' : type === 'metropole' ? '🏙️' : '⚡'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                Fiche d'Audit Source & Calcul
              </span>
              <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)' }}>
                {name}
              </h2>
            </div>
          </div>
          
          <button onClick={handleClose} style={closeButtonStyle}>
            <CloseIcon size={14} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={contentStyle} className="no-scrollbar">
          {renderContent()}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Projet ÉnergieFrance — Transparence et Traçabilité des Données
          </span>
          <button onClick={handleClose} style={closeButtonPrimaryStyle}>
            Fermer la fiche
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline styles for high customizability and guaranteed layout
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  animation: 'fadeIn 0.2s ease-out'
};

const backdropStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(5, 7, 15, 0.75)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)'
};

const modalStyle = {
  position: 'relative',
  zIndex: 10001,
  width: '100%',
  maxWidth: '560px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  background: 'rgba(10, 14, 26, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
  borderRadius: '16px',
  overflow: 'hidden'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-light)',
  background: 'rgba(255, 255, 255, 0.02)'
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px',
  borderRadius: '50%',
  transition: 'all 0.2s',
  color: 'var(--text-secondary)'
};

const contentStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  borderTop: '1px solid var(--border-light)',
  background: 'rgba(255, 255, 255, 0.02)',
  fontSize: '9.5px'
};

const closeButtonPrimaryStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid var(--border-light)',
  borderRadius: '6px',
  padding: '6px 12px',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

// Section styles
const sectionStyle = {
  background: 'rgba(255, 255, 255, 0.015)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '10px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#ffffff',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  paddingBottom: '6px'
};

const paragraphStyle = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
  margin: 0
};

const listStyle = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
  margin: '0 0 0 16px',
  padding: 0
};

const dataGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  margin: '4px 0'
};

const dataCardStyle = {
  background: 'rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.04)',
  borderRadius: '8px',
  padding: '8px 12px'
};

const dataLabelStyle = {
  fontSize: '9.5px',
  color: 'var(--text-secondary)',
  marginBottom: '2px'
};

const dataValueStyle = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#ffffff'
};

const formulaBoxStyle = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '8px',
  padding: '10px',
  margin: '4px 0'
};
