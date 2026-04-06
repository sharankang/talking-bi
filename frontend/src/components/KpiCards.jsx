export default function KpiCards({ cards }) {
  if (!cards || cards.length === 0) return null

  const format = (value, fmt) => {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    if (fmt === 'currency') return `R$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (fmt === 'percent') return `${num.toFixed(1)}%`
    return num.toLocaleString('en-US')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
      {cards.map((card, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '16px 18px',
        }}>
          <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {card.label}
          </p>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '22px', color: 'white', lineHeight: 1 }}>
            {format(card.value, card.format)}
          </p>
        </div>
      ))}
    </div>
  )
}