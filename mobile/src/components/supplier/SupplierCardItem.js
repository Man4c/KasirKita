import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Truck,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Copy,
  Check,
  Package,
  Edit3,
  Trash2,
  MessageCircle,
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
 * SupplierCardItem: Kartu profil pemasok, kontak distributor & rekening bank transfer
 * Berstandar Impeccable Defensive UI:
 * - The Flexbox Pairing Rule: min-w-0 truncate untuk nama/sales/alamat, shrink-0 whitespace-nowrap untuk badge bank/status.
 * - The Readability Floor Rule: seluruh teks berukuran minimum 12px (text-xs).
 * - Aksen tema Distributor: Warm Orange (#fb923c / #ea580c).
 */
const SupplierCardItem = React.memo(function SupplierCardItem({
  item,
  onEdit,
  onDelete,
  userRole = 'owner',
}) {
  const isOwner = userRole === 'owner';
  const isInactive = !item.is_active;

  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  // Metrics Display
  const restocksCount = Number(item.restocks_count || 0);
  const totalPurchases = Number(item.total_purchases || 0);

  // Bank Info Availability
  const hasBankInfo = Boolean(item.bank_name || item.bank_account || item.bank_holder);

  // Direct Call Handler
  const handleCallPhone = () => {
    if (!item.phone) return;
    const phoneUrl = `tel:${item.phone.replace(/[^0-9+]/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          showAlert('Kontak Pemasok', `Nomor telepon: ${item.phone}`);
        }
      })
      .catch(() => {
        showAlert('Kontak Pemasok', `Nomor telepon: ${item.phone}`);
      });
  };

  // WhatsApp Handler
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
          showAlert('WhatsApp Pemasok', `Nomor WhatsApp: ${item.phone}`);
        }
      })
      .catch(() => {
        showAlert('WhatsApp Pemasok', `Nomor WhatsApp: ${item.phone}`);
      });
  };

  // Copy Bank Account Handler
  const handleCopyAccount = () => {
    const textToCopy = item.bank_account || '';
    if (!textToCopy) return;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }

    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);

    if (Platform.OS !== 'web') {
      showAlert('Rekening Tersalin', `Nomor rekening ${item.bank_name || ''} ${textToCopy} atas nama ${item.bank_holder || '-'} siap ditransfer.`);
    }
  };

  return (
    <View style={[styles.card, isInactive && styles.cardInactive]}>
      {/* Top Header: Badge Distributor & Status */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.supplierBadge}>
            <Truck size={12} color="#fb923c" style={{ flexShrink: 0 }} />
            <Text style={styles.supplierBadgeText}>PEMASOK</Text>
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

        {/* Aggregated Purchases Pill */}
        <View style={styles.spentBadge}>
          <Text style={styles.spentLabel}>Total Kulakan:</Text>
          <Text style={styles.spentValue}>{formatRp(totalPurchases)}</Text>
        </View>
      </View>

      {/* Main Body: Supplier Identity & Avatar */}
      <View style={styles.cardBody}>
        <View style={styles.avatarBox}>
          <Building2 size={20} color="#fb923c" />
        </View>

        <View style={styles.identityContainer}>
          <Text style={styles.supplierName} numberOfLines={1}>
            {item.name}
          </Text>

          {/* Contact Person */}
          {Boolean(item.contact_person) && (
            <View style={styles.metaRow}>
              <User size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
              <Text style={styles.contactPersonText} numberOfLines={1}>
                PIC: {item.contact_person}
              </Text>
            </View>
          )}

          {/* Phone & Email Row */}
          <View style={styles.contactRow}>
            {item.phone ? (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={handleCallPhone}
                activeOpacity={0.7}
              >
                <Phone size={12} color="#34d399" style={{ flexShrink: 0 }} />
                <Text style={styles.contactChipText} numberOfLines={1}>
                  {item.phone}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noContactText}>Tanpa Kontak Telepon</Text>
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
              Termin / Catatan: {item.notes}
            </Text>
          )}
        </View>
      </View>

      {/* Bank Account Box (if bank details exist) */}
      {hasBankInfo && (
        <View style={styles.bankBox}>
          <View style={styles.bankBoxHeader}>
            <View style={styles.bankTag}>
              <CreditCard size={12} color="#fb923c" style={{ flexShrink: 0 }} />
              <Text style={styles.bankTagText}>
                {item.bank_name || 'BANK'}
              </Text>
            </View>
            {Boolean(item.bank_account) && (
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
                onPress={handleCopyAccount}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {copied ? (
                  <>
                    <Check size={12} color="#34d399" style={{ flexShrink: 0 }} />
                    <Text style={styles.copyBtnTextSuccess}>Tersalin!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={12} color="#a1a1aa" style={{ flexShrink: 0 }} />
                    <Text style={styles.copyBtnText}>Salin No. Rek</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bankDetailsRow}>
            <Text style={styles.accountNumberText} numberOfLines={1} selectable>
              {item.bank_account || 'Nomor rekening tidak tertera'}
            </Text>
            {Boolean(item.bank_holder) && (
              <Text style={styles.accountHolderText} numberOfLines={1}>
                a.n. {item.bank_holder}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Metrics Strip: Restock Count & Action Buttons */}
      <View style={styles.metricsStrip}>
        <View style={styles.statBox}>
          <Package size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
          <Text style={styles.statText}>
            <Text style={styles.statBold}>{restocksCount}</Text> Kali Pasokan Masuk
          </Text>
        </View>

        {/* Action Group */}
        <View style={styles.actionGroup}>
          {Boolean(item.phone) && (
            <TouchableOpacity
              style={styles.waBtn}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MessageCircle size={14} color="#34d399" />
              <Text style={styles.waBtnText}>Chat WA</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onEdit(item)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Edit3 size={14} color="#38bdf8" />
                <Text style={styles.actionBtnEditText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDelete]}
                onPress={() => onDelete(item)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Trash2 size={14} color="#f87171" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
});

export default SupplierCardItem;

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
  supplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderColor: 'rgba(251, 146, 60, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  supplierBadgeText: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
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
    backgroundColor: 'rgba(161, 161, 170, 0.12)',
    borderColor: 'rgba(161, 161, 170, 0.3)',
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
  spentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  spentLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  spentValue: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityContainer: {
    flex: 1,
    minWidth: 0,
  },
  supplierName: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  contactPersonText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '100%',
  },
  contactChipText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  contactChipEmail: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  noContactText: {
    color: '#71717a',
    fontSize: 12,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  addressText: {
    color: '#71717a',
    fontSize: 12,
    flex: 1,
  },
  notesText: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 16,
    backgroundColor: 'rgba(24, 24, 27, 0.6)',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  bankBox: {
    backgroundColor: '#202024',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e2e33',
    padding: 10,
    marginTop: 10,
  },
  bankBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bankTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  bankTagText: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minHeight: 28,
  },
  copyBtnSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
  },
  copyBtnText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  copyBtnTextSuccess: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  bankDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  accountNumberText: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  accountHolderText: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  statText: {
    color: '#a1a1aa',
    fontSize: 12,
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
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    minHeight: 32,
  },
  waBtnText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    minHeight: 32,
  },
  actionBtnEditText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 7,
  },
});
