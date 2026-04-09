import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize SQLite database
const db = new Database(join(__dirname, 'database.db'))

// Create a Hono app with database binding
const app = new Hono()

// Attach database to context
app.use('*', async (c, next) => {
  c.env = { DB: db }
  await next()
})

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Import and use the main app routes
const indexModule = await import('./dist/_worker.js')
const mainApp = indexModule.default

// Mount all routes from the main app
app.route('/', mainApp)

const port = process.env.PORT || 3000
console.log(`🚀 Server running on port ${port}`)

serve({
  fetch: app.fetch,
  port: port
})
