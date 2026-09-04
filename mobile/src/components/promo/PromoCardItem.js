import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  TicketPercent,
  Edit3,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  Percent,
} from 'lucide-react-native';

/**
 * Format date helper (DD/MM/YYYY)
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return null;
  }
}

/**
 * Format Rupiah currency
 */
function formatRp(value) {
  const num = parseFloat(value || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

/**
 * PromoCardItem: Kartu item voucher promosi berstandar Impeccable Defensive UI.
 * - Flexbox pairing: min-w-0 truncate untuk teks dinamis, shrink-0 untuk aksi/nilai.
 * - Readability floor: seluruh teks minimum 12px (text-xs).
 * - Aksen Rose Brand: #fb7185 / #e11d48.
 */
const PromoCardItem = React.memo(function PromoCardItem({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
  userRole = 'owner',
}) {
  const isOwner = userRole === 'owner';
  const now = new Date();

  // Status computation
  const isDateExpired = item.end_date && new Date(item.end_date) < now;
  const isDateNotStarted = item.start_date && new Date(item.start_date) > now;
  const isQuotaReached = item.quota !== null && item.quota !== undefined && (item.usage_count || 0) >= item.quota;
  const isInactive = !item.is_active;
  const isExpiredOrExhausted = isDateExpired || isQuotaReached;

  // Type & Discount Value label
  const isPercentage = item.type === 'PERCENTAGE' || item.type === 'MIN_SPEND';
  const discountValStr = isPercentage
    ? `${parseFloat(item.value)}%`
    : formatRp(item.value);

  // Type badge text
  const typeLabel =
    item.type === 'PERCENTAGE'
      ? 'Diskon %'
      : item.type === 'FIXED'
      ? 'Potongan Rp'
      : 'Min. Belanja';

  // Quota calculation
  const quota = item.quota;
  const usageCount = item.usage_count || 0;
  const hasQuota = quota !== null && quota !== undefined;
  const quotaPercentage = hasQuota ? Math.min(100, Math.round((usageCount / quota) * 100)) : 0;

  // Date formatted
  const startDateStr = formatDate(item.start_date);
  const endDateStr = formatDate(item.end_date);

  return (
    <View style={[styles.card, isInactive && styles.cardInactive]}>
      {/* Top Header: Badge Kode Kupon + Nilai Potongan Diskon */}
      <View style={styles.cardHeader}>
        <View style={styles.couponBadgeCol}>
          <View style={styles.couponBadge}>
            <TicketPercent size={14} color="#fb7185" style={{ flexShrink: 0 }} />
            <Text style={styles.couponCode} numberOfLines={1}>
              {(item.code || '-').toUpperCase()}
            </Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText} numberOfLines={1}>
              {typeLabel}
            </Text>
          </View>
        </View>

        {/* Nilai Potongan Diskon */}
        <View style={styles.discountValueBox}>
          <Text style={styles.discountValueText} numberOfLines={1}>
            {discountValStr}
          </Text>
          {isPercentage && parseFloat(item.max_discount_amount) > 0 && (
            <Text style={styles.maxDiscountText} numberOfLines={1}>
              Maks. {formatRp(item.max_discount_amount)}
            </Text>
          )}
        </View>
      </View>

      {/* Identitas Promo: Nama & Deskripsi */}
      <View style={styles.bodySection}>
        <Text style={styles.promoName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.promoDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Syarat & Kuota Bar */}
      <View style={styles.detailsGrid}>
        {/* Minimal Belanja */}
        <View style={styles.detailRow}>
          <Coins size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
          <Text style={styles.detailLabel}>Min. Belanja:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {parseFloat(item.min_purchase_amount) > 0
              ? formatRp(item.min_purchase_amount)
              : 'Tanpa Minimum'}
          </Text>
        </View>

        {/* Masa Berlaku */}
        <View style={styles.detailRow}>
          <Calendar size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
          <Text style={styles.detailLabel}>Periode:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {endDateStr ? `s/d ${endDateStr}` : 'Selamanya (Tanpa Batas)'}
          </Text>
        </View>

        {/* Kuota Penggunaan */}
        <View style={styles.detailRow}>
          <Users size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
          <Text style={styles.detailLabel}>Kuota:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {hasQuota ? `${usageCount} / ${quota} Terpakai` : 'Tanpa Batas Kuota'}
          </Text>
        </View>
      </View>

      {/* Kuota Progress Bar (Jika ada batas kuota) */}
      {hasQuota && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${quotaPercentage}%` },
                isQuotaReached && styles.progressBarFull,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {isQuotaReached ? 'Kuota Habis' : `${quotaPercentage}% Terisi`}
          </Text>
        </View>
      )}

      {/* Dashed Divider untuk Nuansa Kupon Tiket */}
      <View style={styles.dashedDivider} />

      {/* Footer Row: Status Pill & Toggle Switch & Action Buttons */}
      <View style={styles.footerRow}>
        <View style={styles.statusCol}>
          {isExpiredOrExhausted ? (
            <View style={styles.statusPillExpired}>
              <Clock size={12} color="#f87171" style={{ flexShrink: 0 }} />
              <Text style={styles.statusTextExpired} numberOfLines={1}>
                {isDateExpired ? 'Kadaluarsa' : 'Kuota Habis'}
              </Text>
            </View>
          ) : isInactive ? (
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
                trackColor={{ false: '#3f3f46', true: '#e11d48' }}
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

export default PromoCardItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
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
  couponBadgeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202023',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    flexShrink: 0,
  },
  couponCode: {
    color: '#fb7185',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.8,
  },
  typeBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  typeBadgeText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  discountValueBox: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  discountValueText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  maxDiscountText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  bodySection: {
    marginBottom: 12,
  },
  promoName: {
    color: '#f4f4f5',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  promoDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  detailsGrid: {
    backgroundColor: '#121215',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    width: 80,
    flexShrink: 0,
  },
  detailValue: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    minWidth: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fb7185',
    borderRadius: 3,
  },
  progressBarFull: {
    backgroundColor: '#f87171',
  },
  progressText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flexShrink: 0,
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
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  statusTextActive: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusPillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  statusTextInactive: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusPillExpired: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  statusTextExpired: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  switchWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  editBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  deleteBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
