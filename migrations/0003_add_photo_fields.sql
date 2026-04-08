-- Kolon Sıyırma tablosuna fotoğraf alanları ekle
ALTER TABLE kolon_siyirma ADD COLUMN foto_gorunum TEXT;
ALTER TABLE kolon_siyirma ADD COLUMN foto_donati_capi TEXT;
ALTER TABLE kolon_siyirma ADD COLUMN foto_etriye_capi TEXT;
ALTER TABLE kolon_siyirma ADD COLUMN foto_korozyon TEXT;
ALTER TABLE kolon_siyirma ADD COLUMN foto_etriye_araligi TEXT;

-- Perde Sıyırma tablosuna fotoğraf alanları ekle
ALTER TABLE perde_siyirma ADD COLUMN foto_gorunum TEXT;
ALTER TABLE perde_siyirma ADD COLUMN foto_donati_capi TEXT;
ALTER TABLE perde_siyirma ADD COLUMN foto_etriye_capi TEXT;
ALTER TABLE perde_siyirma ADD COLUMN foto_korozyon TEXT;
ALTER TABLE perde_siyirma ADD COLUMN foto_etriye_araligi TEXT;

-- Kolon Röntgen tablosuna fotoğraf alanı ekle
ALTER TABLE kolon_rontgen ADD COLUMN foto_rontgen TEXT;

-- Perde Röntgen tablosuna fotoğraf alanı ekle
ALTER TABLE perde_rontgen ADD COLUMN foto_rontgen TEXT;

-- Fotoğraflar tablosu (tüm fotoğrafları merkezi yönetim için)
CREATE TABLE IF NOT EXISTS fotograflar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  eleman_tipi TEXT NOT NULL, -- 'kolon_siyirma', 'perde_siyirma', 'kolon_rontgen', 'perde_rontgen'
  eleman_id INTEGER NOT NULL, -- İlgili tablonun ID'si
  eleman_kodu TEXT NOT NULL, -- 'SZ01', 'PZ01' vs.
  foto_tipi TEXT NOT NULL, -- 'gorunum', 'donati_capi', 'etriye_capi', 'korozyon', 'etriye_araligi', 'rontgen'
  foto_data TEXT NOT NULL, -- Base64 sıkıştırılmış fotoğraf
  foto_adi TEXT NOT NULL, -- 'SZ01_kolon_gorunumu.jpg'
  dosya_boyutu INTEGER, -- Bytes cinsinden
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_fotograflar_project ON fotograflar(project_id);
CREATE INDEX IF NOT EXISTS idx_fotograflar_eleman ON fotograflar(eleman_kodu);
