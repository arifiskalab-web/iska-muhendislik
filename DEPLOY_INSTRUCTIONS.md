# 🚀 Yapı Risk Analizi - Cloudflare Pages Deploy Rehberi

## Seçenek A: GitHub + Cloudflare Otomatik Deploy

### 1. GitHub Repository Oluştur
1. https://github.com/new adresine git
2. Repository adı: `yapi-risk-analizi`
3. Public veya Private seç
4. "Create repository" tıkla

### 2. Kodu GitHub'a Push Et

Terminalden (projenin içinde):

```bash
# Git remote ekle (REPO_URL yerine kendi repo URL'inizi yazın)
git remote add origin https://github.com/KULLANICI_ADI/yapi-risk-analizi.git

# Ana branch'i ayarla
git branch -M main

# Kodu push et
git push -u origin main
```

### 3. Cloudflare Pages'e Bağla

1. https://dash.cloudflare.com/login adresine git
2. Sol menüden "Workers & Pages" seç
3. "Create application" → "Pages" → "Connect to Git"
4. GitHub hesabını bağla
5. Repository'yi seç: `yapi-risk-analizi`
6. Build ayarları:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
7. "Save and Deploy" tıkla

### 4. Environment Variables (Opsiyonel)

Cloudflare Pages dashboard'da:
- Settings → Environment variables
- D1 Database binding ekle (production için)

### 5. Custom Domain (Opsiyonel)

- Custom domains → Add
- Kendi domain'inizi ekleyin

---

## Seçenek B: Doğrudan Wrangler CLI Deploy

### 1. Cloudflare API Token Al

1. https://dash.cloudflare.com/profile/api-tokens
2. "Create Token"
3. "Edit Cloudflare Workers" şablonunu seç
4. VEYA Custom token ile:
   - Account → Cloudflare Pages → Edit
   - User → User Details → Read
5. Token'ı kopyala

### 2. Token'ı Kaydet

Deploy sekmesinde Cloudflare API Token'ı kaydet.

### 3. Deploy Et

```bash
# Production database oluştur
npx wrangler d1 create webapp-production

# Database ID'yi wrangler.jsonc'ye ekle

# Deploy
npm run deploy:prod
```

---

## 📦 Proje Yapısı

```
webapp/
├── src/
│   ├── index.tsx          # Backend API
│   └── types.ts           # TypeScript types
├── public/
│   └── static/
│       └── app.js         # Frontend
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_update_schema_roloove.sql
│   └── 0003_add_photo_fields.sql
├── wrangler.jsonc         # Cloudflare config
├── package.json
└── README.md
```

## 🔑 Test Kullanıcıları

| Rol | Username | Password |
|-----|----------|----------|
| Koordinatör | koordinator | koord123 |
| Saha 1 | ozkan | ozkan123 |
| Saha 2 | kenan | kenan123 |
| Saha 3 | husnu | husnu123 |
| Lab | lab | lab123 |
| Raportör | raportör | rapor123 |
| Muhasebe | muhasebe | muhasebe123 |
| Admin | admin | admin123 |

## 🎯 Deploy Sonrası

Cloudflare Pages URL'iniz:
- Production: `https://yapi-risk-analizi.pages.dev`
- Preview: `https://COMMIT_ID.yapi-risk-analizi.pages.dev`

## 🐛 Sorun Giderme

### Build Hatası
```bash
npm run build
# Hata varsa düzelt ve tekrar push et
```

### Database Hatası
```bash
# Migrations'ı kontrol et
npx wrangler d1 migrations list webapp-production
npx wrangler d1 migrations apply webapp-production
```

### API Hatası
- Cloudflare dashboard'da logs kontrol et
- D1 binding'i kontrol et

## 📞 Destek

Sorun yaşarsanız:
1. README.md'yi okuyun
2. Cloudflare docs: https://developers.cloudflare.com/pages/
3. Wrangler docs: https://developers.cloudflare.com/workers/wrangler/
