import { useState, useEffect, useRef, useCallback } from 'react'
import { getSamiSystemPrompt } from './systemPrompt.js'

// ── Helpers ──────────────────────────────────────────────
function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{time}</span>
}

// ── Styles inline ─────────────────────────────────────────
const S = {
  app: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gridTemplateRows: '52px 1fr',
    height: '100vh',
    overflow: 'hidden',
  },
  topbar: {
    gridColumn: '1/-1',
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 20px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  logo: {
    fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18,
    letterSpacing: -0.5, color: 'var(--teal2)',
  },
  sidebar: {
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    padding: '12px 0',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  main: {
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', background: 'var(--bg)',
  },
  chatArea: {
    flex: 1, overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 14,
    scrollBehavior: 'smooth',
  },
  inputArea: {
    padding: '12px 24px 18px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  inputRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  inputWrap: (focused) => ({
    flex: 1, background: 'var(--bg2)',
    border: `1px solid ${focused ? 'var(--teal)' : 'var(--border2)'}`,
    borderRadius: 10, padding: '10px 14px',
    transition: 'border-color 0.15s',
  }),
  textarea: {
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)',
    resize: 'none', maxHeight: 120, lineHeight: 1.5,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--teal)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}

// ── NavItem ───────────────────────────────────────────────
function NavItem({ icon, label, badge, badgeColor, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 14px', cursor: 'pointer',
        fontSize: 12,
        color: active ? 'var(--teal2)' : 'var(--text2)',
        background: active ? 'var(--teal-dim)' : 'transparent',
        borderLeft: `2px solid ${active ? 'var(--teal)' : 'transparent'}`,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ width: 14, textAlign: 'center', fontSize: 13 }}>{icon}</span>
      {label}
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: 9, padding: '1px 5px', borderRadius: 8,
          background: badgeColor === 'amber' ? 'var(--amber)' : 'var(--coral)',
          color: badgeColor === 'amber' ? '#000' : '#fff',
        }}>{badge}</span>
      )}
    </div>
  )
}

function SidebarSection({ label }) {
  return (
    <div style={{ padding: '8px 14px 4px', fontSize: 9, letterSpacing: 2, color: 'var(--text3)', textTransform: 'uppercase' }}>
      {label}
    </div>
  )
}

// ── Message components ────────────────────────────────────
function Avatar({ role }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700,
      background: role === 'sami' ? 'var(--teal-dim)' : 'var(--purple-dim)',
      color: role === 'sami' ? 'var(--teal2)' : 'var(--purple)',
      border: `1px solid ${role === 'sami' ? 'rgba(93,202,165,0.2)' : 'rgba(127,119,221,0.2)'}`,
    }}>
      {role === 'sami' ? 'S' : 'SD'}
    </div>
  )
}

function BriefCard() {
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--teal)', borderRadius: 10, padding: 16, fontSize: 12, lineHeight: 1.7,
    }}>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--teal2)', marginBottom: 10 }}>
        ☀️ Brief — {new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      {[
        { label: 'Agenda aujourd\'hui', items: ['Journée libre — idéal pour le build Samuel OS'] },
        { label: 'Priorités', items: ['Créer le Claude.ai Project SAMI 🟢', 'Déployer dashboard sur Vercel 🟡', 'Configurer webhook TradingView 🟡'] },
        { label: 'Alertes business', items: ['2 soumissions SD Entretien sans suivi (5 jours)', '1 renouvellement SAMI CRM à contacter'] },
        { label: 'Marchés', items: ['SPY +0.4% · QQQ +0.6% · BTC $84,200 +1.2%'] },
      ].map(sec => (
        <div key={sec.label} style={{ marginTop: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>{sec.label}</div>
          {sec.items.map(it => (
            <div key={it} style={{ display: 'flex', gap: 8, color: 'var(--text2)', padding: '1px 0' }}>
              <span style={{ color: 'var(--teal)', flexShrink: 0 }}>›</span> {it}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function TradeAlert({ onGo, onSkip }) {
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid rgba(239,159,39,0.25)',
      borderLeft: '3px solid var(--amber)', borderRadius: 10, padding: 14, fontSize: 12, lineHeight: 1.7,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>🔔</span>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--amber)' }}>
          NVDA / 4H — Breakout setup
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Détecté il y a 23 min via TradingView</div>
      {['RSI 62 en hausse · Croisement MACD haussier · Volume +34%', 'Earnings dans 8 jours — consensus positif · Momentum IA fort'].map(l => (
        <div key={l} style={{ display: 'flex', gap: 8, color: 'var(--text2)', padding: '1px 0' }}>
          <span style={{ color: 'var(--amber)', flexShrink: 0 }}>›</span> {l}
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
        {[['Entrée', '~$875'], ['Stop', '$842'], ['Cible 1', '$920'], ['Cible 2', '$965']].map(([k, v]) => (
          <div key={k} style={{ fontSize: 11, color: 'var(--text2)' }}>{k} <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span></div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text2)' }}>
        R/R : 1:2.7 · <span style={{ color: 'var(--teal2)' }}>Score IA : 8/10</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={onGo} style={{ background: 'var(--teal)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>✓ /go</button>
        <button onClick={onSkip} style={{ background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', padding: '6px 14px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>/skip</button>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 12, animation: 'fadeUp 0.25s ease' }}>
      <Avatar role="sami" />
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, borderTopLeftRadius: 2, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <span key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)',
              animation: `blink 1.2s ease-in-out ${delay}s infinite`, display: 'block',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const time = msg.time || ''

  return (
    <div style={{
      display: 'flex', gap: 12, flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'fadeUp 0.25s ease', maxWidth: '100%',
    }}>
      <Avatar role={isUser ? 'user' : 'sami'} />
      <div style={{ maxWidth: '72%' }}>
        {msg.type === 'brief' && <BriefCard />}
        {msg.type === 'trade' && <TradeAlert onGo={msg.onGo} onSkip={msg.onSkip} />}
        {(!msg.type || msg.type === 'text') && (
          <div
            style={{
              padding: '11px 15px', borderRadius: 12,
              borderTopLeftRadius: isUser ? 12 : 2,
              borderTopRightRadius: isUser ? 2 : 12,
              fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: isUser ? 'var(--teal-dim)' : 'var(--bg3)',
              border: `1px solid ${isUser ? 'rgba(29,158,117,0.25)' : 'var(--border)'}`,
              color: isUser ? 'var(--teal2)' : 'var(--text)',
            }}
            dangerouslySetInnerHTML={{ __html: escHtml(msg.content) }}
          />
        )}
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, textAlign: isUser ? 'right' : 'left' }}>{time}</div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────
const QUICK_CMDS = ['/brief', '/priorités', '/trading', '/sd', '/crm', '/finance', '/nomadog']
const NAV = [
  { section: 'Navigation' },
  { id: 'chat', icon: '💬', label: 'SAMI Chat' },
  { id: 'brief', icon: '☀️', label: 'Brief du jour' },
  { id: 'trading', icon: '📈', label: 'Trading', badge: '3', badgeColor: 'amber' },
  { section: 'Entreprises' },
  { id: 'sd', icon: '🧹', label: 'SD Entretien', badge: '2' },
  { id: 'crm', icon: '⚙️', label: 'SAMI CRM' },
  { id: 'nomadog', icon: '✈️', label: 'Nomadog' },
  { id: 'marketing', icon: '📢', label: 'Marketing Co.' },
  { section: 'Outils' },
  { id: 'finance', icon: '💰', label: 'Finance' },
  { id: 'settings', icon: '🔧', label: 'Paramètres' },
]

function now() {
  return new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const [activeNav, setActiveNav] = useState('chat')
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'sami', type: 'brief', time: '07:30',
      content: '',
    },
    {
      id: 2, role: 'user', type: 'text', time: '09:14',
      content: '/trading',
    },
    {
      id: 3, role: 'sami', type: 'trade', time: '09:15',
      content: '',
      onGo: null, onSkip: null,
    },
  ])
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const chatRef = useRef(null)
  const textareaRef = useRef(null)

  // wire trade buttons
  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === 3
      ? {
          ...m,
          onGo: () => addMsg('sami', '✅ Position notée. Exécute sur Wealthsimple : NVDA entrée ~$875, stop $842.'),
          onSkip: () => addMsg('sami', '⏭️ Setup NVDA passé. Surveillance continue.'),
        }
      : m
    ))
  }, [])

  const scrollBottom = useCallback(() => {
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }, [])

  useEffect(() => { scrollBottom() }, [messages, loading])

  function addMsg(role, content, type = 'text') {
    setMessages(prev => [...prev, { id: Date.now(), role, type, content, time: now() }])
  }

  async function sendMessage(text) {
    const t = (text || input).trim()
    if (!t || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    addMsg('user', t)
    const newHistory = [...history, { role: 'user', content: t }]
    setHistory(newHistory)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, systemPrompt: getSamiSystemPrompt() }),
      })
      const data = await res.json()
      const reply = data.content || data.error || 'Erreur de réponse.'
      addMsg('sami', reply)
      setHistory(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      addMsg('sami', '⚠️ Erreur de connexion. Configure ANTHROPIC_API_KEY dans Vercel → Settings → Environment Variables.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function autoResize(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div style={S.app}>

      {/* TOPBAR */}
      <header style={S.topbar}>
        <div style={S.logo}>SAMUEL <span style={{ color: 'var(--text3)', fontWeight: 400 }}>OS</span></div>
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>SAMI v1.0</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text3)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)', animation: 'pulse 2s ease-in-out infinite', display: 'block' }} />
          En ligne
          <span style={{ margin: '0 4px', color: 'var(--border2)' }}>|</span>
          <Clock />
        </div>
      </header>

      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        {NAV.map((item, i) =>
          item.section
            ? <SidebarSection key={i} label={item.section} />
            : <NavItem key={item.id} {...item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} />
        )}
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        <div ref={chatRef} style={S.chatArea}>
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {loading && <TypingIndicator />}
        </div>

        {/* Quick commands */}
        <div style={{ display: 'flex', gap: 6, padding: '0 24px 10px', flexWrap: 'wrap' }}>
          {QUICK_CMDS.map(cmd => (
            <button
              key={cmd}
              onClick={() => sendMessage(cmd)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
              }}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={S.inputArea}>
          <div style={S.inputRow}>
            <div style={S.inputWrap(focused)}>
              <textarea
                ref={textareaRef}
                style={S.textarea}
                rows={1}
                placeholder="Message à SAMI..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                onInput={autoResize}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </div>
            <button
              style={S.sendBtn}
              onClick={() => sendMessage()}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
