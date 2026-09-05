import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  Scale,
  Edit3,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react-native';

/**
 * UnitCardItem: Kartu item satuan barang berstandar Impeccable Defensive UI.
 * - Flexbox pairing: min-w-0 truncate untuk teks dinamis, shrink-0 untuk simbol & aksi.
 * - Readability floor: seluruh teks minimum 12px (text-xs).
 */
const UnitCardItem = React.memo(function UnitCardItem({
  item,
  onEdit,
  onDelete,
  userRole = 'owner',
}) {
  const isOwner = userRole === 'owner';
  const productsCount = Number(item.products_count || 0);
  const conversionsCount = Number(item.conversions_count || 0);
  const totalUsage = productsCount + conversionsCount;
  const isInUse = totalUsage > 0;

  return (
    <View style={styles.card}>
      {/* Baris Atas: Simbol Satuan Badge + Nama Satuan + Badge Total Penggunaan */}
      <View style={styles.cardHeader}>
        <View style={styles.unitIdentity}>
          <View style={[styles.symbolBox, isInUse ? styles.symbolBoxActive : styles.symbolBoxEmpty]}>
            <Text style={[styles.symbolText, isInUse ? styles.symbolTextActive : styles.symbolTextEmpty]} numberOfLines={1}>
              {(item.symbol || '-').toUpperCase()}
            </Text>
          </View>

          <View style={styles.titleCol}>
            <Text style={styles.unitName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.symbolSubText} numberOfLines={1}>
              Simbol: {item.symbol || '-'}
            </Text>
          </View>
        </View>

        {/* Badge Total Penggunaan Produk */}
        <View style={[styles.usageBadge, isInUse ? styles.usageBadgeActive : styles.usageBadgeEmpty]}>
          <Package size={12} color={isInUse ? '#e4e4e7' : '#a1a1aa'} style={{ flexShrink: 0 }} />
          <Text style={[styles.usageText, isInUse ? styles.usageTextActive : styles.usageTextEmpty]}>
            {totalUsage} Produk
          </Text>
        </View>
      </View>

      {/* Deskripsi Satuan (jika ada) */}
      {item.description ? (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {/* Rincian Pemakaian (Base vs Konversi) */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Dasar:</Text>
          <Text style={styles.breakdownValue}>{productsCount} item</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Konversi:</Text>
          <Text style={styles.breakdownValue}>{conversionsCount} varian</Text>
        </View>
      </View>

      {/* Baris Bawah: Status Keterpakaian + Tombol Aksi */}
      <View style={styles.footerRow}>
        <View style={styles.statusIndicator}>
          {isInUse ? (
            <View style={styles.statusPillActive}>
              <CheckCircle2 size={12} color='#34d399' style={{ flexShrink: 0 }} />
              <Text style={styles.statusTextActive} numberOfLines={1}>
                Digunakan
              </Text>
            </View>
          ) : (
            <View style={styles.statusPillEmpty}>
              <AlertCircle size={12} color='#a1a1aa' style={{ flexShrink: 0 }} />
              <Text style={styles.statusTextEmpty} numberOfLines={1}>
                Belum Dipakai
              </Text>
            </View>
          )}
        </View>

        {isOwner && (
          <View style={styles.actionBtnGroup}>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.7}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Edit3 size={14} color='#d4d4d8' style={{ flexShrink: 0 }} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, isInUse && styles.deleteBtnDisabled]}
              activeOpacity={0.7}
              onPress={() => onDelete(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Trash2
                size={14}
                color={isInUse ? '#a1a1aa' : '#f87171'}
                style={{ flexShrink: 0 }}
              />
              <Text style={[styles.deleteBtnText, isInUse && styles.deleteBtnTextDisabled]}>
                Hapus
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

export default UnitCardItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  unitIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  symbolBox: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  symbolBoxActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  symbolBoxEmpty: {
    backgroundColor: '#202023',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  symbolText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  symbolTextActive: {
    color: '#f4f4f5',
  },
  symbolTextEmpty: {
    color: '#a1a1aa',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  unitName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    minWidth: 0,
  },
  symbolSubText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 1,
  },
  usageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 9,
    height: 28,
    borderRadius: 8,
    flexShrink: 0,
  },
  usageBadgeActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  usageBadgeEmpty: {
    backgroundColor: '#202023',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  usageText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  usageTextActive: {
    color: '#e4e4e7',
  },
  usageTextEmpty: {
    color: '#a1a1aa',
  },
  descriptionText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#d4d4d8',
    lineHeight: 18,
    backgroundColor: '#202023',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 32,
  },
  breakdownItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#3f3f46',
    marginHorizontal: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  breakdownValue: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
    gap: 8,
  },
  statusIndicator: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  statusTextActive: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#34d399',
    flex: 1,
    minWidth: 0,
  },
  statusPillEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  statusTextEmpty: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    flex: 1,
    minWidth: 0,
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
    gap: 5,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    flexShrink: 0,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    flexShrink: 0,
  },
  deleteBtnDisabled: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f87171',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  deleteBtnTextDisabled: {
    color: '#a1a1aa',
  },
});
