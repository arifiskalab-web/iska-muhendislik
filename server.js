import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// DB
const db = new Database(join(__dirname, 'database.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Migrations
const migrations = ['0001_initial_schema.sql', '0002_update_schema_roloove.sql', '0003_add_photo_fields.sql']
for (const m of migrations) {
  try {
    const sql = readFileSync(join(__dirname, 'migrations', m), 'utf-8')
    for (const stmt of sql.split(';').filter(s => s.trim())) {
      try { db.exec(stmt) } catch(e) {}
    }
    console.log('OK:', m)
  } catch(e) { console.log('SKIP:', m, e.message) }
}
console.log('DB ready')

// Read app.js and build full HTML at startup
const appJs = readFileSync(join(__dirname, 'public/static/app.js'), 'utf-8')

const HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yapi Risk Analizi</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
</head>
<body class="bg-gray-100">
<div id="app"></div>
<script>
${appJs}
</script>
</body>
</html>`

const app = new Hono()
app.use('/*', cors())

// AUTH
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  const user = db.prepare('SELECT id,username,full_name,role,team_name FROM users WHERE username=? AND password=? AND active=1').get(username, password)
  if (!user) return c.json({ error: 'Kullanıcı adı veya şifre hatalı' }, 401)
  const token = btoa(user.id + ':' + user.username + ':' + Date.now())
  return c.json({ success: true, user, token })
})

app.get('/api/auth/me', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const [userId] = atob(auth.substring(7)).split(':')
    const user = db.prepare('SELECT id,username,full_name,role,team_name FROM users WHERE id=? AND active=1').get(parseInt(userId))
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    return c.json({ user })
  } catch { return c.json({ error: 'Unauthorized' }, 401) }
})

// PROJECTS
app.get('/api/projects', (c) => c.json({ projects: db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() }))

app.post('/api/projects', async (c) => {
  const data = await c.req.json()
  const auth = c.req.header('Authorization')
  let createdBy = null
  if (auth?.startsWith('Bearer ')) { try { createdBy = parseInt(atob(auth.substring(7)).split(':')[0]) } catch {} }
  const cnt = db.prepare('SELECT COUNT(*) as n FROM projects').get().n
  const is_no = new Date().getFullYear() + '-' + String(cnt + 1).padStart(4, '0')
  const r = db.prepare('INSERT INTO projects (is_no,is_veren,malik,il,ilce,adres,ada,parsel,yonetmelik,din_cinsi,sahaya_gidilen_tarih,saha_ekibi,saha_ekibi_id,raporu_hazirlayan,raportoru_id,yapi_kimlik_no,durum,fiyat,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(is_no,data.is_veren,data.malik,data.il,data.ilce,data.adres,data.ada,data.parsel,data.yonetmelik,data.din_cinsi,data.sahaya_gidilen_tarih,data.saha_ekibi,data.saha_ekibi_id,data.raporu_hazirlayan,data.raportoru_id,data.yapi_kimlik_no,data.durum||'Beklemede',data.fiyat,createdBy)
  return c.json({ success: true, project: db.prepare('SELECT * FROM projects WHERE id=?').get(r.lastInsertRowid) })
})

app.put('/api/projects/:id', async (c) => {
  const d = await c.req.json()
  db.prepare('UPDATE projects SET is_veren=?,malik=?,il=?,ilce=?,adres=?,ada=?,parsel=?,yonetmelik=?,din_cinsi=?,sahaya_gidilen_tarih=?,saha_ekibi=?,saha_ekibi_id=?,raporu_hazirlayan=?,raportoru_id=?,yapi_kimlik_no=?,durum=?,fiyat=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(d.is_veren,d.malik,d.il,d.ilce,d.adres,d.ada,d.parsel,d.yonetmelik,d.din_cinsi,d.sahaya_gidilen_tarih,d.saha_ekibi,d.saha_ekibi_id,d.raporu_hazirlayan,d.raportoru_id,d.yapi_kimlik_no,d.durum,d.fiyat,c.req.param('id'))
  return c.json({ success: true })
})

// USERS
app.get('/api/users', (c) => c.json({ users: db.prepare('SELECT id,username,full_name,role,team_name,active FROM users').all() }))

// AGENDA
app.get('/api/agenda', (c) => c.json({ agenda: db.prepare('SELECT a.*,p.is_no,p.adres FROM agenda a JOIN projects p ON a.project_id=p.id ORDER BY a.tarih DESC').all() }))
app.post('/api/agenda', async (c) => {
  const d = await c.req.json()
  const r = db.prepare('INSERT INTO agenda (project_id,saha_ekibi_id,tarih,durum,notlar) VALUES (?,?,?,?,?)').run(d.project_id,d.saha_ekibi_id,d.tarih,d.durum||'Planlandı',d.notlar)
  return c.json({ success: true, id: r.lastInsertRowid })
})

// FIELD DATA
const TABLES = {'kolon-siyirma':'kolon_siyirma','perde-siyirma':'perde_siyirma','kolon-rontgen':'kolon_rontgen','perde-rontgen':'perde_rontgen','schmidt':'schmidt','karot':'karot','roloove':'roloove','kolon-tanimlari':'kolon_tanimlari','perde-tanimlari':'perde_tanimlari'}

app.get('/api/field-data/:type/:pid', (c) => {
  const tbl = TABLES[c.req.param('type')]
  if (!tbl) return c.json({ error: 'Invalid' }, 400)
  const pid = c.req.param('pid')
  const data = (c.req.param('type').includes('tanimlari'))
    ? db.prepare(`SELECT kt.* FROM ${tbl} kt JOIN roloove r ON kt.roloove_id=r.id WHERE r.project_id=?`).all(pid)
    : db.prepare(`SELECT * FROM ${tbl} WHERE project_id=? ORDER BY created_at DESC`).all(pid)
  return c.json({ data })
})

app.post('/api/field-data/:type/:pid', async (c) => {
  const tbl = TABLES[c.req.param('type')]
  if (!tbl) return c.json({ error: 'Invalid' }, 400)
  const data = await c.req.json()
  const auth = c.req.header('Authorization')
  let createdBy = null
  if (auth?.startsWith('Bearer ')) { try { createdBy = parseInt(atob(auth.substring(7)).split(':')[0]) } catch {} }
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at')
  fields.push('project_id', 'created_by')
  const vals = fields.map(f => f === 'project_id' ? c.req.param('pid') : f === 'created_by' ? createdBy : data[f])
  try {
    const r = db.prepare(`INSERT INTO ${tbl} (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...vals)
    return c.json({ success: true, id: r.lastInsertRowid })
  } catch(e) { return c.json({ error: e.message }, 500) }
})

// PHOTOS
app.get('/api/photos/:pid', (c) => c.json({ photos: db.prepare('SELECT * FROM fotograflar WHERE project_id=? ORDER BY created_at DESC').all(c.req.param('pid')) }))
app.post('/api/photos/:pid', async (c) => {
  const d = await c.req.json()
  const auth = c.req.header('Authorization')
  let createdBy = null
  if (auth?.startsWith('Bearer ')) { try { createdBy = parseInt(atob(auth.substring(7)).split(':')[0]) } catch {} }
  const r = db.prepare('INSERT INTO fotograflar (project_id,eleman_tipi,eleman_id,eleman_kodu,foto_tipi,foto_data,foto_adi,dosya_boyutu,created_by) VALUES (?,?,?,?,?,?,?,?,?)').run(c.req.param('pid'),d.eleman_tipi,d.eleman_id,d.eleman_kodu,d.foto_tipi,d.foto_data,d.foto_adi,d.dosya_boyutu,createdBy)
  return c.json({ success: true, id: r.lastInsertRowid })
})

// NOTIFICATIONS
app.get('/api/notifications/:uid', (c) => c.json({ notifications: db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(c.req.param('uid')) }))
app.put('/api/notifications/:id/read', (c) => { db.prepare('UPDATE notifications SET okundu=1 WHERE id=?').run(c.req.param('id')); return c.json({ success: true }) })

// MUHASEBE
app.get('/api/muhasebe', (c) => c.json({ records: db.prepare('SELECT m.*,p.is_no FROM muhasebe m JOIN projects p ON m.project_id=p.id ORDER BY m.created_at DESC').all() }))
app.post('/api/muhasebe', async (c) => {
  const d = await c.req.json()
  const auth = c.req.header('Authorization')
  let createdBy = null
  if (auth?.startsWith('Bearer ')) { try { createdBy = parseInt(atob(auth.substring(7)).split(':')[0]) } catch {} }
  const r = db.prepare('INSERT INTO muhasebe (project_id,islem_tipi,tutar,aciklama,fatura_no,fatura_tarihi,odeme_durumu,created_by) VALUES (?,?,?,?,?,?,?,?)').run(d.project_id,d.islem_tipi,d.tutar,d.aciklama,d.fatura_no,d.fatura_tarihi,d.odeme_durumu||'Bekliyor',createdBy)
  return c.json({ success: true, id: r.lastInsertRowid })
})

// ANALIZ
app.get('/api/analiz/:pid', (c) => c.json({ analiz: db.prepare('SELECT * FROM analiz_sonuclari WHERE project_id=?').get(c.req.param('pid')) }))
app.post('/api/analiz/:pid', async (c) => {
  const pid = c.req.param('pid')
  const d = await c.req.json()
  const ex = db.prepare('SELECT id FROM analiz_sonuclari WHERE project_id=?').get(pid)
  if (ex) db.prepare('UPDATE analiz_sonuclari SET rbty_sonuc=?,tbdy_sonuc=?,sonuc_aciklama=?,analiz_tarihi=? WHERE project_id=?').run(d.rbty_sonuc,d.tbdy_sonuc,d.sonuc_aciklama,d.analiz_tarihi,pid)
  else db.prepare('INSERT INTO analiz_sonuclari (project_id,raportoru_id,rbty_sonuc,tbdy_sonuc,sonuc_aciklama,analiz_tarihi) VALUES (?,?,?,?,?,?)').run(pid,d.raportoru_id,d.rbty_sonuc,d.tbdy_sonuc,d.sonuc_aciklama,d.analiz_tarihi)
  return c.json({ success: true })
})

// FRONTEND - HTML with inline JS
app.get('/', (c) => c.html(HTML))
app.get('*', (c) => c.html(HTML))

const port = parseInt(process.env.PORT || '3000')
serve({ fetch: app.fetch, port })
console.log('Server running on port', port)
