import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, User, Project, Agenda } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware for API routes
app.use('/api/*', cors())

// Serve static files from dist/static directory
app.use('/static/*', serveStatic())

// ==================== AUTH API ====================

// Login endpoint
app.post('/api/auth/login', async (c) => {
  const { DB } = c.env
  const { username, password } = await c.req.json()

  const user = await DB.prepare(
    'SELECT id, username, full_name, role, team_name FROM users WHERE username = ? AND password = ? AND active = 1'
  ).bind(username, password).first<User>()

  if (!user) {
    return c.json({ error: 'Kullanıcı adı veya şifre hatalı' }, 401)
  }

  // Simple session token (in production, use JWT)
  const token = btoa(`${user.id}:${user.username}:${Date.now()}`)

  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      team_name: user.team_name
    },
    token
  })
})

// Get current user from token
app.get('/api/auth/me', async (c) => {
  const { DB } = c.env
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const decoded = atob(token)
  const userId = parseInt(decoded.split(':')[0])

  const user = await DB.prepare(
    'SELECT id, username, full_name, role, team_name FROM users WHERE id = ? AND active = 1'
  ).bind(userId).first<User>()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

// ==================== PROJECTS API ====================

// Get all projects
app.get('/api/projects', async (c) => {
  const { DB } = c.env
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const decoded = atob(token)
  const userId = parseInt(decoded.split(':')[0])

  // Get user to check role
  const user = await DB.prepare('SELECT role, id FROM users WHERE id = ?').bind(userId).first<User>()
  
  let query = 'SELECT * FROM projects ORDER BY id DESC'
  let params: any[] = []

  // Field team only sees their assigned projects
  if (user?.role === 'field_team') {
    query = 'SELECT * FROM projects WHERE saha_ekibi_id = ? ORDER BY id DESC'
    params = [userId]
  }

  const stmt = params.length > 0 ? DB.prepare(query).bind(...params) : DB.prepare(query)
  const { results } = await stmt.all<Project>()

  return c.json({ projects: results || [] })
})

// Get single project
app.get('/api/projects/:id', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')

  const project = await DB.prepare('SELECT * FROM projects WHERE id = ?')
    .bind(projectId)
    .first<Project>()

  if (!project) {
    return c.json({ error: 'Project not found' }, 404)
  }

  return c.json({ project })
})

// Create new project
app.post('/api/projects', async (c) => {
  const { DB } = c.env
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const decoded = atob(token)
  const userId = parseInt(decoded.split(':')[0])

  const data = await c.req.json()

  // Generate next İş No
  const lastProject = await DB.prepare('SELECT is_no FROM projects ORDER BY id DESC LIMIT 1').first<{ is_no: string }>()
  let nextIsNo = '1'
  
  if (lastProject && lastProject.is_no) {
    const lastNo = parseInt(lastProject.is_no)
    nextIsNo = (lastNo + 1).toString()
  }

  const result = await DB.prepare(`
    INSERT INTO projects (
      is_no, is_veren, malik, il, ilce, adres, ada, parsel, 
      yonetmelik, din_cinsi, sahaya_gidilen_tarih, saha_ekibi, 
      saha_ekibi_id, durum, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    nextIsNo,
    data.is_veren || null,
    data.malik || null,
    data.il || 'İstanbul',
    data.ilce || null,
    data.adres || null,
    data.ada || null,
    data.parsel || null,
    data.yonetmelik || null,
    data.din_cinsi || null,
    data.sahaya_gidilen_tarih || null,
    data.saha_ekibi || null,
    data.saha_ekibi_id || null,
    'Beklemede',
    userId
  ).run()

  // If saha assigned, create agenda entry and notification
  if (data.saha_ekibi_id && data.sahaya_gidilen_tarih) {
    await DB.prepare(`
      INSERT INTO agenda (project_id, saha_ekibi_id, tarih, durum)
      VALUES (?, ?, ?, 'Planlandı')
    `).bind(result.meta.last_row_id, data.saha_ekibi_id, data.sahaya_gidilen_tarih).run()

    // Create notification for field team
    await DB.prepare(`
      INSERT INTO notifications (user_id, project_id, baslik, mesaj, tip)
      VALUES (?, ?, 'Yeni Görev Atandı', ?, 'bilgi')
    `).bind(
      data.saha_ekibi_id,
      result.meta.last_row_id,
      `İş No: ${nextIsNo} - ${data.adres || 'Yeni iş'} görevi size atandı. Tarih: ${data.sahaya_gidilen_tarih}`
    ).run()
  }

  return c.json({ 
    success: true, 
    project_id: result.meta.last_row_id,
    is_no: nextIsNo
  })
})

// Update project
app.put('/api/projects/:id', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  const data = await c.req.json()

  const updateFields = []
  const updateValues = []

  for (const [key, value] of Object.entries(data)) {
    if (key !== 'id') {
      updateFields.push(`${key} = ?`)
      updateValues.push(value)
    }
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP')
  updateValues.push(projectId)

  await DB.prepare(`
    UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?
  `).bind(...updateValues).run()

  return c.json({ success: true })
})

// ==================== AGENDA API ====================

// Get agenda for date range
app.get('/api/agenda', async (c) => {
  const { DB } = c.env
  const startDate = c.req.query('start_date')
  const endDate = c.req.query('end_date')

  let query = `
    SELECT a.*, p.is_no, p.adres, p.is_veren, u.team_name, u.full_name
    FROM agenda a
    LEFT JOIN projects p ON a.project_id = p.id
    LEFT JOIN users u ON a.saha_ekibi_id = u.id
    ORDER BY a.tarih ASC
  `

  const params = []
  if (startDate && endDate) {
    query = `
      SELECT a.*, p.is_no, p.adres, p.is_veren, u.team_name, u.full_name
      FROM agenda a
      LEFT JOIN projects p ON a.project_id = p.id
      LEFT JOIN users u ON a.saha_ekibi_id = u.id
      WHERE a.tarih BETWEEN ? AND ?
      ORDER BY a.tarih ASC
    `
    params.push(startDate, endDate)
  }

  const stmt = params.length > 0 ? DB.prepare(query).bind(...params) : DB.prepare(query)
  const { results } = await stmt.all()

  return c.json({ agenda: results || [] })
})

// ==================== FIELD DATA APIs ====================

// Generic field data getter
const getFieldData = async (DB: D1Database, table: string, projectId: string) => {
  const { results } = await DB.prepare(`SELECT * FROM ${table} WHERE project_id = ? ORDER BY id ASC`)
    .bind(projectId)
    .all()
  return results || []
}

// Generic field data creator
const createFieldData = async (DB: D1Database, table: string, projectId: string, data: any, userId: number) => {
  const fields = Object.keys(data).filter(k => k !== 'project_id')
  const placeholders = fields.map(() => '?').join(', ')
  const values = fields.map(k => data[k])

  const result = await DB.prepare(`
    INSERT INTO ${table} (project_id, ${fields.join(', ')}, created_by)
    VALUES (?, ${placeholders}, ?)
  `).bind(projectId, ...values, userId).run()

  return result.meta.last_row_id
}

// Kolon Sıyırma
app.get('/api/field/kolon-siyirma/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const data = await getFieldData(DB, 'kolon_siyirma', projectId)
  return c.json({ data })
})

app.post('/api/field/kolon-siyirma/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])
  
  const data = await c.req.json()
  const id = await createFieldData(DB, 'kolon_siyirma', projectId, data, userId)
  
  return c.json({ success: true, id })
})

// Perde Sıyırma
app.get('/api/field/perde-siyirma/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const data = await getFieldData(DB, 'perde_siyirma', projectId)
  return c.json({ data })
})

app.post('/api/field/perde-siyirma/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])
  
  const data = await c.req.json()
  const id = await createFieldData(DB, 'perde_siyirma', projectId, data, userId)
  
  return c.json({ success: true, id })
})

// Kolon Röntgen
app.get('/api/field/kolon-rontgen/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const data = await getFieldData(DB, 'kolon_rontgen', projectId)
  return c.json({ data })
})

app.post('/api/field/kolon-rontgen/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])
  
  const data = await c.req.json()
  const id = await createFieldData(DB, 'kolon_rontgen', projectId, data, userId)
  
  return c.json({ success: true, id })
})

// Perde Röntgen
app.get('/api/field/perde-rontgen/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const data = await getFieldData(DB, 'perde_rontgen', projectId)
  return c.json({ data })
})

app.post('/api/field/perde-rontgen/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])
  
  const data = await c.req.json()
  const id = await createFieldData(DB, 'perde_rontgen', projectId, data, userId)
  
  return c.json({ success: true, id })
})

// Karot
app.get('/api/field/karot/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const data = await getFieldData(DB, 'karot', projectId)
  return c.json({ data })
})

app.post('/api/field/karot/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])
  
  const data = await c.req.json()
  const id = await createFieldData(DB, 'karot', projectId, data, userId)
  
  return c.json({ success: true, id })
})

// Schmidt
app.get('/api/field/schmidt/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const data = await getFieldData(DB, 'schmidt', projectId)
  return c.json({ data })
})

app.post('/api/field/schmidt/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])
  
  const data = await c.req.json()
  const id = await createFieldData(DB, 'schmidt', projectId, data, userId)
  
  return c.json({ success: true, id })
})

// ==================== NOTIFICATIONS API ====================

// Get user notifications
app.get('/api/notifications', async (c) => {
  const { DB } = c.env
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const decoded = atob(token)
  const userId = parseInt(decoded.split(':')[0])

  const { results } = await DB.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).bind(userId).all()

  return c.json({ notifications: results || [] })
})

// Mark notification as read
app.put('/api/notifications/:id/read', async (c) => {
  const { DB } = c.env
  const notificationId = c.req.param('id')

  await DB.prepare('UPDATE notifications SET okundu = 1 WHERE id = ?')
    .bind(notificationId)
    .run()

  return c.json({ success: true })
})

// ==================== USERS API ====================

// Get all users (for coordinators)
app.get('/api/users', async (c) => {
  const { DB } = c.env
  
  const { results } = await DB.prepare(`
    SELECT id, username, full_name, role, team_name, active 
    FROM users 
    WHERE active = 1
    ORDER BY role, full_name
  `).all()

  return c.json({ users: results || [] })
})

// Get field team users
app.get('/api/users/field-teams', async (c) => {
  const { DB } = c.env
  
  const { results } = await DB.prepare(`
    SELECT id, username, full_name, team_name 
    FROM users 
    WHERE role = 'field_team' AND active = 1
    ORDER BY full_name
  `).all()

  return c.json({ field_teams: results || [] })
})

// Get reporters (for coordinator assignment)
app.get('/api/users/reporters', async (c) => {
  const { DB } = c.env
  
  const { results } = await DB.prepare(`
    SELECT id, username, full_name 
    FROM users 
    WHERE role = 'reporter' AND active = 1
    ORDER BY full_name
  `).all()

  return c.json({ reporters: results || [] })
})

// ==================== RÖLÖVE API ====================

// Get rölöve for project
app.get('/api/roloove/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')

  const roloove = await DB.prepare('SELECT * FROM roloove WHERE project_id = ?')
    .bind(projectId)
    .first()

  if (!roloove) {
    return c.json({ roloove: null, kolon_tanimlari: [], perde_tanimlari: [], kat_yukseklikleri: [] })
  }

  const { results: kolonlar } = await DB.prepare('SELECT * FROM kolon_tanimlari WHERE roloove_id = ? ORDER BY kolon_kodu')
    .bind(roloove.id).all()
  
  const { results: perdeler } = await DB.prepare('SELECT * FROM perde_tanimlari WHERE roloove_id = ? ORDER BY perde_kodu')
    .bind(roloove.id).all()

  const { results: katlar } = await DB.prepare('SELECT * FROM kat_yukseklikleri WHERE roloove_id = ? ORDER BY kat_no')
    .bind(roloove.id).all()

  return c.json({ 
    roloove, 
    kolon_tanimlari: kolonlar || [],
    perde_tanimlari: perdeler || [],
    kat_yukseklikleri: katlar || []
  })
})

// Create rölöve
app.post('/api/roloove/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])

  const data = await c.req.json()

  // Create rölöve
  const rolooveResult = await DB.prepare(`
    INSERT INTO roloove (project_id, roloove_image, inceleme_kati, kat_sayisi, bodrum_kat_sayisi, kolon_sayisi, perde_sayisi, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    projectId,
    data.roloove_image || null,
    data.inceleme_kati,
    data.kat_sayisi,
    data.bodrum_kat_sayisi || 0,
    data.kolon_sayisi,
    data.perde_sayisi,
    userId
  ).run()

  const rolooveId = rolooveResult.meta.last_row_id

  // Create kat yükseklikleri
  if (data.kat_yukseklikleri && data.kat_yukseklikleri.length > 0) {
    for (const kat of data.kat_yukseklikleri) {
      await DB.prepare(`
        INSERT INTO kat_yukseklikleri (roloove_id, kat_no, kat_adi, yukseklik)
        VALUES (?, ?, ?, ?)
      `).bind(rolooveId, kat.kat_no, kat.kat_adi, kat.yukseklik || null).run()
    }
  }

  // Create kolon tanımları
  if (data.kolon_tanimlari && data.kolon_tanimlari.length > 0) {
    for (const kolon of data.kolon_tanimlari) {
      await DB.prepare(`
        INSERT INTO kolon_tanimlari (roloove_id, kolon_kodu, genis_yuzey, dar_yuzey, yon_ters)
        VALUES (?, ?, ?, ?, ?)
      `).bind(rolooveId, kolon.kolon_kodu, kolon.genis_yuzey || null, kolon.dar_yuzey || null, kolon.yon_ters || 0).run()
    }
  }

  // Create perde tanımları
  if (data.perde_tanimlari && data.perde_tanimlari.length > 0) {
    for (const perde of data.perde_tanimlari) {
      await DB.prepare(`
        INSERT INTO perde_tanimlari (roloove_id, perde_kodu, uzunluk, kalinlik)
        VALUES (?, ?, ?, ?)
      `).bind(rolooveId, perde.perde_kodu, perde.uzunluk || null, perde.kalinlik || null).run()
    }
  }

  return c.json({ success: true, roloove_id: rolooveId })
})

// Update kolon boyutları
app.put('/api/roloove/kolon/:kolonId', async (c) => {
  const { DB } = c.env
  const kolonId = c.req.param('kolonId')
  const data = await c.req.json()

  await DB.prepare(`
    UPDATE kolon_tanimlari 
    SET genis_yuzey = ?, dar_yuzey = ?, yon_ters = ?
    WHERE id = ?
  `).bind(data.genis_yuzey, data.dar_yuzey, data.yon_ters || 0, kolonId).run()

  return c.json({ success: true })
})

// ==================== PHOTO API ====================

// Upload photo
app.post('/api/photos', async (c) => {
  const { DB } = c.env
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.substring(7) || ''
  const userId = parseInt(atob(token).split(':')[0])

  const data = await c.req.json()

  const result = await DB.prepare(`
    INSERT INTO fotograflar (
      project_id, eleman_tipi, eleman_id, eleman_kodu, 
      foto_tipi, foto_data, foto_adi, dosya_boyutu, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.project_id,
    data.eleman_tipi,
    data.eleman_id,
    data.eleman_kodu,
    data.foto_tipi,
    data.foto_data,
    data.foto_adi,
    data.dosya_boyutu || 0,
    userId
  ).run()

  return c.json({ success: true, photo_id: result.meta.last_row_id })
})

// Get photos for element
app.get('/api/photos/:projectId/:elemanKodu', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')
  const elemanKodu = c.req.param('elemanKodu')

  const { results } = await DB.prepare(`
    SELECT * FROM fotograflar 
    WHERE project_id = ? AND eleman_kodu = ?
    ORDER BY foto_tipi
  `).bind(projectId, elemanKodu).all()

  return c.json({ photos: results || [] })
})

// Get all photos for project (for reporter download)
app.get('/api/photos/project/:projectId', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('projectId')

  const { results } = await DB.prepare(`
    SELECT * FROM fotograflar 
    WHERE project_id = ?
    ORDER BY eleman_kodu, foto_tipi
  `).bind(projectId).all()

  return c.json({ photos: results || [] })
})

// Delete photo
app.delete('/api/photos/:id', async (c) => {
  const { DB } = c.env
  const photoId = c.req.param('id')

  await DB.prepare('DELETE FROM fotograflar WHERE id = ?').bind(photoId).run()

  return c.json({ success: true })
})

// ==================== FRONTEND ROUTES ====================

// Main page - Login or Dashboard
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
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
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
