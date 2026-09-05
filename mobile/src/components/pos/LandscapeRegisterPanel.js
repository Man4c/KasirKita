import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  ShoppingCart,
  Users,
  Trash2,
  Minus,
  Plus,
  TicketPercent,
  X,
  Package,
  Percent,
  ChevronDown,
  ArrowRight,
  ScanBarcode,
  Smartphone,
} from 'lucide-react-native';

export default function LandscapeRegisterPanel({
  compact,
  totalItemsCount,
  selectedCustomer,
  showCustomerPicker = true,
  showVoucherFeature = true,
  showTaxFeature = true,
  onOpenCustomerModal,
  onSwitchToPortrait,
  isScanMode = false,
  onToggleScanMode,
  cart,
  onClearCart,
  onUpdateQuantity,
  availablePromos,
  appliedPromo,
  onOpenPromoModal,
  onRemovePromo,
  takeawayFees,
  isTakeaway,
  onToggleTakeaway,
  availableTaxes,
  selectedTaxId,
  activeTax,
  onSelectTax,
  onOpenTaxModal,
  hasBillAdjustments,
  subtotal,
  discount,
  taxAmount,
  feeAmount,
  totalAmount,
  onProceedToCheckout,
  formatRp,
}) {
  return (
    <View style={[styles.landscapeRegisterCol, compact && styles.landscapeRegisterColCompact]}>
      {/* Register Column Header */}
      <View
        style={[
          styles.registerHeader,
          styles.landscapeRegisterHeader,
          compact && styles.landscapeRegisterHeaderCompact,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <ShoppingCart size={compact ? 14 : 16} color="#fb7185" />
          <Text style={styles.registerTitle}>Keranjang</Text>
          <View style={styles.registerCountBadge}>
            <Text style={styles.registerCountText}>{totalItemsCount}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Portrait Switch Button ("Portrait") */}
          {onSwitchToPortrait && (
            <TouchableOpacity
              style={styles.regPortraitBtn}
              onPress={onSwitchToPortrait}
              activeOpacity={0.7}
            >
              <Smartphone size={12} color="#fb7185" />
              <Text style={styles.regPortraitBtnText} numberOfLines={1}>
                Portrait
              </Text>
            </TouchableOpacity>
          )}

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <TouchableOpacity style={styles.regClearBtn} onPress={onClearCart}>
              <Trash2 size={15} color="#ffffff" />
            </TouchableOpacity>
          )}

          {/* Barcode Scanner Toggle Button */}
          {onToggleScanMode && (
            <TouchableOpacity
              style={[
                styles.regScanBtn,
                isScanMode && styles.regScanBtnActive,
              ]}
              onPress={onToggleScanMode}
              activeOpacity={0.7}
            >
              <ScanBarcode size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cart Item Rows */}
      {cart.length === 0 ? (
        <View style={[styles.registerEmptyBox, compact && styles.registerEmptyBoxCompact]}>
          <ShoppingCart
            size={compact ? 28 : 36}
            color="#71717a"
            style={{ marginBottom: compact ? 6 : 12 }}
          />
          <Text style={[styles.registerEmptyTitle, compact && { fontSize: 13 }]}>Keranjang Kosong</Text>
          <Text style={styles.registerEmptySub}>Pilih produk di kiri untuk memulai pesanan.</Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.registerItemsScroll, compact && styles.registerItemsScrollCompact]}
          showsVerticalScrollIndicator={true}
        >
          {cart.map((item) => {
            return (
              <View
                key={item.product.id}
                style={[styles.regItemRow, compact && styles.regItemRowCompact]}
              >
                <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <Text style={styles.regItemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.regItemPrice}>
                    {formatRp(item.product.price)} x {item.quantity} ={' '}
                    <Text style={{ color: '#fb7185', fontWeight: 'bold' }}>
                      {formatRp(item.product.price * item.quantity)}
                    </Text>
                  </Text>
                </View>

                {/* Qty Controls */}
                <View style={styles.regQtyBox}>
                  <TouchableOpacity
                    style={styles.regQtyBtn}
                    onPress={() => onUpdateQuantity(item.product.id, -1)}
                  >
                    <Minus size={12} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.regQtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[
                      styles.regQtyBtn,
                      item.quantity >= (parseFloat(item.product.stock) || 0) && { opacity: 0.35 },
                    ]}
                    onPress={() => onUpdateQuantity(item.product.id, 1)}
                  >
                    <Plus size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Register Footer */}
      <View style={[styles.registerFooter, compact && styles.registerFooterCompact]}>
        {/* Quick Fee & Promo Pills */}
        {((showVoucherFeature && (availablePromos.length > 0 || appliedPromo)) ||
          takeawayFees.length > 0 ||
          (showTaxFeature && availableTaxes.length > 0)) && (
            <View
              style={[styles.regQuickOptionsRow, compact && styles.regQuickOptionsRowCompact]}
            >
              {/* Promo button */}
              {showVoucherFeature && (availablePromos.length > 0 || appliedPromo) && (
                <TouchableOpacity
                  style={[
                    styles.regQuickPill,
                    compact && styles.regQuickPillCompact,
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
                  style={[
                    styles.regQuickPill,
                    compact && styles.regQuickPillCompact,
                    isTakeaway && styles.regQuickPillActive,
                  ]}
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
              {showTaxFeature && availableTaxes.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.regQuickPill,
                    compact && styles.regQuickPillCompact,
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

        {/* Bill Summary Rows */}
        {hasBillAdjustments && (
          <View style={[styles.regSummaryBox, compact && styles.regSummaryBoxCompact]}>
            <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
              <Text style={styles.regSummaryLabel}>Subtotal</Text>
              <Text style={styles.regSummaryValue}>{formatRp(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
                <Text style={[styles.regSummaryLabel, { color: '#34d399' }]}>Diskon</Text>
                <Text style={[styles.regSummaryValue, { color: '#34d399' }]}>
                  -{formatRp(discount)}
                </Text>
              </View>
            )}
            {taxAmount > 0 && (
              <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
                <Text style={styles.regSummaryLabel}>Pajak ({activeTax?.name})</Text>
                <Text style={[styles.regSummaryValue, { color: '#fb7185' }]}>
                  +{formatRp(taxAmount)}
                </Text>
              </View>
            )}
            {feeAmount > 0 && (
              <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
                <Text style={styles.regSummaryLabel}>Biaya Layanan</Text>
                <Text style={[styles.regSummaryValue, { color: '#fb7185' }]}>
                  +{formatRp(feeAmount)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Total Row & Pay Button */}
        <View
          style={[
            styles.regPayRow,
            compact && styles.regPayRowCompact,
            !hasBillAdjustments &&
            !((showVoucherFeature && (availablePromos.length > 0 || appliedPromo)) ||
              takeawayFees.length > 0 ||
              (showTaxFeature && availableTaxes.length > 0)) && { borderTopWidth: 0, paddingTop: 0 },
          ]}
        >
          <View>
            <Text style={styles.regTotalLabel}>TOTAL BAYAR</Text>
            <Text style={[styles.regTotalAmount, compact && styles.regTotalAmountCompact]}>
              {formatRp(totalAmount)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.regPayButton,
              compact && styles.regPayButtonCompact,
              cart.length === 0 && { opacity: 0.4 },
            ]}
            disabled={cart.length === 0}
            onPress={onProceedToCheckout}
          >
            <Text
              style={[
                styles.regPayButtonText,
                compact && styles.regPayButtonTextCompact,
              ]}
            >
              Bayar Kasir
            </Text>
            <ArrowRight size={compact ? 13 : 15} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  landscapeRegisterCol: {
    flex: 0.85,
    backgroundColor: '#18181b',
    borderLeftWidth: 1,
    borderLeftColor: '#27272a',
    display: 'flex',
    flexDirection: 'column',
  },
  landscapeRegisterColCompact: {
    flex: 0.8,
  },
  registerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  landscapeRegisterHeader: {
    height: 48,
    maxHeight: 48,
    paddingVertical: 0,
  },
  landscapeRegisterHeaderCompact: {
    height: 40,
    maxHeight: 40,
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  registerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  registerCountBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 9999,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  regPortraitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  regPortraitBtnText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
  },
  regScanBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  regScanBtnActive: {
    backgroundColor: '#be123c',
    borderColor: '#9f1239',
  },
  regClearBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  registerEmptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  registerEmptyBoxCompact: {
    padding: 12,
  },
  registerEmptyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  registerEmptySub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  registerItemsScroll: {
    flex: 1,
    paddingHorizontal: 10,
  },
  registerItemsScrollCompact: {
    paddingHorizontal: 6,
  },
  regItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  regItemRowCompact: {
    paddingVertical: 4,
  },
  regItemName: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 2,
  },
  regItemPrice: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  regQtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regQtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  regQtyText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    minWidth: 16,
    textAlign: 'center',
  },
  registerFooter: {
    padding: 10,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    gap: 8,
  },
  registerFooterCompact: {
    padding: 6,
    gap: 4,
  },
  regQuickOptionsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  regQuickOptionsRowCompact: {
    gap: 4,
  },
  regQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  regQuickPillCompact: {
    paddingHorizontal: 6,
    height: 24,
  },
  regQuickPillActive: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  regQuickPillPromoActive: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
  regQuickPillText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  regQuickPillTextActive: {
    color: '#fb7185',
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  regQuickPillPromoTextActive: {
    color: '#34d399',
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  regSummaryBox: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  regSummaryBoxCompact: {
    padding: 6,
    gap: 2,
  },
  regSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regSummaryRowCompact: {
    paddingVertical: 0,
  },
  regSummaryLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  regSummaryValue: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  regPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  regPayRowCompact: {
    paddingTop: 2,
  },
  regTotalLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  regTotalAmount: {
    color: '#fb7185',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  regTotalAmountCompact: {
    fontSize: 14,
  },
  regPayButton: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  regPayButtonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  regPayButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  regPayButtonTextCompact: {
    fontSize: 12,
  },
});
