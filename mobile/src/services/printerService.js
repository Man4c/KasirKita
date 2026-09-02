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
}

export const printerService = new PrinterService();
