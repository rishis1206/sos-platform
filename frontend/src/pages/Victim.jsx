import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import SOSMap from '../components/SOSMap'
import AIAssistant from '../components/AIAssistant'
import ChatBox from '../components/ChatBox'

const CATEGORIES = [
  { id: 'medical', label: 'Medical' },
  { id: 'accident', label: 'Accident' },
  { id: 'fire', label: 'Fire' },
  { id: 'assault', label: 'Assault' },
  { id: 'natural_disaster', label: 'Natural Disaster' },
  { id: 'other', label: 'Other' },
]

const S = {
  page: { minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Oswald, sans-serif' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid #1c1c1c' },
  logo: { color: '#fff', fontSize: '20px', letterSpacing: '6px', fontWeight: '600', textTransform: 'uppercase' },
  navLinks: { display: 'flex', gap: '32px' },
  navLink: { color: '#555', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer' },
  navActive: { color: '#fff', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer' },
  redBar: { height: '2px', background: 'linear-gradient(90deg, #0a0a0a, #cc0000, #0a0a0a)' },
  body: { display: 'flex', minHeight: 'calc(100vh - 57px)' },
  left: { flex: 1, padding: '60px 48px', borderRight: '1px solid #1c1c1c', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  right: { flex: 1, padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  tag: { fontSize: '11px', letterSpacing: '5px', color: '#cc0000', textTransform: 'uppercase', marginBottom: '16px' },
  title: { fontSize: '52px', fontWeight: '700', color: '#fff', letterSpacing: '3px', textTransform: 'uppercase', lineHeight: '1.1', marginBottom: '16px' },
  titleRed: { color: '#cc0000' },
  desc: { fontSize: '14px', color: '#555', letterSpacing: '1px', lineHeight: '1.8', fontWeight: '300', maxWidth: '340px' },
  label: { fontSize: '11px', letterSpacing: '3px', color: '#555', textTransform: 'uppercase', marginBottom: '8px' },
  input: { background: '#111', border: '1px solid #222', color: '#fff', padding: '12px 16px', fontFamily: 'Oswald, sans-serif', fontSize: '14px', letterSpacing: '1px', borderRadius: '3px', width: '100%', outline: 'none', marginBottom: '20px' },
  btnRed: { width: '100%', padding: '14px', background: '#cc0000', border: 'none', color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px', marginBottom: '12px' },
  btnOut: { width: '100%', padding: '14px', background: 'transparent', border: '1px solid #222', color: '#555', fontFamily: 'Oswald, sans-serif', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px', marginBottom: '20px' },
  roleBtn: { flex: 1, padding: '11px', border: '1px solid #222', background: '#111', color: '#555', fontFamily: 'Oswald, sans-serif', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px' },
  roleBtnActive: { flex: 1, padding: '11px', border: '1px solid #cc0000', background: '#1a0000', color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px' },
  error: { color: '#cc0000', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' },
  success: { color: '#00cc44', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' },
  divider: { height: '1px', background: '#1c1c1c', margin: '24px 0' },
}

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
}

// ─── LOGIN FORM ───────────────────────────────────────────────
function LoginForm() {
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState('phone')
  const [isNewUser, setIsNewUser] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOTP = async () => {
    if (!phone) return setError('Phone number is required')
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/send-otp', { phone })
      setSuccess(`OTP sent! ${res.data.otp ? `(Dev mode OTP: ${res.data.otp})` : ''}`)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!otp) return setError('Enter OTP')
    if (isNewUser && !name) {
      return setError('Please enter your name to complete registration')
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/verify-otp', {
        phone,
        otp,
        name: name || undefined,
        role: 'victim'
      })
      if (res.data.isNewUser && !name) {
        setIsNewUser(true)
        setLoading(false)
        return setError('Please enter your name above to complete registration')
      }
      login(res.data.user, res.data.token)
    } catch (err) {
      if (err.response?.data?.isNewUser) {
        setIsNewUser(true)
        setError('Please enter your name above to complete registration')
      } else {
        setError(err.response?.data?.message || 'Invalid OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={S.tag}>Secure Access</div>
      <div style={S.title}>
        Get Help<br /><span style={S.titleRed}>Fast.</span>
      </div>
      <div style={S.desc}>
        Register your phone to instantly trigger SOS alerts. Nearby volunteers will be dispatched to your exact location.
      </div>
      <div style={S.divider} />

      {error && <div style={S.error}>{error}</div>}
      {success && <div style={S.success}>{success}</div>}

      {step === 'phone' && (
        <>
          <div style={S.label}>Phone Number</div>
          <input
            style={S.input}
            placeholder="Enter your phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendOTP()}
          />
          <button style={S.btnRed} onClick={sendOTP} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      )}

      {step === 'otp' && (
        <>
          <div style={S.label}>Phone Number</div>
          <input style={{ ...S.input, color: '#555' }} value={phone} readOnly />

          {isNewUser && (
            <>
              <div style={S.label}>Your Name</div>
              <input
                style={S.input}
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </>
          )}

          <div style={S.label}>Enter OTP</div>
          <input
            style={S.input}
            placeholder="6-digit OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
            onKeyDown={e => e.key === 'Enter' && verifyOTP()}
          />

          <button style={S.btnRed} onClick={verifyOTP} disabled={loading}>
            {loading ? 'Verifying...' : isNewUser ? 'Register & Enter' : 'Sign In'}
          </button>
          <button
            style={S.btnOut}
            onClick={() => {
              setStep('phone')
              setError('')
              setSuccess('')
              setIsNewUser(false)
              setOtp('')
              setName('')
            }}
          >
            Change Number
          </button>
        </>
      )}
    </div>
  )
}

// ─── SOS DASHBOARD ────────────────────────────────────────────
function SOSDashboard() {
  const { user, logout, socket } = useAuth()
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [activeSOS, setActiveSOS] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [victimLocation, setVictimLocation] = useState(null)
  const [volunteerLocation, setVolunteerLocation] = useState(null)

  useEffect(() => {
    api.get('/sos')
      .then(res => {
        if (res.data.requests && res.data.requests.length > 0) {
          const sos = res.data.requests[0]
          setActiveSOS(sos)
          if (sos.location?.coordinates) {
            setVictimLocation({
              lat: sos.location.coordinates[1],
              lng: sos.location.coordinates[0]
            })
          }
        }
      })
      .catch(() => {})

    api.get('/sos/history')
      .then(res => {
        if (res.data.history) setHistory(res.data.history)
      })
      .catch(() => {})

    if (socket) {
      socket.on('sos_accepted', (data) => {
        setSuccess(`✅ Volunteer ${data.volunteer.name} is on the way!`)
        setActiveSOS(prev => prev ? {
          ...prev,
          status: 'accepted',
          assignedVolunteer: data.volunteer.id
        } : prev)
      })

      socket.on('sos_completed', () => {
        setActiveSOS(null)
        setSuccess('Rescue completed. You are safe!')
        api.get('/sos/history')
          .then(res => setHistory(res.data.history || []))
          .catch(() => {})
      })

      socket.on('volunteer_location_update', (data) => {
        setVolunteerLocation(data.location)
      })
    }

    return () => {
      if (socket) {
        socket.off('sos_accepted')
        socket.off('sos_completed')
        socket.off('volunteer_location_update')
      }
    }
  }, [socket])

  const triggerSOS = async () => {
    if (!category) return setError('Select an emergency category first')
    setLoading(true)
    setError('')
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setVictimLocation({ lat, lng })
        try {
          const res = await api.post('/sos', {
            category,
            description,
            latitude: lat,
            longitude: lng,
          })
          setActiveSOS(res.data.sos)
          setSuccess('SOS triggered! Searching for nearby volunteers...')

          api.get('/sos/history')
            .then(res => setHistory(res.data.history || []))
            .catch(() => {})

          if (socket) socket.emit('join_sos_room', res.data.sos._id)

          const tracker = setInterval(() => {
            navigator.geolocation.getCurrentPosition(p => {
              const newLat = p.coords.latitude
              const newLng = p.coords.longitude
              setVictimLocation({ lat: newLat, lng: newLng })
              api.put('/users/location', {
                latitude: newLat,
                longitude: newLng
              }).catch(() => {})
              if (socket) socket.emit('update_location', {
                latitude: newLat,
                longitude: newLng,
                sosId: res.data.sos._id
              })
            }, (err) => console.error('Location error:', err), GEO_OPTIONS)
          }, 10000)

          window._sosTracker = tracker

        } catch (err) {
          setError(err.response?.data?.message || 'Failed to trigger SOS')
        } finally {
          setLoading(false)
        }
      }, (err) => {
        setError('Location access denied. Please enable GPS.')
        setLoading(false)
      }, GEO_OPTIONS)
    } catch (err) {
      setError('Failed to get location')
      setLoading(false)
    }
  }

  const cancelSOS = async () => {
    if (!activeSOS) return
    try {
      await api.put(`/sos/${activeSOS._id}/cancel`)
      if (socket) socket.emit('leave_sos_room', activeSOS._id)
      setActiveSOS(null)
      setVictimLocation(null)
      setSuccess('SOS cancelled.')
      api.get('/sos/history')
        .then(res => setHistory(res.data.history || []))
        .catch(() => {})
      if (window._sosTracker) {
        clearInterval(window._sosTracker)
        window._sosTracker = null
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>
      <div style={{ flex: 1, padding: '48px', borderRight: '1px solid #1c1c1c', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={S.tag}>Victim Dashboard</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#fff', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Welcome, {user.name}
            </div>
          </div>
          <button
            onClick={logout}
            style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #222', color: '#555', fontFamily: 'Oswald, sans-serif', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px' }}
          >
            Logout
          </button>
        </div>

        {error && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        {!activeSOS ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div
                onClick={!loading ? triggerSOS : undefined}
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: loading ? '#880000' : '#cc0000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  cursor: 'pointer',
                  boxShadow: '0 0 40px #cc000066, 0 0 80px #cc000033',
                  border: '4px solid #ff2222',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase' }}>
                  {loading ? '...' : 'SOS'}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '3px', textTransform: 'uppercase' }}>
                Select category below then press
              </div>
            </div>

            <div style={S.label}>Emergency Category</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={category === cat.id ? S.roleBtnActive : S.roleBtn}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={S.label}>Description (Optional)</div>
            <textarea
              style={{ ...S.input, height: '80px', resize: 'none' }}
              placeholder="Briefly describe the emergency..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </>
        ) : (
          <div>
            <div style={{ background: '#110000', border: '1px solid #cc0000', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#cc0000', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
                ● Active SOS — {activeSOS.category.replace('_', ' ')}
              </div>
              <div style={{ fontSize: '13px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
                Status: {activeSOS.status}
              </div>
              <button
                onClick={cancelSOS}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #444', color: '#888', fontFamily: 'Oswald, sans-serif', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px' }}
              >
                Cancel SOS
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#555', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Live Location
              </div>
              <SOSMap
                victimLocation={victimLocation}
                volunteerLocation={volunteerLocation}
              />
            </div>

            <AIAssistant
              category={activeSOS.category}
              description={activeSOS.description}
            />

            {activeSOS.assignedVolunteer && (
              <div style={{ marginTop: '20px' }}>
                <ChatBox
                  sosId={activeSOS._id}
                  receiverId={activeSOS.assignedVolunteer}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '48px', overflowY: 'auto' }}>
        <div style={S.tag}>Activity Log</div>
        <div style={{ fontSize: '22px', fontWeight: '600', color: '#fff', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px' }}>
          Past Requests
        </div>

        {history.length === 0 ? (
          <div style={{ color: '#333', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', marginTop: '60px', lineHeight: '2' }}>
            No activity yet.<br />Your SOS history will appear here.
          </div>
        ) : (
          history.map((h, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid #1c1c1c', borderRadius: '4px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '15px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {h.category.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '11px', color: h.status === 'completed' ? '#00cc44' : h.status === 'cancelled' ? '#666' : '#cc0000', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {h.status}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '2px', marginTop: '6px' }}>
                {new Date(h.createdAt).toLocaleString()}
              </div>
              {h.aiAnalysis?.summary && (
                <div style={{ fontSize: '12px', color: '#555', marginTop: '8px', letterSpacing: '1px' }}>
                  {h.aiAnalysis.summary}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── MAIN VICTIM PAGE ─────────────────────────────────────────
export default function Victim() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#cc0000', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase' }}>Loading...</div>
    </div>
  )

  if (user && user.role === 'volunteer') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Oswald, sans-serif' }}>
        <nav style={S.nav}>
          <div style={S.logo}><span style={{ color: '#cc0000' }}>&#9675;</span> Emergency SOS</div>
          <div style={S.navLinks}>
            <span onClick={() => navigate('/')} style={S.navLink}>Home</span>
            <span style={S.navActive}>Victim</span>
            <span onClick={() => navigate('/volunteer')} style={S.navLink}>Volunteer</span>
          </div>
        </nav>
        <div style={S.redBar} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 57px)', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '11px', color: '#cc0000', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '16px' }}>Access Denied</div>
          <div style={{ fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>
            You're a Volunteer,<br /><span style={{ color: '#cc0000' }}>Not a Victim.</span>
          </div>
          <div style={{ fontSize: '14px', color: '#555', letterSpacing: '2px', marginBottom: '32px' }}>
            You can't send an SOS and respond to it yourself. That's not how this works.
          </div>
          <button
            onClick={() => navigate('/volunteer')}
            style={{ padding: '14px 40px', background: '#cc0000', border: 'none', color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px' }}
          >
            Go to Volunteer Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.logo}><span style={{ color: '#cc0000' }}>&#9675;</span> Emergency SOS</div>
        <div style={S.navLinks}>
          <span onClick={() => navigate('/')} style={S.navLink}>Home</span>
          <span style={S.navActive}>Victim</span>
          <span onClick={() => navigate('/volunteer')} style={S.navLink}>Volunteer</span>
        </div>
      </nav>
      <div style={S.redBar} />

      {!user ? (
        <div style={S.body}>
          <div style={S.left}>
            <div style={S.tag}>Emergency SOS</div>
            <div style={S.title}>I Need<br /><span style={S.titleRed}>Help.</span></div>
            <div style={S.desc}>Enter your phone number to get started. New users register automatically. Existing users sign in directly.</div>
          </div>
          <div style={S.right}>
            <LoginForm />
          </div>
        </div>
      ) : (
        <SOSDashboard />
      )}
    </div>
  )
}