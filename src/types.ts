// Cloudflare D1 Database Binding
export type Bindings = {
  DB: D1Database;
}

// User Roles
export type UserRole = 'admin' | 'coordinator' | 'field_team' | 'lab_tech' | 'reporter' | 'accountant';

// User Interface
export interface User {
  id: number;
  username: string;
  password?: string;
  full_name: string;
  role: UserRole;
  team_name?: string;
  active: number;
  created_at: string;
}

// Project Interface
export interface Project {
  id: number;
  is_no: string;
  is_veren?: string;
  malik?: string;
  il?: string;
  ilce?: string;
  adres?: string;
  ada?: string;
  parsel?: string;
  yonetmelik?: string;
  din_cinsi?: string;
  sahaya_gidilen_tarih?: string;
  saha_ekibi?: string;
  saha_ekibi_id?: number;
  raporu_hazirlayan?: string;
  raportoru_id?: number;
  yapi_kimlik_no?: string;
  durum?: string;
  onay_durumu?: string;
  fiyat?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Agenda Interface
export interface Agenda {
  id: number;
  project_id: number;
  saha_ekibi_id: number;
  tarih: string;
  durum: string;
  notlar?: string;
  created_at?: string;
}

// Rölöve Interface
export interface Roloove {
  id: number;
  project_id: number;
  roloove_image?: string;
  inceleme_kati?: string;
  kat_sayisi?: number;
  bodrum_kat_sayisi?: number;
  kolon_sayisi?: number;
  perde_sayisi?: number;
  created_by?: number;
  created_at?: string;
}

export interface KatYuksekligi {
  id: number;
  roloove_id: number;
  kat_no: number;
  kat_adi: string;
  yukseklik?: number;
}

export interface KolonTanimi {
  id: number;
  roloove_id: number;
  kolon_kodu: string;
  genis_yuzey?: number;
  dar_yuzey?: number;
  yon_ters?: number;
}

export interface PerdeTanimi {
  id: number;
  roloove_id: number;
  perde_kodu: string;
  uzunluk?: number;
  kalinlik?: number;
}

// Field Data Interfaces
export interface KolonSiyirma {
  id: number;
  project_id: number;
  kolon_kodu: string;
  genis_yuzey?: number;
  dar_yuzey?: number;
  donati_capi?: string;
  etriye_capi?: string;
  etriye_aralik?: number;
  pas_payi?: number;
  okunan_cap?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface PerdeSiyirma {
  id: number;
  project_id: number;
  perde_kodu: string;
  uzunluk?: number;
  kalinlik?: number;
  donati_capi?: string;
  donati_adedi?: number;
  etriye_capi?: string;
  etriye_aralik?: number;
  pas_payi?: number;
  okunan_cap?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface KolonRontgen {
  id: number;
  project_id: number;
  kolon_kodu: string;
  kat?: string;
  donati_sayisi?: number;
  donati_capi?: string;
  sargi_araligi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface PerdeRontgen {
  id: number;
  project_id: number;
  perde_kodu: string;
  kat?: string;
  donati_sayisi?: number;
  donati_capi?: string;
  sargi_araligi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface Karot {
  id: number;
  project_id: number;
  karot_no?: string;
  eleman_kodu?: string;
  kat?: string;
  cap_mm?: number;
  boy_mm?: number;
  kirilma_yuku_kn?: number;
  fb_mpa?: number;
  fck_mpa?: number;
  test_tarihi?: string;
  lab_tamamlandi?: number;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface Schmidt {
  id: number;
  project_id: number;
  eleman_tipi?: string;
  eleman_kodu?: string;
  kat?: string;
  karot_var_mi?: number;
  r_ort?: number;
  sapma_aralik?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  r4?: number;
  r5?: number;
  r6?: number;
  r7?: number;
  r8?: number;
  r9?: number;
  r10?: number;
  test_tarihi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

// Notification Interface
export interface Notification {
  id: number;
  user_id: number;
  project_id?: number;
  baslik: string;
  mesaj: string;
  tip: string;
  okundu: number;
  created_at?: string;
}
