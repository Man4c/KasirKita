import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import {
  Store,
  User,
  Phone,
  Package,
  Receipt,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  Ban,
} from 'lucide-react-native';
import { showAlert } from '../../utils/alert.js';

export default function StoreCardItem({ store, onActivate, onExtendTrial, onToggleStatus }) {
  const isTrial = store.subscription_status === 'trial';
  const isActive = store.subscription_status === 'active';
  const isExpired = store.subscription_status === 'expired';

  // Category translation
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'retail': return 'Ritel';
      case 'fnb': return 'F&B (Resto)';
      case 'service': return 'Jasa';
      default: return cat || 'Umum';
    }
  };

  // Format phone to international WA format (62...)
  const handleOpenWhatsApp = () => {
    let phone = store.phone || store.owner?.phone;
    if (!phone) {
      showAlert('Kontak Kosong', 'Toko ini belum menyertakan nomor telepon/WhatsApp.');
      return;
    }
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const message = encodeURIComponent(`Halo ${store.owner?.name || store.name}, kami dari tim KasirKita POS...`);
    const waUrl = `https://wa.me/${phone}?text=${message}`;
    Linking.openURL(waUrl).catch(() => {
      showAlert('Gagal Membuka WhatsApp', 'Pastikan aplikasi WhatsApp telah terpasang di perangkat Anda.');
    });
  };

  // Calculate status badge text
  const renderStatusBadge = () => {
    if (isTrial) {
      return (
        <View style={[styles.badge, styles.badgeTrial]}>
          <Text style={[styles.badgeText, { color: '#fbbf24' }]}>TRIAL</Text>
        </View>
      );
    }
    if (isActive) {
      return (
        <View style={[styles.badge, styles.badgeActive]}>
          <Text style={[styles.badgeText, { color: '#34d399' }]}>PRO AKTIF</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeExpired]}>
        <Text style={[styles.badgeText, { color: '#fb7185' }]}>KEDALUWARSA</Text>
      </View>
    );
  };

  const getExpiryString = () => {
    if (isTrial) {
      const dateStr = store.trial_ends_at ? store.trial_ends_at.substring(0, 10) : '-';
      return `s/d ${dateStr}`;
    }
    if (isActive) {
      if (!store.subscription_expires_at) return 'Seumur Hidup';
      return `s/d ${store.subscription_expires_at.substring(0, 10)}`;
    }
    return 'Berakhir';
  };

  return (
    <View style={styles.card}>
      {/* Row 1: Store Name with clean inline Store icon */}
      <View style={styles.cardHeader}>
        <Store size={16} color="#fb7185" style={styles.storeIcon} />
        <Text style={styles.storeName} numberOfLines={2}>
          {store.name}
        </Text>
      </View>

      {/* Row 2: Status Badge • Expiry • Category (Zero Truncation, Flat, Clean) */}
      <View style={styles.metaRow}>
        {renderStatusBadge()}
        <Text style={styles.metaDot}>•</Text>
        <Text
          style={[
            styles.expiryText,
            isActive && { color: '#34d399' },
            isTrial && { color: '#fbbf24' },
            isExpired && { color: '#fb7185' },
          ]}
        >
          {getExpiryString()}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.categoryText}>
          {getCategoryLabel(store.business_category)}
        </Text>
      </View>

      {/* Row 3: Owner & Phone Details */}
      <View style={styles.contactSection}>
        <View style={styles.infoRow}>
          <User size={13} color="#71717a" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {store.owner?.name || 'Tanpa Pemilik'}
            {store.owner?.email ? ` (${store.owner.email})` : ''}
          </Text>
        </View>

        {(store.phone || store.owner?.phone) && (
          <View style={styles.infoRow}>
            <Phone size={13} color="#71717a" style={styles.infoIcon} />
            <Text style={styles.infoText}>{store.phone || store.owner?.phone}</Text>
          </View>
        )}
      </View>

      {/* Row 4: Clean Borderless Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Users size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{store.users_count ?? 0}</Text> Staf
          </Text>
        </View>
        <Text style={styles.metricDot}>•</Text>
        <View style={styles.metricItem}>
          <Package size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{store.products_count ?? 0}</Text> Produk
          </Text>
        </View>
        <Text style={styles.metricDot}>•</Text>
        <View style={styles.metricItem}>
          <Receipt size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{store.transactions_count ?? 0}</Text> Nota
          </Text>
        </View>
      </View>

      {/* Row 5: Contextual Action Buttons */}
      <View style={styles.actionRow}>
        {isTrial ? (
          <View style={styles.trialActionGroup}>
            <View style={styles.secondaryActionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleOpenWhatsApp}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Hubungi pemilik via WhatsApp"
              >
                <MessageSquare size={14} color="#34d399" />
                <Text style={styles.secondaryButtonText} numberOfLines={1}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onExtendTrial(store)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Perpanjang masa trial toko"
              >
                <Clock size={14} color="#fbbf24" />
                <Text style={styles.secondaryButtonText} numberOfLines={1}>Trial</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lockButton}
                onPress={() => onToggleStatus && onToggleStatus(store, 'expired')}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Kunci / Set Expired"
              >
                <Ban size={15} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryActivateButton}
              onPress={() => onActivate(store)}
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Aktifkan toko menjadi PRO"
            >
              <CheckCircle2 size={15} color="#ffffff" />
              <Text style={styles.primaryActivateButtonText} numberOfLines={1}>Aktifkan Toko ke PRO</Text>
            </TouchableOpacity>
          </View>
        ) : isActive ? (
          <View style={styles.secondaryActionRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Hubungi pemilik via WhatsApp"
            >
              <MessageSquare size={14} color="#34d399" />
              <Text style={styles.secondaryButtonText} numberOfLines={1}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.extendActiveButton}
              onPress={() => onActivate(store)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Perpanjang atau kelola paket lisensi toko"
            >
              <Clock size={14} color="#fb7185" />
              <Text style={styles.extendActiveButtonText} numberOfLines={1}>Perpanjang</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lockButton}
              onPress={() => onToggleStatus && onToggleStatus(store, 'expired')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Kunci / Set Expired"
            >
              <Ban size={15} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          /* isExpired: Toko Kedaluwarsa */
          <View style={styles.trialActionGroup}>
            <View style={styles.secondaryActionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleOpenWhatsApp}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Hubungi pemilik via WhatsApp"
              >
                <MessageSquare size={14} color="#34d399" />
                <Text style={styles.secondaryButtonText} numberOfLines={1}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => onToggleStatus && onToggleStatus(store, 'active')}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Buka Kunci / Set Active"
              >
                <CheckCircle2 size={15} color="#34d399" />
                <Text style={styles.unlockButtonText} numberOfLines={1}>Buka Kunci</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryActivateButton}
              onPress={() => onActivate(store)}
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Aktifkan kembali toko menjadi PRO"
            >
              <CheckCircle2 size={15} color="#ffffff" />
              <Text style={styles.primaryActivateButtonText} numberOfLines={1}>Aktifkan Toko ke PRO</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1c1c20',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeIcon: {
    marginRight: 7,
    flexShrink: 0,
  },
  storeName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
    flexWrap: 'nowrap',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    flexShrink: 0,
  },
  badgeTrial: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeExpired: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
    letterSpacing: 0.3,
  },
  metaDot: {
    color: '#52525b',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  expiryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  categoryText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 1,
  },
  contactSection: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1c1c20',
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
    flexShrink: 0,
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricIcon: {
    flexShrink: 0,
  },
  metricText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metricBold: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#e4e4e7',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metricDot: {
    color: '#3f3f46',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1c1c20',
  },
  trialActionGroup: {
    gap: 8,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 42,
  },
  secondaryButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  extendActiveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 42,
  },
  extendActiveButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#fb7185',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  primaryActivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  primaryActivateButtonHalf: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  primaryActivateButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  lockButton: {
    width: 42,
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  unlockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 42,
  },
  unlockButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#34d399',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
