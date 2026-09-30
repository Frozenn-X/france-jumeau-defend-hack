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
        padding: '2px 6px',
        background: 'rgba(10, 14, 26, 0.78)',
        borderRadius: '4px',
        fontSize: '10px',
        lineHeight: 1.2,
      }}
    >
      <a
        href="https://xavier.trauchessec.fr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Un projet de Xavier Trauchessec  Voir le portfolio"
        style={{
          color: '#dbeafe',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        Xavier Trauchessec · Portfolio —
      </a>
    </footer>
  );
}
