import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
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
import { ShoppingCart, BarChart3, LogOut } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import PosScreen from './src/screens/PosScreen';
import DashboardScreen from './src/screens/DashboardScreen';

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
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' or 'dashboard'
  const insets = useSafeAreaInsets();

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

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.topBrand}>KasirKita</Text>
            <View style={styles.topBadge}>
              <Text style={styles.topBadgeText}>MOBILE</Text>
            </View>
          </View>
          <Text style={styles.topUser}>
            {user?.name || 'Kasir'} • <Text style={{ textTransform: 'capitalize' }}>{user?.role}</Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={14} color="#fb7185" />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation (Only show multi-tab if owner, or show single tab if cashier) */}
      {user?.role === 'owner' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'pos' && styles.tabItemActive]}
            onPress={() => setActiveTab('pos')}
          >
            <ShoppingCart size={15} color={activeTab === 'pos' ? '#ffffff' : '#d4d4d8'} />
            <Text style={[styles.tabText, activeTab === 'pos' && styles.tabTextActive]}>
              Kasir POS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={15} color={activeTab === 'dashboard' ? '#ffffff' : '#d4d4d8'} />
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
              Laporan Toko
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Screen Body */}
      <View style={styles.body}>
        {user?.role === 'owner' && activeTab === 'dashboard' ? (
          <DashboardScreen />
        ) : (
          <PosScreen />
        )}
      </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderBottomColor: '#27272a',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
  },
  tabItemActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  body: {
    flex: 1,
  },
});
