// import 'dotenv/config'
// import express from 'express'
// import cors from 'cors'
// import { createServer } from 'http'
// import { Server } from 'socket.io'
// import routes from './routes/index'

// const app = express()
// const httpServer = createServer(app)
// const PORT = process.env.PORT || 3001

// export const io = new Server(httpServer, {
//   cors: { origin: 'http://localhost:5173', credentials: true }
// })

// io.on('connection', (socket) => {
//   console.log('⚡ Client connected:', socket.id)
//   socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id))
// })

// app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

// app.use('/api', routes)

// app.get('/health', (_, res) => {
//   res.json({ status: 'ok', timestamp: new Date().toISOString() })
// })

// app.use((_, res) => {
//   res.status(404).json({ error: 'Route not found' })
// })

// httpServer.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`)
// })

// export default app









import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import routes from './routes/index'

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean) as string[]

export const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true }
})

io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id)
  socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id))
})

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', routes)

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((_, res) => {
  res.status(404).json({ error: 'Route not found' })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export default app
