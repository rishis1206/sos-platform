import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Home() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])

  useEffect(() => {
    api.get('/sos/public')
      .then(res => setLogs(res.data.logs || []))
      .catch(() => {})
  }, [])

  const getStatusColor = (status) => {
    if (status === 'completed') return '#00cc44'
    if (status === 'pending') return '#cc0000'
    if (status === 'accepted') return '#ffaa00'
    return '#555'
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Oswald, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#fff', fontSize: '20px', letterSpacing: '6px', fontWeight: '600', textTransform: 'uppercase' }}>
          <span style={{ color: '#cc0000' }}>&#9675;</span> Emergency SOS
        </div>
        <div style={{ display: 'flex', gap: '32px' }}>
          <span style={{ color: '#fff', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer' }}>Home</span>
          <span onClick={() => navigate('/victim')} style={{ color: '#555', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer' }}>Victim</span>
          <span onClick={() => navigate('/volunteer')} style={{ color: '#555', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', cursor: 'pointer' }}>Volunteer</span>
        </div>
      </nav>

      {/* Red bar */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #0a0a0a, #cc0000, #0a0a0a)' }} />

      {/* Hero */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 36px 64px', textAlign: 'center', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', width: '20px', height: '20px', borderTop: '2px solid #cc0000', borderLeft: '2px solid #cc0000' }} />
        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '20px', height: '20px', borderTop: '2px solid #cc0000', borderRight: '2px solid #cc0000' }} />
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '20px', height: '20px', borderBottom: '2px solid #cc0000', borderLeft: '2px solid #cc0000' }} />
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '20px', height: '20px', borderBottom: '2px solid #cc0000', borderRight: '2px solid #cc0000' }} />

        <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#cc0000', textTransform: 'uppercase', marginBottom: '20px' }}>
          AI Powered Emergency Response Platform
        </div>
        <div style={{ width: '48px', height: '2px', background: '#cc0000', marginBottom: '20px' }} />
        <div style={{ fontSize: '80px', fontWeight: '700', color: '#fff', letterSpacing: '6px', textTransform: 'uppercase', lineHeight: '1', marginBottom: '8px' }}>
          Emergency
        </div>
        <div style={{ fontSize: '80px', fontWeight: '700', color: '#cc0000', letterSpacing: '6px', textTransform: 'uppercase', lineHeight: '1', marginBottom: '12px' }}>
          SOS
        </div>
        <div style={{ fontSize: '22px', fontWeight: '300', color: '#666', letterSpacing: '10px', textTransform: 'uppercase', marginBottom: '28px' }}>
          System
        </div>
        <div style={{ fontSize: '15px', color: '#555', letterSpacing: '1px', maxWidth: '460px', lineHeight: '1.8', marginBottom: '48px', fontWeight: '300' }}>
          Real-time volunteer coordination powered by AI. Trigger an SOS instantly and get connected to nearby volunteers within seconds.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => navigate('/victim')}
            style={{ padding: '15px 44px', background: '#cc0000', border: 'none', color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px', fontWeight: '500' }}
          >
            I Need Help
          </button>
          <button
            onClick={() => navigate('/volunteer')}
            style={{ padding: '15px 44px', background: 'transparent', border: '1px solid #2a2a2a', color: '#666', fontFamily: 'Oswald, sans-serif', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px', fontWeight: '500' }}
          >
            I Want To Help
          </button>
        </div>
      </div>

      {/* Red bar */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #0a0a0a, #cc0000, #0a0a0a)' }} />

      {/* Stats */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1c1c1c' }}>
        {[
          { num: logs.filter(l => l.status === 'completed').length || '0', label: 'Rescues Completed' },
          { num: logs.filter(l => l.status === 'pending' || l.status === 'accepted').length || '0', label: 'Active Emergencies' },
          { num: logs.length || '0', label: 'Total Requests' },
          { num: '24/7', label: 'Always Online' },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, padding: '28px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid #1c1c1c' : 'none' }}>
            <div style={{ fontSize: '40px', fontWeight: '700', color: '#cc0000', letterSpacing: '2px' }}>{stat.num}</div>
            <div style={{ fontSize: '11px', color: '#444', letterSpacing: '4px', textTransform: 'uppercase', marginTop: '4px', fontWeight: '300' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Public Activity Log */}
      <div style={{ padding: '48px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#cc0000', textTransform: 'uppercase', marginBottom: '8px' }}>
          Live Feed
        </div>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '32px' }}>
          Recent Activity
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#333', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', padding: '40px' }}>
            No activity yet
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #1c1c1c', borderRadius: '4px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {log.category.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#444', letterSpacing: '2px' }}>
                    {log.victimId?.name || 'Anonymous'} • {timeAgo(log.createdAt)}
                  </div>
                  {log.assignedVolunteer && (
                    <div style={{ fontSize: '11px', color: '#00cc44', letterSpacing: '2px', marginTop: '4px' }}>
                      Responded by {log.assignedVolunteer.name}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: getStatusColor(log.status), letterSpacing: '2px', textTransform: 'uppercase', border: `1px solid ${getStatusColor(log.status)}`, padding: '4px 10px', borderRadius: '3px' }}>
                  {log.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}