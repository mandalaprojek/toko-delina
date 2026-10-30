# 🏪 Toko Online ATK & Jasa Fotokopi Delina

Marketplace perlengkapan alat tulis kantor (ATK) dan jasa fotokopi modern terpercaya, sejuk, dan beradab Islami. Dibangun dengan arsitektur **100% Serverless & Gratis** menggunakan GitHub Pages, Google Apps Script, Google Sheets, Google Drive, dan kecerdasan buatan Google Gemini.

---

## 🌐 Cara Akses Website Toko

### 1. Akses Live di GitHub Pages
- **Etalase Pelanggan:** `https://mandalaprojek.github.io/toko-delina/`
- **Portal Kasir & Super Admin:** `https://mandalaprojek.github.io/toko-delina/admin.html`
  * **PIN Kasir POS:** `1234` *(akses antrean pesanan, ubah status, quick stock +/- & cetak struk)*
  * **PIN Super Admin:** `9999` *(akses penuh omzet, tambah produk, edit tarif, kupon, profil toko)*

### 2. Akses Secara Lokal di Komputer / Tablet
1. Buka folder proyek ini di komputer atau tablet.
2. Buka berkas `index.html` langsung menggunakan peramban web (Google Chrome, Microsoft Edge, Firefox, atau Safari).
3. Website langsung siap digunakan dan terhubung secara live ke database Google Sheets Toko Delina.

---

## 🚀 Fitur Unggulan

1. **Etalase ATK Responsif & Adaptif:**
   - Desain modern bernuansa hijau Tokopedia (`#03AC0E`), emerald Islami (`#065f46`), dan aksen emas.
   - Responsif sempurna di layar HP pintar maupun tablet Samsung Galaxy Tab A9+ (portrait 800px dan landscape 1280px).
   - Bottom Navigation Bar 5 menu untuk kemudahan navigasi mobile.

2. **Mode Kasir Tablet (POS) & Cetak Struk Termal:**
   - Panel khusus kasir toko berproteksi PIN keamanan (default: 1234) untuk memantau pesanan real-time dari Google Sheets.
   - Ubah status pesanan menjadi Diproses, Siap Diambil, atau Selesai secara instan.
   - Cetak struk belanja fisik standar printer termal 58mm / 80mm via tombol cetak atau Bluetooth printer.
   - Kirim notifikasi WhatsApp otomatis ke pembeli saat pesanan "Siap Diambil".

3. **Sistem Diskon Grosir & Kupon Promo Otomatis:**
   - Diskon kuantiti otomatis (Beli 5+ diskon 5%, Beli 10+ diskon 8%, Beli 20+ diskon 12%).
   - Dukungan kode kupon promo berkah: `JUMATBERKAH`, `DELINABAROKAH`, `FOTOKOPILANCAR`, dan `DISKON5K`.

4. **Kalkulator Jasa Fotokopi & Cetak Kilat:**
   - Hitung estimasi biaya cetak hitam-putih, berwarna, dan jilid (lakban/spiral) secara otomatis.
   - Unggah file dokumen langsung (PDF, Word, Gambar) hingga 10 MB yang otomatis tersimpan rapi di Google Drive toko.

3. **Keranjang Belanja & Checkout QRIS:**
   - Rincian belanja transparan dengan opsi ambil di toko atau kurir pengantaran.
   - Pembayaran fleksibel via QRIS (mockup barcode dinamis) dan Transfer Bank (BCA) dengan tombol salin nomor rekening.
   - Unggah bukti transfer dengan kompresi Base64 aman.

4. **Asisten AI Kiko 24 Jam (Web Widget & Bot Telegram):**
   - Dilengkapi adab Islami yang santun dan jujur menyampaikan stok barang sesuai database Google Sheets.
   - Bot Telegram (`@KikoDelinaBot`) aktif melayani pertanyaan pelanggan kapan saja.
   - Notifikasi otomatis masuk ke Telegram pemilik toko saat ada pesanan baru.

---

## 🖨️ Panduan Cetak Struk ke Printer Thermal Bluetooth (ESC/POS 58mm / 80mm)

Website Toko Delina dilengkapi integrasi **Web Bluetooth API** murni untuk mencetak struk belanja langsung ke Printer Thermal Bluetooth (58mm / 80mm) seperti Panda, VSC, Iware, Eppos, Goojprt, Zjiang, atau printer kasir portable lainnya tanpa perlu install aplikasi driver tambahan!

### Langkah Menghubungkan Printer Bluetooth di HP / Tablet / Laptop:
1. **Nyalakan Printer:** Pastikan printer thermal Bluetooth sudah menyala dan terpasang kertas struk dengan benar.
2. **Aktifkan Bluetooth:** Nyalakan Bluetooth di smartphone / Samsung Galaxy Tab A9+ / Laptop Anda.
3. **Gunakan Browser Chromium:**
   - Rekomendasi: **Google Chrome** (Android, Windows, macOS, ChromeOS) atau **Samsung Internet Browser**.
   - *Catatan: Browser iOS Safari dari Apple saat ini belum mendukung Web Bluetooth API; bagi pengguna iOS, tersedia tombol alternatif cetak standar browser/PDF.*
4. **Klik Tombol "🖨️ Cetak Struk Thermal Bluetooth":**
   - Tombol ini tersedia di pop-up sukses pesanan pembeli, modal lacak nota, dan dashboard Kasir POS.
5. **Pilih Printer dari Dialog:**
   - Browser akan memunculkan dialog pencarian perangkat Bluetooth.
   - Pilih nama printer Anda (contoh: *RPP02N*, *POS-58*, *MTP-II*, *BlueTooth Printer*, dll) lalu klik **Pair / Hubungkan**.
6. **Struk Langsung Tercetak:**
   - Struk otomatis terformat rapi sesuai ukuran kertas (Nama Toko, No Nota, Rincian ATK/Jasa, Total, dan Catatan Islami).

---

## 📷 Panduan Scanner Barcode Kamera HP / Tablet (Kasir Cepat & Lembar Sakti)

Toko Delina 100% menggunakan kamera smartphone / Samsung Galaxy Tab A9+ via pustaka `html5-qrcode` CDN (tidak memerlukan hardware gun scanner terpisah):

1. **Synthesizer Audio Kasir:**
   - Menggunakan Web Audio API internal browser:
     * `beepSuccess()`: Nada frekuensi **1200Hz (0.08 detik)** saat barcode berhasil terbaca.
     * `beepError()`: Nada frekuensi **300Hz (0.2 detik)** saat barcode tidak terdaftar di katalog.
2. **Katalog & Stok:**
   - Klik **"📷 Scan Barcode Barang"** di tab Katalog.
   - Jika barcode **sudah ada**: Muncul jendela cepat **"Tambah Stok Masuk (+N)"** dengan tombol praktis (+5, +10, +25, +50, +100).
   - Jika barcode **belum ada**: Otomatis membuka form tambah barang baru dengan kode barcode/SKU terisi dan kursor langsung fokus ke nama barang.
3. **Kasir POS (Continuous Scan Mode):**
   - Klik **"📷 Buka Kamera Kasir"** di tab Antrean POS.
   - Kamera belakang tetap aktif secara berkelanjutan.
   - Dilengkapi jeda debounce **1.5 detik per pembacaan** agar barang tidak ter-scan dobel saat dihadapkan ke kamera.
   - Tiap scan langsung menambah item ke keranjang kasir secara real-time.
4. **Lembar Sakti Barcode Kasir:**
   - Klik **"🖨️ Cetak Lembar Sakti Barcode Kasir"** di tab Tarif Fotokopi.
   - Cetak selembar kertas berisi kode batang standar CODE128 (JsBarcode) untuk jasa fotokopi A4, F4, warna, jilid lakban, spiral, hardcover, dan laminating.
   - Kasir cukup mengarahkan kamera tablet ke kertas tersebut di meja kasir untuk memasukkan transaksi jasa cetak secara instan!

---

## 📁 Struktur Berkas Proyek

```text
├── index.html               # Pengarah otomatis (redirect) GitHub Pages ke folder frontend
├── README.md                # Panduan pengoperasian & ringkasan proyek
├── .gitignore               # Berkas pengabaian Git untuk keamanan data
│
├── frontend/                # Antarmuka Pengguna (GitHub Pages Static Hosting)
│   ├── index.html           # Halaman utama aplikasi toko
│   ├── css/
│   │   └── custom.css       # Gaya tampilan khusus, animasi, & dock navbar
│   └── js/
│       ├── config.js        # Konfigurasi endpoint Google Apps Script
│       └── app.js           # Logika interaktif belanja, fotokopi, & chat Kiko
│
└── backend-gas/             # Backend Serverless Google Apps Script
    ├── .clasp.json          # Konfigurasi CLASP deployment
    ├── appsscript.json      # Manifest konfigurasi Web App
    └── Code.gs              # Script Google Apps Script (Multi-router & AI)
```

---

## 🔒 Keamanan & Kerahasiaan Data

- Seluruh kunci rahasia (*Gemini API Key*, *Telegram Bot Token*, dan *Admin Chat ID*) **TIDAK PERNAH** disimpan di sisi frontend maupun kode sumber publik.
- Kunci rahasia dikelola secara terisolasi di sisi server Google melalui **Google Apps Script Script Properties**.
- Frontend hanya berkomunikasi melalui satu pintu aman yaitu URL Web App Google Apps Script.

---

*Alhamdulillah, Toko ATK & Fotokopi Delina siap melayani pelanggan dengan berkah dan amanah.*

