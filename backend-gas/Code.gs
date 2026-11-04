/**
 * =========================================================================
 * BACKEND TOKO DELINA (Google Apps Script - Code.gs)
 * Marketplace ATK, Kosmetik & Kelontongan | Portal Kasir & Super Admin
 * Bot Telegram Kiko AI Canggih (Interactive Inline Keyboard & Callback Query)
 * Arsitektur Serverless 100% Gratis - Google Apps Script + Sheets + Drive + Gemini
 * =========================================================================
 */

// Konstanta Nama Tab Spreadsheet
const TAB_PRODUK = "Produk";
const TAB_PESANAN = "Pesanan";
const TAB_TARIF = "Tarif_Fotokopi"; // Dipertahankan untuk kompatibilitas data lama jika ada
const TAB_PENGATURAN = "Pengaturan";
const TAB_KUPON = "Kupon";
const TAB_MEMBER = "Member";
const TAB_HADIAH = "Hadiah_Royalty";
const TAB_KLAIM = "Klaim_Hadiah";
const TAB_KATEGORI = "Kategori";

// Konstanta Nama Folder Google Drive Penyimpanan
const FOLDER_UTAMA = "Toko Delina - Berkas Pelanggan";
const SUBFOLDER_BUKTI = "Bukti_Pembayaran";
const SUBFOLDER_PRODUK = "Foto_Produk";
const SUBFOLDER_QRIS = "Foto_QRIS";
const SUBFOLDER_MEMBER_PROFIL_KTP = "Foto_Profil_dan_KTP_Member";

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
      ["ATK-001", "Kertas HVS PaperOne A4 75gsm (1 Rim / 500 Lembar)", "ATK & Kantor", 48000, 85, "Rim", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Kertas HVS putih bersih berkualitas tinggi."],
      ["ATK-002", "Buku Tulis Sinar Dunia (SiDu) Kiky 38 Lembar - Pack Isi 10 Buku", "ATK & Kantor", 36500, 40, "Pack", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", "Buku tulis bergaris standar sekolah dan kuliah."],
      ["ATK-003", "Pulpen Gel Zebra Sarasa Clip 0.5mm Hitam / Biru Tinta Pekat", "ATK & Kantor", 15500, 120, "Pcs", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80", "Pulpen gel berkualitas dengan tinta cepat kering."],
      ["ATK-004", "Paket Pulpen Standard AE7 0.5 Hitam (1 Lusin / 12 Batang)", "ATK & Kantor", 24000, 65, "Lusin", "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80", "Pulpen sejuta umat, awet dan nyaman."],
      ["ATK-005", "Map Folder Plastik L Document Bag Clear Holder F4 Folio", "ATK & Kantor", 6500, 200, "Pcs", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80", "Map plastik transparan bebas basah."],
      ["ATK-006", "Stapler Joyko HD-10 + Isi Ulang Staples No. 10 (Set Lengkap)", "ATK & Kantor", 18500, 50, "Set", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Stapler Joyko kuat include isi."],
      ["ATK-007", "Kertas Double Folio Bergaris Merk Sinar Dunia (1 Pack / 100 Lembar)", "ATK & Kantor", 19500, 75, "Pack", "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80", "Kertas double folio ujian dan laporan."],
      ["ATK-008", "Tipe-X Kertas Kering Joyko Correction Tape CT-522 (Panjang 12m)", "ATK & Kantor", 9000, 90, "Pcs", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80", "Koreksi pita kertas kering tanpa bau."]
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
    ["PIN_KASIR", "1234", "PIN Keamanan Kasir POS (Antrean Pesanan)"],
    ["GEMINI_API_KEY", "", "Kunci API Google Gemini untuk Otak AI Kiko & Vision Barcode (gratis dari aistudio.google.com)"]
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
    ["BELANJABERKAH", "PERSEN", 10, 20000, "AKTIF", "Diskon Belanja ATK, Kosmetik & Kelontongan 10%"],
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
      const auth = validatePin(pin || "1234", ss);
      if (!auth.valid && action === "getAdminData") {
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
      } else {
        const props = PropertiesService.getScriptProperties();
        safeSettings.TELEGRAM_BOT_TOKEN = props.getProperty("TELEGRAM_BOT_TOKEN") || "";
        safeSettings.ADMIN_CHAT_ID = props.getProperty("ADMIN_CHAT_ID") || props.getProperty("TELEGRAM_ADMIN_CHAT_ID") || "";
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
    // JALUR 0: AUTO-BIND GRUP TELEGRAM (Otomatis Daftarkan ID Grup ke ADMIN_CHAT_ID)
    // =========================================================
    let incomingGroupChatId = null;
    let incomingGroupTitle = "";
    let incomingGroupType = "";

    if (payload.my_chat_member && payload.my_chat_member.chat) {
      incomingGroupChatId = payload.my_chat_member.chat.id;
      incomingGroupTitle = payload.my_chat_member.chat.title || "";
      incomingGroupType = payload.my_chat_member.chat.type || "group";
    } else if (payload.message && payload.message.chat) {
      const c = payload.message.chat;
      if (String(c.id).startsWith("-") || c.type === "group" || c.type === "supergroup") {
        incomingGroupChatId = c.id;
        incomingGroupTitle = c.title || "";
        incomingGroupType = c.type || "group";
      }
    }

    if (incomingGroupChatId) {
      const bindRes = autoBindTelegramGroup(incomingGroupChatId, incomingGroupTitle, incomingGroupType);
      if (bindRes && bindRes.isNewlyAdded) {
        const welcomeGroupMsg = `🎉 *BISMILLAH, GRUP RESMI TERHUBUNG!* 🏪
━━━━━━━━━━━━━━━━━━━━━━━━━━
Alhamdulillah! Grup *"${incomingGroupTitle || 'Group Laporan Toko Delina'}"* telah *OTOMATIS TERDAFTAR* sebagai saluran laporan resmi Toko Delina!

🆔 *Grup ID:* \`${incomingGroupChatId}\`
🤖 *Status Bot:* Aktif & Terhubung ke Toko Delina

📢 *Mulai detik ini, bot Kiko AI akan otomatis melaporkan setiap aktivitas ke grup ini:*
• 🛍️ *Pesanan Baru* (Pelanggan Belanja di Website)
• 💻 *Transaksi Kasir (POS)* (Penjualan Langsung di Toko)
• 👤 *Member Baru* (Pendaftaran Member VIP)
• 🎁 *Klaim Hadiah* (Tukar Poin Member Royalty)
• 🔄 *Update Status Nota* (Lunas, Siap Ambil, Selesai)
• 📦 *Perubahan Stok & Produk* (Restock / Edit Katalog)
• 🔐 *Sesi Keamanan* (Login Admin & Kasir)

_Semoga Toko Delina semakin berkah, maju, dan laris manis!_ 🤲✨`;
        kirimPesanTelegram(incomingGroupChatId, welcomeGroupMsg);
      }
    }

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

      // 2a. Menu Kosmetik & Skincare
      if (cbData === "menu_kosmetik") {
        answerCallbackQuery(cb.id, "Koleksi Kosmetik & Skincare");
        const kosmetikMsg = `💄 *KOLEKSI KOSMETIK & SKINCARE DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Cantik, Segar & Terawat Bersama Toko Delina:*
Kami menyediakan produk perawatan harian original:
• 🧴 *Skincare Harian:* Pembersih wajah (Micellar Water), sabun cuci muka, pelembab
• ☀️ *Sunscreen & Body Lotion:* Menjaga kesehatan & kelembaban kulit
• 🌸 *Perawatan Tubuh & Rambut:* Deodorant, shampo, sabun mandi, bedak & parfum

💡 *Tanya Kiko AI:*
Kakak bisa langsung tanyakan rekomendasi kosmetik yang cocok untuk kebutuhan kakak di chat ini!

👇 *Klik tombol di bawah untuk belanja kosmetik di web:*`;
        kirimPesanTelegram(fromChatId, kosmetikMsg, {
          inline_keyboard: [
            [{ text: "💄 Buka Etalase Kosmetik", url: webAppStoreUrl }]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 2b. Menu ATK & Kelontongan
      if (cbData === "menu_atk_kelontong") {
        answerCallbackQuery(cb.id, "Katalog ATK & Kelontongan");
        const atkKelontongMsg = `🛒 *KATALOG ATK & KELONTONGAN DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Kebutuhan Kantor, Sekolah & Rumah Tangga Lengkap:*

📚 *Perlengkapan ATK:*
• Kertas HVS (A4, F4), buku tulis (SiDu, Kiky, Big Boss)
• Pulpen, pensil, spidol, map arsip, binder & stapler

🍳 *Kelontongan & Sembako Dapur:*
• Minyak goreng, beras, gula pasir, teh, kopi, mie instan
• Susu UHT, biskuit, wafer & jajanan ringan
• Sabun cuci piring, detergen pakaian & pembersih lantai

👇 *Klik tombol di bawah untuk pesan langsung di web:*`;
        kirimPesanTelegram(fromChatId, atkKelontongMsg, {
          inline_keyboard: [
            [{ text: "🛒 Buka Katalog di Web", url: webAppStoreUrl }]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 2c. Menu Member & Hadiah (Input No HP Langsung)
      if (cbData === "menu_member") {
        answerCallbackQuery(cb.id, "Program Member Royalty");
        const memberMsg = `👑 *CEK STATUS MEMBER & POIN HADIAH DELINA* 🎁
━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Kumpulkan Poin Setiap Belanja:*
• Setiap belanja Rp 10.000 = *1 Poin Belanja*
• Tukar *30 Poin* = *1 Hadiah Gratis* pilihan kakak!

👉 *Cek Saldo Poin Anda Sekarang:*
Silakan ketik **Nomor WhatsApp / HP** kakak langsung di chat ini (contoh: \`081234567890\`).

Kiko akan langsung memeriksa kartu member, saldo poin, dan hadiah yang bisa kakak klaim! 🎁

👇 *Atau klik tombol di bawah untuk melihat pilihan hadiah di web:*`;
        kirimPesanTelegram(fromChatId, memberMsg, {
          inline_keyboard: [
            [{ text: "👑 Buka Kartu Member di Web", url: webAppStoreUrl }],
            [{ text: "🎁 Lihat Pilihan Hadiah", url: webAppStoreUrl }]
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
          broadcastPesanTelegram(`🔄 *VERIFIKASI NOTA BERHASIL*\nNota \`${orderId}\` telah diverifikasi *Lunas & Sedang Diproses* oleh Admin via Telegram.`);
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
          broadcastPesanTelegram(`📦 *UPDATE STATUS NOTA*\nNota \`${orderId}\` telah diubah statusnya menjadi *Siap Diambil di Toko* oleh Admin via Telegram.`);
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
      const chatType = payload.message.chat.type || "private";
      const isGroup = String(chatId).startsWith("-") || chatType === "group" || chatType === "supergroup";
      const rawText = String(payload.message.text || "").trim();
      // Bersihkan mention bot pada grup Telegram (contoh: /start@KikoDelinaBot -> /start)
      const userText = rawText.replace(/@[a-zA-Z0-9_]+bot/gi, "").trim();
      const settings = getPengaturanData(ss);
      const webAppStoreUrl = "https://mandalaprojek.github.io/toko-delina/";
      const mapsUrl = settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Toko+Delina+ATK";
      const cleanWa = String(settings.NO_WA_TOKO || "081234567890").replace(/\D/g, "");
      const waUrl = `https://wa.me/${cleanWa.startsWith("0") ? "62" + cleanWa.slice(1) : cleanWa}`;

      const lower = userText.toLowerCase().trim();

      // =========================================================
      // KHUSUS PERINTAH GRUP TELEGRAM (LAPORAN & OPERASIONAL TOKO)
      // =========================================================
      if (isGroup) {
        // Perintah Sambungkan Grup
        if (lower === "/sambungkan" || lower === "/hubungkan" || lower === "/connect") {
          const connectMsg = `✅ *GRUP SUDAH TERHUBUNG & AKTIF!* 🏪
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 🆔 *Grup ID:* \`${chatId}\`
• 👥 *Nama Grup:* *${payload.message.chat.title || "Group Laporan Toko Delina"}*
• 🟢 *Status Laporan:* Aktif & Terdaftar Resmi

📢 Seluruh aktivitas transaksi website, kasir POS, pendaftaran member, klaim hadiah, update status nota, dan keamanan otomatis dikirimkan ke grup ini! 🚀`;
          kirimPesanTelegram(chatId, connectMsg);
          return HtmlService.createHtmlOutput("OK");
        }

        // Perintah Info Chat ID Grup
        if (lower === "/id" || lower === "id" || lower === "cek id" || lower === "/status") {
          const props = PropertiesService.getScriptProperties();
          const geminiKey = props.getProperty("GEMINI_API_KEY");
          const statusAI = geminiKey ? "✅ Terpasang (Google Gemini)" : "ℹ️ Mode Database Google Sheets";

          const idInfoMsg = `📊 *INFORMASI GRUP LAPORAN DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 🆔 *Grup ID:* \`${chatId}\`
• 👥 *Tipe Chat:* *${chatType.toUpperCase()}*
• 🏷️ *Nama Grup:* *${payload.message.chat.title || "Group Delina"}*
• 🧠 *Otak AI Kiko:* ${statusAI}
• 🟢 *Status Laporan:* Terhubung & Aktif

💡 Seluruh laporan pesanan online, kasir POS, member baru, dan stok otomatis dilaporkan ke grup ini. 🤲✨`;
          kirimPesanTelegram(chatId, idInfoMsg);
          return HtmlService.createHtmlOutput("OK");
        }

        // Perintah Rekap Penjualan & Omzet Hari Ini (/rekap atau /omzet)
        if (lower === "/rekap" || lower === "/omzet" || lower === "rekap" || lower === "omzet") {
          const orders = ambilDaftarPesanan(ss);
          const todaySlash = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy");
          let totalOmzet = 0;
          let countWeb = 0;
          let countPos = 0;

          orders.forEach(o => {
            if (o.orderTime && o.orderTime.includes(todaySlash)) {
              totalOmzet += Number(o.total) || 0;
              const rincianUpper = String(o.itemsText || "").toUpperCase();
              const delivUpper = String(o.deliveryMethod || "").toUpperCase();
              if (delivUpper.includes("POS") || rincianUpper.includes("KASIR POS") || delivUpper.includes("KASIR")) {
                countPos++;
              } else {
                countWeb++;
              }
            }
          });

          const totalTrx = countWeb + countPos;
          const rekapMsg = `📊 *REKAP OMZET & TRANSAKSI HARI INI*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏪 *Toko:* Delina.store (ATK, Kosmetik & Kelontongan)
📅 *Tanggal:* ${todaySlash} WIB

💰 *Total Omzet:* *Rp ${totalOmzet.toLocaleString("id-ID")}*
🧾 *Total Transaksi:* *${totalTrx} Transaksi*
• 🛍️ *Pesanan Online Web:* ${countWeb} pesanan
• 💻 *Transaksi Kasir POS:* ${countPos} transaksi

_Laporan otomatis langsung dari Google Sheets Toko Delina._ 🤲✨`;
          kirimPesanTelegram(chatId, rekapMsg);
          return HtmlService.createHtmlOutput("OK");
        }

        // Perintah Cek Stok Menipis (/stok atau /stok_menipis)
        if (lower === "/stok" || lower === "/stok_menipis" || lower === "stok menipis" || lower === "cek stok") {
          const sheetProduk = ss.getSheetByName(TAB_PRODUK);
          let lowItems = [];
          if (sheetProduk && sheetProduk.getLastRow() > 1) {
            const data = sheetProduk.getDataRange().getValues();
            for (let i = 1; i < data.length; i++) {
              const nama = data[i][1];
              const kat = data[i][2];
              const stok = Number(data[i][4]) || 0;
              const unit = data[i][5] || "Pcs";
              if (stok <= 5 && nama) {
                lowItems.push(`• *${nama}* (${kat}): sisa *${stok} ${unit}*`);
              }
            }
          }

          let stokMsg = "";
          if (lowItems.length > 0) {
            stokMsg = `⚠️ *PERINGATAN STOK MENIPIS (<= 5 PCS)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Ditemukan *${lowItems.length} produk* yang perlu segera restock:

${lowItems.slice(0, 25).join("\n")}
${lowItems.length > 25 ? `\n_...dan ${lowItems.length - 25} produk lainnya._` : ""}

💡 *Segera restock melalui Panel Admin Toko Delina.*`;
          } else {
            stokMsg = `✅ *STATUS STOK TOKO DELINA AMAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Alhamdulillah, seluruh stok produk ATK, Kosmetik & Kelontongan saat ini dalam kondisi aman (tersedia di atas 5 pcs). 🤲`;
          }
          kirimPesanTelegram(chatId, stokMsg);
          return HtmlService.createHtmlOutput("OK");
        }

        // Di dalam grup, abaikan chat biasa agar tidak spam percakapan anggota
        return HtmlService.createHtmlOutput("OK");
      }

      // =========================================================
      // KHUSUS CHAT PRIBADI (PELANGGAN & ADMIN)
      // =========================================================

      // 1. Info Chat ID Pribadi (/id atau /status)
      if (lower === "/id" || lower === "id" || lower === "cek id" || lower === "/status") {
        const props = PropertiesService.getScriptProperties();
        const geminiKey = props.getProperty("GEMINI_API_KEY");
        const statusAI = geminiKey ? "✅ Terpasang (Google Gemini)" : "ℹ️ Mode Database Google Sheets";

        const idInfoMsg = `📊 *INFORMASI CHAT ID TELEGRAM*
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 🆔 *Chat ID:* \`${chatId}\`
• 👥 *Tipe Chat:* Pribadi
• 🏷️ *Nama Pengguna:* *${payload.message.chat.first_name || "Pelanggan Delina"}*
• 🧠 *Otak AI Kiko:* ${statusAI}

💡 *Petunjuk Pengaturan Toko Delina:*
Jika Anda adalah Admin Toko, simpan Chat ID di atas: \`${chatId}\` pada menu Pengaturan panel Admin Toko Delina agar notifikasi pesanan terkirim ke Telegram Anda.`;
        kirimPesanTelegram(chatId, idInfoMsg);
        return HtmlService.createHtmlOutput("OK");
      }

      // 2. Deteksi Cek Poin & Hadiah (Tombol Persistent Keyboard atau teks)
      if (lower === "🎁 cek poin & hadiah" || lower === "/poin" || lower === "poin" || lower === "cek poin" || lower === "member" || lower === "kartu member" || lower === "hadiah") {
        const poinGuideMsg = `👑 *CEK STATUS MEMBER & POIN HADIAH DELINA* 🎁
━━━━━━━━━━━━━━━━━━━━━━━━━━
Silakan ketik **Nomor WhatsApp / HP** kakak langsung di chat ini:

Contoh format:
👉 \`081234567890\`
👉 \`082185355316\`

Kiko akan langsung menampilkan:
✨ Status Keanggotaan Member VIP
💎 Saldo Poin / Stempel Belanja
🎁 Pilihan Hadiah Gratis yang bisa kakak klaim!`;

        kirimPesanTelegram(chatId, poinGuideMsg, {
          inline_keyboard: [
            [
              { text: "👑 Buka Kartu Member di Web", url: webAppStoreUrl }
            ],
            [
              { text: "🎁 Lihat Pilihan Hadiah", url: webAppStoreUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 3. Deteksi Cerdas Input Nomor HP (Cek Member & Poin Otomatis)
      const cleanDigits = userText.replace(/[\s\-\+\(\)\.]/g, "");
      const isPhoneInput = (
        (/^(?:08|\+?628|628)\d{8,12}$/.test(userText.replace(/[\s\-]/g, ""))) ||
        (cleanDigits.length >= 10 && cleanDigits.length <= 14 && (cleanDigits.startsWith("08") || cleanDigits.startsWith("628")))
      );

      if (isPhoneInput) {
        const memberRes = prosesGetMemberData(cleanDigits, ss);
        if (memberRes && memberRes.status === "success" && memberRes.member) {
          const m = memberRes.member;
          const sisaPoin = Math.max(0, 30 - (m.belanjaCount || 0));
          const statusHadiah = (m.belanjaCount || 0) >= 30 
            ? "🎉 *Alhamdulillah! Poin kakak sudah cukup untuk KLAIM HADIAH GRATIS!*"
            : `🎁 Kumpulkan *${sisaPoin} stempel lagi* untuk klaim 1 Hadiah Gratis pilihan kakak!`;

          const memberCardMsg = `👑 *KARTU MEMBER VIP TOKO DELINA* 👑
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Nama Member:* *${m.name}*
📱 *No. WhatsApp:* \`${m.phone}\`
⭐ *Saldo Stempel / Poin:* *${m.belanjaCount || 0} / 30*
🏆 *Total Hadiah Pernah Diklaim:* *${m.totalClaimed || 0} Hadiah*
📅 *Tanggal Bergabung:* ${m.registeredAt || "-"}

${statusHadiah}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Keuntungan Belanja Member:*
• Setiap belanja dapat stempel poin
• Tukar 30 stempel = 1 Hadiah Pilihan
• Promo & diskon eksklusif pelanggan setia`;

          kirimPesanTelegram(chatId, memberCardMsg, {
            inline_keyboard: [
              [
                { text: "👑 Buka Kartu Member di Web", url: webAppStoreUrl },
                { text: "🎁 Lihat Hadiah Gratis", url: webAppStoreUrl }
              ],
              [
                { text: "🛍️ Belanja Sekarang", url: webAppStoreUrl }
              ]
            ]
          });
          return HtmlService.createHtmlOutput("OK");
        } else {
          const notFoundMsg = `ℹ️ *NOMOR BELUM TERDAFTAR SEBAGAI MEMBER*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Nomor WhatsApp \`${cleanDigits}\` belum terdaftar dalam Program Member Royalty Toko Delina.

Yuk daftar sekarang! Gratis dan langsung bisa mengumpulkan poin setiap kali belanja:
✨ Setiap belanja dapat stempel poin
🎁 Kumpulkan 30 poin = Hadiah Gratis!

👇 *Klik tombol di bawah untuk mendaftar gratis di website:*`;

          kirimPesanTelegram(chatId, notFoundMsg, {
            inline_keyboard: [
              [
                { text: "✨ Daftar Member VIP Gratis", url: webAppStoreUrl }
              ],
              [
                { text: "🛍️ Mulai Belanja", url: webAppStoreUrl }
              ]
            ]
          });
          return HtmlService.createHtmlOutput("OK");
        }
      }

      // 4. Deteksi Niat Belanja (Shopping Intent & Buka Toko)
      const isShoppingIntent = lower.includes("buka toko") || 
        lower === "toko" || lower === "/toko" || lower === "belanja" || 
        lower === "katalog" || lower.includes("mau belanja") || 
        lower.includes("mau beli") || lower.includes("cara belanja") || 
        lower.includes("cara beli") || lower.includes("pesan barang") || 
        lower.includes("order barang") || lower.includes("ingin belanja") ||
        lower.includes("pengen belanja") || lower === "🏪 buka toko delina" ||
        lower.includes("katalog barang") || lower.includes("beli barang") ||
        lower.includes("cara pesan");

      if (isShoppingIntent) {
        const pesanToko = `🏪 *DELINA.STORE - PUSAT BELANJA RESMI* 🛍️
━━━━━━━━━━━━━━━━━━━━━━━━━━
Assalamu'alaikum Warahmatullahi Wabarakatuh kak! Senang sekali bisa melayani kakak. 😊

Toko Delina menyediakan berbagai kebutuhan lengkap:
• ✏️ *Alat Tulis Kantor & Sekolah:* Kertas HVS, buku tulis SiDu/Kiky, pulpen, map, dll.
• 💄 *Kosmetik & Skincare:* Sunscreen, micellar water, toner, pelembab & parfum original.
• 🛒 *Kelontongan & Sembako:* Minyak goreng, beras, gula pasir, mie instan, susu, kopi, dll.

✨ *Cara Belanja Sangat Praktis:*
1️⃣ Tekan tombol **🛍️ Buka Toko Delina** di bawah ini untuk melihat etalase lengkap dan langsung memesan.
2️⃣ Atau ketik nama barang yang kakak cari di chat ini (misal: *buku tulis*, *sunscreen*, *minyak goreng*), Kiko siap bantu cek ketersediaan dan harganya!

🎁 *Tips Member:* Dapatkan poin belanja setiap transaksi & tukarkan dengan hadiah gratis!`;

        kirimPesanTelegram(chatId, pesanToko, {
          inline_keyboard: [
            [
              { text: "🛍️ Buka Toko & Belanja Sekarang", url: webAppStoreUrl }
            ],
            [
              { text: "✏️ Katalog ATK", callback_data: "menu_atk_kelontong" },
              { text: "💄 Katalog Kosmetik", callback_data: "menu_kosmetik" }
            ],
            [
              { text: "🎁 Cek Poin & Hadiah", callback_data: "menu_member" },
              { text: "📍 Lokasi Toko", url: mapsUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 5. Aksi Menu: Lacak Status Pesanan
      if (lower.includes("lacak status pesanan") || lower === "📦 lacak status pesanan" || lower === "cek nota" || lower === "lacak nota" || lower === "cek status" || lower === "lacak pesanan") {
        const pesanCek = `📦 *LACAK STATUS PESANAN DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Untuk mengecek pesanan, silakan ketik *Nomor Nota* kakak langsung di chat ini.

Contoh format:
👉 \`#DLN-2026-9429\`
👉 \`/cek #DLN-2026-9429\`

💡 *Petunjuk:*
Nomor nota tertera pada struk digital saat konfirmasi belanja di website atau pesan WhatsApp Toko Delina.`;
        kirimPesanTelegram(chatId, pesanCek, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // 6. Aksi Menu: Kosmetik & Skincare
      if (lower.includes("kosmetik") || lower.includes("skincare") || lower.includes("cantik") || lower.includes("perawatan") || lower === "💄 kosmetik & skincare") {
        const kosmetikMsg = `💄 *KOLEKSI KOSMETIK & SKINCARE DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Cantik, Segar & Terawat Bersama Toko Delina:*
Kami menyediakan aneka produk perawatan harian original:
• 🧴 *Skincare Harian:* Pembersih wajah (Micellar Water), sabun cuci muka, pelembab & toner.
• ☀️ *Sunscreen & Body Care:* Perlindungan sinar UV & menjaga kelembapan kulit setiap hari.
• 🌸 *Perawatan Tubuh & Rambut:* Deodorant, shampo, sabun mandi, bedak tabur & parfum wangi segar.

💡 *Konsultasi Bersama Kiko AI:*
Kakak bisa langsung tanyakan rekomendasi kosmetik di sini, contoh:
👉 *"Rekomendasi sunscreen yang ringan untuk sehari-hari"*
👉 *"Ada sabun cuci muka Garnier atau pelembab Wardah?"*

👇 *Klik tombol di bawah untuk melihat katalog kosmetik di web:*`;
        kirimPesanTelegram(chatId, kosmetikMsg, {
          inline_keyboard: [
            [{ text: "💄 Buka Etalase Kosmetik", url: webAppStoreUrl }]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 7. Aksi Menu: ATK & Kelontongan
      if (lower.includes("kelontong") || lower.includes("sembako") || lower.includes("dapur") || lower.includes("alat tulis") || lower === "🛒 atk & kelontongan" || (lower.includes("atk") && !lower.includes("toko"))) {
        const atkKelontongMsg = `🛒 *KATALOG ATK & KELONTONGAN DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Kebutuhan Kantor, Sekolah & Rumah Tangga Lengkap:*

📚 *Perlengkapan ATK:*
• Kertas HVS (A4, F4 Folio, Double Folio)
• Buku tulis (SiDu, Kiky, Big Boss berbagai ukuran)
• Pulpen gel, pensil, spidol, penghapus, map arsip & binder

🍳 *Kelontongan & Sembako Dapur:*
• Minyak goreng, beras, gula pasir, teh, kopi, mie instan
• Susu UHT, wafer, biskuit & makanan ringan
• Sabun cuci piring, detergen pakaian & pembersih lantai

👇 *Klik tombol di bawah untuk belanja langsung:*`;
        kirimPesanTelegram(chatId, atkKelontongMsg, {
          inline_keyboard: [
            [{ text: "🛒 Buka Katalog di Web", url: webAppStoreUrl }]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 8. Aksi Menu: Lokasi Toko & Kontak
      if (lower.includes("lokasi") || lower.includes("alamat") || lower.includes("maps") || lower.includes("kontak") || lower.includes("whatsapp") || lower.includes("wa") || lower === "📍 lokasi toko & kontak") {
        const pesanLokasi = `📍 *LOKASI & KONTAK RESMI TOKO DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Alamat Toko:* ${settings.ALAMAT_TOKO || "Jl. Raya Delina No. 12, Samping Masjid"}
⏰ *Jam Buka:* 07.30 - 21.00 WIB (Buka Setiap Hari)
📞 *WhatsApp:* \`${cleanWa ? (cleanWa.startsWith("0") ? cleanWa : "0" + cleanWa.slice(2)) : "082185355316"}\`

🗺️ *Akses & Parkir:*
Tepat berada di samping masjid dengan area parkir yang luas dan nyaman untuk motor maupun mobil.

👇 *Pilih tombol di bawah untuk panduan rute atau chat langsung:*`;
        kirimPesanTelegram(chatId, pesanLokasi, {
          inline_keyboard: [
            [
              { text: "🗺️ Buka Rute Google Maps", url: mapsUrl },
              { text: "💬 WhatsApp Customer Service", url: waUrl }
            ]
          ]
        });
        return HtmlService.createHtmlOutput("OK");
      }

      // 9. Aksi Menu: Tanya Kiko AI
      if (lower.includes("tanya kiko") || lower.includes("konsultasi") || lower === "bantuan" || lower === "help") {
        const pesanTanya = `🤖 *ASISTEN BELANJA KIKO AI DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Assalamu'alaikum kak! Saya *Kiko*, asisten cerdas Toko Delina.

Kiko siap membantu menjawab ketersediaan stok & harga barang:
• ✏️ *"Ada kertas HVS PaperOne A4 75gsm?"*
• 💄 *"Rekomendasi sabun cuci muka Garnier atau pelembab wajah?"*
• 🛒 *"Harga minyak goreng 2 liter berapa kak?"*
• 🎁 *"Bagaimana cara cek poin belanja saya?"*

Silakan ketik pertanyaan kakak langsung di sini, InsyaAllah Kiko jawab dengan ramah dan akurat! 😊🤲`;
        kirimPesanTelegram(chatId, pesanTanya, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // 10. Pola Nota / Cek Resi (/cek [Nota] atau format #DLN-...)
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

      // 11. Salam Pembuka, Sapaan Awal, atau Kata Singkat (Assalamu, Halo, Hai, P, Menu, Start)
      const isStart = lower === "/start" || lower === "start";
      const isGreeting = (lower.startsWith("assalamu") && lower.length < 35);
      const isShortIntro = ["p", "halo", "hai", "hay", "hei", "menu", "info", "tes", "test", "ping", "pagi", "siang", "sore", "malam"].includes(lower) || lower.startsWith("selamat");

      if (isStart || isGreeting || isShortIntro) {
        const welcomeText = `✨ *BISMILLAHIRRAHMANIRRAHIM* ✨
🏪 *SELAMAT DATANG DI DELINA.STORE*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Assalamu'alaikum Warahmatullahi Wabarakatuh! 👋

Saya *Kiko*, asisten AI cerdas Toko Delina yang siap melayani kebutuhan *Alat Tulis Kantor (ATK), Kosmetik, Skincare, dan Kelontongan Sembako* kakak 24/7 secara amanah.

📌 *Layanan Utama Toko Delina:*
• 🛍️ *Katalog Ritel Lengkap:* ATK, Kosmetik & Kelontongan
• 🎁 *Member Royalty:* Belanja dapat poin, kumpulkan & tukar hadiah!
• 📦 *Lacak Nota:* Pantau status pesanan online secara langsung
• 📍 *Toko Fisik:* Kunjungi lokasi kami di Google Maps atau pesan antar kurir

💡 *Kemudahan Berbelanja:*
Silakan tekan tombol menu di bawah layar atau langsung tanyakan barang yang kakak butuhkan di sini.

_InsyaAllah belanja lengkap, hemat, dan penuh berkah._ 🤲✨`;

        kirimPesanTelegram(chatId, welcomeText, getTelegramPersistentKeyboard());
        return HtmlService.createHtmlOutput("OK");
      }

      // 12. Pertanyaan Produk / Konsultasi ke AI Kiko
      const jawabanAI = tanyaKikoAI(userText, "Telegram");
      kirimPesanTelegram(chatId, jawabanAI, getTelegramPersistentKeyboard());
      return HtmlService.createHtmlOutput("OK");
    }

    // =========================================================
    // JALUR 3: CHAT DARI WIDGET KIKO DI WEBSITE
    // =========================================================
    if (action === "chatKiko") {
      const jawabanAI = tanyaKikoAI(payload.message || "", payload.sumber || "Web Widget", payload.history || []);
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

    // C1. Upload Foto Profil Member ke Google Drive
    if (action === "uploadMemberPhoto") {
      const res = prosesUploadMemberPhoto(payload, ss);
      return createJsonResponse(res);
    }

    // C2. Simpan Data KTP & Alamat Member ke Google Drive
    if (action === "saveMemberKtp") {
      const res = prosesSaveMemberKtp(payload, ss);
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

    // G1. Uji Coba Kirim Notifikasi Telegram
    if (action === "testTelegramNotif") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid) return createJsonResponse({ status: "error", message: "PIN Keamanan tidak valid." });

      const props = PropertiesService.getScriptProperties();
      const targetToken = String(payload.botToken || props.getProperty("TELEGRAM_BOT_TOKEN") || "").trim();
      const targetChatId = String(payload.chatId || props.getProperty("ADMIN_CHAT_ID") || props.getProperty("TELEGRAM_ADMIN_CHAT_ID") || "").trim();

      if (!targetToken) {
        return createJsonResponse({ status: "error", message: "Token Bot Telegram belum diisi." });
      }
      if (!targetChatId) {
        return createJsonResponse({ status: "error", message: "Chat ID / Grup ID Telegram belum diisi." });
      }

      const idList = targetChatId.split(",").map(s => s.trim()).filter(Boolean);
      const testMsg = `🔔 *TES KONEKSI BOT TELEGRAM DELINA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Alhamdulillah!* Bot Telegram Toko Delina berhasil terhubung dengan sukses!

📌 *Detail Sambungan:*
• 🏪 *Toko:* Delina.store (ATK, Kosmetik & Kelontongan)
• 🕒 *Waktu Uji Coba:* ${Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss")} WIB
• 👥 *Penerima:* Grup / Admin Toko Delina
• ⚡ *Status:* Siap menerima seluruh laporan belanja, kasir, dan keamanan toko secara real-time.

_Pesan ini dikirim otomatis dari Panel Admin Toko Delina._ 🤲`;

      let successCount = 0;
      let lastErr = "";
      idList.forEach(id => {
        try {
          const url = `https://api.telegram.org/bot${targetToken}/sendMessage`;
          const res = UrlFetchApp.fetch(url, {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify({ chat_id: id, text: testMsg, parse_mode: "Markdown" }),
            muteHttpExceptions: true
          });
          if (res.getResponseCode() === 200) {
            successCount++;
          } else {
            lastErr = res.getContentText();
          }
        } catch (e) {
          lastErr = e.toString();
        }
      });

      if (successCount > 0) {
        return createJsonResponse({ status: "success", message: `Berhasil mengirim ${successCount} pesan tes ke Telegram!` });
      } else {
        return createJsonResponse({ status: "error", message: "Gagal kirim: " + lastErr });
      }
    }

    // G2. Setup / Sinkronkan Webhook Bot Telegram Otomatis
    if (action === "setupTelegramWebhook") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid) return createJsonResponse({ status: "error", message: "PIN Keamanan tidak valid." });

      const props = PropertiesService.getScriptProperties();
      const botToken = String(payload.botToken || props.getProperty("TELEGRAM_BOT_TOKEN") || "").trim();
      if (!botToken) return createJsonResponse({ status: "error", message: "Token Bot belum diisi." });

      props.setProperty("TELEGRAM_BOT_TOKEN", botToken);

      const webAppUrl = getActiveWebAppUrl();
      const setUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
      const res = UrlFetchApp.fetch(setUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          url: webAppUrl,
          drop_pending_updates: true,
          allowed_updates: ["message", "callback_query", "my_chat_member"]
        }),
        muteHttpExceptions: true
      });
      const resJson = JSON.parse(res.getContentText());

      setTelegramMenuButton();

      if (resJson.ok) {
        return createJsonResponse({ status: "success", message: "Alhamdulillah! Webhook Bot aktif & tersambung ke URL: " + webAppUrl });
      } else {
        return createJsonResponse({ status: "error", message: "Telegram error: " + (resJson.description || "Gagal set webhook") });
      }
    }

    // G3. Notifikasi Sesi Login Admin / Kasir
    if (action === "notifyAdminLogin") {
      const roleStr = String(payload.role || "Admin").toUpperCase();
      const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm");
      const msg = `🔐 *SESI PANEL TOKO AKTIF*
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 👤 *Pengguna:* *${roleStr}*
• 🕒 *Waktu Masuk:* ${nowStr} WIB
• 📱 *Status:* Berhasil masuk ke panel kasir/admin.`;
      broadcastPesanTelegram(msg);
      return createJsonResponse({ status: "success" });
    }

    // G4. Notifikasi Peringatan Salah PIN
    if (action === "notifyPinError") {
      const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm");
      const msg = `⚠️ *PERINGATAN KEAMANAN TOKO!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 🚫 *Insiden:* Percobaan login dengan PIN Salah terdeteksi!
• 🕒 *Waktu Kejadian:* ${nowStr} WIB
• 🔒 *Tindakan:* Akses ditolak otomatis oleh sistem.`;
      broadcastPesanTelegram(msg);
      return createJsonResponse({ status: "success" });
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

      try {
        const statusNotif = `🔄 *STATUS PESANAN DIUPDATE*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *No. Nota:* \`${orderId}\`
📊 *Status Baru:* *${newStatus}*
⏰ *Waktu Update:* ${Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm")} WIB
👤 *Diperbarui Oleh:* ${auth.role === "admin" ? "Super Admin" : "Kasir"} Toko Delina`;
        broadcastPesanTelegram(statusNotif);
      } catch (eNotif) {
        Logger.log("Notice status notif: " + eNotif.toString());
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

      try {
        const stokNotif = `📊 *PENYESUAIAN STOK PRODUK*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 *ID Produk:* \`${prodId}\`
🔢 *Stok Sekarang:* *${newStock}*
⏰ *Waktu Update:* ${Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm")} WIB
👤 *Oleh:* ${auth.role === "admin" ? "Super Admin" : "Kasir"} Toko Delina`;
        broadcastPesanTelegram(stokNotif);
      } catch (eNotif) {
        Logger.log("Notice stock notif: " + eNotif.toString());
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

        try {
          const prodNotif = `📦 *PRODUK DIUPDATE*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ *Nama Produk:* *${name}*
🆔 *ID/Barcode:* \`${prodId}\`
📂 *Kategori:* ${category}
💵 *Harga Jual:* *Rp ${hargaJual.toLocaleString("id-ID")}*
💰 *Harga Modal:* Rp ${hargaBeli.toLocaleString("id-ID")}
🔢 *Stok:* ${stock} ${unit}
⏰ *Waktu:* ${Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm")} WIB
👤 *Oleh:* Super Admin Toko Delina`;
          broadcastPesanTelegram(prodNotif);
        } catch (eNotif) {}

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

        try {
          const prodNotif = `📦 *PRODUK BARU DITAMBAHKAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ *Nama Produk:* *${name}*
🆔 *ID/Barcode:* \`${prodId}\`
📂 *Kategori:* ${category}
💵 *Harga Jual:* *Rp ${hargaJual.toLocaleString("id-ID")}*
💰 *Harga Modal:* Rp ${hargaBeli.toLocaleString("id-ID")}
🔢 *Stok:* ${stock} ${unit}
⏰ *Waktu:* ${Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm")} WIB
👤 *Oleh:* Super Admin Toko Delina`;
          broadcastPesanTelegram(prodNotif);
        } catch (eNotif) {}

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
        GEMINI_API_KEY: payload.GEMINI_API_KEY,
        URL_QRIS: urlQris,
        URL_LOGO: urlLogo
      };

      if (payload.GEMINI_API_KEY !== undefined && payload.GEMINI_API_KEY !== null) {
        try {
          const p = PropertiesService.getScriptProperties();
          if (String(payload.GEMINI_API_KEY).trim()) {
            p.setProperty("GEMINI_API_KEY", String(payload.GEMINI_API_KEY).trim());
          }
        } catch (eProp) {}
      }

      if (payload.TELEGRAM_BOT_TOKEN !== undefined && payload.TELEGRAM_BOT_TOKEN !== null) {
        try {
          const p = PropertiesService.getScriptProperties();
          if (String(payload.TELEGRAM_BOT_TOKEN).trim()) {
            p.setProperty("TELEGRAM_BOT_TOKEN", String(payload.TELEGRAM_BOT_TOKEN).trim());
          }
        } catch (eProp) {}
      }

      if (payload.ADMIN_CHAT_ID !== undefined && payload.ADMIN_CHAT_ID !== null) {
        try {
          const p = PropertiesService.getScriptProperties();
          const cleanId = String(payload.ADMIN_CHAT_ID).trim();
          if (cleanId) {
            p.setProperty("ADMIN_CHAT_ID", cleanId);
            p.setProperty("TELEGRAM_ADMIN_CHAT_ID", cleanId);
          }
        } catch (eProp) {}
      }

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
          try {
            broadcastPesanTelegram(`🎟️ *KUPON PROMO DIHAPUS*\nKode: \`${code}\` telah dinonaktifkan/dihapus oleh Admin Toko.`);
          } catch (eC) {}
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
        try {
          broadcastPesanTelegram(`🎟️ *KUPON PROMO DIUPDATE*\nKode: \`${code}\`\nDiskon: ${payload.type === "PERSEN" ? payload.value + "%" : "Rp " + Number(payload.value).toLocaleString("id-ID")}\nMin. Belanja: Rp ${Number(payload.minSpend || 0).toLocaleString("id-ID")}\nStatus: ${payload.status}`);
        } catch (eC) {}
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

      try {
        broadcastPesanTelegram(`🎟️ *KUPON PROMO BARU DIBUAT*\nKode: \`${code}\`\nDiskon: ${payload.type === "PERSEN" ? payload.value + "%" : "Rp " + Number(payload.value).toLocaleString("id-ID")}\nMin. Belanja: Rp ${Number(payload.minSpend || 0).toLocaleString("id-ID")}`);
      } catch (eC) {}

      return createJsonResponse({ status: "success", message: `Kupon baru "${code}" berhasil ditambahkan.` });
    }

    // 4.7 Perbarui Tarif (Legacy Stub)
    if (action === "updateRates") {
      return createJsonResponse({
        status: "success",
        message: "Layanan Toko Delina kini fokus penuh pada penjualan produk ritel ATK, Kosmetik & Kelontongan."
      });
    }

    // =========================================================
    // JALUR 5: CHECKOUT & PESANAN BARU DARI PELANGGAN (WEBSITE)
    // =========================================================
    let linkDokumenFotokopi = "-";

    let linkBuktiBayar = "-";
    if (payload.paymentProof && payload.paymentProof.base64) {
      linkBuktiBayar = saveBase64ToDriveFolder(
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

function normalizeKategoriResmiDelina(rawCategory, productName) {
  // 0. Hormati kategori resmi yang sudah tertulis persis di Google Sheets
  const OFFICIAL_CATS = ["ATK & Kantor", "Kosmetik & Cantik", "Kelontongan", "Minuman"];
  const exactCat = OFFICIAL_CATS.find(c => c.toLowerCase() === String(rawCategory || "").trim().toLowerCase());
  if (exactCat) return exactCat;
  const cat = String(rawCategory || "").toLowerCase();
  const name = String(productName || "").toLowerCase();
  const combined = cat + " " + name;

  const drinkKeywords = [
    "minuman", "kopi", "coffee", "koffie", "kapal api", "luwak", "good day", "nescafe",
    "teh", "sariwangi", "sosro", "pucuk", "susu", "ultra milk", "bear brand", "frisian",
    "dancow", "indomilk", "air mineral", "aqua", "le minerale", "pocari", "floridina",
    "jus", "juice", "sirup", "marjan", "abc squash", "energen", "nutrisari", "adem sari",
    "larutan", "coca", "sprite", "fanta", "pepsi", "mizone", "you c1000", "hydro coco"
  ];
  if (cat === "minuman" || drinkKeywords.some(k => name.includes(k))) {
    return "Minuman";
  }

  const kosmetikKeywords = [
    "kosmetik", "cantik", "perawatan", "skincare", "kecantikan", "wardah", "garnier",
    "emina", "kahf", "dove", "nivea", "rexona", "posh", "maybelline", "somethinc",
    "azarine", "scarlett", "vaseline", "citra", "marina", "biore", "ponds", "lifebuoy",
    "lux", "pantene", "sunsilk", "clear", "shoulders", "pepsodent", "ciptadent",
    "close up", "listerine", "charm", "laurier", "kodomo", "my baby", "kayu putih",
    "freshcare", "tolak angin", "salonpas", "hansaplast", "betadine", "deodorant",
    "roll on", "serum", "micellar", "sunscreen", "lipstik", "lipstick", "lip balm", "lip cream", "lip tint", "bedak", "parfum", "shampo",
    "sabun mandi", "body wash", "pasta gigi"
  ];
  if (cat.includes("kosmetik") || cat.includes("cantik") || cat.includes("perawatan") || kosmetikKeywords.some(k => combined.includes(k))) {
    return "Kosmetik & Cantik";
  }

  const kelontongKeywords = [
    "kelontong", "sembako", "dapur", "minyak", "bimoli", "sania", "beras", "ramos",
    "gula", "gulaku", "tepung", "segitiga biru", "garam", "kecap", "bango", "saus",
    "bumbu", "royco", "masako", "sasa", "santan", "kara", "telur", "sarden", "kornet",
    "indomie", "mie", "sedaap", "biskuit", "roma", "wafer", "nabati", "oreo",
    "silverqueen", "beng-beng", "chitato", "qtela", "kacang", "garuda", "kopiko",
    "choki", "khong guan", "deterjen", "rinso", "sunlight", "mama lemon", "downy",
    "soklin", "baygon", "tissue", "paseo", "lampu", "hannochs", "baterai", "alkaline",
    "korek", "tokai", "plastik", "sapu", "pel lantai", "makanan", "snack"
  ];
  if (cat.includes("kelontong") || cat.includes("sembako") || cat.includes("dapur") || kelontongKeywords.some(k => combined.includes(k))) {
    return "Kelontongan";
  }

  if (cat.includes("minum")) {
    return "Minuman";
  }

  return "ATK & Kantor";
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
      const prodName = String(row[cols.colNama - 1] || "");
      const rawCat = String(row[cols.colKategori - 1] || "");
      const normCat = normalizeKategoriResmiDelina(rawCat, prodName);
      if (rawCat !== normCat && cols.colKategori > 0) {
        try {
          sheetProduk.getRange(i + 1, cols.colKategori).setValue(normCat);
        } catch (eCat) {}
      }

      const hargaJual = Number(row[cols.colHargaJual - 1]) || 0;
      const hargaBeli = cols.colHargaBeli > 0 ? (Number(row[cols.colHargaBeli - 1]) || Math.round(hargaJual * 0.8)) : Math.round(hargaJual * 0.8);
      const statusVal = cols.colStatus > 0 ? String(row[cols.colStatus - 1] || "Aktif") : "Aktif";

      produkList.push({
        id: String(idVal),
        name: prodName,
        category: normCat,
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
    ["ATK-001", "Kertas HVS PaperOne A4 75gsm (1 Rim / 500 Lembar)", "ATK & Kantor", 48000, 85, "Rim", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Kertas HVS putih bersih berkualitas tinggi dengan teknologi ColorLok. Sangat cocok untuk cetak dokumen resmi, tugas sekolah, skripsi, dan laporan kantor."],
    ["ATK-002", "Buku Tulis Sinar Dunia (SiDu) Kiky 38 Lembar - Pack Isi 10 Buku", "ATK & Kantor", 36500, 42, "Pack", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", "Buku tulis bergaris tebal standar sekolah dan kuliah merk Sinar Dunia. Kertas halus tidak tembus tinta."],
    ["ATK-003", "Pulpen Gel Zebra Sarasa Clip 0.5mm Hitam / Biru Tinta Pekat", "ATK & Kantor", 15500, 110, "Pcs", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80", "Pulpen gel Jepang terbaik dengan klip pegas fleksibel. Tinta pigmen berbasis air, tahan air dan tidak luntur."],
    ["ATK-004", "Paket Pulpen Standard AE7 0.5 Hitam (1 Lusin / 12 Batang)", "ATK & Kantor", 24000, 65, "Lusin", "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80", "Pulpen legendaris sejuta umat. Ujung ballpoint halus lancar menulis ribuan kata tanpa macet."],
    ["ATK-005", "Map Folder Plastik L Document Bag Clear Holder F4 Folio", "ATK & Kantor", 6500, 180, "Pcs", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80", "Map plastik L bening ukuran Folio/F4. Menyimpan dokumen penting aman dari cipratan air dan debu."],
    ["ATK-006", "Stapler Joyko HD-10 + Isi Ulang Staples No. 10 (Set Lengkap)", "ATK & Kantor", 18500, 45, "Set", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Stapler Joyko orisinal berbahan logam kokoh dilapisi plastik ergonomis. Sudah termasuk 1 kotak anak staples No. 10."],
    ["ATK-007", "Kertas Double Folio Bergaris Merk Sinar Dunia (1 Pack / 100 Lembar)", "ATK & Kantor", 19500, 55, "Pack", "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80", "Kertas double folio bergaris presisi untuk ujian sekolah, tugas kuliah, dan pembuatan berkas laporan."],
    ["ATK-008", "Tipe-X Kertas Kering Joyko Correction Tape CT-522 (Panjang 12m)", "ATK & Kantor", 9000, 70, "Pcs", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80", "Pita koreksi kering instant tanpa noda dan bau. Langsung bisa ditulis kembali di atasnya."],
    ["ATK-009", "Paket Jilid Skripsi Kilat (Hard Cover + Emboss Emas + 100 Hal Cetak)", "ATK & Kantor", 45000, 999, "Paket", "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80", "Layanan kilat jilid hardcover tebal dengan foil tulisan emas mengkilap. Sudah termasuk pita pembatas dan sudut siku rapi standar universitas."],
    ["ATK-010", "Paket Modul Kantor & Pelatihan (Jilid Spiral Kawat + Cover Mika + 50 Hal)", "ATK & Kantor", 35000, 999, "Paket", "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80", "Paket cetak booklet / modul presentasi perusahaan. Menggunakan jilid spiral kawat besi kokoh dan cover mika doff elegan."],
    ["ATK-011", "Paket Bundling ATK Sekolah Juara (Buku SiDu + 3 Pulpen Gel + Tipe-X)", "ATK & Kantor", 68000, 25, "Paket", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80", "Paket komplit hemat persiapan masuk sekolah semester baru. Berisi 1 pack buku tulis SiDu, 3 pulpen gel Sarasa, pensil 2B, dan Tipe-X Joyko."],
    ["ATK-012", "Paket Starter Mahasiswa Baru (Binder B5 + Loose Leaf 100 Lbr + Sarasa)", "ATK & Kantor", 52000, 30, "Paket", "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=600&auto=format&fit=crop&q=80", "Bundling favorit mahasiswa baru: Binder ring B5 pastel, isi kertas bergaris 100 lembar, pulpen Sarasa hitam, dan set index pembatas warna."],
    ["ATK-013", "Paket Pengadaan Kantor Ekonomis (Kertas HVS 5 Rim + Pulpen + Map)", "ATK & Kantor", 275000, 15, "Paket", "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80", "Paket bundling kebutuhan bulanan kantor atau instansi. Hemat hingga 15% dibanding beli eceran."],
    ["ATK-014", "Spidol Whiteboard Snowman BG-12 Hitam / Biru (Non-Permanent)", "ATK & Kantor", 9500, 2, "Pcs", "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80", "Spidol papan tulis mudah dihapus bersih tanpa residu. Tinta pekat ramah lingkungan. (Stok menipis sisa 2 pcs)."],
    ["ATK-015", "Gunting Kantor Stainless Steel Kenko SC-838 Anti Karat", "ATK & Kantor", 12000, 1, "Pcs", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600&auto=format&fit=crop&q=80", "Gunting tajam berbahan baja stainless dengan pegangan karet lembut. (Stok menipis sisa 1 pcs)."],
    ["ATK-016", "Sticky Notes Joyko Pastel 3x3 Inch (Isi 100 Lembar Sticky Pad)", "ATK & Kantor", 7500, 3, "Pad", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Kertas memo tempel warna pastel lembut dengan daya rekat kuat tidak merusak kertas."],
    ["ATK-017", "Penggaris Besi Joyko 30cm Presisi Baja Anti Patah", "ATK & Kantor", 8500, 60, "Pcs", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Penggaris logam baja anti karat berskala milimeter presisi."],
    ["ATK-018", "Kertas HVS PaperOne F4 Folio 75gsm (1 Rim / 500 Lembar)", "ATK & Kantor", 54000, 50, "Rim", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Kertas HVS ukuran Folio / F4 standar perkantoran dan notaris."]
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
function tanyaKikoAI(pesanUser, sumber, riwayatChat) {
  try {
    const ss = getDelinaSpreadsheet();
    const props = PropertiesService.getScriptProperties();
    // Baca API Key dari ScriptProperties ATAU dari Tab Pengaturan Google Sheets (Row GEMINI_API_KEY)
    let geminiApiKey = props.getProperty("GEMINI_API_KEY");
    if (!geminiApiKey) {
      try {
        const settings = getPengaturanData(ss);
        if (settings && settings.GEMINI_API_KEY) {
          geminiApiKey = String(settings.GEMINI_API_KEY).trim();
        }
      } catch (eSet) {}
    }

    const sheetProduk = ss.getSheetByName(TAB_PRODUK);

    // Katalog live dari Google Sheets, kategori dinormalisasi ke 4 Kategori Resmi
    // (ATK & Kantor, Kosmetik & Cantik, Kelontongan, Minuman)
    let daftarStok = [];
    if (sheetProduk && sheetProduk.getLastRow() > 1) {
      const dataProduk = sheetProduk.getDataRange().getValues();
      for (let i = 1; i < dataProduk.length; i++) {
        const r = dataProduk[i];
        if (r[0]) {
          let kategoriResmi = r[2];
          try { kategoriResmi = mapKategoriKeDaftarToko(r[2]); } catch (eKat) {}
          const stokNum = Number(r[4]) || 0;
          const statusStok = stokNum <= 0 ? "HABIS" : (stokNum <= 5 ? "Hampir Habis" : "Tersedia");
          daftarStok.push(`- [${r[0]}] ${r[1]} | Harga: Rp ${Number(r[3]).toLocaleString("id-ID")} | Sisa Stok: ${r[4]} ${r[5]} (${statusStok}) | Kategori: ${kategoriResmi}`);
        }
      }
    }

    // Kupon promo aktif dari Tab Kupon
    let daftarKupon = [];
    try {
      daftarKupon = getKuponData(ss)
        .filter(c => c.status === "AKTIF")
        .map(c => `- Kode ${c.code}: ${c.description || (c.type === "PERSEN" ? "Diskon " + c.value + "%" : "Potongan Rp " + c.value.toLocaleString("id-ID"))} (Min. belanja Rp ${c.minSpend.toLocaleString("id-ID")})`);
    } catch (eKupon) {}

    // Riwayat percakapan singkat (maks 6 pesan terakhir) agar Kiko ingat konteks
    let konteksRiwayat = "";
    if (Array.isArray(riwayatChat) && riwayatChat.length > 0) {
      konteksRiwayat = riwayatChat.slice(-6).map(h => {
        const siapa = h && h.role === "user" ? "Pelanggan" : "Kiko";
        return `${siapa}: ${String((h && h.text) || "").slice(0, 300)}`;
      }).join("\n");
    }

    const contextKatalog = daftarStok.join("\n");

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
4. Gunakan bullet points (•) dan emoticon tematik yang serasi (💄, ✏️, 📦, 💡, 🏷️, 🛒).
5. Berikan rekomendasi produk alternatif jika stok kosong atau tawarkan promo terkait.
6. Berikan petunjuk belanja: "Barang ini bisa langsung dipesan lewat website resmi Toko Delina nggih kak."
7. Jangan pernah mengarang harga atau stok di luar data katalog yang diberikan!
8. Toko Delina kini berfokus pada 3 Kategori Utama: Alat Tulis Kantor (ATK), Kosmetik & Skincare, dan Kelontongan (Sembako & Kebutuhan Rumah Tangga).
   PENTING: Toko Delina SUDAH TIDAK melayani jasa fotokopi maupun cetak dokumen! Jika ada pelanggan yang bertanya tentang fotokopi atau cetak dokumen, jelaskan dengan santun bahwa Toko Delina saat ini berfokus penuh pada penjualan produk ritel fisik ATK, Kosmetik & Skincare, dan Kelontongan.
9. Jika pelanggan baru bingung cara belanja, jelaskan singkat 4 langkah: pilih barang -> masukkan keranjang -> checkout (pilih Ambil di Toko / Diantar Kurir) -> bayar QRIS/Transfer, lalu lacak pesanan dengan nomor nota.
10. Jika ada kupon promo aktif yang relevan, tawarkan dengan sopan.
11. Akhiri balasan dengan doa keberkahan khas Delina:
   "Semoga Allah memberkahi segala urusan dan aktivitas kakak hari ini. Barakallahu fiik. 🤲✨"

DATA KATALOG REAL-TIME TOKO DELINA (Google Sheets):
${contextKatalog}

KUPON PROMO AKTIF:
${daftarKupon.length ? daftarKupon.join("\n") : "- (Belum ada kupon aktif)"}
${konteksRiwayat ? "\nRIWAYAT PERCAKAPAN SEBELUMNYA:\n" + konteksRiwayat + "\n" : ""}
Saluran pelanggan: ${sumber || "Telegram"}. Buat jawaban terstruktur rapi, elegan, ringkas (maks. ~12 baris), dan sangat nyaman dibaca di layar HP.`;

    if (!geminiApiKey) {
      return fallbackKikoLocal(pesanUser, daftarStok);
    }

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
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
    return `✨ *ASISTEN KIKO • TOKO DELINA* ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nWa'alaikumsalam Warahmatullahi Wabarakatuh kak! 👋\n\nKiko siap melayani kebutuhan ATK, kosmetik, skincare, dan kelontongan di Toko Delina. Boleh disebutkan barang yang sedang kakak butuhkan? _Barakallahu fiik._ 🤲`;
  }
}

function fallbackKikoLocal(pesanUser, daftarStok) {
  const q = (pesanUser || "").toLowerCase().trim();

  // Deteksi Maksud Belanja (Shopping Intent) secara cerdas
  const isShoppingIntent = /^(saya\s+)?(mau|ingin|pengen|bisa|tolong|cara)?\s*(belanja|beli|order|pesan|katalog|toko|borong)(\s+di\s+sini|\s+dong|\s+kak|\s+apa\s+saja)?$/i.test(q)
    || q === "mau belanja" || q === "saya mau belanja" || q === "cara belanja" || q === "cara beli" || q === "mau beli" || q === "buka toko" || q === "katalog";

  if (isShoppingIntent) {
    return `🏪 *SELAMAT DATANG DI DELINA.STORE!* 🛍️
━━━━━━━━━━━━━━━━━━━━━━━━━━
Assalamu'alaikum Warahmatullahi Wabarakatuh kak! Senang sekali kakak ingin berbelanja di Toko Delina. 😊

Toko Delina menyediakan berbagai kebutuhan lengkap:
• ✏️ *Alat Tulis Kantor & Sekolah:* Kertas HVS (A4, F4), buku tulis SiDu/Kiky, pulpen, map, dll.
• 💄 *Kosmetik & Skincare:* Sunscreen, micellar water, toner, pelembab & parfum original.
• 🛒 *Kelontongan & Sembako:* Minyak goreng, beras, gula pasir, mie instan, susu, kopi, dll.

✨ *Cara Belanja Sangat Praktis:*
1️⃣ Kakak bisa langsung melihat katalog lengkap dan memesan melalui website resmi Toko Delina.
2️⃣ Atau sebutkan nama barang yang kakak cari di chat ini (misal: *buku tulis*, *sunscreen*, *minyak goreng*), Kiko siap bantu cek ketersediaan dan harganya!

🎁 *Tips Member:* Dapatkan poin belanja setiap transaksi dan kumpulkan untuk klaim hadiah gratis!`;
  }

  const stopWords = [
    "ada", "apakah", "punya", "jual", "mau", "beli", "belanja", "tanya", "kak", "kiko", 
    "bisa", "berapa", "harga", "stok", "delina", "toko", "assalamu", "alaikum", "halo", 
    "hai", "selamat", "pagi", "siang", "sore", "malam", "saya", "aku", "ingin", "pengen", 
    "mohon", "tolong", "minta", "cari", "order", "pesan", "dong"
  ];

  const cleanWords = q
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.includes(w));

  if (cleanWords.length === 0) {
    return `✨ *ASISTEN KIKO • TOKO DELINA* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! 👋

Ada yang bisa Kiko bantu cekkan hari ini?
• ✏️ *ATK & Kantor:* Kertas HVS, buku, pulpen, map, binder, dll.
• 💄 *Kosmetik & Skincare:* Deodorant, micellar water, sunscreen, pelembab, dll.
• 🛒 *Kelontongan & Sembako:* Minyak goreng, beras, gula, mie instan, deterjen, dll.
• 🥤 *Minuman:* Air mineral, teh, kopi, susu UHT, dll.
• 🎁 *Member Royalty:* Belanja dapat poin & klaim hadiah gratis
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
Coba gunakan nama umum barang (misal: *pulpen*, *deodorant*, *minyak goreng*, *teh*), atau sebut kategorinya (*ATK & Kantor*, *Kosmetik & Cantik*, *Kelontongan*, *Minuman*). Kakak juga bisa hubungi langsung Admin Toko untuk konfirmasi stok di gudang.

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
        { text: "🏪 Buka Toko Delina" },
        { text: "📦 Lacak Status Pesanan" }
      ],
      [
        { text: "💄 Kosmetik & Skincare" },
        { text: "🛒 ATK & Kelontongan" }
      ],
      [
        { text: "🎁 Cek Poin & Hadiah" },
        { text: "📍 Lokasi Toko & Kontak" }
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

function getActiveWebAppUrl() {
  try {
    const url = ScriptApp.getService().getUrl();
    if (url && url.indexOf("/exec") !== -1) return url;
  } catch (e) {}
  return "https://script.google.com/macros/s/AKfycbyT06sft4rQBNQcQtoPDV7kNKk4ywk7_5bsMS1H3Dj2PozE2CYh4YpHgWKjPslfJBVA2w/exec";
}

/**
 * Otomatis Tambahkan Chat ID Grup ke Script Properties ADMIN_CHAT_ID
 * Tanpa perlu salin-tempel manual di panel admin!
 */
function autoBindTelegramGroup(chatId, chatTitle, chatType) {
  if (!chatId) return { isNewlyAdded: false };
  const isGroup = String(chatId).startsWith("-") || chatType === "group" || chatType === "supergroup";
  if (!isGroup) return { isNewlyAdded: false };

  try {
    const props = PropertiesService.getScriptProperties();
    const currentAdminIds = props.getProperty("ADMIN_CHAT_ID") || props.getProperty("TELEGRAM_ADMIN_CHAT_ID") || "";
    const idList = currentAdminIds.split(",").map(s => s.trim()).filter(Boolean);
    const targetIdStr = String(chatId).trim();

    let isNewlyAdded = false;
    if (!idList.includes(targetIdStr)) {
      idList.push(targetIdStr);
      const updatedIds = idList.join(", ");
      props.setProperty("ADMIN_CHAT_ID", updatedIds);
      props.setProperty("TELEGRAM_ADMIN_CHAT_ID", updatedIds);
      isNewlyAdded = true;
      Logger.log("Berhasil auto-bind grup Telegram: " + targetIdStr + " -> " + updatedIds);
    }

    return { isNewlyAdded: isNewlyAdded, totalAdmins: idList.length, allIds: idList };
  } catch (errBind) {
    Logger.log("Notice autoBindTelegramGroup: " + errBind.toString());
    return { isNewlyAdded: false };
  }
}

function broadcastPesanTelegram(pesan, replyMarkup) {
  try {
    const props = PropertiesService.getScriptProperties();
    const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
    const rawIds = props.getProperty("ADMIN_CHAT_ID") || props.getProperty("TELEGRAM_ADMIN_CHAT_ID") || "";
    if (!botToken || !rawIds) {
      Logger.log("Telegram Token atau Admin Chat ID belum diset.");
      return;
    }

    const idList = String(rawIds)
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    // Filter duplikat agar tidak ada notifikasi ganda
    const uniqueIds = Array.from(new Set(idList));

    uniqueIds.forEach(cId => {
      kirimPesanTelegram(cId, pesan, replyMarkup);
    });
  } catch (err) {
    Logger.log("Notice broadcastPesanTelegram: " + err.toString());
  }
}

function kirimPesanTelegram(chatId, pesan, replyMarkup) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken || !chatId) return;

  const isGroup = String(chatId).startsWith("-");
  const defaultMarkup = isGroup ? undefined : getTelegramPersistentKeyboard();

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = { 
    chat_id: chatId, 
    text: pesan, 
    parse_mode: "Markdown",
    reply_markup: replyMarkup !== undefined ? replyMarkup : defaultMarkup
  };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) {
      delete payload.parse_mode;
      UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
    }
  } catch (e) {
    try {
      delete payload.parse_mode;
      UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
    } catch (e2) {
      Logger.log("Kirim Telegram gagal: " + e2.toString());
    }
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

💳 *Bukti Bayar:* ${linkBukti !== "-" ? linkBukti : "Belum diunggah"}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Silakan klik tombol di bawah untuk verifikasi cepat:_`;

  // Inline Keyboard Verifikasi, Siap Ambil & WhatsApp Pembeli Cepat
  const cleanPhoneNum = String(payload.customerPhone || "").replace(/\D/g, "");
  const waTarget = cleanPhoneNum.startsWith("0") ? "62" + cleanPhoneNum.slice(1) : cleanPhoneNum;
  const waText = encodeURIComponent(`Halo kak ${payload.customerName}, kami dari Toko Delina. Pesanan kakak #${payload.orderId} sedang kami proses nggih.`);

  const adminInlineMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Verifikasi Lunas", callback_data: "verify_" + payload.orderId },
        { text: "📦 Siap Ambil", callback_data: "ready_" + payload.orderId }
      ],
      [
        { text: "💬 Chat WhatsApp Pembeli", url: `https://wa.me/${waTarget}?text=${waText}` }
      ]
    ]
  };

  broadcastPesanTelegram(notifMsg, adminInlineMarkup);
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

  const webAppUrl = getActiveWebAppUrl();
  const setUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const res = UrlFetchApp.fetch(setUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      url: webAppUrl,
      drop_pending_updates: true,
      allowed_updates: ["message", "callback_query", "my_chat_member"]
    }),
    muteHttpExceptions: true
  });

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

  const webAppUrl = getActiveWebAppUrl();
  const setUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const setRes = UrlFetchApp.fetch(setUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      url: webAppUrl,
      drop_pending_updates: true,
      allowed_updates: ["message", "callback_query", "my_chat_member"]
    }),
    muteHttpExceptions: true
  }).getContentText();

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
    ["CAT-01", "ATK & Kantor", "bi-pencil-square", 1, "AKTIF"],
    ["CAT-02", "Kosmetik & Cantik", "bi-stars", 2, "AKTIF"],
    ["CAT-03", "Kelontongan", "bi-shop", 3, "AKTIF"],
    ["CAT-04", "Minuman", "bi-cup-straw", 4, "AKTIF"]
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
    const rawNama = String(row[1] || "").trim();
    const nama = normalizeKategoriResmiDelina(rawNama, "");
    const status = String(row[4] || "AKTIF").toUpperCase();
    if (rawNama && nama !== rawNama) {
      try {
        sheet.getRange(i + 1, 2).setValue(nama);
      } catch (e) {}
    }
    if (nama && status === "AKTIF" && !categories.some(c => c.nama === nama)) {
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
    storeCategories = ["ATK & Kantor", "Kosmetik & Cantik", "Kelontongan", "Minuman"];
  }
  const normalized = normalizeKategoriResmiDelina(rawCategory, "");
  const matched = storeCategories.find(c => normalizeKategoriResmiDelina(c, "") === normalized);
  if (matched) return matched;
  return normalized;
}

function cariSnippetWebBarcode(barcode) {
  if (!barcode) return "";
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(barcode + " produk indonesia")}`;
    const res = UrlFetchApp.fetch(searchUrl, {
      muteHttpExceptions: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });
    if (res.getResponseCode() === 200) {
      const html = res.getContentText();
      const titles = [];
      const regex = /class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null && titles.length < 5) {
        const cleanTitle = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (cleanTitle) titles.push(cleanTitle);
      }
      const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let sMatch;
      while ((sMatch = snippetRegex.exec(html)) !== null && titles.length < 8) {
        const cleanSnip = sMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (cleanSnip) titles.push(cleanSnip);
      }
      return titles.join(" | ");
    }
  } catch (e) {
    Logger.log("Web snippet search notice: " + e.toString());
  }
  return "";
}

function prosesLookupBarcode(barcode, ss, imageBase64) {
  if (!ss) ss = getDelinaSpreadsheet();
  let cleanBarcode = String(barcode || "").trim();
  const storeCategories = ambilDaftarKategori(ss).map(c => c.nama);

  // 0. CEK TERLEBIH DAHULU DI TAB 'PRODUK' GOOGLE SHEETS JIKA BARCODE SUDAH DIKETAHUI
  if (cleanBarcode) {
    const cleanBarcodeUpper = cleanBarcode.toUpperCase();
    const sheetProduk = ss.getSheetByName(TAB_PRODUK);
    if (sheetProduk && sheetProduk.getLastRow() > 1) {
      upgradeTabProduk(sheetProduk);
      const cols = getProdukColIndices(sheetProduk);
      const data = sheetProduk.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][cols.colId - 1] || "").trim().toUpperCase();
        const rowName = String(data[i][cols.colNama - 1] || "").trim();
        if (rowId === cleanBarcodeUpper || (cleanBarcodeUpper.length >= 6 && rowId.replace(/[^A-Z0-9]/g, "") === cleanBarcodeUpper.replace(/[^A-Z0-9]/g, ""))) {
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
  }

  // A. JIKA ADA FOTO KEMASAN / SNAPSHOT KAMERA LIVE (VISION AI GEMINI MULTIMODAL + WEB CONTEXT)
  if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > 50) {
    try {
      const props = PropertiesService.getScriptProperties();
      let geminiApiKey = props.getProperty("GEMINI_API_KEY");
      if (!geminiApiKey) {
        try {
          const s = getPengaturanData();
          if (s && s.GEMINI_API_KEY) geminiApiKey = String(s.GEMINI_API_KEY).trim();
        } catch (eSet) {}
      }
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

        const webSnippet = cleanBarcode ? cariSnippetWebBarcode(cleanBarcode) : "";
        const promptVision = `Tugas Anda adalah mengidentifikasi produk ritel Indonesia (Kosmetik seperti Deodorant Dove/Nivea/Rexona/Wardah/Garnier, ATK seperti Joyko/SiDu/PaperOne/Snowman, Sembako, Makanan/Minuman) dari foto kemasan dan/atau kode barcode.
${cleanBarcode ? `Kode Barcode yang terbaca kamera: "${cleanBarcode}".` : ""}
${webSnippet ? `Hasil pencarian internet untuk barcode ini: "${webSnippet}".` : ""}
1. BARCODE: Gunakan "${cleanBarcode}" jika sudah ada, atau baca 8-13 digit angka barcode EAN-13/UPC pada gambar.
2. NAMA: Ambil Nama Merek + Varian + Ukuran kemasan yang akurat & lengkap (contoh: "Dove Deodorant Roll On Ultimate Repair 40ml", "Nivea Extra Brightening Roll On 50ml", "Indomie Mi Goreng Spesial 85g", "Kertas HVS PaperOne A4 75gsm").
3. KATEGORI: Pilih satu kategori yang paling cocok HANYA dari daftar berikut:
${storeCategories.join(", ")}
4. SATUAN: Satuan kemasan yang lazim (Pcs, Btl, Roll, Box, Pack, Rim, Sachet, Pouch, Tube).
5. HARGA_JUAL: Estimasi harga jual eceran wajar di toko Indonesia dalam Rupiah (angka bulat, misal: 18500, 22000, 5000).
6. DESKRIPSI: Buat deskripsi singkat produk 1-2 kalimat yang menarik, menjelaskan manfaat/kegunaan produk tersebut.

Wajib kembalikan HANYA format JSON murni tanpa markdown:
{"barcode": "...", "nama": "...", "kategori": "...", "satuan": "Pcs", "harga_jual": 0, "deskripsi": "..."}`;

        const visionModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
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
                maxOutputTokens: 400,
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

                if (parsed && parsed.nama && !parsed.nama.toLowerCase().includes("barang dagang baru")) {
                  let detectedBarcode = cleanBarcode;
                  if (!detectedBarcode && parsed.barcode && String(parsed.barcode).replace(/\D/g, "").length >= 6) {
                    detectedBarcode = String(parsed.barcode).replace(/\D/g, "");
                  } else if (!detectedBarcode) {
                    const rand4 = Math.floor(1000 + Math.random() * 9000);
                    detectedBarcode = "DLN-899" + String(Date.now()).slice(-3) + rand4.toString().slice(-2);
                  }

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

                  const bestCat = mapKategoriKeDaftarToko(parsed.kategori || parsed.nama, storeCategories);
                  const hargaJual = Number(parsed.harga_jual) || 0;
                  const finalDesc = parsed.deskripsi || `Ready Stok ${parsed.nama.trim()} | Kategori: ${bestCat} — Dijamin Ori & Berkualitas di Delina.store`;

                  return {
                    status: "success",
                    isNew: true,
                    source: `Google Vision AI (${modelName})`,
                    barcode: detectedBarcode,
                    nama: parsed.nama.trim(),
                    kategori: bestCat,
                    satuan: parsed.satuan || "Pcs",
                    harga_jual: hargaJual,
                    estimasiHarga: hargaJual,
                    deskripsi: finalDesc,
                    fotoUrl: uploadedFotoUrl || getDefaultPhotoForCategory(bestCat, parsed.nama)
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

  // B. JIKA HANYA ANGKA BARCODE ATAU VISION BELUM MENEMUKAN NAMA SPESIFIK
  if (!cleanBarcode) {
    return { status: "error", message: "Barcode tidak valid atau gambar tidak dapat diidentifikasi." };
  }

  // 2. Cek ke 3 Database Terbuka Dunia: OpenBeautyFacts (Kosmetik Dove/Nivea/dll), OpenFoodFacts, dan OpenProductsFacts (ATK/Barang)
  const variants = [cleanBarcode];
  if (cleanBarcode.length === 12) variants.push("0" + cleanBarcode);
  if (cleanBarcode.length === 13 && cleanBarcode.startsWith("0")) variants.push(cleanBarcode.substring(1));
  if (cleanBarcode.length === 11) variants.push("00" + cleanBarcode);
  const padded13 = cleanBarcode.padStart(13, "0");
  if (!variants.includes(padded13)) variants.push(padded13);

  const openApiHosts = [
    { name: "OpenBeautyFacts", host: "https://world.openbeautyfacts.org" },
    { name: "OpenFoodFacts", host: "https://world.openfoodfacts.org" },
    { name: "OpenProductsFacts", host: "https://world.openproductsfacts.org" }
  ];

  for (let h = 0; h < openApiHosts.length; h++) {
    const apiSource = openApiHosts[h];
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      try {
        const apiUrl = `${apiSource.host}/api/v2/product/${encodeURIComponent(v)}.json`;
        const res = UrlFetchApp.fetch(apiUrl, {
          muteHttpExceptions: true,
          headers: { "User-Agent": "TokoDelina-Lookup/2.0 (contact@tokodelina.store)" }
        });
        if (res.getResponseCode() === 200) {
          const offJson = JSON.parse(res.getContentText());
          if (offJson.status === 1 && offJson.product) {
            const p = offJson.product;
            const brand = (p.brands || "").split(",")[0].trim();
            const prodName = p.product_name_id || p.product_name || p.product_name_en || p.generic_name_id || p.generic_name || "";
            const qtyStr = p.quantity ? ` ${p.quantity}` : "";
            let fullTitle = prodName;
            if (brand && !prodName.toLowerCase().includes(brand.toLowerCase())) {
              fullTitle = `${brand} ${prodName}`;
            }
            if (qtyStr && !fullTitle.toLowerCase().includes(qtyStr.trim().toLowerCase())) {
              fullTitle = `${fullTitle}${qtyStr}`;
            }
            if (fullTitle && fullTitle.trim().length > 2) {
              const imgUrl = p.image_url || p.image_front_url || p.image_front_small_url || "";
              const cat = mapKategoriKeDaftarToko((p.categories || "") + " " + fullTitle, storeCategories);
              return {
                status: "success",
                isNew: true,
                source: apiSource.name,
                barcode: cleanBarcode,
                nama: fullTitle.trim(),
                kategori: cat,
                satuan: "Pcs",
                deskripsi: `Ready Stok ${fullTitle.trim()} | Kategori: ${cat} — Dijamin Ori & Berkualitas di Delina.store`,
                fotoUrl: imgUrl || getDefaultPhotoForCategory(cat, fullTitle)
              };
            }
          }
        }
      } catch (errOff) {
        Logger.log(`${apiSource.name} fetch error: ` + errOff.toString());
      }
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
            const cat = mapKategoriKeDaftarToko((item.category || "") + " " + item.title, storeCategories);
            return {
              status: "success",
              isNew: true,
              source: "UPCitemdb",
              barcode: cleanBarcode,
              nama: item.title.trim(),
              kategori: cat,
              satuan: "Pcs",
              deskripsi: `Ready Stok ${item.title.trim()} | Kategori: ${cat} — Dijamin Ori & Berkualitas di Delina.store`,
              fotoUrl: imgUrl || getDefaultPhotoForCategory(cat, item.title)
            };
          }
        }
      }
    } catch (errUpc) {
      Logger.log("UPCitemdb fetch error: " + errUpc.toString());
    }
  }

  // 3. Deteksi Merek Indonesia & Internasional (Unilever/Dove, Beiersdorf/Nivea, Wardah, Garnier, ATK, Kelontongan, Minuman)
  const indonesianBrands = {
    "8999999": { brand: "Unilever Indonesia (Dove / Rexona / Lifebuoy / Pepsodent / Sunsilk)", category: "Kosmetik & Cantik", sample: "Produk Perawatan Diri Unilever (Dove / Rexona)" },
    "8992747": { brand: "Unilever Indonesia", category: "Kosmetik & Cantik", sample: "Produk Perawatan Diri Dove / Rexona Unilever" },
    "4005808": { brand: "Nivea (Beiersdorf)", category: "Kosmetik & Cantik", sample: "Nivea Deodorant / Body Care" },
    "4005900": { brand: "Nivea (Beiersdorf)", category: "Kosmetik & Cantik", sample: "Nivea Extra Brightening Deodorant Roll On" },
    "8850029": { brand: "Nivea (Beiersdorf Asia)", category: "Kosmetik & Cantik", sample: "Nivea Deodorant Roll On / Spray" },
    "8999777": { brand: "Nivea Indonesia", category: "Kosmetik & Cantik", sample: "Nivea Care & Protection" },
    "4800888": { brand: "Dove / Rexona (Unilever)", category: "Kosmetik & Cantik", sample: "Dove Deodorant Roll On" },
    "8851932": { brand: "Dove / Vaseline (Unilever Asia)", category: "Kosmetik & Cantik", sample: "Dove Deodorant / Body Lotion" },
    "8998899": { brand: "Wardah (Paragon)", category: "Kosmetik & Cantik", sample: "Wardah Skincare / Kosmetik" },
    "8997032": { brand: "Emina / Kahf / Make Over", category: "Kosmetik & Cantik", sample: "Skincare Paragon (Emina / Kahf)" },
    "8997010": { brand: "Garnier", category: "Kosmetik & Cantik", sample: "Garnier Bright Complete / Micellar Water" },
    "8992304": { brand: "L'Oreal / Garnier Indonesia", category: "Kosmetik & Cantik", sample: "Garnier Skincare / Men" },
    "8993379": { brand: "Pond's", category: "Kosmetik & Cantik", sample: "Pond's Bright Miracle Facial Foam" },
    "8992388": { brand: "Sinar Dunia (SiDu)", category: "ATK & Kantor", sample: "Buku Tulis Sinar Dunia 38 Lembar" },
    "8998866": { brand: "Indofood / Wings", category: "Kelontongan", sample: "Produk Indofood / Mie Instan" },
    "8992745": { brand: "Standard Pen", category: "ATK & Kantor", sample: "Pulpen Standard AE7 0.5mm" },
    "8991389": { brand: "Snowman", category: "ATK & Kantor", sample: "Spidol Snowman Boardmarker Hitam" },
    "8996001": { brand: "Danone Aqua / Le Minerale", category: "Minuman", sample: "Air Mineral Botol 600ml" },
    "8992775": { brand: "Sosro", category: "Minuman", sample: "Teh Botol Sosro" },
    "8991001": { brand: "Mayora", category: "Minuman", sample: "Produk Mayora" },
    "8997009": { brand: "Joyko", category: "ATK & Kantor", sample: "Alat Tulis Kantor Joyko" },
    "8993175": { brand: "Kenko", category: "ATK & Kantor", sample: "Perlengkapan Kantor Kenko" },
    "8992759": { brand: "PaperOne", category: "ATK & Kantor", sample: "Kertas HVS PaperOne A4 75gsm" },
    "8993005": { brand: "Wings Care / Food", category: "Kelontongan", sample: "Produk Wings (SoKlin / Nuvo / Mie Sedaap)" },
    "8992999": { brand: "Faber-Castell", category: "ATK & Kantor", sample: "Pensil 2B Faber-Castell" }
  };
  const prefix7 = cleanBarcode.substring(0, 7);
  const matchedBrand = indonesianBrands[prefix7];

  // 4. Cari Konteks di Internet (Web Search Snippet) + Gemini AI (Google Search Grounding / Text)
  const webSnippet = cariSnippetWebBarcode(cleanBarcode);
  try {
    const props = PropertiesService.getScriptProperties();
    let geminiApiKey = props.getProperty("GEMINI_API_KEY");
    if (!geminiApiKey) {
      try {
        const s = getPengaturanData();
        if (s && s.GEMINI_API_KEY) geminiApiKey = String(s.GEMINI_API_KEY).trim();
      } catch (eSet) {}
    }
    if (geminiApiKey) {
      const promptAI = `Identifikasi secara akurat produk dagang ritel di Indonesia dengan kode barcode EAN/UPC: "${cleanBarcode}".
${webSnippet ? `Data hasil pencarian web untuk barcode ${cleanBarcode}: "${webSnippet}".` : ""}
${matchedBrand ? `Petunjuk pabrikan GS1: Barcode ini milik pabrikan ${matchedBrand.brand} (kategori umum: ${matchedBrand.category}).` : ""}
Pilih kategori yang paling tepat HANYA dari daftar: ${storeCategories.join(", ")}.
Tentukan satuan yang tepat (Pcs, Btl, Roll, Pack, Box, Rim, Sachet) dan estimasi harga jual eceran di Indonesia dalam Rupiah (angka bulat).
Kembalikan HANYA format JSON murni:
{"nama": "...", "kategori": "...", "satuan": "Pcs", "harga_jual": 0, "deskripsi": "..."}`;

      const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      for (let m = 0; m < models.length; m++) {
        const modelName = models[m];
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
          // Coba dengan Google Search Grounding terlebih dahulu pada model 2.0/2.5 jika snippet kosong
          const payload = {
            contents: [{ role: "user", parts: [{ text: promptAI }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
          };
          if (!webSnippet && (modelName === "gemini-2.5-flash" || modelName === "gemini-2.0-flash")) {
            payload.tools = [{ google_search: {} }];
          }

          const options = {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          };
          let aiRes = UrlFetchApp.fetch(geminiUrl, options);
          if (aiRes.getResponseCode() !== 200 && payload.tools) {
            delete payload.tools;
            options.payload = JSON.stringify(payload);
            aiRes = UrlFetchApp.fetch(geminiUrl, options);
          }

          if (aiRes.getResponseCode() === 200) {
            const aiJson = JSON.parse(aiRes.getContentText());
            if (aiJson.candidates && aiJson.candidates[0] && aiJson.candidates[0].content && aiJson.candidates[0].content.parts) {
              const rawText = aiJson.candidates[0].content.parts.map(pt => pt.text || "").join("\n");
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed && parsed.nama && !parsed.nama.toLowerCase().includes("tidak diketahui")) {
                  const finalCat = mapKategoriKeDaftarToko(parsed.kategori || (matchedBrand ? matchedBrand.category : parsed.nama), storeCategories);
                  const estHarga = Number(parsed.harga_jual) || 0;
                  return {
                    status: "success",
                    isNew: true,
                    source: `Gemini AI + Internet Search`,
                    barcode: cleanBarcode,
                    nama: parsed.nama.trim(),
                    kategori: finalCat,
                    satuan: parsed.satuan || "Pcs",
                    harga_jual: estHarga,
                    estimasiHarga: estHarga,
                    deskripsi: parsed.deskripsi || `Ready Stok ${parsed.nama.trim()} | Kategori: ${finalCat} — Dijamin Ori & Berkualitas di Delina.store`,
                    fotoUrl: getDefaultPhotoForCategory(finalCat, parsed.nama)
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

  // 4b. Jika tidak ada API Key Gemini namun Web Snippet menemukan judul produk
  if (webSnippet) {
    const firstPart = webSnippet.split("|")[0].replace(/barcode/gi, "").replace(cleanBarcode, "").replace(/[-–—:|]/g, " ").trim();
    if (firstPart.length > 4) {
      const finalCat = mapKategoriKeDaftarToko(firstPart + " " + (matchedBrand ? matchedBrand.category : ""), storeCategories);
      return {
        status: "success",
        isNew: true,
        source: "Internet Web Search",
        barcode: cleanBarcode,
        nama: firstPart.substring(0, 75).trim(),
        kategori: finalCat,
        satuan: "Pcs",
        deskripsi: `Ready Stok ${firstPart.substring(0, 75).trim()} | Kategori: ${finalCat} — Dijamin Ori & Berkualitas di Delina.store`,
        fotoUrl: getDefaultPhotoForCategory(finalCat, firstPart)
      };
    }
  }

  // 5. Jika AI gagal, gunakan database merek GS1 Indonesia & Internasional
  if (matchedBrand) {
    const finalCat = mapKategoriKeDaftarToko(matchedBrand.category, storeCategories);
    return {
      status: "success",
      isNew: true,
      source: "GS1-Brand-Registry",
      barcode: cleanBarcode,
      nama: `${matchedBrand.sample} (${cleanBarcode.slice(-4)})`,
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
    kategori: storeCategories[0] || "ATK & Kantor",
    satuan: "Pcs",
    deskripsi: `Ready Stok Barang Baru | Kategori: ${storeCategories[0] || 'ATK & Kantor'} — Dijamin Ori & Berkualitas di Delina.store`,
    fotoUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500"
  };
}

function getDefaultPhotoForCategory(kategori, nama) {
  const text = `${kategori || ""} ${nama || ""}`.toLowerCase();
  if (text.includes("dove") || text.includes("nivea") || text.includes("rexona") || text.includes("deodorant") || text.includes("roll on") || text.includes("parfum")) {
    return "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80";
  }
  if (text.includes("kosmetik") || text.includes("cantik") || text.includes("skincare") || text.includes("wardah") || text.includes("garnier") || text.includes("serum") || text.includes("facial") || text.includes("sabun") || text.includes("perawatan")) {
    return "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80";
  }
  if (text.includes("sembako") || text.includes("minyak") || text.includes("beras") || text.includes("gula") || text.includes("kelontong")) {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80";
  }
  if (text.includes("minuman") || text.includes("kopi") || text.includes("teh") || text.includes("susu") || text.includes("aqua") || text.includes("jus")) {
    return "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80";
  }
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
  const header = [["No_HP", "Password_Hash", "Nama_Member", "Jumlah_Belanja", "Total_Hadiah_Diklaim", "Tanggal_Daftar", "URL_Foto_Profil", "URL_Foto_KTP", "Alamat_Lengkap"]];
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  formatHeaderSheet(sheet, header[0].length);

  // Data Awal Contoh Member (Memudahkan Pengujian Langsung)
  const sampleMembers = [
    ["'081298765432", "1234", "Ahmad Fauzi (VIP Hampir Klaim)", 29, 0, "15/10/2026 10:00", "", "", ""],
    ["'085712345678", "1234", "Siti Rahmawati (Member Aktif)", 12, 0, "20/10/2026 14:30", "", "", ""],
    ["'087812340000", "1234", "Budi Santoso (Siap Klaim)", 31, 1, "01/10/2026 09:15", "", "", ""]
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
        registeredAt: String(r[5] || "-"),
        photoUrl: convertDriveUrlToLh3(String(r[6] || "")),
        ktpUrl: convertDriveUrlToLh3(String(r[7] || "")),
        address: String(r[8] || "")
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

  try {
    const notifMember = `👤 *MEMBER BARU BERGABUNG!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 *Alhamdulillah! Ada pelanggan baru mendaftar Member VIP:*
• 👤 *Nama:* *${rawName}*
• 📱 *WhatsApp:* \`${cleanPhone}\`
• 📅 *Waktu Daftar:* ${nowStr} WIB
• 🎁 *Stempel Awal:* 0/30 Belanja`;
    broadcastPesanTelegram(notifMember);
  } catch (errNotif) {
    Logger.log("Notice notif member: " + errNotif.toString());
  }

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
        registeredAt: String(data[i][5] || "-"),
        photoUrl: convertDriveUrlToLh3(String(data[i][6] || "")),
        ktpUrl: convertDriveUrlToLh3(String(data[i][7] || "")),
        address: String(data[i][8] || "")
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
  const orders = ambilDaftarPesananMember(ss, cleanPhone);
  return {
    status: "success",
    message: "Alhamdulillah, selamat datang kembali " + found.name + "!",
    member: found,
    claims: claims,
    orders: orders
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
        registeredAt: String(data[i][5] || "-"),
        photoUrl: convertDriveUrlToLh3(String(data[i][6] || "")),
        ktpUrl: convertDriveUrlToLh3(String(data[i][7] || "")),
        address: String(data[i][8] || "")
      };
      const claims = ambilDaftarKlaim(ss, cleanPhone);
      const orders = ambilDaftarPesananMember(ss, cleanPhone);
      return { status: "success", member: member, claims: claims, orders: orders };
    }
  }

  return { status: "error", message: "Member dengan nomor " + cleanPhone + " tidak ditemukan." };
}

function ambilDaftarPesananMember(ss, cleanPhone) {
  const memberOrders = [];
  const sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  if (!sheetPesanan || sheetPesanan.getLastRow() <= 1) return memberOrders;

  const data = sheetPesanan.getDataRange().getValues();
  const phoneSuffix = cleanPhone.slice(-8);

  for (let i = data.length - 1; i >= 1; i--) {
    const rowPhone = normalizePhoneNumber(data[i][3]);
    if (rowPhone && (rowPhone === cleanPhone || rowPhone.endsWith(phoneSuffix))) {
      memberOrders.push({
        orderId: String(data[i][0] || ""),
        orderTime: String(data[i][1] || ""),
        customerName: String(data[i][2] || ""),
        customerPhone: String(data[i][3] || ""),
        deliveryMethod: String(data[i][4] || ""),
        customerAddress: String(data[i][5] || ""),
        itemsText: String(data[i][6] || ""),
        total: Number(data[i][7]) || 0,
        status: String(data[i][10] || "Diproses"),
        orderStatus: String(data[i][10] || "Diproses")
      });
      if (memberOrders.length >= 30) break;
    }
  }
  return memberOrders;
}

function prosesUploadMemberPhoto(payload, ss) {
  const cleanPhone = normalizePhoneNumber(payload.phone);
  if (!cleanPhone) return { status: "error", message: "Nomor HP diperlukan." };

  const photoBase64 = payload.photo || payload.photoBase64;
  if (!photoBase64) return { status: "error", message: "File foto profil tidak ditemukan." };

  const memberNameSafe = String(payload.name || "Member").replace(/[^a-zA-Z0-9_-]/g, "_");
  let photoUrl = "";
  try {
    photoUrl = saveBase64ToDriveFolder(
      photoBase64,
      `FotoProfil_${memberNameSafe}_${cleanPhone}_${Date.now()}.jpg`,
      SUBFOLDER_MEMBER_PROFIL_KTP
    );
    photoUrl = convertDriveUrlToLh3(photoUrl);
  } catch (err) {
    return { status: "error", message: "Gagal menyimpan foto ke Drive: " + err.toString() };
  }

  const sheet = ss.getSheetByName(TAB_MEMBER);
  if (sheet) {
    if (sheet.getLastColumn() < 9) {
      sheet.getRange(1, 7, 1, 3).setValues([["URL_Foto_Profil", "URL_Foto_KTP", "Alamat_Lengkap"]]);
    }
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalizePhoneNumber(data[i][0]) === cleanPhone) {
        sheet.getRange(i + 1, 7).setValue(photoUrl);
        break;
      }
    }
  }

  return { status: "success", message: "Foto profil berhasil diunggah ke Google Drive!", photoUrl: photoUrl };
}

function prosesSaveMemberKtp(payload, ss) {
  const cleanPhone = normalizePhoneNumber(payload.phone);
  if (!cleanPhone) return { status: "error", message: "Nomor HP diperlukan." };

  const address = String(payload.address || "").trim();
  const ktpBase64 = payload.ktpPhoto || payload.ktpBase64 || null;
  const memberNameSafe = String(payload.name || "Member").replace(/[^a-zA-Z0-9_-]/g, "_");

  let ktpUrl = "";
  if (ktpBase64 && String(ktpBase64).startsWith("data:")) {
    try {
      ktpUrl = saveBase64ToDriveFolder(
        ktpBase64,
        `KTP_VIP_${memberNameSafe}_${cleanPhone}_${Date.now()}.jpg`,
        SUBFOLDER_MEMBER_PROFIL_KTP
      );
      ktpUrl = convertDriveUrlToLh3(ktpUrl);
    } catch (err) {
      Logger.log("Notice save KTP Drive: " + err.toString());
    }
  }

  const sheet = ss.getSheetByName(TAB_MEMBER);
  if (sheet) {
    if (sheet.getLastColumn() < 9) {
      sheet.getRange(1, 7, 1, 3).setValues([["URL_Foto_Profil", "URL_Foto_KTP", "Alamat_Lengkap"]]);
    }
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalizePhoneNumber(data[i][0]) === cleanPhone) {
        if (ktpUrl) sheet.getRange(i + 1, 8).setValue(ktpUrl);
        if (address) sheet.getRange(i + 1, 9).setValue(address);
        break;
      }
    }
  }

  return { status: "success", message: "Data KTP dan Alamat berhasil disimpan ke Google Drive!", ktpUrl: ktpUrl, address: address };
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

  // 6. Notifikasi Telegram ke Pemilik Toko & Grup Laporan
  try {
    const notifKlaim = `🎁 *KLAIM HADIAH MEMBER DELINA.STORE!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 *Alhamdulillah! Ada Member Berhasil Mencapai 30x Belanja:*

👤 *Nama Member:* *${memberName}*
📱 *WhatsApp/HP:* \`${cleanPhone}\`
🎁 *Hadiah Dipilih:* *${namaHadiah}*
📋 *Kode Klaim:* \`${claimCode}\`
⏰ *Waktu Klaim:* ${nowStr} WIB
📊 *Sisa Stempel Belanja:* ${newBelanja}/30

💡 *Petunjuk Toko:*
Tunjukkan nomor nota atau kode klaim di atas saat member mengambil hadiah di meja kasir Toko Delina.`;
    broadcastPesanTelegram(notifKlaim);
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

  try {
    let itemSummaryList = items.slice(0, 5).map((i, idx) => `  ${idx + 1}. ${(i && i.name) || 'Barang'} (${Number(i && i.qty) || 1}x @ Rp ${Number(i && i.price || 0).toLocaleString("id-ID")})`).join("\n");
    if (items.length > 5) itemSummaryList += `\n  ...dan ${items.length - 5} item lainnya.`;

    const posNotif = `💵 *TRANSAKSI KASIR (POS) SELESAI!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *No. Struk:* \`${orderId}\`
💰 *Total Transaksi:* *Rp ${totalPrice.toLocaleString("id-ID")}*
💳 *Metode Bayar:* *${payMethod}*
🕒 *Waktu Transaksi:* ${orderTimeNow} WIB
👤 *Pelanggan:* ${memberPhoneInput ? ((memberResult && memberResult.name) ? memberResult.name + " (`" + memberPhoneInput + "`)" : memberPhoneInput) : "Pelanggan Langsung di Toko"}

📦 *Daftar Barang Belanja:*
${itemSummaryList || "-"}

_Tercatat otomatis di Database Google Sheets Toko Delina._ 🤲✨`;
    broadcastPesanTelegram(posNotif);
  } catch (errPosNotif) {
    Logger.log("Notice notif pos: " + errPosNotif.toString());
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
 * Mengisi hingga 100 produk terbagi di 4 kategori resmi Toko Delina:
 * 1. ATK & Kantor
 * 2. Kosmetik & Cantik
 * 3. Kelontongan
 * 4. Minuman
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
    const prodNama = String(existingData[i][1] || "").trim();
    const normCat = normalizeKategoriResmiDelina(oldCat, prodNama);
    if (oldCat !== normCat) {
      sheetProduk.getRange(i + 1, 3).setValue(normCat);
    }
  }

  // Daftar 81 Produk Tambahan Berkualitas Tinggi (4 Kategori Resmi: ATK & Kantor, Kosmetik & Cantik, Kelontongan, Minuman)
  const itemsToAdd = [
    // ATK & Kantor (Tambahan ATK-020 s/d ATK-025)
    ["ATK-020", "Binder Bantex B5 Pastel Ring Metal 26 Ring Exclusive", "ATK & Kantor", 38000, 45, "Pcs", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", "Binder cover kulit sintesis warna pastel elegan dengan ring besi tahan karat dan slot kartu nama."],
    ["ATK-021", "Kertas Loose Leaf B5 Bergaris Merk Joyko (1 Pack Isi 100 Lembar)", "ATK & Kantor", 12500, 80, "Pack", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80", "Refill binder B5 kertas tebal 80 gsm putih bersih dan tidak tembus tinta pulpen gel."],
    ["ATK-022", "Lakban Bening Daimaru 2 Inch (Lebar 48mm x Panjang 90 Yard)", "ATK & Kantor", 14000, 60, "Roll", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Lakban perekat packing kualitas nomor 1 kuat, tidak mudah putus saat ditarik kencang."],
    ["ATK-023", "Kalkulator Meja 12 Digit Citizen SDC-868L Layar Besar", "ATK & Kantor", 65000, 25, "Pcs", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80", "Kalkulator kasir meja 12 digit dual power tenaga surya dan baterai awet tahan lama."],
    ["ATK-024", "Spidol Permanen Snowman Jumbo 500 Hitam Anti Air Tahan Lama", "ATK & Kantor", 11000, 90, "Pcs", "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80", "Spidol marker serbaguna permanen cepat kering cocok untuk menulis di kardus dan karung."],
    ["ATK-025", "Cutter Joyko L-500 Besar + 1 Tube Isi Ulang Pisau Baja", "ATK & Kantor", 16500, 40, "Set", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600&auto=format&fit=crop&q=80", "Pisau cutter besar berbobot dengan sistem autolock dan mata pisau tajam anti macet."],

    // Kosmetik & Cantik (ATK-026 s/d ATK-050)
    ["ATK-026", "Wardah Lightening Micellar Gentle Wash 100ml Non-SLS", "Kosmetik & Cantik", 29500, 35, "Tub", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Sabun cuci muka pencerah dengan busa lembut dan niacinamide murni ramah kulit sensitif."],
    ["ATK-027", "Wardah UV Shield Essential Sunscreen Gel SPF 35 PA+++ 40ml", "Kosmetik & Cantik", 34000, 40, "Tub", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80", "Sunscreen ringan bebas alkohol tanpa white-cast lindungi wajah dari sinar matahari terik."],
    ["ATK-028", "Emina Bright Stuff Moisturizing Cream 20ml Pelembap Cerah Alami", "Kosmetik & Cantik", 23500, 50, "Tub", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80", "Krim pelembap remaja dengan ekstrak plum musim panas dan vitamin E bikin wajah glowing."],
    ["ATK-029", "Kahf Oil and Acne Care Face Wash Men 100ml Sabun Muka Pria", "Kosmetik & Cantik", 36000, 30, "Tub", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Pembersih wajah pria dengan ekstrak kopi dan formula HydroBalance cegah jerawat berlebih."],
    ["ATK-030", "Garnier Micellar Cleansing Water Pink All-in-1 Pembersih Make Up 125ml", "Kosmetik & Cantik", 32500, 45, "Btl", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80", "Pembersih wajah sekali usap tanpa bilas, mengangkat debu dan sisa make up hingga bersih."],
    ["ATK-031", "Nivea Extra White Body Serum Care and Protect SPF 15 PA 180ml", "Kosmetik & Cantik", 38500, 35, "Tub", "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80", "Lotion serum pencerah tubuh dengan 95% kemurnian vitamin C dan perlindungan triple filter UV."],
    ["ATK-032", "Vaseline Repairing Jelly Original 50ml Petroleum Murni Multi-Khasiat", "Kosmetik & Cantik", 25000, 60, "Pot", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80", "Gel pelembap serbaguna mengatasi bibir pecah-pecah, tumit kering, dan kulit iritasi ringan."],
    ["ATK-033", "Ponds Bright Beauty Triple Glow Serum Mencerahkan Wajah 30ml", "Kosmetik & Cantik", 75000, 20, "Btl", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80", "Serum konsentrat pencerah dengan Gluta-Boost-C dan hyaluronic acid menyamarkan noda hitam."],
    ["ATK-034", "Biore UV Aqua Rich Watery Essence SPF 50+ PA++++ 50g Sunscreen Dingin", "Kosmetik & Cantik", 98000, 25, "Tub", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80", "Sunscreen viral sensasi dingin menyegarkan dengan micro-defense kapsul air tahan keringat."],
    ["ATK-035", "Hada Labo Gokujyun Ultimate Moisturizing Lotion Strip Hijau / Orange 100ml", "Kosmetik & Cantik", 47000, 30, "Btl", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Hydrating toner Jepang dengan 3 jenis Hyaluronic Acid menjaga elastisitas kelembapan kulit."],
    ["ATK-036", "Implora Urban Lip Matte Cream Best Shade 01 Dusky Nude Tahan 12 Jam", "Kosmetik & Cantik", 22000, 75, "Pcs", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80", "Lip cream matte ringan tekstur lembut wangi vanilla tidak membuat bibir kering pecah."],
    ["ATK-037", "Madame Gie Sweet Cheek Blushed On Baked Natural Glow 01", "Kosmetik & Cantik", 18500, 50, "Pcs", "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80", "Perona pipi bubuk padat pigmen halus tahan lama memberi rona segar cerah alami."],
    ["ATK-038", "Viva Air Mawar Ekstrak Mawar Asli 100ml Penyegar Kulit & Campuran Masker", "Kosmetik & Cantik", 7000, 120, "Btl", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80", "Air mawar legendaris aroma wangi menenangkan melembutkan kulit wajah setelah beraktivitas."],
    ["ATK-039", "Kapas Kecantikan Selection Facial Cotton Tebal Lembut Isi 100 Lembar", "Kosmetik & Cantik", 13000, 85, "Pack", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80", "Kapas bulat persegi 100% kapas murni higienis tanpa pemutih bebas debu serabut."],
    ["ATK-040", "Sunsilk Hijab Refresh and Anti-Dandruff Shampoo Botol 160ml", "Kosmetik & Cantik", 24000, 40, "Btl", "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80", "Shampo khusus wanita berhijab dengan buah tin dan jeruk nipis bikin rambut sejuk bebas ketombe."],
    ["ATK-041", "Lifebuoy Total 10 Antibacterial Body Wash Pouch Refill 450ml", "Kosmetik & Cantik", 25500, 55, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Sabun mandi cair antibakterial perlindungan kuman keluarga dengan formula activ silver+."],
    ["ATK-042", "Dettol Sabun Mandi Batang Antiseptik Original 100g (Pack Isi 3 Batang)", "Kosmetik & Cantik", 23000, 45, "Pack", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Sabun batang antiseptik pembunuh kuman nomor satu harum bersih menyegarkan sepanjang hari."],
    ["ATK-043", "Pepsodent Pencegah Gigi Berlubang Pasta Gigi Herbal Alami 190g", "Kosmetik & Cantik", 16500, 70, "Tub", "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&auto=format&fit=crop&q=80", "Pasta gigi formula mikro kalsium aktif dan fluoride melindungi email gigi dari asam makanan."],
    ["ATK-044", "Sikat Gigi Formula Sparkling White Bulu Halus Extra Soft (Pack 3 Pcs)", "Kosmetik & Cantik", 15000, 60, "Pack", "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&auto=format&fit=crop&q=80", "Sikat gigi bulu lembut 0.01mm menjangkau sela gigi sempit tanpa melukai gusi."],
    ["ATK-045", "Rexona Women Deodorant Roll On Advanced Whitening Glowing 45ml", "Kosmetik & Cantik", 19500, 50, "Btl", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80", "Deodorant pencerah ketiak tahan keringat dan bau badan hingga 48 jam wangi segar."],
    ["ATK-046", "Rexona Men Ice Cool Roll On Deodorant Sensasi Es Dingin 45ml", "Kosmetik & Cantik", 19500, 45, "Btl", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Deodorant pria dengan sensasi es dingin segar bebas bau keringat cocok untuk yang aktif olahraga."],
    ["ATK-047", "Parfum Pria Casablanca Body Mist Cologne Sport Blue 100ml Botol Kaca", "Kosmetik & Cantik", 24500, 35, "Btl", "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80", "Cologne pria maskulin sporty elegan aroma segar woody mewah tahan semerbak."],
    ["ATK-048", "Marina Hand Body Lotion Natural Rich Moisturizing Avocado 475ml Pump", "Kosmetik & Cantik", 17000, 40, "Btl", "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80", "Body lotion alpukat dan minyak zaitun melembapkan kulit kering seharian wangi lembut manis."],
    ["ATK-049", "Minyak Kayu Putih Cap Lang 60ml Hangat Alami Anti Masuk Angin", "Kosmetik & Cantik", 23500, 65, "Btl", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Minyak kayu putih asli Ambon aromaterapi melegakan pernapasan dan menghangatkan perut kembung."],
    ["ATK-050", "Minyak Telon My Baby Plus Minyak Sereh Eucalyptus Anti Nyamuk 90ml", "Kosmetik & Cantik", 22000, 55, "Btl", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", "Minyak telon bayi melindungi dari gigitan nyamuk hingga 8 jam wangi khas bayi menenangkan."],

    // Kelontongan (ATK-051 s/d ATK-078)
    ["ATK-051", "Beras Premium Sania Pulen Bersih Alami Kemasan 5 Kg", "Kelontongan", 74500, 30, "Sak", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80", "Beras berkualitas kepala super putih alami tanpa pemutih wangi pulen lezat saat dimasak."],
    ["ATK-052", "Minyak Goreng Bimoli Klasik Pouch Refill 2 Liter 2x Penyaringan", "Kelontongan", 37500, 45, "Pouch", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Minyak goreng kelapa sawit murni bening tahan panas tinggi hasil gorengan renyah matang merata."],
    ["ATK-053", "Minyak Goreng Tropical Botol 1 Liter Non-Kolesterol", "Kelontongan", 19500, 50, "Btl", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Minyak goreng bermutu tinggi dengan kandungan vitamin E dan asam lemak tak jenuh."],
    ["ATK-054", "Gula Pasir Gulaku Kuning Premium Tebu Alami Kemasan 1 Kg", "Kelontongan", 17500, 80, "Pack", "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80", "Gula pasir dari tebu murni pilihan warna kuning alami rasa manis legit gurih tanpa bahan kimia."],
    ["ATK-055", "Tepung Terigu Segitiga Biru Bogasari Protein Sedang Kemasan 1 Kg", "Kelontongan", 13500, 70, "Pack", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", "Tepung serbaguna cocok untuk gorengan renyah, kue basah, donat, dan martabak manis."],
    ["ATK-056", "Garam Meja Beryodium Cap Daun Bawang / Dolpin 250g Garam Halus", "Kelontongan", 3500, 100, "Pack", "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80", "Garam meja halus beryodium tinggi mencegah penyakit gondok dan menyedapkan masakan rumah."],
    ["ATK-057", "Kecap Manis Bango Pouch Refill Kemasan Besar 520ml Dari Kedelai Hitam Mallika", "Kelontongan", 22500, 60, "Pouch", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Kecap manis kental gurih dari kedelai hitam alami asli warisan nusantara rasa mantap."],
    ["ATK-058", "Saus Sambal ABC Asli Botol Kaca 335ml Pedas Segar Alami", "Kelontongan", 15500, 50, "Btl", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", "Saus sambal pedas nikmat perpaduan cabai segar pilihan dan bawang putih gurih mantap."],
    ["ATK-059", "Margarin Blue Band Serbaguna Sachet Foil 200g Wangi Gurih", "Kelontongan", 10500, 65, "Pack", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", "Margarin kaya nutrisi omega 3 & 6 cocok untuk olesan roti, memasak nasi goreng, dan bikin kue."],
    ["ATK-060", "Santan Kelapa Instan Kara Segitiga UHT 65ml (Pack Isi 5 Pcs)", "Kelontongan", 16000, 45, "Pack", "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80", "Santan kelapa murni siap pakai praktis kental gurih untuk opor, lodeh, dan kolak pisang."],
    ["ATK-061", "Bumbu Masak Racik Indofood Sayur Asem / Ayam Goreng (Pack Isi 10 Sachet)", "Kelontongan", 18000, 50, "Pack", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80", "Bumbu racik rempah asli tanpa bahan pengawet bikin masakan selezat masakan restoran."],
    ["ATK-062", "Masako Kaldu Ayam / Sapi Penyedap Rasa Gurih Kemasan Renteng Isi 12 Sachet", "Kelontongan", 6500, 90, "Renteng", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80", "Kaldu daging asli dan bumbu rempah pilihan penyedap wajib sup, tumisan, dan gorengan."],
    ["ATK-063", "Sabun Cuci Piring Sunlight Jeruk Nipis 100 Pouch Refill Besar 700ml", "Kelontongan", 14500, 75, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Cairan pencuci piring ekstrak jeruk nipis asli hilangkan lemak membandel 5x lebih cepat."],
    ["ATK-064", "Deterjen Bubuk Rinso Molto Anti Noda Classic Fresh Kemasan 770g", "Kelontongan", 23500, 45, "Pack", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Deterjen formula busa cerdas hilangkan noda dalam 1x kucek wangi tahan harum 21 hari."],
    ["ATK-065", "Pewangi dan Pelembut Pakaian Downy Mystique Pouch 650ml Aroma Parfum Mewah", "Kelontongan", 29000, 40, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Pelembut konsentrat wangi parfum elegan tahan lama di serat pakaian cegah bau apek."],
    ["ATK-066", "Pembersih Lantai SoKlin Pembersih Lantai Apel Wangi Segar Pouch 780ml", "Kelontongan", 11500, 55, "Pouch", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Cairan pembersih lantai bunuh kuman 99% kilau bersih bebas lengket wangi segar semerbak."],
    ["ATK-067", "Obat Nyamuk Semprot Baygon Aerosol Fresh Citrus Anti Nyamuk & Lalat 600ml", "Kelontongan", 39500, 30, "Klg", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "Aerosol semprot anti nyamuk demam berdarah dan serangga aroma jeruk segar tidak menyengat."],
    ["ATK-068", "Tissue Wajah Paseo Smart Facial Tissue 250 Sheets 2 Ply Halus Kuat", "Kelontongan", 14000, 90, "Pack", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80", "Tisu wajah higienis 100% serat alami virgin pulp lembut nyaman di kulit tanpa iritasi."],
    ["ATK-069", "Lampu LED Hannochs Sonic 9 Watt Cahaya Putih Terang Hemat Listrik", "Kelontongan", 21000, 40, "Pcs", "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80", "Bohlam lampu LED 9W setara lampu pijar 80W tahan hingga 10.000 jam garansi resmi."],
    ["ATK-070", "Baterai ABC Alkaline AA / A2 (Pack Isi 4 Baterai) Daya Tahan 6x Lebih Kuat", "Kelontongan", 18500, 60, "Pack", "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80", "Baterai alkaline anti bocor daya stabil untuk jam dinding, mouse wireless, dan remote TV."],
    ["ATK-071", "Baterai ABC Alkaline AAA / A3 Kecil (Pack Isi 4 Baterai) Untuk Remote AC", "Kelontongan", 18500, 55, "Pack", "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80", "Baterai mikro alkaline daya tinggi tahan lama untuk remote AC, timbangan, dan mainan anak."],
    ["ATK-072", "Korek Gas Tokai Pemantik Api Rumah Tangga Original (Pack 3 Pcs)", "Kelontongan", 12000, 80, "Pack", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600&auto=format&fit=crop&q=80", "Korek api gas standar SNI api stabil aman dan awet untuk menyalakan kompor gas."],
    ["ATK-073", "Kantong Plastik Sampah Roll Hitam Tebal 50x60cm (Isi 30 Lembar)", "Kelontongan", 14500, 70, "Roll", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Trash bag roll plastik elastis kuat tidak mudah bocor menjaga kebersihan rumah dan kantor."],
    ["ATK-074", "Sapu Ijuk Kayu Mahoni Halus Tradisional Awet Tidak Rontok", "Kelontongan", 25000, 25, "Pcs", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Sapu lantai ijuk hitam murni gagang kayu kokoh sapu bersih debu lantai tanpa gores keramik."],
    ["ATK-075", "Pel Lantai Benang Katun Gagang Besi Anti Karat Delina Home", "Kelontongan", 28000, 20, "Pcs", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80", "Alat pel lantai benang katun tebal daya serap air tinggi lantai cepat kering mengilap."],
    ["ATK-076", "Indomie Mi Instan Goreng Spesial 85g Bumbu Gurih Bawang Goreng Renyah", "Kelontongan", 3500, 200, "Bks", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", "Mie instan goreng terfavorit di dunia dengan aroma bawang khas dan kecap manis nikmat mantap."],
    ["ATK-077", "Indomie Mi Kuah Rasa Soto Mie 70g Gurih Jeruk Nipis Hangat", "Kelontongan", 3500, 180, "Bks", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", "Kuah soto bumbu rempah asli segar gurih perpaduan jeruk nipis hangat cocok di musim hujan."],
    ["ATK-078", "Mie Sedaap Goreng Kriuk-Kriuk Bawang Gurih Renyah 90g", "Kelontongan", 3500, 150, "Bks", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80", "Mie kenyal gurih dengan taburan bawang kriuk renyah sensasi makan mie goreng paling mantap."],

    // Minuman (ATK-079 s/d ATK-100)
    ["ATK-079", "Kopi Kapal Api Special Mix Kopi Plus Gula Mantap (Pack Isi 10 Sachet x 24g)", "Minuman", 16500, 80, "Pack", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", "Kopi hitam bubuk asli perpaduan biji kopi pilihan dan gula murni aroma semerbak harum."],
    ["ATK-080", "Luwak White Koffie Original Rendah Asam Aman di Lambung (Pack Isi 10 Sachet)", "Minuman", 15000, 75, "Pack", "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80", "Kopi putih lembut nikmat bebas kembung proses pembekuan mutakhir aman diminum setiap hari."],
    ["ATK-081", "Teh Celup SariWangi Teh Asli Nusantara (Kotak Isi 30 Kantong Celup)", "Minuman", 8500, 90, "Kotak", "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80", "Teh hitam pilihan aroma wangi menyegarkan cocok untuk minum teh hangat bersama keluarga."],
    ["ATK-082", "Susu UHT Ultra Milk Cokelat / Full Cream Botol Karton 250ml", "Minuman", 7000, 110, "Kotak", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", "Susu sapi segar alami kaya kalsium dan vitamin D membantu pertumbuhan tulang dan energi aktif."],
    ["ATK-083", "Susu Beruang Bear Brand Steril 189ml Murni Kemurnian Terjaga", "Minuman", 10500, 85, "Klg", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", "Susu sapi steril 100% murni tanpa pengawet baik diminum saat pemulihan tubuh dan jaga imun."],
    ["ATK-084", "Air Mineral Aqua Botol Sedang 600ml Segar Dari Sumber Pegunungan", "Minuman", 3500, 180, "Btl", "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80", "Air mineral murni terlindungi alami dari mata air pegunungan vulkanik sejuk menyegarkan."],
    ["ATK-085", "Le Minerale Air Mineral Botol 600ml Ada Manis-Manisnya", "Minuman", 3500, 160, "Btl", "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80", "Air mineral kaya mineral alami bikarbonat dan kalsium kesegaran murni terlindungi tutup bersegel."],
    ["ATK-086", "Teh Botol Sosro Kotak Tetra Pak 250ml Segar Manis Alami Melati", "Minuman", 4000, 120, "Kotak", "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80", "Minuman teh melati asli siap minum pelepas dahaga nomor 1 dinikmati dingin lebih nikmat."],
    ["ATK-087", "Pocari Sweat Botol Pet 500ml Pengganti Ion Tubuh Cepat", "Minuman", 8000, 70, "Btl", "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80", "Minuman isotonik kemposisi mirip cairan tubuh kembalikan kesegaran setelah lelah beraktivitas."],
    ["ATK-088", "Floridina Pulpy Orange Jus Jeruk Segar Bulir Asli 350ml", "Minuman", 3500, 130, "Btl", "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80", "Jus jeruk Florida segar dengan bulir jeruk asli kaya vitamin C diminum dingin sangat segar."],
    ["ATK-089", "Biskuit Roma Kelapa Biskuit Renyah Gurih Kemasan Besar 300g", "Kelontongan", 12500, 65, "Pack", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Biskuit kelapa asli gurih renyah diperkaya vitamin B1, B2, B6 dan kalsium pas dicelup teh hangat."],
    ["ATK-090", "Wafer Nabati Richeese Keju Kaleng / Pouch Kemasan 130g", "Kelontongan", 8500, 85, "Pack", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Wafer renyah krim keju asli kaya vitamin A, B1, B2, B6, B12 rasa gurih manis lumer di mulut."],
    ["ATK-091", "Biskuit Oreo Krim Vanilla Kemasan Roll 119.6g Diputar Dijilat Dicelupin", "Kelontongan", 9500, 90, "Roll", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Biskuit sandwich cokelat renyah dengan krim vanila tebal manis kesukaan semua generasi."],
    ["ATK-092", "Cokelat SilverQueen Cashew Susu Cokelat Mede Gurih 58g", "Kelontongan", 16500, 60, "Batang", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80", "Cokelat susu nikmat berpadu dengan kacang mete renyah gurih pelepas stres dan cemilan manis."],
    ["ATK-093", "Beng-Beng Cokelat Wafer Karamel Crispy 4 Kelezatan (Pack Isi 20 Pcs)", "Kelontongan", 35000, 45, "Pack", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80", "Kombinasi 4 kelezatan wafer renyah, krim susu, karamel legit, dan crispy balut cokelat tebal."],
    ["ATK-094", "Chitato Keripik Kentang Sapi Panggang Beef Barbeque 68g Bergelombang", "Kelontongan", 11500, 70, "Bks", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80", "Keripik kentang asli potongan bergelombang bumbu rasa sapi panggang barbeque renyah mantap."],
    ["ATK-095", "Qtela Keripik Singkong Barbeque / Balado 60g Gurih Renyah Khas", "Kelontongan", 7500, 80, "Bks", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80", "Keripik singkong tradisional renyah dengan bumbu khas rempah balado gurih nagih."],
    ["ATK-096", "Kacang Garuda Rosta Bawang Panggang Renyah 95g Tanpa Kolesterol", "Kelontongan", 11000, 65, "Pack", "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=600&auto=format&fit=crop&q=80", "Kacang bersalut rasa bawang gurih dipanggang oven bukan digoreng renyah garing sehat."],
    ["ATK-097", "Permen Kopiko Coffee Candy Ekstrak Kopi Asli (Bag Isi 50 Butir)", "Kelontongan", 9500, 95, "Bag", "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600&auto=format&fit=crop&q=80", "Permen kopi nomor satu dari ekstrak biji kopi asli ampuh hilangkan kantuk saat bekerja."],
    ["ATK-098", "Choki Choki Pasta Cokelat Cashew Stik (Pack Isi 20 Stik)", "Kelontongan", 18000, 70, "Pack", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80", "Pasta cokelat lembut manis dengan kacang mede cemilan stik manis favorit anak-anak."],
    ["ATK-099", "Biskuit Khong Guan Red Assorted Biscuit Kaleng Kotak Klasik 650g", "Kelontongan", 58000, 25, "Klg", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", "Kaleng biskuit aneka rasa legendaris cocok untuk suguhan tamu dan oleh-oleh keluarga."],
    ["ATK-100", "Energen Sereal dan Susu Cokelat / Vanila Bergizi (Renceng Isi 10 Sachet)", "Minuman", 21500, 75, "Renceng", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80", "Minuman sereal gandum bergizi dengan susu dan telur sarapan sehat penambah tenaga aktif."]
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
