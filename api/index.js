import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import appointmentRoutes from './routes/appointments.js'
import serviceRoutes from './routes/services.js'
import clientRoutes from './routes/clients.js'
import reportRoutes from './routes/reports.js'
import settingsRoutes from './routes/settings.js'
import userRoutes from './routes/users.js'
import notificationRoutes from './routes/notifications.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`)
  })
}

export default app