const CARD_COLORS = [
  { bg: 'rgba(0,210,255,0.08)', border: 'rgba(0,210,255,0.2)', text: '#00d2ff', icon: '◈' },
  { bg: 'rgba(63,185,80,0.08)', border: 'rgba(63,185,80,0.2)', text: '#3fb950', icon: '◆' },
  { bg: 'rgba(123,47,247,0.08)', border: 'rgba(123,47,247,0.2)', text: '#7b2ff7', icon: '◉' },
  { bg: 'rgba(255,166,0,0.08)', border: 'rgba(255,166,0,0.2)', text: '#ffa600', icon: '◇' },
  { bg: 'rgba(248,81,73,0.08)', border: 'rgba(248,81,73,0.2)', text: '#f85149', icon: '▲' },
]

export default function KpiCards({ cards }) {
  if (!cards || cards.length === 0) return null

  const format = (value, fmt) => {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    if (fmt === 'currency') return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (fmt === 'percent') return `${num.toFixed(1)}%`
    return num.toLocaleString('en-US')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
      {cards.map((card, i) => {
        const c = CARD_COLORS[i % CARD_COLORS.length]
        return (
          <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '12px', right: '14px', fontSize: '20px', color: c.text, opacity: 0.3, fontFamily: 'monospace' }}>
              {c.icon}
            </div>
            <p style={{ fontFamily: 'Space Mono', fontSize: '9px', color: c.text, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8 }}>
              {card.label}
            </p>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '24px', color: '#e6edf3', lineHeight: 1 }}>
              {format(card.value, card.format)}
            </p>
          </div>
        )
      })}
    </div>
  )
}