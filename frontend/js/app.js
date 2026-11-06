/**
 * app.js - Logika Frontend Toko Delina (Fase 2 - Fotokopi Upload, Cart & Modal Checkout QRIS)
 * Berjalan murni di sisi browser (Vanilla JavaScript)
 */

// 1. Data Contoh Produk Toko Delina (4 Kategori Fokus: ATK & Kantor, Kosmetik & Cantik, Kelontongan, Minuman)
const DUMMY_PRODUCTS = [
  // === 1. ATK & KANTOR ===
  {
    id: "ATK-001",
    name: "Kertas HVS PaperOne A4 75gsm (1 Rim / 500 Lembar)",
    category: "ATK & Kantor",
    price: 48000,
    originalPrice: 53000,
    rating: 4.9,
    sold: 1420,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80",
    badge: "Terlaris",
    stock: 85,
    unit: "Rim"
  },
  {
    id: "ATK-002",
    name: "Buku Tulis Sinar Dunia (SiDu) 38 Lembar - Pack Isi 10 Buku",
    category: "ATK & Kantor",
    price: 36500,
    originalPrice: 40000,
    rating: 4.8,
    sold: 890,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    badge: "Diskon 9%",
    stock: 40,
    unit: "Pack"
  },
  {
    id: "ATK-003",
    name: "Pulpen Gel Zebra Sarasa Clip 0.5mm Hitam / Biru Tinta Pekat",
    category: "ATK & Kantor",
    price: 15500,
    originalPrice: 17500,
    rating: 5.0,
    sold: 3100,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80",
    badge: "Favorit",
    stock: 120,
    unit: "Pcs"
  },
  {
    id: "ATK-004",
    name: "Paket Pulpen Standard AE7 0.5 Hitam (1 Lusin / 12 Batang)",
    category: "ATK & Kantor",
    price: 24000,
    originalPrice: 28000,
    rating: 4.9,
    sold: 2150,
    image: "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80",
    badge: "Grosir",
    stock: 65,
    unit: "Lusin"
  },
  {
    id: "ATK-005",
    name: "Stapler Joyko HD-10 + Isi Ulang Staples No. 10 (Set Lengkap)",
    category: "ATK & Kantor",
    price: 18500,
    originalPrice: 22000,
    rating: 4.9,
    sold: 640,
    image: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80",
    badge: "Original",
    stock: 50,
    unit: "Set"
  },
  {
    id: "ATK-006",
    name: "Tipe-X Kertas Kering Joyko Correction Tape CT-522 (Panjang 12m)",
    category: "ATK & Kantor",
    price: 9000,
    originalPrice: 11000,
    rating: 4.9,
    sold: 1840,
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    badge: "Awet",
    stock: 90,
    unit: "Pcs"
  },

  // === 2. KOSMETIK & CANTIK ===
  {
    id: "KOS-001",
    name: "Deodorant Dove Ultimate Repair Roll On 40ml Mencerahkan",
    category: "Kosmetik & Cantik",
    price: 23500,
    originalPrice: 27000,
    rating: 4.9,
    sold: 980,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    badge: "Wangi Segar",
    stock: 45,
    unit: "Btl"
  },
  {
    id: "KOS-002",
    name: "Deodorant Nivea Extra Brightening 8 Super Food Roll On 50ml",
    category: "Kosmetik & Cantik",
    price: 22000,
    originalPrice: 25500,
    rating: 4.9,
    sold: 1150,
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
    badge: "Terlaris",
    stock: 55,
    unit: "Btl"
  },
  {
    id: "KOS-003",
    name: "Wardah Lightening Micellar Gentle Wash 100ml Non-SLS",
    category: "Kosmetik & Cantik",
    price: 29500,
    originalPrice: 33000,
    rating: 4.9,
    sold: 760,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    badge: "Halal MUI",
    stock: 35,
    unit: "Tub"
  },
  {
    id: "KOS-004",
    name: "Garnier Micellar Cleansing Water Pink 125ml Kulit Sensitif",
    category: "Kosmetik & Cantik",
    price: 34500,
    originalPrice: 39000,
    rating: 5.0,
    sold: 1340,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80",
    badge: "Favorit",
    stock: 40,
    unit: "Btl"
  },
  {
    id: "KOS-005",
    name: "Emina Bright Stuff Moisturizing Cream 20ml Pencerah Wajah",
    category: "Kosmetik & Cantik",
    price: 24500,
    originalPrice: 28000,
    rating: 4.8,
    sold: 620,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
    badge: "Glowing",
    stock: 48,
    unit: "Tub"
  },
  {
    id: "KOS-006",
    name: "Kahf Triple Protection Sunscreen Moisturizer SPF 30 PA+++ 30ml",
    category: "Kosmetik & Cantik",
    price: 39000,
    originalPrice: 44000,
    rating: 4.9,
    sold: 540,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    badge: "Pria & Wanita",
    stock: 30,
    unit: "Tub"
  },

  // === 3. KELONTONGAN ===
  {
    id: "KLT-001",
    name: "Minyak Goreng Bimoli Klasik Pouch 2 Liter Jernih Berkualitas",
    category: "Kelontongan",
    price: 38500,
    originalPrice: 41000,
    rating: 4.9,
    sold: 1920,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    badge: "Sembako Utama",
    stock: 60,
    unit: "Pouch"
  },
  {
    id: "KLT-002",
    name: "Beras Kepala Super Ramos / Setra Ramos Pulen Wangi 5kg",
    category: "Kelontongan",
    price: 74500,
    originalPrice: 78000,
    rating: 5.0,
    sold: 840,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    badge: "Beras Pulen",
    stock: 35,
    unit: "Sak"
  },
  {
    id: "KLT-003",
    name: "Gula Pasir Putih Gulaku Tebu Murni Premium Kemasan 1kg",
    category: "Kelontongan",
    price: 18500,
    originalPrice: 20000,
    rating: 4.9,
    sold: 1560,
    image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80",
    badge: "Manis Alami",
    stock: 95,
    unit: "Bks"
  },
  {
    id: "KLT-004",
    name: "Indomie Mi Instan Goreng Spesial 85g Bumbu Gurih (Pack 5 Bks)",
    category: "Kelontongan",
    price: 17000,
    originalPrice: 18500,
    rating: 5.0,
    sold: 2890,
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
    badge: "Paling Laris",
    stock: 120,
    unit: "Pack"
  },
  {
    id: "KLT-005",
    name: "Deterjen Bubuk Rinso Anti Noda + Molto Rose Fresh 770g",
    category: "Kelontongan",
    price: 26500,
    originalPrice: 29500,
    rating: 4.9,
    sold: 710,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    badge: "Harum Semerbak",
    stock: 50,
    unit: "Bks"
  },
  {
    id: "KLT-006",
    name: "Sabun Cuci Piring Sunlight Jeruk Nipis 100 Pouch 650ml",
    category: "Kelontongan",
    price: 15500,
    originalPrice: 17500,
    rating: 4.9,
    sold: 1120,
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80",
    badge: "Hemat",
    stock: 75,
    unit: "Pouch"
  },

  // === 4. MINUMAN ===
  {
    id: "MNM-001",
    name: "Le Minerale Air Mineral Botol Sedang 600ml Segar Dingin",
    category: "Minuman",
    price: 3500,
    originalPrice: 4000,
    rating: 4.9,
    sold: 3400,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80",
    badge: "Dingin Segar",
    stock: 160,
    unit: "Btl"
  },
  {
    id: "MNM-002",
    name: "Pocari Sweat Minuman Isotonik Botol 500ml Pengganti Ion Tubuh",
    category: "Minuman",
    price: 8000,
    originalPrice: 9000,
    rating: 4.9,
    sold: 1450,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80",
    badge: "Segar Bugar",
    stock: 70,
    unit: "Btl"
  },
  {
    id: "MNM-003",
    name: "Floridina Pulpy Orange Jus Jeruk Segar Bulir Asli 350ml",
    category: "Minuman",
    price: 3500,
    originalPrice: 4500,
    rating: 4.8,
    sold: 1890,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
    badge: "Bulir Asli",
    stock: 130,
    unit: "Btl"
  },
  {
    id: "MNM-004",
    name: "Susu UHT Ultra Milk Cokelat / Full Cream Kotak 250ml",
    category: "Minuman",
    price: 7000,
    originalPrice: 8000,
    rating: 5.0,
    sold: 2100,
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
    badge: "Kaya Kalsium",
    stock: 110,
    unit: "Kotak"
  },
  {
    id: "MNM-005",
    name: "Teh Botol Sosro / Teh Pucuk Harum Melati Segar 350ml",
    category: "Minuman",
    price: 4000,
    originalPrice: 5000,
    rating: 4.9,
    sold: 2350,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    badge: "Pelepas Dahaga",
    stock: 125,
    unit: "Btl"
  },
  {
    id: "MNM-006",
    name: "Kopi Kapal Api Special Mix Plus Gula (1 Renceng Isi 10 Sachet)",
    category: "Minuman",
    price: 16500,
    originalPrice: 18500,
    rating: 4.9,
    sold: 1280,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    badge: "Aroma Mantap",
    stock: 80,
    unit: "Pack"
  }
];

// 2. Data Kategori Resmi Toko Delina (4 Kategori Fokus)
const CATEGORIES = [
  { id: "all", name: "Semua Produk", icon: "bi-grid-fill" },
  { id: "atk", name: "ATK & Kantor", icon: "bi-pencil-square" },
  { id: "kosmetik", name: "Kosmetik & Cantik", icon: "bi-stars" },
  { id: "kelontongan", name: "Kelontongan", icon: "bi-shop" },
  { id: "minuman", name: "Minuman", icon: "bi-cup-straw" }
];

// 3. State Aplikasi
let currentCategory = "Semua Produk";
let searchQuery = "";
let cart = JSON.parse(localStorage.getItem("delina_cart") || "[]");
let activeBottomNav = "home";

// State Tambahan Fotokopi
let currentPrintType = "bw";
let uploadedFotokopiDoc = null; // { name, size, type, base64 }

// State Tambahan Checkout
let selectedDeliveryMethod = "pickup"; // 'pickup' | 'courier'
let deliveryFee = 0;
let uploadedPaymentProof = null; // { name, size, type, base64 }
let latestOrderData = null; // Menyimpan rincian nota terakhir untuk modal sukses

// 4. Format Angka ke Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

// Helper: Konversi File ke Base64 (Untuk persiapan dikirim ke GAS)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Helper Normalisasi Kategori ke 4 Kategori Resmi (ATK & Kantor, Kosmetik & Cantik, Kelontongan, Minuman)
function normalizeStoreCategory(rawCategory, productName = "") {
  // 0. Hormati kategori resmi yang sudah tertulis persis di Google Sheets
  const OFFICIAL_CATS = ["ATK & Kantor", "Kosmetik & Cantik", "Kelontongan", "Minuman"];
  const exactCat = OFFICIAL_CATS.find(c => c.toLowerCase() === String(rawCategory || "").trim().toLowerCase());
  if (exactCat) return exactCat;
  const cat = String(rawCategory || "").toLowerCase();
  const name = String(productName || "").toLowerCase();
  const combined = `${cat} ${name}`;

  // 1. Cek Minuman terlebih dahulu (karena dulu ada "Makanan & Minuman")
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

  // 2. Cek Kosmetik & Cantik
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

  // 3. Cek Kelontongan (mencakup sembako, dapur, mie, biskuit/snack warung, deterjen, alat rumah tangga)
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

  // 4. Default / ATK & Kantor
  return "ATK & Kantor";
}

// Helper Deteksi Kategori Fleksibel (Terkoneksi Penuh dengan Google Sheets & 4 Kategori Resmi)
function isProductInCategory(product, targetCategory) {
  if (!product || !targetCategory) return false;
  if (targetCategory === "Semua Produk" || targetCategory === "Semua" || targetCategory === "all") return true;

  const normalizedProdCat = normalizeStoreCategory(product.category, product.name).toLowerCase();
  const normalizedTargetCat = normalizeStoreCategory(targetCategory, "").toLowerCase();

  if (normalizedProdCat === normalizedTargetCat) return true;

  const pCat = String(product.category || "").toLowerCase();
  const tCat = String(targetCategory).toLowerCase();
  return pCat === tCat;
}

// Helper Badge Strip Merah Ala Alfagift (Pita Merah Sub-Kategori)
function getProductRedBadge(product) {
  if (!product) return "Pilihan Hemat";
  if (product.subCategory) return product.subCategory;
  if (product.type) return product.type;
  if (product.badge && product.badge.length <= 15 && !product.badge.toLowerCase().includes("terlaris")) {
    return product.badge;
  }
  
  const name = String(product.name || "").trim();
  const lower = name.toLowerCase();

  if (lower.includes("kertas hvs") || lower.includes("paperone") || lower.includes("sidu")) return "Kertas HVS";
  if (lower.includes("buku tulis") || lower.includes("buku gambar") || lower.includes("kiky")) return "Buku Tulis";
  if (lower.includes("pulpen") || lower.includes("bolpoint") || lower.includes("sarasa") || lower.includes("ae7")) return "Pulpen Gel";
  if (lower.includes("spidol") || lower.includes("snowman") || lower.includes("marker")) return "Spidol";
  if (lower.includes("pensil") || lower.includes("faber")) return "Pensil 2B";
  if (lower.includes("gunting") || lower.includes("cutter")) return "Gunting Kantor";
  if (lower.includes("lem") || lower.includes("glukol")) return "Lem Kertas";
  if (lower.includes("dove") || lower.includes("deodorant") || lower.includes("roll on")) return "Deodorant";
  if (lower.includes("serum") || lower.includes("garnier")) return "Serum Wajah";
  if (lower.includes("lip cream") || lower.includes("lipstik") || lower.includes("wardah")) return "Lip Cream";
  if (lower.includes("micellar") || lower.includes("cleanser") || lower.includes("facial")) return "Pembersih Muka";
  if (lower.includes("sunscreen") || lower.includes("tabir")) return "Sunscreen";
  if (lower.includes("minyak") || lower.includes("sania") || lower.includes("bimoli")) return "Minyak Goreng";
  if (lower.includes("beras") || lower.includes("ramos") || lower.includes("pulen")) return "Beras Pilihan";
  if (lower.includes("gula") || lower.includes("gulaku")) return "Gula Pasir";
  if (lower.includes("indomie") || lower.includes("mie") || lower.includes("sedap")) return "Mi Instan";
  if (lower.includes("teh") || lower.includes("sariwangi")) return "Teh Celup";
  if (lower.includes("kopi") || lower.includes("kapal api")) return "Kopi";
  if (lower.includes("susu") || lower.includes("bear brand") || lower.includes("ultra")) return "Susu Cair";
  if (lower.includes("air") || lower.includes("mineral") || lower.includes("aqua") || lower.includes("le minerale")) return "Air Mineral";
  if (lower.includes("snack") || lower.includes("chitato") || lower.includes("biskuit")) return "Snack Ringan";

  const words = name.split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 2) {
    return `${words[0]} ${words[1]}`.slice(0, 16);
  }
  return product.unit || "Pilihan Hemat";
}

// 5a. Template Kartu Produk Khusus Horizontal Scroll Rail (Rapi, Bersih, Hijau Tokopedia)
function renderAlfagiftCard(product) {
  if (!product) return "";
  const prodId = product.id;
  const prodName = product.name || "Produk Delina";
  const prodImage = formatImageUrl(product.image);
  const prodPrice = Number(product.price || 0);

  return `
    <div class="alfagift-card w-[155px] sm:w-[165px] shrink-0 snap-start bg-white rounded-2xl border border-gray-200 p-2.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group select-none">
      
      <!-- Bagian Atas: Gambar & Nama Produk -->
      <div>
        <!-- Area Gambar: Foto produk dengan rasio bersih persegi, latar putih, tinggi ~115px -->
        <div 
          class="relative w-full h-[115px] bg-white rounded-xl overflow-hidden flex items-center justify-center cursor-pointer p-1"
          onclick="openProductDetailModal('${prodId}')"
          title="${escapeHtml(prodName)}"
        >
          <img 
            src="${prodImage}" 
            alt="${escapeHtml(prodName)}" 
            class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300';"
          />
        </div>

        <!-- Nama Produk (Teks 2 Baris Rapi, min-height) -->
        <h4 
          class="text-xs font-semibold text-gray-800 line-clamp-2 mt-2 leading-snug min-h-[32px] cursor-pointer hover:text-emerald-700 transition-colors"
          onclick="openProductDetailModal('${prodId}')"
          title="${escapeHtml(prodName)}"
        >
          ${escapeHtml(prodName)}
        </h4>
      </div>

      <!-- Bagian Bawah: Harga & Tombol Aksi + Keranjang (Hijau Delina) -->
      <div class="mt-2 pt-1.5 border-t border-gray-100 flex flex-col">
        <!-- Harga Produk (Teks tebal hijau emerald pekat) -->
        <div class="text-base font-extrabold text-emerald-800 leading-tight">
          ${formatRupiah(prodPrice)}
        </div>

        <!-- Tombol Aksi Bawah: + Keranjang (Hijau Tokopedia / Delina) -->
        <button 
          type="button" 
          onclick="addToCart('${prodId}')"
          class="w-full bg-tokopedia-green hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl mt-2 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <i class="bi bi-cart-plus text-xs"></i>
          <span>+ Keranjang</span>
        </button>
      </div>

    </div>
  `;
}

// 5b. Kartu Ke-11: "Lihat Produk Lainnya" (Tema Hijau Delina)
function renderLihatLainnyaCard(categoryName) {
  return `
    <div 
      onclick="selectCategory('${escapeHtml(categoryName)}')"
      class="alfagift-more-card w-[155px] sm:w-[165px] min-h-[220px] shrink-0 snap-start bg-white rounded-2xl border-2 border-emerald-500 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50/60 hover:shadow-md transition-all active:scale-95 group select-none"
      title="Lihat semua produk ${escapeHtml(categoryName)}"
    >
      <div class="w-12 h-12 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 text-xl font-black mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
        <i class="bi bi-arrow-right"></i>
      </div>
      <div class="text-emerald-800 font-bold text-sm leading-snug group-hover:underline">
        Lihat produk lainnya
      </div>
      <span class="text-[10px] text-gray-400 mt-1 block">
        Kategori ${escapeHtml(categoryName)}
      </span>
    </div>
  `;
}

// 5c. Render Deret Rel Horizontal Scroll Per Kategori
function renderHorizontalRail(railTitle, categoryFilterName, products) {
  if (!products || products.length === 0) return "";
  
  // Batasi setiap baris horizontal hanya merender maksimal 10 produk pertama
  const displayProducts = products.slice(0, 10);
  const hasMore = products.length > 10 || categoryFilterName !== "Semua Produk";

  return `
    <div class="category-rail space-y-2.5">
      <!-- Header Setiap Deret Kategori -->
      <div class="flex items-center justify-between px-1">
        <h3 class="text-gray-900 font-bold text-base sm:text-lg tracking-tight">
          ${escapeHtml(railTitle)}
        </h3>
        <button 
          type="button" 
          onclick="selectCategory('${escapeHtml(categoryFilterName)}')"
          class="text-emerald-700 hover:text-emerald-800 font-bold text-xs sm:text-sm hover:underline cursor-pointer flex items-center gap-0.5"
        >
          <span>Lihat Semua</span>
          <i class="bi bi-chevron-right text-[10px]"></i>
        </button>
      </div>

      <!-- Kontainer Rel: flex overflow-x-auto gap-3 pb-3 scrollbar-none snap-x snap-mandatory px-1 -->
      <div class="alfagift-rail-track flex overflow-x-auto gap-3 pb-3 scrollbar-none snap-x snap-mandatory px-1 -mx-1">
        ${displayProducts.map(p => renderAlfagiftCard(p)).join("")}
        ${hasMore ? renderLihatLainnyaCard(categoryFilterName) : ""}
      </div>
    </div>
  `;
}

// 5d. Render Daftar Produk ke Etalase Modern Retail (Horizontal Scroll Rails & Full Grid)
function renderProducts() {
  const container = document.getElementById("productGrid");
  if (!container) return;

  const q = (searchQuery || "").toLowerCase().trim();

  // KONDISI 1: JIKA KATEGORI TERTENTU DIPILIH ATAU PENCARIAN AKTIF (TAMPILKAN FULL GRID)
  if (currentCategory !== "Semua Produk" || q) {
    const filtered = DUMMY_PRODUCTS.filter(product => {
      const matchesCategory =
        currentCategory === "Semua Produk" || isProductInCategory(product, currentCategory);
      const matchesSearch =
        !q ||
        (product.name || "").toLowerCase().includes(q) ||
        (product.category || "").toLowerCase().includes(q) ||
        String(product.id || "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <i class="bi bi-search text-2xl"></i>
          </div>
          <h3 class="text-base font-bold text-gray-800">Barang Belum Ditemukan</h3>
          <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Afwan kak, produk "${searchQuery || currentCategory}" tidak ditemukan. Coba ketik kata kunci lain atau tampilkan seluruh deret katalog.
          </p>
          <button 
            type="button" 
            onclick="selectCategory('Semua Produk')" 
            class="mt-4 px-4 py-2 rounded-xl bg-tokopedia-green hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            ← Tampilkan Semua Deret
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header Filter Aktif -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-tokopedia-green text-white flex items-center justify-center text-sm font-bold shadow-xs">
              <i class="bi bi-tag-fill"></i>
            </span>
            <div>
              <h3 class="font-extrabold text-sm sm:text-base text-emerald-950 leading-tight">
                ${q ? `Hasil Pencarian: "${searchQuery}"` : currentCategory}
              </h3>
              <p class="text-[11px] text-emerald-700">Ditemukan ${filtered.length} produk pilihan</p>
            </div>
          </div>
          <button 
            type="button" 
            onclick="selectCategory('Semua Produk')" 
            class="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <span>Semua Deret</span>
            <i class="bi bi-arrow-right"></i>
          </button>
        </div>

        <!-- Grid Produk Penuh (Alfagift Card Grid) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          ${filtered.map(p => renderAlfagiftCard(p)).join("")}
        </div>
      </div>
    `;
    return;
  }

  // KONDISI 2: TAMPILAN BERANDA (SEMUA PRODUK) -> RANGKAIAN DERET HORIZONTAL SCROLL PER KATEGORI
  let htmlRails = "";

  // Deret 1: "Rekomendasi Untuk Kamu" (10 produk pilihan terlaris / rekomendasi)
  const rekomendasiList = [...DUMMY_PRODUCTS]
    .sort((a, b) => (Number(b.sold || 0) - Number(a.sold || 0)))
    .slice(0, 10);
  if (rekomendasiList.length > 0) {
    htmlRails += renderHorizontalRail("Rekomendasi Untuk Kamu", "Semua Produk", rekomendasiList);
  }

  // Deret 2: "ATK & Kantor"
  const atkList = DUMMY_PRODUCTS.filter(p => isProductInCategory(p, "ATK & Kantor"));
  if (atkList.length > 0) {
    htmlRails += renderHorizontalRail("ATK & Kantor", "ATK & Kantor", atkList);
  }

  // Deret 3: "Kosmetik & Cantik"
  const kosmetikList = DUMMY_PRODUCTS.filter(p => isProductInCategory(p, "Kosmetik & Cantik"));
  if (kosmetikList.length > 0) {
    htmlRails += renderHorizontalRail("Kosmetik & Cantik", "Kosmetik & Cantik", kosmetikList);
  }

  // Deret 4: "Kelontongan"
  const kelontongList = DUMMY_PRODUCTS.filter(p => isProductInCategory(p, "Kelontongan"));
  if (kelontongList.length > 0) {
    htmlRails += renderHorizontalRail("Kelontongan", "Kelontongan", kelontongList);
  }

  // Deret 5: "Minuman"
  const minumanList = DUMMY_PRODUCTS.filter(p => isProductInCategory(p, "Minuman"));
  if (minumanList.length > 0) {
    htmlRails += renderHorizontalRail("Minuman", "Minuman", minumanList);
  }

  // Deret Kategori Lainnya (Dinamis jika admin menambahkan kategori baru di Google Sheets)
  const standardCats = [
    "ATK & Kantor",
    "Kosmetik & Cantik",
    "Kelontongan",
    "Minuman"
  ];

  const uniqueCustomCats = [...new Set(DUMMY_PRODUCTS.map(p => p.category).filter(Boolean))]
    .filter(cat => !standardCats.some(sc => isProductInCategory({ category: cat }, sc)));

  uniqueCustomCats.forEach(cat => {
    const list = DUMMY_PRODUCTS.filter(p => p.category === cat);
    if (list.length > 0) {
      htmlRails += renderHorizontalRail(cat, cat, list);
    }
  });

  container.innerHTML = htmlRails;
}

// 6. Logika Keranjang Belanja (Cart)
function addToCart(productId) {
  const product = DUMMY_PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    if (existingItem.qty < product.stock) {
      existingItem.qty += 1;
      showToast(`Alhamdulillah, kuantitas "${product.name.slice(0, 25)}..." bertambah.`);
    } else {
      showToast(`Afwan, stok maksimal hanya ${product.stock} ${product.unit}.`, "warning");
      return;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      unit: product.unit,
      qty: 1
    });
    showToast(`Alhamdulillah, berhasil dimasukkan ke keranjang belanja.`);
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
  if (typeof updateKikoMiniCartBar === "function") updateKikoMiniCartBar();
}

function updateCartQty(productId, change) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].qty += change;
    if (cart[itemIndex].qty <= 0) {
      cart.splice(itemIndex, 1);
      showToast("Item dihapus dari keranjang.");
    }
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  if (typeof updateKikoMiniCartBar === "function") updateKikoMiniCartBar();
}

function saveCart() {
  localStorage.setItem("delina_cart", JSON.stringify(cart));
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const badges = document.querySelectorAll(".cart-badge");
  badges.forEach(badge => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none";
  });
}

// 7. Render Tampilan Laci Keranjang (Drawer Modal dengan Info File & Catatan Cetak)
function renderCartDrawer() {
  const container = document.getElementById("cartItemsList");
  const totalElem = document.getElementById("cartTotalPrice");
  if (!container || !totalElem) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-gray-500">
        <i class="bi bi-cart-x text-4xl text-gray-300"></i>
        <p class="mt-2 text-sm font-medium">Keranjang masih kosong</p>
        <p class="text-xs text-gray-400 mt-1">Pilih ATK pilihan Anda untuk mengisi keranjang.</p>
      </div>
    `;
    totalElem.textContent = formatRupiah(0);
    return;
  }

  let total = 0;
  container.innerHTML = cart
    .map(item => {
      const itemSubtotal = item.price * item.qty;
      total += itemSubtotal;
      return `
      <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <img src="${formatImageUrl(item.image)}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg bg-white border flex-shrink-0" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300';" />
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-semibold text-gray-800 truncate">${item.name}</h5>
            <p class="text-xs text-emerald-700 font-bold mt-0.5">${formatRupiah(item.price)}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <button onclick="updateCartQty('${item.id}', -1)" class="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-100 text-xs">-</button>
              <span class="text-xs font-semibold text-gray-800 w-6 text-center">${item.qty}</span>
              <button onclick="updateCartQty('${item.id}', 1)" class="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-100 text-xs">+</button>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-xs font-bold text-gray-800 block">${formatRupiah(itemSubtotal)}</span>
          </div>
        </div>

        <!-- Tampilan Nama Dokumen & Catatan Jika Ada (Pesanan Fotokopi) -->
        ${
          item.fileName
            ? `
          <div class="pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
            <span class="text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold truncate max-w-[220px]">
              <i class="bi bi-file-earmark-check-fill text-emerald-600"></i> ${item.fileName} (${item.fileSize})
            </span>
          </div>
        `
            : ""
        }
        ${
          item.notes
            ? `
          <div class="text-[10px] text-gray-500 italic bg-white/70 p-1.5 rounded-md border border-gray-100">
            <span class="font-semibold text-gray-600">Catatan:</span> "${item.notes}"
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  totalElem.textContent = formatRupiah(total);
}

// Web Audio Synthesizer untuk Notifikasi Audio Halus
let delinaAudioCtx = null;
function getDelinaAudioCtx() {
  if (!delinaAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) delinaAudioCtx = new AudioContextClass();
  }
  if (delinaAudioCtx && delinaAudioCtx.state === "suspended") {
    delinaAudioCtx.resume();
  }
  return delinaAudioCtx;
}

function beepToastSuccess() {
  try {
    const ctx = getDelinaAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {}
}

function beepToastError() {
  try {
    const ctx = getDelinaAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  } catch (e) {}
}

// 8. Tampilkan Pesan Notifikasi Ringan (Modern Top Toast)
function showToast(message, type = "success") {
  const container = document.getElementById("modernToastContainer");
  if (!container) {
    console.log("Toast:", message);
    return;
  }

  const msgStr = String(message || "");
  const isErr = (type === "error" || type === "danger" || msgStr.toLowerCase().includes("gagal") || msgStr.toLowerCase().includes("afwan") || msgStr.includes("❌") || msgStr.includes("⚠️"));
  if (isErr) {
    beepToastError();
  } else {
    beepToastSuccess();
  }

  const toast = document.createElement("div");
  const borderColor = isErr 
    ? "border-rose-500/50 bg-slate-900/95 text-rose-100 shadow-rose-900/20" 
    : (type === "warning" ? "border-amber-500/50 bg-slate-900/95 text-amber-100 shadow-amber-900/20" : "border-emerald-500/50 bg-slate-900/95 text-white shadow-emerald-900/20");
  const icon = isErr 
    ? '<i class="bi bi-x-circle-fill text-rose-400 text-base flex-shrink-0"></i>' 
    : (type === "warning" ? '<i class="bi bi-exclamation-triangle-fill text-amber-400 text-base flex-shrink-0"></i>' : '<i class="bi bi-check-circle-fill text-emerald-400 text-base flex-shrink-0"></i>');
  const barColor = isErr ? "bg-rose-500" : (type === "warning" ? "bg-amber-400" : "bg-emerald-400");

  toast.className = `pointer-events-auto backdrop-blur-md border ${borderColor} rounded-2xl p-3 shadow-2xl transition-all duration-300 transform -translate-y-2 opacity-0 flex flex-col overflow-hidden`;
  
  toast.innerHTML = `
    <div class="flex items-center gap-2.5">
      ${icon}
      <span class="text-xs font-semibold leading-snug flex-1">${msgStr}</span>
    </div>
    <div class="h-0.5 w-full bg-slate-700/60 mt-2 rounded-full overflow-hidden">
      <div class="toast-progress-bar h-full ${barColor} rounded-full" style="width: 100%; transition: width 3000ms linear;"></div>
    </div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("-translate-y-2", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
    const bar = toast.querySelector(".toast-progress-bar");
    if (bar) {
      setTimeout(() => { bar.style.width = "0%"; }, 20);
    }
  });

  setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100");
    toast.classList.add("-translate-y-2", "opacity-0");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

// DELINA MODERN MODAL DIALOG SYSTEM (CONFIRM & ALERT)
let delinaModalResolver = null;

function showDelinaConfirm({ title, subtitle = "Konfirmasi Belanja Delina", message = "", details = null, confirmText = "Ya, Lanjutkan", cancelText = "Batal", type = "success", icon = null }) {
  return new Promise((resolve) => {
    delinaModalResolver = resolve;
    const modal = document.getElementById("delinaModernModal");
    const card = document.getElementById("delinaModernModalCard");
    const iconBox = document.getElementById("delinaModalIconBox");
    const iconEl = document.getElementById("delinaModalIcon");
    const titleEl = document.getElementById("delinaModalTitle");
    const subEl = document.getElementById("delinaModalSubtitle");
    const bodyEl = document.getElementById("delinaModalBody");
    const detailsBox = document.getElementById("delinaModalDetailsBox");
    const btnCancel = document.getElementById("delinaModalBtnCancel");
    const btnConfirm = document.getElementById("delinaModalBtnConfirm");

    if (!modal) {
      resolve(confirm(message));
      return;
    }

    titleEl.textContent = title || "Konfirmasi";
    subEl.textContent = subtitle || "";
    bodyEl.innerHTML = typeof message === "string" ? message.replace(/\n/g, "<br>") : "";

    if (details) {
      detailsBox.classList.remove("hidden");
      detailsBox.innerHTML = details;
    } else {
      detailsBox.classList.add("hidden");
      detailsBox.innerHTML = "";
    }

    btnCancel.classList.remove("hidden");
    btnCancel.textContent = cancelText;
    btnConfirm.textContent = confirmText;

    if (type === "danger" || type === "delete") {
      iconBox.className = "w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl flex-shrink-0";
      iconEl.className = icon || "bi bi-trash3-fill";
      btnConfirm.className = "px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer";
    } else if (type === "warning") {
      iconBox.className = "w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl flex-shrink-0";
      iconEl.className = icon || "bi bi-exclamation-triangle-fill";
      btnConfirm.className = "px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer";
    } else {
      iconBox.className = "w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl flex-shrink-0";
      iconEl.className = icon || "bi bi-cart-check-fill";
      btnConfirm.className = "px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer";
    }

    btnCancel.onclick = () => {
      closeDelinaModernModal();
      resolve(false);
    };

    btnConfirm.onclick = () => {
      closeDelinaModernModal();
      resolve(true);
    };

    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.classList.add("opacity-100", "pointer-events-auto");
    if (card) {
      card.classList.remove("scale-95");
      card.classList.add("scale-100");
    }
  });
}

function showDelinaAlert({ title = "Informasi", subtitle = "Toko Delina", message = "", details = null, buttonText = "OK, Mengerti", type = "info", icon = null }) {
  return new Promise((resolve) => {
    delinaModalResolver = resolve;
    const modal = document.getElementById("delinaModernModal");
    const card = document.getElementById("delinaModernModalCard");
    const iconBox = document.getElementById("delinaModalIconBox");
    const iconEl = document.getElementById("delinaModalIcon");
    const titleEl = document.getElementById("delinaModalTitle");
    const subEl = document.getElementById("delinaModalSubtitle");
    const bodyEl = document.getElementById("delinaModalBody");
    const detailsBox = document.getElementById("delinaModalDetailsBox");
    const btnCancel = document.getElementById("delinaModalBtnCancel");
    const btnConfirm = document.getElementById("delinaModalBtnConfirm");

    if (!modal) {
      alert(message);
      resolve();
      return;
    }

    titleEl.textContent = title;
    subEl.textContent = subtitle;
    bodyEl.innerHTML = typeof message === "string" ? message.replace(/\n/g, "<br>") : "";

    if (details) {
      detailsBox.classList.remove("hidden");
      detailsBox.innerHTML = details;
    } else {
      detailsBox.classList.add("hidden");
      detailsBox.innerHTML = "";
    }

    btnCancel.classList.add("hidden");
    btnConfirm.textContent = buttonText;

    if (type === "success") {
      iconBox.className = "w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl flex-shrink-0";
      iconEl.className = icon || "bi bi-check-circle-fill";
      btnConfirm.className = "px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer";
    } else if (type === "danger" || type === "error") {
      iconBox.className = "w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl flex-shrink-0";
      iconEl.className = icon || "bi bi-x-circle-fill";
      btnConfirm.className = "px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer";
    } else {
      iconBox.className = "w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-2xl flex-shrink-0";
      iconEl.className = icon || "bi bi-info-circle-fill";
      btnConfirm.className = "px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer";
    }

    btnConfirm.onclick = () => {
      closeDelinaModernModal();
      resolve(true);
    };

    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.classList.add("opacity-100", "pointer-events-auto");
    if (card) {
      card.classList.remove("scale-95");
      card.classList.add("scale-100");
    }
  });
}

function closeDelinaModernModal() {
  const modal = document.getElementById("delinaModernModal");
  const card = document.getElementById("delinaModernModalCard");
  if (modal) {
    modal.classList.remove("opacity-100", "pointer-events-auto");
    modal.classList.add("opacity-0", "pointer-events-none");
  }
  if (card) {
    card.classList.remove("scale-100");
    card.classList.add("scale-95");
  }
}

// 9. Buka/Tutup Keranjang
function toggleCartDrawer(open = true, notifyHistory = true) {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer || !overlay) return;

  if (open) {
    renderCartDrawer();
    drawer.classList.remove("translate-x-full");
    overlay.classList.remove("hidden");
    if (typeof pushModalState === "function") pushModalState("cartDrawer");
  } else {
    const wasOpen = !drawer.classList.contains("translate-x-full");
    drawer.classList.add("translate-x-full");
    overlay.classList.add("hidden");
    if (activeBottomNav === "cart") {
      setActiveBottomNav("home");
    }
    if (notifyHistory && wasOpen && typeof notifyModalClosed === "function") {
      notifyModalClosed();
    }
  }
}

// 10. Filter Kategori
function renderCategoryPills(categoriesList) {
  const container = document.getElementById("categoryPillsContainer");
  if (!container) return;

  const defaultCats = [
    { nama: "ATK & Kantor", icon: "bi-pencil-square" },
    { nama: "Kosmetik & Cantik", icon: "bi-stars" },
    { nama: "Kelontongan", icon: "bi-shop" },
    { nama: "Minuman", icon: "bi-cup-straw" }
  ];

  const cats = categoriesList && categoriesList.length > 0 
    ? categoriesList.map(c => ({
        nama: normalizeStoreCategory(c.nama || c, ""),
        icon: c.icon || "bi-tag-fill"
      })).filter((c, idx, arr) => arr.findIndex(x => x.nama === c.nama) === idx)
    : defaultCats;

  let html = `
    <button 
      data-category="Semua Produk"
      onclick="selectCategory('Semua Produk')" 
      class="category-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${currentCategory === 'Semua Produk' ? 'bg-emerald-800 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700'} transition-all cursor-pointer"
    >
      <i class="bi bi-grid-fill"></i> Semua Produk
    </button>
  `;

  cats.forEach(c => {
    const isSelected = currentCategory === c.nama;
    html += `
      <button 
        data-category="${c.nama}"
        onclick="selectCategory('${c.nama.replace(/'/g, "\\'")}')" 
        class="category-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${isSelected ? 'bg-emerald-800 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700'} transition-all cursor-pointer"
      >
        <i class="bi ${c.icon || 'bi-tag-fill'}"></i> ${c.nama}
      </button>
    `;
  });

  container.innerHTML = html;
}

function selectCategory(categoryName) {
  currentCategory = categoryName === "Semua Produk" ? "Semua Produk" : normalizeStoreCategory(categoryName, "");

  // 1. Highlight Kartu Kategori Kotak Bergambar 3D
  document.querySelectorAll(".category-box-card").forEach(card => {
    const isCurrent = card.dataset.category === currentCategory;
    if (isCurrent) {
      card.classList.add("active-card", "ring-2", "ring-emerald-600");
    } else {
      card.classList.remove("active-card", "ring-2", "ring-emerald-600");
    }
  });

  // 2. Highlight Pills Kategori jika ada
  document.querySelectorAll(".category-pill").forEach(btn => {
    const isCurrent = btn.dataset.category === currentCategory;
    if (isCurrent) {
      btn.className =
        "category-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-emerald-800 text-white shadow-sm transition-all";
    } else {
      btn.className =
        "category-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-white text-gray-600 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 transition-all";
    }
  });

  renderProducts();

  // Scroll halus ke katalog produk
  const katalogEl = document.getElementById("katalogProduk");
  if (katalogEl && (currentCategory !== "Semua Produk" || window.scrollY > 150)) {
    katalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 11. Modal Detail Produk Ala Tokopedia & Kontrol Pembelian
let detailCurrentProduct = null;
let detailCurrentQty = 1;

function quickViewProduct(productId) {
  openProductDetailModal(productId);
}

function openProductDetailModal(productId) {
  // Cari di produk dummy atau produk dari backend jika ada
  let product = DUMMY_PRODUCTS.find(p => p.id === productId);
  if (!product && typeof window.LIVE_PRODUCTS !== "undefined" && Array.isArray(window.LIVE_PRODUCTS)) {
    product = window.LIVE_PRODUCTS.find(p => p.id === productId);
  }
  if (!product) {
    product = {
      id: productId,
      name: "Produk ATK Toko Delina",
      category: "Perlengkapan Kantor",
      price: 15000,
      originalPrice: 18000,
      rating: 4.9,
      sold: 120,
      stock: 50,
      unit: "Pcs",
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60",
      badge: "Pilihan Terbaik"
    };
  }

  detailCurrentProduct = product;
  detailCurrentQty = 1;

  // Set DOM
  const modal = document.getElementById("productDetailModal");
  const elCategory = document.getElementById("detailProductCategory");
  const elImg = document.getElementById("detailProductImg");
  const elBadge = document.getElementById("detailProductBadge");
  const elName = document.getElementById("detailProductName");
  const elRating = document.getElementById("detailProductRating");
  const elSold = document.getElementById("detailProductSold");
  const elStock = document.getElementById("detailProductStock");
  const elUnit = document.getElementById("detailProductUnit");
  const elPrice = document.getElementById("detailProductPrice");
  const elOrigPrice = document.getElementById("detailProductOriginalPrice");
  const elDiscount = document.getElementById("detailProductDiscount");
  const elDesc = document.getElementById("detailProductDesc");
  const elQtyInput = document.getElementById("detailQtyInput");

  if (elCategory) elCategory.textContent = product.category || "ATK & Kantor";
  if (elImg) elImg.src = formatImageUrl(product.image);
  if (elBadge) elBadge.textContent = product.badge || "Kualitas Terjamin";
  if (elName) elName.textContent = product.name;
  if (elRating) elRating.textContent = (product.rating || 4.9).toFixed(1);
  if (elSold) elSold.textContent = `${product.sold || 80}+ pcs`;
  if (elStock) elStock.textContent = product.stock || 50;
  if (elUnit) elUnit.textContent = product.unit || "Pcs";
  if (elPrice) elPrice.textContent = formatRupiah(product.price);
  
  const origPrice = product.originalPrice || Math.round(product.price * 1.15);
  if (elOrigPrice) elOrigPrice.textContent = formatRupiah(origPrice);
  
  if (elDiscount) {
    const percent = Math.round(((origPrice - product.price) / origPrice) * 100);
    if (percent > 0) {
      elDiscount.textContent = `Hemat ${percent}%`;
      elDiscount.classList.remove("hidden");
    } else {
      elDiscount.classList.add("hidden");
    }
  }

  if (elDesc) {
    elDesc.textContent = product.description || 
      `${product.name} merupakan perlengkapan ATK berkualitas tinggi pilihan Toko Delina. Cocok untuk kebutuhan administrasi kantor, tugas kuliah, maupun sekolah. Dijamin 100% original, presisi, dan siap kirim instan Toko Delina.`;
  }

  if (elQtyInput) elQtyInput.value = 1;
  updateDetailSubtotal();

  if (modal) {
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    if (typeof pushModalState === "function") pushModalState("productDetailModal");
  }
}

function closeProductDetailModal() {
  const modal = document.getElementById("productDetailModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

function changeDetailQty(delta) {
  if (!detailCurrentProduct) return;
  const maxStock = detailCurrentProduct.stock || 999;
  const newQty = Math.max(1, Math.min(maxStock, detailCurrentQty + delta));
  detailCurrentQty = newQty;
  const elQtyInput = document.getElementById("detailQtyInput");
  if (elQtyInput) elQtyInput.value = newQty;
  updateDetailSubtotal();
}

function handleDetailQtyChange(val) {
  if (!detailCurrentProduct) return;
  let parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed < 1) parsed = 1;
  const maxStock = detailCurrentProduct.stock || 999;
  parsed = Math.min(maxStock, parsed);
  detailCurrentQty = parsed;
  const elQtyInput = document.getElementById("detailQtyInput");
  if (elQtyInput) elQtyInput.value = parsed;
  updateDetailSubtotal();
}

function updateDetailSubtotal() {
  if (!detailCurrentProduct) return;
  const subtotal = detailCurrentProduct.price * detailCurrentQty;
  const elSub = document.getElementById("detailProductSubtotal");
  if (elSub) elSub.textContent = formatRupiah(subtotal);
}

function detailAddToCart() {
  if (!detailCurrentProduct) return;
  const existingIndex = cart.findIndex(item => item.id === detailCurrentProduct.id);
  if (existingIndex > -1) {
    cart[existingIndex].qty += detailCurrentQty;
  } else {
    cart.push({
      id: detailCurrentProduct.id,
      name: detailCurrentProduct.name,
      price: detailCurrentProduct.price,
      image: detailCurrentProduct.image,
      unit: detailCurrentProduct.unit || "Pcs",
      qty: detailCurrentQty,
      category: detailCurrentProduct.category
    });
  }
  localStorage.setItem("delina_cart", JSON.stringify(cart));
  updateCartBadge();
  renderCartDrawer();
  showToast(`✅ ${detailCurrentQty}x ${detailCurrentProduct.name} ditambahkan ke keranjang!`, "success");
  closeProductDetailModal();
}

function detailBuyNow() {
  if (!detailCurrentProduct) return;
  const existingIndex = cart.findIndex(item => item.id === detailCurrentProduct.id);
  if (existingIndex > -1) {
    cart[existingIndex].qty = Math.max(cart[existingIndex].qty, detailCurrentQty);
  } else {
    cart.push({
      id: detailCurrentProduct.id,
      name: detailCurrentProduct.name,
      price: detailCurrentProduct.price,
      image: detailCurrentProduct.image,
      unit: detailCurrentProduct.unit || "Pcs",
      qty: detailCurrentQty,
      category: detailCurrentProduct.category
    });
  }
  localStorage.setItem("delina_cart", JSON.stringify(cart));
  updateCartBadge();
  renderCartDrawer();
  closeProductDetailModal();
  openCheckoutModal();
}

// =========================================================================
// 12. LOGIKA KHUSUS KALKULATOR FOTOKOPI & UNGGAH DOKUMEN (FASE 2)
// =========================================================================

function updatePrintTypeUI(type) {
  currentPrintType = type;
  const labelBW = document.getElementById("labelBW");
  const labelColor = document.getElementById("labelColor");
  if (!labelBW || !labelColor) return;

  if (type === "bw") {
    labelBW.className =
      "cursor-pointer border rounded-xl p-2.5 text-center flex flex-col items-center gap-1 hover:border-emerald-500 transition-all bg-emerald-50/50 border-emerald-400";
    labelColor.className =
      "cursor-pointer border rounded-xl p-2.5 text-center flex flex-col items-center gap-1 hover:border-emerald-500 transition-all border-gray-200";
  } else {
    labelBW.className =
      "cursor-pointer border rounded-xl p-2.5 text-center flex flex-col items-center gap-1 hover:border-emerald-500 transition-all border-gray-200";
    labelColor.className =
      "cursor-pointer border rounded-xl p-2.5 text-center flex flex-col items-center gap-1 hover:border-emerald-500 transition-all bg-emerald-50/50 border-emerald-400";
  }
  calculateFotokopi();
}

// Tarif Fotokopi & Jilid Live dari Backend
let LIVE_TARIF = {
  PRINT_BW_A4: 250,
  PRINT_COLOR_A4: 1000,
  PRINT_BW_F4: 300,
  PRINT_COLOR_F4: 1200,
  JILID_LAKBAN: 4000,
  JILID_SPIRAL: 10000,
  ONGKIR_KURIR: 5000
};

function calculateFotokopi() {
  const lembarInput = document.getElementById("lembarCount");
  const rangkapInput = document.getElementById("rangkapCount");
  const jilidSelect = document.getElementById("jilidOption");
  const sizeSelect = document.getElementById("kertasSize");

  const lembar = parseInt(lembarInput ? lembarInput.value : 10) || 0;
  const rangkap = parseInt(rangkapInput ? rangkapInput.value : 1) || 1;
  const jilid = jilidSelect ? jilidSelect.value : "none";
  const size = sizeSelect ? sizeSelect.value : "A4";

  const keyRate = (currentPrintType === "bw")
    ? (size === "F4" ? "PRINT_BW_F4" : "PRINT_BW_A4")
    : (size === "F4" ? "PRINT_COLOR_F4" : "PRINT_COLOR_A4");

  const pricePerLembar = (LIVE_TARIF && LIVE_TARIF[keyRate]) ? LIVE_TARIF[keyRate] : (currentPrintType === "bw" ? 250 : 1000);
  let jilidCost = 0;
  if (jilid === "lakban") jilidCost = (LIVE_TARIF && LIVE_TARIF.JILID_LAKBAN) || 4000;
  if (jilid === "spiral") jilidCost = (LIVE_TARIF && LIVE_TARIF.JILID_SPIRAL) || 10000;

  const totalHalaman = lembar * rangkap;
  const total = totalHalaman * pricePerLembar + jilidCost * rangkap;

  const totalElem = document.getElementById("fotokopiTotal");
  if (totalElem) {
    totalElem.textContent = formatRupiah(total);
  }
  return { total, lembar, rangkap, size, type: currentPrintType, jilid };
}

// Penanganan Unggah File Dokumen Fotokopi (Validasi Maks 10 MB & Base64)
async function handleFotokopiFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Batas 10 MB
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    showToast("Afwan kak, ukuran berkas melebihi batas 10 MB. Silakan kompres berkas terlebih dahulu.", "warning");
    event.target.value = "";
    return;
  }

  const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + " MB";
  try {
    const base64Data = await fileToBase64(file);
    uploadedFotokopiDoc = {
      name: file.name,
      size: sizeFormatted,
      type: file.type || "application/octet-stream",
      base64: base64Data
    };

    // Update UI Tampilan File
    document.getElementById("fotokopiFileNameText").textContent = file.name;
    document.getElementById("fotokopiFileSizeText").textContent = `Siap cetak (${sizeFormatted})`;
    document.getElementById("fotokopiFileNotice").classList.remove("hidden");
    document.getElementById("fotokopiNoticeText").textContent = `${file.name} (${sizeFormatted})`;
    showToast("Alhamdulillah, file dokumen berhasil diunggah.", "success");
  } catch (err) {
    console.error("Gagal membaca file fotokopi:", err);
    showToast("Gagal memproses file dokumen. Format tidak didukung.", "error");
  }
}

function clearFotokopiFile() {
  uploadedFotokopiDoc = null;
  const input = document.getElementById("fotokopiFileInput");
  if (input) input.value = "";
  const nameText = document.getElementById("fotokopiFileNameText");
  const sizeText = document.getElementById("fotokopiFileSizeText");
  const notice = document.getElementById("fotokopiFileNotice");

  if (nameText) nameText.textContent = "Pilih File Dokumen";
  if (sizeText) sizeText.textContent = "PDF, DOC, DOCX, JPG, PNG (Maks 10 MB)";
  if (notice) notice.classList.add("hidden");
}

function addFotokopiToCart() {
  const data = calculateFotokopi();
  const itemId = `FOTO-${Date.now()}`;
  const printName = data.type === "bw" ? "Hitam-Putih" : "Berwarna";

  const notesInput = document.getElementById("fotokopiNotes");
  const notes = notesInput ? notesInput.value.trim() : "";

  const item = {
    id: itemId,
    name: `Jasa Cetak/Fotokopi ${data.size} ${printName} (${data.lembar} lbr x ${data.rangkap} rangkap)`,
    price: data.total,
    image:
      "https://images.unsplash.com/photo-1568667256549-094345857637?w=500&auto=format&fit=crop&q=60",
    unit: "Paket",
    qty: 1,
    isFotokopi: true,
    specs: data,
    fileName: uploadedFotokopiDoc ? uploadedFotokopiDoc.name : null,
    fileSize: uploadedFotokopiDoc ? uploadedFotokopiDoc.size : null,
    fileBase64: uploadedFotokopiDoc ? uploadedFotokopiDoc.base64 : null,
    notes: notes || null
  };

  cart.push(item);
  saveCart();
  updateCartBadge();
  showToast("Alhamdulillah, pesanan fotokopi dimasukkan ke keranjang.");

  // Bersihkan form unggah & catatan
  clearFotokopiFile();
  if (notesInput) notesInput.value = "";

  toggleCartDrawer(true);
}

// =========================================================================
// 12.A HERO PROMOTIONAL CAROUSEL (RESPONSIVE & TOUCH SWIPE)
// =========================================================================
let heroCurrentIndex = 0;
const HERO_TOTAL_SLIDES = 3;
let heroAutoPlayTimer = null;
const HERO_AUTOPLAY_INTERVAL = 4500; // 4.5 detik auto-play

function goToHeroSlide(index) {
  const track = document.getElementById("heroCarouselTrack");
  const dots = document.querySelectorAll("#heroCarouselDots .hero-dot");
  if (!track) return;

  // Normalisasi index (wrap-around 0 s/d HERO_TOTAL_SLIDES - 1)
  heroCurrentIndex = ((index % HERO_TOTAL_SLIDES) + HERO_TOTAL_SLIDES) % HERO_TOTAL_SLIDES;

  // Animasi transform translateX yang halus
  track.style.transform = `translateX(-${heroCurrentIndex * 100}%)`;

  // Update visual dot indicator
  dots.forEach((dot, idx) => {
    if (idx === heroCurrentIndex) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

function nextHeroSlide() {
  goToHeroSlide(heroCurrentIndex + 1);
}

function prevHeroSlide() {
  goToHeroSlide(heroCurrentIndex - 1);
}

function startHeroAutoPlay() {
  stopHeroAutoPlay();
  heroAutoPlayTimer = setInterval(() => {
    nextHeroSlide();
  }, HERO_AUTOPLAY_INTERVAL);
}

function stopHeroAutoPlay() {
  if (heroAutoPlayTimer) {
    clearInterval(heroAutoPlayTimer);
    heroAutoPlayTimer = null;
  }
}

function initHeroCarousel() {
  const container = document.getElementById("heroCarousel");
  const track = document.getElementById("heroCarouselTrack");
  if (!container || !track) return;

  // Inisialisasi awal ke slide pertama & nyalakan auto-play
  goToHeroSlide(0);
  startHeroAutoPlay();

  // 1. Mouse Hover Events (Desktop / Laptop)
  container.addEventListener("mouseenter", () => {
    stopHeroAutoPlay();
  });
  container.addEventListener("mouseleave", () => {
    startHeroAutoPlay();
  });

  // 2. Touch Swipe Events (Smartphone & Samsung Galaxy Tab)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwiping = false;

  container.addEventListener("touchstart", (e) => {
    stopHeroAutoPlay();
    if (e.touches && e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
      isSwiping = true;
    }
  }, { passive: true });

  container.addEventListener("touchmove", (e) => {
    if (!isSwiping || !e.touches || e.touches.length === 0) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Geser horizontal jika swipe X melebihi threshold dan lebih besar dari gerakan vertikal
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // Geser ke kiri -> Next slide
        nextHeroSlide();
      } else {
        // Geser ke kanan -> Prev slide
        prevHeroSlide();
      }
    }

    startHeroAutoPlay();
  }, { passive: true });

  container.addEventListener("touchcancel", () => {
    isSwiping = false;
    startHeroAutoPlay();
  }, { passive: true });
}

function handleSlideBelanja() {
  selectCategory("Semua Produk");
  const categorySection = document.getElementById("categorySection");
  if (categorySection) {
    categorySection.scrollIntoView({ behavior: "smooth" });
  }
}

function handleSlideAtk() {
  selectCategory("ATK & Kantor");
  const categorySection = document.getElementById("categorySection");
  if (categorySection) {
    categorySection.scrollIntoView({ behavior: "smooth" });
  }
}

// =========================================================================
// 12b. DYNAMIC HEADER ANIMATIF (ALA ALFAGIFT: COLLAPSIBLE SEARCH & PERSISTENT ICONS)
// =========================================================================
let isHeaderScrolled = false;
let headerTicking = false;

function initAlfagiftHeaderScroll() {
  const header = document.getElementById("mainHeader");
  if (!header) return;

  const handleScroll = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > 20 && !isHeaderScrolled) {
      isHeaderScrolled = true;
      header.classList.add("scrolled");
    } else if (scrollY <= 15 && isHeaderScrolled) {
      isHeaderScrolled = false;
      header.classList.remove("scrolled");
    }
    headerTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (!headerTicking) {
      window.requestAnimationFrame(handleScroll);
      headerTicking = true;
    }
  }, { passive: true });

  // Panggil sekali saat start
  handleScroll();
}

// Modal Promo & Kupon Diskon (Ala Lonceng Alfagift)
function openPromoInfoModal() {
  const modal = document.getElementById("modalPromoInfo");
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (typeof pushModalState === "function") pushModalState("modalPromoInfo");
  }
}

function closePromoInfoModal() {
  const modal = document.getElementById("modalPromoInfo");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

function copyPromoCouponCode(code) {
  if (!code) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).catch(() => {});
  }
  const couponInput = document.getElementById("couponInput");
  if (couponInput) {
    couponInput.value = code;
  }
  showToast(`✅ Kode kupon "${code}" berhasil disalin! Silakan gunakan di keranjang belanja.`);
  closePromoInfoModal();
}

// Alias setPrintType
const setPrintType = updatePrintTypeUI;

// =========================================================================
// 13. LOGIKA MODAL CHECKOUT & PEMBAYARAN QRIS (FASE 2)
// =========================================================================

function goToCheckout() {
  if (!cart || cart.length === 0) {
    showToast("Keranjang belanja masih kosong kak. Silakan pilih produk terlebih dahulu!", "warning");
    return;
  }
  openCheckoutModal();
}

function openCheckoutModal() {
  // Tutup drawer belanja tanpa memicu history.back() karena ini transisi maju
  toggleCartDrawer(false, false);
  renderCheckoutSummary();

  // 1. Auto-fill & Kunci Otomatis Data Pemesan jika Akun Member Sedang Login (Fitur Integrasi Member VIP)
  const memberBadge = document.getElementById("checkoutMemberBadgeIndicator");
  const memberBanner = document.getElementById("checkoutMemberBanner");
  const nameInput = document.getElementById("custName");
  const phoneInput = document.getElementById("custPhone");
  const addressInput = document.getElementById("custAddress");
  const nameLockBadge = document.getElementById("custNameLockBadge");
  const phoneLockBadge = document.getElementById("custPhoneLockBadge");

  if (currentMemberSession) {
    if (nameInput) {
      nameInput.value = currentMemberSession.name || "";
      nameInput.readOnly = true;
      nameInput.classList.add("bg-emerald-50/80", "border-emerald-300", "text-emerald-950", "font-bold", "cursor-not-allowed");
      nameInput.classList.remove("bg-gray-50");
    }
    if (phoneInput) {
      phoneInput.value = currentMemberSession.phone || "";
      phoneInput.readOnly = true;
      phoneInput.classList.add("bg-emerald-50/80", "border-emerald-300", "text-emerald-950", "font-bold", "cursor-not-allowed");
      phoneInput.classList.remove("bg-gray-50");
    }
    if (addressInput) {
      addressInput.readOnly = false;
      if (!addressInput.value && currentMemberSession.address) {
        addressInput.value = currentMemberSession.address;
      }
    }
    if (nameLockBadge) nameLockBadge.classList.remove("hidden");
    if (phoneLockBadge) phoneLockBadge.classList.remove("hidden");
    if (memberBadge) memberBadge.classList.remove("hidden");
    if (memberBanner) memberBanner.classList.remove("hidden");
  } else {
    if (nameInput) {
      nameInput.readOnly = false;
      nameInput.classList.remove("bg-emerald-50/80", "border-emerald-300", "text-emerald-950", "font-bold", "cursor-not-allowed");
      nameInput.classList.add("bg-gray-50");
    }
    if (phoneInput) {
      phoneInput.readOnly = false;
      phoneInput.classList.remove("bg-emerald-50/80", "border-emerald-300", "text-emerald-950", "font-bold", "cursor-not-allowed");
      phoneInput.classList.add("bg-gray-50");
    }
    if (nameLockBadge) nameLockBadge.classList.add("hidden");
    if (phoneLockBadge) phoneLockBadge.classList.add("hidden");
    if (memberBadge) memberBadge.classList.add("hidden");
    if (memberBanner) memberBanner.classList.add("hidden");
  }

  const modal = document.getElementById("checkoutModal");
  if (modal) {
    modal.classList.remove("hidden");
    if (history.state && history.state.modalOpen) {
      try {
        history.replaceState({ modalOpen: true, modalId: "checkoutModal", count: modalHistoryCount }, "");
      } catch (err) {}
    } else {
      if (typeof pushModalState === "function") pushModalState("checkoutModal");
    }
  }
}

function closeCheckoutModal(notifyHistory = true) {
  const modal = document.getElementById("checkoutModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    if (notifyHistory && wasOpen && typeof notifyModalClosed === "function") {
      notifyModalClosed();
    }
  }
}

// =========================================================================
// ATURAN HARGA GROSIR BERTINGKAT & KUPON PROMO BERKAH (FITUR 4)
// =========================================================================

// Aturan Diskon Grosir Bertingkat Otomatis (Tanpa Perlu Kode)
function hitungDiskonGrosirKeranjang() {
  let totalDiskonGrosir = 0;
  cart.forEach(item => {
    const nameLower = (item.name || "").toLowerCase();
    
    // 1. Kertas HVS: Beli >= 5 Rim dapat potongan Rp 2.000 / rim
    if (nameLower.includes("kertas hvs") && item.qty >= 5) {
      const diskon = item.qty * 2000;
      totalDiskonGrosir += diskon;
      item.isGrosir = true;
      item.grosirDesc = "Grosir -Rp 2.000/rim";
    }
    // 2. Buku Tulis: Beli >= 3 Pack dapat potongan Rp 1.500 / pack
    else if (nameLower.includes("buku tulis") && item.qty >= 3) {
      const diskon = item.qty * 1500;
      totalDiskonGrosir += diskon;
      item.isGrosir = true;
      item.grosirDesc = "Grosir -Rp 1.500/pack";
    }
    // 3. Pulpen Standard: Beli >= 2 Lusin dapat potongan Rp 2.000 / lusin
    else if (nameLower.includes("pulpen standard") && item.qty >= 2) {
      const diskon = item.qty * 2000;
      totalDiskonGrosir += diskon;
      item.isGrosir = true;
      item.grosirDesc = "Grosir -Rp 2.000/lusin";
    }
    else {
      item.isGrosir = false;
    }
  });

  return totalDiskonGrosir;
}

// Daftar Kupon Promo Berkah (Dapat Diperbarui Dinamis dari Google Sheets)
let PROMO_COUPONS = {
  "JUMATBERKAH": {
    code: "JUMATBERKAH",
    type: "fixed",
    discount: 5000,
    minSpend: 50000,
    desc: "Diskon Berkah Rp 5.000 (Min. Belanja Rp 50.000)"
  },
  "DELINABAROKAH": {
    code: "DELINABAROKAH",
    type: "percent",
    rate: 0.10,
    maxDiscount: 15000,
    minSpend: 30000,
    desc: "Diskon 10% s.d Rp 15.000 (Min. Belanja Rp 30.000)"
  },
  "BELANJABERKAH": {
    code: "BELANJABERKAH",
    type: "fixed",
    discount: 3000,
    minSpend: 20000,
    desc: "Potongan Rp 3.000 Belanja Hemat"
  },
  "DISKON5K": {
    code: "DISKON5K",
    type: "fixed",
    discount: 5000,
    minSpend: 40000,
    desc: "Potongan Langsung Rp 5.000 (Min. Belanja Rp 40.000)"
  }
};

let appliedCoupon = null;

function applyCouponCode() {
  const input = document.getElementById("couponInput");
  const msgElem = document.getElementById("couponMessage");
  if (!input) return;

  const rawCode = input.value.trim().toUpperCase();
  if (!rawCode) {
    if (msgElem) {
      msgElem.textContent = "Silakan ketik kode kupon terlebih dahulu.";
      msgElem.className = "text-[11px] mt-1.5 text-red-500 font-medium block";
    }
    return;
  }

  const coupon = PROMO_COUPONS[rawCode];
  if (!coupon) {
    if (msgElem) {
      msgElem.textContent = `Kode "${rawCode}" tidak ditemukan atau sudah kadaluarsa.`;
      msgElem.className = "text-[11px] mt-1.5 text-red-500 font-medium block";
    }
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (subtotal < coupon.minSpend) {
    if (msgElem) {
      msgElem.textContent = `Kupon ini berlaku untuk minimal belanja ${formatRupiah(coupon.minSpend)}.`;
      msgElem.className = "text-[11px] mt-1.5 text-amber-600 font-medium block";
    }
    return;
  }

  appliedCoupon = coupon;
  if (msgElem) {
    msgElem.textContent = `Alhamdulillah! Kupon ${coupon.code} aktif (${coupon.desc}).`;
    msgElem.className = "text-[11px] mt-1.5 text-emerald-600 font-bold block";
  }

  showToast(`Kupon ${coupon.code} berhasil diterapkan!`);
  renderCheckoutSummary();
}

function removeCouponCode() {
  appliedCoupon = null;
  const input = document.getElementById("couponInput");
  const msgElem = document.getElementById("couponMessage");
  if (input) input.value = "";
  if (msgElem) msgElem.classList.add("hidden");
  showToast("Kupon promo telah dibatalkan.");
  renderCheckoutSummary();
}

// Helper Gambar Thumbnail Produk di Keranjang / Checkout
function resolveCartItemImageUrl(item) {
  if (!item) return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200";
  if (item.image) return formatImageUrl(item.image);
  if (typeof products !== "undefined" && Array.isArray(products)) {
    const found = products.find(p =>
      p && (
        (item.id && String(p.id).toUpperCase() === String(item.id).toUpperCase()) ||
        (item.name && String(p.name).toLowerCase() === String(item.name).toLowerCase())
      )
    );
    if (found && found.image) return formatImageUrl(found.image);
  }
  if (item.isFotokopi || String(item.name || "").toLowerCase().includes("fotokopi") || String(item.name || "").toLowerCase().includes("cetak")) {
    return "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=200&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&auto=format&fit=crop&q=80";
}

let isStickyCheckoutCollapsed = false;
function toggleStickyCheckoutSummaryBody() {
  if (typeof playCuteSound === "function") playCuteSound("pop");
  const body = document.getElementById("checkoutStickyCollapsibleBody");
  const text = document.getElementById("stickyCheckoutToggleText");
  const icon = document.getElementById("stickyCheckoutToggleIcon");
  if (!body) return;

  isStickyCheckoutCollapsed = !isStickyCheckoutCollapsed;
  if (isStickyCheckoutCollapsed) {
    body.classList.add("hidden");
    if (text) text.textContent = "Lihat Barang";
    if (icon) icon.classList.add("rotate-180");
  } else {
    body.classList.remove("hidden");
    if (text) text.textContent = "Ringkas";
    if (icon) icon.classList.remove("rotate-180");
  }
}

// Hitung Ulang & Render Rincian di Modal Checkout (Lengkap dengan Foto Barang)
function renderCheckoutSummary() {
  const container = document.getElementById("checkoutItemsList");
  const countElem = document.getElementById("checkoutItemCount");
  const subtotalElem = document.getElementById("checkoutSubtotal");
  const ongkirElem = document.getElementById("checkoutOngkir");
  const grandTotalElem = document.getElementById("checkoutGrandTotal");

  const rowGrosir = document.getElementById("rowDiskonGrosir");
  const grosirElem = document.getElementById("checkoutDiskonGrosir");
  const rowKupon = document.getElementById("rowDiskonKupon");
  const kuponElem = document.getElementById("checkoutDiskonKupon");
  const kuponLabel = document.getElementById("checkoutKuponLabel");

  if (!container) return;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // 1. Diskon Grosir Bertingkat
  const diskonGrosir = hitungDiskonGrosirKeranjang();
  if (rowGrosir && grosirElem) {
    if (diskonGrosir > 0) {
      rowGrosir.classList.remove("hidden");
      grosirElem.textContent = `- ${formatRupiah(diskonGrosir)}`;
    } else {
      rowGrosir.classList.add("hidden");
    }
  }

  // 2. Diskon Kupon Promo Berkah
  let diskonKupon = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "fixed" || appliedCoupon.type === "NOMINAL") {
      diskonKupon = appliedCoupon.discount || appliedCoupon.value || 0;
    } else if (appliedCoupon.type === "percent" || appliedCoupon.type === "PERSEN") {
      const rate = appliedCoupon.rate || ((appliedCoupon.discount || appliedCoupon.value || 0) / 100);
      diskonKupon = Math.min(appliedCoupon.maxDiscount || 999999, Math.round(subtotal * rate));
    }

    if (rowKupon && kuponElem) {
      rowKupon.classList.remove("hidden");
      if (kuponLabel) kuponLabel.textContent = `🎟️ Kupon (${appliedCoupon.code}):`;
      kuponElem.textContent = `- ${formatRupiah(diskonKupon)}`;
    }
  } else {
    if (rowKupon) rowKupon.classList.add("hidden");
  }

  // 3. Grand Total Bersih
  const totalPotongan = diskonGrosir + diskonKupon;
  const grandTotal = Math.max(0, subtotal - totalPotongan + deliveryFee);

  if (countElem) countElem.textContent = `${totalItemsCount} Barang`;
  if (subtotalElem) subtotalElem.textContent = formatRupiah(subtotal);

  if (ongkirElem) {
    ongkirElem.textContent =
      selectedDeliveryMethod === "courier"
        ? formatRupiah(5000)
        : "Rp 0 (Ambil Sendiri)";
  }

  if (grandTotalElem) grandTotalElem.textContent = formatRupiah(grandTotal);

  container.innerHTML = cart
    .map(item => {
      const thumbUrl = resolveCartItemImageUrl(item);
      let badgeGrosirHtml = item.isGrosir
        ? `<span class="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded ml-1">🏷️ Grosir</span>`
        : "";
      return `
      <div class="flex items-center justify-between gap-2.5 text-xs py-1.5 border-b border-gray-100 dark:border-slate-800 last:border-none">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0 shadow-2xs">
            <img src="${thumbUrl}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200'" />
            <span class="absolute bottom-0 right-0 bg-emerald-800/95 text-amber-300 text-[8px] font-black px-1 py-0.2 rounded-tl-md leading-tight">${item.qty}x</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-bold text-gray-800 dark:text-slate-100 truncate leading-snug">${escapeHtml(item.name)}</div>
            <div class="text-gray-400 dark:text-slate-400 text-[10px] flex items-center gap-1 mt-0.5">
              <span>${item.qty} x ${formatRupiah(item.price)}</span>
              ${badgeGrosirHtml}
            </div>
          </div>
        </div>
        <span class="font-extrabold text-emerald-800 dark:text-emerald-400 font-mono flex-shrink-0">${formatRupiah(item.price * item.qty)}</span>
      </div>
    `;
    })
    .join("");
}

let selectedDeliveryTimeSlotVal = "";

function selectDeliveryTimeSlot(slotText) {
  selectedDeliveryTimeSlotVal = String(slotText || "").trim();
  if (typeof playCuteSound === "function") playCuteSound("pop");

  const hiddenInput = document.getElementById("selectedDeliveryTimeSlot");
  if (hiddenInput) hiddenInput.value = selectedDeliveryTimeSlotVal;

  // Update visual tombol slot waktu
  document.querySelectorAll(".time-slot-btn").forEach(btn => {
    const val = btn.getAttribute("data-slot");
    if (val === selectedDeliveryTimeSlotVal) {
      btn.className = "time-slot-btn py-2 px-2.5 rounded-xl border-2 border-emerald-600 bg-emerald-700 text-white text-left transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm ring-2 ring-amber-400/50";
      btn.querySelectorAll("span").forEach(sp => {
        sp.classList.remove("text-slate-800", "text-slate-400", "text-emerald-700");
        sp.classList.add("text-white");
      });
    } else {
      btn.className = "time-slot-btn py-2 px-2.5 rounded-xl border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-left transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs";
      const spans = btn.querySelectorAll("div span");
      if (spans[0]) spans[0].className = "font-extrabold text-[11px] text-slate-800 dark:text-white block truncate";
      if (spans[1]) spans[1].className = "text-[9px] text-slate-400 block";
    }
  });

  const summaryBox = document.getElementById("selectedScheduleSummaryBox");
  const summaryText = document.getElementById("selectedScheduleSummaryText");
  const topBadge = document.getElementById("selectedScheduleBadgeTop");
  const pickupSub = document.getElementById("pickupTimeSubLabel");
  const courierSub = document.getElementById("courierTimeSubLabel");

  const methodPrefix = selectedDeliveryMethod === "courier" ? "Diantar Kurir" : "Ambil di Toko";
  if (summaryBox && summaryText) {
    summaryBox.classList.remove("hidden");
    summaryText.textContent = `${methodPrefix}: ${selectedDeliveryTimeSlotVal}`;
  }
  if (topBadge) {
    topBadge.textContent = `✅ ${selectedDeliveryTimeSlotVal}`;
    topBadge.className = "text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300";
  }
  if (selectedDeliveryMethod === "pickup" && pickupSub) {
    pickupSub.innerHTML = `<i class="bi bi-check-circle-fill text-emerald-700"></i> Jam Ambil: ${escapeHtml(selectedDeliveryTimeSlotVal)}`;
    pickupSub.className = "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-[9px] border border-emerald-400";
  } else if (selectedDeliveryMethod === "courier" && courierSub) {
    courierSub.innerHTML = `<i class="bi bi-check-circle-fill text-emerald-700"></i> Jam Antar: ${escapeHtml(selectedDeliveryTimeSlotVal)}`;
    courierSub.className = "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-[9px] border border-emerald-400";
  }
}

// Pergantian Metode Pengambilan (Ambil di Toko vs Kurir Toko) + Panel Atur Jam Wajib
function handleDeliveryChange(method, fromClick = false) {
  selectedDeliveryMethod = method;
  deliveryFee = method === "courier" ? 5000 : 0;
  if (fromClick && typeof playCuteSound === "function") playCuteSound("pop");

  const labelPickup = document.getElementById("labelPickup");
  const labelCourier = document.getElementById("labelCourier");
  const addressContainer = document.getElementById("addressFieldContainer");
  const scheduleTitle = document.getElementById("scheduleSectionTitle");
  const slotContainer = document.getElementById("deliveryTimeSlotContainer");

  const radios = document.querySelectorAll('input[name="deliveryMethod"]');
  radios.forEach(r => { r.checked = (r.value === method); });

  if (method === "pickup") {
    if (labelPickup) {
      labelPickup.className =
        "delivery-radio-card cursor-pointer border-2 rounded-2xl p-3 flex items-start justify-between gap-2 bg-emerald-50/70 border-emerald-500 transition-all active:scale-98 shadow-2xs";
    }
    if (labelCourier) {
      labelCourier.className =
        "delivery-radio-card cursor-pointer border-2 rounded-2xl p-3 flex items-start justify-between gap-2 border-gray-200 hover:border-emerald-300 transition-all active:scale-98";
    }
    if (addressContainer) addressContainer.classList.add("hidden");
    if (scheduleTitle) {
      scheduleTitle.innerHTML = `Atur Jam Pengambilan di Toko <span class="text-red-500">*Wajib</span>`;
    }
  } else {
    if (labelPickup) {
      labelPickup.className =
        "delivery-radio-card cursor-pointer border-2 rounded-2xl p-3 flex items-start justify-between gap-2 border-gray-200 hover:border-emerald-300 transition-all active:scale-98";
    }
    if (labelCourier) {
      labelCourier.className =
        "delivery-radio-card cursor-pointer border-2 rounded-2xl p-3 flex items-start justify-between gap-2 bg-emerald-50/70 border-emerald-500 transition-all active:scale-98 shadow-2xs";
    }
    if (addressContainer) addressContainer.classList.remove("hidden");
    if (scheduleTitle) {
      scheduleTitle.innerHTML = `Atur Jam Pengantaran Kurir Toko <span class="text-red-500">*Wajib</span>`;
    }
  }

  if (selectedDeliveryTimeSlotVal) {
    selectDeliveryTimeSlot(selectedDeliveryTimeSlotVal);
  }

  if (fromClick && slotContainer) {
    slotContainer.classList.add("ring-2", "ring-amber-400");
    setTimeout(() => slotContainer.classList.remove("ring-2", "ring-amber-400"), 800);
  }

  renderCheckoutSummary();
}

// Penanganan Unggah Bukti Bayar (Maks 5 MB & Preview Gambar)
async function handlePaymentProofSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Batas 5 MB
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    showToast("Afwan kak, ukuran bukti transfer melebihi batas 5 MB. Silakan gunakan foto yang lebih kecil.", "warning");
    event.target.value = "";
    return;
  }

  const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + " MB";
  try {
    const base64Data = await fileToBase64(file);
    uploadedPaymentProof = {
      name: file.name,
      size: sizeFormatted,
      type: file.type || "image/jpeg",
      base64: base64Data
    };

    // Update UI Pratinjau
    const previewContainer = document.getElementById("paymentProofPreviewContainer");
    const previewImg = document.getElementById("paymentProofPreviewImg");
    const previewName = document.getElementById("paymentProofPreviewName");
    const previewSize = document.getElementById("paymentProofPreviewSize");

    if (previewContainer && previewImg) {
      previewImg.src = base64Data;
      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = sizeFormatted;
      previewContainer.classList.remove("hidden");
    }

    showToast("Alhamdulillah, bukti bayar siap dikonfirmasi.", "success");
  } catch (err) {
    console.error("Gagal membaca bukti bayar:", err);
    showToast("Gagal memproses file gambar bukti transfer.", "error");
  }
}

function clearPaymentProof() {
  uploadedPaymentProof = null;
  const input = document.getElementById("paymentProofInput");
  if (input) input.value = "";
  const previewContainer = document.getElementById("paymentProofPreviewContainer");
  if (previewContainer) previewContainer.classList.add("hidden");
}

// Fitur Simulasi Pembayaran Instan: Menggambar Struk Digital via Canvas Base64
function useSimulatedReceipt() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 420;
    canvas.height = 540;
    const ctx = canvas.getContext("2d");

    // Latar Belakang Kertas Struk
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 420, 540);

    // Bingkai Luar
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 400, 520);

    // Header Toko Delina
    ctx.fillStyle = "#065f46";
    ctx.fillRect(10, 10, 400, 80);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DELINA.STORE", 210, 44);

    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#a7f3d0";
    ctx.fillText("BUKTI TRANSAKSI ELEKTRONIK (SIMULASI)", 210, 66);

    // Garis Putus-putus Header
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.lineTo(390, 110);
    ctx.stroke();
    ctx.setLineDash([]);

    // Data Transaksi
    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const randomRef = "SIM-QRIS-" + Math.floor(100000 + Math.random() * 900000);

    ctx.textAlign = "left";
    ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Waktu Transaksi", 30, 138);
    ctx.fillText("No. Referensi", 30, 166);
    ctx.fillText("Kanal Pembayaran", 30, 194);
    ctx.fillText("Status Bayar", 30, 222);

    ctx.textAlign = "right";
    ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(`${dateStr}, ${timeStr} WIB`, 390, 138);
    ctx.fillText(randomRef, 390, 166);
    ctx.fillText("QRIS Shopee / BCA / Dana", 390, 194);
    ctx.fillStyle = "#059669";
    ctx.fillText("BERHASIL / LUNAS", 390, 222);

    // Garis Pembatas
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 245);
    ctx.lineTo(390, 245);
    ctx.stroke();

    // Rincian Pembayaran
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Total Tagihan Transaksi", 30, 280);

    let totalBayar = 50000;
    if (cart && cart.length > 0) {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const diskonGrosir = typeof hitungDiskonGrosirKeranjang === "function" ? hitungDiskonGrosirKeranjang() : 0;
      totalBayar = Math.max(0, subtotal - diskonGrosir + (deliveryFee || 0));
    }

    ctx.textAlign = "right";
    ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#065f46";
    ctx.fillText(formatRupiah(totalBayar), 390, 282);

    // Cap Stempel LUNAS Besar Miring
    ctx.save();
    ctx.translate(210, 385);
    ctx.rotate(-12 * Math.PI / 180);
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 3.5;
    ctx.strokeRect(-95, -34, 190, 68);
    ctx.fillStyle = "rgba(5, 150, 105, 0.08)";
    ctx.fillRect(-95, -34, 190, 68);
    ctx.fillStyle = "#059669";
    ctx.font = "900 24px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LUNAS", 0, -2);
    ctx.font = "bold 9px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("VERIFIED BY SIMULATOR", 0, 18);
    ctx.restore();

    // Footer Struk
    ctx.font = "10px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Terima kasih atas amanah berbelanja di Toko Delina.", 210, 485);
    ctx.fillText("Simpan struk digital ini sebagai bukti sah transaksi.", 210, 502);

    const base64Data = canvas.toDataURL("image/png");

    uploadedPaymentProof = {
      name: "struk-simulasi-lunas.png",
      size: "42 KB (Simulasi Otomatis)",
      type: "image/png",
      base64: base64Data
    };

    // Tampilkan Pratinjau di Modal Checkout
    const previewContainer = document.getElementById("paymentProofPreviewContainer");
    const previewImg = document.getElementById("paymentProofPreviewImg");
    const previewName = document.getElementById("paymentProofPreviewName");
    const previewSize = document.getElementById("paymentProofPreviewSize");

    if (previewContainer && previewImg) {
      previewImg.src = base64Data;
      if (previewName) previewName.textContent = "struk-simulasi-lunas.png";
      if (previewSize) previewSize.textContent = "42 KB (Simulasi Otomatis)";
      previewContainer.classList.remove("hidden");
    }

    showToast("🧪 Struk simulasi berhasil dibuat & bukti bayar terverifikasi!", "success");
  } catch (err) {
    console.error("Gagal generate struk simulasi:", err);
    showToast("Gagal membuat struk simulasi. Silakan unggah foto biasa.", "error");
  }
}

// Salin Teks ke Clipboard dengan Feedback 2 Detik & Toast
function copyToClipboard(text, btnElement) {
  if (!text) return;

  // 1. Salin ke clipboard browser (modern + fallback)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }

  // 2. Beri efek feedback pada tombol selama 2 detik
  if (btnElement) {
    const originalHtml = btnElement.innerHTML;
    btnElement.innerHTML = `<span>✓ Tersalin!</span>`;
    btnElement.classList.add("copied");
    setTimeout(() => {
      btnElement.innerHTML = originalHtml;
      btnElement.classList.remove("copied");
    }, 2000);
  }

  // 3. Tampilkan toast ringkas
  if (typeof showToast === "function") {
    showToast(`📋 Berhasil disalin: ${text}`);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.warn("Fallback copy failed:", err);
  }
  document.body.removeChild(textArea);
}

// Salin No Rekening
function copyRekening(rekNumber, btnElement) {
  copyToClipboard(rekNumber, btnElement);
}

// Konfirmasi & Kirim Pesanan (Simulasi Fase 2)
function submitOrderCheckout() {
  const nameInput = document.getElementById("custName");
  const phoneInput = document.getElementById("custPhone");
  const addressInput = document.getElementById("custAddress");

  const customerName = nameInput ? nameInput.value.trim() : "";
  const customerPhone = phoneInput ? phoneInput.value.trim() : "";
  const customerAddress = addressInput ? addressInput.value.trim() : "";

  // Validasi Isian Wajib
  if (!customerName) {
    showToast("Mohon masukkan Nama Lengkap Anda.", "warning");
    if (nameInput) nameInput.focus();
    return;
  }

  if (!customerPhone) {
    showToast("Mohon masukkan Nomor WhatsApp aktif Anda.", "warning");
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (selectedDeliveryMethod === "courier" && !customerAddress) {
    showToast("Mohon lengkapi Alamat Lengkap Pengiriman untuk kurir toko.", "warning");
    if (addressInput) addressInput.focus();
    return;
  }

  // Validasi Wajib Pilih Jam Pengambilan / Pengantaran
  const slotInput = document.getElementById("selectedDeliveryTimeSlot");
  const chosenSlot = selectedDeliveryTimeSlotVal || (slotInput ? slotInput.value.trim() : "");
  if (!chosenSlot) {
    if (typeof playCuteSound === "function") playCuteSound("reminder");
    const slotBox = document.getElementById("deliveryTimeSlotContainer");
    if (slotBox) {
      slotBox.scrollIntoView({ behavior: "smooth", block: "center" });
      slotBox.classList.add("ring-4", "ring-rose-500");
      setTimeout(() => slotBox.classList.remove("ring-4", "ring-rose-500"), 1500);
    }
    showToast("⏰ Mohon pilih Jam Pengambilan / Pengantaran pesanan terlebih dahulu!", "warning");
    return;
  }

  // Wajib Unggah Bukti Bayar
  if (!uploadedPaymentProof) {
    showDelinaAlert({
      title: "Bukti Pembayaran Diperlukan",
      subtitle: "Verifikasi Checkout Delina",
      message: "Bukti transfer / pembayaran QRIS wajib diunggah sebelum pesanan diproses.",
      details: "💡 Tips: Anda dapat mengklik tombol '[🧪 Gunakan Struk Simulasi / Uji Coba]' di atas untuk mencoba proses checkout secara langsung tanpa harus menyiapkan foto asli.",
      buttonText: "Siap, Saya Mengerti",
      type: "warning",
      icon: "bi bi-receipt"
    });
    return;
  }

  // Buat Nomor Nota Pesanan Otomatis (#DLN-2026-XXXX)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `#DLN-2026-${randomSuffix}`;
  localStorage.setItem("delina_last_order_id", orderId);

  const orderTime = formatWaktuWIB(new Date());

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const diskonGrosir = hitungDiskonGrosirKeranjang();
  let diskonKupon = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "fixed") {
      diskonKupon = appliedCoupon.discount;
    } else if (appliedCoupon.type === "percent") {
      diskonKupon = Math.min(appliedCoupon.maxDiscount || 999999, Math.round(subtotal * appliedCoupon.rate));
    }
  }
  const totalPotongan = diskonGrosir + diskonKupon;
  const totalAkhir = Math.max(0, subtotal - totalPotongan + deliveryFee);

  const formattedDeliveryWithSlot = selectedDeliveryMethod === "courier"
    ? `Diantar Kurir (+ ${formatRupiah(5000)}) • Jam: ${chosenSlot}`
    : `Ambil Sendiri di Toko • Jam: ${chosenSlot}`;

  latestOrderData = {
    orderId,
    customerName,
    customerPhone,
    customerAddress: customerAddress || "-",
    deliveryMethod: formattedDeliveryWithSlot,
    scheduleSlot: chosenSlot,
    deliveryFee: deliveryFee,
    subtotalNumeric: subtotal,
    totalNumeric: totalAkhir,
    totalAkhir: formatRupiah(totalAkhir),
    orderTime,
    status: "Menunggu Verifikasi Toko",
    items: [...cart],
    hasPaymentProof: !!uploadedPaymentProof,
    paymentProofName: uploadedPaymentProof ? uploadedPaymentProof.name : "QRIS / Transfer Resmi",
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    discountAmount: totalPotongan,
    isVipMember: !!currentMemberSession
  };

  // Simpan juga ke riwayat transaksi lokal pelanggan agar langsung tampil di tab Hadiah (Riwayat Transaksi Belanja Anda)
  saveCustomerOrderToLocalHistory(latestOrderData);

  // Jika member login dan mengisi alamat baru, simpan alamatnya ke profil member
  if (currentMemberSession && customerAddress) {
    currentMemberSession.address = customerAddress;
    localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));
    saveMemberProfileLocalMap(currentMemberSession.phone, { address: customerAddress });
  }

  // Kirim data pesanan ke Google Apps Script Backend (Live Integration)
  if (typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
    const payload = {
      orderId: orderId,
      orderTime: orderTime,
      customerName: customerName,
      customerPhone: customerPhone,
      deliveryMethod: formattedDeliveryWithSlot,
      customerAddress: customerAddress || "-",
      paymentMethod: uploadedPaymentProof ? "QRIS" : "Bayar Tunai di Toko",
      totalAkhir: totalAkhir,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountAmount: totalPotongan,
      items: latestOrderData.items,
      fotokopiFile: null,
      paymentProof: uploadedPaymentProof ? {
        name: uploadedPaymentProof.name,
        base64: uploadedPaymentProof.base64
      } : null
    };

    // Kirim secara background ke Google Apps Script
    fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    }).then(() => {
      console.log("Alhamdulillah! Pesanan berhasil dikirim ke Google Sheets & Drive Delina.");
    }).catch(err => {
      console.warn("Info pengiriman live GAS:", err);
    });
  }

  // Bunyikan nada sukses ceria
  playCuteSound("fanfare");

  // Tutup Modal Checkout tanpa memicu history.back() karena transisi maju ke sukses
  closeCheckoutModal(false);

  // Buka Modal Sukses
  openSuccessModal(latestOrderData);

  // Kosongkan Keranjang Belanja & Kupon
  cart = [];
  appliedCoupon = null;
  saveCart();
  updateCartBadge();
  renderCartDrawer();

  // Bersihkan form input checkout
  if (nameInput && !currentMemberSession) nameInput.value = "";
  if (phoneInput && !currentMemberSession) phoneInput.value = "";
  clearPaymentProof();
}

// Buka Modal Sukses
function openSuccessModal(order) {
  const modal = document.getElementById("orderSuccessModal");
  if (!modal) return;

  document.getElementById("successCustName").textContent = order.customerName;
  document.getElementById("successOrderId").textContent = order.orderId;
  document.getElementById("successOrderTime").textContent = formatWaktuWIB(order.orderTime);
  document.getElementById("successDeliveryMethod").textContent = order.deliveryMethod || (selectedDeliveryMethod === "courier" ? "Diantar Kurir Toko" : "Ambil di Toko");
  document.getElementById("successOrderTotal").textContent = order.totalAkhir;

  modal.classList.remove("hidden");
  if (history.state && history.state.modalOpen) {
    try {
      history.replaceState({ modalOpen: true, modalId: "orderSuccessModal", count: modalHistoryCount }, "");
    } catch (err) {}
  } else {
    if (typeof pushModalState === "function") pushModalState("orderSuccessModal");
  }
}

function closeSuccessModal() {
  const modal = document.getElementById("orderSuccessModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

function copyOrderId() {
  if (!latestOrderData) return;
  navigator.clipboard.writeText(latestOrderData.orderId).then(() => {
    showToast(`Nomor Nota ${latestOrderData.orderId} disalin!`);
  });
}

function sendConfirmationWhatsApp(appMode = "regular") {
  if (!latestOrderData) return;

  const numEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  const itemsText = (latestOrderData.items || [])
    .map((item, idx) => {
      const prefix = numEmojis[idx] || `${idx + 1}.`;
      const itemPrice = formatRupiah(item.price || 0);
      const itemSub = formatRupiah((item.price || 0) * (item.qty || 1));
      return `${prefix} *${item.name}*\n   └ ${item.qty} x ${itemPrice} = *${itemSub}*`;
    })
    .join("\n");

  const vipBadgeText = (latestOrderData.isVipMember || currentMemberSession)
    ? " (👑 _VIP Member_)"
    : "";

  const discountLine = latestOrderData.discountAmount > 0
    ? `\n🏷️ *Total Hemat/Diskon:* -${formatRupiah(latestOrderData.discountAmount)}`
    : "";

  const wibTime = formatWaktuWIB(latestOrderData.orderTime);

  const message =
    `✨ *KONFIRMASI PESANAN BARU - DELINA.STORE* ✨\n` +
    `Assalamu'alaikum Admin Toko Delina 🙏\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🧾 *No. Nota:* *${latestOrderData.orderId}*\n` +
    `🗓️ *Waktu:* ${wibTime}\n` +
    `👤 *Pemesan:* *${latestOrderData.customerName}*${vipBadgeText}\n` +
    `📱 *No. WA:* ${latestOrderData.customerPhone || "-"}\n` +
    `🚚 *Metode:* ${latestOrderData.deliveryMethod}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🛍️ *RINCIAN BARANG BELANJA:*\n` +
    `${itemsText}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━` +
    `${discountLine}\n` +
    `💰 *TOTAL PEMBAYARAN:* *${latestOrderData.totalAkhir}*\n` +
    `💳 *Metode Bayar:* QRIS / Transfer (Bukti Terlampir ✅)\n` +
    `⭐ *Program Loyalitas:* +1 Stempel VIP Member\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Mohon pesanan saya segera diproses nggih. Terima kasih!_ 🙏🌿`;

  // Ambil nomor WhatsApp resmi toko (pastikan bukan nomor dummy 6281234567890)
  let storePhone = "6282185355316";
  if (window.currentTokoInfo && window.currentTokoInfo.wa && !String(window.currentTokoInfo.wa).includes("123456789")) {
    storePhone = window.currentTokoInfo.wa;
  } else if (typeof CONFIG !== "undefined" && CONFIG.WHATSAPP_PHONE && !String(CONFIG.WHATSAPP_PHONE).includes("123456789")) {
    storePhone = CONFIG.WHATSAPP_PHONE;
  }

  let cleanWa = String(storePhone || "6282185355316").replace(/\D/g, "");
  if (cleanWa.startsWith("0")) cleanWa = "62" + cleanWa.slice(1);
  else if (cleanWa.startsWith("8")) cleanWa = "62" + cleanWa;

  openWhatsAppWithAppChoice(cleanWa, message, appMode);
}

// Helper Universal Membuka WhatsApp Biasa vs WhatsApp Business (Android, iOS & Desktop)
function openWhatsAppWithAppChoice(cleanPhone, messageText, appMode = "regular") {
  const encodedText = encodeURIComponent(messageText || "");
  const webFallbackUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  const isAndroid = /android/i.test(navigator.userAgent || "");

  if (isAndroid) {
    if (appMode === "business") {
      // Target langsung package resmi WhatsApp Business (com.whatsapp.w4b) dengan fallback aman
      const intentW4b = `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${encodeURIComponent(webFallbackUrl)};end`;
      window.location.href = intentW4b;
      return;
    } else if (appMode === "regular") {
      // Target langsung package resmi WhatsApp Biasa (com.whatsapp) dengan fallback aman
      const intentWa = `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(webFallbackUrl)};end`;
      window.location.href = intentWa;
      return;
    }
  }

  window.open(webFallbackUrl, "_blank");
}

// =========================================================================
// 14. LOGIKA MOBILE & TABLET BOTTOM NAVIGATION BAR (GAYA GOPAY - HIJAU DELINA)
// =========================================================================

function setActiveBottomNav(menu) {
  // Alias normalizer
  if (menu === "member") menu = "hadiah";
  if (menu === "riwayat") menu = "lacak";
  activeBottomNav = menu;

  const navBtns = document.querySelectorAll(".bottom-nav-btn");
  navBtns.forEach(btn => {
    const btnNav = btn.dataset.nav;
    const isTarget = btnNav === menu;
    const pill = btn.querySelector(".nav-pill-wrapper");
    const label = btn.querySelector("span:not(.cart-badge)");

    if (isTarget) {
      btn.classList.add("active", "text-emerald-700");
      btn.classList.remove("text-gray-500", "dark:text-gray-400");
      if (pill) {
        pill.className = "nav-pill-wrapper bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold rounded-2xl py-1.5 px-4 flex flex-col items-center justify-center transition-all";
      }
      if (label) {
        label.classList.add("font-bold");
        label.classList.remove("font-medium");
      }
    } else {
      btn.classList.remove("active", "text-emerald-700");
      btn.classList.add("text-gray-500", "dark:text-gray-400");
      if (pill) {
        pill.className = "nav-pill-wrapper flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all text-gray-500 dark:text-gray-400";
      }
      if (label && btnNav !== "hadiah") {
        label.classList.remove("font-bold");
        label.classList.add("font-medium");
      }
    }
  });
}

function handleBottomNav(menu) {
  switch (menu) {
    case "home":
      setActiveBottomNav("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      selectCategory("Semua Produk");
      break;

    case "category":
      setActiveBottomNav("category");
      const categorySection = document.getElementById("categorySection");
      if (categorySection) {
        categorySection.scrollIntoView({ behavior: "smooth" });
      }
      break;

    case "hadiah":
    case "member":
      setActiveBottomNav("hadiah");
      openMemberModal();
      break;

    case "lacak":
    case "riwayat":
      setActiveBottomNav("lacak");
      openLacakPesananModal();
      break;

    case "cart":
      setActiveBottomNav("cart");
      toggleCartDrawer(true);
      break;

    case "account":
      openThemeModal();
      break;

    case "kiko":
      toggleKikoChat();
      break;
  }
}

// =========================================================================
// MODAL LACAK PESANAN & PENGAMBILAN TANPA ANTRE (EXPRESS PICK-UP)
// =========================================================================

function openLacakPesananModal(presetNota) {
  const modal = document.getElementById("lacakPesananModal");
  if (!modal) return;

  const input = document.getElementById("lacakInputNota");
  const recentShortcut = document.getElementById("lacakRecentShortcut");
  const btnRecent = document.getElementById("btnUseRecentNota");

  // Periksa apakah ada nota terakhir di localStorage
  const lastOrderId = localStorage.getItem("delina_last_order_id");
  if (lastOrderId && recentShortcut && btnRecent) {
    btnRecent.textContent = lastOrderId;
    btnRecent.onclick = () => {
      if (input) input.value = lastOrderId;
      executeLacakPesanan(lastOrderId);
    };
    recentShortcut.classList.remove("hidden");
  } else if (recentShortcut) {
    recentShortcut.classList.add("hidden");
  }

  if (presetNota && input) {
    input.value = presetNota;
    executeLacakPesanan(presetNota);
  } else if (lastOrderId && input && !input.value) {
    input.value = lastOrderId;
  }

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  if (typeof pushModalState === "function") pushModalState("lacakPesananModal");
}

function closeLacakPesananModal() {
  const modal = document.getElementById("lacakPesananModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    if (activeBottomNav === "lacak") {
      setActiveBottomNav("home");
    }
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

async function executeLacakPesanan(customNota) {
  const input = document.getElementById("lacakInputNota");
  let notaQuery = (customNota || (input ? input.value : "")).trim().toUpperCase();

  if (!notaQuery) {
    showToast("Mohon masukkan nomor nota Delina Anda (contoh: #DLN-2026-XXXX)", "warning");
    if (input) input.focus();
    return;
  }

  if (!notaQuery.startsWith("#")) {
    notaQuery = "#" + notaQuery;
    if (input) input.value = notaQuery;
  }

  const resultArea = document.getElementById("lacakResultArea");
  const notFoundArea = document.getElementById("lacakNotFound");

  // Coba cek lokal terlebih dahulu jika nota cocok dengan pesanan sesi ini
  if (latestOrderData && (latestOrderData.orderId === notaQuery || latestOrderData.orderId.replace(/#/g, "") === notaQuery.replace(/#/g, ""))) {
    displayLacakResult({
      orderId: latestOrderData.orderId,
      customerName: latestOrderData.customerName,
      orderTime: latestOrderData.orderTime,
      deliveryMethod: latestOrderData.deliveryMethod,
      totalAkhir: latestOrderData.totalAkhir,
      status: "Menunggu Verifikasi Toko"
    });
    return;
  }

  // Panggil endpoint backend GAS: ?action=trackOrder&nota=...
  if (typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
    try {
      showToast("Sedang mencari data pesanan...", "info");
      const res = await fetch(`${CONFIG.GAS_API_URL}?action=trackOrder&nota=${encodeURIComponent(notaQuery)}`);
      const json = await res.json();
      if (json.status === "success" && json.found && json.order) {
        displayLacakResult({
          orderId: json.order.orderId,
          customerName: json.order.nama,
          orderTime: json.order.timestamp,
          deliveryMethod: json.order.deliveryMethod,
          totalAkhir: typeof json.order.total === "number" ? formatRupiah(json.order.total) : String(json.order.total),
          status: json.order.status || "Menunggu Verifikasi Toko"
        });
        return;
      }
    } catch (e) {
      console.warn("Lacak pesanan online gagal:", e);
    }
  }

  // Jika tidak ditemukan
  if (resultArea) resultArea.classList.add("hidden");
  if (notFoundArea) notFoundArea.classList.remove("hidden");
}

function displayLacakResult(order) {
  const resultArea = document.getElementById("lacakResultArea");
  const notFoundArea = document.getElementById("lacakNotFound");

  if (notFoundArea) notFoundArea.classList.add("hidden");
  if (resultArea) resultArea.classList.remove("hidden");

  // Update Teks Informasi
  const elCustomer = document.getElementById("lacakCustomerName");
  const elTime = document.getElementById("lacakOrderTime");
  const elDelivery = document.getElementById("lacakDeliveryMethod");
  const elTotal = document.getElementById("lacakTotalAkhir");
  const elNota = document.getElementById("lacakNotaText");
  const elQr = document.getElementById("lacakQrImg");

  if (elCustomer) elCustomer.textContent = order.customerName || "-";
  if (elTime) elTime.textContent = formatWaktuWIB(order.orderTime || order.timestamp || "-");
  if (elDelivery) elDelivery.textContent = order.deliveryMethod || "Ambil Sendiri di Toko";
  if (elTotal) elTotal.textContent = order.totalAkhir || "Rp 0";
  if (elNota) elNota.textContent = order.orderId;

  // QR Code Express Pick-up
  if (elQr) {
    elQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(order.orderId)}`;
  }

  // Update Stepper Progress 4 Tahap
  updateLacakProgressSteps(order.status || "Menunggu Verifikasi Toko");
}

function updateLacakProgressSteps(status) {
  const bar = document.getElementById("lacakProgressBar");
  const icon1 = document.getElementById("lacakStepIcon1");
  const icon2 = document.getElementById("lacakStepIcon2");
  const icon3 = document.getElementById("lacakStepIcon3");
  const icon4 = document.getElementById("lacakStepIcon4");
  const badge = document.getElementById("lacakStatusBadge");

  const activeClass = "w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm";
  const inactiveClass = "w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shadow-sm";

  const lower = (status || "").toLowerCase();

  let level = 1;
  let badgeText = "Menunggu Verifikasi Toko";
  let badgeColor = "bg-amber-100 text-amber-800 border-amber-200";

  if (lower.includes("terverifikasi") || lower.includes("lunas")) {
    level = 2;
    badgeText = "Pembayaran Terverifikasi Toko";
    badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
  } else if (lower.includes("proses") || lower.includes("cetak")) {
    level = 3;
    badgeText = "Sedang Diproses & Disiapkan";
    badgeColor = "bg-indigo-100 text-indigo-800 border-indigo-200";
  } else if (lower.includes("siap") || lower.includes("ambil")) {
    level = 4;
    badgeText = "⚡ Siap Diambil di Toko (Tanpa Antre)";
    badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300 font-black";
  } else if (lower.includes("selesai")) {
    level = 4;
    badgeText = "Pesanan Selesai";
    badgeColor = "bg-gray-100 text-gray-800 border-gray-300";
  }

  if (icon1) icon1.className = level >= 1 ? activeClass : inactiveClass;
  if (icon2) icon2.className = level >= 2 ? activeClass : inactiveClass;
  if (icon3) icon3.className = level >= 3 ? activeClass : inactiveClass;
  if (icon4) icon4.className = level >= 4 ? activeClass : inactiveClass;

  if (bar) {
    if (level === 1) bar.style.width = "25%";
    else if (level === 2) bar.style.width = "50%";
    else if (level === 3) bar.style.width = "75%";
    else if (level === 4) bar.style.width = "100%";
  }

  if (badge) {
    badge.className = `inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${badgeColor}`;
    badge.textContent = badgeText;
  }
}

// Modal Kiko Chat
function openKikoChat() {
  const modal = document.getElementById("kikoChatModal");
  const widgetContainer = document.getElementById("kikoFloatingWidget");
  if (widgetContainer) {
    widgetContainer.classList.remove("kiko-widget-visible");
    widgetContainer.classList.add("kiko-widget-hidden");
  }
  if (modal) {
    initKikoChat();
    if (typeof updateKikoMiniCartBar === "function") updateKikoMiniCartBar();
    modal.classList.remove("hidden");
    if (typeof pushModalState === "function") pushModalState("kikoChatModal");
    const kikoMsgs = document.getElementById("kikoChatMessages");
    if (kikoMsgs) kikoMsgs.scrollTop = kikoMsgs.scrollHeight;
  }
}

function closeKikoChat(notifyHistory = true) {
  const modal = document.getElementById("kikoChatModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    if (activeBottomNav === "kiko") {
      setActiveBottomNav("home");
    }
    if (notifyHistory && wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
    setTimeout(() => {
      triggerChidoriCycle();
    }, 600);
  }
}

function toggleKikoChat() {
  const modal = document.getElementById("kikoChatModal");
  if (!modal) return;
  if (modal.classList.contains("hidden")) {
    openKikoChat();
  } else {
    closeKikoChat();
  }
}

// =========================================================================
// 15. LOGIKA LIVE CHAT ASISTEN AI "KIKO" (FASE 4)
// =========================================================================

let isKikoThinking = false;

// -------------------------------------------------------------------------
// KIKO v2 - Asisten Belanja Pintar (Sinkron 4 Kategori Resmi + Google Sheets)
// Fitur baru:
//  1. Kartu Produk Interaktif (foto, harga, stok + tombol "+ Keranjang") di chat
//  2. Panduan Pelanggan Baru 4 Langkah + Menu Kategori Bergambar
//  3. Lacak Status Pesanan langsung di chat (nota otomatis dari pesanan terakhir)
//  4. Paket Belanja Hemat Sesuai Budget ("paket sekolah 50rb") + Masukkan Semua
//  5. Info Kupon Promo Aktif + Salin Kode, Ringkasan Keranjang + Checkout
//  6. Input Suara (Bahasa Indonesia), Riwayat Chat Tersimpan & Ingatan Konteks AI
// -------------------------------------------------------------------------
const KIKO_HISTORY_KEY = "delina_kiko_chat_history_v2";
const KIKO_MAX_HISTORY = 40;
let kikoHistory = [];
let kikoInitialized = false;

// Peta kata kunci -> 4 Kategori Resmi (termasuk istilah lama agar tetap dipahami)
const KIKO_CATEGORY_KEYWORDS = {
  "ATK & Kantor": ["atk", "kantor", "alat tulis", "sekolah", "tulis", "kuliah", "ujian"],
  "Kosmetik & Cantik": ["kosmetik", "cantik", "skincare", "kecantikan", "perawatan", "makeup", "glowing"],
  "Kelontongan": ["kelontong", "kelontongan", "sembako", "dapur", "bahan pokok", "rumah tangga", "warung", "masak"],
  "Minuman": ["minuman", "minum", "haus", "makanan & minuman", "makanan dan minuman", "segar"]
};

const KIKO_CATEGORY_ICON = {
  "ATK & Kantor": "✏️",
  "Kosmetik & Cantik": "💄",
  "Kelontongan": "🛒",
  "Minuman": "🥤"
};

// Sinonim pencarian agar bahasa sehari-hari pelanggan tetap ketemu barangnya
const KIKO_SYNONYMS = {
  "hvs": ["kertas"], "kertas": ["hvs"], "pena": ["pulpen"], "bolpoin": ["pulpen"], "bolpen": ["pulpen"],
  "pulpen": ["pen"], "tipex": ["tipe-x", "correction"], "tipe": ["tipe-x"], "steples": ["stapler", "staples"],
  "deodoran": ["deodorant"], "ketek": ["deodorant"], "sabun": ["sabun", "wash"], "cuci": ["cuci", "wash"],
  "mie": ["indomie", "mi"], "mi": ["indomie"], "migor": ["minyak"], "minyak": ["minyak"],
  "air": ["mineral"], "aqua": ["mineral"], "jus": ["jus", "pulpy"], "kopi": ["kopi"], "teh": ["teh"],
  "susu": ["susu", "uht"], "beras": ["beras"], "gula": ["gula"], "sunblock": ["sunscreen"], "tabir": ["sunscreen"],
  "pembersih": ["micellar", "wash"], "pelembab": ["moisturizer", "cream"], "detergen": ["deterjen"]
};

const KIKO_STOP_WORDS = [
  "ada", "apakah", "apa", "punya", "jual", "mau", "beli", "tanya", "kak", "kiko", "bisa", "berapa", "harga",
  "stok", "delina", "toko", "assalamu", "alaikum", "assalamualaikum", "halo", "hai", "selamat", "pagi", "siang",
  "sore", "malam", "dong", "ya", "yang", "untuk", "buat", "saya", "aku", "min", "admin", "tolong", "cari",
  "carikan", "ga", "gak", "nggak", "tidak", "dan", "atau", "di", "ke", "dari", "ini", "itu", "nya", "sih",
  "rekomendasi", "bagus", "murah", "mana", "info", "cek", "masih", "sedia", "tersedia", "produk", "barang",
  "tampilkan", "lihat", "terlaris", "kategori", "semua", "kasih", "minta", "butuh", "perlu", "lagi"
];

function kikoNormalize(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9&\s\-]/g, " ").replace(/\s+/g, " ").trim();
}

function kikoGetProducts() {
  return Array.isArray(DUMMY_PRODUCTS) ? DUMMY_PRODUCTS : [];
}

function kikoFindProduct(id) {
  return kikoGetProducts().find(p => String(p.id) === String(id));
}

function kikoDetectCategory(q) {
  for (const cat in KIKO_CATEGORY_KEYWORDS) {
    if (KIKO_CATEGORY_KEYWORDS[cat].some(k => q.includes(k))) return cat;
  }
  return null;
}

function kikoSearchProducts(q, limit = 4) {
  const categoryWords = Object.values(KIKO_CATEGORY_KEYWORDS).flat();
  let tokens = kikoNormalize(q).split(" ").filter(w => w.length >= 2 && !KIKO_STOP_WORDS.includes(w) && !categoryWords.includes(w));
  if (tokens.length === 0) return [];
  // Sinonim hanya dicocokkan per kata utuh agar tidak salah tangkap (mis. "pen" vs "pengganti")
  const original = new Set(tokens);
  const synonyms = new Set();
  tokens.forEach(t => (KIKO_SYNONYMS[t] || []).forEach(s => { if (!original.has(s)) synonyms.add(s); }));

  const scored = kikoGetProducts().map(p => {
    const name = kikoNormalize(p.name);
    const words = name.split(" ");
    let score = 0;
    original.forEach(t => {
      if (words.includes(t)) score += 3;
      else if (t.length >= 3 && name.includes(t)) score += 2;
    });
    synonyms.forEach(s => {
      if (words.includes(s)) score += 2;
    });
    return { p, score };
  }).filter(x => x.score >= 2);

  scored.sort((a, b) => b.score - a.score || (b.p.sold || 0) - (a.p.sold || 0));
  return scored.slice(0, limit).map(x => x.p);
}

function kikoTopProductsByCategory(cat, limit = 4) {
  return kikoGetProducts()
    .filter(p => normalizeStoreCategory(p.category, p.name) === cat)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, limit);
}

function kikoParseBudget(q) {
  const m = q.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(ribu|rb|k|jt|juta)?(?![a-z])/i);
  if (!m) return 0;
  let num = parseInt(m[1].replace(/[.,]/g, ""), 10);
  const unit = (m[2] || "").toLowerCase();
  if (unit === "ribu" || unit === "rb" || unit === "k") num *= 1000;
  else if (unit === "jt" || unit === "juta") num *= 1000000;
  else if (num < 1000) num *= 1000;
  return num >= 5000 ? num : 0;
}

function kikoMemberName() {
  try {
    if (typeof currentMemberSession !== "undefined" && currentMemberSession && currentMemberSession.name) {
      return String(currentMemberSession.name).split(" ")[0];
    }
  } catch (e) {}
  return "";
}

// ---------- Penyimpanan Riwayat Chat ----------
function kikoLoadHistory() {
  try {
    const raw = localStorage.getItem(KIKO_HISTORY_KEY);
    kikoHistory = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(kikoHistory)) kikoHistory = [];
  } catch (e) {
    kikoHistory = [];
  }
}

function kikoSaveHistory() {
  try {
    localStorage.setItem(KIKO_HISTORY_KEY, JSON.stringify(kikoHistory.slice(-KIKO_MAX_HISTORY)));
  } catch (e) {}
}

function clearKikoChat() {
  kikoHistory = [];
  kikoSaveHistory();
  const container = document.getElementById("kikoChatMessages");
  if (container) container.innerHTML = "";
  kikoRenderWelcome();
  showToast("Riwayat chat Kiko dibersihkan.", "info");
}

// ---------- Inisialisasi Widget ----------
function initKikoChat() {
  if (kikoInitialized) return;
  kikoInitialized = true;
  const container = document.getElementById("kikoChatMessages");
  if (!container) return;

  // Delegasi klik untuk semua tombol aksi di dalam chat
  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-kiko-cmd]");
    if (btn) {
      e.preventDefault();
      kikoRunAction(btn.getAttribute("data-kiko-cmd"), btn);
    }
  });

  // Sembunyikan tombol mic jika browser tidak mendukung input suara
  const micBtn = document.getElementById("kikoMicBtn");
  if (micBtn && !(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    micBtn.classList.add("hidden");
  }

  kikoLoadHistory();
  container.innerHTML = "";
  kikoRenderWelcome();
  kikoHistory.forEach(entry => kikoRenderEntry(entry));
}

function kikoRenderWelcome() {
  const nama = kikoMemberName();
  const sapaan = nama ? `kak *${nama}*` : "kak";
  kikoRenderEntry({
    role: "kiko",
    text: `Assalamu'alaikum Warahmatullahi Wabarakatuh ${sapaan}! 👋\nSaya *Kiko*, asisten belanja Toko Delina. Kiko bisa bantu cari barang, buatkan paket hemat sesuai budget, cek promo, sampai lacak pesanan kakak.\n\nMau mulai dari kategori mana?`,
    categories: true,
    actions: [
      { label: "🧭 Saya Pelanggan Baru", cmd: "ask:Saya pelanggan baru, bagaimana cara belanja?" },
      { label: "👑 Daftar Member VIP", cmd: "member" },
      { label: "📦 Lacak Pesanan Saya", cmd: "ask:Lacak pesanan saya" }
    ]
  }, false);
}

// ---------- Render Pesan ----------
function kikoProductCardHtml(p) {
  const img = typeof formatImageUrl === "function" ? formatImageUrl(p.image) : p.image;
  const stok = Number(p.stock) || 0;
  const stokLabel = stok <= 0
    ? `<span class="text-red-500 font-bold">Stok habis</span>`
    : (stok <= 5 ? `<span class="text-amber-600 font-bold">Sisa ${stok} ${escapeHtml(p.unit || "")}</span>` : `<span class="text-emerald-600 font-medium">Stok ${stok} ${escapeHtml(p.unit || "")}</span>`);
  return `
    <div class="kiko-product-card flex-shrink-0 w-[140px] bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div>
        <button type="button" data-kiko-cmd="detail:${escapeHtml(p.id)}" class="block w-full aspect-square bg-gray-50 overflow-hidden relative group" title="Lihat detail barang">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onerror="this.onerror=null;this.src='https://placehold.co/300x300/ecfdf5/047857?text=Delina';" />
          <span class="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium backdrop-blur-xs">Detail</span>
        </button>
        <div class="p-2 space-y-1">
          <div class="text-[10px] font-semibold text-gray-700 leading-tight line-clamp-2 min-h-[26px]">${escapeHtml(p.name)}</div>
          <div class="text-[11px] font-extrabold text-emerald-700">${formatRupiah(p.price)}</div>
          <div class="text-[9px]">${stokLabel}</div>
        </div>
      </div>
      <div class="p-2 pt-0 grid grid-cols-2 gap-1">
        <button type="button" data-kiko-cmd="add:${escapeHtml(p.id)}" ${stok <= 0 ? "disabled" : ""}
          class="text-[9px] font-bold py-1.5 rounded-lg ${stok <= 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95"} transition-all"
          title="Tambah ke Keranjang">
          + Troli
        </button>
        <button type="button" data-kiko-cmd="buynow:${escapeHtml(p.id)}" ${stok <= 0 ? "disabled" : ""}
          class="text-[9px] font-bold py-1.5 rounded-lg ${stok <= 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-tokopedia-green hover:bg-emerald-600 text-white shadow-xs active:scale-95"} transition-all"
          title="Beli Langsung dan Bayar">
          ⚡ Beli
        </button>
      </div>
    </div>`;
}

function kikoRenderEntry(entry) {
  const container = document.getElementById("kikoChatMessages");
  if (!container || !entry) return;

  const wrap = document.createElement("div");
  if (entry.role === "user") {
    wrap.className = "flex justify-end gap-2";
    wrap.innerHTML = `
      <div class="bg-tokopedia-green text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-[85%] shadow-xs">
        ${escapeHtml(entry.text)}
      </div>`;
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
    return;
  }

  let extra = "";

  if (entry.categories) {
    extra += `<div class="grid grid-cols-2 gap-1.5 mt-2">` +
      Object.keys(KIKO_CATEGORY_ICON).map(cat => `
        <button type="button" data-kiko-cmd="ask:Tampilkan produk ${escapeHtml(cat)}"
          class="flex items-center gap-1.5 px-2 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-[10px] font-bold text-emerald-800 text-left transition-colors">
          <span class="text-sm">${KIKO_CATEGORY_ICON[cat]}</span><span class="leading-tight">${escapeHtml(cat)}</span>
        </button>`).join("") + `</div>`;
  }

  const products = (entry.productIds || []).map(kikoFindProduct).filter(Boolean);
  let cardsHtml = "";
  if (products.length > 0) {
    cardsHtml = `<div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 pl-8 pr-1">${products.map(kikoProductCardHtml).join("")}</div>`;
  }

  let actionsHtml = "";
  if (Array.isArray(entry.actions) && entry.actions.length > 0) {
    actionsHtml = `<div class="flex flex-wrap gap-1.5 pl-8">` + entry.actions.map(a => `
      <button type="button" data-kiko-cmd="${escapeHtml(a.cmd)}"
        class="px-2.5 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all">
        ${escapeHtml(a.label)}
      </button>`).join("") + `</div>`;
  }

  wrap.className = "space-y-2";
  wrap.innerHTML = `
    <div class="flex gap-2">
      <img src="assets/Logo.png" alt="Delina" class="w-6 h-6 rounded-full bg-white p-0.5 object-contain flex-shrink-0 shadow-xs border border-emerald-200" />
      <div class="bg-white/95 backdrop-blur-xs p-3 rounded-2xl rounded-tl-none border border-emerald-100 text-gray-800 shadow-xs leading-relaxed max-w-[85%] text-xs">
        ${formatMarkdown(entry.text)}
        ${extra}
      </div>
    </div>
    ${cardsHtml}
    ${actionsHtml}`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function kikoPush(entry) {
  kikoHistory.push(entry);
  kikoSaveHistory();
  kikoRenderEntry(entry);
}

// Kompatibilitas dengan pemanggilan lama
function appendChatBubble(sender, text) {
  kikoPush({ role: sender === "user" ? "user" : "kiko", text: text });
}

// ---------- Aksi Tombol di Chat ----------
function kikoAddToCart(productId, silent) {
  const p = kikoFindProduct(productId);
  if (!p) return false;
  if ((Number(p.stock) || 0) <= 0) {
    if (!silent) showToast(`Afwan, stok ${p.name.slice(0, 25)} sedang habis.`, "warning");
    return false;
  }
  addToCart(productId);
  return true;
}

function kikoRunAction(cmd, btn) {
  if (!cmd) return;
  const idx = cmd.indexOf(":");
  const type = idx > -1 ? cmd.slice(0, idx) : cmd;
  const arg = idx > -1 ? cmd.slice(idx + 1) : "";

  switch (type) {
    case "ask":
      sendQuickKikoQuestion(arg);
      break;
    case "add":
      kikoAddToCart(arg);
      updateKikoMiniCartBar();
      break;
    case "buynow":
      if (kikoAddToCart(arg, true)) {
        updateKikoMiniCartBar();
        closeKikoChat(false);
        if (typeof openCheckoutModal === "function") openCheckoutModal();
      }
      break;
    case "addall": {
      const ids = arg.split(",").filter(Boolean);
      let ok = 0;
      ids.forEach(id => { if (kikoAddToCart(id, true)) ok++; });
      updateKikoMiniCartBar();
      showToast(`Alhamdulillah, ${ok} barang paket masuk ke keranjang.`);
      kikoPush({
        role: "kiko",
        text: `✅ *${ok} barang* dari paket sudah Kiko masukkan ke keranjang kak. Mau langsung checkout?`,
        actions: [{ label: "🛍️ Lihat Keranjang", cmd: "cart" }, { label: "💳 Checkout Sekarang", cmd: "checkout" }]
      });
      break;
    }
    case "detail":
      closeKikoChat(false);
      if (typeof openProductDetailModal === "function") openProductDetailModal(arg);
      break;
    case "cat":
      closeKikoChat(false);
      selectCategory(arg);
      break;
    case "cart":
      closeKikoChat(false);
      if (typeof setActiveBottomNav === "function") setActiveBottomNav("cart");
      toggleCartDrawer(true);
      break;
    case "checkout":
      if (!cart || cart.length === 0) {
        showToast("Keranjang masih kosong kak. Yuk pilih produk dulu nggih!", "warning");
        return;
      }
      closeKikoChat(false);
      if (typeof openCheckoutModal === "function") openCheckoutModal();
      break;
    case "track":
      closeKikoChat(false);
      if (typeof openLacakPesananModal === "function") openLacakPesananModal(arg || undefined);
      break;
    case "copy":
      if (typeof copyToClipboard === "function") copyToClipboard(arg, btn);
      showToast(`Kode ${arg} tersalin. Tempel saat checkout nggih kak.`);
      break;
    case "member":
      closeKikoChat(false);
      if (typeof openMemberModal === "function") openMemberModal("register");
      break;
    case "clear":
      clearKikoChat();
      break;
  }
}

// Bilah Ringkas Keranjang Belanja Mengambang di Chat Kiko (Sticky Mini-Cart)
function updateKikoMiniCartBar() {
  const bar = document.getElementById("kikoMiniCartBar");
  const countEl = document.getElementById("kikoMiniCartCount");
  const totalEl = document.getElementById("kikoMiniCartTotal");
  if (!bar || !countEl || !totalEl) return;

  const totalQty = Array.isArray(cart) ? cart.reduce((s, it) => s + (Number(it.qty) || 0), 0) : 0;
  const totalPrice = Array.isArray(cart) ? cart.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0) : 0;

  if (totalQty > 0) {
    countEl.textContent = `${totalQty} Barang`;
    totalEl.textContent = formatRupiah(totalPrice);
    bar.classList.remove("hidden");
  } else {
    bar.classList.add("hidden");
  }
}

// Rekomendasi Chip Cepat Dinamis saat Kategori Dipilih
function kikoSetCategoryQuickChips(categoryName) {
  const container = document.getElementById("kikoQuickChipsContainer");
  if (!container) return;
  const chipPresets = {
    "ATK & Kantor": [
      { label: "📄 Kertas HVS A4", q: "Stok Kertas HVS PaperOne A4 ada?" },
      { label: "✒️ Pulpen Sarasa", q: "Pulpen Gel Zebra Sarasa Clip" },
      { label: "📚 Buku Tulis SiDu", q: "Buku Tulis Sinar Dunia pack" },
      { label: "📎 Map & Binder", q: "Map Folder Plastik Document Clear Holder" }
    ],
    "Kosmetik & Cantik": [
      { label: "🧴 Deodorant Dove", q: "Deodorant Dove Ultimate Repair" },
      { label: "✨ Micellar Water", q: "Wardah Micellar Gentle Wash" },
      { label: "☀️ Sunscreen Kahf", q: "Kahf Sunscreen Moisturizer" },
      { label: "💄 Lip Care", q: "Produk kecantikan wajah dan pelembab" }
    ],
    "Kelontongan": [
      { label: "🍳 Minyak Bimoli 2L", q: "Minyak Goreng Bimoli 2 Liter" },
      { label: "🍚 Beras Super 5kg", q: "Beras Kepala Super Ramos 5kg" },
      { label: "🍜 Indomie Goreng", q: "Indomie Mi Instan Goreng" },
      { label: "🧼 Sabun Sunlight", q: "Sabun Cuci Piring Sunlight" }
    ],
    "Minuman": [
      { label: "💧 Le Minerale 600ml", q: "Le Minerale Air Mineral Botol" },
      { label: "⚡ Pocari Sweat", q: "Pocari Sweat Botol 500ml" },
      { label: "🍊 Floridina", q: "Floridina Pulpy Orange" },
      { label: "🥛 Susu Ultra Milk", q: "Susu UHT Ultra Milk" }
    ]
  };

  const chips = chipPresets[categoryName];
  if (!chips) return;
  container.innerHTML = `
    <button type="button" onclick="sendQuickKikoQuestion('Saya pelanggan baru, bagaimana cara belanja?')"
      class="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 whitespace-nowrap transition-colors">🧭 Cara Belanja</button>
    <button type="button" onclick="kikoRunAction('member')"
      class="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 whitespace-nowrap transition-colors">👑 Member VIP</button>` +
    chips.map(c => `
      <button type="button" onclick="sendQuickKikoQuestion('${escapeHtml(c.q)}')"
        class="px-2 py-1 rounded-full bg-emerald-50/80 border border-emerald-200 text-emerald-800 font-medium hover:bg-emerald-100 whitespace-nowrap transition-colors">
        ${escapeHtml(c.label)}
      </button>`).join("") + `
    <button type="button" onclick="kikoRunAction('cat:${escapeHtml(categoryName)}')"
      class="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-emerald-700 whitespace-nowrap transition-colors">📂 Semua ${escapeHtml(categoryName)}</button>`;
}

// ---------- Input Suara (Web Speech API) ----------
let kikoRecognition = null;
function startKikoVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast("Afwan, browser ini belum mendukung input suara.", "warning");
    return;
  }
  const micBtn = document.getElementById("kikoMicBtn");
  if (kikoRecognition) {
    kikoRecognition.stop();
    return;
  }
  kikoRecognition = new SR();
  kikoRecognition.lang = "id-ID";
  kikoRecognition.interimResults = true;
  kikoRecognition.maxAlternatives = 1;
  const input = document.getElementById("kikoChatInput");
  if (micBtn) micBtn.classList.add("bg-red-500", "text-white", "animate-pulse");
  if (input) input.placeholder = "Kiko mendengarkan... silakan bicara";

  kikoRecognition.onresult = ev => {
    let transcript = "";
    for (let i = 0; i < ev.results.length; i++) transcript += ev.results[i][0].transcript;
    if (input) input.value = transcript;
    if (ev.results[ev.results.length - 1].isFinal) {
      kikoRecognition.stop();
      sendKikoMessage();
    }
  };
  kikoRecognition.onerror = () => showToast("Suara belum terdengar jelas, coba lagi nggih kak.", "warning");
  kikoRecognition.onend = () => {
    kikoRecognition = null;
    if (micBtn) micBtn.classList.remove("bg-red-500", "text-white", "animate-pulse");
    if (input) input.placeholder = "Tanya barang, paket hemat, promo, lacak pesanan...";
  };
  kikoRecognition.start();
}

// ---------- Pengiriman Pesan ----------
function sendQuickKikoQuestion(questionText) {
  const input = document.getElementById("kikoChatInput");
  if (input) {
    input.value = questionText;
    sendKikoMessage();
  }
}

async function sendKikoMessage() {
  const input = document.getElementById("kikoChatInput");
  const messagesContainer = document.getElementById("kikoChatMessages");
  const sendBtn = document.getElementById("kikoSendBtn");
  if (!input || !messagesContainer) return;
  initKikoChat();

  const userText = input.value.trim();
  if (!userText || isKikoThinking) return;

  // Riwayat untuk konteks AI diambil sebelum pesan baru ditambahkan
  const historyForAI = kikoHistory.slice(-6).map(h => ({ role: h.role, text: h.text }));

  // 1. Tampilkan Bubble Pengguna
  kikoPush({ role: "user", text: userText });
  input.value = "";

  // 2. Tampilkan Indikator Mengetik
  isKikoThinking = true;
  if (sendBtn) sendBtn.disabled = true;
  const typingId = appendTypingIndicator();

  try {
    // 3. Coba jawab langsung dengan mesin pintar lokal (data katalog live dari Google Sheets)
    let reply = await kikoHandleLocalIntent(userText);

    // 4. Pertanyaan bebas -> Gemini AI di backend (dengan ingatan percakapan)
    if (!reply && typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
      try {
        const response = await fetch(CONFIG.GAS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "chatKiko",
            message: userText,
            sumber: "Web Widget",
            history: historyForAI
          })
        });
        if (response.ok) {
          const json = await response.json();
          if (json && json.reply) {
            const related = kikoSearchProducts(userText, 4);
            reply = { text: json.reply, productIds: related.map(p => p.id) };
          }
        }
      } catch (errApi) {
        console.warn("Kiko live error, using smart fallback:", errApi);
      }
    }

    // 5. Cadangan cerdas lokal
    if (!reply) reply = generateLocalKikoReply(userText);

    removeTypingIndicator(typingId);
    kikoPush(Object.assign({ role: "kiko" }, typeof reply === "string" ? { text: reply } : reply));
  } catch (err) {
    console.warn("Kiko error, using smart fallback:", err);
    removeTypingIndicator(typingId);
    kikoPush({ role: "kiko", text: generateLocalKikoReply(userText) });
  } finally {
    isKikoThinking = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }
}

// ---------- Mesin Intent Lokal ----------
async function kikoHandleLocalIntent(userText) {
  const q = kikoNormalize(userText);
  const raw = String(userText || "");

  // A. Panduan Pelanggan Baru
  if (/(pelanggan baru|cara (belanja|beli|pesan|order|checkout|bayar)|bagaimana (belanja|pesan|beli|order)|panduan|tutorial|baru pertama)/.test(q)) {
    return {
      text: `🧭 *Panduan Belanja Toko Delina (4 Langkah Mudah)*\n━━━━━━━━━━━━━━━━━━━━\n*1. Pilih Barang* — cari lewat kategori atau tanya Kiko langsung.\n*2. Masukkan Keranjang* — tekan tombol *+ Keranjang* (bisa langsung dari chat ini).\n*3. Checkout* — pilih *Ambil Sendiri di Toko* (gratis) atau *Diantar Kurir Toko*, lalu pilih jam pengambilan/pengantaran.\n*4. Bayar & Lacak* — bayar via *QRIS / Transfer*, simpan nomor nota untuk melacak status pesanan.\n\n🎁 Daftar *Member VIP* gratis untuk kumpulkan poin & hadiah. Upload KTP berpeluang dapat *Voucher Rahasia*!`,
      categories: true,
      actions: [
        { label: "🎒 Paket Sekolah 50rb", cmd: "ask:Buatkan paket sekolah budget 50 ribu" },
        { label: "🎟️ Promo Hari Ini", cmd: "ask:Ada promo apa hari ini?" },
        { label: "👑 Daftar Member", cmd: "member" }
      ]
    };
  }

  // B. Lacak Pesanan
  const notaMatch = raw.toUpperCase().match(/#?DLN-[A-Z0-9-]{4,}/);
  if (notaMatch || /(lacak|status pesanan|pesanan saya|cek pesanan|pesananku|orderan|resi|nota saya|sudah sampai|kapan (siap|diantar|sampai))/.test(q)) {
    return await kikoTrackOrder(notaMatch ? notaMatch[0] : "");
  }

  // C. Ringkasan Keranjang
  if (/(keranjang|total belanja|isi troli|troli saya|cart)/.test(q) && !/(cara|bagaimana)/.test(q)) {
    if (!cart || cart.length === 0) {
      return {
        text: "🛒 Keranjang kakak masih kosong. Yuk Kiko bantu pilihkan barang terlaris!",
        categories: true
      };
    }
    const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
    const lines = cart.slice(0, 8).map(it => `• ${it.name.slice(0, 38)} × ${it.qty} = *${formatRupiah(it.price * it.qty)}*`).join("\n");
    return {
      text: `🛒 *Isi Keranjang Kakak*\n━━━━━━━━━━━━━━━━━━━━\n${lines}${cart.length > 8 ? `\n• ...dan ${cart.length - 8} barang lainnya` : ""}\n━━━━━━━━━━━━━━━━━━━━\n💰 *Subtotal: ${formatRupiah(total)}*`,
      actions: [{ label: "🛍️ Buka Keranjang", cmd: "cart" }, { label: "💳 Checkout", cmd: "checkout" }, { label: "🎟️ Cek Kupon", cmd: "ask:Ada promo apa hari ini?" }]
    };
  }

  // D. Paket Belanja Hemat Sesuai Budget
  const budget = kikoParseBudget(q);
  if (/(paket|bundle|budget|bujet|modal|uang|duit|hemat)/.test(q) && (budget > 0 || /paket/.test(q))) {
    return kikoBuildBundle(q, budget || 100000);
  }

  // E. Promo & Kupon
  if (/(promo|kupon|voucher|diskon|potongan|kode)/.test(q)) {
    const coupons = Object.values(typeof PROMO_COUPONS === "object" ? PROMO_COUPONS : {});
    if (coupons.length === 0) {
      return "🎟️ Afwan kak, saat ini belum ada kupon promo aktif. InsyaAllah segera hadir promo berkah berikutnya!";
    }
    const lines = coupons.slice(0, 6).map(c => `🏷️ *${c.code}* — ${c.desc || ""}`).join("\n");
    return {
      text: `🎟️ *Kupon Promo Aktif Toko Delina*\n━━━━━━━━━━━━━━━━━━━━\n${lines}\n\nTekan tombol kode untuk *menyalin*, lalu tempel di kolom kupon saat checkout nggih kak.`,
      actions: coupons.slice(0, 6).map(c => ({ label: `📋 ${c.code}`, cmd: `copy:${c.code}` }))
    };
  }

  // F. Ketersediaan Jasa Fotokopi
  if (/(fotokopi|foto kopi|fotocopy|cetak|print|jilid|scan dokumen)/.test(q)) {
    return {
      text: "ℹ️ *Layanan Toko Delina*\n━━━━━━━━━━━━━━━━━━━━\nAfwan kak, Toko Delina kini berfokus penuh pada penjualan produk ritel fisik *ATK, Kosmetik & Skincare, dan Kelontongan Sembako* nggih.\n\nSilakan cek katalog produk lengkap kami di tombol bawah atau ketik nama barang yang dicari. _Barakallahu fiik._ 🤲",
      categories: true
    };
  }

  // G. Pencarian Produk (prioritas nama barang spesifik)
  const found = kikoSearchProducts(q, 4);
  if (found.length > 0) {
    const top = found[0];
    const habis = (Number(top.stock) || 0) <= 0;
    return {
      text: habis
        ? `Afwan kak, *${top.name}* sedang *habis*. Berikut alternatif yang tersedia di Toko Delina 👇`
        : `Alhamdulillah, Kiko menemukan *${found.length} barang* yang cocok di etalase Toko Delina 👇\nTekan *Keranjang* untuk langsung pesan, atau tekan fotonya untuk lihat detail.`,
      productIds: habis ? kikoTopProductsByCategory(normalizeStoreCategory(top.category, top.name), 4).filter(p => (Number(p.stock) || 0) > 0).map(p => p.id) : found.map(p => p.id),
      actions: [{ label: "🛍️ Lihat Keranjang", cmd: "cart" }]
    };
  }

  // H. Kategori (termasuk istilah lama: sembako/dapur -> Kelontongan, makanan & minuman -> Minuman)
  const cat = kikoDetectCategory(q);
  if (cat) {
    if (typeof kikoSetCategoryQuickChips === "function") kikoSetCategoryQuickChips(cat);
    const list = kikoTopProductsByCategory(cat, 6);
    if (list.length > 0) {
      return {
        text: `${KIKO_CATEGORY_ICON[cat]} *Produk Terlaris Kategori ${cat}*\nBerikut pilihan favorit pelanggan Toko Delina 👇`,
        productIds: list.map(p => p.id),
        actions: [{ label: `📂 Lihat Semua ${cat}`, cmd: `cat:${cat}` }]
      };
    }
  }

  // I. Sapaan singkat
  if (q.split(" ").length <= 4 && /\b(assalamu\w*|halo|hai|hallo|pagi|siang|sore|malam|permisi|hi)\b/.test(q)) {
    return {
      text: "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! 😊 Ada yang bisa Kiko bantu hari ini? Pilih kategori di bawah atau ketik nama barang yang dicari.",
      categories: true
    };
  }

  return null; // Serahkan ke Gemini AI
}

async function kikoTrackOrder(notaInput) {
  let nota = String(notaInput || "").trim().toUpperCase();
  const history = typeof getCustomerOrdersFromLocalHistory === "function" ? getCustomerOrdersFromLocalHistory() : [];
  if (!nota) nota = localStorage.getItem("delina_last_order_id") || (history[0] && history[0].orderId) || "";
  if (!nota) {
    return {
      text: "📦 Kiko belum menemukan pesanan di perangkat ini kak. Silakan ketik nomor nota kakak (contoh: *#DLN-2026-XXXX*) agar Kiko cekkan statusnya.",
      actions: [{ label: "🔎 Buka Lacak Pesanan", cmd: "track:" }]
    };
  }
  if (!nota.startsWith("#")) nota = "#" + nota;

  let order = null;
  if (typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
    try {
      const res = await fetch(`${CONFIG.GAS_API_URL}?action=trackOrder&nota=${encodeURIComponent(nota)}`);
      const json = await res.json();
      if (json && json.status === "success" && json.found && json.order) {
        order = {
          orderId: json.order.orderId,
          status: json.order.status,
          total: typeof json.order.total === "number" ? formatRupiah(json.order.total) : String(json.order.total || "-"),
          deliveryMethod: json.order.deliveryMethod,
          time: json.order.timestamp
        };
      }
    } catch (e) {
      console.warn("Kiko trackOrder notice:", e);
    }
  }
  if (!order) {
    const local = history.find(o => String(o.orderId || "").replace(/#/g, "") === nota.replace(/#/g, ""));
    if (local) {
      order = { orderId: local.orderId, status: local.status, total: local.total, deliveryMethod: local.deliveryMethod, time: local.orderTime };
    }
  }
  if (!order) {
    return {
      text: `🔎 Afwan kak, nota *${nota}* belum ditemukan. Pastikan nomor nota sudah benar ya, atau hubungi Admin Toko via WhatsApp.`,
      actions: [{ label: "🔎 Buka Lacak Pesanan", cmd: "track:" }]
    };
  }

  const st = String(order.status || "Menunggu Verifikasi Toko");
  const sl = st.toLowerCase();
  let icon = "⏳", tip = "Pesanan sedang menunggu verifikasi admin toko.";
  if (sl.includes("proses") || sl.includes("dikemas")) { icon = "📦"; tip = "Pesanan sedang disiapkan oleh tim Toko Delina."; }
  if (sl.includes("siap") || sl.includes("diantar") || sl.includes("kirim")) { icon = "🚚"; tip = "Pesanan siap diambil / sedang diantar kurir toko."; }
  if (sl.includes("selesai")) { icon = "✅"; tip = "Alhamdulillah, pesanan sudah selesai. Terima kasih sudah berbelanja!"; }
  if (sl.includes("batal")) { icon = "❌"; tip = "Pesanan dibatalkan. Hubungi admin bila ada pertanyaan."; }

  return {
    text: `${icon} *Status Pesanan ${order.orderId}*\n━━━━━━━━━━━━━━━━━━━━\n• Status: *${st}*\n• Metode: ${order.deliveryMethod || "-"}\n• Total: *${order.total || "-"}*\n• Waktu: ${typeof formatWaktuWIB === "function" ? formatWaktuWIB(order.time) : (order.time || "-")}\n\n💡 ${tip}`,
    actions: [{ label: "📲 Lihat QR Pengambilan", cmd: `track:${order.orderId}` }]
  };
}

function kikoBuildBundle(q, budget) {
  let cat = kikoDetectCategory(q);
  let tema = "Campuran Kebutuhan Harian";
  if (/(skincare|glowing|cantik|kosmetik|wajah|mandi)/.test(q)) cat = "Kosmetik & Cantik";
  if (cat === "ATK & Kantor") tema = "Perlengkapan Sekolah & Kantor";
  else if (cat === "Kosmetik & Cantik") tema = "Perawatan & Kecantikan";
  else if (cat === "Kelontongan") tema = "Kebutuhan Dapur & Rumah";
  else if (cat === "Minuman") tema = "Minuman Segar";

  let pool = kikoGetProducts().filter(p => (Number(p.stock) || 0) > 0);
  if (cat) {
    pool = pool.filter(p => normalizeStoreCategory(p.category, p.name) === cat);
  }
  pool.sort((a, b) => (b.sold || 0) - (a.sold || 0));

  // Jika campuran: ambil bergiliran dari setiap kategori agar bervariasi
  if (!cat) {
    const byCat = {};
    pool.forEach(p => {
      const c = normalizeStoreCategory(p.category, p.name);
      (byCat[c] = byCat[c] || []).push(p);
    });
    const mixed = [];
    let added = true;
    for (let i = 0; added; i++) {
      added = false;
      Object.keys(byCat).forEach(c => {
        if (byCat[c][i]) { mixed.push(byCat[c][i]); added = true; }
      });
    }
    pool = mixed;
  }

  const picked = [];
  let total = 0;
  pool.forEach(p => {
    if (picked.length < 6 && total + p.price <= budget) {
      picked.push(p);
      total += p.price;
    }
  });

  if (picked.length === 0) {
    const cheapest = pool.slice().sort((a, b) => a.price - b.price)[0];
    return `Afwan kak, budget *${formatRupiah(budget)}* belum cukup untuk paket ${tema}.${cheapest ? ` Barang termurah saat ini *${cheapest.name}* seharga *${formatRupiah(cheapest.price)}*.` : ""}`;
  }

  const lines = picked.map(p => `• ${p.name.slice(0, 40)} — *${formatRupiah(p.price)}*`).join("\n");
  return {
    text: `🎁 *Paket Hemat ${tema}*\nBudget: *${formatRupiah(budget)}*\n━━━━━━━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total: ${formatRupiah(total)}* (sisa ${formatRupiah(budget - total)})\n\nTekan *Masukkan Semua* untuk langsung memasukkan paket ke keranjang.`,
    productIds: picked.map(p => p.id),
    actions: [
      { label: "🛒 Masukkan Semua ke Keranjang", cmd: `addall:${picked.map(p => p.id).join(",")}` },
      { label: "🔁 Paket Lain", cmd: `ask:Buatkan paket ${cat === "Kelontongan" ? "minuman" : "dapur"} budget ${Math.round(budget / 1000)} ribu` }
    ]
  };
}

function appendTypingIndicator() {
  const container = document.getElementById("kikoChatMessages");
  if (!container) return null;

  const id = "typing-" + Date.now();
  const typingDiv = document.createElement("div");
  typingDiv.id = id;
  typingDiv.className = "flex gap-2 items-center text-xs text-gray-400";
  typingDiv.innerHTML = `
    <img src="assets/Logo.png" alt="Delina" class="w-6 h-6 rounded-full bg-white p-0.5 object-contain flex-shrink-0 shadow-xs border border-emerald-200" />
    <div class="bg-white/95 backdrop-blur-xs px-3 py-2 rounded-2xl rounded-tl-none border border-emerald-100 shadow-xs flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.2s"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.4s"></span>
      <span class="text-[10px] text-gray-500 ml-1 font-medium">Kiko sedang berpikir...</span>
    </div>
  `;
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  if (!id) return;
  const elem = document.getElementById(id);
  if (elem) elem.remove();
}

function generateLocalKikoReply(userText) {
  const q = kikoNormalize(userText);

  if (/(assalamu|halo|hai|pagi|siang|sore|malam)/.test(q)) {
    return {
      text: "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Ada yang bisa Kiko bantu terkait belanja ATK, kosmetik, kelontongan, atau minuman hari ini? InsyaAllah Toko Delina siap melayani.",
      categories: true
    };
  }

  return {
    text: "Afwan kak, Kiko belum menemukan jawaban yang pas. 🙏\nCoba sebut *nama barang* (misal: *pulpen*, *deodorant*, *minyak goreng*, *teh*), pilih kategori di bawah, atau minta *paket hemat* sesuai budget kakak.",
    categories: true,
    actions: [
      { label: "🧭 Cara Belanja", cmd: "ask:Saya pelanggan baru, bagaimana cara belanja?" },
      { label: "🎟️ Promo", cmd: "ask:Ada promo apa hari ini?" }
    ]
  };
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatMarkdown(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\n/g, '<br/>');
  return safe;
}

// Ambil Data Live (Produk, Tarif, Kupon & Profil Toko) dari Google Sheets
async function fetchProductsFromGAS() {
  if (typeof CONFIG === "undefined" || !CONFIG.GAS_API_URL || !CONFIG.ENABLE_LIVE_BACKEND) return;

  try {
    const res = await fetch(CONFIG.GAS_API_URL);
    if (!res.ok) return;
    const json = await res.json();
    if (!json || json.status !== "success") return;

    // 0. Sinkron Kategori Produk Dinamis dari Google Sheets
    if (Array.isArray(json.categories) && json.categories.length > 0) {
      renderCategoryPills(json.categories);
    }

    // 1. Sinkron Katalog Produk (Otomatis normalisasi ke 4 Kategori Fokus & perbaiki foto)
    if (Array.isArray(json.products) && json.products.length > 0) {
      console.log("Alhamdulillah, produk berhasil dimuat dari Google Sheets:", json.products.length, "barang");
      DUMMY_PRODUCTS.length = 0;
      json.products.forEach(p => {
        p.category = normalizeStoreCategory(p.category, p.name);
        p.image = formatImageUrl(p.image);
        DUMMY_PRODUCTS.push(p);
      });
      renderProducts();
    }

    // 1b. Sinkron 10 Hadiah Royalty Member
    if (Array.isArray(json.rewards) && json.rewards.length > 0) {
      memberRewardsList = json.rewards;
      if (currentMemberSession) {
        renderMemberRewardsCatalog(memberRewardsList, currentMemberSession.belanjaCount || 0);
      }
    }

    // 2. Sinkron Tarif Fotokopi & Jilid
    if (json.rates && typeof json.rates === "object") {
      for (const k in json.rates) {
        if (json.rates[k] && json.rates[k].harga !== undefined) {
          LIVE_TARIF[k] = json.rates[k].harga;
        }
      }
      calculateFotokopi();
    }

    // 3. Sinkron Kupon Diskon Aktif
    if (Array.isArray(json.coupons) && json.coupons.length > 0) {
      PROMO_COUPONS = {};
      json.coupons.forEach(c => {
        PROMO_COUPONS[c.code] = {
          code: c.code,
          type: c.type === "PERSEN" ? "percent" : "fixed",
          discount: c.value,
          rate: c.type === "PERSEN" ? (c.value / 100) : 0,
          minSpend: c.minSpend,
          desc: c.description || (c.type === "PERSEN" ? `Diskon ${c.value}%` : `Potongan ${formatRupiah(c.value)}`)
        };
      });
    }

    // 4. Sinkron Profil Toko, QRIS, Rekening Bank, Telegram & Google Maps
    if (json.toko) {
      window.currentTokoInfo = json.toko;
      const t = json.toko;

      // Checkout Modal Rekening & QRIS
      const rekTextEl = document.getElementById("checkoutRekeningText");
      if (rekTextEl && (t.rekening1 || t.rekening)) {
        rekTextEl.textContent = t.rekening1 || t.rekening;
      }
      if (t.rekening1 || t.rekening) {
        const elBca = document.getElementById("checkoutRekBcaNum");
        if (elBca) elBca.textContent = (t.rekening1 || t.rekening).replace(/\D+/g, "") || (t.rekening1 || t.rekening);
      }
      if (t.rekening2) {
        const box2 = document.getElementById("checkoutRekening2Box");
        const txt2 = document.getElementById("checkoutRekening2Text");
        if (box2 && txt2) {
          txt2.textContent = t.rekening2;
          box2.classList.remove("hidden");
        }
        const elBri = document.getElementById("checkoutRekBriNum");
        if (elBri) elBri.textContent = t.rekening2.replace(/\D+/g, "") || t.rekening2;
      }
      if (t.shopeepay || t.gopay) {
        const boxE = document.getElementById("checkoutEwalletBox");
        const txtE = document.getElementById("checkoutEwalletText");
        if (boxE && txtE) {
          const parts = [];
          if (t.shopeepay) parts.push(`ShopeePay: ${t.shopeepay}`);
          if (t.gopay) parts.push(`GoPay: ${t.gopay}`);
          txtE.textContent = parts.join(" | ");
          boxE.classList.remove("hidden");
        }
        if (t.shopeepay) {
          const elShopee = document.getElementById("checkoutEwalletShopeeNum");
          if (elShopee) elShopee.textContent = t.shopeepay;
        }
        if (t.gopay) {
          const elGopay = document.getElementById("checkoutEwalletGopayNum");
          if (elGopay) elGopay.textContent = t.gopay;
        }
      }
      if (t.logo) {
        const logoImg = document.getElementById("navStoreLogoImg");
        const logoPlaceholder = document.getElementById("navStoreLogoPlaceholder");
        if (logoImg) {
          logoImg.src = t.logo;
          logoImg.classList.remove("hidden");
          if (logoPlaceholder) logoPlaceholder.classList.add("hidden");
        }
      }
      const qrisImgEl = document.getElementById("qrisBarcodeImg");
      if (qrisImgEl && t.qris) {
        qrisImgEl.src = t.qris;
      }

      // Modal Informasi QRIS & Transfer Bank (Popup Footer)
      const modalRekEl = document.getElementById("modalRekeningText");
      if (modalRekEl && t.rekening) {
        modalRekEl.textContent = t.rekening;
      }
      const modalQrisEl = document.getElementById("modalQrisImg");
      const btnDownloadQris = document.getElementById("btnDownloadQris");
      if (modalQrisEl && t.qris) {
        modalQrisEl.src = t.qris;
        if (btnDownloadQris) {
          btnDownloadQris.href = t.qris;
        }
      }

      // Footer: Alamat Fisik Toko & Tautan Google Maps
      const footerAlamatText = document.getElementById("footerAlamatText");
      const footerAlamatLink = document.getElementById("footerAlamatLink");
      if (footerAlamatText && t.alamat) {
        footerAlamatText.textContent = t.alamat;
      }
      if (footerAlamatLink && t.maps) {
        footerAlamatLink.href = t.maps;
      }

      // Footer: Saluran Layanan WhatsApp, Telegram Bot, dan Google Maps
      const footerWaLink = document.getElementById("footerWaLink");
      if (footerWaLink && t.wa) {
        let cleanWa = String(t.wa).replace(/\D/g, "");
        if (cleanWa.startsWith("0")) cleanWa = "62" + cleanWa.slice(1);
        else if (cleanWa.startsWith("8")) cleanWa = "62" + cleanWa;
        footerWaLink.href = `https://api.whatsapp.com/send?phone=${cleanWa}`;
      }

      const footerTgLink = document.getElementById("footerTgLink");
      if (footerTgLink && t.telegram_bot) {
        let tgUrl = String(t.telegram_bot).trim();
        if (tgUrl.startsWith("@")) tgUrl = "https://t.me/" + tgUrl.slice(1);
        footerTgLink.href = tgUrl;
      }

      const footerMapsLink = document.getElementById("footerMapsLink");
      if (footerMapsLink && t.maps) {
        footerMapsLink.href = t.maps;
      }
    }

    // 5. Sinkron Banner Pop-up Promo Carousel Dinamis
    if (json.popupPromos) {
      window.popupPromoData = json.popupPromos;
      const modal = document.getElementById("welcomePromoCarouselModal");
      if (modal && !modal.classList.contains("hidden")) {
        if (json.popupPromos.enabled === false) {
          closeWelcomePromoModal();
        } else if (Array.isArray(json.popupPromos.slides) && json.popupPromos.slides.length > 0) {
          renderWelcomePromoModal(json.popupPromos.slides);
        }
      }
    }
  } catch (e) {
    console.log("Memuat katalog lokal Toko Delina:", e.message);
  }
}

// =========================================================================
// 15. FITUR 2 & 3: MODE KASIR TABLET (POS MINI), WA NOTIF & CETAK STRUK
// =========================================================================

let posOrders = [];
let isPosAuthenticated = false;
let currentPosFilter = "all";
let currentPosSearch = "";
let selectedOrderForPrint = null;

function openPosModal() {
  const modal = document.getElementById("posModal");
  if (!modal) return;

  modal.classList.remove("hidden");

  // Periksa apakah sudah ada sesi PIN tersimpan
  const savedPin = sessionStorage.getItem("delina_pos_pin");
  if (savedPin) {
    isPosAuthenticated = true;
    showPosDashboard();
    loadPosOrders();
  } else {
    showPosPinScreen();
  }
}

function closePosModal() {
  const modal = document.getElementById("posModal");
  if (modal) modal.classList.add("hidden");
}

function showPosPinScreen() {
  const pinScreen = document.getElementById("posPinScreen");
  const dashScreen = document.getElementById("posDashboardScreen");
  const btnRefresh = document.getElementById("posBtnRefresh");
  const btnLock = document.getElementById("posBtnLock");

  if (pinScreen) pinScreen.classList.remove("hidden");
  if (dashScreen) dashScreen.classList.add("hidden");
  if (btnRefresh) btnRefresh.classList.add("hidden");
  if (btnLock) btnLock.classList.add("hidden");

  const pinInput = document.getElementById("posPinInput");
  if (pinInput) {
    pinInput.value = "";
    setTimeout(() => pinInput.focus(), 200);
  }
}

function showPosDashboard() {
  const pinScreen = document.getElementById("posPinScreen");
  const dashScreen = document.getElementById("posDashboardScreen");
  const btnRefresh = document.getElementById("posBtnRefresh");
  const btnLock = document.getElementById("posBtnLock");

  if (pinScreen) pinScreen.classList.add("hidden");
  if (dashScreen) dashScreen.classList.remove("hidden");
  if (btnRefresh) btnRefresh.classList.remove("hidden");
  if (btnLock) btnLock.classList.remove("hidden");
}

function lockPosSession() {
  sessionStorage.removeItem("delina_pos_pin");
  isPosAuthenticated = false;
  showPosPinScreen();
  showToast("Panel Kasir telah dikunci.");
}

async function handlePosPinSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("posPinInput");
  if (!input) return;

  const enteredPin = input.value.trim();
  if (!enteredPin) return;

  sessionStorage.setItem("delina_pos_pin", enteredPin);
  isPosAuthenticated = true;
  showPosDashboard();
  loadPosOrders();
}

async function loadPosOrders(forceRefresh = false) {
  const container = document.getElementById("posOrdersContainer");
  if (!container) return;

  const pin = sessionStorage.getItem("delina_pos_pin") || "1234";

  if (forceRefresh || posOrders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500 space-y-2">
        <div class="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs">Memuat pesanan real-time dari Google Sheets...</p>
      </div>
    `;
  }

  if (typeof CONFIG === "undefined" || !CONFIG.GAS_API_URL) {
    container.innerHTML = `<p class="text-center text-xs text-red-500 py-8">CONFIG.GAS_API_URL belum tersedia.</p>`;
    return;
  }

  try {
    const res = await fetch(`${CONFIG.GAS_API_URL}?action=getOrders&pin=${encodeURIComponent(pin)}`);
    const json = await res.json();

    if (json.status === "error") {
      showToast("PIN Kasir tidak sesuai! Silakan periksa kembali PIN Anda.", "error");
      lockPosSession();
      return;
    }

    if (json.status === "success" && Array.isArray(json.orders)) {
      posOrders = json.orders;
      renderPosOrders();
      if (forceRefresh) showToast("Alhamdulillah, data pesanan berhasil disegarkan.");
    } else {
      container.innerHTML = `<p class="text-center text-xs text-gray-400 py-8">Belum ada data pesanan di Google Sheets.</p>`;
    }
  } catch (err) {
    console.error("Gagal memuat pesanan POS:", err);
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500 space-y-2">
        <p class="text-xs text-red-500">Gagal terhubung ke Google Sheets: ${err.message}</p>
        <button onclick="loadPosOrders(true)" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">Coba Lagi</button>
      </div>
    `;
  }
}

function setPosFilter(filter) {
  currentPosFilter = filter;
  const btns = document.querySelectorAll(".pos-filter-btn");
  btns.forEach(btn => {
    if (btn.getAttribute("data-pos-filter") === filter) {
      btn.className = "pos-filter-btn px-3 py-1.5 rounded-full bg-emerald-700 text-white shadow-xs font-bold text-xs";
    } else {
      btn.className = "pos-filter-btn px-3 py-1.5 rounded-full bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 font-bold text-xs";
    }
  });
  renderPosOrders();
}

function handlePosSearch(val) {
  currentPosSearch = (val || "").toLowerCase().trim();
  renderPosOrders();
}

function renderPosOrders() {
  const container = document.getElementById("posOrdersContainer");
  if (!container) return;

  let filtered = [...posOrders];

  // 1. Filter Status
  if (currentPosFilter !== "all") {
    filtered = filtered.filter(o => (o.orderStatus || "").toLowerCase().includes(currentPosFilter.toLowerCase()));
  }

  // 2. Filter Search
  if (currentPosSearch) {
    filtered = filtered.filter(o => {
      const q = currentPosSearch;
      return (
        (o.orderId || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").toLowerCase().includes(q) ||
        (o.itemsText || "").toLowerCase().includes(q)
      );
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-400 space-y-2">
        <i class="bi bi-inbox text-3xl"></i>
        <p class="text-xs">Tidak ada pesanan yang sesuai filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      ${filtered.map(order => renderSinglePosCard(order)).join("")}
    </div>
  `;
}

function renderSinglePosCard(order) {
  const status = order.orderStatus || "Menunggu Verifikasi Toko";
  let statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-300";
  if (status.includes("Proses")) statusBadgeClass = "bg-blue-100 text-blue-800 border-blue-300";
  if (status.includes("Siap Diambil")) statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (status.includes("Selesai")) statusBadgeClass = "bg-gray-100 text-gray-700 border-gray-300";

  const hasDokumen = order.fotokopiLink && order.fotokopiLink !== "-";
  const hasBukti = order.paymentProofLink && order.paymentProofLink !== "-";

  return `
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/90 flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
      
      <!-- Baris Atas: Nota ID, Waktu, & Status Badge -->
      <div>
        <div class="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-extrabold text-sm text-gray-900">${order.orderId}</span>
              <span class="text-[10px] text-gray-400">• ${order.orderTime || "-"}</span>
            </div>
            <div class="font-bold text-xs text-delina-emerald mt-0.5 flex items-center gap-1">
              <i class="bi bi-person-circle"></i>
              <span>${order.customerName}</span>
              <span class="text-gray-400 font-normal">(${order.customerPhone})</span>
            </div>
          </div>
          <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${statusBadgeClass} whitespace-nowrap">
            ${status}
          </span>
        </div>

        <!-- Rincian Belanja -->
        <div class="mt-2.5 space-y-1.5 text-xs text-gray-700">
          <div class="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            <i class="bi bi-truck"></i> ${order.deliveryMethod || "Ambil Sendiri"}
            ${order.customerAddress && order.customerAddress !== "-" ? `• Alamat: ${order.customerAddress}` : ""}
          </div>
          <div class="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-[11px] font-mono leading-relaxed whitespace-pre-line text-gray-700 max-h-28 overflow-y-auto">
            ${escapeHtml(order.itemsText || "-")}
          </div>
        </div>

        <!-- Berkas Terlampir (Dokumen Fotokopi & Bukti Transfer) -->
        ${(hasDokumen || hasBukti) ? `
          <div class="mt-2 flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-[11px]">
            ${hasDokumen ? `
              <a href="${order.fotokopiLink}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-delina-emerald border border-emerald-200 font-bold hover:bg-emerald-100">
                <i class="bi bi-file-earmark-pdf"></i> Dokumen Cetak
              </a>
            ` : ""}
            ${hasBukti ? `
              <a href="${order.paymentProofLink}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100">
                <i class="bi bi-receipt"></i> Bukti Transfer
              </a>
            ` : ""}
          </div>
        ` : ""}
      </div>

      <!-- Baris Bawah: Total, Ganti Status, dan Tombol Aksi -->
      <div class="pt-2 border-t border-gray-100 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Total Tagihan:</span>
          <span class="text-base font-black text-delina-emerald">${formatRupiah(order.total || 0)}</span>
        </div>

        <!-- Selector Ganti Status -->
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-semibold text-gray-500 whitespace-nowrap">Ubah Status:</span>
          <select 
            onchange="changeOrderStatus('${order.orderId}', this.value)" 
            class="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-tokopedia-green"
          >
            <option value="Menunggu Verifikasi Toko" ${status === "Menunggu Verifikasi Toko" ? "selected" : ""}>Menunggu Verifikasi</option>
            <option value="Sedang Diproses" ${status === "Sedang Diproses" ? "selected" : ""}>Sedang Diproses</option>
            <option value="Siap Diambil" ${status === "Siap Diambil" ? "selected" : ""}>Siap Diambil / Diantar</option>
            <option value="Selesai" ${status === "Selesai" ? "selected" : ""}>Selesai</option>
          </select>
        </div>

        <!-- Tombol Aksi Utama: WA Siap Ambil & Cetak Struk Termal -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <!-- Tombol WA Notifikasi (Fitur 3) -->
          <button 
            type="button" 
            onclick="sendCustomerWhatsAppNotification('${order.orderId}')" 
            class="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            title="Kirim pesan WhatsApp ke pelanggan bahwa pesanan sudah siap"
          >
            <i class="bi bi-whatsapp"></i>
            <span class="truncate">WA Siap Ambil</span>
          </button>

          <!-- Tombol Cetak Struk Termal (Fitur 2) -->
          <button 
            type="button" 
            onclick="openThermalReceiptModal('${order.orderId}')" 
            class="py-2 px-2.5 rounded-xl bg-gray-900 hover:bg-black active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            title="Cetak struk nota belanja ke printer Bluetooth 58mm/80mm"
          >
            <i class="bi bi-printer text-amber-400"></i>
            <span class="truncate">Cetak Struk</span>
          </button>
        </div>

      </div>

    </div>
  `;
}

async function changeOrderStatus(orderId, newStatus) {
  const pin = sessionStorage.getItem("delina_pos_pin") || "1234";

  // Update tampilan lokal segera agar responsif
  const target = posOrders.find(o => o.orderId === orderId);
  if (target) {
    target.orderStatus = newStatus;
    renderPosOrders();
  }

  showToast(`Memperbarui status ${orderId}...`);

  if (typeof CONFIG === "undefined" || !CONFIG.GAS_API_URL) return;

  try {
    const res = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateOrderStatus",
        pin: pin,
        orderId: orderId,
        newStatus: newStatus
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      showToast(`Alhamdulillah, status ${orderId} berhasil diubah.`);
    } else {
      showToast(`Gagal ubah status: ${json.message}`, "error");
      loadPosOrders();
    }
  } catch (err) {
    console.error("Gagal ubah status:", err);
    showToast(`Status lokal disimpan (${err.message})`, "warning");
  }
}

// =========================================================================
// FITUR 3: NOTIFIKASI WHATSAPP KE PELANGGAN (1-KLIK)
// =========================================================================
function sendCustomerWhatsAppNotification(orderId) {
  const order = posOrders.find(o => o.orderId === orderId);
  if (!order) {
    showToast("Data pesanan tidak ditemukan.", "error");
    return;
  }

  let phone = String(order.customerPhone || "").trim().replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) {
    phone = "62" + phone.substring(1);
  } else if (!phone.startsWith("62")) {
    phone = "62" + phone;
  }

  const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh kak ${order.customerName} 🙏

Alhamdulillah, pesanan ATK, Kosmetik & Kelontongan Anda di *Toko Delina* sudah *SELESAI* dan *SIAP DIAMBIL* di toko kami! 🌟

📋 *No. Nota:* ${order.orderId}
📅 *Waktu Pesan:* ${order.orderTime || "-"}
🚚 *Metode:* ${order.deliveryMethod || "Ambil Sendiri di Toko"}
💰 *Total Tagihan:* ${formatRupiah(order.total || 0)}

📍 *Lokasi Toko:* Delina.store (ATK, Kosmetik & Kelontongan)
Jam Buka: 07.30 - 21.00 WIB

_Jazakumullah khairan katsiran atas kepercayaannya. Semoga berkah, awet, dan bermanfaat selalu nggih kak! Barakallahu fiik._ 🙏`;

  const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");
}

// =========================================================================
// FITUR 2: CETAK STRUK TERMAL (58mm / 80mm PRINTER)
// =========================================================================
function openThermalReceiptModal(orderId) {
  const order = posOrders.find(o => o.orderId === orderId);
  if (!order) {
    showToast("Data pesanan tidak ditemukan.", "error");
    return;
  }

  selectedOrderForPrint = order;
  const previewContainer = document.getElementById("thermalReceiptPreview");
  const printContainer = document.getElementById("thermal-print-container");

  const receiptHtml = generateThermalReceiptHtml(order);

  if (previewContainer) previewContainer.innerHTML = receiptHtml;
  if (printContainer) printContainer.innerHTML = receiptHtml;

  const modal = document.getElementById("thermalReceiptModal");
  if (modal) modal.classList.remove("hidden");
}

function closeThermalReceiptModal() {
  const modal = document.getElementById("thermalReceiptModal");
  if (modal) modal.classList.add("hidden");
  selectedOrderForPrint = null;
}

function executeThermalPrint() {
  window.print();
}

function generateThermalReceiptHtml(order) {
  const now = new Date();
  const printTime = now.toLocaleDateString("id-ID") + " " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return `
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.35; max-width: 290px; margin: 0 auto; text-align: left;">
      <div style="text-align: center; margin-bottom: 8px;">
        <div style="font-size: 14px; font-weight: 900; letter-spacing: -0.5px;">DELINA.STORE</div>
        <div style="font-size: 10px;">ATK, Kosmetik dan Kelontongan</div>
        <div style="font-size: 9px; margin-top: 2px;">WA: 0812-3456-7890 • Buka 07.30 - 21.00</div>
      </div>

      <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-bottom: 6px; font-size: 10px;">
        <div>No. Nota : <strong>${order.orderId}</strong></div>
        <div>Waktu    : ${order.orderTime || printTime}</div>
        <div>Pelanggan: ${escapeHtml(order.customerName)}</div>
        <div>Metode   : ${escapeHtml(order.deliveryMethod || "Ambil di Toko")}</div>
      </div>

      <div style="margin-bottom: 6px;">
        <div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">RINCIAN PESANAN</div>
        <div style="font-size: 10px; white-space: pre-line; line-height: 1.4;">
${escapeHtml(order.itemsText || "-")}
        </div>
      </div>

      <div style="border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px; margin-top: 3px; border-top: 1px solid #000; padding-top: 3px;">
          <span>TOTAL BAYAR:</span>
          <span>${formatRupiah(order.total || 0)}</span>
        </div>
        <div style="font-size: 9px; margin-top: 2px; text-align: right;">Status: ${order.orderStatus || "Lunas / Transfer"}</div>
      </div>

      <div style="text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; font-size: 9px;">
        <div style="font-weight: bold;">Jazakumullah Khairan Katsiran</div>
        <div>Terima kasih atas kunjungan Anda</div>
        <div style="margin-top: 2px;">*** Barang yang sudah dibeli dapat ditukar jika cacat cetak ***</div>
      </div>
    </div>
  `;
}

// =========================================================================
// 16. MODAL INFORMASI QRIS & TRANSFER BANK (FOOTER ETALASE)
// =========================================================================

function openQrisInfoModal() {
  const modal = document.getElementById("qrisInfoModal");
  if (modal) {
    modal.classList.remove("hidden");
    if (typeof pushModalState === "function") pushModalState("qrisInfoModal");
  }
}

function closeQrisInfoModal() {
  const modal = document.getElementById("qrisInfoModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

function copyModalRekening(btnElement) {
  const rekText = document.getElementById("modalRekeningText")?.textContent?.trim() || "1234567890";
  copyToClipboard(rekText, btnElement);
}

// =========================================================================
// 17. ANIMASI GEMINI AI BOX - TOOLTIP KIKO FLOATING BUTTON (3s TAMPIL / 3s KELUAR ROTATING)
// Siklus Loop: 3 Detik Tampil - 3 Detik Sembunyi, Pause Saat Hover / Touch
// =========================================================================

const KIKO_ROTATING_MESSAGES = [
  "Assalamu'alaikum kak! Butuh bantuan belanja ATK & Cetak?",
  "✨ Mau info promo & diskon berkah hari ini?",
  "📦 Butuh perlengkapan kantor, kosmetik, atau kelontongan?",
  "⚡ Pesan sekarang, siap ambil tanpa antre di toko!"
];
let kikoMsgIndex = 0;
let chidoriTimer = null;
let isChidoriVisible = false;
let isChidoriPaused = false;

function initChidoriTooltip() {
  const widgetContainer = document.getElementById("kikoFloatingWidget");
  if (!widgetContainer) return;

  // Pause saat mouse hover atau layar sentuh disentuh user agar tidak hilang saat ingin diklik
  const pauseLoop = () => {
    isChidoriPaused = true;
  };
  const resumeLoop = () => {
    isChidoriPaused = false;
  };

  widgetContainer.addEventListener("mouseenter", pauseLoop);
  widgetContainer.addEventListener("mouseleave", resumeLoop);
  widgetContainer.addEventListener("touchstart", pauseLoop, { passive: true });
  widgetContainer.addEventListener("touchend", resumeLoop, { passive: true });

  // Mulai siklus pertama setelah 1 detik halaman termuat
  setTimeout(() => {
    triggerChidoriCycle();
  }, 1000);
}

function triggerChidoriCycle() {
  const widgetContainer = document.getElementById("kikoFloatingWidget");
  const msgEl = document.getElementById("kikoTooltipMessageText");
  const chatModal = document.getElementById("kikoChatModal");
  if (!widgetContainer) return;

  if (chidoriTimer) clearTimeout(chidoriTimer);

  const runCycle = () => {
    // Jika modal chat sedang terbuka, sembunyikan widget dan cek lagi nanti
    if (chatModal && !chatModal.classList.contains("hidden")) {
      widgetContainer.classList.remove("kiko-widget-visible");
      widgetContainer.classList.add("kiko-widget-hidden");
      isChidoriVisible = false;
      chidoriTimer = setTimeout(runCycle, 1000);
      return;
    }

    if (isChidoriPaused) {
      chidoriTimer = setTimeout(runCycle, 600);
      return;
    }

    if (!isChidoriVisible) {
      // FASE 1: TAMPIL SELAMA 3 DETIK (DENGAN EFEK LISTRIK & PESAN SAPAAN AI)
      if (msgEl && Array.isArray(KIKO_ROTATING_MESSAGES) && KIKO_ROTATING_MESSAGES.length > 0) {
        msgEl.textContent = KIKO_ROTATING_MESSAGES[kikoMsgIndex % KIKO_ROTATING_MESSAGES.length];
        kikoMsgIndex++;
      }
      widgetContainer.classList.remove("kiko-widget-hidden");
      widgetContainer.classList.add("kiko-widget-visible");
      isChidoriVisible = true;

      chidoriTimer = setTimeout(() => {
        runCycle();
      }, 3000);
    } else {
      // FASE 2: KELUAR / MENGHILANG TOTAL SELAMA 3 DETIK (OPSI B)
      widgetContainer.classList.remove("kiko-widget-visible");
      widgetContainer.classList.add("kiko-widget-hidden");
      isChidoriVisible = false;

      chidoriTimer = setTimeout(() => {
        runCycle();
      }, 3000);
    }
  };

  runCycle();
}

// Inisialisasi Saat Dokumen Dimuat
document.addEventListener("DOMContentLoaded", () => {
  initWelcomeSplash();
  renderProducts();
  updateCartBadge();
  calculateFotokopi();
  fetchProductsFromGAS();
  initChidoriTooltip();
  initHeroCarousel();
  initAlfagiftHeaderScroll();

  // Live listener jika admin menambah/mengedit produk di tab admin (Sync Real-time tanpa refresh)
  const syncLiveProduct = (newProd) => {
    if (!newProd || !newProd.id) return;
    newProd.category = normalizeStoreCategory(newProd.category, newProd.name);
    newProd.image = formatImageUrl(newProd.image);
    const idx = DUMMY_PRODUCTS.findIndex(p => String(p.id).toUpperCase() === String(newProd.id).toUpperCase());
    if (idx > -1) {
      DUMMY_PRODUCTS[idx] = { ...DUMMY_PRODUCTS[idx], ...newProd };
    } else {
      DUMMY_PRODUCTS.unshift(newProd);
    }
    renderProducts();
    showToast(`⚡ Produk "${newProd.name}" diperbarui di katalog!`);
  };

  window.addEventListener("storage", (e) => {
    if (e.key === "delina_last_saved_product" && e.newValue) {
      try {
        syncLiveProduct(JSON.parse(e.newValue));
      } catch (err) {}
    }
  });

  if (typeof BroadcastChannel !== "undefined") {
    try {
      const bc = new BroadcastChannel("delina_catalog_sync");
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.type === "PRODUCT_SAVED" && ev.data.product) {
          syncLiveProduct(ev.data.product);
        }
      };
    } catch (err) {}
  }

  // Pasang listener pencarian
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  // Pasang listener eksplisit tombol Kasir POS
  const posButtons = document.querySelectorAll('[data-pos-trigger], #btnHeaderKasirPos, button[onclick*="openPosModal"]');
  posButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openPosModal();
    });
  });
});

/**
 * =========================================================================
 * 12. SISTEM MEMBER VIP & ROYALTY (30x BELANJA = 1 HADIAH GRATIS) & IMAGE HELPER
 * =========================================================================
 */
let currentMemberSession = null;
let memberAuthMode = "login";
let memberRewardsList = [];

// =========================================================================
// HELPER STANDAR WAKTU INDONESIA BARAT (WIB - ASIA/JAKARTA)
// =========================================================================
function formatWaktuWIB(input) {
  if (!input) {
    const now = new Date();
    return (
      now.toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) +
      ", " +
      now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\./g, ":") +
      " WIB"
    );
  }

  const str = String(input).trim();
  // Jika sudah mengandung WIB dan bukan format ISO mentah, rapikan saja
  if (str.includes("WIB") && !str.includes("T")) {
    return str;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return (
      parsed.toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) +
      ", " +
      parsed.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\./g, ":") +
      " WIB"
    );
  }

  return str.endsWith("WIB") ? str : `${str} WIB`;
}

// =========================================================================
// HELPER FORMAT URL GAMBAR (TERMASUK FIX 404 UNSPLASH & GOOGLE DRIVE)
// =========================================================================
function formatImageUrl(url) {
  if (!url || typeof url !== "string") {
    return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500";
  }
  const clean = url.trim();
  if (!clean) {
    return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500";
  }
  if (clean.startsWith("data:image/")) {
    return clean;
  }
  // Intercept URL Unsplash lama yang 404 agar bebas error di console
  if (clean.includes("1608248597359") || clean.includes("1607006314330")) {
    return "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80";
  }
  if (clean.includes("1556228722")) {
    return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80";
  }
  if (clean.includes("1585336261026")) {
    return "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80";
  }
  if (clean.includes("1550524514")) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80";
  }
  if (clean.includes("lh3.googleusercontent.com/d/")) {
    return clean;
  }
  let fileId = "";
  const matchFileD = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    fileId = matchFileD[1];
  } else {
    const matchIdParam = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchIdParam && matchIdParam[1]) {
      fileId = matchIdParam[1];
    }
  }
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return clean;
}

// =========================================================================
// PENYIMPANAN LOKAL PROFIL MEMBER & RIWAYAT TRANSAKSI (SINKRON DENGAN GAS)
// =========================================================================
function normalizeMemberPhoneKey(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.slice(-9) || digits;
}

function getMemberProfileLocalMap(phone) {
  try {
    const key = normalizeMemberPhoneKey(phone);
    if (!key) return {};
    const raw = localStorage.getItem("delina_member_profiles_map");
    const map = raw ? JSON.parse(raw) : {};
    return map[key] || {};
  } catch (e) {
    return {};
  }
}

function saveMemberProfileLocalMap(phone, dataObj) {
  try {
    const key = normalizeMemberPhoneKey(phone);
    if (!key) return;
    const raw = localStorage.getItem("delina_member_profiles_map");
    const map = raw ? JSON.parse(raw) : {};
    map[key] = Object.assign({}, map[key] || {}, dataObj);
    localStorage.setItem("delina_member_profiles_map", JSON.stringify(map));
  } catch (e) {
    console.warn("saveMemberProfileLocalMap notice:", e);
  }
}

function saveCustomerOrderToLocalHistory(orderObj) {
  if (!orderObj) return;
  try {
    const raw = localStorage.getItem("delina_customer_orders_history");
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(o => (o.orderId || o.nota) !== (orderObj.orderId || orderObj.nota));
    filtered.unshift({
      orderId: orderObj.orderId,
      orderTime: formatWaktuWIB(orderObj.orderTime),
      customerName: orderObj.customerName,
      customerPhone: orderObj.customerPhone,
      deliveryMethod: orderObj.deliveryMethod,
      total: orderObj.totalAkhir || formatRupiah(orderObj.totalNumeric || 0),
      totalNumeric: orderObj.totalNumeric || 0,
      subtotalNumeric: orderObj.subtotalNumeric || 0,
      discountAmount: orderObj.discountAmount || 0,
      deliveryFee: orderObj.deliveryFee || 0,
      status: orderObj.status || "Menunggu Verifikasi Toko",
      items: orderObj.items || []
    });
    localStorage.setItem("delina_customer_orders_history", JSON.stringify(filtered.slice(0, 50)));
  } catch (e) {
    console.warn("saveCustomerOrderToLocalHistory notice:", e);
  }
}

function getCustomerOrdersFromLocalHistory() {
  try {
    const raw = localStorage.getItem("delina_customer_orders_history");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// =========================================================================
// KOMPRESOR GAMBAR HTML5 CANVAS (AGAR CEPAT & HEMAT MEMORI / GOOGLE DRIVE)
// =========================================================================
function compressImageToBase64(file, maxWidth = 360, maxHeight = 360, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =========================================================================
// AUTO-LOGOUT IDLE TIMER 3 MENIT (180 DETIK) KHUSUS PELANGGAN LOGIN
// =========================================================================
const MEMBER_IDLE_LIMIT_SECONDS = 180; // 3 Menit
let memberIdleRemainingSeconds = MEMBER_IDLE_LIMIT_SECONDS;
let memberIdleIntervalId = null;
let memberIdleWarningShown = false;

function resetMemberIdleTimer() {
  if (!currentMemberSession) return;
  memberIdleRemainingSeconds = MEMBER_IDLE_LIMIT_SECONDS;
  memberIdleWarningShown = false;
  updateMemberIdleBadgeUI();
}

function updateMemberIdleBadgeUI() {
  const badge = document.getElementById("memberIdleTimerBadge");
  const textEl = document.getElementById("memberIdleCountdownText");
  if (!badge || !textEl) return;

  if (!currentMemberSession) {
    badge.classList.add("hidden");
    return;
  }

  badge.classList.remove("hidden");
  const mins = String(Math.floor(memberIdleRemainingSeconds / 60)).padStart(2, "0");
  const secs = String(memberIdleRemainingSeconds % 60).padStart(2, "0");
  textEl.textContent = `${mins}:${secs}`;

  if (memberIdleRemainingSeconds <= 30) {
    badge.className = "px-2 py-1 rounded-xl bg-red-600 text-white border border-red-400 text-[10px] font-mono font-black flex items-center gap-1 animate-pulse";
  } else {
    badge.className = "px-2 py-1 rounded-xl bg-emerald-800/90 border border-emerald-600/60 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1";
  }
}

function startMemberIdleWatchdog() {
  if (memberIdleIntervalId) clearInterval(memberIdleIntervalId);
  memberIdleRemainingSeconds = MEMBER_IDLE_LIMIT_SECONDS;
  memberIdleWarningShown = false;
  updateMemberIdleBadgeUI();

  memberIdleIntervalId = setInterval(() => {
    if (!currentMemberSession) {
      stopMemberIdleWatchdog();
      return;
    }

    memberIdleRemainingSeconds--;
    updateMemberIdleBadgeUI();

    if (memberIdleRemainingSeconds === 15 && !memberIdleWarningShown) {
      memberIdleWarningShown = true;
      playCuteSound("reminder");
      showToast("⏱️ Akun VIP Anda akan keluar otomatis dalam 15 detik karena tidak ada aktivitas.", "warning");
    }

    if (memberIdleRemainingSeconds <= 0) {
      executeAutoIdleLogout();
    }
  }, 1000);
}

function stopMemberIdleWatchdog() {
  if (memberIdleIntervalId) {
    clearInterval(memberIdleIntervalId);
    memberIdleIntervalId = null;
  }
  const badge = document.getElementById("memberIdleTimerBadge");
  if (badge) badge.classList.add("hidden");
}

function executeAutoIdleLogout() {
  stopMemberIdleWatchdog();
  if (!currentMemberSession) return;

  currentMemberSession = null;
  localStorage.removeItem("delina_member_session");

  const headerText = document.getElementById("headerMemberText");
  if (headerText) headerText.textContent = "Member / Hadiah";

  const authContainer = document.getElementById("memberAuthContainer");
  const dashContainer = document.getElementById("memberDashboardContainer");
  if (authContainer) authContainer.classList.remove("hidden");
  if (dashContainer) dashContainer.classList.add("hidden");

  switchMemberAuthMode("login");
  playCuteSound("cancel");
  showToast("🔒 Sesi akun Member VIP otomatis keluar karena tidak aktif selama 3 menit.", "info");
}

// Pasang pendeteksi aktivitas pengguna untuk me-reset timer 3 menit
if (typeof window !== "undefined") {
  ["touchstart", "click", "keydown", "scroll", "mousemove"].forEach(evtName => {
    window.addEventListener(evtName, () => {
      if (currentMemberSession) {
        resetMemberIdleTimer();
      }
    }, { passive: true });
  });
}

function initMemberSessionFromStorage() {
  try {
    const saved = localStorage.getItem("delina_member_session");
    if (saved) {
      currentMemberSession = JSON.parse(saved);
      if (currentMemberSession && currentMemberSession.phone) {
        // Gabungkan dengan simpanan lokal profil (foto, KTP, alamat)
        const localProf = getMemberProfileLocalMap(currentMemberSession.phone);
        if (localProf.photoUrl && !currentMemberSession.photoUrl) currentMemberSession.photoUrl = localProf.photoUrl;
        if (localProf.ktpUrl && !currentMemberSession.ktpUrl) currentMemberSession.ktpUrl = localProf.ktpUrl;
        if (localProf.address && !currentMemberSession.address) currentMemberSession.address = localProf.address;
      }
      if (currentMemberSession && currentMemberSession.name) {
        const textEl = document.getElementById("headerMemberText");
        if (textEl) {
          textEl.textContent = currentMemberSession.name.split(" ")[0];
        }
        startMemberIdleWatchdog();
      }
    }
  } catch (e) {
    console.warn("Notice parsing member session:", e);
  }
}

function openMemberModal(initialTab) {
  const modal = document.getElementById("memberModal");
  if (!modal) return;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
  if (typeof pushModalState === "function") pushModalState("memberModal");

  if (currentMemberSession) {
    startMemberIdleWatchdog();
    // Pengguna sudah login -> Tampilkan Dashboard Member
    const authContainer = document.getElementById("memberAuthContainer");
    const dashContainer = document.getElementById("memberDashboardContainer");
    if (authContainer) authContainer.classList.add("hidden");
    if (dashContainer) dashContainer.classList.remove("hidden");

    const localProf = getMemberProfileLocalMap(currentMemberSession.phone);
    if (localProf.photoUrl) currentMemberSession.photoUrl = localProf.photoUrl;
    if (localProf.ktpUrl) currentMemberSession.ktpUrl = localProf.ktpUrl;
    if (localProf.address && !currentMemberSession.address) currentMemberSession.address = localProf.address;

    renderMemberDashboardUI(currentMemberSession);
    refreshMemberDataOnline(currentMemberSession.phone);

    if (initialTab === "rewards") {
      setTimeout(() => scrollToRewardsSection(), 200);
    }
  } else {
    stopMemberIdleWatchdog();
    // Pengguna belum login -> Tampilkan Form Auth
    const authContainer = document.getElementById("memberAuthContainer");
    const dashContainer = document.getElementById("memberDashboardContainer");
    if (authContainer) authContainer.classList.remove("hidden");
    if (dashContainer) dashContainer.classList.add("hidden");
    switchMemberAuthMode(initialTab === "register" ? "register" : "login");
  }
}

function closeMemberModal() {
  const modal = document.getElementById("memberModal");
  if (!modal) return;
  const wasOpen = !modal.classList.contains("hidden");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
  if (activeBottomNav === "member" || activeBottomNav === "hadiah") {
    setActiveBottomNav("home");
  }
  if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
}

function switchMemberAuthMode(mode) {
  memberAuthMode = mode;
  const btnLogin = document.getElementById("tabBtnMemberLogin");
  const btnRegister = document.getElementById("tabBtnMemberRegister");
  const nameField = document.getElementById("fieldMemberNameContainer");
  const nameInput = document.getElementById("memberInputName");
  const submitText = document.getElementById("btnSubmitMemberAuthText");

  if (mode === "login") {
    if (btnLogin) {
      btnLogin.className = "flex-1 py-2 text-xs font-black rounded-xl bg-emerald-700 text-white shadow-xs transition-all cursor-pointer";
    }
    if (btnRegister) {
      btnRegister.className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer";
    }
    if (nameField) nameField.classList.add("hidden");
    if (nameInput) nameInput.required = false;
    if (submitText) submitText.textContent = "Masuk ke Akun Member";
  } else {
    if (btnRegister) {
      btnRegister.className = "flex-1 py-2 text-xs font-black rounded-xl bg-emerald-700 text-white shadow-xs transition-all cursor-pointer";
    }
    if (btnLogin) {
      btnLogin.className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer";
    }
    if (nameField) nameField.classList.remove("hidden");
    if (nameInput) nameInput.required = true;
    if (submitText) submitText.textContent = "Daftar Member VIP Delina";
  }
}

function switchMemberAuthTab(mode) {
  switchMemberAuthMode(mode);
}

async function handleMemberAuthSubmit(event) {
  if (event) event.preventDefault();
  const phoneInput = document.getElementById("memberInputPhone");
  const nameInput = document.getElementById("memberInputName");
  const passInput = document.getElementById("memberInputPassword");
  const btnSubmit = document.getElementById("btnSubmitMemberAuth");

  const phone = phoneInput ? phoneInput.value.trim() : "";
  const name = nameInput ? nameInput.value.trim() : "";
  const password = passInput ? passInput.value.trim() : "";

  if (!phone) {
    showToast("Silakan masukkan nomor WhatsApp Anda.", "error");
    return;
  }
  if (!password) {
    showToast("Silakan masukkan password / PIN Anda.", "error");
    return;
  }

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.classList.add("opacity-60", "cursor-wait");
  }

  try {
    if (memberAuthMode === "login") {
      await handleMemberLogin(phone, password);
    } else {
      if (!name) {
        showToast("Nama lengkap wajib diisi untuk pendaftaran member baru.", "error");
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.classList.remove("opacity-60", "cursor-wait");
        }
        return;
      }
      await handleMemberRegister(phone, name, password);
    }
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove("opacity-60", "cursor-wait");
    }
  }
}

async function handleMemberLogin(phone, password) {
  showToast("Memeriksa akun member Anda...", "info");
  try {
    const res = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "loginMember",
        phone: phone,
        password: password
      })
    });
    const json = await res.json();
    if (json.status === "success" && json.member) {
      json.member.password = password;
      const localProf = getMemberProfileLocalMap(json.member.phone || phone);
      if (localProf.photoUrl && !json.member.photoUrl) json.member.photoUrl = localProf.photoUrl;
      if (localProf.ktpUrl && !json.member.ktpUrl) json.member.ktpUrl = localProf.ktpUrl;
      if (localProf.address && !json.member.address) json.member.address = localProf.address;

      currentMemberSession = json.member;
      localStorage.setItem("delina_member_session", JSON.stringify(json.member));
      startMemberIdleWatchdog();
      playCuteSound("confirm");
      showToast(json.message || "Alhamdulillah, selamat datang kembali!", "success");

      const headerText = document.getElementById("headerMemberText");
      if (headerText) headerText.textContent = json.member.name.split(" ")[0];

      // Switch ke dashboard
      const authContainer = document.getElementById("memberAuthContainer");
      const dashContainer = document.getElementById("memberDashboardContainer");
      if (authContainer) authContainer.classList.add("hidden");
      if (dashContainer) dashContainer.classList.remove("hidden");

      renderMemberDashboardUI(json.member, json.claims || [], json.orders || []);
      refreshMemberDataOnline(json.member.phone || phone);
    } else {
      showToast(json.message || "Gagal masuk. Periksa nomor HP dan password Anda.", "error");
    }
  } catch (err) {
    console.error("Login member error:", err);
    showToast("Gagal terhubung ke server. Periksa koneksi internet.", "error");
  }
}

async function handleMemberRegister(phone, name, password) {
  showToast("Mendaftarkan akun Member VIP...", "info");
  try {
    const res = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "registerMember",
        phone: phone,
        name: name,
        password: password
      })
    });
    const json = await res.json();
    if (json.status === "success" && json.member) {
      json.member.password = password;
      currentMemberSession = json.member;
      localStorage.setItem("delina_member_session", JSON.stringify(json.member));
      startMemberIdleWatchdog();
      playCuteSound("confirm");
      showToast(json.message || "Pendaftaran berhasil!", "success");

      const headerText = document.getElementById("headerMemberText");
      if (headerText) headerText.textContent = json.member.name.split(" ")[0];

      const authContainer = document.getElementById("memberAuthContainer");
      const dashContainer = document.getElementById("memberDashboardContainer");
      if (authContainer) authContainer.classList.add("hidden");
      if (dashContainer) dashContainer.classList.remove("hidden");

      renderMemberDashboardUI(json.member, [], []);
      refreshMemberDataOnline(json.member.phone || phone);
    } else {
      showToast(json.message || "Gagal mendaftar.", "error");
    }
  } catch (err) {
    console.error("Register member error:", err);
    showToast("Gagal mendaftar ke server. Periksa koneksi internet.", "error");
  }
}

async function handleMemberLogout() {
  const ok = await showDelinaConfirm({
    title: "Keluar Akun Member?",
    subtitle: "Program Hadiah Royalty Delina",
    message: "Apakah Anda yakin ingin keluar dari akun Member Delina di perangkat ini?",
    confirmText: "Ya, Keluar",
    cancelText: "Batal",
    type: "warning",
    icon: "bi bi-box-arrow-right"
  });
  if (ok) {
    stopMemberIdleWatchdog();
    currentMemberSession = null;
    localStorage.removeItem("delina_member_session");

    const headerText = document.getElementById("headerMemberText");
    if (headerText) headerText.textContent = "Member / Hadiah";

    const authContainer = document.getElementById("memberAuthContainer");
    const dashContainer = document.getElementById("memberDashboardContainer");
    if (authContainer) authContainer.classList.remove("hidden");
    if (dashContainer) dashContainer.classList.add("hidden");

    switchMemberAuthMode("login");
    showToast("Anda telah keluar dari akun Member.", "info");
  }
}

// Helper Inisial Nama Member (Avatar Default)
function getMemberInitials(name) {
  if (!name) return "VIP";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  } else if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return "VIP";
}

function triggerProfilePhotoUpload() {
  playCuteSound("pop");
  const input = document.getElementById("memberProfilePhotoInput");
  if (input) {
    input.value = "";
    input.click();
  }
}

// Sinkronisasi Cloud Cadangan ke Google Sheets agar Pindah Perangkat / HP Lain 100% Otomatis Terhubung
function syncMemberCloudProfileToSheets(phone, dataObj) {
  if (!phone || typeof CONFIG === "undefined" || !CONFIG.GAS_API_URL) return;
  const cleanP = String(phone).replace(/\D/g, "");
  if (!cleanP) return;

  const existing = getMemberProfileLocalMap(cleanP);
  const merged = {
    photoUrl: (dataObj && dataObj.photoUrl) || existing.photoUrl || (currentMemberSession && currentMemberSession.photoUrl) || "",
    ktpUrl: (dataObj && dataObj.ktpUrl) || existing.ktpUrl || (currentMemberSession && currentMemberSession.ktpUrl) || "",
    address: (dataObj && dataObj.address !== undefined) ? dataObj.address : (existing.address || (currentMemberSession && currentMemberSession.address) || "")
  };

  try {
    fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveCoupon",
        pin: "9999",
        code: "MPROF_" + cleanP,
        type: "MEMBER_SYNC",
        value: 0,
        minSpend: 0,
        status: "MEMBER_SYNC",
        description: JSON.stringify(merged)
      })
    }).catch(() => {});
  } catch (e) {}
}

async function handleProfilePhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showToast("Ukuran foto maksimal 10 MB.", "warning");
    return;
  }

  showToast("Memproses & mengunggah foto profil ke Google Drive...", "info");
  try {
    // Kompres foto ke 220x220px JPEG agar ringan (~12 KB), tajam, cepat diunggah ke folder Google Drive & lintas perangkat
    const compressedBase64 = await compressImageToBase64(file, 220, 220, 0.76);
    if (!currentMemberSession) return;

    currentMemberSession.photoUrl = compressedBase64;
    localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));
    saveMemberProfileLocalMap(currentMemberSession.phone, { photoUrl: compressedBase64 });

    const img = document.getElementById("memberAvatarImg");
    const placeholder = document.getElementById("memberAvatarPlaceholder");
    if (img) {
      img.src = compressedBase64;
      img.classList.remove("hidden");
    }
    if (placeholder) placeholder.classList.add("hidden");

    // Simpan ke Cloud Sync & Folder Google Drive (Foto_Profil_dan_KTP_Member)
    syncMemberCloudProfileToSheets(currentMemberSession.phone, { photoUrl: compressedBase64 });

    if (typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
      fetch(CONFIG.GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "uploadMemberPhoto",
          phone: currentMemberSession.phone,
          name: currentMemberSession.name || "Member",
          photo: compressedBase64
        })
      }).then(r => r.json()).then(res => {
        if (res && res.status === "success" && res.photoUrl && !String(res.photoUrl).startsWith("Gagal")) {
          currentMemberSession.photoUrl = res.photoUrl;
          localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));
          saveMemberProfileLocalMap(currentMemberSession.phone, { photoUrl: res.photoUrl });
          syncMemberCloudProfileToSheets(currentMemberSession.phone, { photoUrl: res.photoUrl });
        }
      }).catch(err => console.warn("Notice uploadMemberPhoto GAS:", err));
    }

    playCuteSound("sparkle");
    showToast("Alhamdulillah, foto profil berhasil disimpan ke Google Drive & sinkron lintas perangkat!", "success");
  } catch (err) {
    console.error("Gagal proses foto profil:", err);
    showToast("Gagal memproses foto profil.", "error");
  }
}

let tempKtpBase64 = null;
let isKtpSectionOpen = false;

function toggleKtpVerificationSection(event) {
  if (event && event.stopPropagation) event.stopPropagation();
  playCuteSound("pop");

  const content = document.getElementById("ktpVerificationContent");
  const icon = document.getElementById("ktpToggleIcon");
  const label = document.getElementById("ktpStatusLabelText");
  if (!content) return;

  isKtpSectionOpen = content.classList.contains("hidden");
  if (isKtpSectionOpen) {
    content.classList.remove("hidden");
    if (icon) icon.classList.add("rotate-180");
    if (label) label.textContent = "Tutup";
  } else {
    content.classList.add("hidden");
    if (icon) icon.classList.remove("rotate-180");
    const hasVerified = currentMemberSession && (currentMemberSession.ktpUrl || currentMemberSession.address);
    if (label) label.textContent = hasVerified ? "✅ Tersimpan" : "Buka";
  }
}

function triggerKtpPhotoUpload() {
  playCuteSound("pop");
  const input = document.getElementById("memberKtpInput");
  if (input) {
    input.value = "";
    input.click();
  }
}

async function handleKtpPhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showToast("Ukuran foto KTP maksimal 10 MB.", "warning");
    return;
  }

  try {
    // Kompres foto KTP ke 520x360px agar tulisan jelas, ringan (~22 KB) & sinkron cepat ke Google Drive
    tempKtpBase64 = await compressImageToBase64(file, 520, 360, 0.72);
    const img = document.getElementById("ktpPreviewImg");
    const placeholder = document.getElementById("ktpPlaceholderText");
    if (img) {
      img.src = tempKtpBase64;
      img.classList.remove("hidden");
    }
    if (placeholder) placeholder.classList.add("hidden");
    playCuteSound("confirm");
    showToast("Foto KTP berhasil dimuat, silakan klik Simpan untuk klaim Voucher Rahasia!", "info");
  } catch (e) {
    showToast("Gagal memproses file KTP.", "error");
  }
}

async function saveMemberKtpAndAddress() {
  if (!currentMemberSession) {
    showToast("Silakan masuk ke akun member terlebih dahulu.", "warning");
    return;
  }

  const addrInput = document.getElementById("memberAddressInput");
  const address = addrInput ? addrInput.value.trim() : "";

  if (!address && !tempKtpBase64 && !currentMemberSession.ktpUrl) {
    showToast("Silakan unggah foto KTP atau isi alamat pengiriman terlebih dahulu.", "warning");
    return;
  }

  currentMemberSession.address = address;
  if (tempKtpBase64) {
    currentMemberSession.ktpUrl = tempKtpBase64;
  }
  localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));
  saveMemberProfileLocalMap(currentMemberSession.phone, {
    address: address,
    ktpUrl: currentMemberSession.ktpUrl || ""
  });

  const ktpLabel = document.getElementById("ktpStatusLabelText");
  if (ktpLabel) ktpLabel.textContent = "✅ Tersimpan";

  // Sinkron ke Cloud Sheets & Folder Google Drive (Foto_Profil_dan_KTP_Member)
  syncMemberCloudProfileToSheets(currentMemberSession.phone, {
    address: address,
    ktpUrl: currentMemberSession.ktpUrl || ""
  });

  if (typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
    try {
      fetch(CONFIG.GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveMemberKtp",
          phone: currentMemberSession.phone,
          name: currentMemberSession.name || "Member",
          address: address,
          ktpPhoto: tempKtpBase64 || currentMemberSession.ktpUrl || null
        })
      }).then(r => r.json()).then(res => {
        if (res && res.status === "success" && res.ktpUrl && !String(res.ktpUrl).startsWith("Gagal")) {
          currentMemberSession.ktpUrl = res.ktpUrl;
          localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));
          saveMemberProfileLocalMap(currentMemberSession.phone, { ktpUrl: res.ktpUrl });
          syncMemberCloudProfileToSheets(currentMemberSession.phone, { ktpUrl: res.ktpUrl, address: address });
        }
      }).catch(e => console.warn("Notice saveMemberKtp GAS:", e));
    } catch (e) {}
  }

  playCuteSound("fanfare");
  showToast("Alhamdulillah, KTP & Alamat tersimpan ke Google Drive!", "success");
  toggleKtpVerificationSection();

  // Munculkan Pop-up Konfirmasi Kirim ke WhatsApp Admin untuk Verifikasi & Klaim Voucher Rahasia
  openKtpWhatsappConfirmModal(address);
}

function openKtpWhatsappConfirmModal(addressVal) {
  const modal = document.getElementById("modalKtpWhatsappConfirm");
  if (!modal || !currentMemberSession) return;

  const elName = document.getElementById("ktpConfirmMemberName");
  const elPhone = document.getElementById("ktpConfirmMemberPhone");
  const elAddr = document.getElementById("ktpConfirmMemberAddress");

  if (elName) elName.textContent = currentMemberSession.name || "Member VIP Delina";
  if (elPhone) elPhone.textContent = currentMemberSession.phone || "-";
  if (elAddr) elAddr.textContent = addressVal || currentMemberSession.address || "Sudah Diunggah";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (typeof pushModalState === "function") pushModalState("modalKtpWhatsappConfirm");
}

function closeKtpWhatsappConfirmModal() {
  const modal = document.getElementById("modalKtpWhatsappConfirm");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

function sendKtpVerificationToAdminWhatsApp(appMode = "regular") {
  if (!currentMemberSession) return;
  playCuteSound("confirm");

  const name = currentMemberSession.name || "Member VIP";
  const phone = currentMemberSession.phone || "-";
  const address = currentMemberSession.address || "-";
  const ktpLinkInfo = (currentMemberSession.ktpUrl && String(currentMemberSession.ktpUrl).startsWith("http"))
    ? `\n🔗 *Link Berkas KTP Drive:* ${currentMemberSession.ktpUrl}`
    : `\n📎 *Status Berkas KTP:* Sudah Terunggah di Sistem Member VIP Delina`;
  const wibNow = formatWaktuWIB(new Date());

  const message =
    `🎁 *VERIFIKASI KTP MEMBER VIP & KLAIM VOUCHER RAHASIA* 🎁\n` +
    `Assalamu'alaikum Admin *Toko Delina* 🙏\n\n` +
    `Saya telah mengunggah *Identitas KTP & Alamat Pengantaran* di akun Member VIP Delina.store. Mohon ditinjau & diverifikasi nggih Admin:\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama Member:* *${name}*\n` +
    `📱 *No. WhatsApp:* \`${phone}\`\n` +
    `📍 *Alamat Lengkap:* ${address}\n` +
    `🕒 *Waktu Unggah:* ${wibNow}${ktpLinkInfo}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✨ _Mohon kiranya saya dapat diberikan *Voucher Rahasia dari Toko Delina* setelah verifikasi selesai. Jazakumullah Khairan Katsiran!_ 🤲`;

  const rawStorePhone = (typeof CONFIG !== "undefined" && CONFIG.WHATSAPP_ADMIN)
    ? CONFIG.WHATSAPP_ADMIN
    : "6282185355316";

  openWhatsAppWithAppChoice(rawStorePhone, message, appMode);
  closeKtpWhatsappConfirmModal();
}

function openMemberBarcodeModal() {
  if (!currentMemberSession) {
    showToast("Silakan masuk ke akun member terlebih dahulu.", "warning");
    return;
  }

  playCuteSound("pop");
  const modal = document.getElementById("memberBarcodeModal");
  const nameEl = document.getElementById("barcodeMemberNameText");
  const phoneEl = document.getElementById("barcodeMemberPhoneText");
  const imgEl = document.getElementById("barcodeMemberImg");

  if (!modal) return;

  const phone = currentMemberSession.phone || "";
  const cleanP = phone.replace(/\D/g, "") || "082185355316";

  if (nameEl) nameEl.textContent = currentMemberSession.name || "Member Delina";
  if (phoneEl) phoneEl.textContent = phone;

  if (imgEl) {
    imgEl.src = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${cleanP}&scale=2&height=10&includetext`;
    imgEl.onerror = function() {
      imgEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${cleanP}`;
    };
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (typeof pushModalState === "function") pushModalState("memberBarcodeModal");
}

function closeMemberBarcodeModal() {
  const modal = document.getElementById("memberBarcodeModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

// =========================================================================
// MODAL BARCODE VOUCHER KLAIM HADIAH MEMBER (SAAT KLAIM & AMBIL DI TOKO)
// =========================================================================
function openRewardClaimBarcodeModal(claimId, rewardName, claimTime, statusText) {
  const modal = document.getElementById("rewardClaimBarcodeModal");
  if (!modal) return;

  playCuteSound("sparkle");
  const cleanCode = String(claimId || "KLM-DELINA").trim();
  const memberName = (currentMemberSession && currentMemberSession.name) ? currentMemberSession.name : "Member VIP Delina";
  const memberPhone = (currentMemberSession && currentMemberSession.phone) ? currentMemberSession.phone : "-";
  const formattedTime = formatWaktuWIB(claimTime || new Date());
  const status = statusText || "Menunggu Diambil di Kasir";

  const elReward = document.getElementById("claimBarcodeRewardName");
  const elId = document.getElementById("claimBarcodeIdText");
  const elName = document.getElementById("claimBarcodeMemberName");
  const elPhone = document.getElementById("claimBarcodeMemberPhone");
  const elTime = document.getElementById("claimBarcodeTimeWib");
  const elStatus = document.getElementById("claimBarcodeStatusBadge");
  const img1D = document.getElementById("claimBarcode1DImg");
  const imgQr = document.getElementById("claimBarcodeQrImg");

  if (elReward) elReward.textContent = rewardName || "Hadiah Loyalitas 30 Stempel";
  if (elId) elId.textContent = cleanCode;
  if (elName) elName.textContent = memberName;
  if (elPhone) elPhone.textContent = memberPhone;
  if (elTime) elTime.textContent = formattedTime;
  if (elStatus) {
    elStatus.textContent = status;
    elStatus.className = status === "Sudah Diserahkan"
      ? "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800"
      : "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800";
  }

  const qrData = encodeURIComponent(`DELINA-CLAIM|${cleanCode}|${memberPhone}|${rewardName || ""}`);
  if (img1D) {
    img1D.src = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(cleanCode)}&scale=2&height=10&includetext`;
  }
  if (imgQr) {
    imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (typeof pushModalState === "function") pushModalState("rewardClaimBarcodeModal");
}

function closeRewardClaimBarcodeModal() {
  const modal = document.getElementById("rewardClaimBarcodeModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

// =========================================================================
// RIWAYAT TRANSAKSI BELANJA MEMBER (SINKRON GOOGLE SHEETS + LOKAL)
// =========================================================================
let cachedMemberOrdersMap = {};

function mergeMemberOrdersSources(memberPhone, memberName, gasOrdersList) {
  const cleanP = String(memberPhone || "").replace(/\D/g, "").slice(-8);
  const cleanName = String(memberName || "").trim().toLowerCase();
  const mergedMap = new Map();

  function addOrMergeOrder(o, isAuthoritativeStatus = false) {
    if (!o) return;
    const id = String(o.orderId || o.nota || "").trim();
    if (!id) return;
    if (!mergedMap.has(id)) {
      mergedMap.set(id, Object.assign({}, o));
    } else {
      const existing = mergedMap.get(id);
      const newStatus = String(o.status || o.orderStatus || "").trim();
      if (isAuthoritativeStatus && newStatus) {
        existing.status = newStatus;
        existing.orderStatus = newStatus;
      } else if (!existing.status && newStatus) {
        existing.status = newStatus;
      }
      if (!existing.items && o.items) existing.items = o.items;
      if (!existing.itemsText && o.itemsText) existing.itemsText = o.itemsText;
      if (!existing.deliveryMethod && o.deliveryMethod) existing.deliveryMethod = o.deliveryMethod;
    }
  }

  // 1. Dari riwayat checkout lokal di perangkat ini (sebagai basis awal item detail)
  const localHistory = getCustomerOrdersFromLocalHistory();
  localHistory.forEach(o => {
    const oPhone = String(o.customerPhone || "").replace(/\D/g, "");
    const oName = String(o.customerName || "").trim().toLowerCase();
    const phoneMatch = cleanP && oPhone && oPhone.endsWith(cleanP);
    const nameMatch = cleanName && cleanName.length >= 3 && oName === cleanName;
    if (phoneMatch || nameMatch) {
      addOrMergeOrder(o, false);
    }
  });

  // 2. Dari cache POS Admin lokal (jika admin & pelanggan di browser yang sama)
  try {
    const posCacheRaw = localStorage.getItem("delina_pos_orders_cache");
    if (posCacheRaw) {
      const posCacheList = JSON.parse(posCacheRaw);
      if (Array.isArray(posCacheList)) {
        posCacheList.forEach(o => {
          const oPhone = String(o.customerPhone || o.memberPhone || o.phone || "").replace(/\D/g, "");
          const oName = String(o.customerName || "").trim().toLowerCase();
          const phoneMatch = cleanP && oPhone && oPhone.endsWith(cleanP);
          const nameMatch = cleanName && cleanName.length >= 3 && oName === cleanName;
          if (phoneMatch || nameMatch) {
            addOrMergeOrder(o, true);
          }
        });
      }
    }
  } catch (e) {}

  // 3. Dari response langsung getMemberData (Google Sheets Tab Pesanan)
  if (Array.isArray(gasOrdersList)) {
    gasOrdersList.forEach(o => addOrMergeOrder(o, true));
  }

  // 4. Dari posOrders global (yang ditarik langsung via ?action=getOrders&pin=1234 dari Google Sheets) -> PALING OTORITATIF UNTUK STATUS ADMIN!
  if (typeof posOrders !== "undefined" && Array.isArray(posOrders)) {
    posOrders.forEach(o => {
      const oPhone = String(o.customerPhone || o.memberPhone || o.phone || "").replace(/\D/g, "");
      const oName = String(o.customerName || "").trim().toLowerCase();
      const phoneMatch = cleanP && oPhone && oPhone.endsWith(cleanP);
      const nameMatch = cleanName && cleanName.length >= 3 && oName === cleanName;
      if (phoneMatch || nameMatch) {
        addOrMergeOrder(o, true);
      }
    });
  }

  const finalOrders = Array.from(mergedMap.values());
  finalOrders.forEach(o => {
    const id = String(o.orderId || o.nota || "").trim();
    if (id) cachedMemberOrdersMap[id] = o;
  });
  return finalOrders;
}

function renderMemberOrderHistory(ordersList) {
  const container = document.getElementById("memberOrderHistoryContainer");
  const countBadge = document.getElementById("memberOrderHistoryCountBadge");
  if (!container) return;

  const memberPhone = currentMemberSession ? currentMemberSession.phone : "";
  const memberName = currentMemberSession ? currentMemberSession.name : "";
  const orders = mergeMemberOrdersSources(memberPhone, memberName, ordersList);

  if (countBadge) countBadge.textContent = `${orders.length} Belanja`;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <i class="bi bi-bag-heart text-2xl text-slate-300 dark:text-slate-600 mb-1 block"></i>
        <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Belum ada riwayat transaksi belanja</p>
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Belanja online atau sebutkan nomor WhatsApp Anda di kasir untuk kumpulkan stempel</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(o => {
    const statusStr = String(o.status || o.orderStatus || "Menunggu Verifikasi");
    const lowerStatus = statusStr.toLowerCase();
    const isCompleted = lowerStatus.includes("selesai") || lowerStatus.includes("lunas");
    const isReady = lowerStatus.includes("siap") || lowerStatus.includes("diantar") || lowerStatus.includes("dikirim");
    const isProcessing = lowerStatus.includes("diproses") || lowerStatus.includes("proses");
    const isCancelled = lowerStatus.includes("batal") || lowerStatus.includes("ditolak");

    let statusBadgeClass = "bg-amber-100 text-amber-800 border border-amber-300";
    let statusIcon = "bi-hourglass-split";
    let stepIndex = 1; // 1: Menunggu, 2: Sedang Diproses, 3: Siap Diambil/Diantar, 4: Selesai

    if (isCompleted) {
      statusBadgeClass = "bg-emerald-100 text-emerald-800 border border-emerald-300";
      statusIcon = "bi-check-circle-fill";
      stepIndex = 4;
    } else if (isReady) {
      statusBadgeClass = "bg-teal-100 text-teal-800 border border-teal-300";
      statusIcon = "bi-box-seam-fill";
      stepIndex = 3;
    } else if (isProcessing) {
      statusBadgeClass = "bg-blue-100 text-blue-800 border border-blue-300";
      statusIcon = "bi-gear-wide-connected";
      stepIndex = 2;
    } else if (isCancelled) {
      statusBadgeClass = "bg-red-100 text-red-800 border border-red-300";
      statusIcon = "bi-x-circle-fill";
      stepIndex = 0;
    }

    const rawTotal = o.total !== undefined ? o.total : (o.totalAkhir !== undefined ? o.totalAkhir : (o.totalNumeric || 0));
    const formattedTotal = typeof rawTotal === "number" ? formatRupiah(rawTotal) : (String(rawTotal).startsWith("Rp") ? rawTotal : formatRupiah(Number(String(rawTotal).replace(/\D/g, "")) || 0));

    let itemsText = o.itemsText || "";
    if (Array.isArray(o.items) && o.items.length > 0) {
      itemsText = o.items.map(i => `${i.qty || 1}x ${i.name}`).join(", ");
    } else if (itemsText) {
      itemsText = String(itemsText).split("\n").map(l => l.replace(/^\d+\.\s*/, "").trim()).filter(l => l && !l.startsWith("[🎁")).join(", ");
    } else {
      itemsText = "Belanjaan Produk Toko Delina";
    }

    const orderIdStr = String(o.orderId || o.nota || "#DLN-2026");
    const timeWib = formatWaktuWIB(o.orderTime || o.timestamp || "");

    const progressStepsHtml = stepIndex > 0 ? `
      <div class="grid grid-cols-4 gap-1 pt-1">
        <div class="h-1.5 rounded-full ${stepIndex >= 1 ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}" title="Menunggu Verifikasi"></div>
        <div class="h-1.5 rounded-full ${stepIndex >= 2 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}" title="Sedang Diproses"></div>
        <div class="h-1.5 rounded-full ${stepIndex >= 3 ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}" title="Siap Diambil / Diantar"></div>
        <div class="h-1.5 rounded-full ${stepIndex >= 4 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}" title="Selesai"></div>
      </div>
    ` : "";

    return `
      <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1.5 transition-all">
        <div class="flex items-center justify-between text-xs gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="font-mono font-black text-emerald-800 dark:text-emerald-400 truncate">${escapeHtml(orderIdStr)}</span>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 truncate">• ${escapeHtml(timeWib)}</span>
          </div>
          <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 ${statusBadgeClass}">
            <i class="bi ${statusIcon}"></i>
            <span>${escapeHtml(statusStr)}</span>
          </span>
        </div>
        ${progressStepsHtml}
        <div class="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
          <span class="font-bold text-slate-500">🛍️ Barang:</span> ${escapeHtml(itemsText)}
        </div>
        <div class="flex items-center justify-between pt-1 text-xs">
          <span class="font-black text-emerald-700 dark:text-emerald-400 font-mono text-sm">${escapeHtml(formattedTotal)}</span>
          <div class="flex items-center gap-1.5">
            <button 
              type="button" 
              onclick="viewMemberOrderReceipt('${escapeHtml(orderIdStr)}')" 
              class="py-1.5 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <i class="bi bi-receipt-cutoff"></i>
              <span>Lihat & Cetak Struk</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function viewMemberOrderReceipt(orderId) {
  if (!orderId) return;
  playCuteSound("pop");
  const foundOrder = cachedMemberOrdersMap[orderId];
  if (foundOrder) {
    openModernDigitalReceiptModal(foundOrder);
  } else {
    openLacakPesananModal(orderId);
  }
}

async function manualSyncMemberOrders() {
  playCuteSound("pop");
  if (!currentMemberSession || !currentMemberSession.phone) {
    showToast("Silakan login member terlebih dahulu.", "warning");
    return;
  }
  const icon = document.getElementById("syncMemberOrdersIcon");
  if (icon) icon.classList.add("animate-spin");
  showToast("Menyinkronkan status pesanan terbaru dengan Admin...", "info");
  await refreshMemberDataOnline(currentMemberSession.phone);
  if (icon) setTimeout(() => icon.classList.remove("animate-spin"), 500);
  showToast("✅ Status pesanan & profil sinkron dengan database Admin!");
}

async function refreshMemberDataOnline(phone) {
  if (!phone || typeof CONFIG === "undefined" || !CONFIG.GAS_API_URL) return;
  try {
    // Tarik data member dan daftar pesanan (&pin=1234) secara paralel agar Riwayat Transaksi Belanja & Profil Lintas Perangkat 100% sinkron
    const ts = Date.now();
    const [memberRes, ordersRes] = await Promise.allSettled([
      fetch(`${CONFIG.GAS_API_URL}?action=getMemberData&phone=${encodeURIComponent(phone)}&_t=${ts}`).then(r => r.json()),
      fetch(`${CONFIG.GAS_API_URL}?action=getOrders&pin=1234&_t=${ts}`).then(r => r.json())
    ]);

    let cloudSyncedProfile = null;
    const cleanP = String(phone || "").replace(/\D/g, "").slice(-9);

    if (ordersRes.status === "fulfilled" && ordersRes.value) {
      const oData = ordersRes.value;
      const allOrders = Array.isArray(oData) ? oData : (Array.isArray(oData.orders) ? oData.orders : (Array.isArray(oData.data) ? oData.data : []));
      if (allOrders.length > 0) {
        posOrders = allOrders;
        try {
          localStorage.setItem("delina_pos_orders_cache", JSON.stringify(allOrders));
        } catch (e) {}
      }
      // Cek apakah ada profil lintas perangkat di coupons (MPROF_<phone>)
      if (Array.isArray(oData.coupons) && cleanP) {
        const profCode = "MPROF_" + cleanP;
        const foundProfRow = oData.coupons.find(c => String(c.code || "").trim() === profCode);
        if (foundProfRow && foundProfRow.description) {
          try {
            cloudSyncedProfile = JSON.parse(foundProfRow.description);
          } catch (e) {}
        }
      }
    }

    if (memberRes.status === "fulfilled" && memberRes.value && memberRes.value.status === "success" && memberRes.value.member) {
      const json = memberRes.value;
      const localProf = getMemberProfileLocalMap(phone);

      if (currentMemberSession && currentMemberSession.password) {
        json.member.password = currentMemberSession.password;
      }
      if (!json.member.photoUrl) {
        json.member.photoUrl = (cloudSyncedProfile && cloudSyncedProfile.photoUrl) || (currentMemberSession && currentMemberSession.photoUrl) || localProf.photoUrl || "";
      }
      if (!json.member.address) {
        json.member.address = (cloudSyncedProfile && cloudSyncedProfile.address) || (currentMemberSession && currentMemberSession.address) || localProf.address || "";
      }
      if (!json.member.ktpUrl) {
        json.member.ktpUrl = (cloudSyncedProfile && cloudSyncedProfile.ktpUrl) || (currentMemberSession && currentMemberSession.ktpUrl) || localProf.ktpUrl || "";
      }

      saveMemberProfileLocalMap(phone, {
        photoUrl: json.member.photoUrl,
        ktpUrl: json.member.ktpUrl,
        address: json.member.address
      });

      currentMemberSession = json.member;
      localStorage.setItem("delina_member_session", JSON.stringify(json.member));
      renderMemberDashboardUI(json.member, json.claims || [], json.orders || []);
    } else if (currentMemberSession) {
      if (cloudSyncedProfile) {
        if (!currentMemberSession.photoUrl && cloudSyncedProfile.photoUrl) currentMemberSession.photoUrl = cloudSyncedProfile.photoUrl;
        if (!currentMemberSession.ktpUrl && cloudSyncedProfile.ktpUrl) currentMemberSession.ktpUrl = cloudSyncedProfile.ktpUrl;
        if (!currentMemberSession.address && cloudSyncedProfile.address) currentMemberSession.address = cloudSyncedProfile.address;
        saveMemberProfileLocalMap(phone, {
          photoUrl: currentMemberSession.photoUrl || "",
          ktpUrl: currentMemberSession.ktpUrl || "",
          address: currentMemberSession.address || ""
        });
        localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));
      }
      renderMemberDashboardUI(currentMemberSession, [], []);
    }
  } catch (e) {
    console.warn("Online member refresh notice:", e);
  }
}

// Dengarkan perubahan storage lintas tab (misal Admin mengubah status pesanan di tab sebelah)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!currentMemberSession) return;
    if (e.key === "delina_pos_orders_cache" || e.key === "delina_customer_orders_history" || e.key === "delina_last_order_status_update") {
      try {
        if (e.key === "delina_pos_orders_cache" && e.newValue) {
          posOrders = JSON.parse(e.newValue);
        }
      } catch (err) {}
      renderMemberOrderHistory(currentMemberSession.orders || []);
    }
  });
}

function renderMemberDashboardUI(member, claims, orders) {
  if (!member) return;

  const localProf = getMemberProfileLocalMap(member.phone);
  const effectivePhoto = member.photoUrl || localProf.photoUrl || "";
  const effectiveKtp = member.ktpUrl || localProf.ktpUrl || "";
  const effectiveAddress = member.address || localProf.address || "";

  const profNameEl = document.getElementById("memberProfileNameText");
  const profPhoneEl = document.getElementById("memberProfilePhoneText");
  const avatarImg = document.getElementById("memberAvatarImg");
  const avatarPlaceholder = document.getElementById("memberAvatarPlaceholder");

  if (profNameEl) profNameEl.textContent = member.name;
  if (profPhoneEl) profPhoneEl.textContent = member.phone;

  if (effectivePhoto) {
    if (avatarImg) {
      avatarImg.src = formatImageUrl(effectivePhoto);
      avatarImg.classList.remove("hidden");
      avatarImg.onerror = function() {
        avatarImg.classList.add("hidden");
        if (avatarPlaceholder) {
          avatarPlaceholder.textContent = getMemberInitials(member.name);
          avatarPlaceholder.classList.remove("hidden");
        }
      };
    }
    if (avatarPlaceholder) avatarPlaceholder.classList.add("hidden");
  } else {
    if (avatarImg) avatarImg.classList.add("hidden");
    if (avatarPlaceholder) {
      avatarPlaceholder.textContent = getMemberInitials(member.name);
      avatarPlaceholder.classList.remove("hidden");
    }
  }

  // Isi KTP & Alamat
  const ktpImg = document.getElementById("ktpPreviewImg");
  const ktpPlaceholder = document.getElementById("ktpPlaceholderText");
  const addrInput = document.getElementById("memberAddressInput");
  const ktpLabel = document.getElementById("ktpStatusLabelText");

  if (effectiveAddress && addrInput && !addrInput.value) {
    addrInput.value = effectiveAddress;
  }
  if (effectiveKtp) {
    if (ktpImg) {
      ktpImg.src = formatImageUrl(effectiveKtp);
      ktpImg.classList.remove("hidden");
    }
    if (ktpPlaceholder) ktpPlaceholder.classList.add("hidden");
    if (ktpLabel && !isKtpSectionOpen) ktpLabel.textContent = "✅ Tersimpan";
  } else {
    if (ktpImg) ktpImg.classList.add("hidden");
    if (ktpPlaceholder) ktpPlaceholder.classList.remove("hidden");
    if (ktpLabel && !isKtpSectionOpen) ktpLabel.textContent = effectiveAddress ? "✅ Tersimpan" : "Buka";
  }

  const dateEl = document.getElementById("memberRegisteredDateText");
  const progressBar = document.getElementById("stampsProgressBar");
  const unlockBtn = document.getElementById("btnClaimRewardUnlock");

  if (dateEl) dateEl.textContent = member.registeredAt ? formatWaktuWIB(member.registeredAt) : "-";

  const count = Number(member.belanjaCount) || 0;
  const stampText = document.getElementById("cardStampCounterText") || document.getElementById("stampCountText");
  if (stampText) stampText.textContent = `${count} / 30`;

  const percent = Math.min(100, Math.round((count / 30) * 100));
  if (progressBar) progressBar.style.width = `${percent}%`;

  // Render 30 Slot Stempel
  renderMemberStamps(count);

  // Tombol Buka Kunci Hadiah
  if (unlockBtn) {
    if (count >= 30) {
      unlockBtn.className = "w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer animate-pulse transition-all active:scale-95";
      unlockBtn.innerHTML = `<i class="bi bi-gift-fill text-slate-950 text-base"></i> <span>🎉 PILIH 1 HADIAH GRATIS SEKARANG! (${count}/30)</span>`;
      unlockBtn.disabled = false;
    } else {
      unlockBtn.className = "w-full py-2 px-3 rounded-xl bg-white/10 text-emerald-200/80 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed";
      unlockBtn.innerHTML = `<i class="bi bi-lock-fill"></i> <span>Terkunci (Butuh ${30 - count} stempel lagi untuk membuka hadiah)</span>`;
      unlockBtn.disabled = true;
    }
  }

  // Render Katalog 10 Hadiah
  renderMemberRewardsCatalog(memberRewardsList, count);

  // Render Riwayat Klaim (Waktu WIB + Tombol Barcode Klaim)
  renderMemberClaimsHistory(claims || []);

  // Render Riwayat Transaksi Belanja
  renderMemberOrderHistory(orders || member.orders || []);
}

function renderMemberStamps(count) {
  const container = document.getElementById("cardStampsGrid") || document.getElementById("memberStampsGrid");
  if (!container) return;

  let html = "";
  for (let i = 1; i <= 30; i++) {
    const isStamped = i <= count;
    const isTarget = i === 30;

    if (isStamped) {
      html += `
        <div class="aspect-square rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex flex-col items-center justify-center font-black text-[10px] shadow-sm transform hover:scale-105 transition-all" title="Stempel Ke-${i} Terkumpul">
          <i class="bi bi-check-circle-fill text-emerald-900 text-xs"></i>
          <span class="text-[8px] font-black">${i}</span>
        </div>
      `;
    } else if (isTarget) {
      html += `
        <div class="aspect-square rounded-xl border-2 border-dashed border-amber-400/80 bg-amber-400/20 text-amber-300 flex flex-col items-center justify-center font-black text-[9px] animate-pulse" title="Slot Hadiah Spesial">
          <i class="bi bi-gift-fill text-amber-300 text-sm"></i>
          <span class="text-[8px] font-bold">30</span>
        </div>
      `;
    } else {
      html += `
        <div class="aspect-square rounded-xl border border-white/15 bg-white/5 text-emerald-300/40 flex items-center justify-center font-mono text-[9px] font-semibold">
          ${i}
        </div>
      `;
    }
  }
  container.innerHTML = html;
}

function renderMemberRewardsCatalog(rewards, belanjaCount) {
  const container = document.getElementById("rewardsCardsGrid");
  if (!container) return;

  const defaultRewards = [
    { id: "HDH-01", name: "Tumbler Stainless Steel Delina Exclusive (500ml Tahan Panas/Dingin)", imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600", stock: 25, description: "Tumbler premium tahan panas dingin 12 jam." },
    { id: "HDH-02", name: "Minyak Goreng Premium 1 Liter (Bimoli / SunCo)", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600", stock: 40, description: "Minyak goreng kelapa sawit higienis jernih." },
    { id: "HDH-03", name: "Paket Skincare Glow & Bright Wardah / Garnier", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600", stock: 15, description: "Facial wash + serum pencerah kulit." },
    { id: "HDH-04", name: "Paket Alat Tulis Kantor Mewah (Joyko Executive Set)", imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600", stock: 30, description: "Set buku notes spiral, pulpen gel, dan sticky notes." },
    { id: "HDH-05", name: "Beras Super Pulen 2.5 kg", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600", stock: 20, description: "Beras putih wangi tanpa pemutih." },
    { id: "HDH-06", name: "Paket Snack & Minuman Segar Keluarga", imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600", stock: 50, description: "Aneka wafer, biskuit renyah, dan minuman teh botol." },
    { id: "HDH-07", name: "Tas Belanja Delina Premium (Eco Bag Canvas)", imageUrl: "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600", stock: 45, description: "Tas belanja kain kanvas tebal ramah lingkungan." },
    { id: "HDH-08", name: "Payung Lipat Delina Anti-UV Lipat Otomatis", imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600", stock: 20, description: "Payung lipat praktis tahan angin kencang." },
    { id: "HDH-09", name: "Lip Cream Matte Velvet Halal", imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600", stock: 25, description: "Lip cream lembut pigmen tinggi tidak membuat bibir kering." },
    { id: "HDH-10", name: "Voucher Belanja Delina.store Senilai Rp 35.000", imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600", stock: 100, description: "Voucher potongan langsung di Delina.store." }
  ];

  const list = rewards && rewards.length > 0 ? rewards : defaultRewards;
  const canClaim = (belanjaCount || 0) >= 30;

  let html = "";
  list.forEach(r => {
    const isOut = Number(r.stock) <= 0;
    html += `
      <div class="bg-white sm:bg-slate-50 rounded-2xl p-3 border border-slate-200 flex gap-3 items-center shadow-2xs">
        <img src="${formatImageUrl(r.imageUrl)}" alt="${r.name}" class="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500'" />
        <div class="flex-1 min-w-0">
          <h4 class="font-extrabold text-xs text-slate-900 truncate">${r.name}</h4>
          <p class="text-[10px] text-slate-500 line-clamp-1 mt-0.5">${r.description || 'Pilihan hadiah eksklusif 30x belanja.'}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="text-[10px] font-bold ${isOut ? 'text-red-500' : 'text-emerald-700'}">
              Stok: ${r.stock} unit
            </span>
            ${canClaim && !isOut ? `
              <button 
                type="button" 
                onclick="claimSelectedReward('${r.id}')"
                class="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Klaim Ini 🎁
              </button>
            ` : `
              <span class="text-[10px] text-slate-400 font-semibold">
                ${isOut ? 'Habis' : 'Butuh 30 Stempel'}
              </span>
            `}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderMemberClaimsHistory(claims) {
  const container = document.getElementById("memberClaimsListContainer");
  if (!container) return;

  if (!claims || claims.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">Belum ada riwayat penukaran hadiah.</p>`;
    return;
  }

  let html = "";
  claims.forEach(c => {
    const wibTime = formatWaktuWIB(c.time);
    const safeId = escapeHtml(c.claimId || "KLM-000");
    const safeName = escapeHtml(c.rewardName || "Hadiah Member");
    const safeTime = escapeHtml(wibTime);
    const safeStatus = escapeHtml(c.status || "Menunggu Diambil");

    html += `
      <div class="p-3 rounded-2xl bg-white sm:bg-slate-50 border border-slate-200 text-xs space-y-2 shadow-2xs">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <strong class="text-slate-900 font-extrabold block truncate">🎁 ${safeName}</strong>
            <span class="text-[10px] text-slate-500 font-mono block mt-0.5">Kode: <strong class="text-emerald-800">${safeId}</strong> • ${safeTime}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${c.status === 'Sudah Diserahkan' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${safeStatus}
          </span>
        </div>
        <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[10px] text-slate-400">Tunjukkan barcode ke kasir saat ambil hadiah</span>
          <button 
            type="button" 
            onclick="openRewardClaimBarcodeModal('${safeId}', '${safeName}', '${safeTime}', '${safeStatus}')" 
            class="py-1 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <i class="bi bi-upc-scan"></i>
            <span>Tunjuk Barcode</span>
          </button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function scrollToRewardsSection() {
  const section = document.getElementById("sectionRewardsCatalog");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function openRewardClaimModal(rewardId) {
  claimSelectedReward(rewardId);
}

async function claimSelectedReward(rewardId) {
  if (!currentMemberSession) {
    showToast("Silakan masuk ke akun member Anda terlebih dahulu.", "error");
    return;
  }

  playCuteSound("reminder");
  const ok = await showDelinaConfirm({
    title: "Tukarkan 30 Stempel?",
    subtitle: "Program Hadiah Royalty Delina",
    message: "Apakah Anda yakin ingin menukarkan 30 stempel belanja Anda dengan hadiah menarik ini?",
    details: `Nama Member: ${currentMemberSession.name || "-"}\nNo. WhatsApp: ${currentMemberSession.phone || "-"}\nStempel Belanja: ${currentMemberSession.belanjaCount || 30} Stempel`,
    confirmText: "Ya, Tukarkan Hadiah",
    cancelText: "Batal",
    type: "success",
    icon: "bi bi-gift-fill"
  });
  if (!ok) return;

  showToast("Memproses klaim hadiah Anda...", "info");
  try {
    const res = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "claimReward",
        phone: currentMemberSession.phone,
        password: currentMemberSession.password || "1234",
        idHadiah: rewardId
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      playCuteSound("fanfare");
      currentMemberSession.belanjaCount = json.newBelanjaCount;
      currentMemberSession.totalClaimed = json.totalClaimed;
      localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));

      refreshMemberDataOnline(currentMemberSession.phone);

      // Langsung tampilkan Voucher Barcode Klaim Hadiah agar bisa di-scan kasir toko!
      openRewardClaimBarcodeModal(
        json.claimId || "KLM-VIP",
        json.rewardName || "Hadiah 30 Stempel",
        formatWaktuWIB(new Date()),
        "Siap Diambil di Kasir"
      );
    } else {
      await showDelinaAlert({
        title: "Klaim Belum Berhasil",
        subtitle: "Program Hadiah Royalty Delina",
        message: json.message || "Stempel belum mencukupi atau terjadi kendala sistem.",
        buttonText: "Tutup",
        type: "warning",
        icon: "bi bi-exclamation-triangle-fill"
      });
    }
  } catch (err) {
    console.error("Claim error:", err);
    showToast("Gagal memproses klaim ke server.", "error");
  }
}

// =========================================================================
// EFEK SUARA ANIMASI LUCU & INTERAKTIF (WEB AUDIO SYNTHESIZER RINGAN)
// =========================================================================
let isCheckoutSoundEnabled = true;
let sharedAudioCtx = null;

function getSharedAudioContext() {
  if (!sharedAudioCtx && typeof window !== "undefined") {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function toggleCheckoutSoundEffect() {
  isCheckoutSoundEnabled = !isCheckoutSoundEnabled;
  const icon = document.getElementById("checkoutSoundIcon");
  const label = document.getElementById("checkoutSoundLabel");
  if (icon) {
    icon.className = isCheckoutSoundEnabled
      ? "bi bi-volume-up-fill text-xs text-amber-600"
      : "bi bi-volume-mute-fill text-xs text-slate-400";
  }
  if (label) {
    label.textContent = isCheckoutSoundEnabled ? "Suara ON" : "Suara OFF";
  }
  if (isCheckoutSoundEnabled) {
    playCuteSound("sparkle");
    showToast("🔊 Efek suara interaktif diaktifkan!");
  } else {
    showToast("🔇 Efek suara dimatikan.");
  }
}

function playCuteSound(type = "pop") {
  if (!isCheckoutSoundEnabled) return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    function playTone(freq, endFreq, startTime, duration, wave = "sine", gainVal = 0.14) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startTime);
      if (endFreq && endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
      }
      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    if (type === "pop") {
      // Bunyi "Pop / Blip" lucu saat tombol diklik
      playTone(520, 880, now, 0.08, "sine", 0.12);
    } else if (type === "reminder") {
      // Nada sapaan lucu "Ting-Tuing-Ting!" saat pop-up cek barang muncul
      playTone(587.33, 587.33, now, 0.11, "triangle", 0.15);        // D5
      playTone(783.99, 783.99, now + 0.1, 0.11, "triangle", 0.15);  // G5
      playTone(1046.5, 1174.66, now + 0.2, 0.22, "sine", 0.16);     // C6 -> D6
    } else if (type === "sparkle") {
      // Nada arpeggio ceria saat pilih bukti bayar / buka struk
      playTone(523.25, 523.25, now, 0.08, "sine", 0.12);            // C5
      playTone(659.25, 659.25, now + 0.07, 0.08, "sine", 0.12);     // E5
      playTone(783.99, 783.99, now + 0.14, 0.08, "sine", 0.12);     // G5
      playTone(1046.5, 1046.5, now + 0.21, 0.22, "triangle", 0.15); // C6
    } else if (type === "boing") {
      // Bunyi pegas lucu "Boing!" saat pilih Ubah Barang Dulu
      playTone(320, 680, now, 0.18, "sine", 0.15);
      playTone(680, 420, now + 0.16, 0.15, "sine", 0.12);
    } else if (type === "confirm") {
      // Bunyi dua nada sukses
      playTone(659.25, 659.25, now, 0.09, "triangle", 0.13);
      playTone(880, 880, now + 0.09, 0.18, "triangle", 0.15);
    } else if (type === "cancel") {
      // Bunyi lembut turun saat batal/tutup
      playTone(480, 290, now, 0.12, "sine", 0.1);
    } else if (type === "fanfare") {
      // Melodi kemenangan ceria saat pesanan terbit
      playTone(523.25, 523.25, now, 0.1, "triangle", 0.14);
      playTone(659.25, 659.25, now + 0.1, 0.1, "triangle", 0.14);
      playTone(783.99, 783.99, now + 0.2, 0.1, "triangle", 0.14);
      playTone(1046.5, 1046.5, now + 0.3, 0.3, "triangle", 0.18);
    }
  } catch (e) {}
}

// =========================================================================
// PERINGATAN CEK BARANG & TOTAL BAYAR SEBELUM UNGGAH BUKTI BAYAR (POIN 8)
// =========================================================================
let pendingUploadMode = "file"; // 'file' atau 'simulated'

function populateAndOpenVerifyCartModal(mode = "file") {
  pendingUploadMode = mode;
  playCuteSound("reminder");

  const modal = document.getElementById("modalVerifyCartBeforeUpload");
  const listEl = document.getElementById("verifyUploadItemsList");
  const countEl = document.getElementById("verifyUploadItemCount");
  const subEl = document.getElementById("verifyUploadSubtotalText");
  const discRow = document.getElementById("verifyUploadDiscountRow");
  const discEl = document.getElementById("verifyUploadDiscountText");
  const grandEl = document.getElementById("verifyUploadGrandTotalText");
  const btnProceed = document.getElementById("btnConfirmProceedUpload");

  if (!modal) {
    if (mode === "simulated") useSimulatedReceipt();
    else {
      const inp = document.getElementById("paymentProofInput");
      if (inp) inp.click();
    }
    return;
  }

  const totalItems = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const diskonGrosir = hitungDiskonGrosirKeranjang();
  let diskonKupon = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "fixed" || appliedCoupon.type === "NOMINAL") {
      diskonKupon = appliedCoupon.discount || appliedCoupon.value || 0;
    } else if (appliedCoupon.type === "percent" || appliedCoupon.type === "PERSEN") {
      const rate = appliedCoupon.rate || ((appliedCoupon.discount || appliedCoupon.value || 0) / 100);
      diskonKupon = Math.min(appliedCoupon.maxDiscount || 999999, Math.round(subtotal * rate));
    }
  }
  const totalDisc = diskonGrosir + diskonKupon;
  const grandTotal = Math.max(0, subtotal - totalDisc + deliveryFee);

  if (countEl) countEl.textContent = `${totalItems} Barang`;
  if (subEl) subEl.textContent = formatRupiah(subtotal + deliveryFee);
  if (discRow && discEl) {
    if (totalDisc > 0) {
      discRow.classList.remove("hidden");
      discEl.textContent = `-${formatRupiah(totalDisc)}`;
    } else {
      discRow.classList.add("hidden");
    }
  }
  if (grandEl) {
    grandEl.textContent = formatRupiah(grandTotal);
    grandEl.dataset.nominal = String(grandTotal);
  }

  if (btnProceed) {
    btnProceed.innerHTML = mode === "simulated"
      ? `<i class="bi bi-magic text-amber-300"></i><span>Sudah Yakin, Pakai Simulasi</span>`
      : `<i class="bi bi-camera-fill text-amber-300"></i><span>Sudah Yakin, Pilih Bukti</span>`;
  }

  if (listEl) {
    listEl.innerHTML = cart.map((item, idx) => {
      const thumbUrl = resolveCartItemImageUrl(item);
      return `
        <div class="flex items-center justify-between gap-2.5 py-2 border-b border-slate-200/70 dark:border-slate-700 last:border-none text-xs">
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <img
              src="${escapeHtml(thumbUrl)}"
              alt="${escapeHtml(item.name)}"
              class="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white"
              onerror="this.src='https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80'"
            />
            <div class="min-w-0 flex-1">
              <div class="font-extrabold text-slate-800 dark:text-slate-100 truncate leading-snug">${idx + 1}. ${escapeHtml(item.name)}</div>
              <div class="text-[10px] text-slate-500 font-semibold mt-0.5">${item.qty} x ${formatRupiah(item.price)}</div>
            </div>
          </div>
          <span class="font-mono font-black text-emerald-700 dark:text-emerald-400 flex-shrink-0">${formatRupiah(item.price * item.qty)}</span>
        </div>
      `;
    }).join("");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function onClickUploadPaymentProofTrigger(event) {
  if (event && event.preventDefault) event.preventDefault();
  populateAndOpenVerifyCartModal("file");
}

function onClickSimulatedReceiptWithReminder() {
  populateAndOpenVerifyCartModal("simulated");
}

function closeVerifyCartBeforeUploadModal(goToEditCart = false) {
  const modal = document.getElementById("modalVerifyCartBeforeUpload");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  if (goToEditCart) {
    closeCheckoutModal();
    toggleCartDrawer(true);
    showToast("Silakan sesuaikan kembali barang belanjaan Anda.", "info");
  }
}

function proceedToSelectPaymentProofFile() {
  closeVerifyCartBeforeUploadModal(false);
  if (pendingUploadMode === "simulated") {
    useSimulatedReceipt();
  } else {
    const input = document.getElementById("paymentProofInput");
    if (input) {
      input.value = "";
      input.click();
    }
  }
}

function copyVerifyUploadNominal() {
  const grandEl = document.getElementById("verifyUploadGrandTotalText");
  const nominal = (grandEl && grandEl.dataset.nominal) ? grandEl.dataset.nominal : "0";
  navigator.clipboard.writeText(nominal).then(() => {
    showToast(`Nominal Rp ${Number(nominal).toLocaleString("id-ID")} berhasil disalin!`);
  });
}

// =========================================================================
// HALAMAN / MODAL STRUK DIGITAL BARU (MODERN, ELEGAN & KEKINIAN)
// =========================================================================
let activeModernReceiptOrder = null;

function openModernDigitalReceiptModal(customOrder) {
  const order = customOrder || latestOrderData;
  if (!order) {
    showToast("Data nota belum tersedia.", "warning");
    return;
  }
  activeModernReceiptOrder = order;

  const modal = document.getElementById("modernDigitalReceiptModal");
  if (!modal) return;

  const orderId = order.orderId || order.nota || "#DLN-2026-0000";
  const timeWib = formatWaktuWIB(order.orderTime || order.timestamp || new Date());
  const custName = order.customerName || (currentMemberSession ? currentMemberSession.name : "Pelanggan Delina");
  const custPhone = order.customerPhone || order.phone || (currentMemberSession ? currentMemberSession.phone : "-");
  const delivery = order.deliveryMethod || "Ambil Sendiri di Toko Delina";
  const statusStr = order.status || order.orderStatus || "E-RECEIPT RESMI TERBIT";

  const elId = document.getElementById("modernReceiptOrderId");
  const elTime = document.getElementById("modernReceiptTimeWib");
  const elName = document.getElementById("modernReceiptCustName");
  const elPhone = document.getElementById("modernReceiptCustPhone");
  const elDeliv = document.getElementById("modernReceiptDelivery");
  const elStatus = document.getElementById("modernReceiptStatusBadge");
  const elItems = document.getElementById("modernReceiptItemsContainer");
  const elSub = document.getElementById("modernReceiptSubtotal");
  const elDiscRow = document.getElementById("modernReceiptDiscountRow");
  const elDisc = document.getElementById("modernReceiptDiscount");
  const elFee = document.getElementById("modernReceiptDeliveryFee");
  const elGrand = document.getElementById("modernReceiptGrandTotal");
  const elQr = document.getElementById("modernReceiptQrImg");
  const elCap = document.getElementById("modernReceiptBarcodeCaption");

  if (elId) elId.textContent = orderId;
  if (elTime) elTime.textContent = timeWib;
  if (elName) elName.textContent = custName;
  if (elPhone) elPhone.textContent = custPhone;
  if (elDeliv) elDeliv.textContent = delivery;
  if (elStatus) elStatus.textContent = String(statusStr).toUpperCase();

  let itemsHtml = "";
  let calculatedSub = 0;

  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsHtml = order.items.map(item => {
      const qty = Number(item.qty) || 1;
      const price = Number(item.price) || 0;
      const lineSub = qty * price;
      calculatedSub += lineSub;
      return `
        <div class="py-1.5 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="font-bold text-slate-900 leading-snug">${escapeHtml(item.name)}</div>
            <div class="text-[10px] text-slate-500 font-mono">${qty} x ${formatRupiah(price)}</div>
          </div>
          <span class="font-mono font-bold text-slate-800 flex-shrink-0">${formatRupiah(lineSub)}</span>
        </div>
      `;
    }).join("");
  } else if (order.itemsText) {
    const lines = String(order.itemsText).split("\n").filter(Boolean);
    itemsHtml = lines.map(l => `
      <div class="py-1 text-slate-800 font-medium">${escapeHtml(l)}</div>
    `).join("");
  } else {
    itemsHtml = `<div class="py-1 text-slate-600">Transaksi Belanja Toko Delina</div>`;
  }

  if (elItems) elItems.innerHTML = itemsHtml;

  const rawTotal = order.totalAkhir || order.total || calculatedSub;
  const formattedTotal = typeof rawTotal === "number" ? formatRupiah(rawTotal) : (String(rawTotal).startsWith("Rp") ? rawTotal : formatRupiah(Number(String(rawTotal).replace(/\D/g, "")) || calculatedSub));

  if (elSub) elSub.textContent = calculatedSub > 0 ? formatRupiah(calculatedSub) : formattedTotal;
  if (elDiscRow && elDisc) {
    const disc = Number(order.discountAmount) || 0;
    if (disc > 0) {
      elDiscRow.classList.remove("hidden");
      elDisc.textContent = `-${formatRupiah(disc)}`;
    } else {
      elDiscRow.classList.add("hidden");
    }
  }
  if (elFee) {
    const fee = Number(order.deliveryFee) || (String(delivery).toLowerCase().includes("kurir") ? 5000 : 0);
    elFee.textContent = fee > 0 ? formatRupiah(fee) : "Rp 0 (Gratis)";
  }
  if (elGrand) elGrand.textContent = formattedTotal;

  if (elQr) {
    elQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderId)}`;
  }
  if (elCap) elCap.textContent = orderId;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (typeof pushModalState === "function") pushModalState("modernDigitalReceiptModal");
}

function closeModernDigitalReceiptModal() {
  const modal = document.getElementById("modernDigitalReceiptModal");
  if (modal) {
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
  }
}

function executePrintModernDigitalReceipt() {
  const order = activeModernReceiptOrder || latestOrderData;
  if (!order) return;

  const orderId = order.orderId || order.nota || "#DLN-2026";
  const timeWib = formatWaktuWIB(order.orderTime || order.timestamp || new Date());
  const custName = order.customerName || "Pelanggan Delina";
  const custPhone = order.customerPhone || order.phone || "-";
  const delivery = order.deliveryMethod || "Ambil di Toko";
  const rawTotal = order.totalAkhir || order.total || 0;
  const formattedTotal = typeof rawTotal === "number" ? formatRupiah(rawTotal) : rawTotal;

  let itemsRowsHtml = "";
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsRowsHtml = order.items.map(i => `
      <tr>
        <td style="padding:6px 0; border-bottom:1px dashed #e2e8f0;">
          <strong>${escapeHtml(i.name)}</strong><br/>
          <small style="color:#64748b;">${i.qty} x ${formatRupiah(i.price || 0)}</small>
        </td>
        <td style="padding:6px 0; border-bottom:1px dashed #e2e8f0; text-align:right; font-weight:bold; font-family:monospace;">
          ${formatRupiah((i.qty || 1) * (i.price || 0))}
        </td>
      </tr>
    `).join("");
  } else {
    itemsRowsHtml = `<tr><td colspan="2" style="padding:8px 0;">${escapeHtml(order.itemsText || "Belanjaan Produk Delina.store")}</td></tr>`;
  }

  const printWin = window.open("", "_blank", "width=420,height=720");
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Struk Digital ${escapeHtml(orderId)} - Delina.store</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; margin: 0; padding: 16px; color: #0f172a; }
        .receipt-card { max-width: 360px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #cbd5e1; }
        .brand-logo { width: 44px; height: 44px; border-radius: 12px; background: #064e3b; color: #fbbf24; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; margin: 0 auto 8px; }
        .text-center { text-align: center; }
        .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 99px; margin-top: 6px; }
        .meta { font-size: 12px; margin: 14px 0; padding: 10px 0; border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; }
        .meta-row { display: flex; justify-content: space-between; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .total-box { margin-top: 12px; padding: 12px; background: #ecfdf5; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; font-weight: 900; color: #065f46; }
        @media print { body { background: #fff; padding: 0; } .receipt-card { box-shadow: none; border: none; max-width: 100%; } }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="text-center">
          <div class="brand-logo">D</div>
          <h2 style="margin:0; font-size:18px;">DELINA.store</h2>
          <div style="font-size:11px; color:#64748b;">ATK, Kosmetik & Kelontongan</div>
          <div style="font-size:10px; color:#94a3b8;">WA Resmi: 0821-8535-5316</div>
          <div class="badge">✓ E-RECEIPT RESMI TERVERIFIKASI</div>
        </div>
        <div class="meta">
          <div class="meta-row"><span>No. Nota:</span><strong>${escapeHtml(orderId)}</strong></div>
          <div class="meta-row"><span>Waktu (WIB):</span><span>${escapeHtml(timeWib)}</span></div>
          <div class="meta-row"><span>Pelanggan:</span><strong>${escapeHtml(custName)}</strong></div>
          <div class="meta-row"><span>No. WhatsApp:</span><span>${escapeHtml(custPhone)}</span></div>
          <div class="meta-row"><span>Pengiriman:</span><span>${escapeHtml(delivery)}</span></div>
        </div>
        <table>${itemsRowsHtml}</table>
        <div class="total-box">
          <span>TOTAL BAYAR</span>
          <span style="font-size:16px; font-family:monospace;">${escapeHtml(String(formattedTotal))}</span>
        </div>
        <div class="text-center" style="margin-top:16px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(orderId)}" style="width:110px;height:110px;" />
          <div style="font-size:10px; color:#64748b; margin-top:6px;">Terima kasih telah berbelanja di Toko Delina!</div>
        </div>
      </div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 350); };
      <\/script>
    </body>
    </html>
  `);
  printWin.document.close();
}

// Inisialisasi sesi member saat awal load halaman
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initMemberSessionFromStorage();
  });
}

// Ekspos fungsi interaktif secara eksplisit ke window agar dapat dipanggil dari atribut onclick
if (typeof window !== "undefined") {
  window.openPosModal = openPosModal;
  window.closePosModal = closePosModal;
  window.showPosPinScreen = showPosPinScreen;
  window.showPosDashboard = showPosDashboard;
  window.lockPosSession = lockPosSession;
  window.handlePosPinSubmit = handlePosPinSubmit;
  window.loadPosOrders = loadPosOrders;
  window.setPosFilter = setPosFilter;
  window.handlePosSearch = handlePosSearch;
  window.renderPosOrders = renderPosOrders;
  window.changeOrderStatus = changeOrderStatus;
  window.updateOrderStatusKasir = changeOrderStatus;
  window.sendCustomerWhatsAppNotification = sendCustomerWhatsAppNotification;
  window.openThermalReceiptModal = openThermalReceiptModal;
  window.closeThermalReceiptModal = closeThermalReceiptModal;
  window.executeThermalPrint = executeThermalPrint;
  window.applyCouponCode = applyCouponCode;
  window.removeCouponCode = removeCouponCode;
  window.toggleCartDrawer = toggleCartDrawer;
  window.goToCheckout = goToCheckout;
  window.openCheckoutModal = openCheckoutModal;
  window.closeCheckoutModal = closeCheckoutModal;
  window.submitOrderCheckout = submitOrderCheckout;
  window.openKikoChat = openKikoChat;
  window.closeKikoChat = closeKikoChat;
  window.toggleKikoChat = toggleKikoChat;
  window.sendQuickKikoQuestion = sendQuickKikoQuestion;
window.sendKikoMessage = sendKikoMessage;
window.clearKikoChat = clearKikoChat;
window.startKikoVoiceInput = startKikoVoiceInput;
window.kikoRunAction = kikoRunAction;
window.updateKikoMiniCartBar = updateKikoMiniCartBar;
window.kikoSetCategoryQuickChips = kikoSetCategoryQuickChips;
  window.addToCart = addToCart;
  window.updateCartQty = updateCartQty;
  window.calculateFotokopi = calculateFotokopi;
  window.addFotokopiToCart = addFotokopiToCart;
  window.clearFotokopiFile = clearFotokopiFile;
  window.selectCategory = selectCategory;
  window.quickViewProduct = quickViewProduct;
  window.handleDeliveryChange = handleDeliveryChange;
  window.clearPaymentProof = clearPaymentProof;
  window.copyRekening = copyRekening;
  window.copyToClipboard = copyToClipboard;
  window.openSuccessModal = openSuccessModal;
  window.closeSuccessModal = closeSuccessModal;
  window.copyOrderId = copyOrderId;
  window.sendConfirmationWhatsApp = sendConfirmationWhatsApp;
  window.handleBottomNav = handleBottomNav;
  window.showToast = showToast;
  window.openQrisInfoModal = openQrisInfoModal;
  window.closeQrisInfoModal = closeQrisInfoModal;
  window.copyModalRekening = copyModalRekening;
  window.initChidoriTooltip = initChidoriTooltip;
  window.openProductDetailModal = openProductDetailModal;
  window.closeProductDetailModal = closeProductDetailModal;
  window.changeDetailQty = changeDetailQty;
  window.handleDetailQtyChange = handleDetailQtyChange;
  window.updateDetailSubtotal = updateDetailSubtotal;
  window.detailAddToCart = detailAddToCart;
  window.detailBuyNow = detailBuyNow;
  window.useSimulatedReceipt = useSimulatedReceipt;
  window.openLacakPesananModal = openLacakPesananModal;
  window.closeLacakPesananModal = closeLacakPesananModal;
  window.executeLacakPesanan = executeLacakPesanan;

  // Global Member & Royalty Handlers
  window.openMemberModal = openMemberModal;
  window.closeMemberModal = closeMemberModal;
  window.switchMemberAuthTab = switchMemberAuthTab;
  window.switchMemberAuthMode = switchMemberAuthMode;
  window.handleMemberAuthSubmit = handleMemberAuthSubmit;
  window.handleMemberLogin = handleMemberLogin;
  window.handleMemberRegister = handleMemberRegister;
  window.handleMemberLogout = handleMemberLogout;
  window.scrollToRewardsSection = scrollToRewardsSection;
  window.openRewardClaimModal = openRewardClaimModal;
  window.claimSelectedReward = claimSelectedReward;
  window.formatImageUrl = formatImageUrl;

  // New Profile, KTP, Barcode Klaim, Sound & Modern Receipt Handlers
  window.triggerProfilePhotoUpload = triggerProfilePhotoUpload;
  window.handleProfilePhotoSelected = handleProfilePhotoSelected;
  window.toggleKtpVerificationSection = toggleKtpVerificationSection;
  window.triggerKtpPhotoUpload = triggerKtpPhotoUpload;
  window.handleKtpPhotoSelected = handleKtpPhotoSelected;
  window.saveMemberKtpAndAddress = saveMemberKtpAndAddress;
  window.openMemberBarcodeModal = openMemberBarcodeModal;
  window.closeMemberBarcodeModal = closeMemberBarcodeModal;
  window.openRewardClaimBarcodeModal = openRewardClaimBarcodeModal;
  window.closeRewardClaimBarcodeModal = closeRewardClaimBarcodeModal;
  window.viewMemberOrderReceipt = viewMemberOrderReceipt;
  window.formatWaktuWIB = formatWaktuWIB;
  window.playCuteSound = playCuteSound;
  window.toggleCheckoutSoundEffect = toggleCheckoutSoundEffect;
  window.onClickUploadPaymentProofTrigger = onClickUploadPaymentProofTrigger;
  window.onClickSimulatedReceiptWithReminder = onClickSimulatedReceiptWithReminder;
  window.closeVerifyCartBeforeUploadModal = closeVerifyCartBeforeUploadModal;
  window.proceedToSelectPaymentProofFile = proceedToSelectPaymentProofFile;
  window.copyVerifyUploadNominal = copyVerifyUploadNominal;
  window.openModernDigitalReceiptModal = openModernDigitalReceiptModal;
  window.closeModernDigitalReceiptModal = closeModernDigitalReceiptModal;
  window.executePrintModernDigitalReceipt = executePrintModernDigitalReceipt;
  window.openWhatsAppWithAppChoice = openWhatsAppWithAppChoice;
  window.selectDeliveryTimeSlot = selectDeliveryTimeSlot;
  window.toggleStickyCheckoutSummaryBody = toggleStickyCheckoutSummaryBody;
  window.manualSyncMemberOrders = manualSyncMemberOrders;
  window.openKtpWhatsappConfirmModal = openKtpWhatsappConfirmModal;
  window.closeKtpWhatsappConfirmModal = closeKtpWhatsappConfirmModal;
  window.sendKtpVerificationToAdminWhatsApp = sendKtpVerificationToAdminWhatsApp;

  // Hero Carousel Handlers
  window.initHeroCarousel = initHeroCarousel;
  window.goToHeroSlide = goToHeroSlide;
  window.nextHeroSlide = nextHeroSlide;
  window.prevHeroSlide = prevHeroSlide;
  window.handleSlideBelanja = handleSlideBelanja;
  window.handleSlideAtk = handleSlideAtk;

  // Dynamic Header Alfagift & Promo Modal Handlers
  window.initAlfagiftHeaderScroll = initAlfagiftHeaderScroll;
  window.openPromoInfoModal = openPromoInfoModal;
  window.closePromoInfoModal = closePromoInfoModal;
  window.copyPromoCouponCode = copyPromoCouponCode;

  // PWA Customer Handlers
  window.triggerCustomerPwaInstall = triggerCustomerPwaInstall;
  window.updatePwaButtons = updatePwaButtons;
}

// =========================================================
// PWA INSTALL PROMPT & INSTALLATION LOGIC (CUSTOMER & MEMBER)
// =========================================================
let customerDeferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  customerDeferredPrompt = e;
  updatePwaButtons(true, false);
});

window.addEventListener("appinstalled", () => {
  customerDeferredPrompt = null;
  updatePwaButtons(false, true);
  if (typeof showToast === "function") {
    showToast("🎉 Alhamdulillah! Aplikasi Delina.store berhasil dipasang di layar HP Anda.");
  }
});

function updatePwaButtons(canInstall, isInstalled) {
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true || isInstalled;
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  const buttons = document.querySelectorAll(".btn-install-pwa-trigger");
  const iosGuides = document.querySelectorAll(".ios-pwa-guide");

  buttons.forEach(btn => {
    if (isStandalone) {
      btn.innerHTML = `<i class="bi bi-check2-circle text-emerald-300"></i><span>Aplikasi Sudah Terpasang</span>`;
      btn.disabled = true;
      btn.classList.remove("bg-gradient-to-r", "from-amber-400", "via-amber-500", "to-yellow-500", "text-slate-950");
      btn.classList.add("bg-emerald-800/80", "text-white", "cursor-default", "border", "border-emerald-600");
    } else if (isIos) {
      btn.innerHTML = `<i class="bi bi-box-arrow-up text-amber-300"></i><span>Cara Pasang di iPhone</span>`;
    }
  });

  iosGuides.forEach(g => {
    if (isIos && !isStandalone) {
      g.classList.remove("hidden");
    } else {
      g.classList.add("hidden");
    }
  });
}

function triggerCustomerPwaInstall() {
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  if (isStandalone) {
    if (typeof showToast === "function") showToast("Aplikasi Delina.store sudah terpasang dan aktif di layar utama Anda.");
    return;
  }

  if (isIos) {
    const iosGuides = document.querySelectorAll(".ios-pwa-guide");
    iosGuides.forEach(g => g.classList.remove("hidden"));
    showDelinaAlert({
      title: "Pasang di iPhone / iPad",
      subtitle: "Panduan Cepat iOS Safari",
      message: "Ikuti 3 langkah mudah berikut untuk menambahkan aplikasi Delina ke Layar Utama Anda:",
      details: "1. Ketuk ikon Bagikan (Share ⎋) di bilah bawah Safari.\n2. Gulir ke bawah lalu pilih 'Tambahkan ke Layar Utama' (Add to Home Screen ⊞).\n3. Ketuk 'Tambah' di pojok kanan atas.\n\nSelesai! Ikon Delina.store akan langsung muncul di layar HP Anda.",
      buttonText: "OK, Saya Mengerti",
      type: "info",
      icon: "bi bi-apple"
    });
    return;
  }

  if (customerDeferredPrompt) {
    customerDeferredPrompt.prompt();
    customerDeferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("Pelanggan menyetujui instalasi PWA Delina.store");
      }
      customerDeferredPrompt = null;
    });
  } else {
    showDelinaAlert({
      title: "Pasang Aplikasi Delina",
      subtitle: "Petunjuk Instalasi Layar Utama",
      message: "Browser Anda mendukung pemasangan aplikasi langsung ke layar utama:",
      details: "1. Ketuk menu titik tiga (⋮) di pojok kanan atas browser Anda.\n2. Pilih 'Pasang Aplikasi' atau 'Tambahkan ke Layar Utama'.\n3. Konfirmasi pemasangan.\n\nAplikasi Delina.store akan langsung hadir seperti aplikasi ponsel biasa!",
      buttonText: "Siap, Laksanakan",
      type: "info",
      icon: "bi bi-phone"
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updatePwaButtons(false, false);
});

// =========================================================================
// PWA NAVIGATION & ANTI-KELUAR MODAL HISTORY (POPSTATE HANDLER)
// =========================================================================
let isHandlingPopstate = false;
let modalHistoryCount = 0;

function pushModalState(modalId) {
  modalHistoryCount++;
  try {
    history.pushState({ modalOpen: true, modalId: modalId, count: modalHistoryCount }, "");
  } catch (err) {
    console.warn("pushModalState error:", err);
  }
}

function notifyModalClosed() {
  if (isHandlingPopstate) {
    if (modalHistoryCount > 0) modalHistoryCount--;
    return;
  }
  if (modalHistoryCount > 0) {
    modalHistoryCount--;
    if (history.state && history.state.modalOpen) {
      try {
        history.back();
      } catch (err) {}
    }
  }
}

function isAnyModalOpen() {
  const drawer = document.getElementById("cartDrawer");
  if (drawer && !drawer.classList.contains("translate-x-full")) return true;

  const modalIds = [
    "modalKtpWhatsappConfirm",
    "modalVerifyCartBeforeUpload",
    "modernDigitalReceiptModal",
    "rewardClaimBarcodeModal",
    "productDetailModal",
    "memberModal",
    "memberBarcodeModal",
    "modalPromoInfo",
    "lacakPesananModal",
    "checkoutModal",
    "orderSuccessModal",
    "kikoChatModal",
    "qrisInfoModal",
    "modalThemeToggle"
  ];
  for (const id of modalIds) {
    const el = document.getElementById(id);
    if (el && !el.classList.contains("hidden")) return true;
  }
  return false;
}

function closeAllModals(isFromPopState = false) {
  let closedAny = false;

  // Tutup modal lapis atas (sub-modal) terlebih dahulu jika terbuka
  const ktpWaConfirm = document.getElementById("modalKtpWhatsappConfirm");
  if (ktpWaConfirm && !ktpWaConfirm.classList.contains("hidden")) {
    closeKtpWhatsappConfirmModal();
    return true;
  }

  const verifyCart = document.getElementById("modalVerifyCartBeforeUpload");
  if (verifyCart && !verifyCart.classList.contains("hidden")) {
    closeVerifyCartBeforeUploadModal(false);
    return true;
  }

  const modernReceipt = document.getElementById("modernDigitalReceiptModal");
  if (modernReceipt && !modernReceipt.classList.contains("hidden")) {
    closeModernDigitalReceiptModal();
    return true;
  }

  const claimBarcode = document.getElementById("rewardClaimBarcodeModal");
  if (claimBarcode && !claimBarcode.classList.contains("hidden")) {
    closeRewardClaimBarcodeModal();
    return true;
  }

  const barcode = document.getElementById("memberBarcodeModal");
  if (barcode && !barcode.classList.contains("hidden")) {
    closeMemberBarcodeModal();
    return true;
  }

  // 1. Cart Drawer
  const drawer = document.getElementById("cartDrawer");
  if (drawer && !drawer.classList.contains("translate-x-full")) {
    toggleCartDrawer(false);
    closedAny = true;
  }

  // 2. Checkout Modal
  const checkout = document.getElementById("checkoutModal");
  if (checkout && !checkout.classList.contains("hidden")) {
    closeCheckoutModal();
    closedAny = true;
  }

  // 3. Order Success Modal
  const success = document.getElementById("orderSuccessModal");
  if (success && !success.classList.contains("hidden")) {
    closeSuccessModal();
    closedAny = true;
  }

  // 4. Product Detail Modal
  const prodDetail = document.getElementById("productDetailModal");
  if (prodDetail && !prodDetail.classList.contains("hidden")) {
    closeProductDetailModal();
    closedAny = true;
  }

  // 5. Member Modal
  const member = document.getElementById("memberModal");
  if (member && !member.classList.contains("hidden")) {
    closeMemberModal();
    closedAny = true;
  }

  // 6. Promo Info Modal
  const promo = document.getElementById("modalPromoInfo");
  if (promo && !promo.classList.contains("hidden")) {
    closePromoInfoModal();
    closedAny = true;
  }

  // 7. Lacak Pesanan Modal
  const lacak = document.getElementById("lacakPesananModal");
  if (lacak && !lacak.classList.contains("hidden")) {
    closeLacakPesananModal();
    closedAny = true;
  }

  // 8. QRIS Modal
  const qris = document.getElementById("qrisInfoModal");
  if (qris && !qris.classList.contains("hidden")) {
    closeQrisInfoModal();
    closedAny = true;
  }

  // 9. Kiko Chat Modal
  const kiko = document.getElementById("kikoChatModal");
  if (kiko && !kiko.classList.contains("hidden")) {
    closeKikoChat();
    closedAny = true;
  }

  // 10. Modal Theme Toggle
  const theme = document.getElementById("modalThemeToggle");
  if (theme && !theme.classList.contains("hidden")) {
    closeThemeModal();
    closedAny = true;
  }

  return closedAny;
}

window.addEventListener("popstate", (e) => {
  isHandlingPopstate = true;
  try {
    // 1. Jika ada modal / drawer terbuka, tutup modal tersebut terlebih dahulu dan tahan agar PWA tidak keluar
    const wasClosed = closeAllModals(true);
    if (wasClosed) {
      if (e && e.preventDefault) e.preventDefault();
      return;
    }

    // 2. Jika tidak ada modal terbuka dan sedang di tab selain Beranda, kembalikan ke Beranda
    if (activeBottomNav && activeBottomNav !== "home") {
      handleBottomNav("home");
      if (e && e.preventDefault) e.preventDefault();
      return;
    }

    // 3. Hanya jika sudah di tab Beranda tanpa modal terbuka, biarkan back default browser
  } finally {
    setTimeout(() => { isHandlingPopstate = false; }, 60);
  }
});

// =========================================================================
// AUTO-CLOSE KEYBOARD & MOBILE INPUT STABILITY (ANTI-MENTAL PADA PONSEL)
// =========================================================================
function initAutoCloseKeyboard() {
  let touchStartY = 0;
  let touchStartX = 0;
  let isTouching = false;
  let touchTarget = null;

  window.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      isTouching = true;
      touchTarget = e.target;
    }
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!isTouching || !e.touches || e.touches.length === 0) return;
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      // JANGAN pernah blur jika sentuhan terjadi di dalam modal atau kontrol formulir aktif
      if (touchTarget && (touchTarget.closest("#kikoChatModal") || touchTarget.closest("#checkoutModal") || touchTarget.closest("#memberModal") || touchTarget.closest(".modal-card") || touchTarget.tagName === "INPUT" || touchTarget.tagName === "TEXTAREA")) {
        return;
      }
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
      if (deltaY > 50 && deltaY > deltaX * 2) {
        active.blur();
      }
    }
  }, { passive: true });

  window.addEventListener("touchend", () => {
    isTouching = false;
    touchTarget = null;
  }, { passive: true });

  // Auto-center input saat fokus di ponsel agar tidak tertutup keyboard
  document.addEventListener("focusin", (e) => {
    if (e.target && (e.target.id === "kikoChatInput" || e.target.id === "custAddress" || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
      const modalParent = e.target.closest("#kikoChatModal, #checkoutModal, #memberModal");
      if (modalParent) {
        setTimeout(() => {
          try {
            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (err) {}
        }, 320);
      }
    }
  });
}

// Inisialisasi auto-close keyboard
initAutoCloseKeyboard();

// Export fungsi ke window agar dapat dipanggil global
window.pushModalState = pushModalState;
window.notifyModalClosed = notifyModalClosed;
window.closeAllModals = closeAllModals;
window.isAnyModalOpen = isAnyModalOpen;

// =========================================================================
// 21. SAKLAR TEMA MODERN (TERANG / GELAP) - PALET HIJAU EMERALD DELINA
// =========================================================================
let currentTheme = "light";
try {
  const saved = localStorage.getItem("delina_theme");
  if (saved === "dark" || saved === "light") {
    currentTheme = saved;
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    currentTheme = "dark";
  }
} catch (e) {}

function applyDelinaTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  try {
    localStorage.setItem("delina_theme", currentTheme);
  } catch (e) {}

  const html = document.documentElement;

  // 1. Elemen Saklar In-Page (#sectionThemeSwitcher)
  const pageKnob = document.getElementById("pageThemeSwitchKnob");
  const pageKnobIcon = document.getElementById("pageThemeKnobIcon");

  // 2. Elemen Saklar Modal (#modalThemeToggle) jika ada
  const knob = document.getElementById("themeSwitchKnob");
  const indicator = document.getElementById("themeKnobIndicator");

  if (currentTheme === "dark") {
    html.classList.add("dark");

    // In-Page Switch Knob: Posisi BAWAH (translateY(48px)), hijau zamrud menyala + bulan sabit mini putih
    if (pageKnob) {
      pageKnob.style.transform = "translateY(48px)";
      pageKnob.className = "w-[52px] h-[52px] rounded-full shadow-lg shadow-emerald-500/50 transition-all duration-300 transform flex items-center justify-center absolute top-1.5 left-1.5 bg-emerald-500 border border-emerald-400 text-white";
    }
    if (pageKnobIcon) {
      pageKnobIcon.innerHTML = `<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" /></svg>`;
    }

    // Modal Knob
    if (knob) {
      knob.style.transform = "translateY(56px)";
      knob.className = "w-[68px] h-[68px] rounded-[22px] bg-emerald-500 shadow-md shadow-emerald-500/40 text-white border border-emerald-400 flex items-center justify-center transition-all duration-300 ease-in-out absolute top-[6px] left-[6px]";
    }
    if (indicator) {
      indicator.className = "w-8 h-1 rounded-full bg-emerald-200/90 transition-colors";
    }
  } else {
    html.classList.remove("dark");

    // In-Page Switch Knob: Posisi ATAS (translateY(0px)), gradasi putih perak halus + matahari mini redup
    if (pageKnob) {
      pageKnob.style.transform = "translateY(0px)";
      pageKnob.className = "w-[52px] h-[52px] rounded-full shadow-md transition-all duration-300 transform flex items-center justify-center absolute top-1.5 left-1.5 bg-gradient-to-b from-white to-[#e4e7eb] border border-white/90 text-amber-500";
    }
    if (pageKnobIcon) {
      pageKnobIcon.innerHTML = `<svg class="w-5 h-5 text-amber-500/70" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/></svg>`;
    }

    // Modal Knob
    if (knob) {
      knob.style.transform = "translateY(0px)";
      knob.className = "w-[68px] h-[68px] rounded-[22px] bg-gradient-to-b from-white to-[#e4e7eb] shadow-md border border-white/90 flex items-center justify-center text-gray-600 transition-all duration-300 ease-in-out absolute top-[6px] left-[6px]";
    }
    if (indicator) {
      indicator.className = "w-8 h-1 rounded-full bg-gray-300 transition-colors";
    }
  }
}

function toggleDelinaTheme() {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.classList.add("delina-theme-transition");
  applyDelinaTheme(nextTheme);
  setTimeout(() => {
    document.documentElement.classList.remove("delina-theme-transition");
  }, 350);
  if (typeof showToast === "function") {
    showToast(nextTheme === "dark" ? "🌙 Beralih ke Mode Gelap" : "☀️ Beralih ke Mode Terang");
  }
}

function openThemeModal() {
  const modal = document.getElementById("modalThemeToggle");
  if (!modal) return;
  applyDelinaTheme(currentTheme);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (typeof pushModalState === "function") pushModalState("modalThemeToggle");
}

function closeThemeModal() {
  const modal = document.getElementById("modalThemeToggle");
  if (!modal) return;
  const wasOpen = !modal.classList.contains("hidden");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  if (activeBottomNav === "account") {
    setActiveBottomNav("home");
  }
  if (wasOpen && typeof notifyModalClosed === "function") notifyModalClosed();
}

// Inisialisasi tema saat berkas dimuat
document.addEventListener("DOMContentLoaded", () => {
  applyDelinaTheme(currentTheme);
});
if (document.readyState === "complete" || document.readyState === "interactive") {
  applyDelinaTheme(currentTheme);
}

// Pantau perubahan preferensi tema OS pengguna jika belum set manual
if (window.matchMedia) {
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      try {
        if (!localStorage.getItem("delina_theme")) {
          applyDelinaTheme(e.matches ? "dark" : "light");
        }
      } catch (err) {}
    });
  } catch (err) {}
}

// Export fungsi tema & navigasi ke window
window.applyDelinaTheme = applyDelinaTheme;
window.toggleDelinaTheme = toggleDelinaTheme;
window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.openCart = function() {
  if (typeof toggleCartDrawer === "function") {
    toggleCartDrawer(true);
  }
};
window.setActiveBottomNav = setActiveBottomNav;
window.handleBottomNav = handleBottomNav;

// =========================================================================
// 16. WELCOME SPLASH SCREEN ANIMASI MOTOR KURIR & POP-UP PROMO CAROUSEL ALA ALFAGIFT
// =========================================================================

const DEFAULT_POPUP_PROMOS = [
  {
    id: "promo_atk",
    badge: "HEMAT S.D 15%",
    badgeColor: "bg-rose-600",
    title: "Paket Semangat Sekolah & Kantor",
    subtitle: "Kertas HVS, buku tulis & alat tulis lengkap diskon s.d 15%",
    code: "ATKHEMAT",
    image: "https://images.unsplash.com/photo-1456735190829-80ab072ac1a0?w=800&auto=format&fit=crop&q=80",
    actionType: "category",
    actionTarget: "ATK & Kantor",
    ctaText: "🛒 Lihat Promo ATK"
  },
  {
    id: "promo_kosmetik",
    badge: "GLOW-UP ORI",
    badgeColor: "bg-pink-600",
    title: "Glow-Up Cantik Tiap Hari",
    subtitle: "Diskon Skincare & Kosmetik Original Bergaransi Aman",
    code: "CANTIKORI",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
    actionType: "category",
    actionTarget: "Kosmetik & Cantik",
    ctaText: "💄 Lihat Diskon Kosmetik"
  },
  {
    id: "promo_sembako_member",
    badge: "GRATIS 1 HADIAH",
    badgeColor: "bg-amber-500",
    title: "Sembako Murah + Gratis Stempel VIP",
    subtitle: "Kumpulkan 30 stempel belanja dan dapatkan hadiah gratis pilihan Anda!",
    code: "DELINABERKAH",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    actionType: "hadiah",
    actionTarget: "rewards",
    ctaText: "🎁 Buka Halaman Hadiah & Member"
  }
];

let currentPromoSlideIndex = 0;
let promoAutoSlideTimer = null;
let currentPromoSlides = [];
let promoTouchStartX = 0;
let promoTouchEndX = 0;

function initWelcomeSplash(force = false) {
  const splash = document.getElementById("delinaWelcomeSplash");
  if (!splash) return;

  const shown = !force && sessionStorage.getItem("delina_welcome_shown");
  if (shown) {
    // Sesi ini sudah pernah melihat splash screen, langsung hilangkan seketika tanpa delay
    splash.style.display = "none";
    if (splash.parentNode) splash.parentNode.removeChild(splash);
    // Langsung cek pop-up promo
    setTimeout(() => {
      checkAndOpenWelcomePromoModal();
    }, 350);
  } else {
    // Kunjungan pertama dalam sesi browser ini: tampilkan animasi motor selama ~2.1 detik
    setTimeout(() => {
      sessionStorage.setItem("delina_welcome_shown", "true");
      splash.style.transition = "opacity 0.45s ease-out";
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.style.display = "none";
        if (splash.parentNode) splash.parentNode.removeChild(splash);
        checkAndOpenWelcomePromoModal();
      }, 450);
    }, 2100);
  }
}

function checkAndOpenWelcomePromoModal(force = false) {
  // Cek apakah pengguna memilih opsi "Jangan tampilkan lagi hari ini"
  if (!force) {
    const today = new Date().toISOString().slice(0, 10);
    const dismissedDate = localStorage.getItem("delina_popup_dismissed_date");
    if (dismissedDate === today) {
      console.log("Pop-up promo dilewati untuk hari ini oleh preferensi pengguna.");
      return;
    }
  }

  // Cek konfigurasi dari backend
  let promoConfig = window.popupPromoData;
  if (!force && promoConfig && promoConfig.enabled === false) {
    console.log("Pop-up promo dinonaktifkan dari pengaturan toko.");
    return;
  }

  const slides = (promoConfig && Array.isArray(promoConfig.slides) && promoConfig.slides.length > 0)
    ? promoConfig.slides
    : DEFAULT_POPUP_PROMOS;

  renderWelcomePromoModal(slides);
}

function renderWelcomePromoModal(slides) {
  const modal = document.getElementById("welcomePromoCarouselModal");
  const track = document.getElementById("welcomePromoTrack");
  const dotsContainer = document.getElementById("welcomePromoDots");
  const card = document.getElementById("welcomePromoCard");
  if (!modal || !track) return;

  currentPromoSlides = slides;
  currentPromoSlideIndex = 0;

  // Render Slide Items (Full-Bleed Immersive Poster Ala Alfagift)
  track.innerHTML = slides.map((slide, idx) => {
    const badgeHtml = slide.badge ? `
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wider text-white uppercase shadow-lg backdrop-blur-md border border-white/30 ${slide.badgeColor || 'bg-rose-600'}">
        <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
        ${escapeHtml(slide.badge)}
      </span>
    ` : '';

    const couponHtml = slide.code ? `
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/20 backdrop-blur-md border border-amber-300/40 text-[11px] font-black text-amber-300 w-fit shadow-md">
        <i class="bi bi-ticket-perforated-fill text-amber-400 text-xs"></i>
        <span>Kupon: ${escapeHtml(slide.code)}</span>
      </div>
    ` : '';

    const rawImg = slide.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80";
    const imgUrl = typeof formatImageUrl === "function" ? formatImageUrl(rawImg) : rawImg;

    return `
      <div class="w-full h-full shrink-0 relative flex flex-col justify-between overflow-hidden select-none cursor-pointer" onclick="handlePromoSlideAction(${idx})">
        <!-- Full-Bleed Poster Image (100% Mengisi Kartu Vertikal) -->
        <img src="${imgUrl}" alt="${escapeHtml(slide.title || 'Promo')}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />

        <!-- Gradien Gelap Top & Bottom untuk Keterbacaan Sempurna -->
        <div class="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none"></div>
        <div class="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none"></div>

        <!-- Top Floating Badge -->
        <div class="relative z-10 p-4 pt-4 flex items-center justify-between pointer-events-none">
          ${badgeHtml}
        </div>

        <!-- Bottom Floating Content (Title, Subtitle, Coupon, Big CTA Button) -->
        <div class="relative z-10 p-4 pb-8 flex flex-col justify-end text-white space-y-2">
          <!-- Judul Promo -->
          <h3 class="text-lg sm:text-xl font-black leading-tight drop-shadow-md text-white line-clamp-2">
            ${escapeHtml(slide.title || '')}
          </h3>

          <!-- Subjudul / Deskripsi -->
          <p class="text-xs text-emerald-100/90 leading-relaxed drop-shadow-xs line-clamp-2 font-medium">
            ${escapeHtml(slide.subtitle || '')}
          </p>

          <!-- Kupon Pill jika ada -->
          ${couponHtml}

          <!-- Big Vibrant CTA Button with Pulsing Glow -->
          <button type="button" onclick="event.stopPropagation(); handlePromoSlideAction(${idx})" class="mt-2 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-500 hover:from-amber-300 hover:via-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all ring-2 ring-white/30 cursor-pointer">
            <span>${escapeHtml(slide.ctaText || 'Lihat Promo')}</span>
            <i class="bi bi-arrow-right-circle-fill text-base"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Render Indicator Dots
  if (dotsContainer) {
    if (slides.length > 1) {
      dotsContainer.innerHTML = slides.map((_, idx) => `
        <button type="button" onclick="goToWelcomePromoSlide(${idx})" class="promo-dot w-2 h-2 rounded-full ${idx === 0 ? 'active' : 'bg-gray-300 dark:bg-slate-600'}" aria-label="Slide ${idx + 1}"></button>
      `).join("");
      dotsContainer.classList.remove("hidden");
    } else {
      dotsContainer.innerHTML = "";
      dotsContainer.classList.add("hidden");
    }
  }

  // Tampilkan / Sembunyikan Tombol Panah jika slide hanya 1
  const prevBtn = document.getElementById("promoPrevBtn");
  const nextBtn = document.getElementById("promoNextBtn");
  if (prevBtn && nextBtn) {
    if (slides.length <= 1) {
      prevBtn.classList.add("hidden");
      nextBtn.classList.add("hidden");
    } else {
      prevBtn.classList.remove("hidden");
      nextBtn.classList.remove("hidden");
    }
  }

  // Pasang Touch Swipe Listener pada kontainer carousel
  setupPromoTouchSwipe();

  // Buka Modal dengan Transisi Mulus
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  requestAnimationFrame(() => {
    modal.classList.remove("opacity-0");
    if (card) {
      card.classList.remove("scale-95");
      card.classList.add("scale-100");
    }
  });

  // Mulai Auto-Slide
  startPromoAutoSlide();
}

function updatePromoCarouselUI() {
  const track = document.getElementById("welcomePromoTrack");
  if (!track || currentPromoSlides.length === 0) return;

  track.style.transform = `translateX(-${currentPromoSlideIndex * 100}%)`;

  const dots = document.querySelectorAll("#welcomePromoDots .promo-dot");
  dots.forEach((dot, idx) => {
    if (idx === currentPromoSlideIndex) {
      dot.classList.add("active");
      dot.classList.remove("bg-gray-300", "dark:bg-slate-600");
    } else {
      dot.classList.remove("active");
      dot.classList.add("bg-gray-300", "dark:bg-slate-600");
    }
  });
}

function nextWelcomePromoSlide() {
  if (currentPromoSlides.length <= 1) return;
  currentPromoSlideIndex = (currentPromoSlideIndex + 1) % currentPromoSlides.length;
  updatePromoCarouselUI();
  restartPromoAutoSlide();
}

function prevWelcomePromoSlide() {
  if (currentPromoSlides.length <= 1) return;
  currentPromoSlideIndex = (currentPromoSlideIndex - 1 + currentPromoSlides.length) % currentPromoSlides.length;
  updatePromoCarouselUI();
  restartPromoAutoSlide();
}

function goToWelcomePromoSlide(idx) {
  if (idx < 0 || idx >= currentPromoSlides.length) return;
  currentPromoSlideIndex = idx;
  updatePromoCarouselUI();
  restartPromoAutoSlide();
}

function startPromoAutoSlide() {
  stopPromoAutoSlide();
  if (currentPromoSlides.length > 1) {
    promoAutoSlideTimer = setInterval(() => {
      nextWelcomePromoSlide();
    }, 4000);
  }
}

function stopPromoAutoSlide() {
  if (promoAutoSlideTimer) {
    clearInterval(promoAutoSlideTimer);
    promoAutoSlideTimer = null;
  }
}

function restartPromoAutoSlide() {
  stopPromoAutoSlide();
  startPromoAutoSlide();
}

function setupPromoTouchSwipe() {
  const container = document.getElementById("welcomePromoCarouselContainer");
  if (!container || container._swipeInitialized) return;

  container.addEventListener("touchstart", (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      promoTouchStartX = e.changedTouches[0].screenX;
    }
  }, { passive: true });

  container.addEventListener("touchend", (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      promoTouchEndX = e.changedTouches[0].screenX;
      handlePromoSwipeGesture();
    }
  }, { passive: true });

  container._swipeInitialized = true;
}

function handlePromoSwipeGesture() {
  const diff = promoTouchStartX - promoTouchEndX;
  if (Math.abs(diff) > 40) {
    if (diff > 0) {
      nextWelcomePromoSlide();
    } else {
      prevWelcomePromoSlide();
    }
  }
}

function closeWelcomePromoModal() {
  const modal = document.getElementById("welcomePromoCarouselModal");
  const card = document.getElementById("welcomePromoCard");
  const check = document.getElementById("dontShowPromoTodayCheck");

  // Jika dicentang, simpan hari ini ke localStorage
  if (check && check.checked) {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("delina_popup_dismissed_date", today);
  }

  stopPromoAutoSlide();

  if (modal) {
    modal.classList.add("opacity-0");
    if (card) {
      card.classList.remove("scale-100");
      card.classList.add("scale-95");
    }
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }, 300);
  }
}

function handlePromoSlideAction(idx) {
  const slide = currentPromoSlides[idx];
  if (!slide) return;

  closeWelcomePromoModal();

  const type = slide.actionType || "category";
  const target = slide.actionTarget || "";

  if (type === "category") {
    if (typeof selectCategory === "function") {
      selectCategory(target || "Semua Produk");
    }
    const grid = document.getElementById("productGrid") || document.getElementById("katalogSection");
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof showToast === "function") {
      showToast(`Menampilkan kategori: ${target || 'Semua Produk'}`);
    }
  } else if (type === "hadiah" || type === "member") {
    // Arahkan langsung ke Halaman Hadiah & Member Delina VIP
    if (typeof setActiveBottomNav === "function") {
      setActiveBottomNav("hadiah");
    }
    if (typeof openMemberModal === "function") {
      openMemberModal("rewards");
    }
    if (slide.code && navigator.clipboard) {
      navigator.clipboard.writeText(slide.code).catch(() => {});
      if (typeof showToast === "function") {
        showToast(`🎁 Kupon "${slide.code}" disalin! Cek kartu hadiah & stempel Anda.`);
      }
    }
  } else if (type === "coupon") {
    const code = slide.code || target;
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        if (typeof showToast === "function") {
          showToast(`🎟️ Kupon "${code}" berhasil disalin!`);
        }
      }).catch(() => {
        if (typeof showToast === "function") {
          showToast(`🎟️ Kupon: ${code}`);
        }
      });
    }
  } else if (type === "url") {
    if (target) {
      window.open(target, "_blank");
    }
  }
}

// Export fungsi ke window untuk interaksi UI HTML
window.initWelcomeSplash = initWelcomeSplash;
window.checkAndOpenWelcomePromoModal = checkAndOpenWelcomePromoModal;
window.showWelcomePromoModal = (force = true) => checkAndOpenWelcomePromoModal(force);
window.closeWelcomePromoModal = closeWelcomePromoModal;
window.nextWelcomePromoSlide = nextWelcomePromoSlide;
window.prevWelcomePromoSlide = prevWelcomePromoSlide;
window.goToWelcomePromoSlide = goToWelcomePromoSlide;
window.handlePromoSlideAction = handlePromoSlideAction;




