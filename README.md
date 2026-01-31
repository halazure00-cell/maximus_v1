# Asisten Taksi Bandung

PWA offline-first untuk driver taksi online di Bandung. Fokus pada pencatatan trip, pendapatan, pengeluaran, jadwal, catatan, dan peta panas perjalanan berbasis OpenStreetMap.

## Fitur Utama

- Offline-first (IndexedDB sebagai sumber utama)
- Supabase auth + sinkronisasi data
- Peta panas perjalanan (Leaflet + OpenStreetMap)
- UI Bahasa Indonesia

## Persiapan

1. Buat file `.env` dari `.env.example`.
2. Jalankan skema database di Supabase: `supabase/schema.sql`.

## Menjalankan Aplikasi

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
