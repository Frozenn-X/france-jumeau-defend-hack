export default function ProjectFooter() {
  return (
    <footer
      aria-label="À propos du projet"
      style={{
        position: 'absolute',
        right: 20,
        bottom: 3,
        zIndex: 12,
        maxWidth: 'calc(100vw - 40px)',
        padding: '4px 8px',
        background: 'rgba(4, 8, 18, 0.96)',
        borderTop: '1px solid rgba(148, 163, 184, 0.32)',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1.25,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px 8px',
      }}
    >
      <a
        href="/comprendre-electricite-en-france.html"
        style={{ color: '#f1f5f9', textDecoration: 'underline' }}
      >
        Comprendre l'électricité en France
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="https://xavier.trauchessec.fr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fait par Xavier Trauchessec - En savoir plus"
        style={{
          color: '#f1f5f9',
          textDecoration: 'none',
        }}
      >
        Fait par <strong>Xavier Trauchessec</strong> <span aria-hidden="true">-</span> En savoir plus
      </a>
    </footer>
  );
}
