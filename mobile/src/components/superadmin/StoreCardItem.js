import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
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
} from 'lucide-react-native';

export default function StoreCardItem({ store, onActivate, onExtendTrial }) {
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
      Alert.alert('Kontak Kosong', 'Toko ini belum menyertakan nomor telepon/WhatsApp.');
      return;
    }
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const message = encodeURIComponent(`Halo ${store.owner?.name || store.name}, kami dari tim KasirKita POS...`);
    const waUrl = `https://wa.me/${phone}?text=${message}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('Gagal Membuka WhatsApp', 'Pastikan aplikasi WhatsApp telah terpasang di perangkat Anda.');
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
        <Store size={16} color="#71717a" style={styles.storeIcon} />
        <Text style={styles.storeName} numberOfLines={1}>
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
          numberOfLines={1}
        >
          {getExpiryString()}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.categoryText} numberOfLines={1}>
          {getCategoryLabel(store.business_category)}
        </Text>
      </View>

      {/* Row 3: Owner & Phone Details */}
      <View style={styles.contactSection}>
        <View style={styles.infoRow}>
          <User size={13} color="#71717a" style={styles.infoIcon} />
          <Text style={styles.infoText} numberOfLines={1}>
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
        {isActive ? (
          <>
            <TouchableOpacity
              style={styles.waButton}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Hubungi pemilik via WhatsApp"
            >
              <MessageSquare size={14} color="#34d399" />
              <Text style={styles.waButtonText}>Hubungi WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.extendActiveButton}
              onPress={() => onActivate(store)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Perpanjang atau kelola paket lisensi toko"
            >
              <Clock size={14} color="#d4d4d8" />
              <Text style={styles.extendActiveButtonText}>Perpanjang</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.waButton}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Hubungi pemilik via WhatsApp"
            >
              <MessageSquare size={14} color="#34d399" />
              <Text style={styles.waButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            {isTrial && (
              <TouchableOpacity
                style={styles.trialButton}
                onPress={() => onExtendTrial(store)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Perpanjang masa trial toko"
              >
                <Clock size={14} color="#fbbf24" />
                <Text style={styles.trialButtonText}>+ Trial</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.activateButton}
              onPress={() => onActivate(store)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Aktifkan toko menjadi PRO"
            >
              <CheckCircle2 size={15} color="#09090b" />
              <Text style={styles.activateButtonText}>Aktifkan PRO</Text>
            </TouchableOpacity>
          </>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1c1c20',
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    flex: 1.4,
  },
  waButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  extendActiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 44,
    flex: 1,
  },
  extendActiveButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 8,
    minHeight: 44,
    flex: 0.8,
  },
  trialButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 44,
    flex: 1.2,
  },
  activateButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#09090b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
