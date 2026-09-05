import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  User,
  ShieldCheck,
  ShoppingBag,
  Phone,
  Mail,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { showAlert } from '../../utils/alert';

/**
 * Format Rupiah currency helper
 */
function formatRp(value) {
  const num = parseFloat(value || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

/**
 * Get initial letters from full name
 */
function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  if (!parts[0]) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * UserCardItem: Kartu profil staf kasir, owner, dan metrik performa toko.
 * Berstandar Impeccable Defensive UI:
 * - Tap-to-Edit: Seluruh badan kartu touchable (activeOpacity={0.88}) untuk edit cepat.
 * - The Flexbox Pairing Rule: min-w-0 truncate pada nama & email, shrink-0 pada role badge & tombol aksi.
 * - The Readability Floor Rule: seluruh teks berukuran minimum 12px (text-xs).
 * - Self-Destruction Guard: jika akun milik user login saat ini, lindungi dari tombol hapus dan beri badge "(Anda)".
 */
const UserCardItem = React.memo(function UserCardItem({
  item,
  currentUserId,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
}) {
  const isSelf = String(item.id) === String(currentUserId);
  const isOwner = item.role === 'owner';
  const isInactive = !item.is_active;

  // Transaction metrics
  const txCount = Number(item.transactions_count || 0);
  const totalSales = Number(item.total_sales || 0);

  // Direct Call Handler
  const handleCallPhone = (e) => {
    e?.stopPropagation?.();
    if (!item.phone) return;
    const phoneUrl = `tel:${item.phone.replace(/[^0-9+]/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          showAlert('Kontak Staf', `Nomor telepon: ${item.phone}`);
        }
      })
      .catch(() => {
        showAlert('Kontak Staf', `Nomor telepon: ${item.phone}`);
      });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isInactive && styles.cardInactive]}
      onPress={() => onEdit(item)}
      activeOpacity={0.88}
    >
      {/* Top Header: Role Badge, Status Badge & Self Tag */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.roleBadge, isOwner ? styles.roleBadgeOwner : styles.roleBadgeCashier]}>
            <ShieldCheck
              size={12}
              color={isOwner ? '#fb7185' : '#34d399'}
              style={{ flexShrink: 0 }}
            />
            <Text
              style={[
                styles.roleBadgeText,
                isOwner ? styles.roleBadgeTextOwner : styles.roleBadgeTextCashier,
              ]}
            >
              {isOwner ? 'PEMILIK (OWNER)' : 'KASIR'}
            </Text>
          </View>

          {isSelf && (
            <View style={styles.selfBadge}>
              <Text style={styles.selfBadgeText}>Anda</Text>
            </View>
          )}

          {isInactive ? (
            <View style={styles.statusInactiveBadge}>
              <Text style={styles.statusInactiveBadgeText}>Nonaktif</Text>
            </View>
          ) : (
            <View style={styles.statusActiveBadge}>
              <Text style={styles.statusActiveBadgeText}>Aktif</Text>
            </View>
          )}
        </View>

        {/* Total Sales Omset Pill */}
        <View style={styles.salesBadge}>
          <Text style={styles.salesLabel}>Omset:</Text>
          <Text style={styles.salesValue}>{formatRp(totalSales)}</Text>
        </View>
      </View>

      {/* Main Body: Avatar, Name, Email, Phone */}
      <View style={styles.cardBody}>
        {/* Initials Avatar Box */}
        <View style={[styles.avatarBox, isOwner ? styles.avatarOwner : styles.avatarCashier]}>
          <Text style={[styles.avatarText, isOwner ? styles.avatarTextOwner : styles.avatarTextCashier]}>
            {getInitials(item.name)}
          </Text>
        </View>

        <View style={styles.identityContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          {/* Email Info */}
          <View style={styles.metaRow}>
            <Mail size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
            <Text style={styles.emailText} numberOfLines={1}>
              {item.email}
            </Text>
          </View>

          {/* Phone Info */}
          {item.phone ? (
            <TouchableOpacity
              style={styles.phoneChip}
              onPress={handleCallPhone}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Phone size={12} color="#34d399" style={{ flexShrink: 0 }} />
              <Text style={styles.phoneText} numberOfLines={1}>
                {item.phone}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.noPhoneText}>Tanpa kontak telepon</Text>
          )}
        </View>
      </View>

      {/* Metrics Strip & Action Buttons */}
      <View style={styles.metricsStrip}>
        <View style={styles.statBox}>
          <ShoppingBag size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
          <Text style={styles.statText} numberOfLines={1}>
            <Text style={styles.statBold}>{txCount}</Text> Transaksi
          </Text>
        </View>

        {/* Action Buttons Group */}
        <View style={styles.actionGroup}>
          {/* Reset Password Action */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e?.stopPropagation?.();
              onResetPassword(item);
            }}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <KeyRound size={13} color="#f4f4f5" />
            <Text style={styles.actionBtnText}>Reset PIN</Text>
          </TouchableOpacity>

          {/* Toggle Active Status (Forbidden on self) */}
          {!isSelf && (
            <TouchableOpacity
              style={[styles.statusToggleBtn, isInactive && styles.statusToggleBtnInactive]}
              onPress={(e) => {
                e?.stopPropagation?.();
                onToggleStatus(item);
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              {isInactive ? (
                <>
                  <CheckCircle2 size={13} color="#34d399" />
                  <Text style={styles.statusToggleBtnTextActive}>Aktifkan</Text>
                </>
              ) : (
                <>
                  <XCircle size={13} color="#fbbf24" />
                  <Text style={styles.statusToggleBtnTextDeactivate}>Bekukan</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Delete Action (Forbidden on self) */}
          {!isSelf && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDelete]}
              onPress={(e) => {
                e?.stopPropagation?.();
                onDelete(item);
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={14} color="#f87171" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default UserCardItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  cardInactive: {
    opacity: 0.65,
    borderColor: '#3f3f46',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  roleBadgeOwner: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  roleBadgeCashier: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  roleBadgeTextOwner: {
    color: '#fb7185',
  },
  roleBadgeTextCashier: {
    color: '#34d399',
  },
  selfBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderColor: 'rgba(96, 165, 250, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  selfBadgeText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  statusActiveBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusActiveBadgeText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  statusInactiveBadge: {
    backgroundColor: 'rgba(113, 113, 122, 0.15)',
    borderColor: '#3f3f46',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusInactiveBadgeText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
  },
  salesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  salesLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  salesValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f4f4f5',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  avatarOwner: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  avatarCashier: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  avatarTextOwner: {
    color: '#fb7185',
  },
  avatarTextCashier: {
    color: '#34d399',
  },
  identityContainer: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 12,
    color: '#a1a1aa',
    flexShrink: 1,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  phoneText: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '500',
  },
  noPhoneText: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    gap: 8,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  statText: {
    fontSize: 12,
    color: '#a1a1aa',
    flexShrink: 1,
  },
  statBold: {
    color: '#f4f4f5',
    fontWeight: '700',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  statusToggleBtnInactive: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  statusToggleBtnTextDeactivate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  statusToggleBtnTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34d399',
  },
  actionBtnDelete: {
    width: 34,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
});
