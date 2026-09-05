import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  ReceiptText,
  Percent,
  Coins,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react-native';

/**
 * Format Rupiah currency helper
 */
function formatRp(value) {
  const num = parseFloat(value || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

/**
 * TaxCardItem: Kartu item Pajak (PPN/PB1) & Biaya Layanan (Service Fee, Kemasan, Admin)
 * Berstandar Impeccable Defensive UI:
 * - Flexbox pairing: min-w-0 truncate untuk teks dinamis, shrink-0 whitespace-nowrap untuk nilai/badge.
 * - Readability floor: seluruh label teks minimum 12px (text-xs).
 * - Aksen Pajak: Amber #fbbf24, Biaya Layanan: Ungu/Indigo #c084fc.
 */
const TaxCardItem = React.memo(function TaxCardItem({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
  userRole = 'owner',
}) {
  const isOwner = userRole === 'owner';
  const isTax = Boolean(item.is_tax);
  const isInactive = !item.is_active;
  const isDefault = Boolean(item.is_default);

  // Rate Display
  const isPercentage = item.type === 'PERCENTAGE';
  const rateDisplay = isPercentage ? `${parseFloat(item.value)}%` : formatRp(item.value);

  // Theme Colors
  const accentColor = isTax ? '#fbbf24' : '#c084fc';
  const accentBg = isTax ? 'rgba(251, 191, 36, 0.12)' : 'rgba(192, 132, 252, 0.12)';
  const accentBorder = isTax ? 'rgba(251, 191, 36, 0.3)' : 'rgba(192, 132, 252, 0.3)';

  // Apply To Badge Renderer
  const renderApplyToBadge = () => {
    switch (item.apply_to) {
      case 'ALL':
        return (
          <View style={styles.applyBadgeDefault}>
            <Layers size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
            <Text style={styles.applyBadgeTextDefault} numberOfLines={1}>Semua Transaksi</Text>
          </View>
        );
      case 'SPECIFIC_PAYMENT':
        return (
          <View style={styles.applyBadgePayment}>
            <CreditCard size={12} color="#fbbf24" style={{ flexShrink: 0 }} />
            <Text style={styles.applyBadgeTextPayment} numberOfLines={1}>
              Khusus {item.payment_method || 'Digital'}
            </Text>
          </View>
        );
      case 'TAKEAWAY_ONLY':
        return (
          <View style={styles.applyBadgeTakeaway}>
            <ShoppingBag size={12} color="#38bdf8" style={{ flexShrink: 0 }} />
            <Text style={styles.applyBadgeTextTakeaway} numberOfLines={1}>Bawa Pulang Saja</Text>
          </View>
        );
      case 'MANUAL':
      default:
        return (
          <View style={styles.applyBadgeManual}>
            <Package size={12} color="#c084fc" style={{ flexShrink: 0 }} />
            <Text style={styles.applyBadgeTextManual} numberOfLines={1}>Pilihan Kasir</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.card, isInactive && styles.cardInactive]}>
      {/* Top Header: Badge Kategori (Pajak/Biaya) & Nilai Tarif */}
      <View style={styles.cardHeader}>
        <View style={styles.leftBadgeGroup}>
          <View style={[styles.categoryBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            {isTax ? (
              <ReceiptText size={14} color={accentColor} style={{ flexShrink: 0 }} />
            ) : (
              <Coins size={14} color={accentColor} style={{ flexShrink: 0 }} />
            )}
            <Text style={[styles.categoryBadgeText, { color: accentColor }]} numberOfLines={1}>
              {isTax ? 'PAJAK' : 'BIAYA LAYANAN'}
            </Text>
          </View>

          {isDefault && (
            <View style={styles.defaultBadge}>
              <Sparkles size={11} color="#34d399" style={{ flexShrink: 0 }} />
              <Text style={styles.defaultBadgeText} numberOfLines={1}>Default</Text>
            </View>
          )}
        </View>

        {/* Nilai Tarif */}
        <View style={[styles.rateBox, { borderColor: accentBorder }]}>
          <Text style={[styles.rateText, { color: accentColor }]} numberOfLines={1}>
            {rateDisplay}
          </Text>
        </View>
      </View>

      {/* Body: Nama Komponen & Deskripsi */}
      <View style={styles.bodySection}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Trigger Rule Badge & Type indicator */}
      <View style={styles.ruleSection}>
        <Text style={styles.ruleLabel}>Aturan Penerapan:</Text>
        <View style={styles.ruleBadgeWrapper}>
          {renderApplyToBadge()}
        </View>
      </View>

      {/* Dashed Divider */}
      <View style={styles.dashedDivider} />

      {/* Footer Row: Status Pill, Switch, & Action Buttons */}
      <View style={styles.footerRow}>
        <View style={styles.statusCol}>
          {isInactive ? (
            <View style={styles.statusPillInactive}>
              <AlertCircle size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
              <Text style={styles.statusTextInactive} numberOfLines={1}>Nonaktif</Text>
            </View>
          ) : (
            <View style={styles.statusPillActive}>
              <CheckCircle2 size={12} color="#34d399" style={{ flexShrink: 0 }} />
              <Text style={styles.statusTextActive} numberOfLines={1}>Aktif</Text>
            </View>
          )}

          {/* Toggle Switch Aktif/Nonaktif Cepat */}
          {isOwner && onToggleStatus && (
            <View style={styles.switchWrapper}>
              <Switch
                value={Boolean(item.is_active)}
                onValueChange={() => onToggleStatus(item)}
                trackColor={{ false: '#3f3f46', true: isTax ? '#fbbf24' : '#c084fc' }}
                thumbColor={item.is_active ? '#ffffff' : '#a1a1aa'}
                style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
              />
            </View>
          )}
        </View>

        {/* Action Buttons: Edit & Delete */}
        {isOwner && (
          <View style={styles.actionBtnGroup}>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.7}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={14} color="#d4d4d8" style={{ flexShrink: 0 }} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.7}
              onPress={() => onDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={14} color="#f87171" style={{ flexShrink: 0 }} />
              <Text style={styles.deleteBtnText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

export default TaxCardItem;


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInactive: {
    opacity: 0.75,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  leftBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 30,
    gap: 6,
    flexShrink: 0,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    letterSpacing: 0.6,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 24,
    gap: 4,
    flexShrink: 0,
  },
  defaultBadgeText: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rateBox: {
    backgroundColor: '#202023',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rateText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bodySection: {
    marginBottom: 10,
  },
  itemName: {
    color: '#f4f4f5',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  itemDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  ruleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#121215',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  ruleLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 0,
  },
  ruleBadgeWrapper: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  applyBadgeDefault: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#27272a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  applyBadgeTextDefault: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  applyBadgePayment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  applyBadgeTextPayment: {
    color: '#fbbf24',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  applyBadgeTakeaway: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  applyBadgeTextTakeaway: {
    color: '#38bdf8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  applyBadgeManual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  applyBadgeTextManual: {
    color: '#c084fc',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#27272a',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  statusTextActive: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusPillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  statusTextInactive: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  switchWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    gap: 5,
    flexShrink: 0,
  },
  editBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    gap: 5,
    flexShrink: 0,
  },
  deleteBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
