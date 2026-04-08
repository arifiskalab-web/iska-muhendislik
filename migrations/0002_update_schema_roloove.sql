-- Rölöve Tablosu
CREATE TABLE IF NOT EXISTS roloove (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  roloove_image TEXT, -- Base64 veya URL
  inceleme_kati TEXT, -- 'Zemin Kat', '1. Kat', vs.
  kat_sayisi INTEGER, -- Toplam kat sayısı
  bodrum_kat_sayisi INTEGER DEFAULT 0,
  kolon_sayisi INTEGER,
  perde_sayisi INTEGER,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Kat Yükseklikleri
CREATE TABLE IF NOT EXISTS kat_yukseklikleri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roloove_id INTEGER NOT NULL,
  kat_no INTEGER, -- -10 (10. bodrum) ile 30 (30. kat) arası
  kat_adi TEXT, -- '10. Bodrum Kat', 'Zemin Kat', '1. Kat'
  yukseklik DECIMAL(5,2), -- metre cinsinden
  
  FOREIGN KEY (roloove_id) REFERENCES roloove(id)
);

-- Kolon Tanımları (Rölöveden)
CREATE TABLE IF NOT EXISTS kolon_tanimlari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roloove_id INTEGER NOT NULL,
  kolon_kodu TEXT NOT NULL, -- 'SZ01', 'SZ02', vs.
  genis_yuzey DECIMAL(5,2), -- cm
  dar_yuzey DECIMAL(5,2), -- cm
  yon_ters INTEGER DEFAULT 0, -- 0: Normal, 1: Ters
  
  FOREIGN KEY (roloove_id) REFERENCES roloove(id)
);

-- Perde Tanımları (Rölöveden)
CREATE TABLE IF NOT EXISTS perde_tanimlari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roloove_id INTEGER NOT NULL,
  perde_kodu TEXT NOT NULL, -- 'PZ01', 'PZ02', vs.
  uzunluk DECIMAL(6,2), -- cm
  kalinlik DECIMAL(5,2), -- cm
  
  FOREIGN KEY (roloove_id) REFERENCES roloove(id)
);

-- Kolon Sıyırma tablosunu güncelle (DROP ve yeniden oluştur)
DROP TABLE IF EXISTS kolon_siyirma;
CREATE TABLE kolon_siyirma (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  kolon_kodu TEXT NOT NULL, -- 'SZ01', 'SZ02', vs.
  genis_yuzey DECIMAL(5,2), -- cm
  dar_yuzey DECIMAL(5,2), -- cm
  donati_capi TEXT, -- '14', '16', '20' vs.
  etriye_capi TEXT, -- '8', '10' vs.
  etriye_aralik DECIMAL(5,2), -- cm
  pas_payi DECIMAL(5,2), -- cm
  okunan_cap TEXT, -- Korozyon için
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Perde Sıyırma tablosunu güncelle
DROP TABLE IF EXISTS perde_siyirma;
CREATE TABLE perde_siyirma (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  perde_kodu TEXT NOT NULL,
  uzunluk DECIMAL(6,2), -- cm
  kalinlik DECIMAL(5,2), -- cm
  donati_capi TEXT,
  donati_adedi INTEGER,
  etriye_capi TEXT,
  etriye_aralik DECIMAL(5,2),
  pas_payi DECIMAL(5,2),
  okunan_cap TEXT,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Kolon Röntgen tablosunu güncelle
DROP TABLE IF EXISTS kolon_rontgen;
CREATE TABLE kolon_rontgen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  kolon_kodu TEXT NOT NULL,
  kat TEXT,
  donati_sayisi INTEGER,
  donati_capi TEXT,
  sargi_araligi TEXT,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Perde Röntgen tablosunu güncelle
DROP TABLE IF EXISTS perde_rontgen;
CREATE TABLE perde_rontgen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  perde_kodu TEXT NOT NULL,
  kat TEXT,
  donati_sayisi INTEGER,
  donati_capi TEXT,
  sargi_araligi TEXT,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Schmidt tablosunu güncelle
DROP TABLE IF EXISTS schmidt;
CREATE TABLE schmidt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  eleman_tipi TEXT, -- 'Kolon', 'Perde', 'Kiriş'
  eleman_kodu TEXT, -- 'SZ01', 'PZ01'
  kat TEXT,
  karot_var_mi INTEGER DEFAULT 0, -- 0: Yok, 1: Var
  r_ort DECIMAL(5,2), -- Elle girilen ortalama
  sapma_aralik INTEGER DEFAULT 8, -- ±8 gibi
  r1 INTEGER,
  r2 INTEGER,
  r3 INTEGER,
  r4 INTEGER,
  r5 INTEGER,
  r6 INTEGER,
  r7 INTEGER,
  r8 INTEGER,
  r9 INTEGER,
  r10 INTEGER,
  test_tarihi DATE,
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Karot tablosunu güncelle
DROP TABLE IF EXISTS karot;
CREATE TABLE karot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  karot_no TEXT, -- 'K1', 'K2'
  eleman_kodu TEXT, -- 'SZ01', 'PZ01'
  kat TEXT,
  cap_mm DECIMAL(5,2), -- mm cinsinden çap
  boy_mm DECIMAL(6,2), -- mm cinsinden boy
  kirilma_yuku_kn DECIMAL(8,2), -- kN cinsinden
  fb_mpa DECIMAL(6,2), -- Otomatik hesaplanacak (MPa)
  fck_mpa DECIMAL(6,2), -- Otomatik hesaplanacak (MPa)
  test_tarihi DATE,
  lab_tamamlandi INTEGER DEFAULT 0, -- Lab sonucu girildi mi
  notlar TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Durum tablosunu güncelle
-- projects tablosuna yeni durum değerleri ekle
-- 'Beklemede', 'Sahada', 'Lab Bekliyor', 'Lab İşlemde', 'Raportör Bekliyor', 'Analizde', 'Tamamlandı'

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_roloove_project ON roloove(project_id);
CREATE INDEX IF NOT EXISTS idx_kolon_tanimlari_roloove ON kolon_tanimlari(roloove_id);
CREATE INDEX IF NOT EXISTS idx_perde_tanimlari_roloove ON perde_tanimlari(roloove_id);
CREATE INDEX IF NOT EXISTS idx_kolon_siyirma_project ON kolon_siyirma(project_id);
CREATE INDEX IF NOT EXISTS idx_perde_siyirma_project ON perde_siyirma(project_id);
CREATE INDEX IF NOT EXISTS idx_kolon_rontgen_project ON kolon_rontgen(project_id);
CREATE INDEX IF NOT EXISTS idx_perde_rontgen_project ON perde_rontgen(project_id);
CREATE INDEX IF NOT EXISTS idx_schmidt_project ON schmidt(project_id);
CREATE INDEX IF NOT EXISTS idx_karot_project ON karot(project_id);
