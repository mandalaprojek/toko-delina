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
    NAMA_TOKO: "Toko ATK & Fotokopi Delina",
    SLOGAN_TOKO: "Lengkap, Murah & Berkah",
    NO_WA_TOKO: "081234567890",
    ALAMAT_TOKO: "Jl. Raya Delina No. 12, Samping Masjid",
    URL_TELEGRAM_BOT: "https://t.me/KikoDelinaBot",
    URL_GOOGLE_MAPS: "https://maps.google.com/?q=Toko+Delina+ATK",
    URL_LOGO: "",
    URL_QRIS: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126670016ID.CO.QRIS.WWW01189360099900000123455204541153033605802ID5911DELINA%20SHOP6007JAKARTA6304ABCD",
    NOMOR_REKENING: "BCA 1234567890 a.n Delina Shop",
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
    ["NAMA_TOKO", "Toko ATK & Fotokopi Delina", "Nama resmi toko di header & struk"],
    ["SLOGAN_TOKO", "Lengkap, Murah & Berkah", "Slogan toko"],
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
          rekening: auth.settings.NOMOR_REKENING
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
        rates: rates,
        coupons: coupons,
        settings: safeSettings
      });
    }

    // 6. ENDPOINT DEFAULT PUBLIK (Untuk Etalase Pelanggan index.html)
    const settings = getPengaturanData(ss);
    const products = ambilDaftarProduk(ss);
    const rates = ambilDaftarTarif(ss);
    const allCoupons = getKuponData(ss);
    const activeCoupons = allCoupons.filter(c => c.status === "AKTIF");

    return createJsonResponse({
      status: "success",
      timestamp: new Date().toISOString(),
      toko: {
        nama: settings.NAMA_TOKO,
        slogan: settings.SLOGAN_TOKO,
        wa: settings.NO_WA_TOKO,
        alamat: settings.ALAMAT_TOKO,
        telegram_bot: settings.URL_TELEGRAM_BOT || "https://t.me/KikoDelinaBot",
        maps: settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Toko+Delina+ATK",
        logo: settings.URL_LOGO,
        qris: settings.URL_QRIS,
        rekening: settings.NOMOR_REKENING
      },
      products: products,
      rates: rates,
      coupons: activeCoupons
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
      if (lower.includes("tarif") || lower.includes("harga fotokopi") || lower.includes("biaya fotokopi") || lower.includes("ongkos cetak") || lower.includes("jilid")) {
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

    // 4.0b API Auto-Lookup Barcode Produk
    if (action === "lookupBarcode") {
      const barcode = String(payload.barcode || payload.code || "").trim();
      if (!barcode) {
        return createJsonResponse({ status: "error", message: "Parameter barcode wajib diisi." });
      }
      const result = prosesLookupBarcode(barcode, ss);
      return createJsonResponse(result);
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
          rekening: auth.settings.NOMOR_REKENING
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

      const data = sheetProduk.getDataRange().getValues();
      let newStock = 0;
      let found = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === prodId) {
          const current = Number(data[i][4]) || 0;
          if (payload.delta !== undefined) {
            newStock = Math.max(0, current + Number(payload.delta));
          } else {
            newStock = Math.max(0, Number(payload.stock) || 0);
          }
          sheetProduk.getRange(i + 1, 5).setValue(newStock);
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

    // 4.4 Simpan / Edit Produk ATK (Khusus Admin)
    if (action === "saveProduct") {
      const auth = validatePin(payload.pin, ss);
      if (!auth.valid || auth.role !== "admin") {
        return createJsonResponse({ status: "error", message: "Hanya Super Admin yang berhak mengelola produk." });
      }

      const sheetProduk = ss.getSheetByName(TAB_PRODUK);
      if (!sheetProduk) throw new Error("Tab Produk tidak ditemukan.");

      let imageUrl = String(payload.imageUrl || "").trim();
      if (payload.imageBase64) {
        imageUrl = saveBase64ToDriveFolder(
          payload.imageBase64,
          "Produk_" + Date.now() + "_" + (payload.imageName || "foto.jpg"),
          SUBFOLDER_PRODUK
        );
      }

      const data = sheetProduk.getDataRange().getValues();
      let prodId = String(payload.id || "").trim();
      let rowIndex = -1;

      if (prodId) {
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]).trim() === prodId) {
            rowIndex = i + 1;
            break;
          }
        }
      }

      if (rowIndex > 0) {
        if (!imageUrl) imageUrl = String(data[rowIndex - 1][6] || "");
        sheetProduk.getRange(rowIndex, 2).setValue(payload.name || "");
        sheetProduk.getRange(rowIndex, 3).setValue(payload.category || "Umum");
        sheetProduk.getRange(rowIndex, 4).setValue(Number(payload.price) || 0);
        sheetProduk.getRange(rowIndex, 5).setValue(Number(payload.stock) || 0);
        sheetProduk.getRange(rowIndex, 6).setValue(payload.unit || "Pcs");
        sheetProduk.getRange(rowIndex, 7).setValue(imageUrl);
        sheetProduk.getRange(rowIndex, 8).setValue(payload.description || "");

        return createJsonResponse({
          status: "success",
          message: `Produk "${payload.name}" berhasil diperbarui.`,
          id: prodId,
          imageUrl: imageUrl
        });
      } else {
        if (!prodId) {
          prodId = "ATK-" + String(data.length).padStart(3, "0");
        }
        const newRow = [
          prodId,
          payload.name || "Produk Baru",
          payload.category || "Umum",
          Number(payload.price) || 0,
          Number(payload.stock) || 0,
          payload.unit || "Pcs",
          imageUrl || "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500",
          payload.description || ""
        ];
        sheetProduk.appendRow(newRow);

        return createJsonResponse({
          status: "success",
          message: `Produk baru "${payload.name}" berhasil ditambahkan dengan ID ${prodId}.`,
          id: prodId,
          imageUrl: imageUrl
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
        NOMOR_REKENING: payload.NOMOR_REKENING,
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
          let extra = item.notes ? ` (Catatan: ${item.notes})` : "";
          let grosirInfo = item.isGrosir ? ` [🏷️ Grosir]` : "";
          return `${idx + 1}. ${item.name} [${item.qty}x @ Rp ${Number(item.price).toLocaleString("id-ID")}]${grosirInfo}${extra}`;
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

function ambilDaftarProduk(ss) {
  const sheetProduk = ss.getSheetByName(TAB_PRODUK);
  const produkList = [];
  if (!sheetProduk || sheetProduk.getLastRow() <= 1) return produkList;

  const data = sheetProduk.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      produkList.push({
        id: String(row[0]),
        name: String(row[1] || ""),
        category: String(row[2] || "Umum"),
        price: Number(row[3] || 0),
        stock: Number(row[4] || 0),
        unit: String(row[5] || "Pcs"),
        image: String(row[6] || ""),
        description: String(row[7] || ""),
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
  let omzetTotal = 0;
  let pesananHariIni = 0;
  let pesananMenunggu = 0;
  let pesananDiproses = 0;
  let pesananSiap = 0;
  let pesananSelesai = 0;

  orders.forEach(o => {
    const t = String(o.orderTime || "");
    const isToday = t.includes(todayIndoStr) || t.includes(todaySlashStr) || t.includes(todayDashStr);
    const statusLower = (o.orderStatus || "").toLowerCase();
    const isBatal = statusLower.includes("batal");

    if (isToday) {
      pesananHariIni++;
      if (!isBatal) {
        omzetHariIni += (Number(o.total) || 0);
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

  const lowStockProducts = products.filter(p => Number(p.stock) <= 3);

  return {
    omzetHariIni: omzetHariIni,
    omzetTotal: omzetTotal,
    pesananHariIni: pesananHariIni,
    pesananMenunggu: pesananMenunggu,
    pesananDiproses: pesananDiproses,
    pesananSiap: pesananSiap,
    pesananSelesai: pesananSelesai,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.slice(0, 10),
    totalProduk: products.length,
    totalPesanan: orders.length
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

    const systemPrompt = `Kamu adalah "Kiko", asisten AI virtual resmi Toko Online ATK dan Jasa Fotokopi Delina.
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
        { text: "🖨️ Info Tarif Fotokopi" },
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

    return file.getUrl();
  } catch (err) {
    Logger.log("Error saat menyimpan file ke Drive: " + err.toString());
    return "Gagal simpan file: " + err.toString();
  }
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
  const data = sheetProduk.getDataRange().getValues();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isFotokopi || String(item.id).startsWith("FOTO-")) continue;

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][0]) === String(item.id)) {
        const currentStock = Number(data[r][4]) || 0;
        const newStock = Math.max(0, currentStock - Number(item.qty));
        sheetProduk.getRange(r + 1, 5).setValue(newStock);
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
 * 8. AUTO-LOOKUP BARCODE PRODUK (OPEN FOOD FACTS + GEMINI AI FALLBACK)
 * =========================================================================
 */
function prosesLookupBarcode(barcode, ss) {
  if (!barcode) {
    return { status: "error", message: "Barcode tidak valid." };
  }
  const cleanBarcode = String(barcode).trim();
  const cleanBarcodeUpper = cleanBarcode.toUpperCase();

  // 1. Cek di Tab 'Produk' Google Sheets
  const sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (sheetProduk && sheetProduk.getLastRow() > 1) {
    const data = sheetProduk.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][0] || "").trim().toUpperCase();
      const rowName = String(data[i][1] || "").trim();
      if (rowId === cleanBarcodeUpper || rowId.replace(/[^A-Z0-9]/g, "") === cleanBarcodeUpper.replace(/[^A-Z0-9]/g, "")) {
        return {
          status: "existing",
          message: "Produk sudah terdaftar di toko.",
          product: {
            id: data[i][0],
            name: rowName,
            category: data[i][2] || "Alat Tulis & Pulpen",
            price: Number(data[i][3]) || 0,
            stock: Number(data[i][4]) || 0,
            unit: data[i][5] || "Pcs",
            image: data[i][6] || "",
            description: data[i][7] || ""
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
            return {
              status: "success",
              isNew: true,
              source: "OpenFoodFacts",
              nama: fullTitle.trim(),
              kategori: mapKategoriProduk(p.categories || fullTitle),
              satuan: "Pcs",
              fotoUrl: imgUrl
            };
          }
        }
      }
    } catch (errOff) {
      Logger.log("Open Food Facts fetch error: " + errOff.toString());
    }
  }

  // 2b. Cek ke UPCitemdb Retail Database (Untuk Barang Retail & Supermarket)
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
            return {
              status: "success",
              isNew: true,
              source: "UPCitemdb",
              nama: item.title.trim(),
              kategori: mapKategoriProduk(item.category || item.title),
              satuan: "Pcs",
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
    "8992388": { brand: "Sinar Dunia (SiDu)", category: "Kertas & Buku", sample: "Buku Tulis Sinar Dunia 38 Lembar" },
    "8998866": { brand: "Indofood", category: "Snack & Minuman", sample: "Indomie Mi Goreng Original" },
    "8992745": { brand: "Standard Pen", category: "Alat Tulis & Pulpen", sample: "Pulpen Standard AE7 0.5mm" },
    "8991389": { brand: "Snowman", category: "Alat Tulis & Pulpen", sample: "Spidol Snowman Boardmarker Hitam" },
    "8996001": { brand: "Danone Aqua", category: "Snack & Minuman", sample: "Air Mineral Aqua 600ml" },
    "8992775": { brand: "Sosro", category: "Snack & Minuman", sample: "Teh Botol Sosro 350ml" },
    "8991001": { brand: "Mayora", category: "Snack & Minuman", sample: "Biskuit Roma Kelapa Mayora" },
    "8999999": { brand: "Joyko", category: "Alat Tulis & Pulpen", sample: "Alat Tulis Joyko" },
    "8993175": { brand: "Kenko", category: "Alat Tulis & Pulpen", sample: "Perlengkapan Kantor Kenko" },
    "8992759": { brand: "PaperOne", category: "Kertas & Buku", sample: "Kertas HVS PaperOne A4 75gsm" },
    "8993005": { brand: "Wings Food", category: "Snack & Minuman", sample: "Mie Sedaap Goreng" },
    "8992999": { brand: "Faber-Castell", category: "Alat Tulis & Pulpen", sample: "Pensil 2B Faber-Castell" }
  };
  const prefix7 = cleanBarcode.substring(0, 7);
  const matchedBrand = indonesianBrands[prefix7];

  // 4. Fallback AI: Gemini API (Model Aktif: gemini-3.5-flash & gemini-3.1-flash-lite)
  try {
    const props = PropertiesService.getScriptProperties();
    const geminiApiKey = props.getProperty("GEMINI_API_KEY");
    if (geminiApiKey) {
      let promptAI = "";
      if (matchedBrand) {
        promptAI = `Barcode: ${cleanBarcode} adalah produk resmi dari ${matchedBrand.brand} (${matchedBrand.category}). Sebutkan nama spesifik item ini di Indonesia (misal tipe / varian). Kembalikan HANYA format JSON: {"nama": "...", "kategori": "${matchedBrand.category}", "satuan": "Pcs"}.`;
      } else {
        promptAI = `Sebutkan nama lengkap produk dagang Indonesia dan merek dari barcode ${cleanBarcode}. Jangan menyebut Indomie jika bukan dari Indofood. Kembalikan HANYA format JSON: {"nama": "...", "kategori": "...", "satuan": "Pcs"}.`;
      }
      
      const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
      for (let m = 0; m < models.length; m++) {
        const modelName = models[m];
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
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed && parsed.nama) {
                  // Validasi anti halusinasi
                  if (matchedBrand && parsed.nama.toLowerCase().includes("indomie") && !matchedBrand.brand.toLowerCase().includes("indofood")) {
                    parsed.nama = matchedBrand.sample;
                    parsed.kategori = matchedBrand.category;
                  }
                  return {
                    status: "success",
                    isNew: true,
                    source: "GeminiAI",
                    nama: parsed.nama.trim(),
                    kategori: mapKategoriProduk(parsed.kategori || (matchedBrand ? matchedBrand.category : parsed.nama)),
                    satuan: parsed.satuan || "Pcs",
                    fotoUrl: getDefaultPhotoForCategory(parsed.kategori || (matchedBrand ? matchedBrand.category : ""), parsed.nama)
                  };
                }
              } catch (eParse) {
                Logger.log("JSON parse error: " + eParse.toString());
              }
            }
          }
        }
      }
    }
  } catch (errAi) {
    Logger.log("Gemini lookup error: " + errAi.toString());
  }

  // 5. Jika AI gagal, gunakan database merek GS1 Indonesia
  if (matchedBrand) {
    return {
      status: "success",
      isNew: true,
      source: "GS1-Indonesia",
      nama: `${matchedBrand.sample}`,
      kategori: matchedBrand.category,
      satuan: "Pcs",
      fotoUrl: getDefaultPhotoForCategory(matchedBrand.category, matchedBrand.sample)
    };
  }

  // 6. Fallback Default jika tidak terdeteksi di API
  return {
    status: "success",
    isNew: true,
    source: "default",
    nama: `Barang ATK Baru (${cleanBarcode})`,
    kategori: "Alat Tulis & Pulpen",
    satuan: "Pcs",
    fotoUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500"
  };
}

function mapKategoriProduk(rawCategory) {
  const cat = String(rawCategory || "").toLowerCase();
  if (cat.includes("buku") || cat.includes("kertas") || cat.includes("paper") || cat.includes("book") || cat.includes("binder") || cat.includes("notes") || cat.includes("hvs") || cat.includes("folio")) {
    return "Kertas & Buku";
  }
  if (cat.includes("pulpen") || cat.includes("pen") || cat.includes("pencil") || cat.includes("pensil") || cat.includes("spidol") || cat.includes("marker") || cat.includes("crayon") || cat.includes("stabilo") || cat.includes("eraser") || cat.includes("penghapus") || cat.includes("tipp-ex")) {
    return "Alat Tulis & Pulpen";
  }
  if (cat.includes("map") || cat.includes("folder") || cat.includes("stapler") || cat.includes("kantor") || cat.includes("office") || cat.includes("gunting") || cat.includes("cutter") || cat.includes("lem") || cat.includes("glue") || cat.includes("lakban") || cat.includes("tape") || cat.includes("penggaris")) {
    return "Peralatan Kantor & Map";
  }
  if (cat.includes("snack") || cat.includes("makanan") || cat.includes("minuman") || cat.includes("food") || cat.includes("beverage") || cat.includes("noodle") || cat.includes("nouilles") || cat.includes("indomie") || cat.includes("biskuit") || cat.includes("kopi") || cat.includes("teh") || cat.includes("candy") || cat.includes("permen") || cat.includes("cokelat") || cat.includes("wafer")) {
    return "Snack & Minuman";
  }
  return "Alat Tulis & Pulpen";
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
