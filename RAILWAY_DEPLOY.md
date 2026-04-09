# 🚂 Railway.app Deployment Rehberi

## ✅ ADIM ADIM TALİMATLAR

### 1️⃣ Railway Hesabı Oluştur
1. **https://railway.app** adresine git
2. **"Start a New Project"** veya **"Login with GitHub"** tıkla
3. GitHub hesabınla giriş yap

### 2️⃣ Yeni Proje Oluştur
1. Dashboard'da **"New Project"** tıkla
2. **"Deploy from GitHub repo"** seç
3. Bu projeyi GitHub'a push etmiş olman lazım (aşağıda açıklandı)

### 3️⃣ GitHub'a Push (Eğer yapmadıysan)
```bash
# GitHub'da yeni repo oluştur: yapi-risk-analizi

# Local'de remote ekle
git remote add origin https://github.com/KULLANICI_ADIN/yapi-risk-analizi.git

# Push et
git branch -M main
git push -u origin main
```

### 4️⃣ Railway'de Deploy
1. Railway dashboard'da repoyu seç
2. **"Deploy Now"** tıkla
3. Railway otomatik olarak:
   - Dependencies yükler
   - Build yapar
   - Database migrate eder
   - Server başlatır

### 5️⃣ Domain Al
1. Deploy tamamlandıktan sonra
2. **"Settings"** → **"Domains"**
3. **"Generate Domain"** tıkla
4. Örnek URL: **https://yapi-risk-analizi-production.up.railway.app**

---

## 🎉 TAMAMLANDI!

Railway URL'ini tarayıcıda aç:
- **Kullanıcı**: koordinator
- **Şifre**: koord123

---

## 📊 Railway Avantajları
- ✅ **Ücretsiz $5 kredi/ay** (küçük projeler için yeterli)
- ✅ **Otomatik SSL** (HTTPS)
- ✅ **Otomatik deploy** (GitHub push ile)
- ✅ **SQLite database** (otomatik backup)
- ✅ **Türkiye'den mükemmel erişim**

---

## ❓ SORUN YAŞARSAN

Railway dashboard'da **"Deployments"** sekmesinden logs'u kontrol et.

Veya bana sor! 🚀
