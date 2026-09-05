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
  Crown,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Edit3,
  Trash2,
  MessageCircle,
  Clock,
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
 * CustomerCardItem: Kartu profil pelanggan & keanggotaan (Membership)
 * Berstandar Impeccable Defensive UI:
 * - Flexbox pairing: min-w-0 truncate untuk nama/telepon, shrink-0 whitespace-nowrap untuk badge tier/belanja.
 * - Readability floor: seluruh teks minimum 12px (text-xs).
 * - Aksen VIP: Amber #fbbf24, Wholesale: Biru #38bdf8, Regular: Rose Red #fb7185.
 */
const CustomerCardItem = React.memo(function CustomerCardItem({
  item,
  onEdit,
  onDelete,
  userRole = 'owner',
}) {
  const isOwner = userRole === 'owner';
  const isInactive = !item.is_active;

  // Membership Tier Normalization
  const membershipType = (item.membership_type || 'REGULAR').toUpperCase();
  const isVip = membershipType === 'VIP';
  const isWholesale = membershipType === 'WHOLESALE';

  // Membership Visual Tokens
  let tierColor = '#fb7185'; // Regular Rose Red
  let tierBg = 'rgba(225, 29, 72, 0.12)';
  let tierBorder = 'rgba(225, 29, 72, 0.3)';
  let TierIcon = User;
  let tierLabel = 'MEMBER REGULER';

  if (isVip) {
    tierColor = '#fbbf24'; // Amber Gold
    tierBg = 'rgba(251, 191, 36, 0.14)';
    tierBorder = 'rgba(251, 191, 36, 0.35)';
    TierIcon = Crown;
    tierLabel = 'MEMBER VIP';
  } else if (isWholesale) {
    tierColor = '#60a5fa'; // Blue 400
    tierBg = 'rgba(96, 165, 250, 0.12)';
    tierBorder = 'rgba(96, 165, 250, 0.35)';
    TierIcon = Building2;
    tierLabel = 'MEMBER GROSIR';
  }

  // Metrics Display
  const txCount = Number(item.transactions_count || 0);
  const totalSpent = Number(item.total_spent || 0);

  // Direct Phone & WhatsApp Call Handlers
  const handleCallPhone = () => {
    if (!item.phone) return;
    const phoneUrl = `tel:${item.phone.replace(/[^0-9+]/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          showAlert('Info', `Nomor telepon: ${item.phone}`);
        }
      })
      .catch(() => {
        showAlert('Info', `Nomor telepon: ${item.phone}`);
      });
  };

  const handleOpenWhatsApp = () => {
    if (!item.phone) return;
    let cleanPhone = item.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const waUrl = `https://wa.me/${cleanPhone}`;
    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waUrl);
        } else {
          showAlert('WhatsApp', `Nomor WhatsApp: ${item.phone}`);
        }
      })
      .catch(() => {
        showAlert('WhatsApp', `Nomor WhatsApp: ${item.phone}`);
      });
  };

  return (
    <View style={[styles.card, isInactive && styles.cardInactive]}>
      {/* Area Kartu Atas & Badan yang Dapat Diklik untuk Edit Cepat */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => isOwner && onEdit && onEdit(item)}
        disabled={!isOwner}
      >
        {/* Top Header: Badge Membership & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.tierBadge, { backgroundColor: tierBg, borderColor: tierBorder }]}>
              <TierIcon size={12} color={tierColor} style={{ flexShrink: 0 }} />
              <Text style={[styles.tierBadgeText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
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
        </View>

        {/* Main Body: Customer Identity & Avatar */}
        <View style={styles.cardBody}>
          <View style={[styles.avatarBox, { borderColor: tierBorder, backgroundColor: tierBg }]}>
            <TierIcon size={20} color={tierColor} />
          </View>

          <View style={styles.identityContainer}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Contact Numbers Row */}
            <View style={styles.contactRow}>
              {item.phone ? (
                <TouchableOpacity
                  style={styles.contactChip}
                  onPress={handleCallPhone}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Phone size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
                  <Text style={styles.contactChipText} numberOfLines={1}>
                    {item.phone}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noContactText}>Tanpa No. Telepon</Text>
              )}

              {item.email ? (
                <View style={styles.contactChip}>
                  <Mail size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
                  <Text style={styles.contactChipEmail} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Address Line (if available) */}
            {Boolean(item.address) && (
              <View style={styles.metaRow}>
                <MapPin size={12} color="#71717a" style={{ flexShrink: 0, marginTop: 2 }} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            )}

            {/* Notes (if available) */}
            {Boolean(item.notes) && (
              <Text style={styles.notesText} numberOfLines={2}>
                Catatan: {item.notes}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Tier 1: Unified Performance Metrics Strip: Transaksi + Total Belanja */}
      <View style={styles.metricsStrip}>
        <View style={styles.statBox}>
          <ShoppingBag size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
          <Text style={styles.statText} numberOfLines={1}>
            <Text style={styles.statBold}>{txCount}</Text> Transaksi
          </Text>
        </View>

        <View style={styles.salesStatBox}>
          <Text style={styles.salesLabel}>Total Belanja:</Text>
          <Text style={styles.salesValue} numberOfLines={1}>{formatRp(totalSpent)}</Text>
        </View>
      </View>

      {/* Tier 2: Ergonomic Action Buttons Strip */}
      {(Boolean(item.phone) || isOwner) && (
        <View style={styles.actionStrip}>
          {Boolean(item.phone) && (
            <TouchableOpacity
              style={styles.waBtn}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.75}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MessageCircle size={14} color="#34d399" style={{ flexShrink: 0 }} />
              <Text style={styles.waBtnText}>Chat WA</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onEdit(item)}
              activeOpacity={0.75}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Edit3 size={14} color="#f4f4f5" style={{ flexShrink: 0 }} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              style={styles.actionBtnDelete}
              onPress={() => onDelete(item)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Hapus Pelanggan"
            >
              <Trash2 size={15} color="#f87171" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

export default CustomerCardItem;

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
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      },
    }),
  },
  cardInactive: {
    opacity: 0.65,
    borderColor: '#27272a',
    backgroundColor: '#121215',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
    minHeight: 24,
  },
  tierBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusActiveBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusActiveBadgeText: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusInactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInactiveBadgeText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityContainer: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    color: '#f4f4f5',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
    marginBottom: 4,
    includeFontPadding: false,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    maxWidth: '100%',
    minHeight: 28,
  },
  contactChipText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  contactChipEmail: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  noContactText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  addressText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
    includeFontPadding: false,
  },
  notesText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
    lineHeight: 16,
    includeFontPadding: false,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#202024',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 10,
    gap: 8,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  statText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statBold: {
    color: '#f4f4f5',
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  salesStatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  salesLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  salesValue: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  waBtnText: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  actionBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionBtnDelete: {
    width: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    flexShrink: 0,
  },
});
