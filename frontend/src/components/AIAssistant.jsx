import { useState } from 'react'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const MODELS = [
  'gemini-2.5-flash'
]

async function askGemini(prompt) {
  for (const model of MODELS) {

    for (let retry = 0; retry < 3; retry++) {

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        )

        if (response.status === 503) {
          console.log(`503 from ${model}. Retrying ${retry + 1}/3...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }

        if (response.status === 429) {
          const errorText = await response.text()

          console.log("STATUS:", response.status)
          console.log("ERROR:", errorText)

          return null
        }

        if (!response.ok) {
          const errorText = await response.text()

          console.log("STATUS:", response.status)
          console.log("ERROR:", errorText)

          continue
        }

        const data = await response.json()

        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text

        if (text) {
          return text
        }

      } catch (err) {
        console.error(`${model} failed:`, err)
      }
    }
  }

  return null
}

export default function AIAssistant({ category, description }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `I'm your emergency assistant. You've reported a ${category?.replace('_', ' ') || 'emergency'}. Ask me anything for immediate guidance.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!input.trim()) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setLoading(true)

    const prompt = `You are an emergency first aid AI assistant.
The victim is experiencing: ${category?.replace('_', ' ')} emergency.
Additional context: ${description || 'No description provided'}
User question: ${userMessage}

Provide clear, calm, step-by-step emergency guidance. Keep it brief and actionable.
Do not tell them to call emergency services as that is already being handled.
Focus only on immediate first aid or safety actions they can take right now.`

    try {
      const reply = await askGemini(prompt)

      if (reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'All AI models are currently busy. Please stay calm — help is on the way. Basic advice: stay still, breathe slowly, and wait for the volunteer.'
        }])
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Connection error. Stay calm, help is on the way.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: '4px', padding: '20px' }}>
      <div style={{ fontSize: '11px', color: '#cc0000', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
        ✦ AI Emergency Assistant
      </div>

      <div style={{ height: '200px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              background: msg.role === 'user' ? '#1a0000' : '#111',
              border: `1px solid ${msg.role === 'user' ? '#cc0000' : '#1c1c1c'}`,
              maxWidth: '85%'
            }}>
              <div style={{ fontSize: '12px', color: msg.role === 'user' ? '#fff' : '#aaa', letterSpacing: '1px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ padding: '10px 14px', background: '#111', border: '1px solid #1c1c1c', borderRadius: '4px', alignSelf: 'flex-start' }}>
            <div style={{ fontSize: '12px', color: '#555', letterSpacing: '2px' }}>Thinking...</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          style={{ flex: 1, background: '#111', border: '1px solid #222', color: '#fff', padding: '10px 14px', fontFamily: 'Oswald, sans-serif', fontSize: '13px', borderRadius: '3px', outline: 'none' }}
          placeholder="Ask for help e.g. snake bite, bleeding..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && ask()}
        />
        <button
          onClick={ask}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#cc0000', border: 'none', color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px' }}
        >
          {loading ? '...' : 'Ask'}
        </button>
      </div>
    </div>
  )
}