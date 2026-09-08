import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { ShieldCheck, RotateCcw, LogOut } from 'lucide-react-native';

export default function SuperAdminHeader({ user, onRefresh, onLogout, refreshing }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const isSpinning = useRef(false);

  useEffect(() => {
    let animationLoop;
    if (refreshing) {
      isSpinning.current = true;
      animationLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
      animationLoop.start();
    } else {
      if (animationLoop) {
        animationLoop.stop();
      }
      if (isSpinning.current) {
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          spinAnim.setValue(0);
          isSpinning.current = false;
        });
      } else {
        spinAnim.setValue(0);
      }
    }

    return () => {
      if (animationLoop) {
        animationLoop.stop();
      }
    };
  }, [refreshing, spinAnim]);

  const handlePressRefresh = () => {
    if (refreshing) return;
    isSpinning.current = true;
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      if (!refreshing) {
        spinAnim.setValue(0);
        isSpinning.current = false;
      }
    });

    if (onRefresh) {
      onRefresh();
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <View style={styles.shieldIconWrapper}>
          <ShieldCheck size={18} color="#fb7185" />
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
          style={[styles.iconButton, refreshing && styles.iconButtonSpinning]}
          onPress={handlePressRefresh}
          disabled={refreshing}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          accessibilityLabel="Segarkan data platform"
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RotateCcw size={18} color={refreshing ? '#fb7185' : '#a1a1aa'} />
          </Animated.View>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c20',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  shieldIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rootBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rootBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#fb7185',
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
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  iconButtonSpinning: {
    borderColor: 'rgba(225, 29, 72, 0.3)',
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});
