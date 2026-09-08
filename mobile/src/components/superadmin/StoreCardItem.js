import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Store, User, Phone, Package, Receipt, Users, CheckCircle2, Clock, MessageSquare } from 'lucide-react-native';

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
      {/* Header: Store Name & Badges */}
      <View style={styles.cardHeader}>
        <View style={styles.storeNameContainer}>
          <Store size={18} color="#f43f5e" style={styles.storeIcon} />
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
        </View>
        <View style={styles.badgeGroup}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{getCategoryLabel(store.business_category)}</Text>
          </View>
          {renderStatusBadge()}
        </View>
      </View>

      {/* Sub-header: Expiry info & Owner details */}
      <View style={styles.detailSection}>
        <Text style={[styles.expiryText, isExpired && { color: '#fb7185' }]}>
          {renderExpiryInfo()}
        </Text>

        <View style={styles.infoRow}>
          <User size={13} color="#a1a1aa" style={styles.infoIcon} />
          <Text style={styles.infoText} numberOfLines={1}>
            {store.owner?.name || 'Belum ada pemilik'} ({store.owner?.email || '-'})
          </Text>
        </View>

        {(store.phone || store.owner?.phone) && (
          <View style={styles.infoRow}>
            <Phone size={13} color="#a1a1aa" style={styles.infoIcon} />
            <Text style={styles.infoText}>{store.phone || store.owner?.phone}</Text>
          </View>
        )}
      </View>

      {/* Metrics Strip */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricItem}>
          <Users size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>{store.users_count ?? 0} Staf</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Package size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>{store.products_count ?? 0} Produk</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Receipt size={13} color="#71717a" style={styles.metricIcon} />
          <Text style={styles.metricText}>{store.transactions_count ?? 0} Nota</Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        {/* WhatsApp Button */}
        <TouchableOpacity
          style={styles.waButton}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MessageSquare size={14} color="#10b981" />
          <Text style={styles.waButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        {/* Extend Trial (only visible if trial or expired) */}
        {(isTrial || isExpired) && (
          <TouchableOpacity
            style={styles.trialButton}
            onPress={() => onExtendTrial(store)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Clock size={14} color="#fbbf24" />
            <Text style={styles.trialButtonText}>+ Trial</Text>
          </TouchableOpacity>
        )}

        {/* Activate Button */}
        <TouchableOpacity
          style={styles.activateButton}
          onPress={() => onActivate(store)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <CheckCircle2 size={14} color="#ffffff" />
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  storeIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  storeName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
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
  },
  detailSection: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 4,
  },
  expiryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#34d399',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: 2,
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
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
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
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#27272a',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 44,
    flex: 1,
  },
  waButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    minHeight: 44,
    flex: 0.8,
  },
  trialButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#fbbf24',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 44,
    flex: 1.3,
  },
  activateButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
