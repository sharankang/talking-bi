import { useState, useRef } from 'react'
import { parseIntent } from '../api'

const SUGGESTIONS = [
  'Show me total revenue by product category',
  'Monthly order trend for 2018',
  'Which states have the most customers?',
  'Top 10 products by sales',
  'Order status breakdown',
]

export default function InputScreen({ exploration, onIntent }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser. Use Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await parseIntent(input)
      onIntent(res.data.intent)
    } catch (e) {
      setError('Failed to parse intent. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const suggestedKpis = exploration?.suggested_kpis?.slice(0, 4) || []

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Talking <span className="text-indigo-400">BI</span>
          </h1>
          <p className="text-white/40 text-sm">
            Ask anything about your business data
          </p>
        </div>

        {/* Input card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-4">
          <div className="flex gap-3 mb-4">
            <textarea
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
              rows={3}
              placeholder="e.g. Show me revenue by category and monthly order trends..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <button
              onClick={handleVoice}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all self-start mt-1 ${
                listening
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <rect x="5" y="0" width="6" height="12" rx="3" fill="white"/>
                <path d="M2 9a6 6 0 0 0 12 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <line x1="8" y1="15" x2="8" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="5" y1="19" x2="11" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs mb-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 text-sm font-semibold transition-all"
          >
            {loading ? 'Analysing...' : 'Analyse →'}
          </button>
        </div>

        {/* Suggested KPIs from explore */}
        {suggestedKpis.length > 0 && (
          <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
            <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">
              Suggested for your data
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedKpis.map((kpi, i) => (
                <button
                  key={i}
                  onClick={() => setInput(kpi.description || kpi.name)}
                  className="bg-indigo-500/20 border border-indigo-500/30 rounded-full px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                >
                  {kpi.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Static suggestions if explore not loaded yet */}
        {suggestedKpis.length === 0 && (
          <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
            <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="bg-indigo-500/20 border border-indigo-500/30 rounded-full px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}