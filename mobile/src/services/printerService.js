import { storage } from './storage';
import { buildReceiptEscpos } from './escposGenerator';

class PrinterService {
  constructor() {
    this.device = null;
    this.gattServer = null;
    this.writeCharacteristic = null;
    this.paperSize = '58mm';
    this.autoPrint = false;
    this.printTwoCopies = false;
    this.isSimulation = true;
    this.deviceName = 'Printer Bluetooth Virtual (58mm)';
  }

  async init() {
    try {
      const saved = await storage.getSettings();
      if (saved) {
        if (saved.paperSize) this.paperSize = saved.paperSize;
        if (typeof saved.autoPrint === 'boolean') this.autoPrint = saved.autoPrint;
        if (typeof saved.printTwoCopies === 'boolean') this.printTwoCopies = saved.printTwoCopies;
        if (saved.selectedPrinter) this.deviceName = saved.selectedPrinter;
        if (typeof saved.isPrinterConnected === 'boolean') {
          this.isSimulation = !this.writeCharacteristic;
        }
      }
    } catch (err) {
      console.warn('PrinterService init error:', err);
    }
  }

  isWebBluetoothSupported() {
    return typeof navigator !== 'undefined' && Boolean(navigator?.bluetooth);
  }

  /**
   * Request Bluetooth device discovery and connect GATT.
   */
  async scanAndConnectWebBluetooth() {
    if (!this.isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth API tidak didukung pada browser atau platform ini.');
    }

    try {
      // Prompt native OS Bluetooth Picker dialog
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Panda, Xprinter, Goojprt
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent serial
          '0000ff00-0000-1000-8000-00805f9b34fb', // Generic thermal
          '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / MPT
        ],
      });

      if (!device) throw new Error('Pemindaian dibatalkan.');

      // Connect GATT Server
      const server = await device.gatt.connect();
      this.device = device;
      this.gattServer = server;
      this.deviceName = device.name || 'Printer Bluetooth';
      this.isSimulation = false;

      // Find primary service and writable characteristic
      const services = await server.getPrimaryServices();
      let writeChar = null;

      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
          if (writeChar) break;
        } catch (e) {
          // ignore service iteration error
        }
      }

      this.writeCharacteristic = writeChar;

      // Persist settings
      await storage.setSettings({
        selectedPrinter: this.deviceName,
        isPrinterConnected: true,
      });

      return {
        success: true,
        name: this.deviceName,
        isPhysical: true,
      };
    } catch (err) {
      console.warn('Gagal menghubungkan Bluetooth:', err.message);
      throw err;
    }
  }

  /**
   * Set printer to virtual simulation mode (for testing without physical hardware).
   */
  async setSimulationMode(name = 'Panda PRJ-58D (Mode Simulasi)') {
    this.disconnect();
    this.isSimulation = true;
    this.deviceName = name;

    await storage.setSettings({
      selectedPrinter: this.deviceName,
      isPrinterConnected: true,
    });

    return {
      success: true,
      name: this.deviceName,
      isPhysical: false,
    };
  }

  disconnect() {
    if (this.gattServer && this.gattServer.connected) {
      try {
        this.gattServer.disconnect();
      } catch (e) {}
    }
    this.device = null;
    this.gattServer = null;
    this.writeCharacteristic = null;
    this.isSimulation = true;
  }

  setPaperSize(size = '58mm') {
    this.paperSize = size === '80mm' ? '80mm' : '58mm';
    storage.setSettings({ paperSize: this.paperSize });
  }

  /**
   * Print a KasirKita receipt.
   * If real Bluetooth thermal printer connected: sends ESC/POS byte chunks over Bluetooth.
   * If simulation: logs ESC/POS and returns simulated status.
   */
  async printReceipt(transaction, storeSettings) {
    let settings = storeSettings;
    if (!settings || Object.keys(settings).length === 0) {
      try {
        settings = (await storage.getSettings()) || {};
      } catch (e) {
        settings = {};
      }
    }
    const shouldPrintTwo = typeof settings.printTwoCopies === 'boolean' ? settings.printTwoCopies : this.printTwoCopies;
    const copies = shouldPrintTwo ? ['SALINAN KASIR', 'SALINAN PELANGGAN'] : [null];

    for (let c = 0; c < copies.length; c++) {
      const copyLabel = copies[c];
      const bytes = buildReceiptEscpos(transaction, settings, this.paperSize, copyLabel);

      // 1. If real Bluetooth characteristic is connected
      if (this.writeCharacteristic && this.gattServer?.connected) {
        try {
          // Send in 512-byte chunks to avoid buffer overflow
          const chunkSize = 512;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            if (this.writeCharacteristic.writeValueWithoutResponse) {
              await this.writeCharacteristic.writeValueWithoutResponse(chunk);
            } else {
              await this.writeCharacteristic.writeValue(chunk);
            }
            await new Promise((r) => setTimeout(r, 30));
          }

          // Small delay between 2 copies so cutter/tear has time to complete
          if (c < copies.length - 1) {
            await new Promise((r) => setTimeout(r, 800));
          }
        } catch (err) {
          console.warn('Error writing to Bluetooth thermal printer:', err.message);
        }
      }
    }

    const isBt = Boolean(this.writeCharacteristic && this.gattServer?.connected);
    return {
      success: true,
      mode: isBt ? 'bluetooth' : 'simulation',
      copies: copies.length,
      message: shouldPrintTwo
        ? `2 salinan struk berhasil dicetak (Kasir & Pelanggan)`
        : `Struk berhasil dicetak ke ${this.deviceName}`,
    };
  }

  /**
   * Print sample test receipt.
   */
  async printSample(storeSettings) {
    const sampleTx = {
      invoice_number: 'INV-SAMPLE-001',
      created_at: new Date().toISOString(),
      cashier_name: 'Kasir Uji',
      customer_name: 'Pelanggan Uji Coba',
      subtotal: 35000,
      discount_amount: 5000,
      tax_amount: 3300,
      fee_amount: 0,
      total_amount: 33300,
      paid_amount: 50000,
      change_amount: 16700,
      payment_method: 'CASH',
      items: [
        {
          product_name: 'Beras Premium 5kg',
          quantity: 1,
          unit_name: 'karung',
          price: 25000,
          subtotal: 25000,
        },
        {
          product_name: 'Gula Pasir 1kg',
          quantity: 1,
          unit_name: 'kg',
          price: 10000,
          subtotal: 10000,
        },
      ],
    };

    return this.printReceipt(sampleTx, storeSettings);
  }

  /**
   * Print clean HTML receipt in browser via dedicated iframe (no modal shell/buttons).
   */
  async printWebReceiptHtml(transaction, storeSettings) {
    if (typeof window === 'undefined') return;

    let settings = storeSettings;
    if (!settings || Object.keys(settings).length === 0) {
      try {
        settings = (await storage.getSettings()) || {};
      } catch (e) {
        settings = {};
      }
    }

    const tx = transaction || {};
    const storeName = settings.storeName || settings.name || 'KasirKita Mart';
    const storeAddress = settings.storeAddress || settings.address || 'Jl. Merdeka No. 12, Jakarta';
    const storePhone = settings.storePhone || settings.phone || '0812-3456-7890';
    const showPhone = typeof settings.showPhoneOnReceipt === 'boolean' ? settings.showPhoneOnReceipt : true;
    const receiptFooter = settings.receiptFooter || settings.receipt_footer || 'Terima kasih atas kunjungan Anda!';

    const invoice = tx.invoice_number || 'INV-000000000000';
    const dateStr = tx.created_at
      ? new Date(tx.created_at).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('id-ID');
    const cashierName = tx.cashier?.name || tx.cashier_name || 'Kasir';
    const customerName = tx.customer_name || 'Pelanggan Umum';

    const items = tx.items || [];
    const subtotal = Number(tx.subtotal || 0);
    const discountAmount = Number(tx.discount_amount || 0);
    const taxAmount = Number(tx.tax_amount || 0);
    const feeAmount = Number(tx.fee_amount || 0);
    const totalAmount = Number(tx.total_amount || 0);
    const paidAmount = Number(tx.paid_amount || 0);
    const changeAmount = Number(tx.change_amount || 0);
    const paymentMethod = String(tx.payment_method || 'CASH').toUpperCase();

    const formatRp = (v) => 'Rp' + Number(v || 0).toLocaleString('id-ID');

    const itemsHtml = items
      .map((it) => {
        const qty = Number(it.quantity || 1);
        const name = it.product_name || it.name || 'Produk';
        const lineTotal = Number(it.subtotal || it.price * qty || 0);
        return `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
            <span style="max-width:68%; word-break:break-word;">${qty}x ${name}</span>
            <span style="font-weight:600; white-space:nowrap;">${formatRp(lineTotal)}</span>
          </div>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Struk Transaksi - ${invoice}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #000;
          }
          body {
            width: 76mm;
            margin: 0 auto;
            padding: 8mm 4mm;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 3px;
          }
          .sub {
            font-size: 11px;
            color: #333;
            line-height: 1.3;
          }
          .divider {
            border-bottom: 1px dashed #555;
            margin: 8px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            margin-bottom: 3px;
          }
          .label {
            color: #444;
          }
          .val {
            font-weight: 600;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 700;
            margin: 6px 0;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 11px;
            font-style: italic;
            color: #333;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${storeName}</div>
          <div class="sub">${storeAddress}</div>
          ${showPhone && storePhone ? `<div class="sub">WA: ${storePhone}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="row"><span class="label">No. Nota</span><span class="val">${invoice}</span></div>
        <div class="row"><span class="label">Waktu</span><span class="val">${dateStr}</span></div>
        <div class="row"><span class="label">Kasir</span><span class="val">${cashierName}</span></div>
        <div class="row"><span class="label">Pelanggan</span><span class="val">${customerName}</span></div>

        <div class="divider"></div>

        <div>
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <div class="row"><span class="label">Subtotal</span><span class="val">${formatRp(subtotal)}</span></div>
        ${discountAmount > 0 ? `<div class="row"><span class="label">Diskon</span><span class="val">-${formatRp(discountAmount)}</span></div>` : ''}
        ${taxAmount > 0 ? `<div class="row"><span class="label">Pajak</span><span class="val">+${formatRp(taxAmount)}</span></div>` : ''}
        ${feeAmount > 0 ? `<div class="row"><span class="label">Biaya Layanan</span><span class="val">+${formatRp(feeAmount)}</span></div>` : ''}

        <div class="total-row">
          <span>TOTAL</span>
          <span>${formatRp(totalAmount)}</span>
        </div>

        <div class="row"><span class="label">Metode Bayar</span><span class="val">${paymentMethod}</span></div>
        <div class="row"><span class="label">Uang Diterima</span><span class="val">${formatRp(paidAmount)}</span></div>
        <div class="row"><span class="label">Kembalian</span><span class="val">${formatRp(changeAmount)}</span></div>

        <div class="divider"></div>

        <div class="footer">
          <div>${receiptFooter}</div>
          <div style="font-size: 9.5px; margin-top: 3px; color: #666;">KasirKita POS</div>
        </div>
      </body>
      </html>
    `;

    // Create an invisible iframe to print clean receipt without dialog clutter
    const iframeId = 'receipt-print-frame';
    let frame = document.getElementById(iframeId);
    if (frame) {
      document.body.removeChild(frame);
    }

    frame = document.createElement('iframe');
    frame.id = iframeId;
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);

    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    frame.contentWindow.focus();
    setTimeout(() => {
      frame.contentWindow.print();
    }, 250);
  }
}

export const printerService = new PrinterService();
