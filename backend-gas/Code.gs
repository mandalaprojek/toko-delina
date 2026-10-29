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

      // 1. Menu Cek Status Nota
      if (cbData === "menu_cek_nota") {
        answerCallbackQuery(cb.id, "Ketik /cek [No_Nota]");
        const infoMsg = `📦 *Cara Cek Status Pesanan Toko Delina:*\n\nSilakan ketik */cek [Nomor_Nota]* atau kirim langsung nomor nota kakak.\n\nContoh:\n\`/cek #DLN-2026-9429\``;
        kirimPesanTelegram(fromChatId, infoMsg);
        return HtmlService.createHtmlOutput("OK");
      }

      // 2. Menu Info Tarif Fotokopi & Jilid
      if (cbData === "menu_tarif") {
        answerCallbackQuery(cb.id, "Memuat daftar tarif...");
        const rates = ambilDaftarTarif(ss);
        let tarifMsg = `🖨️ *DAFTAR TARIF FOTOKOPI & JILID DELINA:*\n====================================\n`;
        for (const k in rates) {
          tarifMsg += `• ${rates[k].nama} : *Rp ${Number(rates[k].harga).toLocaleString("id-ID")}*\n`;
        }
        tarifMsg += `\n_Kakak bisa langsung unggah file PDF/Word di website kami tanpa antre! Barakallahu fiik._`;
        kirimPesanTelegram(fromChatId, tarifMsg);
        return HtmlService.createHtmlOutput("OK");
      }

      // 3. Admin Aksi: Verifikasi Lunas
      if (cbData.startsWith("verify_")) {
        const orderId = cbData.replace("verify_", "").trim();
        const updated = updateOrderStatusDiSheet(ss, orderId, "Sedang Diproses (Lunas)");
        if (updated) {
          answerCallbackQuery(cb.id, `Nota ${orderId} diverifikasi Lunas!`);
          kirimPesanTelegram(fromChatId, `✅ *Alhamdulillah!* Nota *${orderId}* telah diverifikasi *Lunas & Sedang Diproses* oleh Admin.`);
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
          kirimPesanTelegram(fromChatId, `📦 *Alhamdulillah!* Nota *${orderId}* telah diubah statusnya menjadi *Siap Diambil di Toko*.`);
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

      // A. Perintah /start atau Salam Pembuka: Menu Interaktif Inline Keyboard
      const isStart = userText === "/start";
      const isGreeting = (userText.toLowerCase().startsWith("assalamu") && userText.length < 35);

      if (isStart || isGreeting) {
        const welcomeText = `Assalamu'alaikum Warahmatullahi Wabarakatuh! 🌟\n\nSelamat datang di Bot Resmi *Toko ATK dan Fotokopi Delina*.\nSaya *Kiko*, asisten virtual toko yang siap melayani kakak 24 jam.\n\nSilakan pilih menu layanan di bawah ini atau tanyakan langsung kebutuhan ATK kakak:`;

        const webAppStoreUrl = "https://mandalaprojek.github.io/toko-delina/";
        const mapsUrl = settings.URL_GOOGLE_MAPS || "https://maps.google.com/?q=Toko+Delina+ATK";

        const inlineMenu = {
          inline_keyboard: [
            [
              { text: "🛍️ Buka Toko Delina (Web)", url: webAppStoreUrl }
            ],
            [
              { text: "📦 Cek Status Nota", callback_data: "menu_cek_nota" },
              { text: "🖨️ Info Tarif Fotokopi", callback_data: "menu_tarif" }
            ],
            [
              { text: "📍 Lokasi Toko di Google Maps", url: mapsUrl }
            ]
          ]
        };

        kirimPesanTelegram(chatId, welcomeText, inlineMenu);
        return HtmlService.createHtmlOutput("OK");
      }

      // B. Perintah Cek Status / Resi Pesanan (/cek [Nota] atau format #DLN-...)
      const matchNota = userText.match(/#?DLN-[\w-]+/i);
      const isCekCommand = userText.toLowerCase().startsWith("/cek");

      if (isCekCommand || matchNota) {
        let queryNota = "";
        if (matchNota) {
          queryNota = matchNota[0];
        } else {
          queryNota = userText.replace(/\/cek/i, "").trim();
        }

        if (!queryNota) {
          kirimPesanTelegram(chatId, "📦 Silakan cantumkan nomor nota kakak. Contoh: `/cek #DLN-2026-9429`");
          return HtmlService.createHtmlOutput("OK");
        }

        const order = cariPesananDiSheet(ss, queryNota);
        if (order) {
          // Tentukan Badge Pembayaran yang Kontras
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
====================================
📋 *No. Nota:* \`${order.orderId}\`
👤 *Nama Pelanggan:* ${order.customerName}
📅 *Waktu Pesanan:* ${order.orderTime}
🚚 *Pengambilan:* ${order.deliveryMethod}
📍 *Alamat:* ${order.customerAddress || "-"}

💳 *Metode Bayar:* *${badgePembayaran}*
📊 *Status Pesanan:* *${order.orderStatus}*

📦 *Rincian Item:*
${order.itemsText}

💰 *Total Tagihan:* *Rp ${Number(order.total).toLocaleString("id-ID")}*
====================================
_Jazakumullah Khairan Katsiran atas amanah dan kepercayaannya di Toko Delina. Barakallahu fiik._`;

          kirimPesanTelegram(chatId, statusMsg);
        } else {
          kirimPesanTelegram(chatId, `Afwan kak, pesanan dengan nota *${queryNota}* belum kami temukan di sistem database Google Sheets Toko Delina.\n\nPastikan nomor nota sudah tepat (contoh: \`#DLN-2026-9429\`) nggih kak. Barakallahu fiik.`);
        }
        return HtmlService.createHtmlOutput("OK");
      }

      // C. Perintah Cek Status Kunci / Backend
      if (userText === "/status") {
        const props = PropertiesService.getScriptProperties();
        const geminiKey = props.getProperty("GEMINI_API_KEY");
        const statusAI = geminiKey ? "✅ Terpasang (Google Gemini API)" : "ℹ️ Fallback Cerdas (Database Google Sheets)";
        const statusMsg = `📊 *Status Asisten Kiko Toko Delina*:\n- Koneksi AI: ${statusAI}\n- Chat ID Telegram: \`${chatId}\`\n- Layanan: Cek Stok ATK, Tarif Fotokopi, dan Info Toko.\n\nSilakan ajukan pertanyaan kakak nggih! _Barakallahu fiik._`;
        kirimPesanTelegram(chatId, statusMsg);
        return HtmlService.createHtmlOutput("OK");
      }

      // D. Percakapan AI Kiko
      const jawabanAI = tanyaKikoAI(userText, "Telegram");
      kirimPesanTelegram(chatId, jawabanAI);
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
  const todaySlash = Utilities.formatDate(now, "Asia/Jakarta", "dd/MM/yyyy");
  const todayDash = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");

  let omzetHariIni = 0;
  let pesananHariIni = 0;
  let pesananMenunggu = 0;

  orders.forEach(o => {
    const t = String(o.orderTime || "");
    const isToday = t.includes(todaySlash) || t.includes(todayDash);
    if (isToday) {
      pesananHariIni++;
      const statusLower = (o.orderStatus || "").toLowerCase();
      if (!statusLower.includes("batal")) {
        omzetHariIni += (o.total || 0);
      }
    }
    const st = (o.orderStatus || "").toLowerCase();
    if (st.includes("menunggu") || st.includes("verifikasi")) {
      pesananMenunggu++;
    }
  });

  const lowStockProducts = products.filter(p => p.stock <= 3);

  return {
    omzetHariIni: omzetHariIni,
    pesananHariIni: pesananHariIni,
    pesananMenunggu: pesananMenunggu,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.slice(0, 10),
    totalProduk: products.length,
    totalPesanan: orders.length
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

    const systemPrompt = `Kamu adalah "Kiko", asisten AI virtual resmi Toko Online ATK dan Fotokopi Delina.
Sifatmu: Sangat santun, ramah, beradab Islami, amanah, dan jujur.

Pedoman Menjawab:
1. Awali atau balas salam pelanggan dengan penuh kehangatan ("Assalamu'alaikum Warahmatullahi Wabarakatuh" atau "Wa'alaikumsalam Warahmatullahi Wabarakatuh").
2. Gunakan panggilan santun seperti "kak", "bapak/ibu".
3. Berikan informasi ketersediaan stok & harga SECARA JUJUR dan HANYA berdasarkan Data Katalog Toko Delina di bawah. JANGAN PERNAH mengarang harga atau stok yang tidak tercantum!
4. Jika stok barang tersedia, sebutkan nama, harga, dan sisa stoknya.
5. Jika barang tidak ada atau stoknya 0, sampaikan permohonan maaf dengan santun ("Afwan kak, saat ini barang tersebut belum tersedia...") dan tawarkan produk sejenis jika ada.
6. Untuk layanan fotokopi, jelaskan bahwa toko melayani cetak Hitam-Putih, Berwarna, Jilid Lakban, dan Jilid Spiral, serta bisa langsung upload file dokumen di website tanpa perlu antre.
7. Akhiri jawaban dengan doa keberkahan (misalnya: "Semoga berkah dan lancar selalu urusannya nggih kak", "Barakallahu fiik").

DATA KATALOG ATK TOKO DELINA REAL-TIME:
${contextKatalog}

DATA TARIF JASA FOTOKOPI & CETAK:
${contextTarif}

Saluran pelanggan saat ini: ${sumber || "Web"}. Jawablah secara ringkas, padat, dan nyaman dibaca di layar HP.`;

    if (!geminiApiKey) {
      return fallbackKikoLocal(pesanUser, daftarStok);
    }

    const models = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest"];
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
    return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak. Kiko siap melayani kebutuhan ATK dan fotokopi di Toko Delina. Boleh disebutkan barang yang sedang kakak butuhkan? Barakallahu fiik.";
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
    if (q.includes("assalamu") || q.includes("halo") || q.includes("hai") || q.includes("pagi") || q.includes("siang") || q.includes("sore") || q.includes("malam")) {
      return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Selamat datang di Toko ATK & Fotokopi Delina. Saya Kiko, asisten toko yang siap melayani kakak.\n\nAda kebutuhan ATK (kertas HVS, buku, pulpen, map) atau jasa fotokopi/jilid yang bisa Kiko bantu cekkan ketersediaannya hari ini? Barakallahu fiik.";
    }
    return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Kiko siap membantu cek stok perlengkapan ATK dan hitung estimasi biaya fotokopi di Toko Delina.\n\nBoleh disebutkan nama barang yang kakak cari? InsyaAllah Kiko bantu cekkan.";
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
    const daftarItemTampil = hasilCocok.slice(0, 3).map(h => h.itemStr).join("\n");
    return `Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Alhamdulillah untuk produk yang kakak tanyakan tersedia di Toko Delina:\n\n${daftarItemTampil}\n\nSemua barang siap diorder langsung melalui website kami. Ada yang ingin ditambahkan lagi kak? Barakallahu fiik.`;
  }

  const kataKunci = cleanWords.join(" ");
  return `Wa'alaikumsalam Warahmatullahi Wabarakatuh kak. Afwan, untuk "${kataKunci}" saat ini belum Kiko temukan di etalase toko Delina.\n\nApakah ada kebutuhan ATK lainnya atau jasa fotokopi yang bisa Kiko bantu cekkan nggih? Barakallahu fiik.`;
}

/**
 * =========================================================================
 * 6. INTEGRASI TELEGRAM BOT, INLINE KEYBOARD & NOTIFIKASI
 * =========================================================================
 */
function kirimPesanTelegram(chatId, pesan, replyMarkup) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken || !chatId) return;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = { chat_id: chatId, text: pesan, parse_mode: "Markdown" };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

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

  const notifMsg = `🔔 *BISMILLAH, ADA PESANAN BARU MASUK!*
====================================
📋 *No. Nota:* \`${payload.orderId}\`
👤 *Nama:* ${payload.customerName}
📱 *WhatsApp:* \`${payload.customerPhone}\`
🚚 *Metode:* ${payload.deliveryMethod}
📍 *Alamat:* ${payload.customerAddress || "-"}

💳 *Metode Pembayaran:* *${badgePayment}*
💰 *Total Tagihan:* *Rp ${Number(payload.totalAkhir).toLocaleString("id-ID")}*${couponText}

📦 *Rincian Belanja:*
${itemsList}

📄 *Dokumen Fotokopi:* ${linkDokumen !== "-" ? linkDokumen : "Tidak ada berkas"}
💳 *Bukti Transfer:* ${linkBukti !== "-" ? linkBukti : "Belum diunggah"}
====================================
_Silakan klik tombol di bawah untuk proses cepat dari Telegram:_`;

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
