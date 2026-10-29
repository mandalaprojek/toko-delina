/**
 * app.js - Logika Frontend Toko Delina (Fase 2 - Fotokopi Upload, Cart & Modal Checkout QRIS)
 * Berjalan murni di sisi browser (Vanilla JavaScript)
 */

// 1. Data Contoh Produk ATK & Layanan Delina
const DUMMY_PRODUCTS = [
  {
    id: "ATK-001",
    name: "Kertas HVS PaperOne A4 75gsm (1 Rim / 500 Lembar)",
    category: "Kertas & Buku",
    price: 48000,
    originalPrice: 53000,
    rating: 4.9,
    sold: 1420,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60",
    badge: "Terlaris",
    stock: 85,
    unit: "Rim"
  },
  {
    id: "ATK-002",
    name: "Buku Tulis Sinar Dunia (SiDu) Kiky 38 Lembar - Pack Isi 10 Buku",
    category: "Kertas & Buku",
    price: 36500,
    originalPrice: 40000,
    rating: 4.8,
    sold: 890,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
    badge: "Diskon 9%",
    stock: 40,
    unit: "Pack"
  },
  {
    id: "ATK-003",
    name: "Pulpen Gel Zebra Sarasa Clip 0.5mm Hitam / Biru Tinta Pekat",
    category: "Alat Tulis & Pulpen",
    price: 15500,
    originalPrice: 17500,
    rating: 5.0,
    sold: 3100,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60",
    badge: "Favorit",
    stock: 120,
    unit: "Pcs"
  },
  {
    id: "ATK-004",
    name: "Paket Pulpen Standard AE7 0.5 Hitam (1 Lusin / 12 Batang)",
    category: "Alat Tulis & Pulpen",
    price: 24000,
    originalPrice: 28000,
    rating: 4.9,
    sold: 2150,
    image: "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500&auto=format&fit=crop&q=60",
    badge: "Grosir",
    stock: 65,
    unit: "Lusin"
  },
  {
    id: "ATK-005",
    name: "Map Folder Plastik L Document Bag Clear Holder F4 Folio",
    category: "Peralatan Kantor & Map",
    price: 6500,
    originalPrice: 8000,
    rating: 4.7,
    sold: 720,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60",
    badge: "Warna Lengkap",
    stock: 200,
    unit: "Pcs"
  },
  {
    id: "ATK-006",
    name: "Stapler Joyko HD-10 + Isi Ulang Staples No. 10 (Set Lengkap)",
    category: "Peralatan Kantor & Map",
    price: 18500,
    originalPrice: 22000,
    rating: 4.9,
    sold: 640,
    image: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=60",
    badge: "Original",
    stock: 50,
    unit: "Set"
  },
  {
    id: "ATK-007",
    name: "Kertas Double Folio Bergaris Merk Sinar Dunia (1 Pack / 100 Lembar)",
    category: "Kertas & Buku",
    price: 19500,
    originalPrice: 22500,
    rating: 4.8,
    sold: 520,
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=60",
    badge: "Sekolah",
    stock: 75,
    unit: "Pack"
  },
  {
    id: "ATK-008",
    name: "Tipe-X Kertas Kering Joyko Correction Tape CT-522 (Panjang 12m)",
    category: "Alat Tulis & Pulpen",
    price: 9000,
    originalPrice: 11000,
    rating: 4.9,
    sold: 1840,
    image: "https://images.unsplash.com/photo-1585336261026-6218f2705574?w=500&auto=format&fit=crop&q=60",
    badge: "Awet",
    stock: 90,
    unit: "Pcs"
  }
];

// 2. Data Kategori
const CATEGORIES = [
  { id: "all", name: "Semua Produk", icon: "bi-grid-fill" },
  { id: "kertas", name: "Kertas & Buku", icon: "bi-book" },
  { id: "tulis", name: "Alat Tulis & Pulpen", icon: "bi-pen" },
  { id: "kantor", name: "Peralatan Kantor & Map", icon: "bi-briefcase" },
  { id: "fotokopi", name: "Jasa Cetak & Fotokopi", icon: "bi-printer" }
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

// 5. Render Daftar Produk ke Grid
function renderProducts() {
  const container = document.getElementById("productGrid");
  if (!container) return;

  const filtered = DUMMY_PRODUCTS.filter(product => {
    const matchesCategory =
      currentCategory === "Semua Produk" || product.category === currentCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-4">
          <i class="bi bi-search text-2xl"></i>
        </div>
        <h3 class="text-base font-bold text-gray-800">Barang Belum Ditemukan</h3>
        <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Afwan kak, produk "${searchQuery}" tidak tersedia di kategori ini. Coba ketik kata kunci lain atau tanya Kiko.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map(product => {
      return `
      <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 card-shadow flex flex-col justify-between group">
        <!-- Foto Produk -->
        <div class="relative bg-gray-50 aspect-square overflow-hidden cursor-pointer" onclick="quickViewProduct('${product.id}')">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <!-- Badge Promosi -->
          <span class="absolute top-2.5 left-2.5 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            ${product.badge}
          </span>
          <span class="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            Stok: ${product.stock} ${product.unit}
          </span>
        </div>

        <!-- Detail Konten -->
        <div class="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <span class="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
              ${product.category}
            </span>
            <h4 class="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors" title="${product.name}">
              ${product.name}
            </h4>
          </div>

          <div class="mt-3 pt-2 border-t border-gray-50">
            <!-- Harga -->
            <div class="flex items-baseline gap-1.5">
              <span class="text-sm md:text-base font-extrabold text-emerald-800">
                ${formatRupiah(product.price)}
              </span>
              <span class="text-[10px] text-gray-400 line-through">
                ${formatRupiah(product.originalPrice)}
              </span>
            </div>

            <!-- Rating & Terjual -->
            <div class="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
              <span class="flex items-center text-amber-500 font-bold">
                <i class="bi bi-star-fill text-[10px] mr-1"></i>${product.rating}
              </span>
              <span class="text-gray-300">•</span>
              <span>Terjual ${product.sold}+</span>
            </div>

            <!-- Tombol Tambah ke Keranjang -->
            <button 
              onclick="addToCart('${product.id}')"
              class="mt-3 w-full py-2 px-3 rounded-xl bg-tokopedia-green hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-200"
            >
              <i class="bi bi-cart-plus text-sm"></i>
              <span>+ Keranjang</span>
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
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
          <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg bg-white border flex-shrink-0" />
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

// 8. Tampilkan Pesan Notifikasi Ringan (Toast)
function showToast(message, type = "success") {
  const toast = document.getElementById("toastNotification");
  const toastText = document.getElementById("toastMessage");
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.remove("translate-y-20", "opacity-0", "pointer-events-none");
  toast.classList.add("translate-y-0", "opacity-100");

  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0", "pointer-events-none");
    toast.classList.remove("translate-y-0", "opacity-100");
  }, 2600);
}

// 9. Buka/Tutup Keranjang
function toggleCartDrawer(open = true) {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer || !overlay) return;

  if (open) {
    renderCartDrawer();
    drawer.classList.remove("translate-x-full");
    overlay.classList.remove("hidden");
  } else {
    drawer.classList.add("translate-x-full");
    overlay.classList.add("hidden");
  }
}

// 10. Filter Kategori
function selectCategory(categoryName) {
  currentCategory = categoryName;

  document.querySelectorAll(".category-pill").forEach(btn => {
    const isCurrent = btn.dataset.category === categoryName;
    if (isCurrent) {
      btn.className =
        "category-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-emerald-800 text-white shadow-sm transition-all";
    } else {
      btn.className =
        "category-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-white text-gray-600 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 transition-all";
    }
  });

  if (categoryName === "Jasa Cetak & Fotokopi") {
    const fotokopiSection = document.getElementById("fotokopiCalculatorSection");
    if (fotokopiSection) {
      fotokopiSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  renderProducts();
}

// 11. Quick View
function quickViewProduct(productId) {
  const product = DUMMY_PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  alert(`Detail Produk Delina:\n\nNama: ${product.name}\nHarga: ${formatRupiah(product.price)}\nKategori: ${product.category}\nSisa Stok: ${product.stock} ${product.unit}\n\nKlik tombol '+ Keranjang' untuk membeli.`);
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

function calculateFotokopi() {
  const lembarInput = document.getElementById("lembarCount");
  const rangkapInput = document.getElementById("rangkapCount");
  const jilidSelect = document.getElementById("jilidOption");
  const sizeSelect = document.getElementById("kertasSize");

  const lembar = parseInt(lembarInput ? lembarInput.value : 10) || 0;
  const rangkap = parseInt(rangkapInput ? rangkapInput.value : 1) || 1;
  const jilid = jilidSelect ? jilidSelect.value : "none";
  const size = sizeSelect ? sizeSelect.value : "A4";

  const pricePerLembar = currentPrintType === "bw" ? 250 : 1000;
  let jilidCost = 0;
  if (jilid === "lakban") jilidCost = 4000;
  if (jilid === "spiral") jilidCost = 10000;

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
    alert("Afwan kak, ukuran file dokumen melebihi batas maksimal 10 MB. Silakan pilih berkas yang lebih kecil atau kompres terlebih dahulu.");
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
    showToast("Alhamdulillah, file dokumen berhasil diunggah.");
  } catch (err) {
    console.error("Gagal membaca file fotokopi:", err);
    alert("Gagal memproses file dokumen.");
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
// 13. LOGIKA MODAL CHECKOUT & PEMBAYARAN QRIS (FASE 2)
// =========================================================================

function goToCheckout() {
  if (cart.length === 0) {
    alert("Keranjang masih kosong kak. Silakan pilih produk ATK atau pesanan cetak terlebih dahulu.");
    return;
  }
  openCheckoutModal();
}

function openCheckoutModal() {
  toggleCartDrawer(false); // Tutup drawer belanja
  renderCheckoutSummary();

  const modal = document.getElementById("checkoutModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Hitung Ulang & Render Rincian di Modal Checkout
function renderCheckoutSummary() {
  const container = document.getElementById("checkoutItemsList");
  const countElem = document.getElementById("checkoutItemCount");
  const subtotalElem = document.getElementById("checkoutSubtotal");
  const ongkirElem = document.getElementById("checkoutOngkir");
  const grandTotalElem = document.getElementById("checkoutGrandTotal");

  if (!container) return;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = subtotal + deliveryFee;

  if (countElem) countElem.textContent = `${totalItemsCount} Item`;
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
      return `
      <div class="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-none">
        <div class="flex-1 truncate pr-2">
          <span class="font-semibold text-gray-800">${item.name}</span>
          <span class="text-gray-400 block text-[10px]">Qty: ${item.qty} x ${formatRupiah(item.price)}</span>
        </div>
        <span class="font-bold text-gray-700 flex-shrink-0">${formatRupiah(item.price * item.qty)}</span>
      </div>
    `;
    })
    .join("");
}

// Pergantian Metode Pengambilan (Ambil di Toko vs Kurir Toko)
function handleDeliveryChange(method) {
  selectedDeliveryMethod = method;
  deliveryFee = method === "courier" ? 5000 : 0;

  const labelPickup = document.getElementById("labelPickup");
  const labelCourier = document.getElementById("labelCourier");
  const addressContainer = document.getElementById("addressFieldContainer");

  if (method === "pickup") {
    labelPickup.className =
      "delivery-radio-card cursor-pointer border rounded-xl p-2.5 flex items-center gap-2.5 bg-emerald-50/60 border-emerald-400 transition-all";
    labelCourier.className =
      "delivery-radio-card cursor-pointer border rounded-xl p-2.5 flex items-center gap-2.5 border-gray-200 hover:border-emerald-300 transition-all";
    if (addressContainer) addressContainer.classList.add("hidden");
  } else {
    labelPickup.className =
      "delivery-radio-card cursor-pointer border rounded-xl p-2.5 flex items-center gap-2.5 border-gray-200 hover:border-emerald-300 transition-all";
    labelCourier.className =
      "delivery-radio-card cursor-pointer border rounded-xl p-2.5 flex items-center gap-2.5 bg-emerald-50/60 border-emerald-400 transition-all";
    if (addressContainer) addressContainer.classList.remove("hidden");
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
    alert("Afwan kak, ukuran bukti transfer melebihi batas 5 MB. Silakan gunakan tangkapan layar yang lebih kecil.");
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

    showToast("Alhamdulillah, bukti bayar siap dikonfirmasi.");
  } catch (err) {
    console.error("Gagal membaca bukti bayar:", err);
    alert("Gagal memproses file gambar bukti transfer.");
  }
}

function clearPaymentProof() {
  uploadedPaymentProof = null;
  const input = document.getElementById("paymentProofInput");
  if (input) input.value = "";
  const previewContainer = document.getElementById("paymentProofPreviewContainer");
  if (previewContainer) previewContainer.classList.add("hidden");
}

// Salin No Rekening
function copyRekening(rekNumber) {
  navigator.clipboard.writeText(rekNumber).then(() => {
    showToast(`Nomor Rekening ${rekNumber} berhasil disalin!`);
  });
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
    alert("Mohon masukkan Nama Lengkap Anda.");
    if (nameInput) nameInput.focus();
    return;
  }

  if (!customerPhone) {
    alert("Mohon masukkan Nomor WhatsApp aktif Anda.");
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (selectedDeliveryMethod === "courier" && !customerAddress) {
    alert("Mohon lengkapi Alamat Lengkap Pengiriman untuk kurir toko.");
    if (addressInput) addressInput.focus();
    return;
  }

  if (!uploadedPaymentProof) {
    const confirmNoProof = confirm(
      "Kak, bukti pembayaran QRIS/Transfer belum diunggah. Apakah ingin melanjutkan dan mengirim bukti bayar via WhatsApp nanti?"
    );
    if (!confirmNoProof) return;
  }

  // Buat Nomor Nota Pesanan Otomatis (#DLN-2026-XXXX)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `#DLN-2026-${randomSuffix}`;
  const now = new Date();
  const orderTime = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }) + ", " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalAkhir = subtotal + deliveryFee;

  latestOrderData = {
    orderId,
    customerName,
    customerPhone,
    deliveryMethod:
      selectedDeliveryMethod === "courier"
        ? `Diantar Kurir (+ ${formatRupiah(5000)}) - Alamat: ${customerAddress}`
        : "Ambil Sendiri di Toko Delina",
    totalAkhir: formatRupiah(totalAkhir),
    orderTime,
    items: [...cart],
    hasPaymentProof: !!uploadedPaymentProof,
    paymentProofName: uploadedPaymentProof ? uploadedPaymentProof.name : "Kirim via WhatsApp"
  };

  // Kirim data pesanan ke Google Apps Script Backend (Live Integration)
  if (typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
    const payload = {
      orderId: orderId,
      orderTime: orderTime,
      customerName: customerName,
      customerPhone: customerPhone,
      deliveryMethod: selectedDeliveryMethod === 'courier' ? `Diantar Kurir (+ ${formatRupiah(5000)})` : 'Ambil Sendiri di Toko Delina',
      customerAddress: customerAddress || "-",
      totalAkhir: totalAkhir,
      items: latestOrderData.items,
      fotokopiFile: (function() {
        const fotoItem = latestOrderData.items.find(i => i.isFotokopi && i.fileBase64);
        if (fotoItem) {
          return {
            name: fotoItem.fileName || "dokumen.pdf",
            base64: fotoItem.fileBase64
          };
        }
        return null;
      })(),
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

  // Tutup Modal Checkout
  closeCheckoutModal();

  // Buka Modal Sukses
  openSuccessModal(latestOrderData);

  // Kosongkan Keranjang Belanja
  cart = [];
  saveCart();
  updateCartBadge();
  renderCartDrawer();

  // Bersihkan form input checkout
  if (nameInput) nameInput.value = "";
  if (phoneInput) phoneInput.value = "";
  if (addressInput) addressInput.value = "";
  clearPaymentProof();
}

// Buka Modal Sukses
function openSuccessModal(order) {
  const modal = document.getElementById("orderSuccessModal");
  if (!modal) return;

  document.getElementById("successCustName").textContent = order.customerName;
  document.getElementById("successOrderId").textContent = order.orderId;
  document.getElementById("successOrderTime").textContent = order.orderTime;
  document.getElementById("successDeliveryMethod").textContent =
    selectedDeliveryMethod === "courier" ? "Diantar Kurir Toko" : "Ambil di Toko";
  document.getElementById("successOrderTotal").textContent = order.totalAkhir;

  modal.classList.remove("hidden");
}

function closeSuccessModal() {
  const modal = document.getElementById("orderSuccessModal");
  if (modal) modal.classList.add("hidden");
}

function copyOrderId() {
  if (!latestOrderData) return;
  navigator.clipboard.writeText(latestOrderData.orderId).then(() => {
    showToast(`Nomor Nota ${latestOrderData.orderId} disalin!`);
  });
}

function sendConfirmationWhatsApp() {
  if (!latestOrderData) return;
  const itemsText = latestOrderData.items
    .map((item, idx) => `${idx + 1}. ${item.name} (${item.qty}x)`)
    .join("%0A");

  const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh Toko Delina,%0A%0ASaya ingin konfirmasi pesanan dengan rincian:%0A- No. Nota: *${latestOrderData.orderId}*%0A- Nama: *${latestOrderData.customerName}*%0A- Pengambilan: *${latestOrderData.deliveryMethod}*%0A- Total: *${latestOrderData.totalAkhir}*%0A%0ARincian Barang:%0A${itemsText}%0A%0AMohon diproses nggih, terima kasih.`;
  
  window.open(`https://wa.me/?text=${message}`, "_blank");
}

// =========================================================================
// 14. LOGIKA MOBILE & TABLET BOTTOM NAVIGATION BAR
// =========================================================================

function setActiveBottomNav(menu) {
  activeBottomNav = menu;
  const navBtns = document.querySelectorAll(".bottom-nav-btn");
  navBtns.forEach(btn => {
    const isTarget = btn.dataset.nav === menu;
    const label = btn.querySelector("span:not(.cart-badge)");

    if (isTarget) {
      btn.classList.add("active", "text-tokopedia-green");
      btn.classList.remove("text-gray-500");
      if (label) {
        label.classList.add("font-bold");
        label.classList.remove("font-medium");
      }
    } else {
      btn.classList.remove("active", "text-tokopedia-green");
      btn.classList.add("text-gray-500");
      if (label) {
        label.classList.remove("font-bold");
        label.classList.add("font-medium");
      }
    }
  });
}

function handleBottomNav(menu) {
  setActiveBottomNav(menu);

  switch (menu) {
    case "home":
      window.scrollTo({ top: 0, behavior: "smooth" });
      selectCategory("Semua Produk");
      break;

    case "category":
      const categorySection = document.getElementById("categorySection");
      if (categorySection) {
        categorySection.scrollIntoView({ behavior: "smooth" });
      }
      break;

    case "fotokopi":
      const fotokopiSection = document.getElementById("fotokopiCalculatorSection");
      if (fotokopiSection) {
        fotokopiSection.scrollIntoView({ behavior: "smooth" });
      }
      break;

    case "cart":
      toggleCartDrawer(true);
      break;

    case "kiko":
      toggleKikoChat();
      break;
  }
}

// Modal Kiko Chat
function openKikoChat() {
  const modal = document.getElementById("kikoChatModal");
  if (modal) modal.classList.remove("hidden");
}

function closeKikoChat() {
  const modal = document.getElementById("kikoChatModal");
  if (modal) modal.classList.add("hidden");
}

function toggleKikoChat() {
  const modal = document.getElementById("kikoChatModal");
  if (!modal) return;
  if (modal.classList.contains("hidden")) {
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

// =========================================================================
// 15. LOGIKA LIVE CHAT ASISTEN AI "KIKO" (FASE 4)
// =========================================================================

let isKikoThinking = false;

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

  const userText = input.value.trim();
  if (!userText || isKikoThinking) return;

  // 1. Tampilkan Bubble Pengguna
  appendChatBubble("user", userText);
  input.value = "";

  // 2. Tampilkan Indikator Mengetik
  isKikoThinking = true;
  if (sendBtn) sendBtn.disabled = true;
  const typingId = appendTypingIndicator();

  try {
    let kikoReply = "";
    if (typeof CONFIG !== "undefined" && CONFIG.GAS_API_URL) {
      const response = await fetch(CONFIG.GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "chatKiko",
          message: userText,
          sumber: "Web Widget"
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json && json.reply) {
          kikoReply = json.reply;
        }
      }
    }

    // Jika belum ada balasan dari API, berikan balasan cerdas lokal berbasis stok
    if (!kikoReply) {
      kikoReply = generateLocalKikoReply(userText);
    }

    removeTypingIndicator(typingId);
    appendChatBubble("kiko", kikoReply);

  } catch (err) {
    console.warn("Kiko live error, using smart fallback:", err);
    removeTypingIndicator(typingId);
    const fallback = generateLocalKikoReply(userText);
    appendChatBubble("kiko", fallback);
  } finally {
    isKikoThinking = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }
}

function appendChatBubble(sender, text) {
  const container = document.getElementById("kikoChatMessages");
  if (!container) return;

  const bubbleDiv = document.createElement("div");
  if (sender === "user") {
    bubbleDiv.className = "flex justify-end gap-2";
    bubbleDiv.innerHTML = `
      <div class="bg-tokopedia-green text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-[85%] shadow-xs">
        ${escapeHtml(text)}
      </div>
    `;
  } else {
    bubbleDiv.className = "flex gap-2";
    const formattedText = formatMarkdown(text);
    bubbleDiv.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-delina-emerald text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-xs">K</div>
      <div class="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 text-gray-700 shadow-xs leading-relaxed max-w-[85%] text-xs">
        ${formattedText}
      </div>
    `;
  }

  container.appendChild(bubbleDiv);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = document.getElementById("kikoChatMessages");
  if (!container) return null;

  const id = "typing-" + Date.now();
  const typingDiv = document.createElement("div");
  typingDiv.id = id;
  typingDiv.className = "flex gap-2 items-center text-xs text-gray-400";
  typingDiv.innerHTML = `
    <div class="w-6 h-6 rounded-full bg-delina-emerald/70 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">K</div>
    <div class="bg-white px-3 py-2 rounded-2xl rounded-tl-none border border-gray-100 shadow-xs flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.2s"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.4s"></span>
      <span class="text-[10px] text-gray-400 ml-1">Kiko sedang berpikir...</span>
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
  const q = userText.toLowerCase();

  if (q.includes("assalamu") || q.includes("halo") || q.includes("hai") || q.includes("pagi") || q.includes("siang")) {
    return "Wa'alaikumsalam Warahmatullahi Wabarakatuh kak! Ada yang bisa Kiko bantu terkait belanja perlengkapan ATK atau jasa fotokopi hari ini? InsyaAllah Toko Delina siap melayani.";
  }

  if (q.includes("fotokopi") || q.includes("cetak") || q.includes("print") || q.includes("jilid")) {
    return "Alhamdulillah untuk layanan fotokopi & cetak di Toko Delina:\n- Hitam-Putih HVS A4: Rp 250 / lbr\n- Warna HVS A4: Rp 1.000 / lbr\n- Jilid Lakban Biasa: Rp 4.000\n- Jilid Spiral: Rp 10.000\n\nKakak bisa langsung hitung estimasi biaya & upload dokumen di menu **Fotokopi** di halaman depan tanpa perlu antre nggih.";
  }

  const matched = DUMMY_PRODUCTS.filter(p => q.includes(p.name.toLowerCase().slice(0, 10)) || p.category.toLowerCase().split(" ").some(w => q.includes(w)));
  if (matched.length > 0) {
    const p = matched[0];
    return `Alhamdulillah untuk *${p.name}* saat ini tersedia di Toko Delina dengan harga *${formatRupiah(p.price)}* (sisa stok: ${p.stock} ${p.unit}). Apakah ingin Kiko bantu masukkan ke keranjang belanja kak? Semoga berkah belanjanya.`;
  }

  return "Assalamu'alaikum Warahmatullahi Wabarakatuh kak! Kiko siap membantu cek stok ATK, info harga, dan panduan cetak dokumen di Toko Delina. Kakak bisa menyebutkan nama barang yang dicari, insyaAllah Kiko cekkan ketersediaannya.";
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatMarkdown(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\n/g, '<br/>');
  return safe;
}

// Ambil Produk Live dari Google Sheets jika tersedia
async function fetchProductsFromGAS() {
  if (typeof CONFIG === "undefined" || !CONFIG.GAS_API_URL || !CONFIG.ENABLE_LIVE_BACKEND) return;

  try {
    const res = await fetch(CONFIG.GAS_API_URL);
    if (!res.ok) return;
    const json = await res.json();
    if (json && json.status === "success" && Array.isArray(json.products) && json.products.length > 0) {
      console.log("Alhamdulillah, produk berhasil dimuat dari Google Sheets:", json.products.length, "barang");
      DUMMY_PRODUCTS.length = 0;
      json.products.forEach(p => DUMMY_PRODUCTS.push(p));
      renderProducts();
    }
  } catch (e) {
    console.log("Memuat katalog lokal Toko Delina:", e.message);
  }
}

// Inisialisasi Saat Dokumen Dimuat
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartBadge();
  calculateFotokopi();
  fetchProductsFromGAS();

  // Pasang listener pencarian
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }
});
