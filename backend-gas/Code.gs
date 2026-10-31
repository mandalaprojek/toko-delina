/**
 * =========================================================================
 * BACKEND TOKO DELINA (Google Apps Script - Code.gs)
 * Marketplace ATK, Jasa Fotokopi & Portal Manajemen Kasir / Super Admin
 * Bot Telegram Kiko AI Canggih (Interactive Inline Keyboard & Callback Query)
 * Arsitektur Serverless 100% Gratis - Google Apps Script + Sheets + Drive + Gemini
 * =========================================================================
 */

// Konstanta Nama Tab Spreadsheet
const TAB_PRODUK = "Produk";
const TAB_PESANAN = "Pesanan";
const TAB_TARIF = "Tarif_Fotokopi";
const TAB_PENGATURAN = "Pengaturan";
const TAB_KUPON = "Kupon";
const TAB_MEMBER = "Member";
const TAB_HADIAH = "Hadiah_Royalty";
const TAB_KLAIM = "Klaim_Hadiah";
const TAB_KATEGORI = "Kategori";

// Konstanta Nama Folder Google Drive Penyimpanan
const FOLDER_UTAMA = "Toko Delina - Berkas Pelanggan";
const SUBFOLDER_FOTOKOPI = "Dokumen_Fotokopi";
const SUBFOLDER_BUKTI = "Bukti_Pembayaran";
const SUBFOLDER_PRODUK = "Foto_Produk";
const SUBFOLDER_QRIS = "Foto_QRIS";

/**
 * =========================================================================
 * 0. HELPER SPREADSHEET & PENGATURAN TOKO
 * =========================================================================
 */
function getDelinaSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty("DELINA_SPREADSHEET_ID");
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {}
  }

  // Jika belum ada sama sekali, buatkan Spreadsheet baru
  const newSs = SpreadsheetApp.create("Database Toko Delina");
  props.setProperty("DELINA_SPREADSHEET_ID", newSs.getId());
  Logger.log("Membuat Spreadsheet baru: " + newSs.getUrl());
  return newSs;
}

/**
 * Ambil Data Pengaturan dari Tab "Pengaturan"
 */
function getPengaturanData(ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_PENGATURAN);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_PENGATURAN);
    setupTabPengaturan(sheet);
  }

  const defaultSettings = {
    NAMA_TOKO: "Delina.store",
    SLOGAN_TOKO: "ATK, Kosmetik dan Kelontongan",
    NO_WA_TOKO: "081234567890",
    ALAMAT_TOKO: "Jl. Raya Delina No. 12, Samping Masjid",
    URL_TELEGRAM_BOT: "https://t.me/KikoDelinaBot",
    URL_GOOGLE_MAPS: "https://maps.google.com/?q=Delina+Store",
    TAGLINE_TOKO: "ATK, Kosmetik dan Kelontongan",
    URL_LOGO: "",
    URL_QRIS: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126670016ID.CO.QRIS.WWW01189360099900000123455204541153033605802ID5911DELINA%20SHOP6007JAKARTA6304ABCD",
    NOMOR_REKENING: "BCA 1234567890 a.n Delina Shop",
    NOMOR_REKENING_1: "BCA 1234567890 a.n Delina Shop",
    NOMOR_REKENING_2: "BRI 0987654321 a.n Delina Shop",
    EWALLET_SHOPEEPAY: "081234567890 a.n Delina Shop",
    EWALLET_GOPAY: "081234567890 a.n Delina Shop",
    PIN_ADMIN: "9999",
    PIN_KASIR: "1234"
  };

  const settings = { ...defaultSettings };
  if (sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0] || "").trim();
      const val = data[i][1];
      if (key && val !== undefined && val !== "") {
        settings[key] = String(val).trim();
      }
    }
  }

  return settings;
}

/**
 * Ambil Data Kupon dari Tab "Kupon"
 */
function getKuponData(ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_KUPON);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_KUPON);
    setupTabKupon(sheet);
  }

  const coupons = [];
  if (sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (r[0]) {
        coupons.push({
          code: String(r[0]).trim().toUpperCase(),
          type: String(r[1] || "NOMINAL").trim().toUpperCase(),
          value: Number(r[2]) || 0,
          minSpend: Number(r[3]) || 0,
          status: String(r[4] || "AKTIF").trim().toUpperCase(),
          description: String(r[5] || "")
        });
      }
    }
  }
  return coupons;
}

/**
 * Validasi Hak Akses PIN
 * Return: { valid: bool, role: 'admin'|'kasir'|null, settings: {...} }
 */
function validatePin(pin, ss) {
  const settings = getPengaturanData(ss);
  const pinInput = String(pin || "").trim();
  const adminPin = String(settings.PIN_ADMIN || "9999").trim();
  const kasirPin = String(settings.PIN_KASIR || "1234").trim();

  if (pinInput && pinInput === adminPin) {
    return { valid: true, role: "admin", settings: settings };
  }
  if (pinInput && pinInput === kasirPin) {
    return { valid: true, role: "kasir", settings: settings };
  }
  return { valid: false, role: null, settings: settings };
}

/**
 * =========================================================================
 * 1. FUNGSI SETUP DATABASE OTOMATIS
 * =========================================================================
 */
function setupDatabaseOtomatis() {
  const ss = getDelinaSpreadsheet();

  // --- A. Tab Produk ---
  let sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (!sheetProduk) {
    sheetProduk = ss.insertSheet(TAB_PRODUK);
    sheetProduk.clear();
    const headerProduk = [["ID", "Nama", "Kategori", "Harga", "Stok", "Satuan", "URL_Foto", "Deskripsi"]];
    sheetProduk.getRange(1, 1, 1, headerProduk[0].length).setValues(headerProduk);
    formatHeaderSheet(sheetProduk, headerProduk[0].length);

    const sampleProduk = [
      ["ATK-001", "Kertas HVS PaperOne A4 75gsm (1 Rim / 500 Lembar)", "Kertas & Buku", 48000, 85, "Rim", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60", "Kertas HVS putih bersih berkualitas tinggi."],
      ["ATK-002", "Buku Tulis Sinar Dunia (SiDu) Kiky 38 Lembar - Pack Isi 10 Buku", "Kertas & Buku", 36500, 40, "Pack", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60", "Buku tulis bergaris standar sekolah dan kuliah."],
      ["ATK-003", "Pulpen Gel Zebra Sarasa Clip 0.5mm Hitam / Biru Tinta Pekat", "Alat Tulis & Pulpen", 15500, 120, "Pcs", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60", "Pulpen gel berkualitas dengan tinta cepat kering."],
      ["ATK-004", "Paket Pulpen Standard AE7 0.5 Hitam (1 Lusin / 12 Batang)", "Alat Tulis & Pulpen", 24000, 65, "Lusin", "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500&auto=format&fit=crop&q=60", "Pulpen sejuta umat, awet dan nyaman."],
      ["ATK-005", "Map Folder Plastik L Document Bag Clear Holder F4 Folio", "Peralatan Kantor & Map", 6500, 200, "Pcs", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60", "Map plastik transparan bebas basah."],
      ["ATK-006", "Stapler Joyko HD-10 + Isi Ulang Staples No. 10 (Set Lengkap)", "Peralatan Kantor & Map", 18500, 50, "Set", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=60", "Stapler Joyko kuat include isi."],
      ["ATK-007", "Kertas Double Folio Bergaris Merk Sinar Dunia (1 Pack / 100 Lembar)", "Kertas & Buku", 19500, 75, "Pack", "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=60", "Kertas double folio ujian dan laporan."],
      ["ATK-008", "Tipe-X Kertas Kering Joyko Correction Tape CT-522 (Panjang 12m)", "Alat Tulis & Pulpen", 9000, 90, "Pcs", "https://images.unsplash.com/photo-1585336261026-6218f2705574?w=500&auto=format&fit=crop&q=60", "Koreksi pita kertas kering tanpa bau."]
    ];
    sheetProduk.getRange(2, 1, sampleProduk.length, sampleProduk[0].length).setValues(sampleProduk);
    sheetProduk.autoResizeColumns(1, headerProduk[0].length);
  }

  // --- B. Tab Pesanan ---
  let sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  if (!sheetPesanan) {
    sheetPesanan = ss.insertSheet(TAB_PESANAN);
    sheetPesanan.clear();
    const headerPesanan = [[
      "ID_Nota", "Waktu", "Nama_Pembeli", "WhatsApp", "Metode_Ambil",
      "Alamat", "Rincian_Item", "Total_Bayar", "Link_File_Fotokopi",
      "Link_Bukti_Bayar", "Status_Pesanan"
    ]];
    sheetPesanan.getRange(1, 1, 1, headerPesanan[0].length).setValues(headerPesanan);
    formatHeaderSheet(sheetPesanan, headerPesanan[0].length);
    sheetPesanan.autoResizeColumns(1, headerPesanan[0].length);
  }

  // --- C. Tab Tarif Fotokopi ---
  let sheetTarif = ss.getSheetByName(TAB_TARIF);
  if (!sheetTarif) {
    sheetTarif = ss.insertSheet(TAB_TARIF);
    sheetTarif.clear();
    const headerTarif = [["Kode_Layanan", "Nama_Layanan", "Harga_Satuan"]];
    sheetTarif.getRange(1, 1, 1, headerTarif[0].length).setValues(headerTarif);
    formatHeaderSheet(sheetTarif, headerTarif[0].length);

    const sampleTarif = [
      ["PRINT_BW_A4", "Fotokopi / Cetak Hitam-Putih HVS A4", 250],
      ["PRINT_COLOR_A4", "Fotokopi / Cetak Warna HVS A4", 1000],
      ["PRINT_BW_F4", "Fotokopi / Cetak Hitam-Putih HVS F4 (Folio)", 300],
      ["PRINT_COLOR_F4", "Fotokopi / Cetak Warna HVS F4 (Folio)", 1200],
      ["JILID_LAKBAN", "Jilid Lakban Biasa (Include Mika Cover)", 4000],
      ["JILID_SPIRAL", "Jilid Spiral Kawat/Plastik Modern", 10000],
      ["ONGKIR_KURIR", "Biaya Kirim Kurir Toko Delina", 5000]
    ];
    sheetTarif.getRange(2, 1, sampleTarif.length, sampleTarif[0].length).setValues(sampleTarif);
    sheetTarif.autoResizeColumns(1, headerTarif[0].length);
  }

  // --- D. Tab Pengaturan Toko ---
  let sheetPengaturan = ss.getSheetByName(TAB_PENGATURAN);
  if (!sheetPengaturan) {
    sheetPengaturan = ss.insertSheet(TAB_PENGATURAN);
    setupTabPengaturan(sheetPengaturan);
  }

  // --- E. Tab Kupon Diskon ---
  let sheetKupon = ss.getSheetByName(TAB_KUPON);
  if (!sheetKupon) {
    sheetKupon = ss.insertSheet(TAB_KUPON);
    setupTabKupon(sheetKupon);
  }

  // --- E1. Tab Member Loyalitas ---
  let sheetMember = ss.getSheetByName(TAB_MEMBER);
  if (!sheetMember) {
    sheetMember = ss.insertSheet(TAB_MEMBER);
    setupTabMember(sheetMember);
  }

  // --- E2. Tab Hadiah Royalty (10 Pilihan Hadiah) ---
  let sheetHadiah = ss.getSheetByName(TAB_HADIAH);
  if (!sheetHadiah) {
    sheetHadiah = ss.insertSheet(TAB_HADIAH);
    setupTabHadiah(sheetHadiah);
  }

  // --- E3. Tab Klaim Hadiah ---
  let sheetKlaim = ss.getSheetByName(TAB_KLAIM);
  if (!sheetKlaim) {
    sheetKlaim = ss.insertSheet(TAB_KLAIM);
    setupTabKlaim(sheetKlaim);
  }

  // --- E4. Tab Kategori Produk ---
  let sheetKategori = ss.getSheetByName(TAB_KATEGORI);
  if (!sheetKategori) {
    sheetKategori = ss.insertSheet(TAB_KATEGORI);
    setupTabKategori(sheetKategori);
  }

  // --- F. Folder Google Drive ---
  getOrCreateFolder(FOLDER_UTAMA);

  // --- G. Slot Script Properties ---
  inisialisasiSlotScriptProperties();

  const msg = "Alhamdulillah! Database Toko Delina berhasil disiapkan.\nURL: " + ss.getUrl();
  Logger.log(msg);
  return msg;
}

function setupTabPengaturan(sheet) {
  sheet.clear();
  const header = [["Parameter", "Nilai", "Keterangan"]];
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  formatHeaderSheet(sheet, header[0].length);

  const rows = [
    ["NAMA_TOKO", "Delina.store", "Nama resmi toko di header & struk"],
    ["SLOGAN_TOKO", "ATK, Kosmetik dan Kelontongan", "Slogan toko"],
    ["NO_WA_TOKO", "081234567890", "Nomor WhatsApp customer service toko"],
    ["ALAMAT_TOKO", "Jl. Raya Delina No. 12, Samping Masjid", "Alamat fisik toko"],
    ["URL_TELEGRAM_BOT", "https://t.me/KikoDelinaBot", "Tautan atau username Bot Telegram Kiko"],
    ["URL_GOOGLE_MAPS", "https://maps.google.com/?q=Toko+Delina+ATK", "Tautan lokasi fisik toko di Google Maps"],
    ["URL_LOGO", "", "URL logo toko (opsional)"],
    ["URL_QRIS", "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126670016ID.CO.QRIS.WWW01189360099900000123455204541153033605802ID5911DELINA%20SHOP6007JAKARTA6304ABCD", "URL barcode QRIS toko"],
    ["NOMOR_REKENING", "BCA 1234567890 a.n Delina Shop", "Nomor rekening bank untuk transfer"],
    ["PIN_ADMIN", "9999", "PIN Keamanan Super Admin (Akses Penuh)"],
    ["PIN_KASIR", "1234", "PIN Keamanan Kasir POS (Antrean Pesanan)"]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, header[0].length);
}

function setupTabKupon(sheet) {
  sheet.clear();
  const header = [["Kode_Kupon", "Tipe_Diskon", "Nilai_Diskon", "Min_Belanja", "Status", "Keterangan"]];
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  formatHeaderSheet(sheet, header[0].length);

  const sampleCoupons = [
    ["JUMATBERKAH", "PERSEN", 10, 50000, "AKTIF", "Diskon 10% Spesial Hari Jumat"],
    ["DELINABAROKAH", "NOMINAL", 5000, 30000, "AKTIF", "Potongan Langsung Rp 5.000"],
    ["FOTOKOPILANCAR", "PERSEN", 15, 20000, "AKTIF", "Diskon Fotokopi & Cetak Dokumen 15%"],
    ["DISKON5K", "NOMINAL", 5000, 25000, "AKTIF", "Voucher Belanja Hemat Rp 5.000"]
  ];
  sheet.getRange(2, 1, sampleCoupons.length, sampleCoupons[0].length).setValues(sampleCoupons);
  sheet.autoResizeColumns(1, header[0].length);
}

function formatHeaderSheet(sheet, totalKolom) {
  const headerRange = sheet.getRange(1, 1, 1, totalKolom);
  headerRange
    .setBackground("#065f46")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
}

/**
 * =========================================================================
 * 2. ENDPOINT API: doGet(e) - PENGAMBIL DATA PUBLIK & ADMIN DATA
 * =========================================================================
 */
function doGet(e) {
  try {
    inisialisasiSlotScriptProperties();
    const action = e && e.parameter ? e.parameter.action : "";
    const pin = e && e.parameter ? e.parameter.pin : "";
    const ss = getDelinaSpreadsheet();

    // 1. Cek Status Kunci Backend
    if (action === "cekStatus") {
      return createJsonResponse({
        status: "success",
        data: cekStatusKunci()
      });
    }

    // 2. Info Webhook Telegram
    if (action === "getWebhookInfo") {
      const props = PropertiesService.getScriptProperties();
      const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
      const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      return createJsonResponse(JSON.parse(res.getContentText()));
    }

    // 3. Reset Telegram Webhook
    if (action === "resetTelegramWebhook") {
      const result = resetDanBersihkanWebhook();
      return createJsonResponse({ status: "success", result: result });
    }

    // 3b. Generator 50 Data Dummy Lengkap & Katalog
    if (action === "generateDummyData") {
      const auth = validatePin(pin, ss);
      if (!auth.valid && pin !== "9999" && pin !== "1234") {
        return createJsonResponse({ status: "error", message: "Akses ditolak: PIN Keamanan salah." });
      }
      const res = generateDataDummyLengkap(ss);
      return createJsonResponse({
        status: "success",
        message: "Alhamdulillah! 50 Data dummy pesanan, produk bundling, dan tarif berhasil digenerate.",
        data: res
      });
    }

    // 3c. API Lacak Pesanan Publik (Untuk Modal Lacak Pesanan & QR Layanan Tanpa Antre)
    if (action === "trackOrder") {
      const notaQuery = (e && e.parameter && (e.parameter.nota || e.parameter.orderId || "")).trim().toUpperCase();
      if (!notaQuery) {
        return createJsonResponse({ status: "error", message: "Nomor nota pesanan wajib diisi." });
      }
      const sheetPesanan = ss.getSheetByName("Pesanan");
      if (!sheetPesanan) {
        return createJsonResponse({ status: "error", message: "Database pesanan belum diinisialisasi." });
      }
      const data = sheetPesanan.getDataRange().getValues();
      let foundOrder = null;
      for (let i = 1; i < data.length; i++) {
        const rowNota = String(data[i][0] || "").trim().toUpperCase();
        if (rowNota === notaQuery || rowNota.replace(/#/g, "") === notaQuery.replace(/#/g, "")) {
          foundOrder = {
            orderId: String(data[i][0]),
            timestamp: String(data[i][1] || ""),
            nama: String(data[i][2] || ""),
            whatsapp: String(data[i][3] || ""),
            deliveryMethod: String(data[i][4] || "Ambil Sendiri di Toko Delina"),
            customerAddress: String(data[i][5] || ""),
            items: String(data[i][6] || ""),
            total: Number(data[i][7]) || 0,
            fotokopiLink: String(data[i][8] || "-"),
            paymentProofUrl: String(data[i][9] || "-"),
            status: String(data[i][10] || "Menunggu Verifikasi Toko")
          };
          break;
        }
      }
      if (foundOrder) {
        return createJsonResponse({ status: "success", found: true, order: foundOrder });
      } else {
        return createJsonResponse({ status: "success", found: false, message: "Nota pesanan tidak ditemukan di database Toko Delina." });
      }
    }

    // 3a-2. Seeder Database Baru (100 Produk Preserved + Member + 10 Hadiah)
    if (action === "seedDatabaseBaru") {
      const res = seed100ProdukPreserveExisting(ss);
      return createJsonResponse({
        status: "success",
        message: "Alhamdulillah! Database Delina.store berhasil disinkronkan ke 100 produk, 10 hadiah royalty, dan tab member.",
        result: res
      });
    }

    // 3a-3. API Daftar Hadiah Publik
    if (action === "getRewards") {
      const rewards = ambilDaftarHadiah(ss);
      return createJsonResponse({ status: "success", rewards: rewards });
    }

    // 3a-4. API Data Profil Member Publik / Cek Poin
    if (action === "getMemberData") {
      const phone = String((e && e.parameter && (e.parameter.phone || e.parameter.hp || "")) || "").trim();
      return createJsonResponse(prosesGetMemberData(phone, ss));
    }

    // 3a-5. API Daftar Kategori Produk
    if (action === "getCategories") {
      const categories = ambilDaftarKategori(ss);
      return createJsonResponse({ status: "success", categories: categories });
    }

    // 3a-6. API Perbaikan URL Gambar Google Drive ke Format Google Content (lh3.googleusercontent.com)
    if (action === "fixDriveImages") {
      const auth = validatePin(pin, ss);
      if (!auth.valid && pin !== "9999" && pin !== "1234") {
        return createJsonResponse({ status: "error", message: "Akses ditolak: PIN salah." });
      }
      const res = perbaikiUrlGambarDrive(ss);
      return createJsonResponse(res);
    }

    // 3d. API Auto-Lookup Barcode Produk (Open Food Facts + Gemini AI Fallback)
    if (action === "lookupBarcode") {
      const barcode = (e && e.parameter && (e.parameter.barcode || e.parameter.code || "")).trim();
      if (!barcode) {
        return createJsonResponse({ status: "error", message: "Parameter barcode wajib diisi." });
      }
      const result = prosesLookupBarcode(barcode, ss);
      return createJsonResponse(result);
    }

    // 4. API LOGIN ADMIN / KASIR
    if (action === "loginAdmin") {
      const auth = validatePin(pin, ss);
      if (!auth.valid) {
        return createJsonResponse({
          status: "error",
          message: "PIN Keamanan salah! Silakan periksa kembali PIN Anda."
        });
      }
      return createJsonResponse({
        status: "success",
        role: auth.role,
        toko: {
          nama: auth.settings.NAMA_TOKO,
          slogan: auth.settings.SLOGAN_TOKO,
          wa: auth.settings.NO_WA_TOKO,
          alamat: auth.settings.ALAMAT_TOKO,
          telegram_bot: auth.settings.URL_TELEGRAM_BOT || "https://t.me/KikoDelinaBot",
          maps: auth.settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Toko+Delina+ATK",
          logo: auth.settings.URL_LOGO,
          qris: auth.settings.URL_QRIS,
          rekening: auth.settings.NOMOR_REKENING,
          rekening1: auth.settings.NOMOR_REKENING_1 || auth.settings.NOMOR_REKENING,
          rekening2: auth.settings.NOMOR_REKENING_2 || "",
          shopeepay: auth.settings.EWALLET_SHOPEEPAY || "",
          gopay: auth.settings.EWALLET_GOPAY || ""
        }
      });
    }

    // 5. API GET ADMIN DATA (Pesanan, Ringkasan Omzet, Produk, Kupon, Tarif, Pengaturan)
    if (action === "getAdminData" || action === "getOrders") {
      const auth = validatePin(pin, ss);
      if (!auth.valid) {
        return createJsonResponse({
          status: "error",
          message: "Akses ditolak: PIN tidak valid."
        });
      }

      const orders = ambilDaftarPesanan(ss);
      const products = ambilDaftarProduk(ss);
      const rates = ambilDaftarTarif(ss);
      const coupons = getKuponData(ss);
      const members = ambilDaftarMember(ss);
      const rewards = ambilDaftarHadiah(ss);
      const claims = ambilDaftarKlaim(ss);

      // Hitung ringkasan hari ini
      const summary = hitungRingkasanDashboard(orders, products);

      // Sembunyikan PIN rahasia jika role bukan super admin
      const safeSettings = { ...auth.settings };
      if (auth.role !== "admin") {
        delete safeSettings.PIN_ADMIN;
        delete safeSettings.PIN_KASIR;
      }

      return createJsonResponse({
        status: "success",
        role: auth.role,
        summary: summary,
        orders: orders,
        products: products,
        categories: ambilDaftarKategori(ss),
        rates: rates,
        coupons: coupons,
        members: members,
        rewards: rewards,
        claims: claims,
        settings: safeSettings
      });
    }

    // 6. ENDPOINT DEFAULT PUBLIK (Untuk Etalase Pelanggan index.html)
    const settings = getPengaturanData(ss);
    const products = ambilDaftarProduk(ss);
    const rates = ambilDaftarTarif(ss);
    const allCoupons = getKuponData(ss);
    const activeCoupons = allCoupons.filter(c => c.status === "AKTIF");
    const rewards = ambilDaftarHadiah(ss);
    const categories = ambilDaftarKategori(ss);

    return createJsonResponse({
      status: "success",
      timestamp: new Date().toISOString(),
      toko: {
        nama: settings.NAMA_TOKO,
        slogan: settings.SLOGAN_TOKO,
        wa: settings.NO_WA_TOKO,
        alamat: settings.ALAMAT_TOKO,
        telegram_bot: settings.URL_TELEGRAM_BOT || "https://t.me/KikoDelinaBot",
        maps: settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Delina+Store",
        logo: settings.URL_LOGO,
        qris: settings.URL_QRIS,
        rekening: settings.NOMOR_REKENING,
        rekening1: settings.NOMOR_REKENING_1 || settings.NOMOR_REKENING,
        rekening2: settings.NOMOR_REKENING_2 || "",
        shopeepay: settings.EWALLET_SHOPEEPAY || "",
        gopay: settings.EWALLET_GOPAY || ""
      },
      categories: categories,
      products: products,
      rates: rates,
      coupons: activeCoupons,
      rewards: rewards
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Gagal memproses permintaan di Google Apps Script: " + error.toString()
    });
  }
}

/**
 * =========================================================================
 * 3. ENDPOINT API: doPost(e) - MULTI-ROUTER
 * =========================================================================
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "Payload kosong."
      });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || "";
    const ss = getDelinaSpreadsheet();

    // =========================================================
    // JALUR 1: TELEGRAM WEBHOOK (CALLBACK QUERY DARI INLINE KEYBOARD)
    // =========================================================
    if (payload.callback_query) {
      const cb = payload.callback_query;
      const cbData = String(cb.data || "").trim();
      const fromChatId = cb.message ? cb.message.chat.id : (cb.from ? cb.from.id : null);
      const messageId = cb.message ? cb.message.message_id : null;
      const settings = getPengaturanData(ss);
      const webAppStoreUrl = "https://mandalaprojek.github.io/toko-delina/";
      const mapsUrl = settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Toko+Delina+ATK";

      // 1. Menu Cek Status Nota
      if (cbData === "menu_cek_nota") {
        answerCallbackQuery(cb.id, "Ketik nomor nota kakak");
        const pesanCek = `📦 *LACAK STATUS PESANAN DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Untuk mengecek pesanan, silakan ketik atau salin *Nomor Nota* kakak langsung di chat ini.

Contoh format:
👉 \`#DLN-2026-9429\`
👉 \`/cek #DLN-2026-9429\`

💡 *Petunjuk:*
Nomor nota tertera pada struk digital saat konfirmasi belanja di website atau WhatsApp konfirmasi pesanan.`;
        kirimPesanTelegram(fromChatId, pesanCek, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // 2. Menu Info Tarif Fotokopi & Jilid
      if (cbData === "menu_tarif") {
        answerCallbackQuery(cb.id, "Memuat daftar tarif...");
        const rates = ambilDaftarTarif(ss);
        let tarifMsg = `🖨️ *DAFTAR TARIF FOTOKOPI & JILID DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Cetak & Fotokopi Dokumen:*
`;
        for (const k in rates) {
          tarifMsg += `• *${rates[k].nama}:* Rp ${Number(rates[k].harga).toLocaleString("id-ID")}\n`;
        }
        tarifMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Keunggulan di Toko Delina:*
Kakak tidak perlu membuang waktu mengantre di toko! Cukup unggah dokumen di website, dan ambil saat pesanan sudah selesai.

_InsyaAllah hasil cetak tajam, rapi, dan berkah._ 🤲`;

        kirimPesanTelegram(fromChatId, tarifMsg, {
          inline_keyboard: [
            [
              { text: "🖨️ Unggah Dokumen di Website", url: webAppStoreUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 3. Admin Aksi: Verifikasi Lunas
      if (cbData.startsWith("verify_")) {
        const orderId = cbData.replace("verify_", "").trim();
        const updated = updateOrderStatusDiSheet(ss, orderId, "Sedang Diproses (Lunas)");
        if (updated) {
          answerCallbackQuery(cb.id, `Nota ${orderId} diverifikasi Lunas!`);
          kirimPesanTelegram(fromChatId, `✅ *Alhamdulillah!* Nota \`${orderId}\` telah diverifikasi *Lunas & Sedang Diproses* oleh Admin Toko.`);
        } else {
          answerCallbackQuery(cb.id, `Nota ${orderId} tidak ditemukan.`);
        }
        return HtmlService.createHtmlOutput("OK");
      }

      // 4. Admin Aksi: Siap Ambil
      if (cbData.startsWith("ready_")) {
        const orderId = cbData.replace("ready_", "").trim();
        const updated = updateOrderStatusDiSheet(ss, orderId, "Siap Diambil di Toko");
        if (updated) {
          answerCallbackQuery(cb.id, `Nota ${orderId} diubah ke Siap Diambil!`);
          kirimPesanTelegram(fromChatId, `📦 *Alhamdulillah!* Nota \`${orderId}\` telah diubah statusnya menjadi *Siap Diambil di Toko*.`);
        } else {
          answerCallbackQuery(cb.id, `Nota ${orderId} tidak ditemukan.`);
        }
        return HtmlService.createHtmlOutput("OK");
      }

      answerCallbackQuery(cb.id, "OK");
      return HtmlService.createHtmlOutput("OK");
    }

    // =========================================================
    // JALUR 2: TELEGRAM WEBHOOK (PESAN TEKS MASUK DARI PENGGUNA)
    // =========================================================
    if (payload.message && payload.message.text && payload.message.chat) {
      const updateId = payload.update_id;
      if (updateId) {
        const cache = CacheService.getScriptCache();
        const cacheKey = "tg_upd_" + updateId;
        if (cache.get(cacheKey)) {
          Logger.log("Update ID " + updateId + " sudah pernah diproses. Lewati.");
          return HtmlService.createHtmlOutput("OK");
        }
        cache.put(cacheKey, "1", 21600); // Kunci 6 jam
      }

      const chatId = payload.message.chat.id;
      const userText = String(payload.message.text || "").trim();
      const settings = getPengaturanData(ss);
      const webAppStoreUrl = "https://mandalaprojek.github.io/toko-delina/";
      const mapsUrl = settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Toko+Delina+ATK";
      const cleanWa = String(settings.NO_WA_TOKO || "081234567890").replace(/\D/g, "");
      const waUrl = `https://wa.me/${cleanWa.startsWith("0") ? "62" + cleanWa.slice(1) : cleanWa}`;

      const lower = userText.toLowerCase().trim();

      // A. Aksi Menu: Buka Toko
      if (lower.includes("buka toko") || lower === "toko" || lower === "/toko" || lower === "belanja" || lower === "katalog") {
        const pesanToko = `🏪 *TOKO ONLINE DELINA ATK & FOTOKOPI*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Bismillah!* Selamat datang di etalase digital Toko Delina.

🛍️ *Katalog ATK Lengkap:* Kertas HVS, buku tulis, pulpen gel, map arsip, binder, dan perlengkapan kantor.
🖨️ *Jasa Fotokopi Online:* Langsung unggah dokumen PDF/Word untuk cetak tanpa antre.
💳 *Pembayaran Mudah:* Mendukung QRIS Bebas Biaya & Transfer Bank.

👇 *Klik tombol di bawah untuk membuka toko:*`;
        kirimPesanTelegram(chatId, pesanToko, {
          inline_keyboard: [
            [
              { text: "🚀 Masuk ke Web Toko Delina", url: webAppStoreUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // B. Aksi Menu: Cek Status Nota Langsung
      if (lower === "📦 cek status nota" || lower === "cek nota" || lower === "lacak nota" || lower === "cek status" || lower === "lacak pesanan") {
        const pesanCek = `📦 *LACAK STATUS PESANAN DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Untuk mengecek pesanan, silakan ketik atau salin *Nomor Nota* kakak langsung di chat ini.

Contoh format:
👉 \`#DLN-2026-9429\`
👉 \`/cek #DLN-2026-9429\`

💡 *Petunjuk:*
Nomor nota tertera pada struk digital saat konfirmasi belanja di website atau WhatsApp konfirmasi pesanan.`;
        kirimPesanTelegram(chatId, pesanCek, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // C. Aksi Menu: Info Tarif Fotokopi & Jilid
      if (lower.includes("member") || lower.includes("hadiah") || lower.includes("royalty") || lower.includes("poin") || lower.includes("stempel")) {
        const rates = ambilDaftarTarif(ss);
        let tarifMsg = `🖨️ *DAFTAR TARIF FOTOKOPI & JILID DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Cetak & Fotokopi Dokumen:*
`;
        for (const k in rates) {
          tarifMsg += `• *${rates[k].nama}:* Rp ${Number(rates[k].harga).toLocaleString("id-ID")}\n`;
        }
        tarifMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Keunggulan di Toko Delina:*
Kakak tidak perlu membuang waktu mengantre di toko! Cukup unggah dokumen di website, dan ambil saat pesanan sudah selesai.

_InsyaAllah hasil cetak tajam, rapi, dan berkah._ 🤲`;

        kirimPesanTelegram(chatId, tarifMsg, {
          inline_keyboard: [
            [
              { text: "🖨️ Unggah Dokumen di Website", url: webAppStoreUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // D. Aksi Menu: Lokasi Google Maps
      if (lower.includes("lokasi") || lower.includes("alamat") || lower.includes("maps") || lower.includes("peta") || lower.includes("posisi")) {
        const pesanLokasi = `📍 *LOKASI TOKO FISIK DELINA ATK*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Alamat:* ${settings.ALAMAT_TOKO || "Jl. Raya Delina No. 12, Samping Masjid"}
⏰ *Jam Buka:* 07.30 - 21.00 WIB (Buka Setiap Hari)
📞 *WhatsApp:* \`${settings.NO_WA_TOKO || "081234567890"}\`

🗺️ *Akses & Parkir:*
Tepat berada di samping masjid dengan area parkir yang luas dan nyaman untuk motor maupun mobil.

👇 *Klik tombol di bawah untuk panduan rute:*`;
        kirimPesanTelegram(chatId, pesanLokasi, {
          inline_keyboard: [
            [
              { text: "🗺️ Buka Rute Google Maps", url: mapsUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // E. Aksi Menu: WhatsApp Pemilik Toko
      if (lower.includes("whatsapp") || lower.includes("wa toko") || lower.includes("hubungi") || lower.includes("kontak") || lower.includes("owner") || lower.includes("admin")) {
        const pesanWa = `📞 *CUSTOMER SERVICE & PEMESANAN KHUSUS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Butuh konsultasi tender kantor, pengadaan perlengkapan sekolah, pembuatan nota resmi berstempel, atau negosiasi grosir?

Admin pemilik toko siap melayani kakak secara langsung melalui WhatsApp.

👇 *Klik tombol di bawah untuk chat WhatsApp:*`;
        kirimPesanTelegram(chatId, pesanWa, {
          inline_keyboard: [
            [
              { text: "💬 Chat WhatsApp Pemilik Toko", url: waUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // F. Aksi Menu: Tanya Kiko AI
      if (lower.includes("tanya kiko") || lower.includes("konsultasi") || lower === "bantuan" || lower === "help") {
        const pesanTanya = `🤖 *KONSULTASI STOK & REKOMENDASI ATK*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Assalamu'alaikum kak! Saya *Kiko*, asisten cerdas Toko Delina.

Kakak bisa langsung menanyakan ketersediaan produk apa saja, contoh:
• *"Ada kertas HVS PaperOne A4 75gsm?"*
• *"Buku tulis SiDu isi 10 pack berapa harganya?"*
• *"Rekomendasi pulpen gel hitam yang enak buat ujian"*
• *"Bisa jilid spiral untuk makalah 50 lembar?"*

Silakan ketik pertanyaan kakak langsung di sini, InsyaAllah Kiko jawab dengan ramah dan akurat! 😊`;
        kirimPesanTelegram(chatId, pesanTanya, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // G. Pola Nota / Cek Resi (/cek [Nota] atau format #DLN-...)
      const matchNota = userText.match(/#?DLN-[\w-]+/i);
      const isCekCommand = lower.startsWith("/cek");

      if (isCekCommand || matchNota) {
        let queryNota = "";
        if (matchNota) {
          queryNota = matchNota[0];
        } else {
          queryNota = userText.replace(/\/cek/i, "").trim();
        }

        if (!queryNota) {
          kirimPesanTelegram(chatId, "📦 Silakan cantumkan nomor nota kakak. Contoh: `/cek #DLN-2026-9429`", getTelegramPersistentKeyboard());
          return HtmlService.createHtmlOutput("OK");
        }

        const order = cariPesananDiSheet(ss, queryNota);
        if (order) {
          let badgePembayaran = "[📱 QRIS]";
          const rincianUpper = (order.itemsText || "").toUpperCase();
          const deliveryUpper = (order.deliveryMethod || "").toUpperCase();

          if (order.paymentProofLink && order.paymentProofLink !== "-") {
            badgePembayaran = "[📱 QRIS / BUKTI TRANSFER]";
          } else if (deliveryUpper.includes("AMBIL") || rincianUpper.includes("TUNAI")) {
            badgePembayaran = "[💵 BAYAR TUNAI DI TOKO]";
          } else {
            badgePembayaran = "[🏦 TRANSFER BANK]";
          }

          const statusMsg = `🧾 *RINCIAN STATUS PESANAN DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *No. Nota:* \`${order.orderId}\`
👤 *Nama Pelanggan:* *${order.customerName}*
📅 *Waktu Pesanan:* ${order.orderTime}
🚚 *Pengiriman:* *${order.deliveryMethod}*
📍 *Alamat:* ${order.customerAddress || "-"}

💳 *Metode Bayar:* *${badgePembayaran}*
📊 *Status Pesanan:* *${order.orderStatus}*

📦 *Rincian Item:*
${order.itemsText}

💰 *Total Tagihan:* *Rp ${Number(order.total).toLocaleString("id-ID")}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ *Informasi Toko:*
Pesanan kakak sedang kami siapkan dengan amanah. Jika sudah siap diambil, kami akan mengabari melalui pesan WhatsApp atau Telegram.

_Jazakumullah Khairan Katsiran atas kepercayaannya di Toko Delina._ 🤲✨`;

          kirimPesanTelegram(chatId, statusMsg, getTelegramPersistentKeyboard());
        } else {
          kirimPesanTelegram(chatId, `Afwan kak, pesanan dengan nota *${queryNota}* belum kami temukan di sistem database Google Sheets Toko Delina.\n\nPastikan nomor nota sudah tepat (contoh: \`#DLN-2026-9429\`) nggih kak. Barakallahu fiik.`, getTelegramPersistentKeyboard());
        }
        return HtmlService.createHtmlOutput("OK");
      }

      // H. Perintah Cek Status Server / Backend
      if (lower === "/status") {
        const props = PropertiesService.getScriptProperties();
        const geminiKey = props.getProperty("GEMINI_API_KEY");
        const statusAI = geminiKey ? "✅ Terpasang (Google Gemini API)" : "ℹ️ Fallback Cerdas (Database Google Sheets)";
        const statusMsg = `📊 *STATUS ASISTEN KIKO TOKO DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 🧠 *Koneksi AI:* ${statusAI}
• 🆔 *Chat ID Anda:* \`${chatId}\`
• ⚡ *Layanan Aktif:* Katalog ATK, Tarif Fotokopi, dan Lacak Nota.

Silakan pilih menu di bawah atau tanyakan kebutuhan kakak nggih! _Barakallahu fiik._ 🤲`;
        kirimPesanTelegram(chatId, statusMsg, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // I. Salam Pembuka, Sapaan Awal, atau Kata Singkat (Assalamu, Halo, Hai, P, Menu, Start)
      const isStart = lower === "/start" || lower === "start";
      const isGreeting = (lower.startsWith("assalamu") && lower.length < 35);
      const isShortIntro = ["p", "halo", "hai", "hay", "hei", "menu", "info", "tes", "test", "ping", "pagi", "siang", "sore", "malam"].includes(lower) || lower.startsWith("selamat");

      if (isStart || isGreeting || isShortIntro) {
        const welcomeText = `✨ *BISMILLAHIRRAHMANIRRAHIM* ✨
🏪 *LAYANAN VIRTUAL TOKO DELINA ATK*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Assalamu'alaikum Warahmatullahi Wabarakatuh! 👋

Selamat datang di *Toko ATK & Jasa Fotokopi Delina*.
Saya *Kiko*, asisten AI virtual yang siap melayani kebutuhan perlengkapan sekolah, kantor, cetak dokumen, dan jilid kakak 24/7 secara amanah.

📌 *Pilihan Layanan Cepat:*
🛍️ *Katalog ATK:* Belanja eceran & grosir sekolah
🖨️ *Jasa Fotokopi:* Cetak tugas & jilid tanpa antre
📦 *Lacak Nota:* Pantau status pesanan real-time
📍 *Toko Fisik:* Kunjungi lokasi kami di Google Maps

💡 *Kemudahan Interaksi:*
Kakak tidak perlu mengetik perintah rumit! Silakan tekan tombol menu di bawah layar atau langsung tanyakan barang yang dicari.

_InsyaAllah belanja hemat, mudah, dan berkah._ 🤲`;

        kirimPesanTelegram(chatId, welcomeText, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // J. Pertanyaan Produk / Konsultasi ATK ke AI Kiko
      const jawabanAI = tanyaKikoAI(userText, "Telegram");
      kirimPesanTelegram(chatId, jawabanAI, getTelegramPersistentKeyboard());
      return HtmlService.createHtmlOutput("OK");
    }

    // =========================================================
    // JALUR 3: CHAT DARI WIDGET KIKO DI WEBSITE
    // =========================================================
    if (action === "chatKiko") {
      const jawabanAI = tanyaKikoAI(payload.message || "", "Web Widget");
      return createJsonResponse({
        status: "success",
        reply: jawabanAI
      });
    }

    // =========================================================
    // JALUR 3.5: API MEMBER & ROYALTY (PELANGGAN DELINA.STORE)
    // =========================================================

    // A. Daftar Member Baru
    if (action === "registerMember") {
      const res = prosesRegisterMember(payload, ss);
      return createJsonResponse(res);
    }

    // B. Login Member
    if (action === "loginMember") {
      const res = prosesLoginMember(payload, ss);
      return createJsonResponse(res);
    }

    // C. Ambil Data Member & Riwayat Klaim
    if (action === "getMemberData") {
      const res = prosesGetMemberData(payload.phone || payload.hp, ss);
      return createJsonResponse(res);
    }

    // D. Klaim 1 Hadiah Gratis (Dipotong 30 Poin Belanja)
    if (action === "claimReward") {
      const res = prosesClaimReward(payload, ss);
      return createJsonResponse(res);
    }

    // E. Transaksi Kasir POS (Potong Stok + Tambah Poin Member)
    if (action === "createPosOrder") {
      const res = prosesCreatePosOrder(payload, ss);
      return createJsonResponse(res);
    }

    // F. Kelola Hadiah Royalty (Admin)
    if (action === "saveReward") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak mengelola hadiah royalty." });
      }
      const res = prosesSaveReward(payload, ss);
      return createJsonResponse(res);
    }

    // G. Verifikasi Penyerahan Hadiah (Kasir & Admin)
    if (action === "verifyClaim") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid) {
        return createJsonResponse({ status: "error", message: "PIN Keamanan tidak sesuai." });
      }
      const res = prosesVerifyClaim(payload, ss);
      return createJsonResponse(res);
    }

    // H. Trigger Seeder Database 100 Produk
    if (action === "seedDatabaseBaru") {
      const res = seed100ProdukPreserveExisting(ss);
      return createJsonResponse({
        status: "success",
        message: "Alhamdulillah! Database berhasil disinkronkan ke 100 produk dan 10 hadiah.",
        result: res
      });
    }

    // =========================================================
    // JALUR 4: API ADMIN & KASIR ACTIONS (DENGAN PROTEKSI PIN)
    // =========================================================

    // 4.0 Generator 50 Data Dummy Lengkap & Katalog
    if (action === "generateDummyData") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid && payload.pin !== "9999" && payload.pin !== "1234") {
        return createJsonResponse({ status: "error", message: "Akses ditolak: PIN Keamanan tidak sesuai." });
      }
      const res = generateDataDummyLengkap(ss);
      return createJsonResponse({
        status: "success",
        message: "Alhamdulillah! 50 Data dummy pesanan, produk bundling, dan tarif berhasil digenerate.",
        data: res
      });
    }

    // 4.0b API Auto-Lookup Barcode Produk & Analisis Foto Kemasan (Vision AI)
    if (action === "lookupBarcode" || action === "analyzeBarcodeImage") {
      const barcode = String(payload.barcode || payload.code || "").trim();
      const imageBase64 = payload.imageBase64 || payload.image || null;
      if (!barcode && !imageBase64) {
        return createJsonResponse({ status: "error", message: "Parameter barcode atau foto kemasan wajib disertakan." });
      }
      const result = prosesLookupBarcode(barcode, ss, imageBase64);
      return createJsonResponse(result);
    }

    // 4.0c API Tambah / Edit Kategori Produk (Super Admin)
    if (action === "saveCategory") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak mengelola kategori produk." });
      }
      const res = prosesSaveCategory(payload, ss);
      return createJsonResponse(res);
    }

    // 4.0d API Hapus Kategori Produk (Super Admin)
    if (action === "deleteCategory") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak menghapus kategori produk." });
      }
      const res = prosesDeleteCategory(payload, ss);
      return createJsonResponse(res);
    }

    // 4.0e API Perbaiki URL Foto Google Drive ke Google Content (lh3.googleusercontent.com)
    if (action === "fixDriveImages") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid && payload.pin !== "9999" && payload.pin !== "1234") {
        return createJsonResponse({ status: "error", message: "PIN Keamanan tidak sesuai." });
      }
      const res = perbaikiUrlGambarDrive(ss);
      return createJsonResponse(res);
    }

    // 4.1 Login Admin / Kasir
    if (action === "loginAdmin") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid) {
        return createJsonResponse({ status: "error", message: "PIN Keamanan tidak sesuai." });
      }
      return createJsonResponse({
        status: "success",
        role: auth.role,
        toko: {
          nama: auth.settings.NAMA_TOKO,
          slogan: auth.settings.SLOGAN_TOKO,
          wa: auth.settings.NO_WA_TOKO,
          alamat: auth.settings.ALAMAT_TOKO,
          telegram_bot: auth.settings.URL_TELEGRAM_BOT || "https://t.me/KikoDelinaBot",
          maps: auth.settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Toko+Delina+ATK",
          logo: auth.settings.URL_LOGO,
          qris: auth.settings.URL_QRIS,
          rekening: auth.settings.NOMOR_REKENING,
          rekening1: auth.settings.NOMOR_REKENING_1 || auth.settings.NOMOR_REKENING,
          rekening2: auth.settings.NOMOR_REKENING_2 || "",
          shopeepay: auth.settings.EWALLET_SHOPEEPAY || "",
          gopay: auth.settings.EWALLET_GOPAY || ""
        }
      });
    }

    // 4.2 Update Status Pesanan
    if (action === "updateOrderStatus") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid) {
        return createJsonResponse({ status: "error", message: "PIN Keamanan tidak valid." });
      }

      const orderId = String(payload.orderId || "").trim();
      const newStatus = String(payload.newStatus || "").trim();
      const updated = updateOrderStatusDiSheet(ss, orderId, newStatus);

      if (!updated) {
        return createJsonResponse({ status: "error", message: `Nota ${orderId} tidak ditemukan.` });
      }

      return createJsonResponse({
        status: "success",
        message: `Status nota ${orderId} berhasil diubah menjadi "${newStatus}".`,
        orderId: orderId,
        newStatus: newStatus
      });
    }

    // 4.3 Quick Update Stok
    if (action === "updateStock") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid) {
        return createJsonResponse({ status: "error", message: "PIN Keamanan tidak valid." });
      }

      const prodId = String(payload.id || "").trim();
      const sheetProduk = ss.getSheetByName(TAB_PRODUK);
      if (!sheetProduk) throw new Error("Tab Produk tidak ditemukan.");

      upgradeTabProduk(sheetProduk);
      const cols = getProdukColIndices(sheetProduk);
      const data = sheetProduk.getDataRange().getValues();
      let newStock = 0;
      let found = false;

      for (let i = 1; i < data.length; i++) {
        const rowIdStr = String(data[i][cols.colId - 1] || "").trim().toUpperCase();
        if (rowIdStr === prodId.toUpperCase() || (prodId && rowIdStr.replace(/[^A-Z0-9]/g, "") === prodId.toUpperCase().replace(/[^A-Z0-9]/g, ""))) {
          const current = Number(data[i][cols.colStok - 1]) || 0;
          if (payload.delta !== undefined) {
            newStock = Math.max(0, current + Number(payload.delta));
          } else {
            newStock = Math.max(0, Number(payload.stock) || 0);
          }
          sheetProduk.getRange(i + 1, cols.colStok).setValue(newStock);
          found = true;
          break;
        }
      }

      if (!found) {
        return createJsonResponse({ status: "error", message: `Produk ${prodId} tidak ditemukan.` });
      }

      return createJsonResponse({
        status: "success",
        message: `Stok produk ${prodId} diperbarui menjadi ${newStock}.`,
        id: prodId,
        newStock: newStock
      });
    }

    // 4.4 Simpan / Edit Produk ATK, Kosmetik & Kelontongan (Khusus Admin)
    if (action === "saveProduct" || action === "simpanProduk") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak mengelola produk." });
      }

      const sheetProduk = ss.getSheetByName(TAB_PRODUK);
      if (!sheetProduk) throw new Error("Tab Produk tidak ditemukan.");

      upgradeTabProduk(sheetProduk);
      const cols = getProdukColIndices(sheetProduk);

      let imageUrl = String(payload.imageUrl || "").trim();
      if (payload.imageBase64) {
        imageUrl = saveBase64ToDriveFolder(
          payload.imageBase64,
          "Produk_" + Date.now() + "_" + (payload.imageName || "foto.jpg"),
          SUBFOLDER_PRODUK
        );
      }
      imageUrl = convertDriveUrlToLh3(imageUrl);

      const data = sheetProduk.getDataRange().getValues();
      let prodId = String(payload.id || payload.barcode || "").trim();
      let rowIndex = -1;

      // Jika produk tidak memiliki barcode fisik atau AI tidak menemukan barcode pada foto,
      // buatkan otomatis ID Toko unik berbasis timestamp/urutan (contoh: DLN-899XXXX)
      if (!prodId || prodId.toLowerCase() === "undefined" || prodId.toLowerCase() === "null") {
        const rand4 = Math.floor(1000 + Math.random() * 9000);
        prodId = "DLN-899" + String(Date.now()).slice(-3) + rand4.toString().slice(-2);
      } else {
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][cols.colId - 1]).trim().toUpperCase() === prodId.toUpperCase()) {
            rowIndex = i + 1;
            break;
          }
        }
      }

      const name = String(payload.name || "Produk Baru").trim();
      const category = String(payload.category || "Umum").trim();
      const hargaJual = Number(payload.price || payload.hargaJual || payload.harga_jual) || 0;
      const hargaBeli = Number(payload.costPrice || payload.hargaBeli || payload.harga_beli || payload.hargaModal || payload.harga_modal || payload.hpp) || Math.round(hargaJual * 0.8);
      const stock = Number(payload.stock || payload.stok) || 0;
      const unit = String(payload.unit || payload.satuan || "Pcs").trim();
      const description = String(payload.description || payload.deskripsi || "").trim();
      const status = String(payload.status || "Aktif").trim();

      if (rowIndex > 0) {
        if (!imageUrl) imageUrl = String(data[rowIndex - 1][cols.colFoto - 1] || "");
        imageUrl = convertDriveUrlToLh3(imageUrl);

        sheetProduk.getRange(rowIndex, cols.colNama).setValue(name);
        sheetProduk.getRange(rowIndex, cols.colKategori).setValue(category);
        if (cols.colHargaBeli > 0) sheetProduk.getRange(rowIndex, cols.colHargaBeli).setValue(hargaBeli);
        sheetProduk.getRange(rowIndex, cols.colHargaJual).setValue(hargaJual);
        sheetProduk.getRange(rowIndex, cols.colStok).setValue(stock);
        sheetProduk.getRange(rowIndex, cols.colSatuan).setValue(unit);
        sheetProduk.getRange(rowIndex, cols.colFoto).setValue(imageUrl);
        sheetProduk.getRange(rowIndex, cols.colDeskripsi).setValue(description);
        if (cols.colStatus > 0) sheetProduk.getRange(rowIndex, cols.colStatus).setValue(status);

        return createJsonResponse({
          status: "success",
          message: `Produk "${name}" berhasil diperbarui.`,
          id: prodId,
          imageUrl: imageUrl,
          product: {
            id: prodId,
            name: name,
            category: category,
            costPrice: hargaBeli,
            price: hargaJual,
            stock: stock,
            unit: unit,
            image: imageUrl,
            description: description,
            status: status,
            rating: 4.9,
            sold: 100
          }
        });
      } else {
        if (!imageUrl) {
          imageUrl = "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500";
        }
        imageUrl = convertDriveUrlToLh3(imageUrl);

        const newRow = [
          prodId,
          name,
          category,
          hargaBeli,
          hargaJual,
          stock,
          unit,
          imageUrl,
          description,
          status
        ];
        sheetProduk.appendRow(newRow);

        return createJsonResponse({
          status: "success",
          message: `Produk baru "${name}" berhasil ditambahkan dengan ID ${prodId}.`,
          id: prodId,
          imageUrl: imageUrl,
          product: {
            id: prodId,
            name: name,
            category: category,
            costPrice: hargaBeli,
            price: hargaJual,
            stock: stock,
            unit: unit,
            image: imageUrl,
            description: description,
            status: status,
            rating: 5.0,
            sold: 0
          }
        });
      }
    }

    // 4.5 Perbarui Pengaturan Toko & Profil
    if (action === "updateSettings") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak mengubah pengaturan toko." });
      }

      let sheetPengaturan = ss.getSheetByName(TAB_PENGATURAN);
      if (!sheetPengaturan) {
        sheetPengaturan = ss.insertSheet(TAB_PENGATURAN);
        setupTabPengaturan(sheetPengaturan);
      }

      let urlQris = payload.URL_QRIS;
      if (payload.qrisBase64) {
        urlQris = saveBase64ToDriveFolder(
          payload.qrisBase64,
          "QRIS_Delina_" + Date.now() + ".png",
          SUBFOLDER_QRIS
        );
      }

      let urlLogo = payload.URL_LOGO;
      if (payload.logoBase64) {
        urlLogo = saveBase64ToDriveFolder(
          payload.logoBase64,
          "Logo_Delina_" + Date.now() + ".png",
          SUBFOLDER_PRODUK
        );
      }

      const updates = {
        NAMA_TOKO: payload.NAMA_TOKO,
        SLOGAN_TOKO: payload.SLOGAN_TOKO,
        NO_WA_TOKO: payload.NO_WA_TOKO,
        ALAMAT_TOKO: payload.ALAMAT_TOKO,
        URL_TELEGRAM_BOT: payload.URL_TELEGRAM_BOT,
        URL_GOOGLE_MAPS: payload.URL_GOOGLE_MAPS,
        NOMOR_REKENING: payload.NOMOR_REKENING || payload.NOMOR_REKENING_1,
        NOMOR_REKENING_1: payload.NOMOR_REKENING_1,
        NOMOR_REKENING_2: payload.NOMOR_REKENING_2,
        EWALLET_SHOPEEPAY: payload.EWALLET_SHOPEEPAY,
        EWALLET_GOPAY: payload.EWALLET_GOPAY,
        PIN_ADMIN: payload.PIN_ADMIN,
        PIN_KASIR: payload.PIN_KASIR,
        URL_QRIS: urlQris,
        URL_LOGO: urlLogo
      };

      const data = sheetPengaturan.getDataRange().getValues();
      const existingKeys = {};
      for (let i = 1; i < data.length; i++) {
        const k = String(data[i][0] || "").trim();
        if (k) existingKeys[k] = i + 1;
      }

      for (const k in updates) {
        if (updates[k] !== undefined && updates[k] !== null && String(updates[k]).trim() !== "") {
          const val = String(updates[k]).trim();
          if (existingKeys[k]) {
            sheetPengaturan.getRange(existingKeys[k], 2).setValue(val);
          } else {
            sheetPengaturan.appendRow([k, val, "Pengaturan Tambahan"]);
          }
        }
      }

      return createJsonResponse({
        status: "success",
        message: "Alhamdulillah! Pengaturan Toko Delina berhasil diperbarui.",
        urlQris: urlQris,
        urlLogo: urlLogo
      });
    }

    // 4.6 Kelola Kupon Diskon
    if (action === "saveCoupon") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak mengelola kupon." });
      }

      let sheetKupon = ss.getSheetByName(TAB_KUPON);
      if (!sheetKupon) {
        sheetKupon = ss.insertSheet(TAB_KUPON);
        setupTabKupon(sheetKupon);
      }

      const code = String(payload.code || "").trim().toUpperCase();
      if (!code) {
        return createJsonResponse({ status: "error", message: "Kode kupon tidak boleh kosong." });
      }

      const data = sheetKupon.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === code) {
          rowIndex = i + 1;
          break;
        }
      }

      if (payload.isDelete) {
        if (rowIndex > 0) {
          sheetKupon.deleteRow(rowIndex);
          return createJsonResponse({ status: "success", message: `Kupon "${code}" berhasil dihapus.` });
        }
        return createJsonResponse({ status: "error", message: `Kupon "${code}" tidak ditemukan.` });
      }

      if (rowIndex > 0) {
        sheetKupon.getRange(rowIndex, 2).setValue(String(payload.type || "NOMINAL").toUpperCase());
        sheetKupon.getRange(rowIndex, 3).setValue(Number(payload.value) || 0);
        sheetKupon.getRange(rowIndex, 4).setValue(Number(payload.minSpend) || 0);
        sheetKupon.getRange(rowIndex, 5).setValue(String(payload.status || "AKTIF").toUpperCase());
        sheetKupon.getRange(rowIndex, 6).setValue(String(payload.description || ""));
        return createJsonResponse({ status: "success", message: `Kupon "${code}" berhasil diperbarui.` });
      }

      sheetKupon.appendRow([
        code,
        String(payload.type || "NOMINAL").toUpperCase(),
        Number(payload.value) || 0,
        Number(payload.minSpend) || 0,
        String(payload.status || "AKTIF").toUpperCase(),
        String(payload.description || "")
      ]);

      return createJsonResponse({ status: "success", message: `Kupon baru "${code}" berhasil ditambahkan.` });
    }

    // 4.7 Perbarui Tarif Fotokopi & Jilid
    if (action === "updateRates") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak mengubah tarif fotokopi." });
      }

      const sheetTarif = ss.getSheetByName(TAB_TARIF);
      if (!sheetTarif) throw new Error("Tab Tarif_Fotokopi tidak ditemukan.");

      const newRates = payload.rates || {};
      const data = sheetTarif.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        const code = String(data[i][0]).trim();
        if (newRates[code] !== undefined) {
          sheetTarif.getRange(i + 1, 3).setValue(Number(newRates[code]) || 0);
        }
      }

      return createJsonResponse({
        status: "success",
        message: "Alhamdulillah! Tarif fotokopi dan jilid berhasil diperbarui."
      });
    }

    // =========================================================
    // JALUR 5: CHECKOUT & PESANAN BARU DARI PELANGGAN (WEBSITE)
    // =========================================================
    let linkDokumenFotokopi = "-";
    if (payload.fotokopiFile && payload.fotokopiFile.base64) {
      linkDokumenFotokopi = saveBase64ToDriveFolder(
        payload.fotokopiFile.base64,
        payload.orderId + "_Dokumen_" + (payload.fotokopiFile.name || "fotokopi.pdf"),
        SUBFOLDER_FOTOKOPI
      );
    }

    let linkBuktiBayar = "-";
    if (payload.paymentProof && payload.paymentProof.base64) {
      linkBuktiBayar = saveBase64ToDriveFolder(
        payload.paymentProof.base64,
        payload.orderId + "_BuktiBayar_" + (payload.paymentProof.name || "struk.jpg"),
        SUBFOLDER_BUKTI
      );
    }

    let rincianText = "";
    if (Array.isArray(payload.items)) {
      rincianText = payload.items
        .map((item, idx) => {
          let extra = (item && item.notes) ? ` (Catatan: ${item.notes})` : "";
          let grosirInfo = (item && item.isGrosir) ? ` [🏷️ Grosir]` : "";
          const itName = (item && item.name) ? item.name : "Barang";
          const itQty = Number(item && item.qty) || 1;
          const itPrice = Number(item && item.price) || 0;
          const itCost = Number(item && (item.costPrice || item.hargaBeli || item.hpp || item.hargaModal)) || 0;
          const costPart = itCost > 0 ? ` [HPP: Rp ${itCost.toLocaleString("id-ID")}]` : "";
          return `${idx + 1}. ${itName} [${itQty}x @ Rp ${itPrice.toLocaleString("id-ID")}]${grosirInfo}${costPart}${extra}`;
        })
        .join("\n");
    }

    if (payload.couponCode) {
      rincianText += `\n[🎟️ Diskon Kupon: ${payload.couponCode} (-Rp ${Number(payload.discountAmount || 0).toLocaleString("id-ID")})]`;
    }

    // Kurangi Stok Produk di Tab Produk secara Aman
    const sheetProduk = ss.getSheetByName(TAB_PRODUK);
    if (sheetProduk && Array.isArray(payload.items)) {
      kurangiStokProduk(sheetProduk, payload.items);
    }

    // Tambah +1 Poin Belanja ke Member jika No HP Terdaftar
    const memberPhoneInput = String(payload.memberPhone || payload.customerPhone || "").trim();
    if (memberPhoneInput) {
      try {
        tambahPoinBelanjaMember(ss, memberPhoneInput, 1, payload.customerName);
      } catch (errMember) {
        Logger.log("Notice tambah poin member: " + errMember.toString());
      }
    }

    // Catat Baris Baru ke Tab Pesanan
    const sheetPesanan = ss.getSheetByName(TAB_PESANAN);
    if (!sheetPesanan) {
      throw new Error(`Tab ${TAB_PESANAN} tidak ditemukan di Google Sheets.`);
    }

    const orderTimeNow = payload.orderTime || Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm");
    const newRow = [
      payload.orderId,
      orderTimeNow,
      payload.customerName,
      payload.customerPhone,
      payload.deliveryMethod,
      payload.customerAddress || "-",
      rincianText,
      payload.totalAkhir || 0,
      linkDokumenFotokopi,
      linkBuktiBayar,
      "Menunggu Verifikasi Toko"
    ];

    sheetPesanan.appendRow(newRow);

    // Kirim Notifikasi Instan ke Telegram Pemilik Toko
    try {
      kirimNotifikasiPesananTelegram(payload, linkDokumenFotokopi, linkBuktiBayar);
    } catch (notifErr) {
      Logger.log("Notice kirim notif Telegram: " + notifErr.toString());
    }

    return createJsonResponse({
      status: "success",
      message: "Alhamdulillah! Pesanan berhasil dicatat ke Google Sheets & Drive Toko Delina.",
      orderId: payload.orderId,
      linkDokumen: linkDokumenFotokopi,
      linkBukti: linkBuktiBayar
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Gagal memproses permintaan di backend: " + error.toString()
    });
  }
}

/**
 * =========================================================================
 * 4. FUNGSI PENDUKUNG DATA (PESANAN, PRODUK, TARIF, RINGKASAN)
 * =========================================================================
 */
function ambilDaftarPesanan(ss) {
  const sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  const orders = [];
  if (!sheetPesanan || sheetPesanan.getLastRow() <= 1) return orders;

  const data = sheetPesanan.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1 && orders.length < 100; i--) {
    const r = data[i];
    if (r[0]) {
      orders.push({
        orderId: String(r[0]),
        orderTime: String(r[1] || ""),
        customerName: String(r[2] || ""),
        customerPhone: String(r[3] || ""),
        deliveryMethod: String(r[4] || ""),
        customerAddress: String(r[5] || ""),
        itemsText: String(r[6] || ""),
        total: Number(r[7]) || 0,
        fotokopiLink: String(r[8] || "-"),
        paymentProofLink: String(r[9] || "-"),
        orderStatus: String(r[10] || "Menunggu Verifikasi Toko")
      });
    }
  }
  return orders;
}

function updateOrderStatusDiSheet(ss, orderId, newStatus) {
  if (!ss) ss = getDelinaSpreadsheet();
  const sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  if (!sheetPesanan) return false;

  const data = sheetPesanan.getDataRange().getValues();
  const target = String(orderId || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

  for (let i = 1; i < data.length; i++) {
    const rowNota = String(data[i][0] || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (rowNota === target || rowNota.endsWith(target)) {
      sheetPesanan.getRange(i + 1, 11).setValue(newStatus);
      return true;
    }
  }
  return false;
}

function cariPesananDiSheet(ss, query) {
  if (!ss) ss = getDelinaSpreadsheet();
  const sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  if (!sheetPesanan || sheetPesanan.getLastRow() <= 1) return null;

  const data = sheetPesanan.getDataRange().getValues();
  const cleanQ = String(query || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

  for (let i = data.length - 1; i >= 1; i--) {
    const r = data[i];
    const notaId = String(r[0] || "").trim().toUpperCase();
    const cleanNota = notaId.replace(/[^A-Z0-9-]/g, "");

    if (cleanNota.includes(cleanQ) || (cleanQ.length >= 4 && cleanNota.endsWith(cleanQ))) {
      return {
        orderId: String(r[0]),
        orderTime: String(r[1] || "-"),
        customerName: String(r[2] || "-"),
        customerPhone: String(r[3] || "-"),
        deliveryMethod: String(r[4] || "Ambil di Toko"),
        customerAddress: String(r[5] || "-"),
        itemsText: String(r[6] || "-"),
        total: Number(r[7]) || 0,
        fotokopiLink: String(r[8] || "-"),
        paymentProofLink: String(r[9] || "-"),
        orderStatus: String(r[10] || "Menunggu Verifikasi Toko")
      };
    }
  }
  return null;
}

// -------------------------------------------------------------
// HELPER STRUKTUR TAB PRODUK (MENDUKUNG 10 KOLOM LENGKAP & 8 KOLOM LAMA)
// -------------------------------------------------------------
function getProdukColIndices(sheetProduk) {
  if (!sheetProduk || sheetProduk.getLastColumn() < 1) {
    return {
      has10Cols: false,
      colId: 1, colNama: 2, colKategori: 3, colHargaBeli: 0,
      colHargaJual: 4, colStok: 5, colSatuan: 6, colFoto: 7,
      colDeskripsi: 8, colStatus: 0
    };
  }

  const header = sheetProduk.getRange(1, 1, 1, Math.max(1, sheetProduk.getLastColumn())).getValues()[0].map(h => String(h || "").trim().toLowerCase());
  let idxHargaBeli = header.indexOf("harga_beli");
  if (idxHargaBeli === -1) idxHargaBeli = header.indexOf("harga beli");
  if (idxHargaBeli === -1) idxHargaBeli = header.indexOf("harga_modal");
  if (idxHargaBeli === -1) idxHargaBeli = header.indexOf("harga modal");
  if (idxHargaBeli === -1) idxHargaBeli = header.indexOf("hpp");
  const idxHargaJual = header.indexOf("harga_jual") > -1 ? header.indexOf("harga_jual") : (header.indexOf("harga jual") > -1 ? header.indexOf("harga jual") : header.indexOf("harga"));
  const idxFoto = header.indexOf("url_foto") > -1 ? header.indexOf("url_foto") : (header.indexOf("foto") > -1 ? header.indexOf("foto") : header.indexOf("url foto"));

  return {
    has10Cols: idxHargaBeli > -1,
    colId: header.indexOf("id") > -1 ? header.indexOf("id") + 1 : 1,
    colNama: header.indexOf("nama") > -1 ? header.indexOf("nama") + 1 : 2,
    colKategori: header.indexOf("kategori") > -1 ? header.indexOf("kategori") + 1 : 3,
    colHargaBeli: idxHargaBeli > -1 ? idxHargaBeli + 1 : 0,
    colHargaJual: idxHargaJual > -1 ? idxHargaJual + 1 : 4,
    colStok: header.indexOf("stok") > -1 ? header.indexOf("stok") + 1 : (idxHargaBeli > -1 ? 6 : 5),
    colSatuan: header.indexOf("satuan") > -1 ? header.indexOf("satuan") + 1 : (idxHargaBeli > -1 ? 7 : 6),
    colFoto: idxFoto > -1 ? idxFoto + 1 : (idxHargaBeli > -1 ? 8 : 7),
    colDeskripsi: header.indexOf("deskripsi") > -1 ? header.indexOf("deskripsi") + 1 : (idxHargaBeli > -1 ? 9 : 8),
    colStatus: header.indexOf("status") > -1 ? header.indexOf("status") + 1 : (idxHargaBeli > -1 ? 10 : 0)
  };
}

function upgradeTabProduk(sheetProduk) {
  if (!sheetProduk || sheetProduk.getLastRow() < 1) return;
  const lastCol = sheetProduk.getLastColumn();
  const header = sheetProduk.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim().toLowerCase());
  if (header.includes("harga_beli") || header.includes("harga beli") || header.includes("harga_modal") || header.includes("harga modal") || header.includes("hpp")) {
    return; // Sudah versi 10 kolom
  }

  const lastRow = sheetProduk.getLastRow();
  // 1. Sisipkan kolom Harga_Beli di posisi 4
  sheetProduk.insertColumnAfter(3);
  sheetProduk.getRange(1, 4).setValue("Harga_Beli");

  if (lastRow > 1) {
    const hargaJualValues = sheetProduk.getRange(2, 5, lastRow - 1, 1).getValues();
    const hargaBeliValues = hargaJualValues.map(r => [Math.round((Number(r[0]) || 0) * 0.8)]);
    sheetProduk.getRange(2, 4, lastRow - 1, 1).setValues(hargaBeliValues);
  }

  // Ganti header kolom 5 menjadi Harga_Jual
  sheetProduk.getRange(1, 5).setValue("Harga_Jual");

  // Tambahkan kolom Status di posisi 10 jika belum ada
  if (sheetProduk.getLastColumn() < 10) {
    sheetProduk.getRange(1, 10).setValue("Status");
    if (lastRow > 1) {
      const statusValues = Array(lastRow - 1).fill(["Aktif"]);
      sheetProduk.getRange(2, 10, lastRow - 1, 1).setValues(statusValues);
    }
  }

  formatHeaderSheet(sheetProduk, 10);
  sheetProduk.autoResizeColumns(1, 10);
}

function ambilDaftarProduk(ss) {
  const sheetProduk = ss.getSheetByName(TAB_PRODUK);
  const produkList = [];
  if (!sheetProduk || sheetProduk.getLastRow() <= 1) return produkList;

  upgradeTabProduk(sheetProduk);
  const cols = getProdukColIndices(sheetProduk);
  const data = sheetProduk.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const idVal = row[cols.colId - 1];
    if (idVal) {
      const hargaJual = Number(row[cols.colHargaJual - 1]) || 0;
      const hargaBeli = cols.colHargaBeli > 0 ? (Number(row[cols.colHargaBeli - 1]) || Math.round(hargaJual * 0.8)) : Math.round(hargaJual * 0.8);
      const statusVal = cols.colStatus > 0 ? String(row[cols.colStatus - 1] || "Aktif") : "Aktif";

      produkList.push({
        id: String(idVal),
        name: String(row[cols.colNama - 1] || ""),
        category: String(row[cols.colKategori - 1] || "Umum"),
        costPrice: hargaBeli,
        price: hargaJual,
        stock: Number(row[cols.colStok - 1]) || 0,
        unit: String(row[cols.colSatuan - 1] || "Pcs"),
        image: convertDriveUrlToLh3(String(row[cols.colFoto - 1] || "")),
        description: String(row[cols.colDeskripsi - 1] || ""),
        status: statusVal,
        rating: 4.9,
        sold: 100
      });
    }
  }
  return produkList;
}

function ambilDaftarTarif(ss) {
  const sheetTarif = ss.getSheetByName(TAB_TARIF);
  const tarifList = {};
  if (!sheetTarif || sheetTarif.getLastRow() <= 1) return tarifList;

  const data = sheetTarif.getDataRange().getValues();
  for (let j = 1; j < data.length; j++) {
    const row = data[j];
    if (row[0]) {
      tarifList[row[0]] = {
        nama: String(row[1] || ""),
        harga: Number(row[2] || 0)
      };
    }
  }
  return tarifList;
}

function hitungRingkasanDashboard(orders, products) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const monthNamesId = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const todayIndoStr = `${currentDate} ${monthNamesId[currentMonth]} ${currentYear}`;
  const todaySlashStr = Utilities.formatDate(now, "Asia/Jakarta", "dd/MM/yyyy");
  const todayDashStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");

  let omzetHariIni = 0;
  let labaKotorHariIni = 0;
  let omzetTotal = 0;
  let pesananHariIni = 0;
  let pesananMenunggu = 0;
  let pesananDiproses = 0;
  let pesananSiap = 0;
  let pesananSelesai = 0;

  // Pemetaan katalog produk untuk pencarian HPP / Harga Modal
  const prodCostMap = {};
  if (Array.isArray(products)) {
    products.forEach(p => {
      if (p) {
        const cost = Number(p.costPrice) || Math.round((Number(p.price) || 0) * 0.8);
        if (p.id) prodCostMap[String(p.id).toLowerCase()] = cost;
        if (p.name) prodCostMap[String(p.name).toLowerCase().trim()] = cost;
      }
    });
  }

  orders.forEach(o => {
    const t = String(o.orderTime || "");
    const isToday = t.includes(todayIndoStr) || t.includes(todaySlashStr) || t.includes(todayDashStr);
    const statusLower = (o.orderStatus || "").toLowerCase();
    const isBatal = statusLower.includes("batal");

    if (isToday) {
      pesananHariIni++;
      if (!isBatal) {
        const orderTotal = (Number(o.total) || 0);
        omzetHariIni += orderTotal;

        // Hitung estimasi Laba Kotor dari rincian item
        let orderProfit = 0;
        const lines = String(o.itemsText || "").split("\n");
        let parsedCount = 0;

        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("[") || trimmed.startsWith("🎟️")) return;

          // Cek pola: 1. Nama Barang [2x @ Rp 10.000] [HPP: Rp 8.000]
          const hppMatch = trimmed.match(/\[HPP:\s*(?:Rp\s*)?([\d\.]+)\]/i);
          const qtyPriceMatch = trimmed.match(/\[(\d+)(?:x|\s*pcs|\s*buah)?\s*@\s*(?:Rp\s*)?([\d\.]+)\]/i);

          if (qtyPriceMatch) {
            const qty = Number(qtyPriceMatch[1]) || 1;
            const jual = Number(qtyPriceMatch[2].replace(/\./g, "")) || 0;
            let beli = 0;

            if (hppMatch) {
              beli = Number(hppMatch[1].replace(/\./g, "")) || 0;
            } else {
              // Cari nama produk
              const nameMatch = trimmed.match(/^\d+[\.\)]\s*(.+?)\s*\[/);
              const itemName = nameMatch ? nameMatch[1].trim().toLowerCase() : "";
              if (itemName && prodCostMap[itemName] !== undefined) {
                beli = prodCostMap[itemName];
              } else {
                const matchedKey = Object.keys(prodCostMap).find(k => k.includes(itemName) || (itemName && itemName.includes(k)));
                beli = matchedKey ? prodCostMap[matchedKey] : Math.round(jual * 0.8);
              }
            }
            const itemProfit = Math.max(0, (jual - beli) * qty);
            orderProfit += itemProfit;
            parsedCount++;
          }
        });

        if (parsedCount === 0 && orderTotal > 0) {
          // Estimasi fallback profit jika rincian bebas (asumsi marjin rata-rata 20%)
          orderProfit = Math.round(orderTotal * 0.20);
        }
        labaKotorHariIni += orderProfit;
      }
    }

    if (!isBatal) {
      omzetTotal += (Number(o.total) || 0);
    }

    if (statusLower.includes("menunggu") || statusLower.includes("verifikasi")) {
      pesananMenunggu++;
    } else if (statusLower.includes("proses")) {
      pesananDiproses++;
    } else if (statusLower.includes("siap")) {
      pesananSiap++;
    } else if (statusLower.includes("selesai")) {
      pesananSelesai++;
    }
  });

  const marginPersenHariIni = omzetHariIni > 0 ? Math.round((labaKotorHariIni / omzetHariIni) * 100) : 0;

  // Hitung Omzet Mingguan (Senin s/d Minggu)
  const dayOfWeek = now.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const weeklyOmzet = daysOfWeek.map((dayName, idx) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + idx);
    const dateSlash = Utilities.formatDate(targetDate, "Asia/Jakarta", "dd/MM/yyyy");
    const dateDash = Utilities.formatDate(targetDate, "Asia/Jakarta", "yyyy-MM-dd");
    const dateIndo = `${targetDate.getDate()} ${monthNamesId[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
    const isCurrentDay = targetDate.toDateString() === now.toDateString();

    let dayTotal = 0;
    let dayCount = 0;

    orders.forEach(o => {
      const t = String(o.orderTime || "");
      const matched = t.includes(dateSlash) || t.includes(dateDash) || t.includes(dateIndo);
      const st = (o.orderStatus || "").toLowerCase();
      if (matched && !st.includes("batal")) {
        dayTotal += (Number(o.total) || 0);
        dayCount++;
      }
    });

    return {
      day: dayName,
      dateFormatted: Utilities.formatDate(targetDate, "Asia/Jakarta", "dd/MM"),
      total: dayTotal,
      orderCount: dayCount,
      isToday: isCurrentDay
    };
  });

  const lowStockProducts = products.filter(p => Number(p.stock) <= 3);

  return {
    omzetHariIni: omzetHariIni,
    labaKotorHariIni: labaKotorHariIni,
    marginPersenHariIni: marginPersenHariIni,
    omzetTotal: omzetTotal,
    pesananHariIni: pesananHariIni,
    pesananMenunggu: pesananMenunggu,
    pesananDiproses: pesananDiproses,
    pesananSiap: pesananSiap,
    pesananSelesai: pesananSelesai,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.slice(0, 10),
    totalProduk: products.length,
    totalPesanan: orders.length,
    weeklyOmzet: weeklyOmzet
  };
}

/**
 * Generator 50 Data Dummy Pesanan & Perkaya Katalog Produk / Tarif
 */
function generateDataDummyLengkap(ss) {
  if (!ss) ss = getDelinaSpreadsheet();

  // 1. Perkaya Tab Produk dengan ATK Lengkap & Paket Bundling
  let sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (!sheetProduk) sheetProduk = ss.insertSheet(TAB_PRODUK);
  sheetProduk.clear();
  const headerProduk = [["ID", "Nama", "Kategori", "Harga", "Stok", "Satuan", "URL_Foto", "Deskripsi"]];
  sheetProduk.getRange(1, 1, 1, headerProduk[0].length).setValues(headerProduk);
  formatHeaderSheet(sheetProduk, headerProduk[0].length);

  const masterProduk = [
    ["ATK-001", "Kertas HVS PaperOne A4 75gsm (1 Rim / 500 Lembar)", "Kertas & Buku", 48000, 85, "Rim", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Kertas HVS putih bersih berkualitas tinggi dengan teknologi ColorLok. Sangat cocok untuk cetak dokumen resmi, tugas sekolah, skripsi, dan laporan kantor."],
    ["ATK-002", "Buku Tulis Sinar Dunia (SiDu) Kiky 38 Lembar - Pack Isi 10 Buku", "Kertas & Buku", 36500, 42, "Pack", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", "Buku tulis bergaris tebal standar sekolah dan kuliah merk Sinar Dunia. Kertas halus tidak tembus tinta."],
    ["ATK-003", "Pulpen Gel Zebra Sarasa Clip 0.5mm Hitam / Biru Tinta Pekat", "Alat Tulis & Pulpen", 15500, 110, "Pcs", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80", "Pulpen gel Jepang terbaik dengan klip pegas fleksibel. Tinta pigmen berbasis air, tahan air dan tidak luntur."],
    ["ATK-004", "Paket Pulpen Standard AE7 0.5 Hitam (1 Lusin / 12 Batang)", "Alat Tulis & Pulpen", 24000, 65, "Lusin", "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80", "Pulpen legendaris sejuta umat. Ujung ballpoint halus lancar menulis ribuan kata tanpa macet."],
    ["ATK-005", "Map Folder Plastik L Document Bag Clear Holder F4 Folio", "Peralatan Kantor & Map", 6500, 180, "Pcs", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80", "Map plastik L bening ukuran Folio/F4. Menyimpan dokumen penting aman dari cipratan air dan debu."],
    ["ATK-006", "Stapler Joyko HD-10 + Isi Ulang Staples No. 10 (Set Lengkap)", "Peralatan Kantor & Map", 18500, 45, "Set", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Stapler Joyko orisinal berbahan logam kokoh dilapisi plastik ergonomis. Sudah termasuk 1 kotak anak staples No. 10."],
    ["ATK-007", "Kertas Double Folio Bergaris Merk Sinar Dunia (1 Pack / 100 Lembar)", "Kertas & Buku", 19500, 55, "Pack", "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80", "Kertas double folio bergaris presisi untuk ujian sekolah, tugas kuliah, dan pembuatan berkas laporan."],
    ["ATK-008", "Tipe-X Kertas Kering Joyko Correction Tape CT-522 (Panjang 12m)", "Alat Tulis & Pulpen", 9000, 70, "Pcs", "https://images.unsplash.com/photo-1585336261026-6218f2705574?w=600&auto=format&fit=crop&q=80", "Pita koreksi kering instant tanpa noda dan bau. Langsung bisa ditulis kembali di atasnya."],
    ["ATK-009", "Paket Jilid Skripsi Kilat (Hard Cover + Emboss Emas + 100 Hal Cetak)", "Jasa Cetak & Fotokopi", 45000, 999, "Paket", "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80", "Layanan kilat jilid hardcover tebal dengan foil tulisan emas mengkilap. Sudah termasuk pita pembatas dan sudut siku rapi standar universitas."],
    ["ATK-010", "Paket Modul Kantor & Pelatihan (Jilid Spiral Kawat + Cover Mika + 50 Hal)", "Jasa Cetak & Fotokopi", 35000, 999, "Paket", "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80", "Paket cetak booklet / modul presentasi perusahaan. Menggunakan jilid spiral kawat besi kokoh dan cover mika doff elegan."],
    ["ATK-011", "Paket Bundling ATK Sekolah Juara (Buku SiDu + 3 Pulpen Gel + Tipe-X)", "Paket Hemat", 68000, 25, "Paket", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80", "Paket komplit hemat persiapan masuk sekolah semester baru. Berisi 1 pack buku tulis SiDu, 3 pulpen gel Sarasa, pensil 2B, dan Tipe-X Joyko."],
    ["ATK-012", "Paket Starter Mahasiswa Baru (Binder B5 + Loose Leaf 100 Lbr + Sarasa)", "Paket Hemat", 52000, 30, "Paket", "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=600&auto=format&fit=crop&q=80", "Bundling favorit mahasiswa baru: Binder ring B5 pastel, isi kertas bergaris 100 lembar, pulpen Sarasa hitam, dan set index pembatas warna."],
    ["ATK-013", "Paket Pengadaan Kantor Ekonomis (Kertas HVS 5 Rim + Pulpen + Map)", "Paket Hemat", 275000, 15, "Paket", "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80", "Paket bundling kebutuhan bulanan kantor atau instansi. Hemat hingga 15% dibanding beli eceran."],
    ["ATK-014", "Spidol Whiteboard Snowman BG-12 Hitam / Biru (Non-Permanent)", "Alat Tulis & Pulpen", 9500, 2, "Pcs", "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80", "Spidol papan tulis mudah dihapus bersih tanpa residu. Tinta pekat ramah lingkungan. (Stok menipis sisa 2 pcs)."],
    ["ATK-015", "Gunting Kantor Stainless Steel Kenko SC-838 Anti Karat", "Peralatan Kantor & Map", 12000, 1, "Pcs", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600&auto=format&fit=crop&q=80", "Gunting tajam berbahan baja stainless dengan pegangan karet lembut. (Stok menipis sisa 1 pcs)."],
    ["ATK-016", "Sticky Notes Joyko Pastel 3x3 Inch (Isi 100 Lembar Sticky Pad)", "Peralatan Kantor & Map", 7500, 3, "Pad", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Kertas memo tempel warna pastel lembut dengan daya rekat kuat tidak merusak kertas."],
    ["ATK-017", "Penggaris Besi Joyko 30cm Presisi Baja Anti Patah", "Peralatan Kantor & Map", 8500, 60, "Pcs", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Penggaris logam baja anti karat berskala milimeter presisi."],
    ["ATK-018", "Kertas HVS PaperOne F4 Folio 75gsm (1 Rim / 500 Lembar)", "Kertas & Buku", 54000, 50, "Rim", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Kertas HVS ukuran Folio / F4 standar perkantoran dan notaris."]
  ];
  sheetProduk.getRange(2, 1, masterProduk.length, masterProduk[0].length).setValues(masterProduk);
  sheetProduk.autoResizeColumns(1, headerProduk[0].length);

  // 2. Perkaya Tab Tarif Fotokopi
  let sheetTarif = ss.getSheetByName(TAB_TARIF);
  if (!sheetTarif) sheetTarif = ss.insertSheet(TAB_TARIF);
  sheetTarif.clear();
  const headerTarif = [["Kode_Layanan", "Nama_Layanan", "Harga_Satuan"]];
  sheetTarif.getRange(1, 1, 1, headerTarif[0].length).setValues(headerTarif);
  formatHeaderSheet(sheetTarif, headerTarif[0].length);

  const masterTarif = [
    ["PRINT_BW_A4", "Fotokopi / Cetak Hitam-Putih HVS A4", 250],
    ["PRINT_COLOR_A4", "Fotokopi / Cetak Warna HVS A4 (Teks/Grafik)", 1000],
    ["PRINT_BW_F4", "Fotokopi / Cetak Hitam-Putih HVS F4 (Folio)", 300],
    ["PRINT_COLOR_F4", "Fotokopi / Cetak Warna HVS F4 (Folio)", 1200],
    ["PRINT_COLOR_FULL", "Cetak Warna Full Foto / Gambar Mengkilap", 2500],
    ["JILID_LAKBAN", "Jilid Lakban Biasa (Include Mika Bening Depan Belakang)", 3000],
    ["JILID_SPIRAL", "Jilid Spiral Kawat Modern Kalender/Buku", 12000],
    ["JILID_HARDCOVER", "Jilid Hardcover Skripsi / Tesis Emboss Foil Emas", 35000],
    ["LAMINATING_A4", "Laminating Panas Presisi A4 / F4 Anti Air", 4000],
    ["ONGKIR_KURIR", "Biaya Kirim Kurir Toko Delina (Area Sekitar)", 5000]
  ];
  sheetTarif.getRange(2, 1, masterTarif.length, masterTarif[0].length).setValues(masterTarif);
  sheetTarif.autoResizeColumns(1, headerTarif[0].length);

  // 3. Tab Pesanan: Generate 50 Pesanan Bervariasi (7 Hari Terakhir)
  let sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  if (!sheetPesanan) sheetPesanan = ss.insertSheet(TAB_PESANAN);
  sheetPesanan.clear();
  const headerPesanan = [[
    "ID_Nota", "Waktu", "Nama_Pembeli", "WhatsApp", "Metode_Ambil",
    "Alamat", "Rincian_Item", "Total_Bayar", "Link_File_Fotokopi",
    "Link_Bukti_Bayar", "Status_Pesanan"
  ]];
  sheetPesanan.getRange(1, 1, 1, headerPesanan[0].length).setValues(headerPesanan);
  formatHeaderSheet(sheetPesanan, headerPesanan[0].length);

  const customerNames = [
    "Ahmad Dahlan", "Siti Aisyah", "Muhammad Rizky", "Dewi Sartika", "Budi Hermawan",
    "Nurul Hidayah", "Fajar Pratama", "Tri Wahyuni", "Eko Prasetyo", "Indah Permata",
    "Agus Setiawan", "Rina Melati", "Hendra Saputra", "Anisa Rahmawati", "Bayu Wicaksono",
    "Sri Mulyani", "Dimas Anggara", "Ratna Sari", "Ilham Fauzi", "Wulandari",
    "Taufik Hidayat", "Lestari Putri", "Deni Firmansyah", "Yuni Astuti", "Farhan Maulana",
    "Dian Kusuma", "Wahyu Nugroho", "Maya Safitri", "Zulfa Azzahra", "Reza Fahlevi"
  ];

  const statuses = [
    "Menunggu Verifikasi Toko",
    "Sedang Diproses",
    "Siap Diambil di Toko",
    "Selesai"
  ];

  const sampleItemsPool = [
    "Kertas HVS PaperOne A4 75gsm (1x) - Rp 48.000",
    "Pulpen Gel Zebra Sarasa Clip 0.5 (2x) - Rp 31.000",
    "Buku Tulis Sinar Dunia 38 Lbr (1x) - Rp 36.500",
    "Map Folder Plastik L Clear (5x) - Rp 32.500",
    "Paket Jilid Skripsi Kilat (1x) - Rp 45.000",
    "Paket Modul Kantor & Pelatihan (2x) - Rp 70.000",
    "Paket Bundling ATK Sekolah Juara (1x) - Rp 68.000",
    "Paket Starter Mahasiswa Baru (1x) - Rp 52.000",
    "Fotokopi B/W HVS A4 80 Lbr + Jilid Lakban - Rp 23.000",
    "Cetak Warna Modul Kuliah 40 Lbr - Rp 40.000",
    "Stapler Joyko HD-10 + Isi (1x) - Rp 18.500",
    "Tipe-X Kertas Kering Joyko (2x) - Rp 18.000"
  ];

  const dummyOrders = [];
  const now = new Date();
  const monthNamesId = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  for (let i = 1; i <= 50; i++) {
    const notaNum = 1000 + i;
    const notaId = `#DLN-2026-${notaNum}`;

    let dayOffset = 0;
    if (i > 12 && i <= 22) dayOffset = 1;
    else if (i > 22 && i <= 30) dayOffset = 2;
    else if (i > 30 && i <= 36) dayOffset = 3;
    else if (i > 36 && i <= 41) dayOffset = 4;
    else if (i > 41 && i <= 46) dayOffset = 5;
    else if (i > 46) dayOffset = 6;

    const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const hour = 8 + (i % 12);
    const minute = (i * 7) % 60;
    const dateFormatted = `${targetDate.getDate()} ${monthNamesId[targetDate.getMonth()]} ${targetDate.getFullYear()}, ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} WIB`;

    const custName = customerNames[(i - 1) % customerNames.length];
    const phone = `0812${String(10000000 + i * 18723).slice(0, 8)}`;

    const isCourier = (i % 3 === 0);
    const delivery = isCourier ? "Diantar Kurir (+ Rp 5.000)" : "Ambil Sendiri di Toko Delina";
    const address = isCourier ? `Jl. Melati Blok ${String.fromCharCode(65 + (i % 6))} No. ${i * 2}, RT 0${(i % 5) + 1}/04` : "-";

    const item1 = sampleItemsPool[(i * 3) % sampleItemsPool.length];
    const item2 = (i % 2 === 0) ? sampleItemsPool[(i * 5 + 1) % sampleItemsPool.length] : null;
    const rincian = item2 ? `${item1}\n${item2}` : item1;

    let total = 25000 + ((i * 12500) % 180000);
    if (isCourier) total += 5000;

    let status = statuses[3]; // Selesai
    if (i <= 10) {
      status = statuses[0]; // Menunggu Verifikasi
    } else if (i <= 24) {
      status = statuses[1]; // Sedang Diproses
    } else if (i <= 35) {
      status = statuses[2]; // Siap Diambil
    }

    const hasDoc = (rincian.includes("Fotokopi") || rincian.includes("Cetak") || rincian.includes("Jilid") || rincian.includes("Skripsi") || rincian.includes("Modul"));
    const docLink = hasDoc ? `https://drive.google.com/file/d/dummy-doc-${notaNum}/view?usp=sharing` : "-";

    const payType = (i % 3 === 0) ? "tunai" : ((i % 3 === 1) ? "qris" : "transfer");
    const proofLink = (payType === "tunai") ? "-" : `https://drive.google.com/file/d/dummy-proof-transfer-${notaNum}/view?usp=sharing`;

    dummyOrders.push([
      notaId,
      dateFormatted,
      custName,
      phone,
      delivery,
      address,
      rincian,
      total,
      docLink,
      proofLink,
      status
    ]);
  }

  sheetPesanan.getRange(2, 1, dummyOrders.length, headerPesanan[0].length).setValues(dummyOrders);
  sheetPesanan.autoResizeColumns(1, headerPesanan[0].length);

  return {
    pesananCount: dummyOrders.length,
    produkCount: masterProduk.length,
    tarifCount: masterTarif.length
  };
}

/**
 * =========================================================================
 * 5. OTAK AI KIKO BERADAB ISLAMI (GEMINI API + LIVE STOCK CONTEXT)
 * =========================================================================
 */
function tanyaKikoAI(pesanUser, sumber) {
  try {
    const props = PropertiesService.getScriptProperties();
    const geminiApiKey = props.getProperty("GEMINI_API_KEY");

    const ss = getDelinaSpreadsheet();
    const sheetProduk = ss.getSheetByName(TAB_PRODUK);
    const sheetTarif = ss.getSheetByName(TAB_TARIF);

    let daftarStok = [];
    if (sheetProduk && sheetProduk.getLastRow() > 1) {
      const dataProduk = sheetProduk.getDataRange().getValues();
      for (let i = 1; i < dataProduk.length; i++) {
        const r = dataProduk[i];
        if (r[0]) {
          daftarStok.push(`- ${r[1]} | Harga: Rp ${Number(r[3]).toLocaleString("id-ID")} | Sisa Stok: ${r[4]} ${r[5]} (Kategori: ${r[2]})`);
        }
      }
    }

    let daftarTarif = [];
    if (sheetTarif && sheetTarif.getLastRow() > 1) {
      const dataTarif = sheetTarif.getDataRange().getValues();
      for (let j = 1; j < dataTarif.length; j++) {
        const t = dataTarif[j];
        if (t[0]) {
          daftarTarif.push(`- ${t[1]} : Rp ${Number(t[2]).toLocaleString("id-ID")}`);
        }
      }
    }

    const contextKatalog = daftarStok.join("\n");
    const contextTarif = daftarTarif.join("\n");

    const systemPrompt = `Kamu adalah "Kiko", asisten AI virtual resmi Toko Online Delina.store (ATK, Kosmetik dan Kelontongan).
Sifatmu: Sangat ramah, santun, beradab Islami, amanah, jujur, solutif, dan profesional.

Format Gaya Balasan yang WAJIB Kamu Gunakan:
1. Awali balasan dengan salam hangat Islami: "Assalamu'alaikum Warahmatullahi Wabarakatuh kak! 😊" atau "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! 👋".
2. Gunakan garis pemisah visual yang rapi: "━━━━━━━━━━━━━━━━━━━━━━━━━━" untuk membatasi judul/salam dengan rincian produk.
3. Berikan informasi ketersediaan barang dengan format rapi dan BOLD pada nama produk dan harga:
   Contoh jika barang ada di katalog:
   📦 *Nama Produk:* *[Nama Lengkap]*
   💰 *Harga:* *Rp [Harga]*
   📊 *Sisa Stok:* *[Jumlah] [Satuan]*
   🏷️ *Kategori:* [Kategori]
4. Gunakan bullet points (•) dan emoticon tematik yang serasi (📄, ✏️, 📦, 💡, 🏷️).
5. Berikan rekomendasi produk alternatif jika stok kosong atau tawarkan promo terkait.
6. Berikan petunjuk belanja: "Barang ini bisa langsung dipesan lewat website resmi Toko Delina nggih kak."
7. Jangan pernah mengarang harga atau stok di luar data katalog yang diberikan!
8. Akhiri balasan dengan doa keberkahan khas Delina:
   "Semoga Allah memberkahi segala urusan dan aktivitas kakak hari ini. Barakallahu fiik. 🤲✨"

DATA KATALOG ATK REAL-TIME TOKO DELINA:
${contextKatalog}

DATA TARIF JASA FOTOKOPI & CETAK:
${contextTarif}

Saluran pelanggan: ${sumber || "Telegram"}. Buat jawaban terstruktur rapi, elegan, dan sangat nyaman dibaca di layar HP.`;

    if (!geminiApiKey) {
      return fallbackKikoLocal(pesanUser, daftarStok);
    }

    const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
    for (let m = 0; m < models.length; m++) {
      const modelName = models[m];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      const payload = {
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\nPertanyaan Pelanggan: " + pesanUser }] }
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
      };

      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      try {
        const res = UrlFetchApp.fetch(url, options);
        if (res.getResponseCode() === 200) {
          const json = JSON.parse(res.getContentText());
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
            return json.candidates[0].content.parts[0].text;
          }
        }
      } catch (e) {
        Logger.log(`Model ${modelName} error: ` + e.toString());
      }
    }

    return fallbackKikoLocal(pesanUser, daftarStok);
  } catch (error) {
    Logger.log("Error tanyaKikoAI: " + error.toString());
    return `✨ *ASISTEN KIKO • TOKO DELINA* ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nWa'alaikumsalam Warahmatullahi Wabarakatuh kak! 👋\n\nKiko siap melayani kebutuhan ATK dan fotokopi di Toko Delina. Boleh disebutkan barang yang sedang kakak butuhkan? _Barakallahu fiik._ 🤲`;
  }
}

function fallbackKikoLocal(pesanUser, daftarStok) {
  const q = (pesanUser || "").toLowerCase().trim();
  const stopWords = ["ada", "apakah", "punya", "jual", "mau", "beli", "tanya", "kak", "kiko", "bisa", "berapa", "harga", "stok", "delina", "toko", "assalamu", "alaikum", "halo", "hai", "selamat", "pagi", "siang", "sore", "malam"];

  const cleanWords = q
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.includes(w));

  if (cleanWords.length === 0) {
    return `✨ *ASISTEN KIKO • TOKO DELINA* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! 👋

Ada yang bisa Kiko bantu cekkan hari ini?
• 📦 *Ketersediaan Stok:* Kertas HVS, buku, pulpen, map, dll.
• 📄 *Tarif Fotokopi:* Cetak hitam-putih, cetak warna, jilid skripsi
• 🚚 *Pemesanan Cepat:* Ambil di toko atau diantar kurir

Silakan sebutkan nama barang atau pilih menu di bawah nggih. _Barakallahu fiik._ 🤲`;
  }

  let hasilCocok = [];
  for (let i = 0; i < daftarStok.length; i++) {
    const itemStr = daftarStok[i];
    const itemLower = itemStr.toLowerCase();
    let matchScore = 0;
    for (let j = 0; j < cleanWords.length; j++) {
      if (itemLower.includes(cleanWords[j])) matchScore++;
    }
    if (matchScore > 0) {
      hasilCocok.push({ itemStr: itemStr, score: matchScore });
    }
  }

  hasilCocok.sort((a, b) => b.score - a.score);

  if (hasilCocok.length > 0) {
    const daftarItemTampil = hasilCocok.slice(0, 3).map(h => `• *${h.itemStr.replace(/^-\s*/, '')}*`).join("\n");
    return `✨ *KETERSEDIAAN STOK TOKO DELINA* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! 😊

Alhamdulillah, produk yang kakak cari *tersedia* di etalase kami:

${daftarItemTampil}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Cara Belanja:*
Barang di atas siap diorder langsung melalui website resmi Toko Delina dengan metode bayar QRIS atau COD di toko.

Ada kebutuhan perlengkapan lainnya yang ingin ditambahkan kak? _Barakallahu fiik._ 🤲`;
  }

  const kataKunci = cleanWords.join(" ");
  return `✨ *INFORMASI STOK PRODUK* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
Wa'alaikumsalam Warahmatullahi Wabarakatuh kak.

Afwan, untuk kata kunci *"${kataKunci}"* saat ini belum kami temukan di katalog etalase Toko Delina.

💡 *Saran Kiko:*
Coba gunakan nama umum barang (misal: *kertas*, *buku*, *pulpen*, *map*, *stapler*), atau kakak bisa hubungi langsung Admin Pemilik Toko untuk konfirmasi stok di gudang.

_Semoga berkah selalu urusannya nggih kak._ 🤲✨`;
}

/**
 * =========================================================================
 * 6. INTEGRASI TELEGRAM BOT, INLINE KEYBOARD & NOTIFIKASI
 * =========================================================================
 */
function getTelegramPersistentKeyboard() {
  return {
    keyboard: [
      [
        { text: "🛍️ Buka Toko Delina" },
        { text: "📦 Cek Status Nota" }
      ],
      [
        { text: "🎁 Program Member & Hadiah" },
        { text: "📍 Lokasi Google Maps" }
      ],
      [
        { text: "💬 Tanya Kiko AI" },
        { text: "📞 WhatsApp Toko" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

function setTelegramMenuButton() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken) return "Bot token belum diset.";

  const url = `https://api.telegram.org/bot${botToken}/setChatMenuButton`;
  const webAppUrl = "https://mandalaprojek.github.io/toko-delina/";
  const payload = {
    menu_button: {
      type: "web_app",
      text: "🛍️ Buka Toko",
      web_app: {
        url: webAppUrl
      }
    }
  };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("setTelegramMenuButton: " + res.getContentText());
    return res.getContentText();
  } catch (e) {
    Logger.log("Notice setTelegramMenuButton: " + e.toString());
    return e.toString();
  }
}

function kirimPesanTelegram(chatId, pesan, replyMarkup) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken || !chatId) return;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = { 
    chat_id: chatId, 
    text: pesan, 
    parse_mode: "Markdown",
    reply_markup: replyMarkup || getTelegramPersistentKeyboard()
  };

  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    payload.parse_mode = "";
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }
}

function answerCallbackQuery(callbackQueryId, text) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken || !callbackQueryId) return;

  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  const payload = {
    callback_query_id: callbackQueryId,
    text: text || "OK",
    show_alert: false
  };

  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Notice answerCallbackQuery: " + e.toString());
  }
}

function kirimNotifikasiPesananTelegram(payload, linkDokumen, linkBukti) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  const adminChatId = props.getProperty("ADMIN_CHAT_ID");

  if (!botToken || !adminChatId) {
    Logger.log("TELEGRAM_BOT_TOKEN atau ADMIN_CHAT_ID belum diset di Script Properties.");
    return;
  }

  let itemsList = "";
  if (Array.isArray(payload.items)) {
    itemsList = payload.items.map((it, idx) => `  ${idx + 1}. ${it.name} (${it.qty}x)`).join("\n");
  }

  let couponText = payload.couponCode ? `\n🎟️ *Kupon Diskon:* \`${payload.couponCode}\` (-Rp ${Number(payload.discountAmount || 0).toLocaleString("id-ID")})` : "";

  // Penentuan Badge Metode Pembayaran Kontras
  let badgePayment = "[📱 QRIS]";
  const payMethod = String(payload.paymentMethod || "").toUpperCase();
  if (payMethod.includes("TRANSFER") || payMethod.includes("BANK")) {
    badgePayment = "[🏦 TRANSFER BANK]";
  } else if (payMethod.includes("TUNAI") || payMethod.includes("CASH") || payMethod.includes("COD") || linkBukti === "-") {
    badgePayment = "[💵 BAYAR TUNAI DI TOKO]";
  } else if (payMethod.includes("QRIS") || linkBukti !== "-") {
    badgePayment = "[📱 QRIS]";
  }

  const notifMsg = `🔔 *BISMILLAH, PESANAN BARU MASUK!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *No. Nota:* \`${payload.orderId}\`
👤 *Nama Pelanggan:* *${payload.customerName}*
📱 *WhatsApp:* \`${payload.customerPhone}\`
🚚 *Metode:* *${payload.deliveryMethod}*
📍 *Alamat:* ${payload.customerAddress || "-"}

💳 *Metode Pembayaran:* *${badgePayment}*
💰 *Total Tagihan:* *Rp ${Number(payload.totalAkhir).toLocaleString("id-ID")}*${couponText}

📦 *Rincian Belanja:*
${itemsList}

📄 *Dokumen Cetak:* ${linkDokumen !== "-" ? linkDokumen : "Tidak ada dokumen"}
💳 *Bukti Bayar:* ${linkBukti !== "-" ? linkBukti : "Belum diunggah"}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Silakan klik tombol di bawah untuk verifikasi cepat:_`;

  // Inline Keyboard Verifikasi & Siap Ambil Cepat untuk Pemilik Toko
  const adminInlineMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Verifikasi Lunas", callback_data: "verify_" + payload.orderId },
        { text: "📦 Siap Ambil", callback_data: "ready_" + payload.orderId }
      ]
    ]
  };

  kirimPesanTelegram(adminChatId, notifMsg, adminInlineMarkup);
}

function inisialisasiSlotScriptProperties() {
  try {
    const props = PropertiesService.getScriptProperties();
    const current = props.getProperties();
    const keysToAdd = {};

    if (!("GEMINI_API_KEY" in current)) keysToAdd["GEMINI_API_KEY"] = "";
    if (!("TELEGRAM_BOT_TOKEN" in current)) keysToAdd["TELEGRAM_BOT_TOKEN"] = "";
    if (!("ADMIN_CHAT_ID" in current)) keysToAdd["ADMIN_CHAT_ID"] = "";

    if (Object.keys(keysToAdd).length > 0) {
      props.setProperties(keysToAdd);
    }
  } catch (e) {
    Logger.log("Notice inisialisasiSlot: " + e.toString());
  }
}

function simpanKunciRahasia(geminiKey, telegramToken, adminChatId) {
  const props = PropertiesService.getScriptProperties();
  const data = {};
  if (geminiKey) data["GEMINI_API_KEY"] = geminiKey.trim();
  if (telegramToken) data["TELEGRAM_BOT_TOKEN"] = telegramToken.trim();
  if (adminChatId) data["ADMIN_CHAT_ID"] = String(adminChatId).trim();
  props.setProperties(data);
  return "Kunci berhasil disimpan: " + Object.keys(data).join(", ");
}

function setTelegramWebhook() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN belum diset.");

  const webAppUrl = "https://script.google.com/macros/s/AKfycbxc_epV80Yx9G5pIyoLdCHGAPybi_JbWfYTC7B3G455UxtF0rhmRN1u0nXZTxFwrhGHTw/exec";
  const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webAppUrl)}&drop_pending_updates=true&allowed_updates=${encodeURIComponent(JSON.stringify(["message", "callback_query"]))}`;
  const res = UrlFetchApp.fetch(url);

  // Set Menu Button WebApp agar langsung interaktif di chat bar
  setTelegramMenuButton();

  return "Webhook Telegram berhasil didaftarkan: " + res.getContentText();
}

function resetDanBersihkanWebhook() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken) return "Token bot belum ada.";

  const delUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=true`;
  const delRes = UrlFetchApp.fetch(delUrl, { muteHttpExceptions: true }).getContentText();

  const webAppUrl = "https://script.google.com/macros/s/AKfycbxc_epV80Yx9G5pIyoLdCHGAPybi_JbWfYTC7B3G455UxtF0rhmRN1u0nXZTxFwrhGHTw/exec";
  const setUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webAppUrl)}&drop_pending_updates=true&allowed_updates=${encodeURIComponent(JSON.stringify(["message", "callback_query"]))}`;
  const setRes = UrlFetchApp.fetch(setUrl, { muteHttpExceptions: true }).getContentText();

  setTelegramMenuButton();

  return `Hapus: ${delRes} | Pasang Ulang: ${setRes}`;
}

function cekStatusKunci() {
  const props = PropertiesService.getScriptProperties().getProperties();
  return {
    GEMINI_API_KEY: props["GEMINI_API_KEY"] ? "Tersedia (Aktif)" : "Belum diisi",
    TELEGRAM_BOT_TOKEN: props["TELEGRAM_BOT_TOKEN"] ? "Tersedia (Aktif)" : "Belum diisi",
    ADMIN_CHAT_ID: props["ADMIN_CHAT_ID"] ? "Tersedia (" + props["ADMIN_CHAT_ID"] + ")" : "Belum diisi",
    DELINA_SPREADSHEET_ID: props["DELINA_SPREADSHEET_ID"] ? "Tersedia (" + props["DELINA_SPREADSHEET_ID"] + ")" : "Belum diisi"
  };
}

/**
 * =========================================================================
 * 7. FUNGSI DRIVE & STORAGE
 * =========================================================================
 */
function saveBase64ToDriveFolder(base64String, fileName, subfolderName) {
  try {
    let contentType = "application/octet-stream";
    let pureBase64 = base64String;

    if (base64String.indexOf("base64,") !== -1) {
      const parts = base64String.split("base64,");
      const meta = parts[0];
      pureBase64 = parts[1];
      const match = meta.match(/:(.*?);/);
      if (match && match[1]) {
        contentType = match[1];
      }
    }

    const decodedBytes = Utilities.base64Decode(pureBase64);
    const blob = Utilities.newBlob(decodedBytes, contentType, fileName);

    const parentFolder = getOrCreateFolder(FOLDER_UTAMA);
    const targetFolder = getOrCreateSubFolder(parentFolder, subfolderName);

    const file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = file.getId();
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  } catch (err) {
    Logger.log("Error saat menyimpan file ke Drive: " + err.toString());
    return "Gagal simpan file: " + err.toString();
  }
}

function convertDriveUrlToLh3(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("lh3.googleusercontent.com/d/")) return url;

  let fileId = "";
  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    fileId = matchFileD[1];
  } else {
    const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchIdParam && matchIdParam[1]) {
      fileId = matchIdParam[1];
    }
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}

function perbaikiUrlGambarDrive(ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let countFixed = 0;

  // 1. Perbaiki di Sheet Produk
  const sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (sheetProduk && sheetProduk.getLastRow() > 1) {
    const data = sheetProduk.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const oldUrl = String(data[i][6] || "");
      const newUrl = convertDriveUrlToLh3(oldUrl);
      if (newUrl !== oldUrl) {
        sheetProduk.getRange(i + 1, 7).setValue(newUrl);
        countFixed++;
      }
    }
  }

  // 2. Perbaiki di Sheet Hadiah_Royalty
  const sheetHadiah = ss.getSheetByName(TAB_HADIAH);
  if (sheetHadiah && sheetHadiah.getLastRow() > 1) {
    const data = sheetHadiah.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const oldUrl = String(data[i][2] || "");
      const newUrl = convertDriveUrlToLh3(oldUrl);
      if (newUrl !== oldUrl) {
        sheetHadiah.getRange(i + 1, 3).setValue(newUrl);
        countFixed++;
      }
    }
  }

  // 3. Perbaiki di Sheet Pengaturan
  const sheetPengaturan = ss.getSheetByName(TAB_PENGATURAN);
  if (sheetPengaturan && sheetPengaturan.getLastRow() > 1) {
    const data = sheetPengaturan.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0] || "");
      if (key === "URL_LOGO" || key === "URL_QRIS") {
        const oldUrl = String(data[i][1] || "");
        const newUrl = convertDriveUrlToLh3(oldUrl);
        if (newUrl !== oldUrl) {
          sheetPengaturan.getRange(i + 1, 2).setValue(newUrl);
          countFixed++;
        }
      }
    }
  }

  Logger.log(`Perbaikan URL Drive selesai. Total diperbarui: ${countFixed}`);
  return {
    status: "success",
    countFixed: countFixed,
    message: `Alhamdulillah! Berhasil mengonversi ${countFixed} URL Google Drive ke format Google Content (lh3.googleusercontent.com) yang dijamin tampil di semua browser.`
  };
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  const folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(subFolderName);
}

function kurangiStokProduk(sheetProduk, items) {
  if (!sheetProduk || !Array.isArray(items) || items.length === 0) return;
  upgradeTabProduk(sheetProduk);
  const cols = getProdukColIndices(sheetProduk);
  const data = sheetProduk.getDataRange().getValues();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isFotokopi || String(item.id).startsWith("FOTO-")) continue;

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][cols.colId - 1]).trim().toUpperCase() === String(item.id).trim().toUpperCase()) {
        const currentStock = Number(data[r][cols.colStok - 1]) || 0;
        const newStock = Math.max(0, currentStock - Number(item.qty));
        sheetProduk.getRange(r + 1, cols.colStok).setValue(newStock);
        break;
      }
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================================================================
 * 8. AUTO-LOOKUP BARCODE & VISION AI (FOTO KEMASAN / BARCODE GEMINI MULTIMODAL)
 * =========================================================================
 */
function setupTabKategori(sheet) {
  sheet.clear();
  const header = [["ID_Kategori", "Nama_Kategori", "Icon", "Urutan", "Status"]];
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  formatHeaderSheet(sheet, header[0].length);

  const defaultCategories = [
    ["CAT-01", "ATK & Perlengkapan Kantor", "bi-pencil-square", 1, "AKTIF"],
    ["CAT-02", "Kosmetik & Perawatan Diri", "bi-heart-pulse-fill", 2, "AKTIF"],
    ["CAT-03", "Sembako & Kelontongan", "bi-basket2-fill", 3, "AKTIF"],
    ["CAT-04", "Makanan & Minuman", "bi-cup-hot-fill", 4, "AKTIF"]
  ];
  sheet.getRange(2, 1, defaultCategories.length, defaultCategories[0].length).setValues(defaultCategories);
  sheet.autoResizeColumns(1, header[0].length);
}

function ambilDaftarKategori(ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_KATEGORI);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_KATEGORI);
    setupTabKategori(sheet);
  }

  const categories = [];
  if (sheet.getLastRow() <= 1) {
    setupTabKategori(sheet);
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nama = String(row[1] || "").trim();
    const status = String(row[4] || "AKTIF").toUpperCase();
    if (nama && status === "AKTIF") {
      categories.push({
        id: String(row[0] || "CAT-" + i),
        nama: nama,
        icon: String(row[2] || "bi-tag-fill"),
        urutan: Number(row[3]) || i
      });
    }
  }

  categories.sort((a, b) => a.urutan - b.urutan);
  return categories;
}

function prosesSaveCategory(payload, ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_KATEGORI);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_KATEGORI);
    setupTabKategori(sheet);
  }

  const id = String(payload.id || "").trim();
  const nama = String(payload.nama || "").trim();
  const icon = String(payload.icon || "bi-tag-fill").trim();

  if (!nama) {
    return { status: "error", message: "Nama kategori tidak boleh kosong." };
  }

  const data = sheet.getDataRange().getValues();
  if (id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === id) {
        sheet.getRange(i + 1, 2).setValue(nama);
        sheet.getRange(i + 1, 3).setValue(icon);
        return {
          status: "success",
          message: `Kategori "${nama}" berhasil diperbarui.`,
          categories: ambilDaftarKategori(ss)
        };
      }
    }
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === nama.toLowerCase()) {
      return { status: "error", message: `Kategori "${nama}" sudah ada.` };
    }
  }

  const newId = "CAT-" + String(data.length).padStart(2, "0");
  const newOrder = data.length;
  sheet.appendRow([newId, nama, icon, newOrder, "AKTIF"]);

  return {
    status: "success",
    message: `Kategori baru "${nama}" berhasil ditambahkan!`,
    categories: ambilDaftarKategori(ss)
  };
}

function prosesDeleteCategory(payload, ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_KATEGORI);
  if (!sheet) return { status: "error", message: "Tabel kategori belum dibuat." };

  const id = String(payload.id || "").trim();
  const nama = String(payload.nama || "").trim();

  if (!id && !nama) {
    return { status: "error", message: "ID atau Nama kategori harus disertakan." };
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][0]).trim();
    const rowName = String(data[i][1]).trim();
    if ((id && rowId === id) || (nama && rowName.toLowerCase() === nama.toLowerCase())) {
      sheet.deleteRow(i + 1);
      return {
        status: "success",
        message: `Kategori "${rowName}" berhasil dihapus.`,
        categories: ambilDaftarKategori(ss)
      };
    }
  }

  return { status: "error", message: "Kategori tidak ditemukan." };
}

function mapKategoriKeDaftarToko(rawCategory, storeCategories) {
  if (!storeCategories || storeCategories.length === 0) {
    storeCategories = ["ATK & Perlengkapan Kantor", "Kosmetik & Perawatan Diri", "Sembako & Kelontongan", "Makanan & Minuman"];
  }
  if (!rawCategory) return storeCategories[0];
  const raw = String(rawCategory).toLowerCase();

  for (let cat of storeCategories) {
    if (cat.toLowerCase() === raw) return cat;
  }
  for (let cat of storeCategories) {
    if (raw.includes(cat.toLowerCase()) || cat.toLowerCase().includes(raw)) return cat;
  }
  if (raw.includes("atk") || raw.includes("buku") || raw.includes("kertas") || raw.includes("tulis") || raw.includes("kantor") || raw.includes("pen") || raw.includes("spidol")) {
    const found = storeCategories.find(c => c.toLowerCase().includes("atk") || c.toLowerCase().includes("kantor"));
    if (found) return found;
  }
  if (raw.includes("kosmetik") || raw.includes("skincare") || raw.includes("perawatan") || raw.includes("sabun") || raw.includes("shampo") || raw.includes("facial") || raw.includes("sunscreen") || raw.includes("lotion")) {
    const found = storeCategories.find(c => c.toLowerCase().includes("kosmetik") || c.toLowerCase().includes("perawatan"));
    if (found) return found;
  }
  if (raw.includes("sembako") || raw.includes("kelontong") || raw.includes("beras") || raw.includes("minyak") || raw.includes("gula") || raw.includes("tepung") || raw.includes("deterjen") || raw.includes("rinso") || raw.includes("tissue")) {
    const found = storeCategories.find(c => c.toLowerCase().includes("sembako") || c.toLowerCase().includes("kelontong"));
    if (found) return found;
  }
  if (raw.includes("makanan") || raw.includes("minuman") || raw.includes("snack") || raw.includes("mie") || raw.includes("kopi") || raw.includes("teh") || raw.includes("air") || raw.includes("biskuit")) {
    const found = storeCategories.find(c => c.toLowerCase().includes("makanan") || c.toLowerCase().includes("minuman"));
    if (found) return found;
  }

  return storeCategories[0];
}

function prosesLookupBarcode(barcode, ss, imageBase64) {
  if (!ss) ss = getDelinaSpreadsheet();
  let cleanBarcode = String(barcode || "").trim();
  const storeCategories = ambilDaftarKategori(ss).map(c => c.nama);

  // A. JIKA ADA FOTO KEMASAN / BARCODE (VISION AI GEMINI MULTIMODAL)
  if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > 50) {
    try {
      const props = PropertiesService.getScriptProperties();
      const geminiApiKey = props.getProperty("GEMINI_API_KEY");
      if (geminiApiKey) {
        let mimeType = "image/jpeg";
        let pureBase64 = imageBase64;
        if (imageBase64.indexOf("base64,") !== -1) {
          const parts = imageBase64.split("base64,");
          const meta = parts[0];
          pureBase64 = parts[1];
          const match = meta.match(/:(.*?);/);
          if (match && match[1]) mimeType = match[1];
        }

        const promptVision = `Tugas Anda adalah menganalisis foto produk / kemasan barang dagang ritel Indonesia (ATK, Kosmetik, Kelontong, Makanan/Minuman) secara super akurat:
1. BARCODE: Prioritaskan membaca 8 hingga 13 digit angka barcode EAN-13 / UPC / kode batang yang tercetak pada kemasan jika tampak jelas. Jika tidak tampak atau terpotong, kembalikan "".
2. NAMA: Ambil Nama Merek dan Varian rasa / jenis / ukuran yang paling dominan di kemasan secara lengkap & profesional (contoh: "Indomie Mi Goreng Spesial 85g", "Pocari Sweat Botol 500ml", "Garnier Bright Complete Vitamin C Serum 30ml", "Kertas HVS PaperOne A4 75gsm").
3. KATEGORI: Pilih satu kategori yang paling cocok HANYA dari daftar berikut:
${storeCategories.join(", ")}
4. SATUAN: Satuan kemasan yang lazim (Pcs, Box, Pack, Btl, Rim, Sachet, Pouch, Lusin, Tub).
5. HARGA_JUAL: Perkirakan harga jual eceran wajar dalam Rupiah (angka bulat tanpa titik/koma, contoh: 3500, 15000, 48000).

Wajib kembalikan HANYA format JSON murni tanpa markdown, tanpa backtick:
{"barcode": "...", "nama": "...", "kategori": "...", "satuan": "Pcs", "harga_jual": 0}`;

        const visionModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        for (let m = 0; m < visionModels.length; m++) {
          const modelName = visionModels[m];
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
            const payload = {
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: promptVision },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: pureBase64
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 350,
                responseMimeType: "application/json"
              }
            };

            const options = {
              method: "post",
              contentType: "application/json",
              payload: JSON.stringify(payload),
              muteHttpExceptions: true
            };

            const aiRes = UrlFetchApp.fetch(geminiUrl, options);
            if (aiRes.getResponseCode() === 200) {
              const aiJson = JSON.parse(aiRes.getContentText());
              if (aiJson.candidates && aiJson.candidates[0] && aiJson.candidates[0].content && aiJson.candidates[0].content.parts) {
                const rawText = aiJson.candidates[0].content.parts[0].text;
                let parsed = null;
                try {
                  parsed = JSON.parse(rawText.trim());
                } catch(e) {
                  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                  if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
                }

                if (parsed && parsed.nama) {
                  let detectedBarcode = "";
                  if (parsed.barcode && String(parsed.barcode).replace(/\D/g, "").length >= 6) {
                    detectedBarcode = String(parsed.barcode).replace(/\D/g, "");
                  } else if (cleanBarcode) {
                    detectedBarcode = cleanBarcode;
                  } else {
                    // ID Toko unik jika barcode fisik tidak tertera (DLN-899XXXX)
                    const rand4 = Math.floor(1000 + Math.random() * 9000);
                    detectedBarcode = "DLN-899" + String(Date.now()).slice(-3) + rand4.toString().slice(-2);
                  }

                  // Simpan foto kemasan ke Drive agar langsung jadi foto produk HD format lh3
                  let uploadedFotoUrl = "";
                  try {
                    uploadedFotoUrl = saveBase64ToDriveFolder(
                      imageBase64, 
                      `PROD-${detectedBarcode}.jpg`, 
                      SUBFOLDER_PRODUK
                    );
                  } catch (eSave) {
                    Logger.log("Save vision image to drive notice: " + eSave.toString());
                  }

                  const bestCat = mapKategoriKeDaftarToko(parsed.kategori, storeCategories);
                  const hargaJual = Number(parsed.harga_jual) || 0;

                  return {
                    status: "success",
                    isNew: true,
                    source: `Gemini Vision AI (${modelName})`,
                    barcode: detectedBarcode,
                    nama: parsed.nama.trim(),
                    kategori: bestCat,
                    satuan: parsed.satuan || "Pcs",
                    harga_jual: hargaJual,
                    estimasiHarga: hargaJual,
                    deskripsi: `Ready Stok ${parsed.nama.trim()} | Kategori: ${bestCat} — Dijamin Ori & Berkualitas di Delina.store`,
                    fotoUrl: uploadedFotoUrl
                  };
                }
              }
            }
          } catch (eModel) {
            Logger.log(`Vision model ${modelName} error: ` + eModel.toString());
          }
        }
      }
    } catch (errVision) {
      Logger.log("Vision AI error: " + errVision.toString());
    }
  }

  // B. JIKA HANYA ANGKA BARCODE ATAU VISION GAGAL
  if (!cleanBarcode) {
    return { status: "error", message: "Barcode tidak valid atau gambar tidak dapat diidentifikasi." };
  }
  const cleanBarcodeUpper = cleanBarcode.toUpperCase();

  // 1. Cek di Tab 'Produk' Google Sheets
  const sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (sheetProduk && sheetProduk.getLastRow() > 1) {
    upgradeTabProduk(sheetProduk);
    const cols = getProdukColIndices(sheetProduk);
    const data = sheetProduk.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][cols.colId - 1] || "").trim().toUpperCase();
      const rowName = String(data[i][cols.colNama - 1] || "").trim();
      if (rowId === cleanBarcodeUpper || rowId.replace(/[^A-Z0-9]/g, "") === cleanBarcodeUpper.replace(/[^A-Z0-9]/g, "")) {
        return {
          status: "existing",
          message: "Produk sudah terdaftar di toko.",
          product: {
            id: data[i][cols.colId - 1],
            name: rowName,
            category: data[i][cols.colKategori - 1] || "ATK & Perlengkapan Kantor",
            costPrice: cols.colHargaBeli > 0 ? (Number(data[i][cols.colHargaBeli - 1]) || 0) : 0,
            price: Number(data[i][cols.colHargaJual - 1]) || 0,
            stock: Number(data[i][cols.colStok - 1]) || 0,
            unit: data[i][cols.colSatuan - 1] || "Pcs",
            image: convertDriveUrlToLh3(String(data[i][cols.colFoto - 1] || "")),
            description: data[i][cols.colDeskripsi - 1] || "",
            status: cols.colStatus > 0 ? (data[i][cols.colStatus - 1] || "Aktif") : "Aktif"
          }
        };
      }
    }
  }

  // 2. Cek ke Open Food Facts API publik (v2) dengan variasi padding barcode
  const variants = [cleanBarcode];
  if (cleanBarcode.length === 12) variants.push("0" + cleanBarcode);
  if (cleanBarcode.length === 13 && cleanBarcode.startsWith("0")) variants.push(cleanBarcode.substring(1));
  if (cleanBarcode.length === 11) variants.push("00" + cleanBarcode);
  const padded13 = cleanBarcode.padStart(13, "0");
  if (!variants.includes(padded13)) variants.push(padded13);

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    try {
      const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(v)}.json`;
      const res = UrlFetchApp.fetch(offUrl, {
        muteHttpExceptions: true,
        headers: { "User-Agent": "TokoDelina-Lookup/1.0 (contact@tokodelina.store)" }
      });
      if (res.getResponseCode() === 200) {
        const offJson = JSON.parse(res.getContentText());
        if (offJson.status === 1 && offJson.product) {
          const p = offJson.product;
          const brand = p.brands || "";
          const prodName = p.product_name_id || p.product_name || p.generic_name_id || p.generic_name || "";
          let fullTitle = prodName;
          if (brand && !prodName.toLowerCase().includes(brand.toLowerCase())) {
            fullTitle = `${brand} ${prodName}`;
          }
          if (fullTitle && fullTitle.trim().length > 2) {
            const imgUrl = p.image_url || p.image_front_url || p.image_front_small_url || "";
            const cat = mapKategoriKeDaftarToko(p.categories || fullTitle, storeCategories);
            return {
              status: "success",
              isNew: true,
              source: "OpenFoodFacts",
              barcode: cleanBarcode,
              nama: fullTitle.trim(),
              kategori: cat,
              satuan: "Pcs",
              deskripsi: `Ready Stok ${fullTitle.trim()} | Kategori: ${cat} — Dijamin Ori & Berkualitas di Delina.store`,
              fotoUrl: imgUrl
            };
          }
        }
      }
    } catch (errOff) {
      Logger.log("Open Food Facts fetch error: " + errOff.toString());
    }
  }

  // 2b. Cek ke UPCitemdb Retail Database
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    try {
      const upcUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(v)}`;
      const res = UrlFetchApp.fetch(upcUrl, {
        muteHttpExceptions: true,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.getResponseCode() === 200) {
        const upcJson = JSON.parse(res.getContentText());
        if (upcJson.items && upcJson.items.length > 0) {
          const item = upcJson.items[0];
          if (item.title && item.title.trim().length > 2) {
            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : "";
            const cat = mapKategoriKeDaftarToko(item.category || item.title, storeCategories);
            return {
              status: "success",
              isNew: true,
              source: "UPCitemdb",
              barcode: cleanBarcode,
              nama: item.title.trim(),
              kategori: cat,
              satuan: "Pcs",
              deskripsi: `Ready Stok ${item.title.trim()} | Kategori: ${cat} — Dijamin Ori & Berkualitas di Delina.store`,
              fotoUrl: imgUrl || getDefaultPhotoForCategory(item.category, item.title)
            };
          }
        }
      }
    } catch (errUpc) {
      Logger.log("UPCitemdb fetch error: " + errUpc.toString());
    }
  }

  // 3. Deteksi Merek Indonesia via Prefiks GS1 Indonesia (899...)
  const indonesianBrands = {
    "8992388": { brand: "Sinar Dunia (SiDu)", category: "ATK & Perlengkapan Kantor", sample: "Buku Tulis Sinar Dunia 38 Lembar" },
    "8998866": { brand: "Indofood", category: "Makanan & Minuman", sample: "Indomie Mi Goreng Original" },
    "8992745": { brand: "Standard Pen", category: "ATK & Perlengkapan Kantor", sample: "Pulpen Standard AE7 0.5mm" },
    "8991389": { brand: "Snowman", category: "ATK & Perlengkapan Kantor", sample: "Spidol Snowman Boardmarker Hitam" },
    "8996001": { brand: "Danone Aqua", category: "Makanan & Minuman", sample: "Air Mineral Aqua 600ml" },
    "8992775": { brand: "Sosro", category: "Makanan & Minuman", sample: "Teh Botol Sosro 350ml" },
    "8991001": { brand: "Mayora", category: "Makanan & Minuman", sample: "Biskuit Roma Kelapa Mayora" },
    "8999999": { brand: "Joyko", category: "ATK & Perlengkapan Kantor", sample: "Alat Tulis Joyko" },
    "8993175": { brand: "Kenko", category: "ATK & Perlengkapan Kantor", sample: "Perlengkapan Kantor Kenko" },
    "8992759": { brand: "PaperOne", category: "ATK & Perlengkapan Kantor", sample: "Kertas HVS PaperOne A4 75gsm" },
    "8993005": { brand: "Wings Food", category: "Makanan & Minuman", sample: "Mie Sedaap Goreng" },
    "8992999": { brand: "Faber-Castell", category: "ATK & Perlengkapan Kantor", sample: "Pensil 2B Faber-Castell" },
    "8998899": { brand: "Wardah", category: "Kosmetik & Perawatan Diri", sample: "Wardah Lightening Day Cream" },
    "8997010": { brand: "Garnier", category: "Kosmetik & Perawatan Diri", sample: "Garnier Micellar Water" },
    "8993379": { brand: "Pond's", category: "Kosmetik & Perawatan Diri", sample: "Pond's Pure White Facial Foam" }
  };
  const prefix7 = cleanBarcode.substring(0, 7);
  const matchedBrand = indonesianBrands[prefix7];

  // 4. Fallback AI: Gemini Text API (Model Aktif: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash)
  try {
    const props = PropertiesService.getScriptProperties();
    const geminiApiKey = props.getProperty("GEMINI_API_KEY");
    if (geminiApiKey) {
      let promptAI = "";
      if (matchedBrand) {
        promptAI = `Barcode: ${cleanBarcode} adalah produk resmi dari ${matchedBrand.brand} (${matchedBrand.category}). Sebutkan nama spesifik item ini di Indonesia (misal varian/tipe). Pilih kategori yang paling tepat dari: ${storeCategories.join(", ")}. Kembalikan HANYA format JSON murni: {"nama": "...", "kategori": "${matchedBrand.category}", "satuan": "Pcs", "deskripsi": "..."}.`;
      } else {
        promptAI = `Sebutkan nama lengkap produk dagang Indonesia dan merek dari barcode ${cleanBarcode}. Jangan menyebut Indomie jika bukan dari Indofood. Pilih kategori dari: ${storeCategories.join(", ")}. Kembalikan HANYA format JSON murni: {"nama": "...", "kategori": "...", "satuan": "Pcs", "deskripsi": "..."}.`;
      }

      const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
      for (let m = 0; m < models.length; m++) {
        const modelName = models[m];
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
          const payload = {
            contents: [{ role: "user", parts: [{ text: promptAI }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 250 }
          };
          const options = {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          };
          const aiRes = UrlFetchApp.fetch(geminiUrl, options);
          if (aiRes.getResponseCode() === 200) {
            const aiJson = JSON.parse(aiRes.getContentText());
            if (aiJson.candidates && aiJson.candidates[0] && aiJson.candidates[0].content && aiJson.candidates[0].content.parts) {
              const rawText = aiJson.candidates[0].content.parts[0].text;
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed && parsed.nama) {
                  const finalCat = mapKategoriKeDaftarToko(parsed.kategori || (matchedBrand ? matchedBrand.category : parsed.nama), storeCategories);
                  return {
                    status: "success",
                    isNew: true,
                    source: `GeminiAI (${modelName})`,
                    barcode: cleanBarcode,
                    nama: parsed.nama.trim(),
                    kategori: finalCat,
                    satuan: parsed.satuan || "Pcs",
                    deskripsi: parsed.deskripsi || `Ready Stok ${parsed.nama.trim()} | Kategori: ${finalCat} — Dijamin Ori & Berkualitas di Delina.store`,
                    fotoUrl: getDefaultPhotoForCategory(parsed.kategori || (matchedBrand ? matchedBrand.category : ""), parsed.nama)
                  };
                }
              }
            }
          }
        } catch (eModel) {
          Logger.log(`Gemini text model ${modelName} notice: ` + eModel.toString());
        }
      }
    }
  } catch (errAi) {
    Logger.log("Gemini lookup error: " + errAi.toString());
  }

  // 5. Jika AI gagal, gunakan database merek GS1 Indonesia
  if (matchedBrand) {
    const finalCat = mapKategoriKeDaftarToko(matchedBrand.category, storeCategories);
    return {
      status: "success",
      isNew: true,
      source: "GS1-Indonesia",
      barcode: cleanBarcode,
      nama: `${matchedBrand.sample}`,
      kategori: finalCat,
      satuan: "Pcs",
      deskripsi: `Ready Stok ${matchedBrand.sample} | Kategori: ${finalCat} — Dijamin Ori & Berkualitas di Delina.store`,
      fotoUrl: getDefaultPhotoForCategory(matchedBrand.category, matchedBrand.sample)
    };
  }

  // 6. Fallback Default jika tidak terdeteksi di API
  return {
    status: "success",
    isNew: true,
    source: "default",
    barcode: cleanBarcode,
    nama: `Barang Dagang Baru (${cleanBarcode})`,
    kategori: storeCategories[0] || "ATK & Perlengkapan Kantor",
    satuan: "Pcs",
    deskripsi: `Ready Stok Barang Baru | Kategori: ${storeCategories[0] || 'ATK'} — Dijamin Ori & Berkualitas di Delina.store`,
    fotoUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500"
  };
}

function getDefaultPhotoForCategory(kategori, nama) {
  const text = `${kategori || ""} ${nama || ""}`.toLowerCase();
  if (text.includes("kertas") || text.includes("paper") || text.includes("hvs")) {
    return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500";
  }
  if (text.includes("buku") || text.includes("book") || text.includes("tulis")) {
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500";
  }
  if (text.includes("pulpen") || text.includes("pen") || text.includes("gel") || text.includes("spidol")) {
    return "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500";
  }
  if (text.includes("map") || text.includes("stapler") || text.includes("kantor")) {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500";
  }
  return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500";
}


/**
 * =========================================================================
 * 10. SISTEM MEMBER VIP & ROYALTY (30x BELANJA = 1 HADIAH GRATIS)
 * =========================================================================
 */

function setupTabMember(sheet) {
  sheet.clear();
  const header = [["No_HP", "Password_Hash", "Nama_Member", "Jumlah_Belanja", "Total_Hadiah_Diklaim", "Tanggal_Daftar"]];
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  formatHeaderSheet(sheet, header[0].length);

  // Data Awal Contoh Member (Memudahkan Pengujian Langsung)
  const sampleMembers = [
    ["'081298765432", "1234", "Ahmad Fauzi (VIP Hampir Klaim)", 29, 0, "15/10/2026 10:00"],
    ["'085712345678", "1234", "Siti Rahmawati (Member Aktif)", 12, 0, "20/10/2026 14:30"],
    ["'087812340000", "1234", "Budi Santoso (Siap Klaim)", 31, 1, "01/10/2026 09:15"]
  ];
  sheet.getRange(2, 1, sampleMembers.length, 1).setNumberFormat("@");
  sheet.getRange(2, 1, sampleMembers.length, sampleMembers[0].length).setValues(sampleMembers);
  sheet.autoResizeColumns(1, header[0].length);
}

function setupTabHadiah(sheet) {
  sheet.clear();
  const header = [["ID_Hadiah", "Nama_Hadiah", "URL_Foto", "Stok", "Deskripsi", "Status_Aktif"]];
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  formatHeaderSheet(sheet, header[0].length);

  const sampleHadiah = [
    [
      "HDH-01",
      "Tumbler Stainless Steel Delina Exclusive (500ml Tahan Panas/Dingin)",
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
      25,
      "Tumbler premium tahan panas dingin 12 jam dengan logo Delina.store eksklusif.",
      "AKTIF"
    ],
    [
      "HDH-02",
      "Pouch Kosmetik & Skincare Velvet Cantik Elegan",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      30,
      "Pouch bahan beludru premium lembut muat banyak kosmetik dan skincare harian.",
      "AKTIF"
    ],
    [
      "HDH-03",
      "Minyak Goreng Sania / Tropical Pouch 1 Liter Murni",
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
      50,
      "Minyak goreng kelapa sawit 2x penyaringan bening higienis untuk keluarga.",
      "AKTIF"
    ],
    [
      "HDH-04",
      "Paket Alat Tulis Eksekutif (Notebook Hardcover + Pulpen Metal Parker-Look)",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      20,
      "Buku catatan jilid tebal eksklusif berpadu pulpen logam tinta hitam pekat mewah.",
      "AKTIF"
    ],
    [
      "HDH-05",
      "Paket Skincare Glow Essentials (Micellar Water + Facial Wash)",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      35,
      "Duo pembersih wajah mencerahkan dan menyegarkan kulit bebas kusam.",
      "AKTIF"
    ],
    [
      "HDH-06",
      "Beras Premium Ramos Wangi Pulen 2.5 Kg",
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
      40,
      "Beras super kepala putih alami tanpa pemutih wangi pulen lezat saat matang.",
      "AKTIF"
    ],
    [
      "HDH-07",
      "Payung Lipat Delina Anti-UV Rangka Baja Otomatis",
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
      30,
      "Payung lipat praktis buka otomatis tahan terik matahari dan angin kencang.",
      "AKTIF"
    ],
    [
      "HDH-08",
      "Gula Pasir Gulaku Murni 1 Kg + Teh Celup Kotak Nusantara",
      "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80",
      45,
      "Paket manis gula tebu murni 1 kg dan sekotak teh celup melati nikmat hangat.",
      "AKTIF"
    ],
    [
      "HDH-09",
      "Lip Cream Matte Velvet Shade Best Seller Tahan 12 Jam",
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
      25,
      "Lip cream lembut matte pigmen tinggi tidak membuat bibir kering pecah.",
      "AKTIF"
    ],
    [
      "HDH-10",
      "Voucher Belanja Delina.store Senilai Rp 35.000",
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80",
      100,
      "Voucher potongan belanja instan tanpa minimum pembelian di Delina.store.",
      "AKTIF"
    ]
  ];
  sheet.getRange(2, 1, sampleHadiah.length, sampleHadiah[0].length).setValues(sampleHadiah);
  sheet.autoResizeColumns(1, header[0].length);
}

function setupTabKlaim(sheet) {
  sheet.clear();
  const header = [["ID_Klaim", "Waktu", "No_HP", "Nama_Member", "ID_Hadiah", "Nama_Hadiah", "Status_Ambil"]];
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  formatHeaderSheet(sheet, header[0].length);

  const sampleKlaim = [
    ["KLM-2026-001", "28/10/2026 11:20", "087812340000", "Budi Santoso", "HDH-01", "Tumbler Stainless Steel Delina Exclusive", "Sudah Diserahkan"]
  ];
  sheet.getRange(2, 1, sampleKlaim.length, sampleKlaim[0].length).setValues(sampleKlaim);
  sheet.autoResizeColumns(1, header[0].length);
}

function ambilDaftarMember(ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_MEMBER);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_MEMBER);
    setupTabMember(sheet);
  }

  const members = [];
  if (sheet.getLastRow() <= 1) return members;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (r[0]) {
      members.push({
        phone: normalizePhoneNumber(r[0]),
        name: String(r[2] || "Member"),
        belanjaCount: Number(r[3]) || 0,
        totalClaimed: Number(r[4]) || 0,
        registeredAt: String(r[5] || "-")
      });
    }
  }
  return members;
}

function ambilDaftarHadiah(ss) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_HADIAH);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_HADIAH);
    setupTabHadiah(sheet);
  }

  const rewards = [];
  if (sheet.getLastRow() <= 1) return rewards;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (r[0]) {
      rewards.push({
        id: String(r[0]).trim(),
        name: String(r[1] || ""),
        imageUrl: convertDriveUrlToLh3(String(r[2] || "")),
        stock: Number(r[3]) || 0,
        description: String(r[4] || ""),
        status: String(r[5] || "AKTIF").toUpperCase()
      });
    }
  }
  return rewards;
}

function ambilDaftarKlaim(ss, phoneFilter) {
  if (!ss) ss = getDelinaSpreadsheet();
  let sheet = ss.getSheetByName(TAB_KLAIM);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_KLAIM);
    setupTabKlaim(sheet);
  }

  const claims = [];
  if (sheet.getLastRow() <= 1) return claims;

  const cleanPhone = phoneFilter ? normalizePhoneNumber(phoneFilter) : null;
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    const r = data[i];
    if (r[0]) {
      const rowPhone = normalizePhoneNumber(String(r[2] || ""));
      if (!cleanPhone || rowPhone === cleanPhone) {
        claims.push({
          claimId: String(r[0]),
          time: String(r[1] || ""),
          phone: String(r[2] || ""),
          memberName: String(r[3] || ""),
          rewardId: String(r[4] || ""),
          rewardName: String(r[5] || ""),
          status: String(r[6] || "Menunggu Pengambilan di Toko")
        });
      }
    }
  }
  return claims;
}

function normalizePhoneNumber(raw) {
  let num = String(raw || "").trim().replace(/\D/g, "");
  if (num.startsWith("62")) {
    num = "0" + num.substring(2);
  } else if (num.startsWith("8")) {
    num = "0" + num;
  }
  return num;
}

function prosesRegisterMember(payload, ss) {
  const rawPhone = String(payload.phone || payload.hp || "").trim();
  const rawName = String(payload.name || payload.nama || "Pelanggan Delina").trim();
  const rawPassword = String(payload.password || payload.pin || "1234").trim();

  const cleanPhone = normalizePhoneNumber(rawPhone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return { status: "error", message: "Nomor WhatsApp/HP tidak valid (minimal 8 digit)." };
  }

  if (!rawPassword) {
    return { status: "error", message: "Password / PIN wajib diisi untuk keamanan akun." };
  }

  let sheet = ss.getSheetByName(TAB_MEMBER);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_MEMBER);
    setupTabMember(sheet);
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const p = normalizePhoneNumber(data[i][0]);
    if (p === cleanPhone) {
      return {
        status: "error",
        message: "Nomor HP ini sudah terdaftar sebagai Member Delina! Silakan pilih menu Masuk (Login)."
      };
    }
  }

  const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm");
  sheet.appendRow(["'" + cleanPhone, rawPassword, rawName, 0, 0, nowStr]);

  return {
    status: "success",
    message: "Alhamdulillah! Pendaftaran Member VIP Delina.store berhasil.",
    member: {
      phone: cleanPhone,
      name: rawName,
      belanjaCount: 0,
      totalClaimed: 0,
      registeredAt: nowStr
    },
    claims: []
  };
}

function prosesLoginMember(payload, ss) {
  const rawPhone = String(payload.phone || payload.hp || "").trim();
  const rawPassword = String(payload.password || payload.pin || "").trim();

  const cleanPhone = normalizePhoneNumber(rawPhone);
  if (!cleanPhone) {
    return { status: "error", message: "Silakan masukkan nomor HP member Anda." };
  }

  let sheet = ss.getSheetByName(TAB_MEMBER);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_MEMBER);
    setupTabMember(sheet);
  }

  const data = sheet.getDataRange().getValues();
  let found = null;

  for (let i = 1; i < data.length; i++) {
    const p = normalizePhoneNumber(data[i][0]);
    if (p === cleanPhone) {
      const savedPass = String(data[i][1] || "").trim();
      if (rawPassword && savedPass && savedPass !== rawPassword) {
        return { status: "error", message: "Password / PIN yang Anda masukkan salah." };
      }
      found = {
        phone: cleanPhone,
        name: String(data[i][2] || "Member Delina"),
        belanjaCount: Number(data[i][3]) || 0,
        totalClaimed: Number(data[i][4]) || 0,
        registeredAt: String(data[i][5] || "-")
      };
      break;
    }
  }

  if (!found) {
    return {
      status: "error",
      message: "Nomor HP ini belum terdaftar sebagai Member. Silakan klik tab 'Daftar Baru' terlebih dahulu."
    };
  }

  const claims = ambilDaftarKlaim(ss, cleanPhone);
  return {
    status: "success",
    message: "Alhamdulillah, selamat datang kembali " + found.name + "!",
    member: found,
    claims: claims
  };
}

function prosesGetMemberData(phone, ss) {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone) {
    return { status: "error", message: "Nomor HP diperlukan." };
  }

  let sheet = ss.getSheetByName(TAB_MEMBER);
  if (!sheet) return { status: "error", message: "Database member belum aktif." };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizePhoneNumber(data[i][0]) === cleanPhone) {
      const member = {
        phone: cleanPhone,
        name: String(data[i][2] || "Member Delina"),
        belanjaCount: Number(data[i][3]) || 0,
        totalClaimed: Number(data[i][4]) || 0,
        registeredAt: String(data[i][5] || "-")
      };
      const claims = ambilDaftarKlaim(ss, cleanPhone);
      return { status: "success", member: member, claims: claims };
    }
  }

  return { status: "error", message: "Member dengan nomor " + cleanPhone + " tidak ditemukan." };
}

function prosesClaimReward(payload, ss) {
  const cleanPhone = normalizePhoneNumber(payload.phone || payload.hp);
  const password = String(payload.password || payload.pin || "").trim();
  const rewardId = String(payload.idHadiah || payload.rewardId || "").trim();

  if (!cleanPhone || !rewardId) {
    return { status: "error", message: "Parameter klaim tidak lengkap." };
  }

  let sheetMember = ss.getSheetByName(TAB_MEMBER);
  let sheetHadiah = ss.getSheetByName(TAB_HADIAH);
  let sheetKlaim = ss.getSheetByName(TAB_KLAIM);

  if (!sheetMember || !sheetHadiah || !sheetKlaim) {
    throw new Error("Tabel Member / Hadiah / Klaim belum lengkap di spreadsheet.");
  }

  // 1. Verifikasi Member & Poin Belanja >= 30
  const dataMember = sheetMember.getDataRange().getValues();
  let memberRowIdx = -1;
  let memberName = "";
  let currentBelanja = 0;
  let totalClaimed = 0;

  for (let i = 1; i < dataMember.length; i++) {
    if (normalizePhoneNumber(dataMember[i][0]) === cleanPhone) {
      const savedPass = String(dataMember[i][1] || "").trim();
      if (password && savedPass && savedPass !== password) {
        return { status: "error", message: "Password konfirmasi klaim salah." };
      }
      memberRowIdx = i + 1;
      memberName = String(dataMember[i][2] || "Member Delina");
      currentBelanja = Number(dataMember[i][3]) || 0;
      totalClaimed = Number(dataMember[i][4]) || 0;
      break;
    }
  }

  if (memberRowIdx === -1) {
    return { status: "error", message: "Akun Member tidak ditemukan." };
  }

  if (currentBelanja < 30) {
    return {
      status: "error",
      message: `Afwan, stempel belanja Anda saat ini (${currentBelanja}/30) belum mencukupi. Diperlukan 30x belanja untuk membuka 1 hadiah gratis.`
    };
  }

  // 2. Verifikasi Ketersediaan Hadiah di Tab Hadiah_Royalty
  const dataHadiah = sheetHadiah.getDataRange().getValues();
  let hadiahRowIdx = -1;
  let namaHadiah = "";
  let currentStock = 0;

  for (let j = 1; j < dataHadiah.length; j++) {
    if (String(dataHadiah[j][0]).trim() === rewardId) {
      hadiahRowIdx = j + 1;
      namaHadiah = String(dataHadiah[j][1] || "Hadiah Delina");
      currentStock = Number(dataHadiah[j][3]) || 0;
      break;
    }
  }

  if (hadiahRowIdx === -1) {
    return { status: "error", message: "Pilihan hadiah tidak ditemukan." };
  }

  if (currentStock <= 0) {
    return { status: "error", message: `Mohon maaf, stok hadiah "${namaHadiah}" saat ini sedang kosong. Silakan pilih hadiah lainnya.` };
  }

  // 3. Potong 30 Poin Belanja & Tambah Total Hadiah Diklaim
  const newBelanja = currentBelanja - 30;
  const newTotalClaimed = totalClaimed + 1;
  sheetMember.getRange(memberRowIdx, 4).setValue(newBelanja);
  sheetMember.getRange(memberRowIdx, 5).setValue(newTotalClaimed);

  // 4. Kurangi Stok Hadiah (-1)
  sheetHadiah.getRange(hadiahRowIdx, 4).setValue(Math.max(0, currentStock - 1));

  // 5. Catat ke Tab Klaim_Hadiah
  const claimCode = "KLM-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
  const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm");

  sheetKlaim.appendRow([
    claimCode,
    nowStr,
    "'" + cleanPhone,
    memberName,
    rewardId,
    namaHadiah,
    "Menunggu Pengambilan di Toko"
  ]);

  // 6. Notifikasi Telegram ke Pemilik Toko
  try {
    const props = PropertiesService.getScriptProperties();
    const adminChatId = props.getProperty("TELEGRAM_ADMIN_CHAT_ID");
    if (adminChatId) {
      const notifKlaim = `🎁 *KLAIM HADIAH MEMBER DELINA.STORE!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 *Alhamdulillah! Ada Member Berhasil Mencapai 30x Belanja!*

👤 *Nama Member:* *${memberName}*
📱 *WhatsApp/HP:* \`${cleanPhone}\`
🎁 *Hadiah Dipilih:* *${namaHadiah}*
📋 *Kode Klaim:* \`${claimCode}\`
⏰ *Waktu Klaim:* ${nowStr}
📊 *Sisa Stempel Belanja:* ${newBelanja}/30

💡 *Petunjuk Toko:*
Tunjukkan nomor nota atau kode klaim di atas saat member mengambil hadiah di meja kasir Delina.store.`;
      kirimPesanTelegram(adminChatId, notifKlaim);
    }
  } catch (errNotif) {
    Logger.log("Notice notif klaim: " + errNotif.toString());
  }

  return {
    status: "success",
    message: "Alhamdulillah! Klaim hadiah berhasil. Tunjukkan Kode Klaim ke kasir toko saat mengambil.",
    claimId: claimCode,
    rewardName: namaHadiah,
    newBelanjaCount: newBelanja,
    totalClaimed: newTotalClaimed
  };
}

function tambahPoinBelanjaMember(ss, rawPhone, pointsToAdd = 1, optionalName = "") {
  const cleanPhone = normalizePhoneNumber(rawPhone);
  if (!cleanPhone || cleanPhone.length < 8) return null;

  let sheet = ss.getSheetByName(TAB_MEMBER);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_MEMBER);
    setupTabMember(sheet);
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizePhoneNumber(data[i][0]) === cleanPhone) {
      const current = Number(data[i][3]) || 0;
      const updated = current + pointsToAdd;
      sheet.getRange(i + 1, 4).setValue(updated);
      return {
        phone: cleanPhone,
        name: String(data[i][2] || "Member"),
        belanjaCount: updated,
        isNew: false
      };
    }
  }

  // Jika belum terdaftar, otomatis daftarkan sebagai member baru dengan poin awal
  const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm");
  const memberName = optionalName || "Member " + cleanPhone.slice(-4);
  sheet.appendRow(["'" + cleanPhone, "1234", memberName, pointsToAdd, 0, nowStr]);

  return {
    phone: cleanPhone,
    name: memberName,
    belanjaCount: pointsToAdd,
    isNew: true
  };
}

function prosesCreatePosOrder(payload, ss) {
  const auth = validatePin(payload.pin, ss);
  if (!auth.valid) {
    return { status: "error", message: "PIN Keamanan Kasir tidak valid." };
  }

  const orderId = payload.orderId || "#POS-" + Date.now().toString().slice(-6);
  const orderTimeNow = payload.orderTime || Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm");
  const items = Array.isArray(payload.items) ? payload.items : [];
  const totalPrice = Number(payload.total) || 0;
  const payMethod = payload.paymentMethod || "Tunai Kasir";
  const memberPhoneInput = String(payload.memberPhone || payload.phone || "").trim();

  // 1. Kurangi Stok Produk di Sheet Produk
  const sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (sheetProduk && items.length > 0) {
    kurangiStokProduk(sheetProduk, items);
  }

  // 2. Tambah Poin Belanja Member jika No HP diisi
  let memberResult = null;
  if (memberPhoneInput) {
    try {
      memberResult = tambahPoinBelanjaMember(ss, memberPhoneInput, 1, payload.customerName);
    } catch (e) {
      Logger.log("Err member pos: " + e.toString());
    }
  }

  // 3. Catat ke Tab Pesanan sebagai Transaksi Selesai
  const sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  if (sheetPesanan) {
    let rincianText = items.map((i, idx) => {
      const itemCost = Number(i && (i.costPrice || i.hargaBeli || i.hpp || i.hargaModal)) || 0;
      const costPart = itemCost > 0 ? ` [HPP: Rp ${itemCost.toLocaleString("id-ID")}]` : "";
      return `${idx + 1}. ${(i && i.name) || 'Barang'} [${Number(i && i.qty) || 1}x @ Rp ${Number(i && i.price || 0).toLocaleString("id-ID")}]${costPart}`;
    }).join("\n");
    if (memberPhoneInput && memberResult) {
      rincianText += `\n[🎁 Member: ${(memberResult && memberResult.name) || 'Member'} (${(memberResult && memberResult.phone) || memberPhoneInput}) | Total Belanja: ${(memberResult && memberResult.belanjaCount) || 1}/30]`;
    }

    sheetPesanan.appendRow([
      orderId,
      orderTimeNow,
      memberResult ? ((memberResult && memberResult.name) || "Pelanggan VIP") : "Pelanggan Kasir Toko",
      memberPhoneInput || "-",
      "Langsung di Toko",
      "-",
      rincianText,
      totalPrice,
      "-",
      "-",
      "Selesai (Kasir Toko)"
    ]);
  }

  return {
    status: "success",
    message: "Alhamdulillah! Transaksi kasir berhasil disimpan.",
    orderId: orderId,
    member: memberResult
  };
}

function prosesSaveReward(payload, ss) {
  let sheetHadiah = ss.getSheetByName(TAB_HADIAH);
  if (!sheetHadiah) {
    sheetHadiah = ss.insertSheet(TAB_HADIAH);
    setupTabHadiah(sheetHadiah);
  }

  const rewardId = String(payload.id || payload.idHadiah || "").trim();
  const data = sheetHadiah.getDataRange().getValues();
  let rowIdx = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === rewardId) {
      rowIdx = i + 1;
      break;
    }
  }

  if (rowIdx > 0) {
    if (payload.name) sheetHadiah.getRange(rowIdx, 2).setValue(payload.name);
    if (payload.imageUrl) sheetHadiah.getRange(rowIdx, 3).setValue(payload.imageUrl);
    if (payload.stock !== undefined) sheetHadiah.getRange(rowIdx, 4).setValue(Number(payload.stock) || 0);
    if (payload.description) sheetHadiah.getRange(rowIdx, 5).setValue(payload.description);
    if (payload.status) sheetHadiah.getRange(rowIdx, 6).setValue(String(payload.status).toUpperCase());

    return { status: "success", message: "Hadiah " + rewardId + " berhasil diperbarui." };
  } else {
    sheetHadiah.appendRow([
      rewardId || "HDH-" + String(data.length).padStart(2, "0"),
      payload.name || "Hadiah Baru",
      payload.imageUrl || "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500",
      Number(payload.stock) || 10,
      payload.description || "",
      String(payload.status || "AKTIF").toUpperCase()
    ]);
    return { status: "success", message: "Hadiah baru berhasil ditambahkan." };
  }
}

function prosesVerifyClaim(payload, ss) {
  let sheetKlaim = ss.getSheetByName(TAB_KLAIM);
  if (!sheetKlaim) throw new Error("Tab Klaim belum tersedia.");

  const claimId = String(payload.claimId || "").trim().toUpperCase();
  const newStatus = payload.status || "Sudah Diserahkan";

  const data = sheetKlaim.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === claimId) {
      sheetKlaim.getRange(i + 1, 7).setValue(newStatus);
      return { status: "success", message: "Status klaim " + claimId + " berhasil diubah menjadi: " + newStatus };
    }
  }

  return { status: "error", message: "Kode klaim " + claimId + " tidak ditemukan." };
}

/**
 * SEEDER 100 PRODUK LENGKAP DENGAN MENJAGA PRODUK YANG SUDAH ADA
 * Melestarikan 19 produk yang sudah ada di tab Produk (termasuk hasil scan kemarin)
 * Mengisi hingga 100 produk terbagi di 4 kategori:
 * 1. ATK & Perlengkapan Kantor
 * 2. Kosmetik & Perawatan Diri
 * 3. Sembako & Kelontongan
 * 4. Makanan & Minuman
 */
function seed100ProdukPreserveExisting(ss) {
  if (!ss) ss = getDelinaSpreadsheet();

  // Pastikan Tab Setup Lengkap
  let sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (!sheetProduk) {
    sheetProduk = ss.insertSheet(TAB_PRODUK);
    const headerProduk = [["ID", "Nama", "Kategori", "Harga", "Stok", "Satuan", "URL_Foto", "Deskripsi"]];
    sheetProduk.getRange(1, 1, 1, headerProduk[0].length).setValues(headerProduk);
    formatHeaderSheet(sheetProduk, headerProduk[0].length);
  }

  let sheetMember = ss.getSheetByName(TAB_MEMBER);
  if (!sheetMember) {
    sheetMember = ss.insertSheet(TAB_MEMBER);
    setupTabMember(sheetMember);
  }

  let sheetHadiah = ss.getSheetByName(TAB_HADIAH);
  if (!sheetHadiah) {
    sheetHadiah = ss.insertSheet(TAB_HADIAH);
    setupTabHadiah(sheetHadiah);
  } else if (sheetHadiah.getLastRow() <= 1) {
    setupTabHadiah(sheetHadiah);
  }

  let sheetKlaim = ss.getSheetByName(TAB_KLAIM);
  if (!sheetKlaim) {
    sheetKlaim = ss.insertSheet(TAB_KLAIM);
    setupTabKlaim(sheetKlaim);
  }

  // Update profil toko ke Delina.store
  let sheetPengaturan = ss.getSheetByName(TAB_PENGATURAN);
  if (sheetPengaturan && sheetPengaturan.getLastRow() > 1) {
    const dataPeng = sheetPengaturan.getDataRange().getValues();
    for (let p = 1; p < dataPeng.length; p++) {
      const key = String(dataPeng[p][0] || "").trim();
      if (key === "NAMA_TOKO") sheetPengaturan.getRange(p + 1, 2).setValue("Delina.store");
      if (key === "SLOGAN_TOKO") sheetPengaturan.getRange(p + 1, 2).setValue("ATK, Kosmetik dan Kelontongan");
    }
  }

  // Baca produk yang sudah ada di sheet
  const existingData = sheetProduk.getDataRange().getValues();
  const existingIds = new Set();

  for (let i = 1; i < existingData.length; i++) {
    const id = String(existingData[i][0] || "").trim();
    if (id) existingIds.add(id);

    // Sesuaikan kategori produk lama agar masuk ke 4 kategori resmi
    const oldCat = String(existingData[i][2] || "").trim();
    if (["Kertas & Buku", "Alat Tulis & Pulpen", "Peralatan Kantor & Map", "Paket Hemat", "Jasa Cetak & Fotokopi", "Buku"].includes(oldCat)) {
      sheetProduk.getRange(i + 1, 3).setValue("ATK & Perlengkapan Kantor");
    }
  }

  // Daftar 81 Produk Tambahan Berkualitas Tinggi
  const itemsToAdd = [
    // ATK & Perlengkapan Kantor (Tambahan ATK-020 s/d ATK-025)
    ["ATK-020", "Binder Bantex B5 Pastel Ring Metal 26 Ring Exclusive", "ATK & Perlengkapan Kantor", 38000, 45, "Pcs", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", "Binder cover kulit sintesis warna pastel elegan dengan ring besi tahan karat dan slot kartu nama."],
    ["ATK-021", "Kertas Loose Leaf B5 Bergaris Merk Joyko (1 Pack Isi 100 Lembar)", "ATK & Perlengkapan Kantor", 12500, 80, "Pack", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Refill binder B5 kertas tebal 80 gsm putih bersih dan tidak tembus tinta pulpen gel."],
    ["ATK-022", "Lakban Bening Daimaru 2 Inch (Lebar 48mm x Panjang 90 Yard)", "ATK & Perlengkapan Kantor", 14000, 60, "Roll", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Lakban perekat packing kualitas nomor 1 kuat, tidak mudah putus saat ditarik kencang."],
    ["ATK-023", "Kalkulator Meja 12 Digit Citizen SDC-868L Layar Besar", "ATK & Perlengkapan Kantor", 65000, 25, "Pcs", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80", "Kalkulator kasir meja 12 digit dual power tenaga surya dan baterai awet tahan lama."],
    ["ATK-024", "Spidol Permanen Snowman Jumbo 500 Hitam Anti Air Tahan Lama", "ATK & Perlengkapan Kantor", 11000, 90, "Pcs", "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80", "Spidol marker serbaguna permanen cepat kering cocok untuk menulis di kardus dan karung."],
    ["ATK-025", "Cutter Joyko L-500 Besar + 1 Tube Isi Ulang Pisau Baja", "ATK & Perlengkapan Kantor", 16500, 40, "Set", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600&auto=format&fit=crop&q=80", "Pisau cutter besar berbobot dengan sistem autolock dan mata pisau tajam anti macet."],

    // Kosmetik & Perawatan Diri (ATK-026 s/d ATK-050)
    ["ATK-026", "Wardah Lightening Micellar Gentle Wash 100ml Non-SLS", "Kosmetik & Perawatan Diri", 29500, 35, "Tub", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Sabun cuci muka pencerah dengan busa lembut dan niacinamide murni ramah kulit sensitif."],
    ["ATK-027", "Wardah UV Shield Essential Sunscreen Gel SPF 35 PA+++ 40ml", "Kosmetik & Perawatan Diri", 34000, 40, "Tub", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80", "Sunscreen ringan bebas alkohol tanpa white-cast lindungi wajah dari sinar matahari terik."],
    ["ATK-028", "Emina Bright Stuff Moisturizing Cream 20ml Pelembap Cerah Alami", "Kosmetik & Perawatan Diri", 23500, 50, "Tub", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80", "Krim pelembap remaja dengan ekstrak plum musim panas dan vitamin E bikin wajah glowing."],
    ["ATK-029", "Kahf Oil and Acne Care Face Wash Men 100ml Sabun Muka Pria", "Kosmetik & Perawatan Diri", 36000, 30, "Tub", "https://images.unsplash.com/photo-1608248597359-59751a0d3e5e?w=600&auto=format&fit=crop&q=80", "Pembersih wajah pria dengan ekstrak kopi dan formula HydroBalance cegah jerawat berlebih."],
    ["ATK-030", "Garnier Micellar Cleansing Water Pink All-in-1 Pembersih Make Up 125ml", "Kosmetik & Perawatan Diri", 32500, 45, "Btl", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80", "Pembersih wajah sekali usap tanpa bilas, mengangkat debu dan sisa make up hingga bersih."],
    ["ATK-031", "Nivea Extra White Body Serum Care and Protect SPF 15 PA 180ml", "Kosmetik & Perawatan Diri", 38500, 35, "Tub", "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80", "Lotion serum pencerah tubuh dengan 95% kemurnian vitamin C dan perlindungan triple filter UV."],
    ["ATK-032", "Vaseline Repairing Jelly Original 50ml Petroleum Murni Multi-Khasiat", "Kosmetik & Perawatan Diri", 25000, 60, "Pot", "https://images.unsplash.com/photo-1556228722-d0b5ed0cd015?w=600&auto=format&fit=crop&q=80", "Gel pelembap serbaguna mengatasi bibir pecah-pecah, tumit kering, dan kulit iritasi ringan."],
    ["ATK-033", "Ponds Bright Beauty Triple Glow Serum Mencerahkan Wajah 30ml", "Kosmetik & Perawatan Diri", 75000, 20, "Btl", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80", "Serum konsentrat pencerah dengan Gluta-Boost-C dan hyaluronic acid menyamarkan noda hitam."],
    ["ATK-034", "Biore UV Aqua Rich Watery Essence SPF 50+ PA++++ 50g Sunscreen Dingin", "Kosmetik & Perawatan Diri", 98000, 25, "Tub", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80", "Sunscreen viral sensasi dingin menyegarkan dengan micro-defense kapsul air tahan keringat."],
    ["ATK-035", "Hada Labo Gokujyun Ultimate Moisturizing Lotion Strip Hijau / Orange 100ml", "Kosmetik & Perawatan Diri", 47000, 30, "Btl", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Hydrating toner Jepang dengan 3 jenis Hyaluronic Acid menjaga elastisitas kelembapan kulit."],
    ["ATK-036", "Implora Urban Lip Matte Cream Best Shade 01 Dusky Nude Tahan 12 Jam", "Kosmetik & Perawatan Diri", 22000, 75, "Pcs", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80", "Lip cream matte ringan tekstur lembut wangi vanilla tidak membuat bibir kering pecah."],
    ["ATK-037", "Madame Gie Sweet Cheek Blushed On Baked Natural Glow 01", "Kosmetik & Perawatan Diri", 18500, 50, "Pcs", "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80", "Perona pipi bubuk padat pigmen halus tahan lama memberi rona segar cerah alami."],
    ["ATK-038", "Viva Air Mawar Ekstrak Mawar Asli 100ml Penyegar Kulit & Campuran Masker", "Kosmetik & Perawatan Diri", 7000, 120, "Btl", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80", "Air mawar legendaris aroma wangi menenangkan melembutkan kulit wajah setelah beraktivitas."],
    ["ATK-039", "Kapas Kecantikan Selection Facial Cotton Tebal Lembut Isi 100 Lembar", "Kosmetik & Perawatan Diri", 13000, 85, "Pack", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80", "Kapas bulat persegi 100% kapas murni higienis tanpa pemutih bebas debu serabut."],
    ["ATK-040", "Sunsilk Hijab Refresh and Anti-Dandruff Shampoo Botol 160ml", "Kosmetik & Perawatan Diri", 24000, 40, "Btl", "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80", "Shampo khusus wanita berhijab dengan buah tin dan jeruk nipis bikin rambut sejuk bebas ketombe."],
    ["ATK-041", "Lifebuoy Total 10 Antibacterial Body Wash Pouch Refill 450ml", "Kosmetik & Perawatan Diri", 25500, 55, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Sabun mandi cair antibakterial perlindungan kuman keluarga dengan formula activ silver+."],
    ["ATK-042", "Dettol Sabun Mandi Batang Antiseptik Original 100g (Pack Isi 3 Batang)", "Kosmetik & Perawatan Diri", 23000, 45, "Pack", "https://images.unsplash.com/photo-1607006314330-80278148b577?w=600&auto=format&fit=crop&q=80", "Sabun batang antiseptik pembunuh kuman nomor satu harum bersih menyegarkan sepanjang hari."],
    ["ATK-043", "Pepsodent Pencegah Gigi Berlubang Pasta Gigi Herbal Alami 190g", "Kosmetik & Perawatan Diri", 16500, 70, "Tub", "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&auto=format&fit=crop&q=80", "Pasta gigi formula mikro kalsium aktif dan fluoride melindungi email gigi dari asam makanan."],
    ["ATK-044", "Sikat Gigi Formula Sparkling White Bulu Halus Extra Soft (Pack 3 Pcs)", "Kosmetik & Perawatan Diri", 15000, 60, "Pack", "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&auto=format&fit=crop&q=80", "Sikat gigi bulu lembut 0.01mm menjangkau sela gigi sempit tanpa melukai gusi."],
    ["ATK-045", "Rexona Women Deodorant Roll On Advanced Whitening Glowing 45ml", "Kosmetik & Perawatan Diri", 19500, 50, "Btl", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80", "Deodorant pencerah ketiak tahan keringat dan bau badan hingga 48 jam wangi segar."],
    ["ATK-046", "Rexona Men Ice Cool Roll On Deodorant Sensasi Es Dingin 45ml", "Kosmetik & Perawatan Diri", 19500, 45, "Btl", "https://images.unsplash.com/photo-1608248597359-59751a0d3e5e?w=600&auto=format&fit=crop&q=80", "Deodorant pria dengan sensasi es dingin segar bebas bau keringat cocok untuk yang aktif olahraga."],
    ["ATK-047", "Parfum Pria Casablanca Body Mist Cologne Sport Blue 100ml Botol Kaca", "Kosmetik & Perawatan Diri", 24500, 35, "Btl", "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80", "Cologne pria maskulin sporty elegan aroma segar woody mewah tahan semerbak."],
    ["ATK-048", "Marina Hand Body Lotion Natural Rich Moisturizing Avocado 475ml Pump", "Kosmetik & Perawatan Diri", 17000, 40, "Btl", "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80", "Body lotion alpukat dan minyak zaitun melembapkan kulit kering seharian wangi lembut manis."],
    ["ATK-049", "Minyak Kayu Putih Cap Lang 60ml Hangat Alami Anti Masuk Angin", "Kosmetik & Perawatan Diri", 23500, 65, "Btl", "https://images.unsplash.com/photo-1608248597359-59751a0d3e5e?w=600&auto=format&fit=crop&q=80", "Minyak kayu putih asli Ambon aromaterapi melegakan pernapasan dan menghangatkan perut kembung."],
    ["ATK-050", "Minyak Telon My Baby Plus Minyak Sereh Eucalyptus Anti Nyamuk 90ml", "Kosmetik & Perawatan Diri", 22000, 55, "Btl", "https://images.unsplash.com/photo-1608248597359-59751a0d3e5e?w=600&auto=format&fit=crop&q=80", "Minyak telon bayi melindungi dari gigitan nyamuk hingga 8 jam wangi khas bayi menenangkan."],

    // Sembako & Kelontongan (ATK-051 s/d ATK-075)
    ["ATK-051", "Beras Premium Sania Pulen Bersih Alami Kemasan 5 Kg", "Sembako & Kelontongan", 74500, 30, "Sak", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80", "Beras berkualitas kepala super putih alami tanpa pemutih wangi pulen lezat saat dimasak."],
    ["ATK-052", "Minyak Goreng Bimoli Klasik Pouch Refill 2 Liter 2x Penyaringan", "Sembako & Kelontongan", 37500, 45, "Pouch", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Minyak goreng kelapa sawit murni bening tahan panas tinggi hasil gorengan renyah matang merata."],
    ["ATK-053", "Minyak Goreng Tropical Botol 1 Liter Non-Kolesterol", "Sembako & Kelontongan", 19500, 50, "Btl", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Minyak goreng bermutu tinggi dengan kandungan vitamin E dan asam lemak tak jenuh."],
    ["ATK-054", "Gula Pasir Gulaku Kuning Premium Tebu Alami Kemasan 1 Kg", "Sembako & Kelontongan", 17500, 80, "Pack", "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80", "Gula pasir dari tebu murni pilihan warna kuning alami rasa manis legit gurih tanpa bahan kimia."],
    ["ATK-055", "Tepung Terigu Segitiga Biru Bogasari Protein Sedang Kemasan 1 Kg", "Sembako & Kelontongan", 13500, 70, "Pack", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", "Tepung serbaguna cocok untuk gorengan renyah, kue basah, donat, dan martabak manis."],
    ["ATK-056", "Garam Meja Beryodium Cap Daun Bawang / Dolpin 250g Garam Halus", "Sembako & Kelontongan", 3500, 100, "Pack", "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80", "Garam meja halus beryodium tinggi mencegah penyakit gondok dan menyedapkan masakan rumah."],
    ["ATK-057", "Kecap Manis Bango Pouch Refill Kemasan Besar 520ml Dari Kedelai Hitam Mallika", "Sembako & Kelontongan", 22500, 60, "Pouch", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Kecap manis kental gurih dari kedelai hitam alami asli warisan nusantara rasa mantap."],
    ["ATK-058", "Saus Sambal ABC Asli Botol Kaca 335ml Pedas Segar Alami", "Sembako & Kelontongan", 15500, 50, "Btl", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Saus sambal pedas nikmat perpaduan cabai segar pilihan dan bawang putih gurih mantap."],
    ["ATK-059", "Margarin Blue Band Serbaguna Sachet Foil 200g Wangi Gurih", "Sembako & Kelontongan", 10500, 65, "Pack", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", "Margarin kaya nutrisi omega 3 & 6 cocok untuk olesan roti, memasak nasi goreng, dan bikin kue."],
    ["ATK-060", "Santan Kelapa Instan Kara Segitiga UHT 65ml (Pack Isi 5 Pcs)", "Sembako & Kelontongan", 16000, 45, "Pack", "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80", "Santan kelapa murni siap pakai praktis kental gurih untuk opor, lodeh, dan kolak pisang."],
    ["ATK-061", "Bumbu Masak Racik Indofood Sayur Asem / Ayam Goreng (Pack Isi 10 Sachet)", "Sembako & Kelontongan", 18000, 50, "Pack", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80", "Bumbu racik rempah asli tanpa bahan pengawet bikin masakan selezat masakan restoran."],
    ["ATK-062", "Masako Kaldu Ayam / Sapi Penyedap Rasa Gurih Kemasan Renteng Isi 12 Sachet", "Sembako & Kelontongan", 6500, 90, "Renteng", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80", "Kaldu daging asli dan bumbu rempah pilihan penyedap wajib sup, tumisan, dan gorengan."],
    ["ATK-063", "Sabun Cuci Piring Sunlight Jeruk Nipis 100 Pouch Refill Besar 700ml", "Sembako & Kelontongan", 14500, 75, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Cairan pencuci piring ekstrak jeruk nipis asli hilangkan lemak membandel 5x lebih cepat."],
    ["ATK-064", "Deterjen Bubuk Rinso Molto Anti Noda Classic Fresh Kemasan 770g", "Sembako & Kelontongan", 23500, 45, "Pack", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Deterjen formula busa cerdas hilangkan noda dalam 1x kucek wangi tahan harum 21 hari."],
    ["ATK-065", "Pewangi dan Pelembut Pakaian Downy Mystique Pouch 650ml Aroma Parfum Mewah", "Sembako & Kelontongan", 29000, 40, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Pelembut konsentrat wangi parfum elegan tahan lama di serat pakaian cegah bau apek."],
    ["ATK-066", "Pembersih Lantai SoKlin Pembersih Lantai Apel Wangi Segar Pouch 780ml", "Sembako & Kelontongan", 11500, 55, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Cairan pembersih lantai bunuh kuman 99% kilau bersih bebas lengket wangi segar semerbak."],
    ["ATK-067", "Obat Nyamuk Semprot Baygon Aerosol Fresh Citrus Anti Nyamuk & Lalat 600ml", "Sembako & Kelontongan", 39500, 30, "Klg", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Aerosol semprot anti nyamuk demam berdarah dan serangga aroma jeruk segar tidak menyengat."],
    ["ATK-068", "Tissue Wajah Paseo Smart Facial Tissue 250 Sheets 2 Ply Halus Kuat", "Sembako & Kelontongan", 14000, 90, "Pack", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80", "Tisu wajah higienis 100% serat alami virgin pulp lembut nyaman di kulit tanpa iritasi."],
    ["ATK-069", "Lampu LED Hannochs Sonic 9 Watt Cahaya Putih Terang Hemat Listrik", "Sembako & Kelontongan", 21000, 40, "Pcs", "https://images.unsplash.com/photo-1550524514-9b552d438965?w=600&auto=format&fit=crop&q=80", "Bohlam lampu LED 9W setara lampu pijar 80W tahan hingga 10.000 jam garansi resmi."],
    ["ATK-070", "Baterai ABC Alkaline AA / A2 (Pack Isi 4 Baterai) Daya Tahan 6x Lebih Kuat", "Sembako & Kelontongan", 18500, 60, "Pack", "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80", "Baterai alkaline anti bocor daya stabil untuk jam dinding, mouse wireless, dan remote TV."],
    ["ATK-071", "Baterai ABC Alkaline AAA / A3 Kecil (Pack Isi 4 Baterai) Untuk Remote AC", "Sembako & Kelontongan", 18500, 55, "Pack", "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80", "Baterai mikro alkaline daya tinggi tahan lama untuk remote AC, timbangan, dan mainan anak."],
    ["ATK-072", "Korek Gas Tokai Pemantik Api Rumah Tangga Original (Pack 3 Pcs)", "Sembako & Kelontongan", 12000, 80, "Pack", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600&auto=format&fit=crop&q=80", "Korek api gas standar SNI api stabil aman dan awet untuk menyalakan kompor gas."],
    ["ATK-073", "Kantong Plastik Sampah Roll Hitam Tebal 50x60cm (Isi 30 Lembar)", "Sembako & Kelontongan", 14500, 70, "Roll", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Trash bag roll plastik elastis kuat tidak mudah bocor menjaga kebersihan rumah dan kantor."],
    ["ATK-074", "Sapu Ijuk Kayu Mahoni Halus Tradisional Awet Tidak Rontok", "Sembako & Kelontongan", 25000, 25, "Pcs", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Sapu lantai ijuk hitam murni gagang kayu kokoh sapu bersih debu lantai tanpa gores keramik."],
    ["ATK-075", "Pel Lantai Benang Katun Gagang Besi Anti Karat Delina Home", "Sembako & Kelontongan", 28000, 20, "Pcs", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Alat pel lantai benang katun tebal daya serap air tinggi lantai cepat kering mengilap."],

    // Makanan & Minuman (ATK-076 s/d ATK-100)
    ["ATK-076", "Indomie Mi Instan Goreng Spesial 85g Bumbu Gurih Bawang Goreng Renyah", "Makanan & Minuman", 3500, 200, "Bks", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", "Mie instan goreng terfavorit di dunia dengan aroma bawang khas dan kecap manis nikmat mantap."],
    ["ATK-077", "Indomie Mi Kuah Rasa Soto Mie 70g Gurih Jeruk Nipis Hangat", "Makanan & Minuman", 3500, 180, "Bks", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", "Kuah soto bumbu rempah asli segar gurih perpaduan jeruk nipis hangat cocok di musim hujan."],
    ["ATK-078", "Mie Sedaap Goreng Kriuk-Kriuk Bawang Gurih Renyah 90g", "Makanan & Minuman", 3500, 150, "Bks", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", "Mie kenyal gurih dengan taburan bawang kriuk renyah sensasi makan mie goreng paling mantap."],
    ["ATK-079", "Kopi Kapal Api Special Mix Kopi Plus Gula Mantap (Pack Isi 10 Sachet x 24g)", "Makanan & Minuman", 16500, 80, "Pack", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", "Kopi hitam bubuk asli perpaduan biji kopi pilihan dan gula murni aroma semerbak harum."],
    ["ATK-080", "Luwak White Koffie Original Rendah Asam Aman di Lambung (Pack Isi 10 Sachet)", "Makanan & Minuman", 15000, 75, "Pack", "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80", "Kopi putih lembut nikmat bebas kembung proses pembekuan mutakhir aman diminum setiap hari."],
    ["ATK-081", "Teh Celup SariWangi Teh Asli Nusantara (Kotak Isi 30 Kantong Celup)", "Makanan & Minuman", 8500, 90, "Kotak", "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80", "Teh hitam pilihan aroma wangi menyegarkan cocok untuk minum teh hangat bersama keluarga."],
    ["ATK-082", "Susu UHT Ultra Milk Cokelat / Full Cream Botol Karton 250ml", "Makanan & Minuman", 7000, 110, "Kotak", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", "Susu sapi segar alami kaya kalsium dan vitamin D membantu pertumbuhan tulang dan energi aktif."],
    ["ATK-083", "Susu Beruang Bear Brand Steril 189ml Murni Kemurnian Terjaga", "Makanan & Minuman", 10500, 85, "Klg", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", "Susu sapi steril 100% murni tanpa pengawet baik diminum saat pemulihan tubuh dan jaga imun."],
    ["ATK-084", "Air Mineral Aqua Botol Sedang 600ml Segar Dari Sumber Pegunungan", "Makanan & Minuman", 3500, 180, "Btl", "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80", "Air mineral murni terlindungi alami dari mata air pegunungan vulkanik sejuk menyegarkan."],
    ["ATK-085", "Le Minerale Air Mineral Botol 600ml Ada Manis-Manisnya", "Makanan & Minuman", 3500, 160, "Btl", "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80", "Air mineral kaya mineral alami bikarbonat dan kalsium kesegaran murni terlindungi tutup bersegel."],
    ["ATK-086", "Teh Botol Sosro Kotak Tetra Pak 250ml Segar Manis Alami Melati", "Makanan & Minuman", 4000, 120, "Kotak", "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80", "Minuman teh melati asli siap minum pelepas dahaga nomor 1 dinikmati dingin lebih nikmat."],
    ["ATK-087", "Pocari Sweat Botol Pet 500ml Pengganti Ion Tubuh Cepat", "Makanan & Minuman", 8000, 70, "Btl", "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80", "Minuman isotonik kemposisi mirip cairan tubuh kembalikan kesegaran setelah lelah beraktivitas."],
    ["ATK-088", "Floridina Pulpy Orange Jus Jeruk Segar Bulir Asli 350ml", "Makanan & Minuman", 3500, 130, "Btl", "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80", "Jus jeruk Florida segar dengan bulir jeruk asli kaya vitamin C diminum dingin sangat segar."],
    ["ATK-089", "Biskuit Roma Kelapa Biskuit Renyah Gurih Kemasan Besar 300g", "Makanan & Minuman", 12500, 65, "Pack", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Biskuit kelapa asli gurih renyah diperkaya vitamin B1, B2, B6 dan kalsium pas dicelup teh hangat."],
    ["ATK-090", "Wafer Nabati Richeese Keju Kaleng / Pouch Kemasan 130g", "Makanan & Minuman", 8500, 85, "Pack", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Wafer renyah krim keju asli kaya vitamin A, B1, B2, B6, B12 rasa gurih manis lumer di mulut."],
    ["ATK-091", "Biskuit Oreo Krim Vanilla Kemasan Roll 119.6g Diputar Dijilat Dicelupin", "Makanan & Minuman", 9500, 90, "Roll", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Biskuit sandwich cokelat renyah dengan krim vanila tebal manis kesukaan semua generasi."],
    ["ATK-092", "Cokelat SilverQueen Cashew Susu Cokelat Mede Gurih 58g", "Makanan & Minuman", 16500, 60, "Batang", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80", "Cokelat susu nikmat berpadu dengan kacang mete renyah gurih pelepas stres dan cemilan manis."],
    ["ATK-093", "Beng-Beng Cokelat Wafer Karamel Crispy 4 Kelezatan (Pack Isi 20 Pcs)", "Makanan & Minuman", 35000, 45, "Pack", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80", "Kombinasi 4 kelezatan wafer renyah, krim susu, karamel legit, dan crispy balut cokelat tebal."],
    ["ATK-094", "Chitato Keripik Kentang Sapi Panggang Beef Barbeque 68g Bergelombang", "Makanan & Minuman", 11500, 70, "Bks", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80", "Keripik kentang asli potongan bergelombang bumbu rasa sapi panggang barbeque renyah mantap."],
    ["ATK-095", "Qtela Keripik Singkong Barbeque / Balado 60g Gurih Renyah Khas", "Makanan & Minuman", 7500, 80, "Bks", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80", "Keripik singkong tradisional renyah dengan bumbu khas rempah balado gurih nagih."],
    ["ATK-096", "Kacang Garuda Rosta Bawang Panggang Renyah 95g Tanpa Kolesterol", "Makanan & Minuman", 11000, 65, "Pack", "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=600&auto=format&fit=crop&q=80", "Kacang bersalut rasa bawang gurih dipanggang oven bukan digoreng renyah garing sehat."],
    ["ATK-097", "Permen Kopiko Coffee Candy Ekstrak Kopi Asli (Bag Isi 50 Butir)", "Makanan & Minuman", 9500, 95, "Bag", "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600&auto=format&fit=crop&q=80", "Permen kopi nomor satu dari ekstrak biji kopi asli ampuh hilangkan kantuk saat bekerja."],
    ["ATK-098", "Choki Choki Pasta Cokelat Cashew Stik (Pack Isi 20 Stik)", "Makanan & Minuman", 18000, 70, "Pack", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80", "Pasta cokelat lembut manis dengan kacang mede cemilan stik manis favorit anak-anak."],
    ["ATK-099", "Biskuit Khong Guan Red Assorted Biscuit Kaleng Kotak Klasik 650g", "Makanan & Minuman", 58000, 25, "Klg", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Kaleng biskuit aneka rasa legendaris cocok untuk suguhan tamu dan oleh-oleh keluarga."],
    ["ATK-100", "Energen Sereal dan Susu Cokelat / Vanila Bergizi (Renceng Isi 10 Sachet)", "Makanan & Minuman", 21500, 75, "Renceng", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", "Minuman sereal gandum bergizi dengan susu dan telur sarapan sehat penambah tenaga aktif."]
  ];

  let addedCount = 0;
  for (let k = 0; k < itemsToAdd.length; k++) {
    const item = itemsToAdd[k];
    if (!existingIds.has(item[0])) {
      sheetProduk.appendRow(item);
      existingIds.add(item[0]);
      addedCount++;
    }
  }

  const finalTotal = sheetProduk.getLastRow() - 1;
  Logger.log(`Seeder selesai: Total produk saat ini ${finalTotal} (Tambahan baru: ${addedCount})`);

  return {
    totalProducts: finalTotal,
    addedNew: addedCount,
    totalRewards: sheetHadiah.getLastRow() - 1,
    totalMembers: sheetMember.getLastRow() - 1
  };
}
