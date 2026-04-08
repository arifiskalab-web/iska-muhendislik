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

// Field Data Interfaces
export interface KolonSiyirma {
  id: number;
  project_id: number;
  kolon_no?: string;
  kolon_boyutlari?: string;
  donatı_çapı?: string;
  adet?: number;
  beton_sinifi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface PerdeSiyirma {
  id: number;
  project_id: number;
  perde_no?: string;
  perde_boyutlari?: string;
  donatı_çapı?: string;
  adet?: number;
  beton_sinifi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface KolonRontgen {
  id: number;
  project_id: number;
  kolon_no?: string;
  kat?: string;
  donatı_sayisi?: number;
  donatı_çapı?: string;
  sargı_araligi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface PerdeRontgen {
  id: number;
  project_id: number;
  perde_no?: string;
  kat?: string;
  donatı_sayisi?: number;
  donatı_çapı?: string;
  sargı_araligi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface Karot {
  id: number;
  project_id: number;
  numune_no?: string;
  lokasyon?: string;
  kat?: string;
  cap?: number;
  uzunluk?: number;
  basınc_dayanimi?: number;
  test_tarihi?: string;
  notlar?: string;
  created_by?: number;
  created_at?: string;
}

export interface Schmidt {
  id: number;
  project_id: number;
  test_no?: string;
  lokasyon?: string;
  kat?: string;
  okuma_1?: number;
  okuma_2?: number;
  okuma_3?: number;
  okuma_4?: number;
  okuma_5?: number;
  okuma_6?: number;
  okuma_7?: number;
  okuma_8?: number;
  okuma_9?: number;
  okuma_10?: number;
  ortalama?: number;
  tahmini_dayanim?: number;
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
