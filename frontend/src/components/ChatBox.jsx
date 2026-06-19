import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function ChatBox({ sosId, receiverId }) {
  const { user, socket } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Load existing messages
  useEffect(() => {
    if (!sosId) return
    api.get(`/messages/${sosId}`)
      .then(res => setMessages(res.data.messages || []))
      .catch(() => {})
  }, [sosId])

  // Join SOS room and listen for new messages
  useEffect(() => {
    if (!socket || !sosId) return

    socket.emit('join_sos_room', sosId)

    socket.on('new_message', (msg) => {
      const senderId = msg.senderId?._id || msg.senderId
      // Only add if message is from the other person
      if (senderId !== user._id) {
        setMessages(prev => [...prev, msg])
      }
    })

    return () => {
      socket.emit('leave_sos_room', sosId)
      socket.off('new_message')
    }
  }, [socket, sosId])

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    setLoading(true)
    const messageText = input.trim()
    setInput('')

    try {
      const res = await api.post('/messages', {
        sosId,
        message: messageText
      })

      // Add to local state immediately so sender sees it
      setMessages(prev => [...prev, {
        ...res.data.message,
        senderId: { _id: user._id, name: user.name }
      }])

    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTyping = (e) => {
    setInput(e.target.value)
    if (socket && sosId) {
      socket.emit('typing', { sosId, isTyping: e.target.value.length > 0 })
    }
  }

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: '4px', padding: '20px' }}>
      <div style={{ fontSize: '11px', color: '#cc0000', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
        ✦ Emergency Chat
      </div>

      {/* Messages */}
      <div style={{ height: '220px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
        {messages.length === 0 ? (
          <div style={{ color: '#333', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', marginTop: '80px' }}>
            No messages yet
          </div>
        ) : (
          messages.map((msg, i) => {
            const senderId = msg.senderId?._id || msg.senderId
            const isMe = senderId === user._id
            return (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  background: isMe ? '#cc0000' : '#1a1a1a',
                  border: `1px solid ${isMe ? '#ff2222' : '#2a2a2a'}`,
                  maxWidth: '75%'
                }}>
                  {!isMe && (
                    <div style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {msg.senderId?.name || 'User'}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#fff', letterSpacing: '0.5px', lineHeight: '1.5' }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: '10px', color: isMe ? '#ffaaaa' : '#444', letterSpacing: '1px', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          style={{
            flex: 1,
            background: '#111',
            border: '1px solid #222',
            color: '#fff',
            padding: '10px 14px',
            fontFamily: 'Oswald, sans-serif',
            fontSize: '13px',
            borderRadius: '3px',
            outline: 'none'
          }}
          placeholder="Type a message..."
          value={input}
          onChange={handleTyping}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#cc0000',
            border: 'none',
            color: '#fff',
            fontFamily: 'Oswald, sans-serif',
            fontSize: '12px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}