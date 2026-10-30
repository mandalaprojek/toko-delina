/**
 * printer.js - Modul Pencetakan Struk Thermal Bluetooth (ESC/POS 58mm / 80mm)
 * Mendukung Web Bluetooth API untuk Android, Samsung Galaxy Tab, dan browser Chromium.
 * Toko Delina ATK & Fotokopi
 */

class BluetoothThermalPrinter {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.paperWidth = 32; // 32 karakter untuk kertas 58mm, 48 untuk 80mm
    this.isConnecting = false;
  }

  /**
   * Memeriksa apakah browser mendukung Web Bluetooth API
   */
  static isSupported() {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  /**
   * Menghubungkan ke Printer Thermal Bluetooth menggunakan Web Bluetooth API
   */
  async connect() {
    if (!BluetoothThermalPrinter.isSupported()) {
      throw new Error(
        "Browser Anda belum mendukung Web Bluetooth API.\n\n" +
        "💡 Silakan buka website ini menggunakan Google Chrome di Android / Tablet Samsung Galaxy Tab / PC dengan Bluetooth aktif."
      );
    }

    try {
      this.isConnecting = true;

      // UUID Service umum printer thermal Bluetooth ESC/POS (SPP, POS, Serial, ISSC, HM-10)
      const commonPrinterServices = [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
        "0000ff00-0000-1000-8000-00805f9b34fb"
      ];

      // Minta izin dan pilih perangkat Bluetooth dari dialog browser
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: commonPrinterServices
      });

      if (!this.device) {
        throw new Error("Tidak ada perangkat printer yang dipilih.");
      }

      // Hubungkan ke GATT Server
      const server = await this.device.gatt.connect();

      // Cari service yang tersedia
      let targetCharacteristic = null;

      for (const serviceUuid of commonPrinterServices) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetCharacteristic = char;
              break;
            }
          }
          if (targetCharacteristic) break;
        } catch (e) {
          // Lanjut coba service berikutnya
        }
      }

      // Jika belum ketemu dari list umum, cari dari seluruh service primer yang ada
      if (!targetCharacteristic) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                targetCharacteristic = char;
                break;
              }
            }
            if (targetCharacteristic) break;
          }
        } catch (e) {
          console.warn("Gagal scanning service alternatif:", e);
        }
      }

      if (!targetCharacteristic) {
        throw new Error("Karakteristik write printer ESC/POS tidak ditemukan pada perangkat Bluetooth ini.");
      }

      this.characteristic = targetCharacteristic;
      return true;
    } catch (err) {
      if (err.name === "NotFoundError") {
        throw new Error("Pencarian printer thermal dibatalkan.");
      }
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Mengirim byte array ke printer secara bertahap (chunking) agar buffer tidak meluap
   */
  async sendData(byteArray) {
    if (!this.characteristic) {
      throw new Error("Printer belum terhubung via Bluetooth.");
    }

    const maxChunk = 64; // Transmit per 64 bytes
    const totalBytes = byteArray.length;

    for (let offset = 0; offset < totalBytes; offset += maxChunk) {
      const chunk = byteArray.slice(offset, offset + maxChunk);
      const buffer = new Uint8Array(chunk);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(buffer);
      } else {
        await this.characteristic.writeValue(buffer);
      }
      // Jeda 20ms antar transmisi
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  /**
   * Format dua kolom teks (Kiri & Kanan) rata pinggir untuk kertas 32 karakter (58mm)
   */
  formatRow(left, right, width = 32) {
    const leftStr = String(left || "");
    const rightStr = String(right || "");
    const spaceCount = width - leftStr.length - rightStr.length;

    if (spaceCount > 0) {
      return leftStr + " ".repeat(spaceCount) + rightStr;
    } else {
      // Jika terlalu panjang, potong atau bungkus
      const trimmedLeft = leftStr.substring(0, Math.max(1, width - rightStr.length - 1));
      const remainingSpaces = width - trimmedLeft.length - rightStr.length;
      return trimmedLeft + " ".repeat(Math.max(1, remainingSpaces)) + rightStr;
    }
  }

  /**
   * Konversi teks biasa ke Array byte
   */
  encodeText(text) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
  }

  /**
   * Mengompilasi data transaksi pesanan ke dalam format ESC/POS
   */
  buildEscPosReceipt(orderData) {
    const bytes = [];

    // Helper push
    const push = (...arr) => bytes.push(...arr);
    const pushText = (t) => bytes.push(...this.encodeText(t));
    const pushLine = (t = "") => bytes.push(...this.encodeText(t + "\n"));

    // 1. Inisialisasi Printer: ESC @
    push(0x1B, 0x40);

    // 2. Header Toko (Rata Tengah, Bold, Ukuran Sedikit Besar)
    push(0x1B, 0x61, 0x01); // Center
    push(0x1B, 0x45, 0x01); // Bold ON
    push(0x1D, 0x21, 0x11); // Double height & width
    pushLine(orderData.storeName || "DELINA.STORE");

    push(0x1D, 0x21, 0x00); // Normal size
    push(0x1B, 0x45, 0x00); // Bold OFF
    pushLine(orderData.storeSlogan || "ATK, Kosmetik dan Kelontongan");
    pushLine(orderData.storeAddress || "Jl. Tanjung Raya Delina No. 12");
    if (orderData.storePhone) {
      pushLine("WA: " + orderData.storePhone);
    }

    // Garis Pemisah
    push(0x1B, 0x61, 0x00); // Left align
    pushLine("-".repeat(this.paperWidth));

    // 3. Info Nota & Waktu
    pushLine(this.formatRow("No. Nota:", orderData.orderId || "#DLN-2026", this.paperWidth));
    pushLine(this.formatRow("Tanggal:", orderData.orderTime || new Date().toLocaleDateString("id-ID"), this.paperWidth));
    if (orderData.customerName) {
      pushLine(this.formatRow("Pelanggan:", orderData.customerName, this.paperWidth));
    }
    if (orderData.deliveryMethod) {
      const deliveryShort = orderData.deliveryMethod.includes("Kurir") ? "Diantar Kurir" : "Ambil di Toko";
      pushLine(this.formatRow("Layanan:", deliveryShort, this.paperWidth));
    }

    pushLine("-".repeat(this.paperWidth));

    // 4. Daftar Barang Belanja
    const items = orderData.items || [];
    if (items.length > 0) {
      items.forEach(item => {
        // Nama Barang
        const itemName = item.name || item.nama || "Item ATK";
        push(0x1B, 0x45, 0x01); // Bold item name
        pushLine(itemName);
        push(0x1B, 0x45, 0x00);

        // Qty x Harga = Subtotal
        const qty = item.qty || item.kuantitas || 1;
        const price = Number(item.price || item.harga || 0);
        const subtotal = qty * price;
        const qtyPriceText = `  ${qty} x Rp ${price.toLocaleString("id-ID")}`;
        const subtotalText = `Rp ${subtotal.toLocaleString("id-ID")}`;

        pushLine(this.formatRow(qtyPriceText, subtotalText, this.paperWidth));
      });
    } else {
      pushLine("Transaksi Kasir Tunai");
    }

    pushLine("-".repeat(this.paperWidth));

    // 5. Total Pembayaran
    if (orderData.discountAmount && Number(orderData.discountAmount) > 0) {
      const diskonVal = `-Rp ${Number(orderData.discountAmount).toLocaleString("id-ID")}`;
      pushLine(this.formatRow("Diskon / Potongan:", diskonVal, this.paperWidth));
    }

    push(0x1B, 0x45, 0x01); // Bold ON
    const totalNum = typeof orderData.total === "number" ? orderData.total : (parseInt(String(orderData.total).replace(/[^0-9]/g, "")) || 0);
    const totalStr = `Rp ${totalNum.toLocaleString("id-ID")}`;
    pushLine(this.formatRow("TOTAL TAGIHAN:", totalStr, this.paperWidth));
    push(0x1B, 0x45, 0x00); // Bold OFF

    pushLine(this.formatRow("Metode Bayar:", orderData.paymentMethod || "QRIS / LUNAS", this.paperWidth));
    pushLine(this.formatRow("Status Nota:", "LUNAS", this.paperWidth));

    if (orderData.memberPhone) {
      pushLine("-".repeat(this.paperWidth));
      pushLine(this.formatRow("Member VIP:", orderData.memberPhone, this.paperWidth));
      pushLine(this.formatRow("Stempel Hadiah:", "+1 Poin Ditambahkan", this.paperWidth));
      if (orderData.memberPoints !== undefined) {
        pushLine(this.formatRow("Total Stempel:", `${orderData.memberPoints}/30 Hadiah`, this.paperWidth));
      }
    }

    pushLine("-".repeat(this.paperWidth));

    // 6. Catatan Kaki Islami & Ucapan Terima Kasih
    push(0x1B, 0x61, 0x01); // Center
    push(0x1B, 0x45, 0x01);
    pushLine("Jazakumullah Khairan Katsiran");
    push(0x1B, 0x45, 0x00);
    pushLine("Terima kasih atas amanah Anda.");
    pushLine("Barang yang dibeli dapat ditukar");
    pushLine("maksimal 1x24 jam dengan struk ini.");
    pushLine("www.toko-delina.store");

    // 7. Feed 4 baris & Cut Paper
    push(0x1B, 0x64, 0x04); // Feed 4 lines
    push(0x1D, 0x56, 0x41, 0x03); // GS V 65 3 (Partial cut with feed)

    return new Uint8Array(bytes);
  }
}

// Instance Tunggal
const globalBluetoothPrinter = new BluetoothThermalPrinter();

/**
 * Fungsi Utama: Cetak Struk ke Printer Thermal Bluetooth ESC/POS
 * @param {Object} order - Data pesanan lengkap
 */
async function printReceiptViaBluetooth(order) {
  if (!order) {
    alert("Data pesanan tidak valid.");
    return false;
  }

  // Tampilkan notifikasi memulai koneksi
  if (typeof showToast === "function") {
    showToast("🔍 Mencari printer thermal Bluetooth...", "info");
  } else if (typeof showToastAdmin === "function") {
    showToastAdmin("🔍 Mencari printer thermal Bluetooth...");
  }

  try {
    // 1. Hubungkan ke Printer
    await globalBluetoothPrinter.connect();

    if (typeof showToast === "function") {
      showToast("🖨️ Terhubung! Mengirim data struk ke printer...", "info");
    } else if (typeof showToastAdmin === "function") {
      showToastAdmin("🖨️ Terhubung! Mencetak struk...");
    }

    // 2. Susun Data ESC/POS
    const escposBytes = globalBluetoothPrinter.buildEscPosReceipt({
      storeName: (typeof CONFIG !== "undefined" && CONFIG.STORE_NAME) ? CONFIG.STORE_NAME : "TOKO DELINA ATK & FOTOKOPI",
      storeSlogan: "Lengkap, Murah & Berkah",
      storeAddress: "Jl. Tanjung Raya Delina No. 12",
      storePhone: (typeof CONFIG !== "undefined" && CONFIG.WHATSAPP_PHONE) ? CONFIG.WHATSAPP_PHONE : "0821-8535-5316",
      orderId: order.orderId || order.nota || "#DLN-2026-0000",
      orderTime: order.orderTime || order.timestamp || new Date().toLocaleString("id-ID"),
      customerName: order.customerName || order.nama || "Pelanggan Toko",
      deliveryMethod: order.deliveryMethod || "Ambil Sendiri di Toko Delina",
      items: order.items || [],
      total: order.total || order.totalAkhir || 0,
      discountAmount: order.discountAmount || 0,
      paymentMethod: order.paymentMethod || "QRIS / Transfer Bank"
    });

    // 3. Kirim ke printer
    await globalBluetoothPrinter.sendData(escposBytes);

    const successMsg = "✅ Alhamdulillah! Struk belanja berhasil dicetak ke printer Bluetooth.";
    if (typeof showToast === "function") {
      showToast(successMsg, "success");
    } else if (typeof showToastAdmin === "function") {
      showToastAdmin(successMsg);
    }

    return true;
  } catch (err) {
    console.error("Bluetooth Thermal Print Error:", err);

    // Tangani jika pengguna membatalkan dialog pemilih Bluetooth
    if (err.message && err.message.includes("dibatalkan")) {
      return false;
    }

    // Tampilkan pesan kesalahan ramah dengan opsi cetak standar browser
    const userChoice = confirm(
      `⚠️ Tidak dapat mencetak ke Printer Bluetooth:\n\n${err.message}\n\n` +
      `Apakah Anda ingin menggunakan fitur Cetak Standar Browser (PDF / Thermal Driver Biasa)?`
    );

    if (userChoice) {
      window.print();
    }

    return false;
  }
}

/**
 * Helper: Cetak pesanan terakhir dari modal sukses checkout etalase pembeli
 */
function printCurrentOrderBluetooth() {
  if (typeof latestOrderData !== "undefined" && latestOrderData) {
    printReceiptViaBluetooth(latestOrderData);
  } else {
    alert("Belum ada data pesanan aktif untuk dicetak.");
  }
}

/**
 * Helper: Cetak pesanan yang sedang aktif di modal Lacak Pesanan
 */
function printTrackedOrderBluetooth() {
  const elNota = document.getElementById("lacakNotaText");
  const elCustomer = document.getElementById("lacakCustomerName");
  const elTime = document.getElementById("lacakOrderTime");
  const elTotal = document.getElementById("lacakTotalAkhir");
  const elDelivery = document.getElementById("lacakDeliveryMethod");

  if (!elNota || !elNota.textContent || elNota.textContent.includes("XXXX")) {
    alert("Silakan lacak nomor nota yang valid terlebih dahulu.");
    return;
  }

  const order = {
    orderId: elNota.textContent.trim(),
    customerName: elCustomer ? elCustomer.textContent.trim() : "Pelanggan",
    orderTime: elTime ? elTime.textContent.trim() : new Date().toLocaleString("id-ID"),
    total: elTotal ? elTotal.textContent.trim() : "0",
    deliveryMethod: elDelivery ? elDelivery.textContent.trim() : "Ambil di Toko",
    items: [
      {
        name: "Rincian Transaksi Belanja #" + elNota.textContent.trim(),
        qty: 1,
        price: parseInt((elTotal ? elTotal.textContent : "0").replace(/[^0-9]/g, "")) || 0
      }
    ],
    paymentMethod: "QRIS / Terverifikasi"
  };

  printReceiptViaBluetooth(order);
}

/**
 * Helper: Cetak dari modal struk kasir admin
 */
function printAdminActiveReceiptBluetooth() {
  if (typeof activeReceiptOrder !== "undefined" && activeReceiptOrder) {
    printReceiptViaBluetooth(activeReceiptOrder);
  } else {
    alert("Pilih pesanan dari antrean kasir terlebih dahulu.");
  }
}

// Ekspos ke global window
if (typeof window !== "undefined") {
  window.BluetoothThermalPrinter = BluetoothThermalPrinter;
  window.printReceiptViaBluetooth = printReceiptViaBluetooth;
  window.printCurrentOrderBluetooth = printCurrentOrderBluetooth;
  window.printTrackedOrderBluetooth = printTrackedOrderBluetooth;
  window.printAdminActiveReceiptBluetooth = printAdminActiveReceiptBluetooth;
}

