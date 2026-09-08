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
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { getDefaultBaseUrl } from '../services/api';
import RegisterStoreModal from '../components/auth/RegisterStoreModal';

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
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

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

      const defaultUrl = getDefaultBaseUrl();
      if (saved && !saved.includes('192.168.1.5') && (!saved.includes('10.0.2.2') || defaultUrl.includes('10.0.2.2'))) {
        setApiUrl(saved);
      } else {
        setApiUrl(defaultUrl);
        storage.setApiUrl(defaultUrl);
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

          {/* Register Store Action Card */}
          <View style={styles.registerDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerCard}
            onPress={() => setRegisterModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.registerCardTitle}>Buka Toko Baru (Gratis 14 Hari)</Text>
              <Text style={styles.registerCardSubtitle}>Daftar mandiri • Langsung aktif siap jualan</Text>
            </View>
            <ChevronRight size={18} color="#fb7185" style={{ flexShrink: 0, marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Register Store Modal */}
        <RegisterStoreModal
          visible={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          apiUrl={apiUrl}
        />
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
  registerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#27272a',
  },
  dividerText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  registerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  registerCardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#fb7185',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  registerCardSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 2,
  },
});
