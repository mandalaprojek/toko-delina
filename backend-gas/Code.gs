/**
 * =========================================================================
 * BACKEND TOKO DELINA (Google Apps Script - Code.gs)
 * Marketplace ATK & Jasa Fotokopi - Arsitektur Serverless 100% Gratis
 * =========================================================================
 * 
 * Fitur:
 * 1. setupDatabaseOtomatis() : Sekali klik untuk membuat & mengisi seluruh tab database.
 * 2. tanyaKikoAI()          : Otak AI Kiko beradab Islami (Gemini API + Konteks Stok Live).
 * 3. doGet(e)               : Menyediakan API JSON untuk katalog produk & tarif fotokopi.
 * 4. doPost(e)              : Multi-Router (Pesanan Web, Chat Kiko Web, & Webhook Telegram 24 Jam).
 * 5. Notifikasi Telegram    : Kirim rincian nota & bukti bayar otomatis ke HP Pemilik Toko.
 * 6. simpanKunciRahasia()   : Simpan Gemini Key, Telegram Token, & Admin Chat ID secara aman.
 * 7. setTelegramWebhook()   : Daftarkan Web App ini ke Bot Telegram secara otomatis.
 */

// Konstanta Nama Tab Spreadsheet
const TAB_PRODUK = "Produk";
const TAB_PESANAN = "Pesanan";
const TAB_TARIF = "Tarif_Fotokopi";

// Konstanta Nama Folder Google Drive Penyimpanan
const FOLDER_UTAMA = "Toko Delina - Berkas Pelanggan";
const SUBFOLDER_FOTOKOPI = "Dokumen_Fotokopi";
const SUBFOLDER_BUKTI = "Bukti_Pembayaran";

/**
 * =========================================================================
 * 0. HELPER PENGELOLA SPREADSHEET (STANDALONE & BOUND COMPATIBLE)
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
 * =========================================================================
 * 1. FUNGSI SETUP OTOMATIS (JALANKAN SEKALI DARI EDITOR GAS / CLASP RUN)
 * =========================================================================
 */
function setupDatabaseOtomatis() {
  const ss = getDelinaSpreadsheet();

  // --- A. Siapkan Tab Produk ---
  let sheetProduk = ss.getSheetByName(TAB_PRODUK);
  if (!sheetProduk) {
    sheetProduk = ss.insertSheet(TAB_PRODUK);
  }
  sheetProduk.clear();

  const headerProduk = [
    ["ID", "Nama", "Kategori", "Harga", "Stok", "Satuan", "URL_Foto", "Deskripsi"]
  ];
  sheetProduk.getRange(1, 1, 1, headerProduk[0].length).setValues(headerProduk);
  formatHeaderSheet(sheetProduk, headerProduk[0].length);

  // Data Contoh Awal Produk ATK
  const sampleProduk = [
    ["ATK-001", "Kertas HVS PaperOne A4 75gsm (1 Rim / 500 Lembar)", "Kertas & Buku", 48000, 85, "Rim", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60", "Kertas HVS putih bersih berkualitas tinggi untuk print dan fotokopi."],
    ["ATK-002", "Buku Tulis Sinar Dunia (SiDu) Kiky 38 Lembar - Pack Isi 10 Buku", "Kertas & Buku", 36500, 40, "Pack", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60", "Buku tulis bergaris standar sekolah dan kuliah."],
    ["ATK-003", "Pulpen Gel Zebra Sarasa Clip 0.5mm Hitam / Biru Tinta Pekat", "Alat Tulis & Pulpen", 15500, 120, "Pcs", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60", "Pulpen gel berkualitas dengan tinta cepat kering."],
    ["ATK-004", "Paket Pulpen Standard AE7 0.5 Hitam (1 Lusin / 12 Batang)", "Alat Tulis & Pulpen", 24000, 65, "Lusin", "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500&auto=format&fit=crop&q=60", "Pulpen sejuta umat, awet dan nyaman untuk menulis harian."],
    ["ATK-005", "Map Folder Plastik L Document Bag Clear Holder F4 Folio", "Peralatan Kantor & Map", 6500, 200, "Pcs", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60", "Map plastik L transparan untuk menyimpan dokumen rapi dan bebas basah."],
    ["ATK-006", "Stapler Joyko HD-10 + Isi Ulang Staples No. 10 (Set Lengkap)", "Peralatan Kantor & Map", 18500, 50, "Set", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=60", "Stapler Joyko kuat include isi staples isi 1000 pcs."],
    ["ATK-007", "Kertas Double Folio Bergaris Merk Sinar Dunia (1 Pack / 100 Lembar)", "Kertas & Buku", 19500, 75, "Pack", "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=60", "Kertas double folio untuk ujian, laporan, dan administrasi."],
    ["ATK-008", "Tipe-X Kertas Kering Joyko Correction Tape CT-522 (Panjang 12m)", "Alat Tulis & Pulpen", 9000, 90, "Pcs", "https://images.unsplash.com/photo-1585336261026-6218f2705574?w=500&auto=format&fit=crop&q=60", "Koreksi pita kertas kering tanpa bau dan langsung bisa ditulis ulang."]
  ];
  sheetProduk.getRange(2, 1, sampleProduk.length, sampleProduk[0].length).setValues(sampleProduk);
  sheetProduk.autoResizeColumns(1, headerProduk[0].length);

  // --- B. Siapkan Tab Pesanan ---
  let sheetPesanan = ss.getSheetByName(TAB_PESANAN);
  if (!sheetPesanan) {
    sheetPesanan = ss.insertSheet(TAB_PESANAN);
  }
  sheetPesanan.clear();

  const headerPesanan = [
    [
      "ID_Nota",
      "Waktu",
      "Nama_Pembeli",
      "WhatsApp",
      "Metode_Ambil",
      "Alamat",
      "Rincian_Item",
      "Total_Bayar",
      "Link_File_Fotokopi",
      "Link_Bukti_Bayar",
      "Status_Pesanan"
    ]
  ];
  sheetPesanan.getRange(1, 1, 1, headerPesanan[0].length).setValues(headerPesanan);
  formatHeaderSheet(sheetPesanan, headerPesanan[0].length);
  sheetPesanan.autoResizeColumns(1, headerPesanan[0].length);

  // --- C. Siapkan Tab Tarif Fotokopi ---
  let sheetTarif = ss.getSheetByName(TAB_TARIF);
  if (!sheetTarif) {
    sheetTarif = ss.insertSheet(TAB_TARIF);
  }
  sheetTarif.clear();

  const headerTarif = [
    ["Kode_Layanan", "Nama_Layanan", "Harga_Satuan"]
  ];
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

  // --- D. Siapkan Folder Google Drive ---
  getOrCreateFolder(FOLDER_UTAMA);

  // --- E. Siapkan Slot Script Properties Otomatis ---
  inisialisasiSlotScriptProperties();

  const infoMsg = "Alhamdulillah! Database Toko Delina berhasil disiapkan.\nURL Spreadsheet: " + ss.getUrl();
  Logger.log(infoMsg);
  return infoMsg;
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
 * 2. ENDPOINT API: doGet(e) - PENGAMBIL DATA PRODUK & TARIF
 * =========================================================================
 */
function doGet(e) {
  try {
    inisialisasiSlotScriptProperties();

    if (e && e.parameter && e.parameter.action === "cekStatus") {
      return createJsonResponse({
        status: "success",
        data: cekStatusKunci()
      });
    }

    const ss = getDelinaSpreadsheet();
    const sheetProduk = ss.getSheetByName(TAB_PRODUK);
    const sheetTarif = ss.getSheetByName(TAB_TARIF);

    // 1. Baca Data Produk
    const produkList = [];
    if (sheetProduk && sheetProduk.getLastRow() > 1) {
      const dataProduk = sheetProduk.getDataRange().getValues();
      for (let i = 1; i < dataProduk.length; i++) {
        const row = dataProduk[i];
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
    }

    // 2. Baca Data Tarif Fotokopi
    const tarifList = {};
    if (sheetTarif && sheetTarif.getLastRow() > 1) {
      const dataTarif = sheetTarif.getDataRange().getValues();
      for (let j = 1; j < dataTarif.length; j++) {
        const row = dataTarif[j];
        if (row[0]) {
          tarifList[row[0]] = {
            nama: String(row[1]),
            harga: Number(row[2])
          };
        }
      }
    }

    const response = {
      status: "success",
      timestamp: new Date().toISOString(),
      toko: "Toko ATK & Fotokopi Delina",
      products: produkList,
      rates: tarifList
    };

    return createJsonResponse(response);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Gagal mengambil data dari Google Sheets: " + error.toString()
    });
  }
}

/**
 * =========================================================================
 * 3. OTAK AI KIKO BERADAB ISLAMI (GEMINI API + KONTEKS STOK LIVE)
 * =========================================================================
 */
function tanyaKikoAI(pesanUser, sumber) {
  try {
    const props = PropertiesService.getScriptProperties();
    const geminiApiKey = props.getProperty("GEMINI_API_KEY");

    // 1. Ambil data stok terkini dari Google Sheets
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

    // 2. Rancang Prompt Sistem Beradab Islami
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

    // 3. Jika API Key Gemini belum dipasang, gunakan fallback cerdas berbasis database
    if (!geminiApiKey) {
      return fallbackKikoLocal(pesanUser, daftarStok);
    }

    // 4. Panggil Google Gemini API (Gunakan model resmi terkini: gemini-3.8-flash, gemini-3.5-flash, gemini-flash-latest)
    const models = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    for (let m = 0; m < models.length; m++) {
      const modelName = models[m];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt + "\n\nPertanyaan Pelanggan: " + pesanUser }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800
        }
      };

      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      try {
        const res = UrlFetchApp.fetch(url, options);
        const resCode = res.getResponseCode();

        if (resCode === 200) {
          const json = JSON.parse(res.getContentText());
          if (
            json.candidates &&
            json.candidates[0] &&
            json.candidates[0].content &&
            json.candidates[0].content.parts &&
            json.candidates[0].content.parts[0]
          ) {
            return json.candidates[0].content.parts[0].text;
          }
        } else {
          Logger.log(`Gemini API (${modelName}) Notice [${resCode}]: ` + res.getContentText());
        }
      } catch (eFetch) {
        Logger.log(`Fetch error on ${modelName}: ` + eFetch.toString());
      }
    }

    // Fallback jika kuota / response API belum sesuai
    return fallbackKikoLocal(pesanUser, daftarStok);

  } catch (err) {
    Logger.log("Error pada tanyaKikoAI: " + err.toString());
    return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak. Afwan, Kiko sedang mengoreksi data stok sebentar. Silakan tanyakan kembali atau hubungi WhatsApp Toko Delina nggih. Barakallahu fiik.";
  }
}

/**
 * Fallback Cerdas Kiko (Beradab Islami & Pencocokan Live Database)
 */
function fallbackKikoLocal(pesanUser, daftarStok) {
  const raw = pesanUser || "";
  const q = raw.toLowerCase().trim();

  // 1. Ekstrak apakah ada pertanyaan tentang fotokopi / cetak / jilid
  const isFotokopi = q.includes("fotokopi") || q.includes("cetak") || q.includes("print") || q.includes("jilid") || q.includes("laminating");
  if (isFotokopi) {
    return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak!\n\nUntuk rincian tarif Jasa Cetak & Fotokopi di Toko Delina:\n- Fotokopi / Print Hitam-Putih A4: Rp 250 / lembar\n- Fotokopi / Print Berwarna A4: Rp 1.000 / lembar\n- Jilid Lakban Biasa: Rp 4.000 / buku\n- Jilid Spiral Kawat/Plastik: Rp 10.000 / buku\n\nKakak bisa langsung hitung estimasi biaya & upload file dokumen di website tanpa perlu antre nggih. Ada yang ingin dicetak kak? Barakallahu fiik.";
  }

  // 2. Bersihkan kata-kata sapaan dan kata sambung umum
  const stopWords = [
    "assalamu'alaikum", "assalamualaikum", "wa'alaikumsalam", "assalamu", "alaikum",
    "halo", "hai", "selamat", "pagi", "siang", "sore", "malam",
    "kak", "kakak", "min", "admin", "kiko", "toko", "delina",
    "apakah", "ada", "ready", "stok", "punya", "harga", "berapa",
    "jual", "mau", "beli", "pesan", "order", "tolong", "cek", "cekkan",
    "nggih", "ya", "yah", "dong", "gan", "bro", "mas", "mbak", "bisa", "kah"
  ];

  // Tokenize & ambil kata kunci pencarian
  let cleanWords = q
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.includes(w));

  // 3. Jika setelah disaring tidak ada nama produk (murni sapaan / salam saja)
  if (cleanWords.length === 0) {
    if (q.includes("assalamu") || q.includes("halo") || q.includes("hai") || q.includes("pagi") || q.includes("siang") || q.includes("sore") || q.includes("malam")) {
      return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Selamat datang di Toko ATK & Fotokopi Delina. Saya Kiko, asisten toko yang siap melayani kakak.\n\nAda kebutuhan ATK (kertas HVS, buku, pulpen, map) atau jasa fotokopi/jilid yang bisa Kiko bantu cekkan ketersediaannya hari ini? Barakallahu fiik.";
    }
    return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Kiko siap membantu cek stok perlengkapan ATK dan hitung estimasi biaya fotokopi di Toko Delina.\n\nBoleh disebutkan nama barang yang kakak cari? (Contoh: 'ada Kertas HVS A4?' atau 'harga pulpen Standard'). InsyaAllah Kiko bantu cekkan.";
  }

  // 4. Cari produk yang cocok di daftar stok
  let hasilCocok = [];
  for (let i = 0; i < daftarStok.length; i++) {
    const itemStr = daftarStok[i];
    const itemLower = itemStr.toLowerCase();
    
    let matchScore = 0;
    for (let j = 0; j < cleanWords.length; j++) {
      if (itemLower.includes(cleanWords[j])) {
        matchScore++;
      }
    }
    if (matchScore > 0) {
      hasilCocok.push({ itemStr: itemStr, score: matchScore });
    }
  }

  // Urutkan dari yang paling relevan
  hasilCocok.sort((a, b) => b.score - a.score);

  if (hasilCocok.length > 0) {
    const daftarItemTampil = hasilCocok.slice(0, 3).map(h => h.itemStr).join("\n");
    return `Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Alhamdulillah untuk produk yang kakak tanyakan tersedia di Toko Delina:\n\n${daftarItemTampil}\n\nSemua barang siap diorder langsung melalui website kami. Ada yang ingin ditambahkan lagi kak? Barakallahu fiik.`;
  }

  // 5. Jika barang tidak ada di etalase
  const kataKunci = cleanWords.join(" ");
  return `Wa'alaikumsalam Warahmatullahi Wabarakatuh kak. Afwan, untuk "${kataKunci}" saat ini belum Kiko temukan di etalase toko Delina.\n\nApakah ada kebutuhan ATK lainnya (kertas HVS, buku, pulpen, map) atau jasa fotokopi yang bisa Kiko bantu cekkan nggih? Barakallahu fiik.`;
}

/**
 * =========================================================================
 * 4. ENDPOINT API: doPost(e) - MULTI-ROUTER
 * =========================================================================
 * Menangani 3 Jalur Sekaligus:
 * 1. Webhook Bot Telegram (pesan masuk dari @KikoDelinaBot)
 * 2. Chat Web Widget Kiko (action: "chatKiko")
 * 3. Transaksi Pesanan Web (simpan file Drive + catat sheet + notif Telegram)
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

    // =========================================================
    // JALUR 1: PESAN MASUK DARI WEBHOOK TELEGRAM
    // =========================================================
    if (payload.message && payload.message.text && payload.message.chat) {
      const chatId = payload.message.chat.id;
      const userText = payload.message.text;

      if (userText === "/start") {
        const welcome = "Assalamu'alaikum Warahmatullahi Wabarakatuh! 🌟\n\nSelamat datang di Bot Resmi *Toko ATK dan Fotokopi Delina*.\nSaya *Kiko*, asisten virtual yang siap melayani kakak 24 jam.\n\nKakak bisa tanya stok kertas, pulpen, buku, peralatan kantor, atau tarif fotokopi kilat kapan saja.\n\nAda yang bisa Kiko bantu hari ini? _Barakallahu fiik._";
        kirimPesanTelegram(chatId, welcome);
      } else if (userText === "/status" || userText === "/cek") {
        const props = PropertiesService.getScriptProperties();
        const geminiKey = props.getProperty("GEMINI_API_KEY");
        const statusAI = geminiKey ? "✅ Terpasang (Google Gemini API)" : "ℹ️ Fallback Cerdas (Database Google Sheets)";
        const statusMsg = `📊 *Status Asisten Kiko Toko Delina*:\n- Koneksi AI: ${statusAI}\n- Chat ID Telegram: \`${chatId}\`\n- Layanan: Tanya Stok ATK, Tarif Fotokopi, dan Info Toko.\n\nSilakan ajukan pertanyaan kakak nggih! _Barakallahu fiik._`;
        kirimPesanTelegram(chatId, statusMsg);
      } else {
        const jawabanAI = tanyaKikoAI(userText, "Telegram");
        kirimPesanTelegram(chatId, jawabanAI);
      }

      return createJsonResponse({ status: "ok" });
    }

    // =========================================================
    // JALUR 2: CHAT DARI WIDGET KIKO DI WEBSITE
    // =========================================================
    if (payload.action === "chatKiko") {
      const jawabanAI = tanyaKikoAI(payload.message || "", "Web Widget");
      return createJsonResponse({
        status: "success",
        reply: jawabanAI
      });
    }

    // =========================================================
    // JALUR 3: CHECKOUT & PESANAN BARU DARI WEBSITE
    // =========================================================
    const ss = getDelinaSpreadsheet();

    // 1. Simpan File Dokumen Fotokopi (Jika Ada)
    let linkDokumenFotokopi = "-";
    if (payload.fotokopiFile && payload.fotokopiFile.base64) {
      linkDokumenFotokopi = saveBase64ToDriveFolder(
        payload.fotokopiFile.base64,
        payload.orderId + "_Dokumen_" + (payload.fotokopiFile.name || "fotokopi.pdf"),
        SUBFOLDER_FOTOKOPI
      );
    }

    // 2. Simpan File Bukti Pembayaran (Jika Ada)
    let linkBuktiBayar = "-";
    if (payload.paymentProof && payload.paymentProof.base64) {
      linkBuktiBayar = saveBase64ToDriveFolder(
        payload.paymentProof.base64,
        payload.orderId + "_BuktiBayar_" + (payload.paymentProof.name || "struk.jpg"),
        SUBFOLDER_BUKTI
      );
    }

    // 3. Format Rincian Item Barang untuk Tabel
    let rincianText = "";
    if (Array.isArray(payload.items)) {
      rincianText = payload.items
        .map((item, idx) => {
          let extra = item.notes ? ` (Catatan: ${item.notes})` : "";
          return `${idx + 1}. ${item.name} [${item.qty}x @ Rp ${Number(item.price).toLocaleString("id-ID")}]${extra}`;
        })
        .join("\n");
    }

    // 4. Kurangi Stok Produk di Tab Produk secara Aman
    const sheetProduk = ss.getSheetByName(TAB_PRODUK);
    if (sheetProduk && Array.isArray(payload.items)) {
      kurangiStokProduk(sheetProduk, payload.items);
    }

    // 5. Catat Baris Baru ke Tab Pesanan
    const sheetPesanan = ss.getSheetByName(TAB_PESANAN);
    if (!sheetPesanan) {
      throw new Error(`Tab ${TAB_PESANAN} tidak ditemukan di Google Sheets.`);
    }

    const newRow = [
      payload.orderId,
      payload.orderTime || new Date().toLocaleString("id-ID"),
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

    // 6. Kirim Notifikasi Instan ke Telegram Pemilik Toko (Admin)
    try {
      kirimNotifikasiPesananTelegram(payload, linkDokumenFotokopi, linkBuktiBayar);
    } catch (notifErr) {
      Logger.log("Notice: Gagal kirim notif Telegram ke admin: " + notifErr.toString());
    }

    // 7. Respon Berhasil
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
 * 5. INTEGRASI TELEGRAM BOT & NOTIFIKASI ADMIN
 * =========================================================================
 */

/**
 * Kirim Pesan Teks ke Chat ID Telegram
 */
function kirimPesanTelegram(chatId, pesan) {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken || !chatId) return;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: pesan,
    parse_mode: "Markdown"
  };

  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    // Fallback tanpa markdown jika ada simbol khusus
    payload.parse_mode = "";
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }
}

/**
 * Kirim Notifikasi Pesanan Masuk ke Telegram Pemilik Toko
 */
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

  const notifMsg = `🔔 *BISMILLAH, ADA PESANAN BARU MASUK!*
====================================
📋 *No. Nota:* \`${payload.orderId}\`
👤 *Nama:* ${payload.customerName}
📱 *WhatsApp:* \`${payload.customerPhone}\`
🚚 *Metode:* ${payload.deliveryMethod}
📍 *Alamat:* ${payload.customerAddress || "-"}
💰 *Total Tagihan:* *Rp ${Number(payload.totalAkhir).toLocaleString("id-ID")}*

📦 *Rincian Belanja:*
${itemsList}

📄 *Dokumen Fotokopi:* ${linkDokumen !== "-" ? linkDokumen : "Tidak ada berkas"}
💳 *Bukti Transfer:* ${linkBukti !== "-" ? linkBukti : "Belum diunggah"}

_Silakan cek Google Sheets & Drive Toko Delina untuk memproses pesanan ini. Barakallahu fiik._`;

  kirimPesanTelegram(adminChatId, notifMsg);
}

/**
 * =========================================================================
 * 6. PENGATURAN KUNCI RAHASIA & WEBHOOK TELEGRAM
 * =========================================================================
 */

/**
 * Otomatis Membuat Slot Properti Skrip (Script Properties)
 * Agar pengguna tinggal klik Project Settings -> Script Properties -> Isi nilainya!
 */
function inisialisasiSlotScriptProperties() {
  try {
    const props = PropertiesService.getScriptProperties();
    const current = props.getProperties();
    const keysToAdd = {};

    if (!("GEMINI_API_KEY" in current)) {
      keysToAdd["GEMINI_API_KEY"] = "";
    }
    if (!("TELEGRAM_BOT_TOKEN" in current)) {
      keysToAdd["TELEGRAM_BOT_TOKEN"] = "";
    }
    if (!("ADMIN_CHAT_ID" in current)) {
      keysToAdd["ADMIN_CHAT_ID"] = "";
    }

    if (Object.keys(keysToAdd).length > 0) {
      props.setProperties(keysToAdd);
      Logger.log("Slot Script Properties berhasil disiapkan: " + Object.keys(keysToAdd).join(", "));
    }
  } catch (e) {
    Logger.log("Notice inisialisasiSlot: " + e.toString());
  }
}

/**
 * Opsi 1: Isi Kunci Manual Lewat Fungsi Ini Lalu Klik Run / Jalankan
 */
function isiKunciManual() {
  // Tempelkan kunci kakak di dalam tanda petik dua ("") di bawah ini:
  const GEMINI_API_KEY = "";      // Contoh: "AIzaSy..." dari Google AI Studio
  const TELEGRAM_BOT_TOKEN = "";  // Contoh: "7123456789:AA..." dari @BotFather
  const ADMIN_CHAT_ID = "";       // Contoh: "123456789" dari @userinfobot

  simpanKunciRahasia(GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID);

  if (TELEGRAM_BOT_TOKEN) {
    try {
      setTelegramWebhook();
    } catch (e) {
      Logger.log("Notice setWebhook: " + e.toString());
    }
  }

  return cekStatusKunci();
}

/**
 * Fungsi untuk Menyimpan Kunci Rahasia ke Script Properties secara Aman
 * Cara pakai: Isi variabel di bawah ini lalu klik Run / Jalankan sekali.
 */
function simpanKunciRahasia(geminiKey, telegramToken, adminChatId) {
  const props = PropertiesService.getScriptProperties();
  const data = {};

  if (geminiKey) data["GEMINI_API_KEY"] = geminiKey.trim();
  if (telegramToken) data["TELEGRAM_BOT_TOKEN"] = telegramToken.trim();
  if (adminChatId) data["ADMIN_CHAT_ID"] = String(adminChatId).trim();

  props.setProperties(data);

  Logger.log("Alhamdulillah! Kunci rahasia berhasil disimpan ke Script Properties.");
  return "Kunci berhasil disimpan: " + Object.keys(data).join(", ");
}

/**
 * Fungsi Otomatis Mendaftarkan URL Web App ke Telegram Webhook
 */
function setTelegramWebhook() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN belum diset! Jalankan simpanKunciRahasia() terlebih dahulu.");
  }

  // URL Deployment Web App Toko Delina
  const webAppUrl = "https://script.google.com/macros/s/AKfycbxc_epV80Yx9G5pIyoLdCHGAPybi_JbWfYTC7B3G455UxtF0rhmRN1u0nXZTxFwrhGHTw/exec";
  const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webAppUrl)}`;

  const res = UrlFetchApp.fetch(url);
  const resultText = res.getContentText();
  Logger.log("Hasil setWebhook: " + resultText);
  return "Webhook Telegram berhasil didaftarkan: " + resultText;
}

/**
 * Cek Status Kunci Tersimpan (Tanpa membocorkan isi kunci)
 */
function cekStatusKunci() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const status = {
    GEMINI_API_KEY: props["GEMINI_API_KEY"] ? "Tersedia (Aktif)" : "Belum diisi",
    TELEGRAM_BOT_TOKEN: props["TELEGRAM_BOT_TOKEN"] ? "Tersedia (Aktif)" : "Belum diisi",
    ADMIN_CHAT_ID: props["ADMIN_CHAT_ID"] ? "Tersedia (" + props["ADMIN_CHAT_ID"] + ")" : "Belum diisi",
    DELINA_SPREADSHEET_ID: props["DELINA_SPREADSHEET_ID"] ? "Tersedia (" + props["DELINA_SPREADSHEET_ID"] + ")" : "Belum diisi"
  };
  Logger.log(status);
  return status;
}

/**
 * =========================================================================
 * 7. FUNGSI PENDUKUNG (DRIVE & DATABASE HELPERS)
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
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  const folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
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
