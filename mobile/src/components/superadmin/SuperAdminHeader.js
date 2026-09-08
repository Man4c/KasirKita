import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ShieldCheck, RotateCcw, LogOut } from 'lucide-react-native';

export default function SuperAdminHeader({ user, onRefresh, onLogout, refreshing }) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <View style={styles.shieldIconWrapper}>
          <ShieldCheck size={18} color="#f4f4f5" />
        </View>
        <View style={styles.titleWrapper}>
          <View style={styles.titleRow}>
            <Text style={styles.appTitle}>KasirKita Platform</Text>
            <View style={styles.rootBadge}>
              <Text style={styles.rootBadgeText}>ROOT</Text>
            </View>
          </View>
          <View style={styles.subRow}>
            <View style={styles.statusDot} />
            <Text style={styles.userSubtitle} numberOfLines={1}>
              {user?.email || 'superadmin@kasirkita.com'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRefresh}
          disabled={refreshing}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          accessibilityLabel="Segarkan data platform"
        >
          <RotateCcw size={18} color={refreshing ? '#52525b' : '#a1a1aa'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, styles.logoutButton]}
          onPress={onLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          accessibilityLabel="Keluar dari akun Superadmin"
        >
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  shieldIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rootBadge: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rootBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
    letterSpacing: 0.5,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
    flexShrink: 0,
  },
  userSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
