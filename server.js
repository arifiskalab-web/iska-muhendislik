import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize SQLite database
const dbPath = join(__dirname, 'database.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Run migrations
console.log('🔄 Running migrations...')
const migrations = ['0001_initial_schema.sql', '0002_update_schema_roloove.sql', '0003_add_photo_fields.sql']
for (const m of migrations) {
  try {
    const sql = readFileSync(join(__dirname, 'migrations', m), 'utf-8')
    const statements = sql.split(';').filter(s => s.trim())
    for (const stmt of statements) {
      try { db.exec(stmt) } catch(e) { /* ignore already exists */ }
    }
    console.log(`✅ ${m}`)
  } catch(e) { console.log(`⚠️ ${m}: ${e.message}`) }
}
console.log('✅ Migrations done!')

const app = new Hono()

app.use('/api/*', cors())

// ==================== AUTH ====================
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  const user = db.prepare('SELECT id, username, full_name, role, team_name FROM users WHERE username = ? AND password = ? AND active = 1').get(username, password)
  if (!user) return c.json({ error: 'Kullanıcı adı veya şifre hatalı' }, 401)
  const token = btoa(`${user.id}:${user.username}:${Date.now()}`)
  return c.json({ success: true, user, token })
})

app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  const token = authHeader.substring(7)
  try {
    const decoded = atob(token)
    const [userId] = decoded.split(':')
    const user = db.prepare('SELECT id, username, full_name, role, team_name FROM users WHERE id = ? AND active = 1').get(parseInt(userId))
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    return c.json({ user })
  } catch { return c.json({ error: 'Unauthorized' }, 401) }
})

// ==================== PROJECTS ====================
app.get('/api/projects', async (c) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  return c.json({ projects })
})

app.post('/api/projects', async (c) => {
  const data = await c.req.json()
  const authHeader = c.req.header('Authorization')
  let createdBy = null
  if (authHeader?.startsWith('Bearer ')) {
    try { const decoded = atob(authHeader.substring(7)); createdBy = parseInt(decoded.split(':')[0]) } catch {}
  }
  
  // Generate is_no
  const count = db.prepare('SELECT COUNT(*) as cnt FROM projects').get()
  const year = new Date().getFullYear()
  const is_no = `${year}-${String(count.cnt + 1).padStart(4, '0')}`
  
  const result = db.prepare(`INSERT INTO projects (is_no, is_veren, malik, il, ilce, adres, ada, parsel, yonetmelik, din_cinsi, sahaya_gidilen_tarih, saha_ekibi, saha_ekibi_id, raporu_hazirlayan, raportoru_id, yapi_kimlik_no, durum, fiyat, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(is_no, data.is_veren, data.malik, data.il, data.ilce, data.adres, data.ada, data.parsel, data.yonetmelik, data.din_cinsi, data.sahaya_gidilen_tarih, data.saha_ekibi, data.saha_ekibi_id, data.raporu_hazirlayan, data.raportoru_id, data.yapi_kimlik_no, data.durum || 'Beklemede', data.fiyat, createdBy)
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  return c.json({ success: true, project })
})

app.put('/api/projects/:id', async (c) => {
  const id = c.req.param('id')
  const data = await c.req.json()
  db.prepare(`UPDATE projects SET is_veren=?, malik=?, il=?, ilce=?, adres=?, ada=?, parsel=?, yonetmelik=?, din_cinsi=?, sahaya_gidilen_tarih=?, saha_ekibi=?, saha_ekibi_id=?, raporu_hazirlayan=?, raportoru_id=?, yapi_kimlik_no=?, durum=?, fiyat=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).run(data.is_veren, data.malik, data.il, data.ilce, data.adres, data.ada, data.parsel, data.yonetmelik, data.din_cinsi, data.sahaya_gidilen_tarih, data.saha_ekibi, data.saha_ekibi_id, data.raporu_hazirlayan, data.raportoru_id, data.yapi_kimlik_no, data.durum, data.fiyat, id)
  return c.json({ success: true })
})

// ==================== USERS ====================
app.get('/api/users', async (c) => {
  const users = db.prepare('SELECT id, username, full_name, role, team_name, active FROM users').all()
  return c.json({ users })
})

// ==================== AGENDA ====================
app.get('/api/agenda', async (c) => {
  const agenda = db.prepare('SELECT a.*, p.is_no, p.adres FROM agenda a JOIN projects p ON a.project_id = p.id ORDER BY a.tarih DESC').all()
  return c.json({ agenda })
})

app.post('/api/agenda', async (c) => {
  const data = await c.req.json()
  const result = db.prepare('INSERT INTO agenda (project_id, saha_ekibi_id, tarih, durum, notlar) VALUES (?, ?, ?, ?, ?)').run(data.project_id, data.saha_ekibi_id, data.tarih, data.durum || 'Planlandı', data.notlar)
  return c.json({ success: true, id: result.lastInsertRowid })
})

// ==================== FIELD DATA ====================
const fieldTables = {
  'kolon-siyirma': 'kolon_siyirma',
  'perde-siyirma': 'perde_siyirma',
  'kolon-rontgen': 'kolon_rontgen',
  'perde-rontgen': 'perde_rontgen',
  'schmidt': 'schmidt',
  'karot': 'karot',
  'roloove': 'roloove',
  'kolon-tanimlari': 'kolon_tanimlari',
  'perde-tanimlari': 'perde_tanimlari'
}

app.get('/api/field-data/:dataType/:projectId', async (c) => {
  const { dataType, projectId } = c.req.param()
  const table = fieldTables[dataType]
  if (!table) return c.json({ error: 'Invalid data type' }, 400)
  
  let data
  if (dataType === 'kolon-tanimlari' || dataType === 'perde-tanimlari') {
    data = db.prepare(`SELECT kt.* FROM ${table} kt JOIN roloove r ON kt.roloove_id = r.id WHERE r.project_id = ?`).all(projectId)
  } else {
    data = db.prepare(`SELECT * FROM ${table} WHERE project_id = ? ORDER BY created_at DESC`).all(projectId)
  }
  return c.json({ data })
})

app.post('/api/field-data/:dataType/:projectId', async (c) => {
  const { dataType, projectId } = c.req.param()
  const table = fieldTables[dataType]
  if (!table) return c.json({ error: 'Invalid data type' }, 400)
  
  const data = await c.req.json()
  const authHeader = c.req.header('Authorization')
  let createdBy = null
  if (authHeader?.startsWith('Bearer ')) {
    try { const decoded = atob(authHeader.substring(7)); createdBy = parseInt(decoded.split(':')[0]) } catch {}
  }
  
  // Dynamic insert
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at')
  fields.push('project_id', 'created_by')
  const values = fields.map(f => f === 'project_id' ? projectId : f === 'created_by' ? createdBy : data[f])
  const placeholders = fields.map(() => '?').join(', ')
  
  try {
    const result = db.prepare(`INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`).run(...values)
    return c.json({ success: true, id: result.lastInsertRowid })
  } catch(e) {
    return c.json({ error: e.message }, 500)
  }
})

// ==================== PHOTOS ====================
app.get('/api/photos/:projectId', async (c) => {
  const photos = db.prepare('SELECT * FROM fotograflar WHERE project_id = ? ORDER BY created_at DESC').all(c.req.param('projectId'))
  return c.json({ photos })
})

app.post('/api/photos/:projectId', async (c) => {
  const projectId = c.req.param('projectId')
  const data = await c.req.json()
  const authHeader = c.req.header('Authorization')
  let createdBy = null
  if (authHeader?.startsWith('Bearer ')) {
    try { const decoded = atob(authHeader.substring(7)); createdBy = parseInt(decoded.split(':')[0]) } catch {}
  }
  
  const result = db.prepare('INSERT INTO fotograflar (project_id, eleman_tipi, eleman_id, eleman_kodu, foto_tipi, foto_data, foto_adi, dosya_boyutu, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(projectId, data.eleman_tipi, data.eleman_id, data.eleman_kodu, data.foto_tipi, data.foto_data, data.foto_adi, data.dosya_boyutu, createdBy)
  return c.json({ success: true, id: result.lastInsertRowid })
})

app.get('/api/photos/:projectId/:elemanKodu', async (c) => {
  const photos = db.prepare('SELECT * FROM fotograflar WHERE project_id = ? AND eleman_kodu = ?').all(c.req.param('projectId'), c.req.param('elemanKodu'))
  return c.json({ photos })
})

// ==================== NOTIFICATIONS ====================
app.get('/api/notifications/:userId', async (c) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(c.req.param('userId'))
  return c.json({ notifications })
})

app.put('/api/notifications/:id/read', async (c) => {
  db.prepare('UPDATE notifications SET okundu = 1 WHERE id = ?').run(c.req.param('id'))
  return c.json({ success: true })
})

// ==================== FRONTEND ====================

// Read app.js once at startup
const appJs = readFileSync(join(__dirname, 'public/static/app.js'), 'utf-8')

// Serve app.js directly
app.get('/static/app.js', (c) => {
  return c.text(appJs, 200, { 'Content-Type': 'application/javascript' })
})

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yapı Risk Analizi Yönetim Sistemi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div id="app"></div>
    <script src="/static/app.js"></script>
</body>
</html>`)
})

const port = process.env.PORT || 3000
console.log(`🚀 Server running on port ${port}`)

serve({ fetch: app.fetch, port: Number(port) })
