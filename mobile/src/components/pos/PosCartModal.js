import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  ShoppingCart,
  Trash2,
  X,
  Minus,
  Plus,
  ArrowRight,
} from 'lucide-react-native';

export default function PosCartModal({
  visible,
  isLandscape,
  onClose,
  cart,
  totalItemsCount,
  totalAmount,
  formatRp,
  onClearCart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) {
  return (
    <Modal
      visible={visible && !isLandscape}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.cartSheetOverlay}>
        <TouchableOpacity
          style={styles.cartSheetBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.cartSheetContent}>
          {/* Header */}
          <View style={styles.cartSheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <View style={styles.cartSheetHeaderIcon}>
                <ShoppingCart size={16} color="#fb7185" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cartSheetTitle}>Keranjang Pesanan</Text>
                <Text style={styles.cartSheetSubtitle}>{cart.length} jenis • {totalItemsCount} total item</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {cart.length > 0 && (
                <TouchableOpacity
                  style={styles.cartSheetClearBtn}
                  onPress={onClearCart}
                  activeOpacity={0.7}
                >
                  <Trash2 size={13} color="#fb7185" />
                  <Text style={styles.cartSheetClearText}>Kosongkan</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <View style={styles.cartSheetEmptyBox}>
              <ShoppingCart size={38} color="#3f3f46" />
              <Text style={styles.cartSheetEmptyTitle}>Keranjang Kosong</Text>
              <Text style={styles.cartSheetEmptySub}>Pilih produk dari katalog untuk memulai transaksi.</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {cart.map((item) => {
                const itemUnit = item.product.unitSymbol || item.product.base_unit?.symbol || item.product.baseUnit?.symbol || 'pcs';
                const itemPrice = Number(item.product.price);
                const itemSubtotal = item.quantity * itemPrice;
                const availableStock = parseFloat(item.product.stock) || 0;

                return (
                  <View key={item.product.id} style={styles.cartSheetItemRow}>
                    {/* Item Info (Left) */}
                    <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                      <Text style={styles.cartSheetItemName} numberOfLines={1} ellipsizeMode="tail">
                        {item.product.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={styles.cartSheetItemPrice}>{formatRp(itemPrice)}/{itemUnit}</Text>
                        <Text style={styles.cartSheetItemDot}>•</Text>
                        <Text style={styles.cartSheetItemSubtotal}>{formatRp(itemSubtotal)}</Text>
                      </View>
                    </View>

                    {/* Stepper Controls & Delete (Right) */}
                    <View style={styles.cartSheetStepperRow}>
                      <TouchableOpacity
                        style={styles.cartSheetStepBtn}
                        onPress={() => onUpdateQuantity(item.product.id, -1)}
                        activeOpacity={0.7}
                      >
                        <Minus size={13} color="#ffffff" />
                      </TouchableOpacity>

                      <Text style={styles.cartSheetQtyText}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={[
                          styles.cartSheetStepBtn,
                          item.quantity >= availableStock && { opacity: 0.35 },
                        ]}
                        onPress={() => onUpdateQuantity(item.product.id, 1)}
                        activeOpacity={0.7}
                      >
                        <Plus size={13} color="#ffffff" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cartSheetDeleteBtn}
                        onPress={() => onRemoveItem(item.product.id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      >
                        <Trash2 size={15} color="#fb7185" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Footer Summary & Pay Button */}
          {cart.length > 0 && (
            <View style={styles.cartSheetFooter}>
              <View style={styles.cartSheetTotalRow}>
                <View>
                  <Text style={styles.cartSheetTotalLabel}>Total Pesanan</Text>
                  <Text style={styles.cartSheetTotalQty}>{totalItemsCount} pcs barang</Text>
                </View>
                <Text style={styles.cartSheetTotalVal}>{formatRp(totalAmount)}</Text>
              </View>

              <TouchableOpacity
                style={styles.cartSheetPayBtn}
                onPress={onProceedToCheckout}
                activeOpacity={0.8}
              >
                <Text style={styles.cartSheetPayBtnText}>Lanjut Pembayaran ({formatRp(totalAmount)})</Text>
                <ArrowRight size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cartSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  cartSheetBackdrop: {
    flex: 1,
  },
  cartSheetContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cartSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartSheetHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartSheetTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  cartSheetSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  cartSheetClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cartSheetClearText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  modalCloseBtn: {
    padding: 4,
  },
  cartSheetEmptyBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cartSheetEmptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartSheetEmptySub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  cartSheetItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  cartSheetItemName: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  cartSheetItemPrice: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  cartSheetItemDot: {
    color: '#52525b',
    fontSize: 12,
  },
  cartSheetItemSubtotal: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartSheetStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartSheetStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cartSheetQtyText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    minWidth: 20,
    textAlign: 'center',
  },
  cartSheetDeleteBtn: {
    padding: 4,
    marginLeft: 4,
  },
  cartSheetFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    gap: 12,
  },
  cartSheetTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartSheetTotalLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartSheetTotalQty: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  cartSheetTotalVal: {
    color: '#fb7185',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  cartSheetPayBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  cartSheetPayBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
});
