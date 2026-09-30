export default function ProjectFooter() {
  return (
    <footer
      aria-label="À propos du projet"
      style={{
        position: 'absolute',
        right: 20,
        bottom: 4,
        zIndex: 11,
        color: 'var(--text-secondary)',
        fontSize: '11px',
      }}
    >
      <a
        href="https://xavier.trauchessec.fr"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        Un projet de Xavier Trauchessec — Voir le portfolio
      </a>
    </footer>
  );
}
