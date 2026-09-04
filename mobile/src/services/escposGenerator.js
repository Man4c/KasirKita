/**
 * ESC/POS Command Generator for KasirKita POS
 * Standard thermal printer byte command builder supporting 58mm (32 cols) and 80mm (48 cols).
 */

const COMMANDS = {
  INIT: [0x1b, 0x40], // ESC @ - Initialize
  ALIGN_LEFT: [0x1b, 0x61, 0x00], // ESC a 0
  ALIGN_CENTER: [0x1b, 0x61, 0x01], // ESC a 1
  ALIGN_RIGHT: [0x1b, 0x61, 0x02], // ESC a 2
  BOLD_ON: [0x1b, 0x45, 0x01], // ESC E 1
  BOLD_OFF: [0x1b, 0x45, 0x00], // ESC E 0
  TEXT_NORMAL: [0x1d, 0x21, 0x00], // GS ! 0
  TEXT_DOUBLE_HEIGHT: [0x1d, 0x21, 0x01], // GS ! 1
  TEXT_DOUBLE_WIDTH: [0x1d, 0x21, 0x10], // GS ! 16
  TEXT_DOUBLE: [0x1d, 0x21, 0x11], // GS ! 17
  FEED_LINE: [0x0a], // LF
  FEED_3_LINES: [0x1b, 0x64, 0x03], // ESC d 3
  CUT_PAPER: [0x1d, 0x56, 0x42, 0x00], // GS V 66 0
  DRAWER_KICK: [0x1b, 0x70, 0x00, 0x19, 0xfa], // ESC p 0 25 250
};

class EscposBuilder {
  constructor(paperSize = '58mm') {
    this.buffer = [];
    this.paperSize = paperSize;
    this.maxCols = paperSize === '80mm' ? 48 : 32;
    this.init();
  }

  init() {
    this.buffer.push(...COMMANDS.INIT);
    return this;
  }

  alignLeft() {
    this.buffer.push(...COMMANDS.ALIGN_LEFT);
    return this;
  }

  alignCenter() {
    this.buffer.push(...COMMANDS.ALIGN_CENTER);
    return this;
  }

  alignRight() {
    this.buffer.push(...COMMANDS.ALIGN_RIGHT);
    return this;
  }

  bold(enable = true) {
    this.buffer.push(...(enable ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF));
    return this;
  }

  doubleSize(enable = true) {
    this.buffer.push(...(enable ? COMMANDS.TEXT_DOUBLE : COMMANDS.TEXT_NORMAL));
    return this;
  }

  doubleHeight(enable = true) {
    this.buffer.push(...(enable ? COMMANDS.TEXT_DOUBLE_HEIGHT : COMMANDS.TEXT_NORMAL));
    return this;
  }

  newLine(count = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(...COMMANDS.FEED_LINE);
    }
    return this;
  }

  /**
   * Append raw text string encoded to ASCII/CP437 bytes.
   */
  text(str = '') {
    const cleanStr = String(str || '');
    for (let i = 0; i < cleanStr.length; i++) {
      const code = cleanStr.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 0x20); // Basic ASCII safety
    }
    return this;
  }

  textLine(str = '') {
    this.text(str);
    this.newLine();
    return this;
  }

  divider(char = '-') {
    this.textLine(char.repeat(this.maxCols));
    return this;
  }

  /**
   * Two-column row: Left-aligned label + Right-aligned value.
   * Example: "2x Kopi Susu" + "Rp24.000"
   */
  row(left = '', right = '') {
    const lStr = String(left || '');
    const rStr = String(right || '');
    const spaceNeeded = this.maxCols - (lStr.length + rStr.length);

    if (spaceNeeded >= 1) {
      this.text(lStr + ' '.repeat(spaceNeeded) + rStr);
      this.newLine();
    } else {
      // If left text is long, wrap it nicely
      const maxLeftLen = this.maxCols - rStr.length - 1;
      const truncatedLeft = lStr.substring(0, maxLeftLen);
      const remainderLeft = lStr.substring(maxLeftLen);
      this.text(truncatedLeft + ' ' + rStr);
      this.newLine();
      if (remainderLeft) {
        this.text(remainderLeft);
        this.newLine();
      }
    }
    return this;
  }

  feedAndCut() {
    this.buffer.push(...COMMANDS.FEED_3_LINES);
    this.buffer.push(...COMMANDS.CUT_PAPER);
    return this;
  }

  openCashDrawer() {
    this.buffer.push(...COMMANDS.DRAWER_KICK);
    return this;
  }

  getBytes() {
    return new Uint8Array(this.buffer);
  }
}

export const defaultFormatRp = (val) => 'Rp' + Number(val || 0).toLocaleString('id-ID');

/**
 * Build complete ESC/POS binary receipt for a KasirKita transaction.
 */
export function buildReceiptEscpos(transaction = {}, storeSettings = {}, paperSize = '58mm', copyLabel = null) {
  const builder = new EscposBuilder(paperSize);

  const tx = transaction || {};
  const settings = storeSettings || {};
  const storeName = settings.storeName || settings.name || 'KasirKita Mart';
  const storeAddress = settings.storeAddress || settings.address || 'Jl. Merdeka No. 12, Jakarta';
  const storePhone = settings.storePhone || settings.phone || '0812-3456-7890';
  const showPhone = typeof settings.showPhoneOnReceipt === 'boolean' ? settings.showPhoneOnReceipt : true;
  const receiptFooter = settings.receiptFooter || settings.receipt_footer || 'Terima kasih atas kunjungan Anda!';

  // 1. Header Toko & Tanda Salinan
  builder.alignCenter();
  if (copyLabel) {
    builder.bold(true);
    builder.textLine(`*** ${copyLabel.toUpperCase()} ***`);
    builder.bold(false);
  }
  builder.bold(true).doubleHeight(true);
  builder.textLine(storeName);
  builder.bold(false).doubleHeight(false);

  if (storeAddress) {
    builder.textLine(storeAddress);
  }
  if (showPhone && storePhone) {
    builder.textLine('WA/Telp: ' + storePhone);
  }

  builder.divider('=');

  // 2. Info Transaksi & Kasir
  builder.alignLeft();
  const invoice = tx.invoice_number || 'INV-DRAFT';
  const cashierName = tx.cashier?.name || tx.cashier_name || 'Kasir';
  const dateStr = tx.created_at
    ? new Date(tx.created_at).toLocaleString('id-ID')
    : new Date().toLocaleString('id-ID');

  builder.row('No. Faktur:', invoice);
  builder.row('Tanggal:', dateStr);
  builder.row('Kasir:', cashierName);

  if (tx.customer_name && tx.customer_name !== 'Pelanggan Umum') {
    builder.row('Pelanggan:', tx.customer_name);
  }

  builder.divider('-');

  // 3. Rincian Belanjaan
  const items = tx.items || [];
  items.forEach((item) => {
    const qty = Number(item.quantity || 1);
    const unit = item.unit_name || item.unit?.symbol || 'pcs';
    const name = item.product_name || item.product?.name || 'Item';
    const price = Number(item.price || item.unit_price || 0);
    const subtotal = Number(item.subtotal || (price * qty));

    // Line 1: Item Name
    builder.textLine(name);
    // Line 2: Quantity x Price = Subtotal
    const qtyPriceStr = `  ${qty} ${unit} x ${defaultFormatRp(price)}`;
    builder.row(qtyPriceStr, defaultFormatRp(subtotal));
  });

  builder.divider('-');

  // 4. Kalkulasi & Pembayaran (defensive fallback jika tx.subtotal kosong/0)
  const calculatedItemsSubtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || item.unit_price || 0);
    return sum + Number(item.subtotal || (price * qty));
  }, 0);
  const subtotalAmt = Number(tx.subtotal) > 0 ? Number(tx.subtotal) : calculatedItemsSubtotal;
  const discountAmt = Number(tx.discount_amount || 0);
  const taxAmt = Number(tx.tax_amount || 0);
  const feeAmt = Number(tx.fee_amount || 0);
  const totalAmt = Number(tx.total_amount || 0);
  const paidAmt = Number(tx.paid_amount || 0);
  const changeAmt = Number(tx.change_amount || 0);
  const payMethod = String(tx.payment_method || 'CASH').toUpperCase();

  builder.row('Subtotal:', defaultFormatRp(subtotalAmt));

  if (discountAmt > 0) {
    builder.row('Diskon:', '-' + defaultFormatRp(discountAmt));
  }
  if (taxAmt > 0) {
    builder.row('Pajak:', '+' + defaultFormatRp(taxAmt));
  }
  if (feeAmt > 0) {
    builder.row('Biaya Layanan:', '+' + defaultFormatRp(feeAmt));
  }

  builder.divider('-');

  // Total Nominal Tebal
  builder.bold(true);
  builder.row('TOTAL BELANJA:', defaultFormatRp(totalAmt));
  builder.bold(false);

  builder.row('Metode Bayar:', payMethod);
  builder.row('Nominal Diterima:', defaultFormatRp(paidAmt));
  builder.row('Kembalian:', defaultFormatRp(changeAmt));

  builder.divider('=');

  // 5. Footer & Ucapan Terima Kasih
  builder.alignCenter();
  builder.textLine(receiptFooter);

  // 6. Paper Feed & Cut
  builder.feedAndCut();

  return builder.getBytes();
}

export { EscposBuilder };
