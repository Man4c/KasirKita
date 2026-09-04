import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  FolderTree,
  Edit3,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';

/**
 * CategoryCardItem: Kartu item kategori berstandar Impeccable Defensive UI.
 * - Flexbox pairing: min-w-0 truncate untuk nama/deskripsi, shrink-0 untuk badge & aksi.
 * - Readability floor: seluruh teks minimum 12px (text-xs).
 */
const CategoryCardItem = React.memo(function CategoryCardItem({
  item,
  onEdit,
  onDelete,
  userRole = 'owner',
}) {
  const isOwner = userRole === 'owner';
  const productsCount = Number(item.products_count || 0);
  const hasProducts = productsCount > 0;

  return (
    <View style={styles.card}>
      {/* Baris Atas: Ikon Kategori + Nama & Slug + Badge Hitungan Produk */}
      <View style={styles.cardHeader}>
        <View style={styles.categoryIdentity}>
          <View style={[styles.iconBox, hasProducts ? styles.iconBoxActive : styles.iconBoxEmpty]}>
            <FolderTree size={20} color={hasProducts ? '#f4f4f5' : '#a1a1aa'} />
          </View>

          <View style={styles.titleCol}>
            <View style={styles.nameRow}>
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            {item.slug ? (
              <Text style={styles.slugText} numberOfLines={1}>
                /{item.slug}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Badge Jumlah Produk */}
        <View style={[styles.productCountBadge, hasProducts ? styles.countBadgeActive : styles.countBadgeEmpty]}>
          <Package size={12} color={hasProducts ? '#e4e4e7' : '#a1a1aa'} style={{ flexShrink: 0 }} />
          <Text style={[styles.productCountText, hasProducts ? styles.countTextActive : styles.countTextEmpty]}>
            {productsCount} Produk
          </Text>
        </View>
      </View>

      {/* Deskripsi Kategori (jika ada) */}
      {item.description ? (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {/* Baris Bawah: Status Keterpakaian + Tombol Aksi */}
      <View style={styles.footerRow}>
        <View style={styles.statusIndicator}>
          {hasProducts ? (
            <View style={styles.statusPillActive}>
              <CheckCircle2 size={12} color='#34d399' style={{ flexShrink: 0 }} />
              <Text style={styles.statusTextActive}>Terhubung Produk</Text>
            </View>
          ) : (
            <View style={styles.statusPillEmpty}>
              <AlertCircle size={12} color='#a1a1aa' style={{ flexShrink: 0 }} />
              <Text style={styles.statusTextEmpty}>Belum Ada Produk</Text>
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
              style={[styles.deleteBtn, hasProducts && styles.deleteBtnDisabled]}
              activeOpacity={0.7}
              onPress={() => onDelete(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Trash2
                size={14}
                color={hasProducts ? '#a1a1aa' : '#f87171'}
                style={{ flexShrink: 0 }}
              />
              <Text style={[styles.deleteBtnText, hasProducts && styles.deleteBtnTextDisabled]}>
                Hapus
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

export default CategoryCardItem;

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
  categoryIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  iconBoxEmpty: {
    backgroundColor: '#202023',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    minWidth: 0,
    flex: 1,
  },
  slugText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 1,
  },
  productCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
  },
  countBadgeActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  countBadgeEmpty: {
    backgroundColor: '#202023',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  productCountText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    flexShrink: 0,
  },
  countTextActive: {
    color: '#e4e4e7',
  },
  countTextEmpty: {
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
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusTextActive: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#34d399',
    flexShrink: 0,
  },
  statusPillEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusTextEmpty: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
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
    gap: 5,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    flexShrink: 0,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    flexShrink: 0,
  },
  deleteBtnTextDisabled: {
    color: '#a1a1aa',
  },
});
