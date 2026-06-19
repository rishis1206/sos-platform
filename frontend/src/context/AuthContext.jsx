import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  // Connect socket when user logs in
  useEffect(() => {
    if (user && token) {
      const socket = io('http://localhost:5000', {
        auth: { token }
      })

      socket.on('connect', () => {
        console.log('🔌 Socket connected')
      })

      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected')
      })

      socketRef.current = socket

      return () => {
        socket.disconnect()
        socketRef.current = null
      }
    }
  }, [user, token])

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken)
    setToken(userToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, socket: socketRef.current }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)