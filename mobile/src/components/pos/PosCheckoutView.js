import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  ArrowLeft,
  ShoppingCart,
  Users,
  Check,
  X,
  TicketPercent,
  Package,
  Percent,
  ChevronDown,
  Sparkles,
  Minus,
  Plus,
  Trash2,
  Banknote,
  QrCode,
  CreditCard,
  Delete,
} from 'lucide-react-native';

export default function PosCheckoutView({
  isLandscape,
  compact,
  onCloseCheckout,
  totalItemsCount,
  totalAmount,
  selectedCustomer,
  showCustomerPicker = true,
  onOpenCustomerModal,
  onClearCustomer,
  hasBillAdjustments,
  subtotal,
  discount,
  appliedPromo,
  taxAmount,
  activeTax,
  feeAmount,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  availablePromos,
  onOpenPromoModal,
  onRemovePromo,
  voucherInput,
  onChangeVoucherInput,
  onApplyVoucher,
  voucherLoading,
  takeawayFees,
  isTakeaway,
  onToggleTakeaway,
  availableTaxes,
  selectedTaxId,
  onSelectTax,
  onOpenTaxModal,
  paymentMethod,
  onSelectPaymentMethod,
  paidAmount,
  onNumpadDigit,
  onNumpadBackspace,
  onNominalShortcut,
  feeDetails,
  checkoutLoading,
  onProcessCheckout,
  formatRp,
}) {
  return (
    <View style={styles.checkoutRoot}>
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.checkoutHeader,
          isLandscape && styles.checkoutHeaderLandscape,
          compact && styles.checkoutHeaderCompact,
        ]}
      >
        <TouchableOpacity
          style={styles.checkoutBackBtn}
          onPress={onCloseCheckout}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#fb7185" style={{ marginRight: 6 }} />
          <Text style={styles.checkoutBackText}>
            {isLandscape ? 'Kembali ke Keranjang' : 'Kembali'}
          </Text>
        </TouchableOpacity>

        <View style={styles.checkoutTitleBox}>
          <Text style={styles.checkoutTitleText}>Pembayaran Kasir</Text>
        </View>

        <View style={styles.checkoutHeaderRight}>
          <View style={styles.checkoutItemBadge}>
            <ShoppingCart size={13} color="#fb7185" style={{ marginRight: 5 }} />
            <Text style={styles.checkoutItemBadgeText}>{totalItemsCount} Item</Text>
          </View>
        </View>
      </View>

      {/* Checkout Screen Body */}
      {isLandscape ? (
        <View style={styles.checkoutBodyLandscape}>
          {/* Left Column (~38% width): Note, Items & Customer Summary */}
          <View
            style={[
              styles.checkoutLeftColLandscape,
              compact && styles.checkoutLeftColCompactLandscape,
            ]}
          >
            {/* 1. Items List & Adjustments (Daftar Pesanan) */}
            <ScrollView
              style={[
                styles.checkoutLeftScroll,
                compact && styles.checkoutLeftScrollCompact,
              ]}
              showsVerticalScrollIndicator={true}
            >
              {/* Items List */}
              <View style={styles.checkoutItemsListCard}>
                <View style={styles.checkoutItemsHeader}>
                  <Text style={styles.checkoutItemsTitle}>Daftar Pesanan ({cart.length})</Text>
                  <Text style={styles.checkoutItemsTotalQty}>{totalItemsCount} Total Qty</Text>
                </View>
                {cart.map((item) => {
                  const itemUnit =
                    item.product.unitSymbol ||
                    item.product.base_unit?.symbol ||
                    item.product.baseUnit?.symbol ||
                    'pcs';
                  return (
                    <View key={item.product.id} style={styles.checkoutItemRowMini}>
                      <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                        <Text style={styles.checkoutItemNameMini} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={styles.checkoutItemPriceMini}>
                          {item.quantity} {itemUnit} x {formatRp(item.product.price)} ={' '}
                          <Text style={{ color: '#fb7185', fontWeight: 'bold' }}>
                            {formatRp(item.quantity * Number(item.product.price))}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Breakdown */}
              {hasBillAdjustments && (
                <View
                  style={[
                    styles.checkoutAdjustmentsBox,
                    compact && styles.checkoutAdjustmentsBoxCompact,
                    { marginTop: 6 },
                  ]}
                >
                  <View style={styles.checkoutAdjustmentRow}>
                    <Text style={styles.checkoutAdjustmentLabel}>Subtotal</Text>
                    <Text style={styles.checkoutAdjustmentVal}>{formatRp(subtotal)}</Text>
                  </View>
                  {discount > 0 && (
                    <View style={styles.checkoutAdjustmentRow}>
                      <Text
                        style={[styles.checkoutAdjustmentLabel, { color: '#34d399' }]}
                        numberOfLines={1}
                      >
                        Diskon ({appliedPromo?.discount_code || 'Promo'})
                      </Text>
                      <Text style={[styles.checkoutAdjustmentVal, { color: '#34d399' }]}>
                        -{formatRp(discount)}
                      </Text>
                    </View>
                  )}
                  {taxAmount > 0 && (
                    <View style={styles.checkoutAdjustmentRow}>
                      <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>
                        Pajak ({activeTax?.name || 'PPN'})
                      </Text>
                      <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                        +{formatRp(taxAmount)}
                      </Text>
                    </View>
                  )}
                  {feeAmount > 0 && (
                    <View style={styles.checkoutAdjustmentRow}>
                      <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>
                        Biaya Layanan
                      </Text>
                      <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                        +{formatRp(feeAmount)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* 2. Customer / Member Card */}
            {showCustomerPicker && (
            <View
              style={[
                styles.checkoutCustomerCard,
                compact && styles.checkoutCustomerCardCompact,
                { marginTop: 6, marginBottom: 4 },
              ]}
            >
              <View style={styles.checkoutCustomerCardLeft}>
                <View
                  style={[
                    styles.checkoutCustomerAvatar,
                    selectedCustomer && styles.checkoutCustomerAvatarActive,
                  ]}
                >
                  <Users size={14} color={selectedCustomer ? '#fb7185' : '#a1a1aa'} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.checkoutCustomerName} numberOfLines={1} ellipsizeMode="tail">
                    {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum'}
                  </Text>
                  {selectedCustomer ? (
                    <View style={styles.checkoutCustomerMetaRow}>
                      <View style={styles.checkoutMembershipBadge}>
                        <Text style={styles.checkoutMembershipBadgeText}>
                          {selectedCustomer.membership_type || 'REGULAR'}
                        </Text>
                      </View>
                      {selectedCustomer.phone && (
                        <Text style={styles.checkoutCustomerPhone} numberOfLines={1}>
                          {selectedCustomer.phone}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.checkoutCustomerSub}>Walk-in (Tanpa Member)</Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {selectedCustomer && (
                  <TouchableOpacity
                    onPress={onClearCustomer}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color="#a1a1aa" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.checkoutCustomerChangeBtn}
                  onPress={onOpenCustomerModal}
                >
                  <Text style={styles.checkoutCustomerChangeBtnText}>
                    {selectedCustomer ? 'Ganti' : 'Pilih'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            )}

            {/* 3. Promo, Takeaway & Tax Pills Bar */}
            {((availablePromos.length > 0 || appliedPromo) ||
              takeawayFees.length > 0 ||
              availableTaxes.length > 0) && (
              <View style={[styles.regQuickOptionsRow, { marginBottom: 6 }]}>
                {/* Promo button */}
                {(availablePromos.length > 0 || appliedPromo) && (
                  <TouchableOpacity
                    style={[
                      styles.regQuickPill,
                      appliedPromo && styles.regQuickPillPromoActive,
                    ]}
                    onPress={() => {
                      if (appliedPromo) {
                        onRemovePromo();
                      } else {
                        onOpenPromoModal();
                      }
                    }}
                  >
                    <TicketPercent size={12} color={appliedPromo ? '#ffffff' : '#a1a1aa'} />
                    <Text
                      style={[
                        styles.regQuickPillText,
                        appliedPromo && styles.regQuickPillPromoTextActive,
                      ]}
                    >
                      {appliedPromo ? appliedPromo.discount_code : 'Voucher'}
                    </Text>
                    {appliedPromo && <X size={11} color="#ffffff" style={{ marginLeft: 2 }} />}
                  </TouchableOpacity>
                )}

                {/* Takeaway toggle */}
                {takeawayFees.length > 0 && (
                  <TouchableOpacity
                    style={[styles.regQuickPill, isTakeaway && styles.regQuickPillActive]}
                    onPress={onToggleTakeaway}
                  >
                    <Package size={12} color={isTakeaway ? '#ffffff' : '#a1a1aa'} />
                    <Text
                      style={[
                        styles.regQuickPillText,
                        isTakeaway && styles.regQuickPillTextActive,
                      ]}
                    >
                      {isTakeaway ? 'Bungkus (+)' : 'Dine In'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Tax status chip */}
                {availableTaxes.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.regQuickPill,
                      selectedTaxId && styles.regQuickPillActive,
                    ]}
                    onPress={() => {
                      if (availableTaxes.length > 1) {
                        onOpenTaxModal();
                      } else {
                        if (selectedTaxId) {
                          onSelectTax('');
                        } else {
                          onSelectTax(availableTaxes[0]?.id || '');
                        }
                      }
                    }}
                  >
                    <Percent size={12} color={selectedTaxId ? '#ffffff' : '#a1a1aa'} />
                    <Text
                      style={[
                        styles.regQuickPillText,
                        selectedTaxId && styles.regQuickPillTextActive,
                      ]}
                    >
                      {selectedTaxId ? activeTax?.name || 'Pajak' : 'Tanpa Pajak'}
                    </Text>
                    {availableTaxes.length > 1 && (
                      <ChevronDown
                        size={10}
                        color={selectedTaxId ? '#ffffff' : '#a1a1aa'}
                        style={{ marginLeft: 2 }}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 4. Total Tagihan Banner (Sticky at Bottom) */}
            <View
              style={[
                styles.checkoutBillBanner,
                compact && styles.checkoutBillBannerCompact,
                { marginBottom: 0 },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.checkoutBillBannerLabel}>TOTAL TAGIHAN</Text>
                <Text
                  style={[
                    styles.checkoutBillBannerAmount,
                    compact && styles.checkoutBillBannerAmountCompact,
                  ]}
                  numberOfLines={1}
                >
                  {formatRp(totalAmount)}
                </Text>
              </View>
              <View style={styles.checkoutBillItemBadge}>
                <Text style={styles.checkoutBillItemBadgeText}>{totalItemsCount} pcs</Text>
              </View>
            </View>
          </View>

          {/* Right Column: Payment Methods, Numpad & Final CTA */}
          <View
            style={[
              styles.checkoutRightColLandscape,
              compact && styles.checkoutRightColCompactLandscape,
            ]}
          >
            {/* Payment Method Selector Tabs */}
            <View style={[styles.paymentMethodTabs, compact && styles.paymentMethodTabsCompact]}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodTab,
                  compact && styles.paymentMethodTabCompact,
                  paymentMethod === 'CASH' && styles.paymentMethodTabActive,
                ]}
                onPress={() => onSelectPaymentMethod('CASH')}
                activeOpacity={0.7}
              >
                <Banknote
                  size={compact ? 15 : 17}
                  color={paymentMethod === 'CASH' ? '#ffffff' : '#a1a1aa'}
                />
                <Text
                  style={[
                    styles.paymentMethodTabText,
                    compact && styles.paymentMethodTabTextCompact,
                    paymentMethod === 'CASH' && styles.paymentMethodTabTextActive,
                  ]}
                >
                  TUNAI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodTab,
                  compact && styles.paymentMethodTabCompact,
                  paymentMethod === 'QRIS' && styles.paymentMethodTabActive,
                ]}
                onPress={() => onSelectPaymentMethod('QRIS')}
                activeOpacity={0.7}
              >
                <QrCode
                  size={compact ? 15 : 17}
                  color={paymentMethod === 'QRIS' ? '#ffffff' : '#a1a1aa'}
                />
                <Text
                  style={[
                    styles.paymentMethodTabText,
                    compact && styles.paymentMethodTabTextCompact,
                    paymentMethod === 'QRIS' && styles.paymentMethodTabTextActive,
                  ]}
                >
                  QRIS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodTab,
                  compact && styles.paymentMethodTabCompact,
                  paymentMethod === 'TRANSFER' && styles.paymentMethodTabActive,
                ]}
                onPress={() => onSelectPaymentMethod('TRANSFER')}
                activeOpacity={0.7}
              >
                <CreditCard
                  size={compact ? 15 : 17}
                  color={paymentMethod === 'TRANSFER' ? '#ffffff' : '#a1a1aa'}
                />
                <Text
                  style={[
                    styles.paymentMethodTabText,
                    compact && styles.paymentMethodTabTextCompact,
                    paymentMethod === 'TRANSFER' && styles.paymentMethodTabTextActive,
                  ]}
                >
                  TRANSFER
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment Terminal Area */}
            {paymentMethod === 'CASH' ? (
              <View
                style={[
                  styles.cashPaymentTerminal,
                  compact && styles.cashPaymentTerminalCompact,
                ]}
              >
                {/* Cash Input & Change Due Display Banner */}
                <View
                  style={[
                    styles.cashDisplayBanner,
                    compact && styles.cashDisplayBannerCompact,
                  ]}
                >
                  <View style={styles.cashDisplayCol}>
                    <Text
                      style={[
                        styles.cashDisplayLabel,
                        compact && styles.cashDisplayLabelCompact,
                      ]}
                    >
                      UANG DITERIMA
                    </Text>
                    <Text
                      style={[
                        styles.cashDisplayAmount,
                        compact && styles.cashDisplayAmountCompact,
                      ]}
                      numberOfLines={1}
                    >
                      {paidAmount ? formatRp(paidAmount) : 'Rp0'}
                    </Text>
                  </View>

                  <View style={styles.cashDisplayDivider} />

                  {Number(paidAmount) >= totalAmount ? (
                    <View style={styles.cashDisplayCol}>
                      <Text
                        style={[
                          styles.cashDisplayLabelKembalian,
                          compact && styles.cashDisplayLabelCompact,
                        ]}
                      >
                        KEMBALIAN
                      </Text>
                      <Text
                        style={[
                          styles.cashDisplayKembalian,
                          compact && styles.cashDisplayAmountCompact,
                        ]}
                        numberOfLines={1}
                      >
                        {formatRp(Number(paidAmount) - totalAmount)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.cashDisplayCol}>
                      <Text
                        style={[
                          styles.cashDisplayLabelKurang,
                          compact && styles.cashDisplayLabelCompact,
                        ]}
                      >
                        KEKURANGAN
                      </Text>
                      <Text
                        style={[
                          styles.cashDisplayKurang,
                          compact && styles.cashDisplayAmountCompact,
                        ]}
                        numberOfLines={1}
                      >
                        {formatRp(totalAmount - (Number(paidAmount) || 0))}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Integrated Cashier Numpad & Quick Presets */}
                <View style={styles.numpadContainer}>
                  {/* Left: 3x4 Number Keypad */}
                  <View style={styles.numpadGrid}>
                    <View style={styles.numpadRow}>
                      {['1', '2', '3'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                          onPress={() => onNumpadDigit(d)}
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[
                              styles.numpadKeyText,
                              compact && styles.numpadKeyTextCompact,
                            ]}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.numpadRow}>
                      {['4', '5', '6'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                          onPress={() => onNumpadDigit(d)}
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[
                              styles.numpadKeyText,
                              compact && styles.numpadKeyTextCompact,
                            ]}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.numpadRow}>
                      {['7', '8', '9'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                          onPress={() => onNumpadDigit(d)}
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[
                              styles.numpadKeyText,
                              compact && styles.numpadKeyTextCompact,
                            ]}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.numpadRow}>
                      <TouchableOpacity
                        style={[
                          styles.numpadKey,
                          styles.numpadKeySecondary,
                          compact && styles.numpadKeyCompact,
                        ]}
                        onPress={() => onNumpadDigit('00')}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.numpadKeyText,
                            styles.numpadKeyTextSecondary,
                            compact && styles.numpadKeyTextCompact,
                          ]}
                        >
                          00
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                        onPress={() => onNumpadDigit('0')}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.numpadKeyText,
                            compact && styles.numpadKeyTextCompact,
                          ]}
                        >
                          0
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.numpadKey,
                          styles.numpadKeyDelete,
                          compact && styles.numpadKeyCompact,
                        ]}
                        onPress={onNumpadBackspace}
                        activeOpacity={0.6}
                      >
                        <Delete size={compact ? 16 : 18} color="#fb7185" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Right: Quick Cash Presets Column */}
                  <View style={styles.numpadPresetsCol}>
                    <TouchableOpacity
                      style={[
                        styles.numpadPresetBtn,
                        styles.numpadPresetBtnPas,
                        compact && styles.numpadPresetBtnCompact,
                        Number(paidAmount) === totalAmount && styles.numpadPresetBtnActivePas,
                      ]}
                      onPress={() => onNominalShortcut(totalAmount)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.numpadPresetText,
                          compact && styles.numpadPresetTextCompact,
                          Number(paidAmount) === totalAmount
                            ? styles.numpadPresetTextActive
                            : styles.numpadPresetTextPas,
                        ]}
                      >
                        Uang Pas
                      </Text>
                    </TouchableOpacity>

                    {[50000, 100000, 200000].map((val) => {
                      const isSelected = Number(paidAmount) === val;
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[
                            styles.numpadPresetBtn,
                            compact && styles.numpadPresetBtnCompact,
                            isSelected && styles.numpadPresetBtnActive,
                          ]}
                          onPress={() => onNominalShortcut(val)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.numpadPresetText,
                              compact && styles.numpadPresetTextCompact,
                              isSelected && styles.numpadPresetTextActive,
                            ]}
                          >
                            {formatRp(val)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : paymentMethod === 'QRIS' ? (
              <View style={styles.checkoutQrisTerminal}>
                <View style={styles.checkoutQrisCard}>
                  <QrCode size={compact ? 80 : 100} color="#fb7185" />
                  <Text style={styles.checkoutQrisPrompt}>Pindai QRIS Standar</Text>
                  <Text style={styles.checkoutQrisTotal}>{formatRp(totalAmount)}</Text>
                  {feeDetails.some((f) => f.name.toLowerCase().includes('qris')) && (
                    <Text style={styles.checkoutQrisFeeNote}>
                      Biaya Admin QRIS: +{formatRp(
                        feeDetails
                          .filter((f) => f.name.toLowerCase().includes('qris'))
                          .reduce((s, f) => s + f.amount, 0)
                      )}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.checkoutTransferTerminal}>
                <View style={styles.checkoutTransferCard}>
                  <CreditCard size={compact ? 36 : 44} color="#60a5fa" />
                  <Text style={styles.checkoutTransferTitle}>Transfer Bank / EDC</Text>
                  <Text style={styles.checkoutTransferSub}>
                    Konfirmasi pembayaran setelah struk mesin EDC tercetak atau mutasi dana masuk ke
                    rekening.
                  </Text>
                  <View style={styles.checkoutTransferAmountBox}>
                    <Text style={styles.checkoutTransferAmountLabel}>Nominal Tagihan:</Text>
                    <Text style={styles.checkoutTransferAmountVal}>{formatRp(totalAmount)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Bottom Checkout CTA Button */}
            <TouchableOpacity
              style={[
                styles.checkoutSubmitBtn,
                compact && styles.checkoutSubmitBtnCompact,
                paymentMethod === 'CASH' &&
                  Number(paidAmount) < totalAmount &&
                  styles.checkoutSubmitBtnDisabled,
                checkoutLoading && styles.checkoutSubmitBtnDisabled,
              ]}
              onPress={onProcessCheckout}
              disabled={
                checkoutLoading ||
                (paymentMethod === 'CASH' && Number(paidAmount) < totalAmount)
              }
              activeOpacity={0.8}
            >
              {checkoutLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.checkoutSubmitBtnContent}>
                  <Check size={17} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.checkoutSubmitBtnText}>
                    {paymentMethod === 'CASH' && Number(paidAmount) < totalAmount
                      ? `Uang Kurang (${formatRp(totalAmount - (Number(paidAmount) || 0))})`
                      : 'Selesaikan Pembayaran'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Portrait Dedicated Checkout View */
        <ScrollView
          style={styles.checkoutBodyPortrait}
          contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Order Items Card (Daftar Pesanan) */}
          <View style={styles.checkoutOrderCardPortrait}>
            <View style={styles.checkoutItemsHeader}>
              <Text style={styles.checkoutItemsTitle}>Daftar Pesanan ({cart.length})</Text>
              <Text style={styles.checkoutItemsTotalQty}>{totalItemsCount} Total Qty</Text>
            </View>
            {cart.map((item) => {
              const itemUnit =
                item.product.unitSymbol ||
                item.product.base_unit?.symbol ||
                item.product.baseUnit?.symbol ||
                'pcs';
              const availableStock = parseFloat(item.product.stock) || 0;
              return (
                <View key={item.product.id} style={styles.checkoutItemRowMiniPortrait}>
                  <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <Text style={styles.checkoutItemNameMini} numberOfLines={1} ellipsizeMode="tail">
                      {item.product.name}
                    </Text>
                    <Text style={styles.checkoutItemPriceMini}>
                      {item.quantity} {itemUnit} x {formatRp(item.product.price)} ={' '}
                      <Text style={{ color: '#fb7185', fontWeight: 'bold' }}>
                        {formatRp(item.quantity * Number(item.product.price))}
                      </Text>
                    </Text>
                  </View>

                  {/* Stepper Controls & Delete */}
                  <View style={styles.checkoutItemStepperRow}>
                    <TouchableOpacity
                      style={styles.checkoutItemStepBtn}
                      onPress={() => onUpdateQuantity(item.product.id, -1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={11} color="#ffffff" />
                    </TouchableOpacity>

                    <Text style={styles.checkoutItemQtyText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={[
                        styles.checkoutItemStepBtn,
                        item.quantity >= availableStock && { opacity: 0.35 },
                      ]}
                      onPress={() => onUpdateQuantity(item.product.id, 1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={11} color="#ffffff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkoutItemDeleteBtn}
                      onPress={() => onRemoveItem(item.product.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Trash2 size={13} color="#fb7185" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 2. Customer Selector Bar */}
          {showCustomerPicker && (
          <View style={styles.checkoutCustomerCardPortrait}>
            <View style={styles.checkoutCustomerCardLeft}>
              <View
                style={[
                  styles.checkoutCustomerAvatar,
                  selectedCustomer && styles.checkoutCustomerAvatarActive,
                ]}
              >
                <Users size={15} color={selectedCustomer ? '#fb7185' : '#a1a1aa'} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.checkoutCustomerName} numberOfLines={1} ellipsizeMode="tail">
                  {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum'}
                </Text>
                {selectedCustomer ? (
                  <View style={styles.checkoutCustomerMetaRow}>
                    <View style={styles.checkoutMembershipBadge}>
                      <Text style={styles.checkoutMembershipBadgeText}>
                        {selectedCustomer.membership_type || 'REGULAR'}
                      </Text>
                    </View>
                    {selectedCustomer.phone && (
                      <Text style={styles.checkoutCustomerPhone} numberOfLines={1}>
                        {selectedCustomer.phone}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.checkoutCustomerSub}>Walk-in (Tanpa Member)</Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {selectedCustomer && (
                <TouchableOpacity
                  onPress={onClearCustomer}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color="#a1a1aa" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.checkoutCustomerChangeBtn}
                onPress={onOpenCustomerModal}
              >
                <Text style={styles.checkoutCustomerChangeBtnText}>
                  {selectedCustomer ? 'Ganti' : 'Pilih'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {/* 3. Voucher & Adjustments Section */}
          <View style={styles.checkoutVoucherSectionPortrait}>
            {appliedPromo ? (
              <View style={styles.appliedPromoBadgePortrait}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TicketPercent size={18} color="#34d399" />
                  <View>
                    <Text style={styles.appliedPromoCodeText}>{appliedPromo.discount_code}</Text>
                    <Text style={styles.appliedPromoSub}>
                      {appliedPromo.discount_type === 'PERCENTAGE'
                        ? `Diskon ${appliedPromo.discount_value}% (-${formatRp(discount)})`
                        : `Potongan -${formatRp(discount)}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removePromoBtn}
                  onPress={onRemovePromo}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color="#fb7185" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.voucherInputRowPortrait}>
                <TextInput
                  style={styles.voucherTextInputPortrait}
                  placeholder="Kode voucher promo..."
                  placeholderTextColor="#71717a"
                  value={voucherInput}
                  onChangeText={onChangeVoucherInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[
                    styles.applyVoucherBtnPortrait,
                    !voucherInput.trim() && { opacity: 0.5 },
                  ]}
                  onPress={() => onApplyVoucher(voucherInput)}
                  disabled={!voucherInput.trim() || voucherLoading}
                >
                  {voucherLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.applyVoucherBtnTextPortrait}>Gunakan</Text>
                  )}
                </TouchableOpacity>
                {availablePromos.length > 0 && (
                  <TouchableOpacity
                    style={styles.browseVoucherBtnPortrait}
                    onPress={onOpenPromoModal}
                  >
                    <Sparkles size={15} color="#fb7185" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Quick Chips: Takeaway & Tax */}
            <View style={styles.checkoutQuickChipsRowPortrait}>
              {takeawayFees.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.checkoutQuickChip,
                    isTakeaway && styles.checkoutQuickChipActive,
                  ]}
                  onPress={onToggleTakeaway}
                >
                  <Package size={13} color={isTakeaway ? '#ffffff' : '#a1a1aa'} />
                  <Text
                    style={[
                      styles.checkoutQuickChipText,
                      isTakeaway && styles.checkoutQuickChipTextActive,
                    ]}
                  >
                    {isTakeaway ? 'Bungkus (+)' : 'Dine In'}
                  </Text>
                </TouchableOpacity>
              )}

              {availableTaxes.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.checkoutQuickChip,
                    selectedTaxId && styles.checkoutQuickChipActive,
                  ]}
                  onPress={() => {
                    if (availableTaxes.length > 1) {
                      onOpenTaxModal();
                    } else {
                      if (selectedTaxId) {
                        onSelectTax('');
                      } else {
                        onSelectTax(availableTaxes[0]?.id || '');
                      }
                    }
                  }}
                >
                  <Percent size={13} color={selectedTaxId ? '#ffffff' : '#a1a1aa'} />
                  <Text
                    style={[
                      styles.checkoutQuickChipText,
                      selectedTaxId && styles.checkoutQuickChipTextActive,
                    ]}
                  >
                    {selectedTaxId ? activeTax?.name || 'Pajak' : 'Tanpa Pajak'}
                  </Text>
                  {availableTaxes.length > 1 && (
                    <ChevronDown
                      size={11}
                      color={selectedTaxId ? '#ffffff' : '#a1a1aa'}
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 4. Financial Adjustments Breakdown */}
          {hasBillAdjustments && (
            <View style={styles.checkoutAdjustmentsBoxPortrait}>
              <View style={styles.checkoutAdjustmentRow}>
                <Text style={styles.checkoutAdjustmentLabel}>Subtotal</Text>
                <Text style={styles.checkoutAdjustmentVal}>{formatRp(subtotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.checkoutAdjustmentRow}>
                  <Text
                    style={[styles.checkoutAdjustmentLabel, { color: '#34d399' }]}
                    numberOfLines={1}
                  >
                    Diskon ({appliedPromo?.discount_code || 'Promo'})
                  </Text>
                  <Text style={[styles.checkoutAdjustmentVal, { color: '#34d399' }]}>
                    -{formatRp(discount)}
                  </Text>
                </View>
              )}
              {taxAmount > 0 && (
                <View style={styles.checkoutAdjustmentRow}>
                  <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>
                    Pajak ({activeTax?.name || 'PPN'})
                  </Text>
                  <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                    +{formatRp(taxAmount)}
                  </Text>
                </View>
              )}
              {feeAmount > 0 && (
                <View style={styles.checkoutAdjustmentRow}>
                  <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>
                    Biaya Layanan
                  </Text>
                  <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                    +{formatRp(feeAmount)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 5. Total Tagihan Banner */}
          <View style={[styles.checkoutBillBannerPortrait, { marginBottom: 14 }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.checkoutBillBannerLabel}>TOTAL TAGIHAN</Text>
              <Text style={styles.checkoutBillBannerAmountPortrait} numberOfLines={1}>
                {formatRp(totalAmount)}
              </Text>
            </View>
            <View style={styles.checkoutBillItemBadge}>
              <Text style={styles.checkoutBillItemBadgeText}>{totalItemsCount} pcs</Text>
            </View>
          </View>

          {/* 6. Payment Method Selector */}
          <Text style={styles.checkoutSectionTitlePortrait}>Metode Pembayaran</Text>
          <View style={styles.paymentMethodTabsPortrait}>
            <TouchableOpacity
              style={[
                styles.paymentMethodTab,
                paymentMethod === 'CASH' && styles.paymentMethodTabActive,
              ]}
              onPress={() => onSelectPaymentMethod('CASH')}
              activeOpacity={0.7}
            >
              <Banknote
                size={16}
                color={paymentMethod === 'CASH' ? '#ffffff' : '#a1a1aa'}
              />
              <Text
                style={[
                  styles.paymentMethodTabText,
                  paymentMethod === 'CASH' && styles.paymentMethodTabTextActive,
                ]}
              >
                TUNAI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethodTab,
                paymentMethod === 'QRIS' && styles.paymentMethodTabActive,
              ]}
              onPress={() => onSelectPaymentMethod('QRIS')}
              activeOpacity={0.7}
            >
              <QrCode
                size={16}
                color={paymentMethod === 'QRIS' ? '#ffffff' : '#a1a1aa'}
              />
              <Text
                style={[
                  styles.paymentMethodTabText,
                  paymentMethod === 'QRIS' && styles.paymentMethodTabTextActive,
                ]}
              >
                QRIS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethodTab,
                paymentMethod === 'TRANSFER' && styles.paymentMethodTabActive,
              ]}
              onPress={() => onSelectPaymentMethod('TRANSFER')}
              activeOpacity={0.7}
            >
              <CreditCard
                size={16}
                color={paymentMethod === 'TRANSFER' ? '#ffffff' : '#a1a1aa'}
              />
              <Text
                style={[
                  styles.paymentMethodTabText,
                  paymentMethod === 'TRANSFER' && styles.paymentMethodTabTextActive,
                ]}
              >
                TRANSFER
              </Text>
            </TouchableOpacity>
          </View>

          {paymentMethod === 'CASH' ? (
            <View style={styles.cashSectionPortrait}>
              {/* Cash Display Banner */}
              <View style={styles.cashDisplayBannerPortrait}>
                <View style={styles.cashDisplayCol}>
                  <Text style={styles.cashDisplayLabel}>UANG DITERIMA</Text>
                  <Text style={styles.cashDisplayAmountPortrait} numberOfLines={1}>
                    {paidAmount ? formatRp(paidAmount) : 'Rp0'}
                  </Text>
                </View>
                <View style={styles.cashDisplayDivider} />
                {Number(paidAmount) >= totalAmount ? (
                  <View style={styles.cashDisplayCol}>
                    <Text style={styles.cashDisplayLabelKembalian}>KEMBALIAN</Text>
                    <Text style={styles.cashDisplayKembalianPortrait} numberOfLines={1}>
                      {formatRp(Number(paidAmount) - totalAmount)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cashDisplayCol}>
                    <Text style={styles.cashDisplayLabelKurang}>KEKURANGAN</Text>
                    <Text style={styles.cashDisplayKurangPortrait} numberOfLines={1}>
                      {formatRp(totalAmount - (Number(paidAmount) || 0))}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Nominal Presets Row */}
              <View style={styles.quickNominalsRowPortrait}>
                <TouchableOpacity
                  style={[
                    styles.quickNominalBtnPortrait,
                    Number(paidAmount) === totalAmount && styles.quickNominalBtnActivePortrait,
                  ]}
                  onPress={() => onNominalShortcut(totalAmount)}
                >
                  <Text
                    style={[
                      styles.quickNominalBtnTextPortrait,
                      Number(paidAmount) === totalAmount && styles.quickNominalBtnTextActivePortrait,
                    ]}
                  >
                    Uang Pas
                  </Text>
                </TouchableOpacity>
                {[50000, 100000, 200000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.quickNominalBtnPortrait,
                      Number(paidAmount) === val && styles.quickNominalBtnActivePortrait,
                    ]}
                    onPress={() => onNominalShortcut(val)}
                  >
                    <Text
                      style={[
                        styles.quickNominalBtnTextPortrait,
                        Number(paidAmount) === val && styles.quickNominalBtnTextActivePortrait,
                      ]}
                    >
                      {formatRp(val)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Portrait Integrated Numpad */}
              <View style={styles.numpadGridPortrait}>
                <View style={styles.numpadRow}>
                  {['1', '2', '3'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.numpadKeyPortrait}
                      onPress={() => onNumpadDigit(d)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.numpadKeyText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.numpadRow}>
                  {['4', '5', '6'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.numpadKeyPortrait}
                      onPress={() => onNumpadDigit(d)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.numpadKeyText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.numpadRow}>
                  {['7', '8', '9'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.numpadKeyPortrait}
                      onPress={() => onNumpadDigit(d)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.numpadKeyText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.numpadRow}>
                  <TouchableOpacity
                    style={[styles.numpadKeyPortrait, styles.numpadKeySecondary]}
                    onPress={() => onNumpadDigit('00')}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.numpadKeyText, styles.numpadKeyTextSecondary]}>00</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.numpadKeyPortrait}
                    onPress={() => onNumpadDigit('0')}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.numpadKeyText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.numpadKeyPortrait, styles.numpadKeyDelete]}
                    onPress={onNumpadBackspace}
                    activeOpacity={0.6}
                  >
                    <Delete size={18} color="#fb7185" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : paymentMethod === 'QRIS' ? (
            <View style={[styles.checkoutQrisCard, { marginTop: 8, maxWidth: '100%' }]}>
              <QrCode size={90} color="#fb7185" />
              <Text style={styles.checkoutQrisPrompt}>Pindai QRIS Toko</Text>
              <Text style={styles.checkoutQrisTotal}>{formatRp(totalAmount)}</Text>
              {feeDetails.some((f) => f.name.toLowerCase().includes('qris')) && (
                <Text style={styles.checkoutQrisFeeNote}>
                  Biaya Admin QRIS: +{formatRp(
                    feeDetails
                      .filter((f) => f.name.toLowerCase().includes('qris'))
                      .reduce((s, f) => s + f.amount, 0)
                  )}
                </Text>
              )}
            </View>
          ) : (
            <View style={[styles.checkoutTransferCard, { marginTop: 8, maxWidth: '100%' }]}>
              <View style={styles.checkoutTransferIconBox}>
                <CreditCard size={40} color="#60a5fa" />
              </View>
              <Text style={styles.checkoutTransferTitle}>Transfer Bank / EDC</Text>
              <Text style={styles.checkoutTransferSub}>
                Pastikan mutasi dana atau struk EDC telah keluar sebelum mengonfirmasi pembayaran.
              </Text>
            </View>
          )}

          {/* 7. Action CTA Button */}
          <TouchableOpacity
            style={[
              styles.checkoutSubmitBtn,
              { marginTop: 16, paddingVertical: 14, borderRadius: 14 },
              paymentMethod === 'CASH' &&
                Number(paidAmount) < totalAmount &&
                styles.checkoutSubmitBtnDisabled,
              checkoutLoading && styles.checkoutSubmitBtnDisabled,
            ]}
            onPress={onProcessCheckout}
            disabled={
              checkoutLoading ||
              (paymentMethod === 'CASH' && Number(paidAmount) < totalAmount)
            }
            activeOpacity={0.8}
          >
            {checkoutLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.checkoutSubmitBtnContent}>
                <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={[styles.checkoutSubmitBtnText, { fontSize: 14 }]}>
                  {paymentMethod === 'CASH' && Number(paidAmount) < totalAmount
                    ? `Uang Kurang (${formatRp(totalAmount - (Number(paidAmount) || 0))})`
                    : 'Selesaikan Pembayaran'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkoutRoot: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  checkoutHeaderLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  checkoutHeaderCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  checkoutBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutBackText: {
    color: '#fb7185',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutTitleBox: {
    alignItems: 'center',
  },
  checkoutTitleText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  checkoutHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checkoutItemBadgeText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutBodyLandscape: {
    flex: 1,
    flexDirection: 'row',
  },
  checkoutLeftColLandscape: {
    width: '38%',
    backgroundColor: '#18181b',
    borderRightWidth: 1,
    borderRightColor: '#27272a',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  checkoutLeftColCompactLandscape: {
    width: '36%',
    padding: 8,
  },
  checkoutRightColLandscape: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  checkoutRightColCompactLandscape: {
    padding: 8,
  },
  checkoutBillBanner: {
    backgroundColor: '#26141a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  checkoutBillBannerCompact: {
    padding: 8,
    marginBottom: 6,
  },
  checkoutBillBannerLabel: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  checkoutBillBannerAmount: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  checkoutBillBannerAmountCompact: {
    fontSize: 16,
  },
  checkoutBillItemBadge: {
    backgroundColor: '#3b0d19',
    borderWidth: 1,
    borderColor: '#881337',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  checkoutBillItemBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutCustomerCard: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  checkoutCustomerCardCompact: {
    padding: 6,
    marginBottom: 6,
  },
  checkoutCustomerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  checkoutCustomerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3f3f46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutCustomerAvatarActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
  },
  checkoutCustomerName: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutCustomerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  checkoutMembershipBadge: {
    backgroundColor: '#3b0d19',
    borderWidth: 1,
    borderColor: '#881337',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  checkoutMembershipBadgeText: {
    color: '#fda4af',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutCustomerPhone: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  checkoutCustomerSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  checkoutCustomerChangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#3f3f46',
  },
  checkoutCustomerChangeBtnText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  checkoutLeftScroll: {
    flex: 1,
    minHeight: 0,
  },
  checkoutLeftScrollCompact: {
    flex: 1,
    minHeight: 0,
  },
  regQuickOptionsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  regQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  regQuickPillActive: {
    borderColor: '#881337',
    backgroundColor: '#3b0d19',
  },
  regQuickPillPromoActive: {
    borderColor: '#065f46',
    backgroundColor: '#062d22',
  },
  regQuickPillText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  regQuickPillTextActive: {
    color: '#fda4af',
    fontFamily: 'Poppins_600SemiBold',
  },
  regQuickPillPromoTextActive: {
    color: '#6ee7b7',
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutAdjustmentsBox: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 8,
    gap: 4,
    marginBottom: 10,
  },
  checkoutAdjustmentsBoxCompact: {
    padding: 6,
    marginBottom: 6,
  },
  checkoutAdjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutAdjustmentLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  checkoutAdjustmentVal: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutItemsListCard: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 10,
  },
  checkoutItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkoutItemsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutItemsTotalQty: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  checkoutItemRowMini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  checkoutItemNameMini: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  checkoutItemPriceMini: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  paymentMethodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  paymentMethodTabsCompact: {
    gap: 6,
    marginBottom: 6,
  },
  paymentMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  paymentMethodTabCompact: {
    paddingVertical: 6,
  },
  paymentMethodTabActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  paymentMethodTabText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  paymentMethodTabTextCompact: {
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  paymentMethodTabTextActive: {
    color: '#ffffff',
  },
  cashPaymentTerminal: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cashPaymentTerminalCompact: {
    gap: 4,
  },
  cashDisplayBanner: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 8,
  },
  cashDisplayBannerCompact: {
    padding: 6,
    marginBottom: 4,
  },
  cashDisplayCol: {
    flex: 1,
  },
  cashDisplayDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#27272a',
    marginHorizontal: 10,
  },
  cashDisplayLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  cashDisplayLabelCompact: {
    fontSize: 12,
  },
  cashDisplayAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  cashDisplayAmountCompact: {
    fontSize: 15,
  },
  cashDisplayLabelKembalian: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cashDisplayKembalian: {
    color: '#34d399',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  cashDisplayLabelKurang: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cashDisplayKurang: {
    color: '#fb7185',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  numpadContainer: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  numpadGrid: {
    flex: 1,
    gap: 6,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  numpadKey: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  numpadKeyCompact: {
    paddingVertical: 0,
  },
  numpadKeySecondary: {
    backgroundColor: '#27272a',
  },
  numpadKeyDelete: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  numpadKeyText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  numpadKeyTextCompact: {
    fontSize: 15,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  numpadKeyTextSecondary: {
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  numpadPresetsCol: {
    width: 100,
    gap: 6,
  },
  numpadPresetBtn: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 4,
  },
  numpadPresetBtnCompact: {
    paddingVertical: 0,
  },
  numpadPresetBtnPas: {
    backgroundColor: '#27272a',
  },
  numpadPresetBtnActivePas: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  numpadPresetBtnActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    borderColor: '#e11d48',
  },
  numpadPresetText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  numpadPresetTextCompact: {
    fontSize: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  numpadPresetTextPas: {
    color: '#ffffff',
  },
  numpadPresetTextActive: {
    color: '#ffffff',
  },
  checkoutQrisTerminal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutQrisCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    width: '100%',
    maxWidth: 320,
  },
  checkoutQrisPrompt: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 10,
  },
  checkoutQrisTotal: {
    color: '#fb7185',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
  },
  checkoutQrisFeeNote: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 6,
  },
  checkoutTransferTerminal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutTransferCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    width: '100%',
    maxWidth: 360,
  },
  checkoutTransferIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkoutTransferTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
  },
  checkoutTransferSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  checkoutTransferAmountBox: {
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutTransferAmountLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  checkoutTransferAmountVal: {
    color: '#60a5fa',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  checkoutSubmitBtn: {
    backgroundColor: '#e11d48',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  checkoutSubmitBtnCompact: {
    paddingVertical: 8,
    marginTop: 6,
  },
  checkoutSubmitBtnDisabled: {
    opacity: 0.4,
  },
  checkoutSubmitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  checkoutBodyPortrait: {
    flex: 1,
  },
  checkoutBillBannerPortrait: {
    backgroundColor: '#26141a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkoutBillBannerAmountPortrait: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  checkoutCustomerCardPortrait: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkoutAdjustmentsBoxPortrait: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
    marginBottom: 12,
  },
  checkoutOrderCardPortrait: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 12,
  },
  checkoutItemRowMiniPortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  checkoutItemStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkoutItemStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  checkoutItemQtyText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    minWidth: 16,
    textAlign: 'center',
  },
  checkoutItemDeleteBtn: {
    padding: 4,
    marginLeft: 2,
  },
  checkoutVoucherSectionPortrait: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
    gap: 10,
  },
  appliedPromoBadgePortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  appliedPromoCodeText: {
    color: '#34d399',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  appliedPromoSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  removePromoBtn: {
    padding: 4,
  },
  voucherInputRowPortrait: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherTextInputPortrait: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    borderWidth: 1,
    borderColor: '#3f3f46',
    height: 40,
  },
  applyVoucherBtnPortrait: {
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyVoucherBtnTextPortrait: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  browseVoucherBtnPortrait: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  checkoutQuickChipsRowPortrait: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  checkoutQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  checkoutQuickChipActive: {
    borderColor: '#881337',
    backgroundColor: '#3b0d19',
  },
  checkoutQuickChipText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  checkoutQuickChipTextActive: {
    color: '#fda4af',
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutSectionTitlePortrait: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  paymentMethodTabsPortrait: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cashSectionPortrait: {
    gap: 10,
  },
  cashDisplayBannerPortrait: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cashDisplayAmountPortrait: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  cashDisplayKembalianPortrait: {
    color: '#34d399',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  cashDisplayKurangPortrait: {
    color: '#fb7185',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  quickNominalsRowPortrait: {
    flexDirection: 'row',
    gap: 8,
  },
  quickNominalBtnPortrait: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  quickNominalBtnActivePortrait: {
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    borderColor: '#e11d48',
  },
  quickNominalBtnTextPortrait: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  quickNominalBtnTextActivePortrait: {
    color: '#fb7185',
  },
  numpadGridPortrait: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  numpadKeyPortrait: {
    flex: 1,
    height: 48,
    backgroundColor: '#27272a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});