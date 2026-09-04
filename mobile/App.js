import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  StatusBar as StatusBarNative,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { ShoppingCart, BarChart3, Receipt, LogOut, Settings } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import PosScreen from './src/screens/PosScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { orientationService } from './src/services/orientationService';
import { storage } from './src/services/storage';

// Intercept and eliminate transition: padding injected by web safe area libraries
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function (tagName, options) {
    const el = originalCreateElement(tagName, options);
    if (tagName && tagName.toLowerCase() === 'div') {
      const originalSetProperty = el.style.setProperty.bind(el.style);
      Object.defineProperty(el.style, 'transitionProperty', {
        get() {
          return 'opacity, transform';
        },
        set(val) {
          if (val && val.includes('padding')) {
            originalSetProperty('transition-property', 'opacity, transform');
          } else {
            originalSetProperty('transition-property', val);
          }
        },
        configurable: true,
      });
    }
    return el;
  };

  const styleId = 'prevent-layout-transitions';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = originalCreateElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      html, body {
        transition: none !important;
        transition-property: none !important;
      }
      *, *::before, *::after {
        transition-property: opacity, transform, background-color, border-color, color, box-shadow !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

function MainApp() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [activeTab, setActiveTab] = useState(user?.role === 'owner' ? 'dashboard' : 'pos');
  const [portraitTab, setPortraitTab] = useState(user?.role === 'owner' ? 'dashboard' : 'pos');
  const prevIsLandscapeRef = useRef(isLandscape);
  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const insets = useSafeAreaInsets();

  // Ensure initial tab opens to Dashboard upon loading user session
  useEffect(() => {
    if (user?.role === 'owner') {
      setActiveTab('dashboard');
      setPortraitTab('dashboard');
    } else if (user) {
      setActiveTab('pos');
      setPortraitTab('pos');
    }
  }, [user?.id, user?.role]);

  // Apply saved orientation preference on app start
  useEffect(() => {
    storage.getSettings().then((saved) => {
      if (saved?.orientationPref) {
        orientationService.applyPreference(saved.orientationPref);
      }
    }).catch(() => {});
  }, []);

  // Auto-switch to Kasir POS upon rotating to landscape, restore upon rotating back to portrait
  useEffect(() => {
    if (isLandscape && !prevIsLandscapeRef.current) {
      setActiveTab('pos');
    } else if (!isLandscape && prevIsLandscapeRef.current) {
      setActiveTab(portraitTab);
    }
    prevIsLandscapeRef.current = isLandscape;
  }, [isLandscape, portraitTab]);

  const handleTabChange = (newTab) => {
    setIsCheckoutActive(false);
    const targetTab = newTab === 'Riwayat' ? 'history' : newTab;
    setActiveTab(targetTab);
    if (!isLandscape) {
      setPortraitTab(targetTab);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e11d48" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LoginScreen />
      </View>
    );
  }

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBarNative.currentHeight || 0) : 0;
  const isCompactLandscape = isLandscape && height < 440;
  const safeTopPadding = isLandscape
    ? (isCompactLandscape ? Math.max(insets.top, androidStatusHeight) : Math.max(insets.top, androidStatusHeight > 0 ? androidStatusHeight + 2 : 6))
    : Math.max(insets.top, androidStatusHeight);
  const safeLeftPadding = isLandscape ? Math.max(insets.left, isCompactLandscape ? 4 : 8) : 0;
  const safeRightPadding = isLandscape ? Math.max(insets.right, isCompactLandscape ? 4 : 8) : 0;

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: safeTopPadding,
          paddingBottom: isLandscape ? Math.max(insets.bottom, isCompactLandscape ? 2 : 4) : insets.bottom,
          paddingLeft: safeLeftPadding,
          paddingRight: safeRightPadding,
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Top Header Bar (Portrait Only - Only shown on Kasir POS screen) */}
      {!isLandscape && !isCheckoutActive && activeTab === 'pos' && (
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <Text style={styles.topBrand}>KasirKita</Text>
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>MOBILE</Text>
              </View>
            </View>
            <Text style={styles.topUser} numberOfLines={1} ellipsizeMode="tail">
              {user?.name || 'Kasir'} • <Text style={{ textTransform: 'capitalize' }}>{user?.role}</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
              <LogOut size={13} color="#fb7185" />
              <Text style={styles.logoutText}>Keluar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Screen Body */}
      <View style={styles.body}>
        {isLandscape ? (
          <PosScreen
            isLandscape={true}
            isCompactLandscape={isCompactLandscape}
            onCheckoutStateChange={setIsCheckoutActive}
            onSwitchToPortrait={() => {
              setActiveTab('pos');
              setPortraitTab('pos');
            }}
          />
        ) : activeTab === 'dashboard' && user?.role === 'owner' ? (
          <DashboardScreen
            isLandscape={false}
            navigation={{ navigate: handleTabChange }}
          />
        ) : activeTab === 'history' ? (
          <TransactionHistoryScreen isLandscape={false} />
        ) : activeTab === 'settings' ? (
          <SettingsScreen isLandscape={false} />
        ) : (
          <PosScreen
            isLandscape={false}
            isCompactLandscape={false}
            onCheckoutStateChange={setIsCheckoutActive}
          />
        )}
      </View>

      {/* Bottom Navigation Bar (Hidden in Landscape to give full height to Kasir Terminal) */}
      {!isLandscape && (
        <View style={[styles.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* 1. Dashboard (Owner Only) */}
          {user?.role === 'owner' && (
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => handleTabChange('dashboard')}
            >
              <View style={[styles.navIconPill, activeTab === 'dashboard' && styles.navIconPillActive]}>
                <BarChart3
                  size={20}
                  color={activeTab === 'dashboard' ? '#fb7185' : '#71717a'}
                />
              </View>
              <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]} numberOfLines={1}>
                Dashboard
              </Text>
            </TouchableOpacity>
          )}

          {/* 2. Kasir POS */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => handleTabChange('pos')}
          >
            <View style={[styles.navIconPill, activeTab === 'pos' && styles.navIconPillActive]}>
              <ShoppingCart
                size={20}
                color={activeTab === 'pos' ? '#fb7185' : '#71717a'}
              />
            </View>
            <Text style={[styles.navText, activeTab === 'pos' && styles.navTextActive]} numberOfLines={1}>
              Kasir POS
            </Text>
          </TouchableOpacity>

          {/* 3. Riwayat Transaksi */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => handleTabChange('history')}
          >
            <View style={[styles.navIconPill, activeTab === 'history' && styles.navIconPillActive]}>
              <Receipt
                size={20}
                color={activeTab === 'history' ? '#fb7185' : '#71717a'}
              />
            </View>
            <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]} numberOfLines={1}>
              Riwayat
            </Text>
          </TouchableOpacity>

          {/* 4. Pengaturan */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => handleTabChange('settings')}
          >
            <View style={[styles.navIconPill, activeTab === 'settings' && styles.navIconPillActive]}>
              <Settings
                size={20}
                color={activeTab === 'settings' ? '#fb7185' : '#71717a'}
              />
            </View>
            <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]} numberOfLines={1}>
              Pengaturan
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e11d48" size="large" />
      </View>
    );
  }

  const webMetrics = Platform.OS === 'web' ? {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  } : undefined;

  return (
    <SafeAreaProvider initialMetrics={webMetrics}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  center: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: '#27272a',
    borderBottomWidth: 1,
    backgroundColor: '#18181b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBrand: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  topBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'center',
  },
  topBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  topUser: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    flexShrink: 0,
  },
  logoutText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  topBarLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderBottomColor: '#27272a',
    borderBottomWidth: 1,
  },
  topBarCompactLandscape: {
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  headerRight: {
    flexShrink: 0,
  },
  topBrandLandscape: {
    fontSize: 16,
  },
  topBrandCompact: {
    fontSize: 14,
  },
  topBadgeLandscape: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  topBadgeTextLandscape: {
    fontSize: 12,
  },
  landscapeNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    padding: 4,
    borderRadius: 10,
  },
  landscapeNavRowCompact: {
    padding: 2,
    gap: 4,
    borderRadius: 8,
  },
  landscapeTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  landscapeTabBtnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    borderRadius: 6,
  },
  landscapeTabBtnActive: {
    backgroundColor: '#e11d48',
  },
  landscapeTabText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  landscapeTabTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  landscapeUserText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    maxWidth: 120,
  },
  logoutBtnLandscape: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnCompactLandscape: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bottomNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -4px 16px rgba(0,0,0,0.45)',
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navIconPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  navIconPillActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.16)',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  navTextActive: {
    color: '#fb7185',
    fontFamily: 'Poppins_700Bold',
  },
  body: {
    flex: 1,
  },
});
