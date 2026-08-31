import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import api, { API_ORIGIN } from '../services/api'
import { AuthContext } from './useAuth'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ORIGIN

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    api.get('/auth/me')
      .then(res => {
        if (!cancelled) setUser(res.data.user)
      })
      .catch(() => {
        localStorage.removeItem('token')
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!user?._id || !token) return

    const nextSocket = io(SOCKET_URL, {
      auth: { token }
    })

    nextSocket.on('connect', () => {
      setSocket(nextSocket)
      console.log('Socket connected')
    })

    nextSocket.on('disconnect', () => {
      setSocket(null)
      console.log('Socket disconnected')
    })

    return () => {
      nextSocket.disconnect()
    }
  }, [user?._id, token])

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken)
    setToken(userToken)
    setUser(userData)
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setLoading(false)
    socket?.disconnect()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, socket }}>
      {children}
    </AuthContext.Provider>
  )
}
