import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Store,
  Mail,
  Lock,
  LogIn,
  Settings,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { getDefaultBaseUrl } from '../services/api';

// Disable layout property transitions on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'prevent-layout-transitions-login';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      *, *::before, *::after {
        transition-property: opacity, transform, background-color, border-color, color, box-shadow !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(getDefaultBaseUrl());
  const [showConfig, setShowConfig] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    storage.getApiUrl().then((saved) => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const host = window.location.hostname || 'localhost';
        if ((host === 'localhost' || host === '127.0.0.1') && (!saved || saved.includes('192.168.'))) {
          const webUrl = `http://${host}:8000/api`;
          setApiUrl(webUrl);
          storage.setApiUrl(webUrl);
          return;
        }
      }

      if (saved && !saved.includes('192.168.1.5')) {
        setApiUrl(saved);
      } else {
        const fallback = getDefaultBaseUrl();
        setApiUrl(fallback);
        storage.setApiUrl(fallback);
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Harap isi email dan kata sandi.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await login(email, password, apiUrl || null);
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  const fillDemo = (type) => {
    if (type === 'owner') {
      setEmail('owner@kasirkita.com');
      setPassword('password123');
    } else {
      setEmail('kasir@kasirkita.com');
      setPassword('password123');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Icon & Title Lockup */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.iconBox}>
              <Store size={22} color="#ffffff" />
            </View>
            <Text style={styles.title}>KasirKita</Text>
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>POS</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Aplikasi Kasir Mobile UMKM</Text>
        </View>

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#fb7185" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form Inputs */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Akun</Text>
            <View style={styles.inputRow}>
              <Mail size={16} color="#a1a1aa" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                placeholderTextColor="#71717a"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kata Sandi</Text>
            <View style={styles.inputRow}>
              <Lock size={16} color="#a1a1aa" style={{ marginRight: 10, flexShrink: 0 }} />
              <TextInput
                style={[styles.input, { flex: 1, minWidth: 0 }]}
                placeholder="••••••••"
                placeholderTextColor="#71717a"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#a1a1aa" />
                ) : (
                  <Eye size={18} color="#a1a1aa" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Config URL Toggle */}
          <TouchableOpacity onPress={() => setShowConfig(!showConfig)} style={styles.configToggle}>
            <Settings size={14} color="#d4d4d8" />
            <Text style={styles.configToggleText}>
              {showConfig ? 'Sembunyikan Pengaturan Server' : 'Atur URL Server API'}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Base URL API Backend</Text>
              <TextInput
                style={styles.inputSingle}
                placeholder="http://192.168.1.10:8000/api"
                placeholderTextColor="#71717a"
                autoCapitalize="none"
                value={apiUrl}
                onChangeText={setApiUrl}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.buttonText}>Masuk ke Kasir Mobile</Text>
                <LogIn size={16} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo Fast Login */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Akun Demo Cepat:</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity style={styles.demoBtn} onPress={() => fillDemo('owner')}>
              <Text style={styles.demoRoleOwner}>Pemilik (Owner)</Text>
              <Text style={styles.demoDesc}>owner@kasirkita.com</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoBtn} onPress={() => fillDemo('cashier')}>
              <Text style={styles.demoRoleCashier}>Kasir Toko</Text>
              <Text style={styles.demoDesc}>kasir@kasirkita.com</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  titleBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'center',
  },
  titleBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#d4d4d8',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderColor: 'rgba(225, 29, 72, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  form: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#ffffff',
  },
  eyeBtn: {
    padding: 6,
    flexShrink: 0,
    marginLeft: 6,
  },
  inputSingle: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#ffffff',
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  configToggleText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  button: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  demoSection: {
    marginTop: 24,
  },
  demoTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  demoRoleOwner: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  demoRoleCashier: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  demoDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
});
