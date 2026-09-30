export default function ProjectFooter() {
  return (
    <footer
      aria-label="À propos du projet"
      style={{
        position: 'absolute',
        right: 24,
        bottom: 98,
        zIndex: 20,
        maxWidth: 'calc(100vw - 48px)',
        padding: '9px 14px',
        background: 'rgba(10, 14, 26, 0.94)',
        border: '1px solid rgba(148, 163, 184, 0.55)',
        borderRadius: '999px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.42)',
        backdropFilter: 'blur(10px)',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      <a
        href="https://xavier.trauchessec.fr"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#f8fafc',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
        }}
      >
        Un projet de Xavier Trauchessec  Voir le portfolio
      </a>
    </footer>
  );
}
