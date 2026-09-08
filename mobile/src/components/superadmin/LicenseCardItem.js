import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ticket, Copy, Check, Ban, CheckCircle2, Clock } from 'lucide-react-native';
import { showAlert } from '../../utils/alert.js';

export default function LicenseCardItem({ license, onRevoke }) {
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const isAvailable = license.status === 'available';
  const isRedeemed = license.status === 'redeemed';
  const isRevoked = license.status === 'revoked';

  const getDurationLabel = (type) => {
    switch (type) {
      case '1_month': return '1 Bulan';
      case '6_months': return '6 Bulan';
      case '1_year': return '1 Tahun';
      case 'lifetime': return 'Seumur Hidup';
      default: return type || 'Standar';
    }
  };

  const handleCopyOrShare = async () => {
    const textToShare = `Kode Lisensi KasirKita POS Pro (${getDurationLabel(license.duration_type)}):\n${license.license_key}\n\nMasukkan kode ini pada menu Pengaturan > Aktivasi Lisensi di aplikasi kasir Anda.`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(license.license_key).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    try {
      await Share.share({
        message: textToShare,
        title: 'Kode Lisensi KasirKita POS',
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  const executeRevoke = async () => {
    if (isRevoking) return;
    setIsRevoking(true);
    try {
      if (onRevoke) {
        await onRevoke(license.id);
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const confirmRevoke = () => {
    showAlert(
      'Cabut Voucher Lisensi',
      `Apakah Anda yakin ingin membatalkan dan mencabut voucher ${license.license_key}? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Cabut Voucher',
          style: 'destructive',
          onPress: executeRevoke,
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        isRevoked && styles.cardRevoked,
      ]}
    >
      {/* Top row: Key and Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.keyContainer}>
          <Ticket size={16} color={isAvailable ? '#fb7185' : '#71717a'} style={styles.ticketIcon} />
          <Text style={[styles.keyText, isRevoked && styles.keyTextRevoked]} numberOfLines={1}>
            {license.license_key}
          </Text>
        </View>

        {isAvailable && (
          <View style={[styles.statusBadge, styles.statusAvailable]}>
            <Clock size={12} color="#34d399" style={styles.badgeIcon} />
            <Text style={[styles.statusText, { color: '#34d399' }]}>TERSEDIA</Text>
          </View>
        )}

        {isRedeemed && (
          <View style={[styles.statusBadge, styles.statusRedeemed]}>
            <CheckCircle2 size={12} color="#a1a1aa" style={styles.badgeIcon} />
            <Text style={[styles.statusText, { color: '#d4d4d8' }]}>TERPAKAI</Text>
          </View>
        )}

        {isRevoked && (
          <View style={[styles.statusBadge, styles.statusRevoked]}>
            <Ban size={12} color="#fb7185" style={styles.badgeIcon} />
            <Text style={[styles.statusText, { color: '#fb7185' }]}>DICABUT</Text>
          </View>
        )}
      </View>

      {/* Middle row: Duration & Details */}
      <View style={styles.detailsRow}>
        <Text style={styles.durationText}>
          Paket: <Text style={styles.durationValue}>{getDurationLabel(license.duration_type)}</Text>
        </Text>

        {license.notes ? (
          <Text style={styles.notesText}>
            {license.notes}
          </Text>
        ) : null}
      </View>

      {/* Redeem Information if already used (Zero Truncation - Full Info Always Visible!) */}
      {isRedeemed && (
        <View style={styles.redeemInfoRow}>
          <Text style={styles.redeemInfoText}>
            Digunakan oleh: <Text style={styles.redeemStoreName}>{license.redeemed_by_store?.name || 'Toko Mitra'}</Text>
            {license.redeemed_at && (
              <Text style={styles.redeemDateText}> • {license.redeemed_at.substring(0, 10)}</Text>
            )}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
          onPress={handleCopyOrShare}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {copied ? (
            <>
              <Check size={14} color="#34d399" />
              <Text style={[styles.copyBtnText, { color: '#34d399' }]}>Tersalin!</Text>
            </>
          ) : (
            <>
              <Copy size={14} color="#a1a1aa" />
              <Text style={styles.copyBtnText}>Salin / Kirim Kode</Text>
            </>
          )}
        </TouchableOpacity>

        {isAvailable && (
          <TouchableOpacity
            style={[styles.revokeBtn, isRevoking && styles.revokeBtnDisabled]}
            onPress={confirmRevoke}
            disabled={isRevoking}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel={`Cabut voucher ${license.license_key}`}
          >
            {isRevoking ? (
              <>
                <ActivityIndicator size={12} color="#fb7185" />
                <Text style={styles.revokeBtnText}>Mencabut...</Text>
              </>
            ) : (
              <>
                <Ban size={14} color="#ef4444" />
                <Text style={styles.revokeBtnText}>Cabut</Text>
              </>
            )}
          </TouchableOpacity>
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
  cardRevoked: {
    opacity: 0.6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  keyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  ticketIcon: {
    marginRight: 6,
    flexShrink: 0,
  },
  keyText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.5,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  keyTextRevoked: {
    textDecorationLine: 'line-through',
    color: '#71717a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  badgeIcon: {
    marginRight: 3,
  },
  statusAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusRedeemed: {
    backgroundColor: 'rgba(113, 113, 122, 0.15)',
  },
  statusRevoked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  durationText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  durationValue: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  notesText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  redeemInfoRow: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  redeemInfoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    lineHeight: 18,
  },
  redeemStoreName: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    includeFontPadding: false,
  },
  redeemDateText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1c1c20',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  copyBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  copyBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  revokeBtnDisabled: {
    opacity: 0.6,
  },
  revokeBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#fb7185',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
