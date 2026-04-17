// api/chat.js — Vercel Serverless Function
// Inclut fetch de prix marchés temps réel via Yahoo Finance (gratuit, sans clé)

// ── Fetch prix marchés ────────────────────────────────────
async function getMarketData() {
  const symbols = {
    'SPY':  'S&P 500',
    'QQQ':  'NASDAQ',
    'XIU.TO': 'TSX',
    'BTC-USD': 'Bitcoin',
    'ETH-USD': 'Ethereum',
  }

  try {
    const tickers = Object.keys(symbols).join(',')
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketTime`
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    
    if (!res.ok) throw new Error('Yahoo Finance unavailable')
    
    const data = await res.json()
    const quotes = data?.quoteResponse?.result || []
    
    if (quotes.length === 0) throw new Error('No quotes returned')

    const lines = quotes.map(q => {
      const name = symbols[q.symbol] || q.symbol
      const price = q.regularMarketPrice?.toFixed(2)
      const change = q.regularMarketChangePercent?.toFixed(2)
      const arrow = change >= 0 ? '▲' : '▼'
      const sign = change >= 0 ? '+' : ''
      return `${name} $${price} ${arrow}${sign}${change}%`
    })

    // État des marchés
    const now = new Date()
    const hour = now.getUTCHours() - 4 // EST
    const day = now.getDay()
    let status = 'Marchés fermés'
    if (day >= 1 && day <= 5) {
      if (hour >= 9.5 && hour < 16) status = 'Marchés ouverts'
      else if (hour >= 4 && hour < 9.5) status = 'Pré-marché'
      else if (hour >= 16 && hour < 20) status = 'Post-marché'
    }

    return `${status} — ${new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' })} EST\n${lines.join(' · ')}`

  } catch (err) {
    return `Données marchés temporairement indisponibles (${err.message})`
  }
}

// ── Handler principal ─────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, systemPrompt } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  // Fetch marchés en parallèle avec l'appel Claude
  const [marketData] = await Promise.all([
    getMarketData(),
  ])

  // Injecter les données marchés dans le system prompt
  const enrichedPrompt = `${systemPrompt}

## Données marchés temps réel (fetched maintenant)
${marketData}

Utilise ces données exactes quand on te parle des marchés. Ne les invente jamais.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: enrichedPrompt,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' })
    }

    return res.status(200).json({
      content: data.content?.[0]?.text || '',
      marketData, // retourner aussi au client pour affichage direct si besoin
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
