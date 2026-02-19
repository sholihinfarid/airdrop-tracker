# 🪂 AirdropTrackr

Personal airdrop project tracker — web app lokal tanpa backend.

---

## 📁 Struktur Folder

```
airdrop-tracker/
│
├── index.html          ← Dashboard utama (tabel semua project)
├── detail.html         ← Halaman detail per project
│
├── css/
│   ├── variables.css   ← Design tokens, warna, font, badge, button base
│   ├── main.css        ← Layout dashboard, tabel, modal
│   └── detail.css      ← Layout halaman detail project
│
├── js/
│   ├── data.js         ← Layer data (localStorage: CRUD, logo, seed)
│   ├── main.js         ← Logic dashboard (render tabel, modal, filter, sort)
│   └── detail.js       ← Logic halaman detail (steps, status, logo)
│
└── assets/             ← (opsional) simpan gambar logo di sini
```

---

## 🚀 Cara Pakai

1. Buka folder `airdrop-tracker/` di VS Code
2. Buka `index.html` langsung di browser **ATAU** gunakan ekstensi
   **Live Server** di VS Code untuk hot-reload
3. Semua data tersimpan otomatis di **localStorage** browser

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| ➕ Tambah/Edit/Hapus | Kelola project airdrop |
| 🖼️ Logo upload | Pilih gambar dari folder lokal |
| 🔍 Detail page | Klik nama project → halaman detail |
| ✅ Cara pengerjaan | Tambah langkah, klik untuk centang selesai |
| 🔄 Update status | Potential / Confirmed / Claimed / Missed |
| ⭐ Favorit | Bintangkan project penting |
| 🔎 Filter & Search | Filter by status, task, nama |
| ↕️ Sort | Klik header kolom untuk sort |
| 📊 Stats bar | Total, Confirmed, Claimed, Total Cost |
| 💾 Auto-save | Data tidak hilang walau refresh |

---

## 🔧 Pengembangan di VS Code

```
Ekstensi yang direkomendasikan:
- Live Server (ritwickdey.LiveServer)
- Prettier (esbenp.prettier-vscode)
```

Untuk menjalankan:
- Klik kanan `index.html` → **Open with Live Server**

---

## 📦 Data Storage

- Project data  → `localStorage['airdrop_projects_v2']`
- Logo (base64) → `localStorage['airdrop_logos_v2']`

Untuk backup: buka DevTools → Application → Local Storage → copy nilai key di atas.
