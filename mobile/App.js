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
import { ShoppingCart, BarChart3, Receipt, LogOut } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import PosScreen from './src/screens/PosScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';

// Intercept and eliminate transition: padding injected by web safe area libraries
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function(tagName, options) {
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

  const [activeTab, setActiveTab] = useState('pos');
  const [portraitTab, setPortraitTab] = useState('pos');
  const prevIsLandscapeRef = useRef(isLandscape);
  const insets = useSafeAreaInsets();

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
    setActiveTab(newTab);
    if (!isLandscape) {
      setPortraitTab(newTab);
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
  const safeTopPadding = isLandscape
    ? Math.max(insets.top, androidStatusHeight > 0 ? androidStatusHeight + 2 : 6)
    : Math.max(insets.top, androidStatusHeight);
  const safeLeftPadding = isLandscape ? Math.max(insets.left, 8) : 0;
  const safeRightPadding = isLandscape ? Math.max(insets.right, 8) : 0;

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: safeTopPadding,
          paddingBottom: isLandscape ? Math.max(insets.bottom, 4) : insets.bottom,
          paddingLeft: safeLeftPadding,
          paddingRight: safeRightPadding,
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Top Header Bar */}
      <View style={[styles.topBar, isLandscape && styles.topBarLandscape]}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Text style={[styles.topBrand, isLandscape && styles.topBrandLandscape]}>
              KasirKita
            </Text>
            <View style={[styles.topBadge, isLandscape && styles.topBadgeLandscape]}>
              <Text style={[styles.topBadgeText, isLandscape && styles.topBadgeTextLandscape]}>
                {isLandscape ? 'TERMINAL POS' : 'MOBILE'}
              </Text>
            </View>
          </View>
          {!isLandscape && (
            <Text style={styles.topUser}>
              {user?.name || 'Kasir'} • <Text style={{ textTransform: 'capitalize' }}>{user?.role}</Text>
            </Text>
          )}
        </View>

        {/* Compact quick switcher in landscape */}
        {isLandscape && (
          <View style={styles.landscapeNavRow}>
            <TouchableOpacity
              style={[styles.landscapeTabBtn, activeTab === 'pos' && styles.landscapeTabBtnActive]}
              onPress={() => handleTabChange('pos')}
            >
              <ShoppingCart size={13} color={activeTab === 'pos' ? '#ffffff' : '#a1a1aa'} />
              <Text style={[styles.landscapeTabText, activeTab === 'pos' && styles.landscapeTabTextActive]}>
                Kasir
              </Text>
            </TouchableOpacity>

            {user?.role === 'owner' && (
              <TouchableOpacity
                style={[styles.landscapeTabBtn, activeTab === 'dashboard' && styles.landscapeTabBtnActive]}
                onPress={() => handleTabChange('dashboard')}
              >
                <BarChart3 size={13} color={activeTab === 'dashboard' ? '#ffffff' : '#a1a1aa'} />
                <Text style={[styles.landscapeTabText, activeTab === 'dashboard' && styles.landscapeTabTextActive]}>
                  Laporan
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.landscapeTabBtn, activeTab === 'history' && styles.landscapeTabBtnActive]}
              onPress={() => handleTabChange('history')}
            >
              <Receipt size={13} color={activeTab === 'history' ? '#ffffff' : '#a1a1aa'} />
              <Text style={[styles.landscapeTabText, activeTab === 'history' && styles.landscapeTabTextActive]}>
                Riwayat
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRight}>
          {isLandscape && (
            <Text style={styles.landscapeUserText} numberOfLines={1}>
              {user?.name || 'Kasir'}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.logoutBtn, isLandscape && styles.logoutBtnLandscape]}
            onPress={logout}
          >
            <LogOut size={13} color="#fb7185" />
            {!isLandscape && <Text style={styles.logoutText}>Keluar</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === 'dashboard' && user?.role === 'owner' ? (
          <DashboardScreen isLandscape={isLandscape} />
        ) : activeTab === 'history' ? (
          <TransactionHistoryScreen isLandscape={isLandscape} />
        ) : (
          <PosScreen isLandscape={isLandscape} />
        )}
      </View>

      {/* Bottom Navigation Bar (Hidden in Landscape to give full height to Kasir Terminal) */}
      {!isLandscape && (
        <View style={[styles.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {/* 1. Kasir POS */}
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
            <Text style={[styles.navText, activeTab === 'pos' && styles.navTextActive]}>
              Kasir POS
            </Text>
          </TouchableOpacity>

          {/* 2. Laporan Toko (Owner Only) */}
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
              <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>
                Laporan Toko
              </Text>
            </TouchableOpacity>
          )}

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
            <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>
              Riwayat
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
    paddingVertical: 12,
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
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  topBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 7,
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
    color: '#d4d4d8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  topBarLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomColor: '#27272a',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBrandLandscape: {
    fontSize: 16,
  },
  topBadgeLandscape: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  topBadgeTextLandscape: {
    fontSize: 12,
  },
  landscapeNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27272a',
    padding: 3,
    borderRadius: 8,
  },
  landscapeTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  bottomNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 8,
    paddingHorizontal: 8,
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
    paddingVertical: 2,
  },
  navIconPill: {
    paddingVertical: 4,
    paddingHorizontal: 16,
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
    marginTop: 2,
  },
  navTextActive: {
    color: '#fb7185',
    fontFamily: 'Poppins_700Bold',
  },
  body: {
    flex: 1,
  },
});
