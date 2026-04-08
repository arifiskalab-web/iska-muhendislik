# Yapı Risk Analizi Yönetim Sistemi

Şirket içi iş akışını hızlandıran, hataları düzelten ve daha hızlı kayıt tutabilen yapı risk analizi ve performans değerlendirmesi yönetim sistemi.

## 🌐 Erişim URL'leri

- **Geliştirme Ortamı**: https://3000-iqovlox7db4iyo99fr7qb-3c7ff1b5.sandbox.novita.ai
- **Production**: (Cloudflare Pages'e deploy edilecek)

## 📋 Proje Özeti

Bu sistem, inşaat mühendisliği alanında **RBTY 2019** ve **TBDY 2018** yönetmeliklerine göre yapı risk analizi ve performans değerlendirmesi yapan şirketler için geliştirilmiş kapsamlı bir iş akışı yönetim uygulamasıdır.

### Ana İş Akışı:
```
1. Koordinatör → Yeni İş Kaydı
2. Saha Ekibi → Bina Verilerini Toplama
3. Lab Teknisyeni → Deney Sonuçlarını Girme  
4. Raportör/Analizci → YAPNET Analizi ve Rapor
5. Muhasebe → Mali İşlemler
```

## 👥 Kullanıcı Rolleri ve Yetkiler

### 1. **Admin** (Sistem Yöneticisi)
- Tüm sistem yönetimi
- Kullanıcı ekleme/çıkarma
- Tam erişim

### 2. **Koordinatör**
- Yeni iş kaydı oluşturma
- Saha ekiplerine görev atama
- Ajanda yönetimi
- Tüm projeleri görüntüleme

### 3. **Saha Ekipleri** (3 Ekip)
- Özkan Şerafettin Bayram
- Kenan Hüseyin Zafer
- Hüsnü

**Yetkiler:**
- Atanan işleri görüntüleme
- Saha verilerini girme (Sıyırma, Röntgen, Karot, Schmidt)
- Kendi görevlerini tamamlama

### 4. **Laboratuvar Teknisyeni**
- Deney sonuçlarını girme
- Saha verilerini görüntüleme

### 5. **Raportör/Analizci**
- Tüm verileri görüntüleme
- YAPNET analiz sonuçlarını girme
- Raporlar hazırlama

### 6. **Muhasebe**
- Mali işlemler
- Fatura yönetimi
- Proje bazlı maliyet takibi

## 🔑 Test Kullanıcıları

| Kullanıcı Adı | Şifre | Rol |
|---------------|-------|-----|
| `admin` | `admin123` | Admin |
| `koordinator` | `koord123` | Koordinatör |
| `ozkan` | `ozkan123` | Saha Ekibi 1 |
| `kenan` | `kenan123` | Saha Ekibi 2 |
| `husnu` | `husnu123` | Saha Ekibi 3 |
| `lab` | `lab123` | Lab Teknisyeni |
| `raportör` | `rapor123` | Raportör |
| `muhasebe` | `muhasebe123` | Muhasebe |

## 📊 Veri Yapısı

### Projeler (Binalar) Tablosu
- İş No (otomatik artan)
- İşveren, Malik
- İl, İlçe, Adres, Ada, Parsel
- Yönetmelik (RBTY 2019 / TBDY 2018)
- Yapı Cinsi (Betonarme, Çelik, Yığma, Ahşap, Karma)
- Saha Tarihi, Saha Ekibi
- İşin Durumu (Beklemede, Sahada, Lab Bekliyor, Analizde, Tamamlandı)
- Raportör, YKN, Onay Durumu, Fiyat

### Saha Verileri
1. **Sıyırma** (Kolon + Perde)
   - Kolon/Perde No, Boyutlar
   - Donatı Çapı, Adet
   - Beton Sınıfı, Notlar

2. **Röntgen** (Kolon + Perde)
   - Kolon/Perde No, Kat
   - Donatı Sayısı, Donatı Çapı
   - Sargı Aralığı, Notlar

3. **Karot**
   - Numune No, Lokasyon, Kat
   - Çap, Uzunluk
   - Basınç Dayanımı (MPa)
   - Test Tarihi, Notlar

4. **Schmidt Çekici**
   - Test No, Lokasyon, Kat
   - 10 Okuma Değeri
   - Ortalama, Tahmini Dayanım
   - Test Tarihi, Notlar

### Analiz Sonuçları
- **RBTY 2019**: Riskli / Risksiz
- **TBDY 2018**: Göçme / Hemen Kullanım / Kontrollü Hasar / Güçlendirme

## 🎯 Tamamlanan Özellikler

✅ Rol bazlı kullanıcı sistemi ve yetkilendirme  
✅ Güvenli giriş sistemi (JWT benzeri token)  
✅ Koordinatör paneli - İş kaydı ve ajanda yönetimi  
✅ Saha ekibi paneli - Görev takibi ve veri girişi  
✅ Binalar listesi - Sabit başlık ve ilk 2 sütun  
✅ Ajanda görünümü - 3 saha ekibi için haftalık planlama  
✅ İl/İlçe seçimi (İstanbul varsayılan)  
✅ Otomatik iş numarası oluşturma  
✅ Saha ekiplerine otomatik bildirim  
✅ Saha tarihi 1 gün öncesi hatırlatma sistemi  

### 🆕 Yeni Eklenen Özellikler:

✅ **Rölöve Sekmesi:**
- Kamera ile fotoğraf çekme veya galeriden seçme
- İnceleme katı seçimi (10. Bodrum'dan 30. Kata kadar)
- Kat sayısı ve bodrum kat sayısı girişi
- Kolon ve perde sayısı belirleme
- Kat yüksekliklerini girme
- **Otomatik kolon isimlendirme** (SZ01, SZ02... format)
- Kolon boyutları (geniş/dar yüzey) girişi
- Boyut değiştirme butonu (yön ters durumlar için)
- İlk girilen boyutun diğer kolonlara otomatik kopyalanması

✅ **Schmidt Çekici - Otomatik Değer Üretimi:**
- Ortalama değer (R_ort) elle girilir
- Sapma aralığı seçimi (±8 gibi)
- R1'den R10'a kadar değerler otomatik üretilir
- Değerler ortalamaya göre ±sapma aralığında rastgele oluşturulur

✅ **Karot - Otomatik Hesaplama:**
- Çap (mm), Boy (mm), Kırılma Yükü (kN) elle girilir
- **fb (MPa)** otomatik hesaplanır: F/A formülü
- **fck (MPa)** otomatik hesaplanır: fb × 0.85
- Eleman kodu ve kat bilgisi

✅ **Güncellenen Veritabanı Şeması:**
- Rölöve tablosu (resim, kat bilgileri)
- Kat yükseklikleri tablosu
- Kolon tanımları (kod, boyutlar, yön)
- Perde tanımları
- Güncellenmiş Schmidt ve Karot tabloları

✅ Kolon ve Perde Sıyırma veri girişi  
✅ Kolon ve Perde Röntgen veri girişi  
✅ Karot deneyi veri girişi (otomatik hesaplama ile)  
✅ Schmidt çekici deneyi veri girişi (otomatik değer üretimi ile)  
✅ Cloudflare D1 SQLite veritabanı entegrasyonu  

## 🚧 Devam Eden Geliştirmeler

- [ ] Sıyırma ve Röntgen alt sekmeleri (Kolon/Perde ayrımı)
- [ ] Kolon sıyırma detaylı formu (geniş/dar yüzey, donatı, etriye, pas payı, okunan çap)
- [ ] Perde sıyırma ve röntgen formları
- [ ] Laboratuvar teknisyeni paneli
- [ ] Raportör paneli ve analiz sonucu girişi
- [ ] İş akışı durumları (Sahada → Lab → Raportör)
- [ ] Koordinatör tarafından raportör ataması

## 🚧 Gelecek Geliştirmeler

- [ ] Laboratuvar teknisyeni paneli
- [ ] Raportör paneli ve analiz sonucu girişi
- [ ] Muhasebe modülü (gelir/gider/fatura takibi)
- [ ] Dosya yükleme (fotoğraflar, YAPNET dosyaları, raporlar)
- [ ] Müşteri yönetimi modülü
- [ ] Excel export/import özellikleri
- [ ] Gelişmiş raporlama ve filtreleme
- [ ] E-posta/SMS bildirim entegrasyonu
- [ ] Mobil responsive iyileştirmeler

## 🛠️ Teknoloji Yığını

- **Backend**: Hono Framework (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript + TailwindCSS
- **Icons**: Font Awesome
- **HTTP Client**: Axios
- **Deployment**: Cloudflare Pages
- **Development**: Wrangler CLI, PM2

## 📦 Kurulum ve Çalıştırma

### Geliştirme Ortamı

```bash
# Bağımlılıkları yükle
npm install

# Veritabanı migration'ları uygula
npm run db:migrate:local

# Build
npm run build

# Portu temizle
npm run clean-port

# PM2 ile başlat
pm2 start ecosystem.config.cjs

# Test et
curl http://localhost:3000
```

### Production Deployment (Cloudflare Pages)

```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name webapp
```

## 📖 Kullanım Kılavuzu

### Koordinatör İçin:

1. **Giriş**: `koordinator / koord123` ile giriş yapın
2. **Yeni İş**: "Yeni İş" sekmesinden işveren bilgilerini girin
3. **Saha Atama**: Saha ekibi ve tarih seçin
4. **Ajanda**: "Ajanda" sekmesinden planlamayı görün
5. **Takip**: "Binalar" sekmesinden tüm işleri takip edin

### Saha Ekibi İçin:

1. **Giriş**: Kendi kullanıcı adı/şifreniz ile giriş yapın
2. **Görevler**: "Görevlerim" sekmesinde atanan işleri görün
3. **İş Seç**: Bir işe tıklayıp "Veri Gir" butonuna basın
4. **Veri Giriş**: İlgili sekmelere (Sıyırma, Röntgen, Karot, Schmidt) verileri girin
5. **Tamamla**: Tüm veriler girildikten sonra durumu güncelleyin

## 🗃️ Veritabanı Tabloları

- `users` - Kullanıcılar ve roller
- `projects` - Bina projeleri
- `agenda` - Saha planlaması
- `kolon_siyirma` - Kolon sıyırma verileri
- `perde_siyirma` - Perde sıyırma verileri
- `kolon_rontgen` - Kolon röntgen verileri
- `perde_rontgen` - Perde röntgen verileri
- `karot` - Karot deneyi verileri
- `schmidt` - Schmidt çekici verileri
- `analiz_sonuclari` - Analiz sonuçları
- `muhasebe` - Mali işlemler
- `notifications` - Kullanıcı bildirimleri

## 📞 Destek

Herhangi bir sorunuz veya öneriniz için lütfen iletişime geçin.

## 📝 Lisans

Bu proje özel şirket kullanımı için geliştirilmiştir.

---

**Son Güncelleme**: 8 Nisan 2026  
**Versiyon**: 1.0.0  
**Durum**: ✅ Aktif (Geliştirme Ortamı)
