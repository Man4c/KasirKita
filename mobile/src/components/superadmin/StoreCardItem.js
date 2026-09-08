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

  // Calculate status badge text & expiry
  const renderStatusBadge = () => {
    if (isTrial) {
      return (
        <View style={[styles.badge, styles.badgeTrial]}>
          <Clock size={12} color="#fbbf24" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, { color: '#fbbf24' }]}>TRIAL</Text>
        </View>
      );
    }
    if (isActive) {
      return (
        <View style={[styles.badge, styles.badgeActive]}>
          <CheckCircle2 size={12} color="#34d399" style={styles.badgeIcon} />
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

  const renderExpiryInfo = () => {
    if (isTrial) {
      const dateStr = store.trial_ends_at ? store.trial_ends_at.substring(0, 10) : '-';
      return `Trial s/d ${dateStr}`;
    }
    if (isActive) {
      if (!store.subscription_expires_at) return 'Lisensi Seumur Hidup';
      return `Aktif s/d ${store.subscription_expires_at.substring(0, 10)}`;
    }
    return 'Langganan telah berakhir';
  };

  return (
    <View style={styles.card}>
      {/* Row 1: Hero Store Name (100% Full Width - Zero Truncation!) */}
      <View style={styles.cardHeader}>
        <View style={styles.storeTitleWrapper}>
          <View style={styles.storeIconBox}>
            <Store size={15} color="#e4e4e7" />
          </View>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
        </View>
      </View>

      {/* Row 2: Category Pill, Status Badge & Expiry Info */}
      <View style={styles.metaRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {getCategoryLabel(store.business_category)}
          </Text>
        </View>
        {renderStatusBadge()}
        <Text style={styles.metaSeparator}>•</Text>
        <View style={styles.expiryRow}>
          {isTrial && <Clock size={12} color="#fbbf24" style={styles.expiryIcon} />}
          {isActive && <CheckCircle2 size={12} color="#34d399" style={styles.expiryIcon} />}
          <Text
            style={[
              styles.expiryText,
              isActive && { color: '#34d399' },
              isTrial && { color: '#fbbf24' },
              isExpired && { color: '#fb7185' },
            ]}
            numberOfLines={1}
          >
            {renderExpiryInfo()}
          </Text>
        </View>
      </View>

      {/* Row 3: Owner & Contact Details */}
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

      {/* Row 4: Key Operational Metrics Strip */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricItem}>
          <Users size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{store.users_count ?? 0}</Text> Staf
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Package size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{store.products_count ?? 0}</Text> Produk
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Receipt size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{store.transactions_count ?? 0}</Text> Nota
          </Text>
        </View>
      </View>

      {/* Row 5: Action Buttons (Touch Target >= 44dp, Clean Monochrome) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.waButton}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel="Hubungi pemilik via WhatsApp"
        >
          <MessageSquare size={15} color="#10b981" />
          <Text style={styles.waButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        {(isTrial || isExpired) && (
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
          <Text style={styles.activateButtonText}>Aktifkan Toko</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  storeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  storeName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#ffffff',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeTrial: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeExpired: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  categoryBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metaSeparator: {
    color: '#52525b',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  expiryIcon: {
    marginRight: 4,
    flexShrink: 0,
  },
  expiryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  contactSection: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
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
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    marginVertical: 4,
    backgroundColor: '#202024',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
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
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metricDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#2e2e33',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#202024',
    borderWidth: 1,
    borderColor: '#2e2e33',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 44,
    flex: 1,
  },
  waButtonText: {
    fontFamily: 'Poppins_600SemiBold',
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
    backgroundColor: '#202024',
    borderWidth: 1,
    borderColor: '#2e2e33',
    borderRadius: 8,
    paddingHorizontal: 8,
    minHeight: 44,
    flex: 0.8,
  },
  trialButtonText: {
    fontFamily: 'Poppins_600SemiBold',
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
    flex: 1.3,
  },
  activateButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#09090b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
