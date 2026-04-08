-- Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'coordinator', 'field_team', 'lab_tech', 'reporter', 'accountant'
  team_name TEXT, -- Saha ekibi için: 'ÖZKAN ŞERAFETTİN BAYRAM', 'KENAN HÜSEYİN ZAFER', 'HÜSNÜ'
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projeler (Binalar) Tablosu
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_no TEXT UNIQUE NOT NULL, -- İş No (otomatik)
  is_veren TEXT, -- İşveren
  malik TEXT, -- Malik
  il TEXT DEFAULT 'İstanbul', -- İl
  ilce TEXT, -- İlçe
  adres TEXT, -- Adres
  ada TEXT, -- Ada
  parsel TEXT, -- Parsel
  yonetmelik TEXT, -- 'RBTY 2019' veya 'TBDY 2018'
  din_cinsi TEXT, -- 'Betonarme', 'Çelik', 'Yığma', 'Ahşap', 'Karma'
  sahaya_gidilen_tarih DATE, -- Saha Tarihi
  saha_ekibi TEXT, -- Saha Ekibi
  saha_ekibi_id INTEGER, -- Saha ekibi user ID
  raporu_hazirlayan TEXT, -- Raportör adı
  raportoru_id INTEGER, -- Raportör user ID
  yapi_kimlik_no TEXT, -- YKN
  durum TEXT DEFAULT 'Beklemede', -- 'Beklemede', 'Sahada', 'Lab Bekliyor', 'Analizde', 'Tamamlandı'
  onay_durumu TEXT, -- Onay Durumu
  fiyat DECIMAL(10,2), -- Fiyat
  
  -- Koordinatör bilgileri
  created_by INTEGER, -- Koordinatör user ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (saha_ekibi_id) REFERENCES users(id),
  FOREIGN KEY (raportoru_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Ajanda Tablosu
CREATE TABLE IF NOT EXISTS agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  saha_ekibi_id INTEGER NOT NULL,
  tarih DATE NOT NULL,
  durum TEXT DEFAULT 'Planlandı', -- 'Planlandı', 'Tamamlandı', 'İptal'
  notlar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (saha_ekibi_id) REFERENCES users(id)
);

-- Sıyırma Verileri - Kolon
CREATE TABLE IF NOT EXISTS kolon_siyirma (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  kolon_no TEXT,
  kolon_boyutlari TEXT, -- Örn: "30x30"
  donatı_çapı TEXT,
  adet INTEGER,
  beton_sinifi TEXT,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sıyırma Verileri - Perde
CREATE TABLE IF NOT EXISTS perde_siyirma (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  perde_no TEXT,
  perde_boyutlari TEXT, -- Örn: "200x20"
  donatı_çapı TEXT,
  adet INTEGER,
  beton_sinifi TEXT,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Röntgen Verileri - Kolon
CREATE TABLE IF NOT EXISTS kolon_rontgen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  kolon_no TEXT,
  kat TEXT,
  donatı_sayisi INTEGER,
  donatı_çapı TEXT,
  sargı_araligi TEXT,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Röntgen Verileri - Perde
CREATE TABLE IF NOT EXISTS perde_rontgen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  perde_no TEXT,
  kat TEXT,
  donatı_sayisi INTEGER,
  donatı_çapı TEXT,
  sargı_araligi TEXT,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Karot Verileri
CREATE TABLE IF NOT EXISTS karot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  numune_no TEXT,
  lokasyon TEXT,
  kat TEXT,
  cap DECIMAL(5,2), -- cm cinsinden
  uzunluk DECIMAL(5,2), -- cm cinsinden
  basınc_dayanimi DECIMAL(6,2), -- MPa
  test_tarihi DATE,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Schmidt Verileri
CREATE TABLE IF NOT EXISTS schmidt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  test_no TEXT,
  lokasyon TEXT,
  kat TEXT,
  okuma_1 INTEGER,
  okuma_2 INTEGER,
  okuma_3 INTEGER,
  okuma_4 INTEGER,
  okuma_5 INTEGER,
  okuma_6 INTEGER,
  okuma_7 INTEGER,
  okuma_8 INTEGER,
  okuma_9 INTEGER,
  okuma_10 INTEGER,
  ortalama DECIMAL(5,2),
  tahmini_dayanim DECIMAL(6,2), -- MPa
  test_tarihi DATE,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Analiz Sonuçları
CREATE TABLE IF NOT EXISTS analiz_sonuclari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  raportoru_id INTEGER NOT NULL,
  
  -- RBTY 2019 için
  rbty_sonuc TEXT, -- 'Riskli' veya 'Risksiz'
  
  -- TBDY 2018 için
  tbdy_sonuc TEXT, -- 'Göçme', 'Hemen Kullanım', 'Kontrollü Hasar', 'Güçlendirme'
  
  yapnet_dosya_adi TEXT,
  rapor_dosya_adi TEXT,
  sonuc_aciklama TEXT,
  analiz_tarihi DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (raportoru_id) REFERENCES users(id)
);

-- Muhasebe Kayıtları
CREATE TABLE IF NOT EXISTS muhasebe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  islem_tipi TEXT NOT NULL, -- 'Gelir', 'Gider', 'Ödeme'
  tutar DECIMAL(10,2) NOT NULL,
  aciklama TEXT,
  fatura_no TEXT,
  fatura_tarihi DATE,
  odeme_durumu TEXT DEFAULT 'Bekliyor', -- 'Bekliyor', 'Ödendi', 'Kısmi'
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bildirimler Tablosu
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  baslik TEXT NOT NULL,
  mesaj TEXT NOT NULL,
  tip TEXT DEFAULT 'bilgi', -- 'bilgi', 'uyarı', 'hatırlatma'
  okundu INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_projects_is_no ON projects(is_no);
CREATE INDEX IF NOT EXISTS idx_projects_durum ON projects(durum);
CREATE INDEX IF NOT EXISTS idx_projects_saha_ekibi ON projects(saha_ekibi_id);
CREATE INDEX IF NOT EXISTS idx_agenda_tarih ON agenda(tarih);
CREATE INDEX IF NOT EXISTS idx_agenda_ekip ON agenda(saha_ekibi_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, okundu);

-- Varsayılan Kullanıcılar Ekle
INSERT INTO users (username, password, full_name, role) VALUES 
  ('admin', 'admin123', 'Sistem Yöneticisi', 'admin'),
  ('koordinator', 'koord123', 'Koordinatör', 'coordinator'),
  ('ozkan', 'ozkan123', 'Özkan Şerafettin Bayram', 'field_team'),
  ('kenan', 'kenan123', 'Kenan Hüseyin Zafer', 'field_team'),
  ('husnu', 'husnu123', 'Hüsnü', 'field_team'),
  ('lab', 'lab123', 'Laboratuvar Teknisyeni', 'lab_tech'),
  ('raportör', 'rapor123', 'Raportör', 'reporter'),
  ('muhasebe', 'muhasebe123', 'Muhasebe', 'accountant');

-- Saha ekibi için team_name güncelle
UPDATE users SET team_name = 'ÖZKAN ŞERAFETTİN BAYRAM' WHERE username = 'ozkan';
UPDATE users SET team_name = 'KENAN HÜSEYİN ZAFER' WHERE username = 'kenan';
UPDATE users SET team_name = 'HÜSNÜ' WHERE username = 'husnu';
