export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--eg-bg-radial)',
        padding: 'var(--eg-s4) var(--eg-s3)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2px solid rgba(212, 175, 55, 0.25)',
          borderTopColor: 'var(--eg-gold)',
          animation: 'eg-spin 0.9s linear infinite',
        }}
      />
      <span
        style={{
          marginTop: 'var(--eg-s3)',
          fontFamily: 'var(--eg-serif)',
          fontSize: '0.8rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--eg-muted)',
        }}
      >
        Eclipse Gold
      </span>
      <style>{`@keyframes eg-spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  )
}
