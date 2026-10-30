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
  { id: "atk", name: "ATK & Perlengkapan Kantor", icon: "bi-pencil-square" },
  { id: "kosmetik", name: "Kosmetik & Perawatan Diri", icon: "bi-heart-pulse" },
  { id: "sembako", name: "Sembako & Kelontongan", icon: "bi-shop" },
  { id: "fnb", name: "Makanan & Minuman", icon: "bi-cup-straw" }
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
        <div class="relative bg-gray-50 aspect-square overflow-hidden cursor-pointer" onclick="openProductDetailModal('${product.id}')">
          <img 
            src="${formatImageUrl(product.image)}" 
            alt="${product.name}" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            onerror="this.src='https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500'"
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
            <h4 class="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors cursor-pointer" onclick="openProductDetailModal('${product.id}')" title="${product.name}">
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
function renderCategoryPills(categoriesList) {
  const container = document.getElementById("categoryPillsContainer");
  if (!container) return;

  const cats = categoriesList && categoriesList.length > 0 
    ? categoriesList 
    : [
        { nama: "ATK & Perlengkapan Kantor", icon: "bi-pencil-square" },
        { nama: "Kosmetik & Perawatan Diri", icon: "bi-heart-pulse" },
        { nama: "Sembako & Kelontongan", icon: "bi-shop" },
        { nama: "Makanan & Minuman", icon: "bi-cup-straw" }
      ];

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
  if (elImg) elImg.src = product.image || "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60";
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
  }
}

function closeProductDetailModal() {
  const modal = document.getElementById("productDetailModal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
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
    // 4. Jasa Fotokopi: Cetak >= 100 lembar total dapat potongan Rp 50/lbr
    else if (item.isFotokopi && item.specs) {
      const totalLembar = (Number(item.specs.lembar) || 0) * (Number(item.specs.rangkap) || 1);
      if (totalLembar >= 100) {
        const diskon = totalLembar * 50;
        totalDiskonGrosir += diskon;
        item.isGrosir = true;
        item.grosirDesc = "Grosir Cetak -Rp 50/lbr";
      } else {
        item.isGrosir = false;
      }
    } else {
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
  "FOTOKOPILANCAR": {
    code: "FOTOKOPILANCAR",
    type: "fixed",
    discount: 3000,
    minSpend: 10000,
    requiresFotokopi: true,
    desc: "Potongan Rp 3.000 Jasa Fotokopi/Cetak"
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

  if (coupon.requiresFotokopi && !cart.some(item => item.isFotokopi)) {
    if (msgElem) {
      msgElem.textContent = "Kupon ini khusus untuk pesanan yang memuat Jasa Cetak/Fotokopi.";
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

// Hitung Ulang & Render Rincian di Modal Checkout
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
      let badgeGrosirHtml = item.isGrosir
        ? `<span class="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded ml-1">🏷️ Grosir</span>`
        : "";
      return `
      <div class="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-none">
        <div class="flex-1 truncate pr-2">
          <div class="font-semibold text-gray-800 truncate">${item.name}</div>
          <div class="text-gray-400 text-[10px] flex items-center gap-1">
            <span>Qty: ${item.qty} x ${formatRupiah(item.price)}</span>
            ${badgeGrosirHtml}
          </div>
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
    ctx.fillText("DELINA STORE & FOTOKOPI", 210, 44);

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
    alert("Gagal membuat struk simulasi. Silakan unggah foto biasa.");
  }
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

  // Wajib Unggah Bukti Bayar
  if (!uploadedPaymentProof) {
    alert("⚠️ Bukti pembayaran (struk transfer / QRIS) wajib diunggah sebelum pesanan diproses!\n\n💡 Tips: Anda dapat mengklik tombol '[🧪 Gunakan Struk Simulasi / Uji Coba]' di atas untuk mencoba proses checkout tanpa harus menyiapkan foto asli.");
    return;
  }

  // Buat Nomor Nota Pesanan Otomatis (#DLN-2026-XXXX)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `#DLN-2026-${randomSuffix}`;
  localStorage.setItem("delina_last_order_id", orderId);

  const now = new Date();
  const orderTime = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }) + ", " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

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
    paymentProofName: uploadedPaymentProof ? uploadedPaymentProof.name : "Kirim via WhatsApp",
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    discountAmount: totalPotongan
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
      paymentMethod: uploadedPaymentProof ? "QRIS" : "Bayar Tunai di Toko",
      totalAkhir: totalAkhir,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountAmount: totalPotongan,
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

  // Kosongkan Keranjang Belanja & Kupon
  cart = [];
  appliedCoupon = null;
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

    case "member":
      openMemberModal();
      break;

    case "lacak":
      openLacakPesananModal();
      break;

    case "cart":
      toggleCartDrawer(true);
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
}

function closeLacakPesananModal() {
  const modal = document.getElementById("lacakPesananModal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }
}

async function executeLacakPesanan(customNota) {
  const input = document.getElementById("lacakInputNota");
  let notaQuery = (customNota || (input ? input.value : "")).trim().toUpperCase();

  if (!notaQuery) {
    alert("Mohon masukkan nomor nota Delina Anda (contoh: #DLN-2026-XXXX)");
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
  if (elTime) elTime.textContent = order.orderTime || "-";
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

    // 1. Sinkron Katalog Produk
    if (Array.isArray(json.products) && json.products.length > 0) {
      console.log("Alhamdulillah, produk berhasil dimuat dari Google Sheets:", json.products.length, "barang");
      DUMMY_PRODUCTS.length = 0;
      json.products.forEach(p => {
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
      const t = json.toko;

      // Checkout Modal Rekening & QRIS
      const rekTextEl = document.getElementById("checkoutRekeningText");
      if (rekTextEl && t.rekening) {
        rekTextEl.textContent = t.rekening;
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
        footerWaLink.href = `https://wa.me/${cleanWa}`;
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
      alert("PIN Kasir tidak sesuai! Silakan periksa kembali PIN Anda.");
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
      alert(`Gagal ubah status: ${json.message}`);
      loadPosOrders();
    }
  } catch (err) {
    console.error("Gagal ubah status:", err);
    showToast(`Status lokal disimpan (${err.message})`);
  }
}

// =========================================================================
// FITUR 3: NOTIFIKASI WHATSAPP KE PELANGGAN (1-KLIK)
// =========================================================================
function sendCustomerWhatsAppNotification(orderId) {
  const order = posOrders.find(o => o.orderId === orderId);
  if (!order) {
    alert("Data pesanan tidak ditemukan.");
    return;
  }

  let phone = String(order.customerPhone || "").trim().replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) {
    phone = "62" + phone.substring(1);
  } else if (!phone.startsWith("62")) {
    phone = "62" + phone;
  }

  const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh kak ${order.customerName} 🙏

Alhamdulillah, pesanan ATK & Fotokopi Anda di *Toko Delina* sudah *SELESAI* dan *SIAP DIAMBIL* di toko kami! 🌟

📋 *No. Nota:* ${order.orderId}
📅 *Waktu Pesan:* ${order.orderTime || "-"}
🚚 *Metode:* ${order.deliveryMethod || "Ambil Sendiri di Toko"}
💰 *Total Tagihan:* ${formatRupiah(order.total || 0)}

📍 *Lokasi Toko:* Toko ATK & Fotokopi Delina
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
    alert("Data pesanan tidak ditemukan.");
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
        <div style="font-size: 14px; font-weight: 900; letter-spacing: -0.5px;">TOKO ATK & FOTOKOPI DELINA</div>
        <div style="font-size: 10px;">Lengkap, Murah & Berkah</div>
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
  if (modal) modal.classList.remove("hidden");
}

function closeQrisInfoModal() {
  const modal = document.getElementById("qrisInfoModal");
  if (modal) modal.classList.add("hidden");
}

function copyModalRekening() {
  const rekText = document.getElementById("modalRekeningText")?.textContent?.trim() || "";
  if (!rekText) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(rekText).then(() => {
      showToast("Alhamdulillah! Nomor rekening berhasil disalin.");
    }).catch(() => {
      showToast("Nomor Rekening: " + rekText);
    });
  } else {
    showToast("Nomor Rekening: " + rekText);
  }
}

// =========================================================================
// 17. ANIMASI PETIR CHIDORI SASUKE - TOOLTIP KIKO FLOATING BUTTON
// Siklus Loop: 4 Detik Tampil - 4 Detik Sembunyi, Pause Saat Hover / Touch
// =========================================================================

let chidoriTimer = null;
let isChidoriVisible = false;
let isChidoriPaused = false;

function initChidoriTooltip() {
  const tooltip = document.getElementById("kikoFloatingTooltip");
  if (!tooltip) return;

  // Pause saat mouse hover atau layar sentuh disentuh user
  const pauseLoop = () => {
    isChidoriPaused = true;
  };
  const resumeLoop = () => {
    isChidoriPaused = false;
  };

  tooltip.addEventListener("mouseenter", pauseLoop);
  tooltip.addEventListener("mouseleave", resumeLoop);
  tooltip.addEventListener("touchstart", pauseLoop, { passive: true });
  tooltip.addEventListener("touchend", resumeLoop, { passive: true });

  // Mulai siklus petir Chidori pertama setelah 1.2 detik halaman termuat
  setTimeout(() => {
    triggerChidoriCycle();
  }, 1200);
}

function triggerChidoriCycle() {
  const tooltip = document.getElementById("kikoFloatingTooltip");
  if (!tooltip) return;

  if (chidoriTimer) clearTimeout(chidoriTimer);

  const runCycle = () => {
    if (isChidoriPaused) {
      // Jika kursor/touch sedang aktif pada balon, tunda pengecekan tiap 800ms
      chidoriTimer = setTimeout(runCycle, 800);
      return;
    }

    if (!isChidoriVisible) {
      // FASE MASUK (CHIDORI ENTER): Sambaran Kilat Petir Cyan-White, Tampil Selama 4 Detik
      tooltip.classList.remove("chidori-exit-active", "chidori-hidden");
      tooltip.classList.add("chidori-enter-active");
      isChidoriVisible = true;

      chidoriTimer = setTimeout(() => {
        runCycle();
      }, 4000);
    } else {
      // FASE KELUAR (CHIDORI EXIT): Electric Zap Menyusut Masuk Tombol Kiko, Sembunyi Selama 4 Detik
      tooltip.classList.remove("chidori-enter-active");
      tooltip.classList.add("chidori-exit-active");
      isChidoriVisible = false;

      // Tunggu animasi exit selesai (450ms) lalu sembunyikan total
      setTimeout(() => {
        if (!isChidoriVisible) {
          tooltip.classList.remove("chidori-exit-active");
          tooltip.classList.add("chidori-hidden");
        }
      }, 450);

      chidoriTimer = setTimeout(() => {
        runCycle();
      }, 4000 + 450);
    }
  };

  runCycle();
}

// Inisialisasi Saat Dokumen Dimuat
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartBadge();
  calculateFotokopi();
  fetchProductsFromGAS();
  initChidoriTooltip();

  // Live listener jika admin menambah/mengedit produk di tab admin (Sync Real-time tanpa refresh)
  window.addEventListener("storage", (e) => {
    if (e.key === "delina_last_saved_product" && e.newValue) {
      try {
        const newProd = JSON.parse(e.newValue);
        if (newProd && newProd.id) {
          const idx = productsData.findIndex(p => String(p.id).toUpperCase() === String(newProd.id).toUpperCase());
          if (idx > -1) {
            productsData[idx] = { ...productsData[idx], ...newProd };
          } else {
            productsData.unshift(newProd);
          }
          renderProducts();
          showToast(`⚡ Produk "${newProd.name}" diperbarui di katalog!`);
        }
      } catch (err) {}
    }
  });

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

function formatImageUrl(url) {
  if (!url || typeof url !== "string") {
    return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500";
  }
  const clean = url.trim();
  if (!clean) {
    return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500";
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

function initMemberSessionFromStorage() {
  try {
    const saved = localStorage.getItem("delina_member_session");
    if (saved) {
      currentMemberSession = JSON.parse(saved);
      if (currentMemberSession && currentMemberSession.name) {
        const textEl = document.getElementById("headerMemberText");
        if (textEl) {
          textEl.textContent = currentMemberSession.name.split(" ")[0];
        }
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

  if (currentMemberSession) {
    // Pengguna sudah login -> Tampilkan Dashboard Member
    const authContainer = document.getElementById("memberAuthContainer");
    const dashContainer = document.getElementById("memberDashboardContainer");
    if (authContainer) authContainer.classList.add("hidden");
    if (dashContainer) dashContainer.classList.remove("hidden");

    renderMemberDashboardUI(currentMemberSession);
    refreshMemberDataOnline(currentMemberSession.phone);

    if (initialTab === "rewards") {
      setTimeout(() => scrollToRewardsSection(), 200);
    }
  } else {
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
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
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
      btnLogin.className = "flex-1 py-2 text-xs font-black rounded-xl bg-emerald-700 text-white shadow-xs transition-all";
    }
    if (btnRegister) {
      btnRegister.className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 transition-all";
    }
    if (nameField) nameField.classList.add("hidden");
    if (nameInput) nameInput.required = false;
    if (submitText) submitText.textContent = "Masuk ke Akun Member";
  } else {
    if (btnRegister) {
      btnRegister.className = "flex-1 py-2 text-xs font-black rounded-xl bg-emerald-700 text-white shadow-xs transition-all";
    }
    if (btnLogin) {
      btnLogin.className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 transition-all";
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
      currentMemberSession = json.member;
      localStorage.setItem("delina_member_session", JSON.stringify(json.member));
      showToast(json.message || "Alhamdulillah, selamat datang kembali!", "success");

      const headerText = document.getElementById("headerMemberText");
      if (headerText) headerText.textContent = json.member.name.split(" ")[0];

      // Switch ke dashboard
      const authContainer = document.getElementById("memberAuthContainer");
      const dashContainer = document.getElementById("memberDashboardContainer");
      if (authContainer) authContainer.classList.add("hidden");
      if (dashContainer) dashContainer.classList.remove("hidden");

      renderMemberDashboardUI(json.member, json.claims || []);
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
      currentMemberSession = json.member;
      localStorage.setItem("delina_member_session", JSON.stringify(json.member));
      showToast(json.message || "Pendaftaran berhasil!", "success");

      const headerText = document.getElementById("headerMemberText");
      if (headerText) headerText.textContent = json.member.name.split(" ")[0];

      const authContainer = document.getElementById("memberAuthContainer");
      const dashContainer = document.getElementById("memberDashboardContainer");
      if (authContainer) authContainer.classList.add("hidden");
      if (dashContainer) dashContainer.classList.remove("hidden");

      renderMemberDashboardUI(json.member, []);
    } else {
      showToast(json.message || "Gagal mendaftar.", "error");
    }
  } catch (err) {
    console.error("Register member error:", err);
    showToast("Gagal mendaftar ke server. Periksa koneksi internet.", "error");
  }
}

function handleMemberLogout() {
  if (confirm("Apakah Anda yakin ingin keluar dari akun Member Delina?")) {
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

async function refreshMemberDataOnline(phone) {
  if (!phone || typeof CONFIG === "undefined" || !CONFIG.GAS_API_URL) return;
  try {
    const res = await fetch(`${CONFIG.GAS_API_URL}?action=getMemberData&phone=${encodeURIComponent(phone)}`);
    const json = await res.json();
    if (json.status === "success" && json.member) {
      currentMemberSession = json.member;
      localStorage.setItem("delina_member_session", JSON.stringify(json.member));
      renderMemberDashboardUI(json.member, json.claims || []);
    }
  } catch (e) {
    console.warn("Online member refresh notice:", e);
  }
}

function renderMemberDashboardUI(member, claims) {
  if (!member) return;

  const nameEl = document.getElementById("cardMemberName");
  const phoneEl = document.getElementById("cardMemberPhone");
  const dateEl = document.getElementById("memberRegisteredDateText");
  const progressBar = document.getElementById("stampsProgressBar");
  const unlockBtn = document.getElementById("btnClaimRewardUnlock");

  if (nameEl) nameEl.textContent = member.name;
  if (phoneEl) phoneEl.textContent = member.phone;
  if (dateEl) dateEl.textContent = member.registeredAt || "-";

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

  // Render Riwayat Klaim
  renderMemberClaimsHistory(claims || []);
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
      <div class="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex gap-3 items-center">
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
    container.innerHTML = `<p class="text-xs text-slate-400 italic py-2 text-center">Belum ada riwayat penukaran hadiah.</p>`;
    return;
  }

  let html = "";
  claims.forEach(c => {
    html += `
      <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
        <div>
          <strong class="text-slate-800 block">${c.rewardName}</strong>
          <span class="text-[10px] text-slate-500 font-mono">Kode: ${c.claimId} • ${c.time}</span>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Sudah Diserahkan' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${c.status}
        </span>
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

  const pinConfirm = prompt(`Konfirmasi Penukaran Hadiah:\nMasukkan Password/PIN akun Anda untuk menukarkan 30 stempel belanja dengan hadiah ini:`, "1234");
  if (pinConfirm === null) return;

  showToast("Memproses klaim hadiah Anda...", "info");
  try {
    const res = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "claimReward",
        phone: currentMemberSession.phone,
        password: pinConfirm.trim(),
        idHadiah: rewardId
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      alert(`🎉 ALHAMDULILLAH KLAIM BERHASIL!\n\nHadiah: ${json.rewardName}\nKode Klaim: ${json.claimId}\nSisa Stempel: ${json.newBelanjaCount}/30\n\nSilakan tunjukkan Kode Klaim ini ke meja kasir Toko Delina saat mengambil hadiah.`);
      
      currentMemberSession.belanjaCount = json.newBelanjaCount;
      currentMemberSession.totalClaimed = json.totalClaimed;
      localStorage.setItem("delina_member_session", JSON.stringify(currentMemberSession));

      refreshMemberDataOnline(currentMemberSession.phone);
    } else {
      alert(`Afwan: ${json.message}`);
    }
  } catch (err) {
    console.error("Claim error:", err);
    showToast("Gagal memproses klaim ke server.", "error");
  }
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
  window.openCheckoutModal = openCheckoutModal;
  window.closeCheckoutModal = closeCheckoutModal;
  window.submitOrderCheckout = submitOrderCheckout;
  window.openKikoChat = openKikoChat;
  window.closeKikoChat = closeKikoChat;
  window.toggleKikoChat = toggleKikoChat;
  window.sendQuickKikoQuestion = sendQuickKikoQuestion;
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
}
